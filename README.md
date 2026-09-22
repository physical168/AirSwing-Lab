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
- Per-stroke preparation-to-contact rotation, axial wrist rotation, backswing,
  follow-through, return-to-ready, peak-speed timing, and detection confidence.
- Estimated racket-head speed, pre-contact acceleration, follow-through
  deceleration, and forward/lateral speed components using an adjustable
  effective rotation radius (20 cm by default).
- Gyroscope and linear-acceleration bias correction, a calibrated motion noise
  floor, and optional automatic hit thresholds.
- Session history, landing-zone marking, and JSON/CSV exports.
- A responsive high-contrast UI with live acceleration, rotation, and face
  angle charts.
- A hybrid iPad shell that loads the LAN dashboard and keeps an offline copy.

## Derived Insights

The dashboard keeps raw measurements separate from derived conclusions. After
each landing is marked, it combines face orientation, swing direction, vertical
path, and result to suggest the most likely adjustment for the next stroke.

For a session, it derives marked-ball in-rate, return-to-ready rate, detection
confidence, and an internal repeatability score from angle, direction, and
estimated speed variation. With at least six marked strokes it also reports the
strongest personal association between face/path measurements and landing
location. These associations are descriptive and must not be read as proof of
causation.

## Calibration Order

Keep the AirPod fixed to the racket handle cap throughout calibration and play.

1. Rest the racket forehand-side up for three seconds to measure sensor bias.
2. Rest it forehand-side up for the face reference.
3. Rest it backhand-side up for the opposite face reference.
4. Hold it vertical, handle down and forehand face toward the net.
5. Lay it forehand-side up with the racket head pointing along the table
   centerline toward the net.
6. Hold the player's normal ready pose for the personal pose reference.

The speed values are rotational estimates (`angular velocity x effective
radius`), not measured ball speed or full 3D racket translation. Detection
confidence describes how strongly a candidate matches the IMU hit signature;
it is not a score for stroke quality.

## Notes

AirPods IMU data is expected to come from Apple's native CoreMotion APIs through
an iPad bridge. Pure browser, Android, Windows, or virtualized macOS access to
the private AirPods motion stream is not part of the first prototype.
