import SwiftUI
import WebKit
import CoreMotion

final class MotionBridge: NSObject, ObservableObject, WKNavigationDelegate {
    @Published var status = "正在加载网页"
    @Published var isStreaming = false
    @Published var isPageReady = false

    let webView: WKWebView

    private let motionManager = CMHeadphoneMotionManager()
    private let motionQueue: OperationQueue = {
        let queue = OperationQueue()
        queue.name = "AirSwing.HeadphoneMotion"
        queue.qualityOfService = .userInteractive
        queue.maxConcurrentOperationCount = 1
        return queue
    }()

    private var injectionPending = false
    private var lastInjectionTime: TimeInterval = 0
    private let minimumInjectionInterval: TimeInterval = 1.0 / 50.0

    override init() {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        webView = WKWebView(frame: .zero, configuration: configuration)
        super.init()
        webView.navigationDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = .black
    }

    func loadDashboard() {
        guard let url = Bundle.main.url(
            forResource: "index",
            withExtension: "html",
            subdirectory: "Web"
        ) else {
            status = "找不到内置仪表盘"
            isPageReady = false
            return
        }

        isPageReady = false
        status = "正在加载离线仪表盘"
        webView.loadFileURL(
            url,
            allowingReadAccessTo: url.deletingLastPathComponent()
        )
    }

    func toggleStreaming() {
        isStreaming ? stopStreaming() : startStreaming()
    }

    func startStreaming() {
        guard isPageReady else {
            status = "请先等待网页加载完成"
            return
        }

        guard motionManager.isDeviceMotionAvailable else {
            status = "未检测到支持运动数据的 AirPods"
            return
        }

        motionManager.startDeviceMotionUpdates(to: motionQueue) { [weak self] motion, error in
            guard let self else { return }

            if let error {
                DispatchQueue.main.async {
                    self.status = "传感器错误：\(error.localizedDescription)"
                    self.isStreaming = false
                }
                return
            }

            guard let motion else { return }
            DispatchQueue.main.async {
                self.inject(motion)
            }
        }

        isStreaming = true
        status = "AirPods 数据传输中"
    }

    func stopStreaming() {
        motionManager.stopDeviceMotionUpdates()
        isStreaming = false
        status = isPageReady ? "已暂停传感器" : "仪表盘未加载"
    }

    private func inject(_ motion: CMDeviceMotion) {
        let now = ProcessInfo.processInfo.systemUptime
        guard isPageReady,
              !injectionPending,
              now - lastInjectionTime >= minimumInjectionInterval else { return }

        let values = [
            motion.userAcceleration.x + motion.gravity.x,
            motion.userAcceleration.y + motion.gravity.y,
            motion.userAcceleration.z + motion.gravity.z,
            motion.rotationRate.x,
            motion.rotationRate.y,
            motion.rotationRate.z,
            motion.gravity.x,
            motion.gravity.y,
            motion.gravity.z,
            motion.attitude.quaternion.x,
            motion.attitude.quaternion.y,
            motion.attitude.quaternion.z,
            motion.attitude.quaternion.w
        ]
        guard values.allSatisfy(\.isFinite) else { return }

        let arguments = values.map { String($0) }.joined(separator: ",")
        let script = "window.onSensorData && window.onSensorData(\(arguments));"

        lastInjectionTime = now
        injectionPending = true
        webView.evaluateJavaScript(script) { [weak self] _, error in
            guard let self else { return }
            self.injectionPending = false
            if let error {
                self.status = "数据注入失败：\(error.localizedDescription)"
            }
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        isPageReady = true
        status = "离线版 v1.1 已就绪 · 13 项运动数据"
    }

    func webView(
        _ webView: WKWebView,
        didFail navigation: WKNavigation!,
        withError error: Error
    ) {
        reportNavigationError(error)
    }

    func webView(
        _ webView: WKWebView,
        didFailProvisionalNavigation navigation: WKNavigation!,
        withError error: Error
    ) {
        reportNavigationError(error)
    }

    private func reportNavigationError(_ error: Error) {
        isPageReady = false
        status = "仪表盘加载失败：\(error.localizedDescription)"
    }
}

struct DashboardWebView: UIViewRepresentable {
    let webView: WKWebView

    func makeUIView(context: Context) -> WKWebView {
        webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

struct ContentView: View {
    @StateObject private var bridge = MotionBridge()

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Circle()
                    .fill(bridge.isStreaming ? Color.green : Color.orange)
                    .frame(width: 9, height: 9)

                Text(bridge.status)
                    .font(.system(size: 14, weight: .medium))
                    .lineLimit(1)

                Spacer()

                Button {
                    bridge.loadDashboard()
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .buttonStyle(.bordered)
                .help("重新加载网页")

                Button(bridge.isStreaming ? "停止" : "开始传感器") {
                    bridge.toggleStreaming()
                }
                .buttonStyle(.borderedProminent)
                .disabled(!bridge.isPageReady)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(Color(uiColor: .secondarySystemBackground))

            DashboardWebView(webView: bridge.webView)
                .ignoresSafeArea(edges: .bottom)
        }
        .onAppear {
            bridge.loadDashboard()
        }
    }
}
