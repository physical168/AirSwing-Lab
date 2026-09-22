const fs = require("fs");
const vm = require("vm");

const html = fs.readFileSync("index.html", "utf8");
const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
const makeElement = () => ({
  textContent: "", value: "", checked: false, disabled: false, innerHTML: "",
  className: "", style: {}, children: [], clientWidth: 400, clientHeight: 190,
  classList: { add() {}, remove() {}, toggle() {} },
  appendChild(child) { this.children.push(child); },
  prepend(child) { this.children.unshift(child); },
  remove() {}, click() {},
  getContext() {
    return {
      setTransform() {}, clearRect() {}, beginPath() {}, moveTo() {},
      lineTo() {}, stroke() {}, fillText() {}
    };
  }
});

const elements = Object.fromEntries(ids.map((id) => [id, makeElement()]));
let now = 0;
const calibration = {
  zero: { rotBias: [0, 0, 0], accBias: [0, 0, 0], rotNoise: 0.01, accNoise: 0.01 },
  front: { gravity: [0, 0, -1], quaternion: [0, 0, 0, 1] },
  back: { gravity: [0, 0, 1], quaternion: [1, 0, 0, 0] },
  vertical: { gravity: [0, -1, 0], quaternion: [0, 0, 0, 1] },
  table: { gravity: [0, 0, -1], quaternion: [0, 0, 0, 1] },
  ready: { gravity: [0, 0, -1], quaternion: [0, 0, 0, 1] }
};
const stored = {
  "airswing-angle-cal-v1": JSON.stringify(calibration),
  "airswing-angle-config-v1": JSON.stringify({
    target: -10, tolerance: 8, gThreshold: 2.2, rotThreshold: 3.5,
    autoThreshold: false, headRadiusCm: 20
  })
};
const document = {
  getElementById: (id) => elements[id],
  querySelectorAll: () => [],
  createElement: makeElement,
  body: makeElement()
};
const window = { addEventListener() {}, devicePixelRatio: 1 };
const sandbox = {
  document,
  window,
  localStorage: { getItem: (key) => stored[key] || null, setItem(key, value) { stored[key] = value; } },
  URL: { createObjectURL: () => "", revokeObjectURL() {} },
  Blob,
  performance: { now: () => now },
  setInterval: () => 0,
  setTimeout: () => 0,
  console,
  Math,
  Date,
  JSON
};

vm.runInNewContext(fs.readFileSync("detector.js", "utf8"), sandbox);
if (typeof window.onSensorData !== "function") {
  throw new Error("window.onSensorData was not registered");
}
window.onSensorData(0, 0, -1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 1);
elements.startSession.onclick();
const sample = (acceleration, rotation) => {
  now += 20;
  window.onSensorData(0, 0, -acceleration, 0, rotation, 0, 0, 0, -1, 0, 0, 0, 1);
};
for (let i = 0; i < 25; i += 1) sample(1, 0);
for (let i = 0; i < 10; i += 1) sample(i === 5 ? 3 : 1.3, 5);
for (let i = 0; i < 15; i += 1) sample(1, 0);
if (elements.hitTable.children.length !== 1) {
  throw new Error(`Expected one synthetic hit, got ${elements.hitTable.children.length}`);
}
console.log(`Runtime smoke OK: ${ids.length} elements, sensor input, and one synthetic hit`);
