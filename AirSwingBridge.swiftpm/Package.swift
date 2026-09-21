// swift-tools-version: 5.9

import PackageDescription
import AppleProductTypes

let package = Package(
    name: "AirSwing Lab Offline",
    platforms: [.iOS("17.0")],
    products: [
        .iOSApplication(
            name: "AirSwing Lab Offline",
            targets: ["AppModule"],
            bundleIdentifier: "com.physical168.airswing.offline",
            displayVersion: "1.1",
            bundleVersion: "2",
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
                )
            ],
            additionalInfoPlistContentFilePath: "Info.plist"
        )
    ],
    targets: [
        .executableTarget(
            name: "AppModule",
            path: "Sources/AppModule",
            resources: [.copy("Resources/Web")]
        )
    ]
)
