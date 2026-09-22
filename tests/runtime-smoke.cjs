const fs = require("fs");
const vm = require("vm");

const html = fs.readFileSync("index.html", "utf8");
const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
const landingCodes = [...html.matchAll(/data-landing="([^"]+)"/g)].map((match) => match[1]);
const makeElement = () => ({
  textContent: "", value: "", checked: false, disabled: false, innerHTML: "",
  className: "", style: {}, children: [], clientWidth: 400, clientHeight: 190,
  classList: { add() {}, remove() {}, toggle() {} },
  appendChild(child) { child.parent = this; this.children.push(child); },
  prepend(child) { child.parent = this; this.children.unshift(child); },
  get lastChild() { return this.children.at(-1); },
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this);
  },
  click() {},
  getContext() {
    return {
      setTransform() {}, clearRect() {}, beginPath() {}, moveTo() {},
      lineTo() {}, stroke() {}, fillText() {}
    };
  }
});

const elements = Object.fromEntries(ids.map((id) => [id, makeElement()]));
const landingButtons = landingCodes.map((code) => ({ ...makeElement(), dataset: { landing: code } }));
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
  querySelectorAll: (selector) => selector === "[data-landing]" ? landingButtons : [],
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
const outcomes = ["near-left", "mid-center", "out-right", "far-right", "net", "mid-left"];
for (const outcome of outcomes) {
  for (let i = 0; i < 25; i += 1) sample(1, 0);
  for (let i = 0; i < 10; i += 1) sample(i === 5 ? 3 : 1.3, 5);
  for (let i = 0; i < 15; i += 1) sample(1, 0);
  landingButtons.find((button) => button.dataset.landing === outcome).onclick();
}
if (Number(elements.sessionHitCount.textContent) !== outcomes.length) {
  throw new Error(`Expected ${outcomes.length} synthetic hits, got ${elements.sessionHitCount.textContent}`);
}
if (elements.summaryInRate.textContent === "--" || elements.summaryRelation.textContent.includes("还需")) {
  throw new Error("Session insights were not generated");
}
if (elements.coachTitle.textContent.includes("标记落点")) {
  throw new Error("Latest-shot conclusion did not react to its landing mark");
}
elements.endSession.onclick();
elements.startSession.onclick();
for (let shot = 0; shot < 3; shot += 1) {
  for (let i = 0; i < 25; i += 1) sample(1, 0);
  for (let i = 0; i < 10; i += 1) sample(i === 5 ? 3 : 1.3, 5);
  for (let i = 0; i < 15; i += 1) sample(1, 0);
}
if (!elements.summarySample.textContent.includes("0 次已标记") || elements.summaryInRate.textContent !== "--") {
  throw new Error("Unmarked strokes were incorrectly treated as landing results");
}
if (!elements.summaryPattern.textContent.includes("从动作看") || !elements.summaryRelation.textContent.includes("还没有标落点")) {
  throw new Error("Motion-only session insights were not generated");
}
if (!elements.coachReliability.textContent.includes("只看动作")) {
  throw new Error("Unmarked latest-shot conclusion was not labelled motion-only");
}
console.log(`Runtime smoke OK: ${ids.length} elements, marked conclusions, and unmarked motion-only insights`);
