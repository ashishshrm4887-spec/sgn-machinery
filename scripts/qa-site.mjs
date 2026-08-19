import { chromium } from "playwright";
import { mkdir } from "fs/promises";
await mkdir("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox"] });

async function shot(page, name) {
  await page.screenshot({ path: `/workspace/screenshots/${name}.png`, fullPage: false });
}

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await desktop.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
const logs = [];
desktop.on("pageerror", (e) => logs.push("page:" + e.message));
desktop.on("console", (m) => { if (m.type() === "error") logs.push("console:" + m.text()); });
await desktop.waitForTimeout(500);
await shot(desktop, "home-after-hydrate");
await desktop.evaluate(() => window.scrollTo(0, 900));
await desktop.waitForTimeout(300);
await shot(desktop, "home-featured");
await desktop.goto("http://127.0.0.1:8080/about", { waitUntil: "networkidle" });
await shot(desktop, "about");
await desktop.goto("http://127.0.0.1:8080/services", { waitUntil: "networkidle" });
await shot(desktop, "services");
await desktop.goto("http://127.0.0.1:8080/quote", { waitUntil: "networkidle" });
await shot(desktop, "quote");
await desktop.goto("http://127.0.0.1:8080/gallery", { waitUntil: "networkidle" });
await shot(desktop, "gallery");

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await mobile.waitForTimeout(400);
await shot(mobile, "home-mobile");
const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
console.log("mobile overflow", overflow);

await desktop.goto("http://127.0.0.1:8080/login", { waitUntil: "networkidle" });
await desktop.fill("#email", "owner@sgn-machinery.test");
await desktop.fill("#password", "SgnAdmin99!");
if (await desktop.locator("#name").count()) {
  await desktop.fill("#name", "Site Owner");
}
await desktop.click("button[type=submit]");
await desktop.waitForTimeout(2500);
await shot(desktop, "admin-after-login");
console.log("after login url", desktop.url());
console.log("after login text", (await desktop.locator("body").innerText()).slice(0, 400));
console.log("hydrate/page errors", logs);
await browser.close();
