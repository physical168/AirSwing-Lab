// swift-tools-version: 5.9

import PackageDescription
import AppleProductTypes

let package = Package(
    name: "AirSwing Lab",
    platforms: [.iOS("17.0")],
    products: [
        .iOSApplication(
            name: "AirSwing Lab",
            targets: ["AppModule"],
            bundleIdentifier: "com.physical168.airswing.bridge13",
            displayVersion: "1.2",
            bundleVersion: "3",
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
                    purposeString: "AirSwing loads the training dashboard from your computer.",
                    bonjourServiceTypes: []
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
