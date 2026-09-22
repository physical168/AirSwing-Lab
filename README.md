# AirSwing Lab

AirSwing Lab is an experimental racket-motion analysis project that uses the
AirPods 6-axis IMU as an ultra-light motion sensor mounted on a badminton or
table-tennis racket handle cap.

## Concept

- Sensor: one AirPod fixed to the racket handle cap.
- Runtime bridge: iPad native shell reads AirPods motion data with CoreMotion.
- Web UI: a LAN-hosted HTML5 page receives injected sensor samples through a
  global JavaScript function.
- Development loop: the PC edits and serves the web UI; the iPad WebKit shell
  reloads the page for fast iteration.

## Current Prototype

The iPad bridge injects acceleration, rotation rate, gravity, and attitude:

```js
window.onSensorData = function (
  accX, accY, accZ,
  rotX, rotY, rotZ,
  gravityX, gravityY, gravityZ,
  quaternionX, quaternionY, quaternionZ, quaternionW
) {
  // High-frequency AirPods motion samples from the iPad bridge.
};
```

The table-tennis dashboard provides:

- Per-stroke face angle, horizontal face direction, swing-plane angle, and
  left/right swing direction estimates.
- Session history, landing-zone marking, and JSON/CSV exports.
- A responsive high-contrast UI with live acceleration, rotation, and face
  angle charts.
- A hybrid iPad shell that loads the LAN dashboard and keeps an offline copy.

## Calibration Order

Keep the AirPod fixed to the racket handle cap throughout calibration and play.

1. Rest the racket forehand-side up for three seconds to measure sensor bias.
2. Rest it forehand-side up for the face reference.
3. Rest it backhand-side up for the opposite face reference.
4. Hold it vertical, handle down and forehand face toward the net.
5. Lay it forehand-side up with the racket head pointing along the table
   centerline toward the net.
6. Hold the player's normal ready pose for the personal pose reference.

## Notes

AirPods IMU data is expected to come from Apple's native CoreMotion APIs through
an iPad bridge. Pure browser, Android, Windows, or virtualized macOS access to
the private AirPods motion stream is not part of the first prototype.
