const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const baseUrl = process.env.AIRSWING_URL || "http://127.0.0.1:8001/";
const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "ipad", width: 1024, height: 1366 },
  { name: "mobile", width: 430, height: 932 }
];

(async () => {
  const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(edge) ? edge : undefined
  });
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400 && !response.url().endsWith("favicon.ico")) {
        errors.push(`${response.status()} ${response.url()}`);
      }
    });
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    const result = await page.evaluate(() => {
      const visible = (id) => {
        const node = document.getElementById(id);
        const rect = node?.getBoundingClientRect();
        return !!rect && rect.width > 0 && rect.height > 0;
      };
      return {
        documentOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        coachVisible: visible("coachTitle") && visible("coachAction"),
        summaryVisible: visible("summaryInRate") && visible("summaryRelation"),
        detailsVisible: visible("analysisReady") && visible("analysisConfidence")
      };
    });
    if (errors.length || result.documentOverflow || !result.coachVisible || !result.summaryVisible || !result.detailsVisible) {
      throw new Error(`${viewport.name} layout failed: ${JSON.stringify({ errors, result })}`);
    }
    await page.screenshot({
      path: path.join(".serve", `panel-${viewport.name}.png`),
      fullPage: true
    });
    await page.close();
  }
  await browser.close();
  console.log("Visual smoke OK: desktop, iPad, and mobile layouts");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
