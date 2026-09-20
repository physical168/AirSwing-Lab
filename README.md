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

## First Prototype Target

The web page should expose:

```js
window.onSensorData = function (accX, accY, accZ, rotX, rotY, rotZ) {
  // high-frequency IMU samples injected by the native iPad bridge
};
```

Initial detection logic:

- `totalG = Math.sqrt(accX ** 2 + accY ** 2 + accZ ** 2)`
- `totalRot = Math.abs(rotX) + Math.abs(rotY) + Math.abs(rotZ)`
- Badminton hit: `totalG > 7.0`, cooldown over `250ms`
- Table tennis hit: `totalG > 2.8 && totalRot > 3.5`, cooldown over `180ms`

Initial UI:

- High-contrast, large text for court-side visibility.
- Current mode.
- Total hit count.
- Maximum impact in g.
- Real-time wrist rotation speed.
- Audio beep and visual flash on hit detection.
- Chart.js line chart for the last 3 seconds of acceleration.

## Notes

AirPods IMU data is expected to come from Apple's native CoreMotion APIs through
an iPad bridge. Pure browser, Android, Windows, or virtualized macOS access to
the private AirPods motion stream is not part of the first prototype.
