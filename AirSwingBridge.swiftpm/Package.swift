// swift-tools-version: 5.9

import PackageDescription
import AppleProductTypes

let package = Package(
    name: "AirSwing Bridge",
    platforms: [.iOS("17.0")],
    products: [
        .iOSApplication(
            name: "AirSwing Bridge",
            targets: ["AppModule"],
            bundleIdentifier: "com.physical168.airswing.bridge",
            displayVersion: "1.0",
            bundleVersion: "1",
            appIcon: .placeholder(icon: .running),
            accentColor: .presetColor(.green),
            supportedDeviceFamilies: [.pad],
            supportedInterfaceOrientations: [
                .portrait,
                .landscapeRight,
                .landscapeLeft,
                .portraitUpsideDown(.when(deviceFamilies: [.pad]))
            ],
            capabilities: [
                .motion(
                    purposeString: "AirSwing reads AirPods motion data to analyse table-tennis strokes."
                ),
                .localNetwork(
                    purposeString: "AirSwing connects to the dashboard running on your local computer.",
                    bonjourServiceTypes: []
                )
            ],
            additionalInfoPlistContentFilePath: "Info.plist"
        )
    ],
    targets: [
        .executableTarget(
            name: "AppModule",
            path: "Sources/AppModule"
        )
    ]
)
