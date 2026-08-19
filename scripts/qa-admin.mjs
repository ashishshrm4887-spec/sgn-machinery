import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));

await page.goto("http://127.0.0.1:8080/login", { waitUntil: "networkidle" });
await page.fill("#email", "owner@sgn-machinery.test");
await page.fill("#password", "SgnAdmin99!");
await page.click("button[type=submit]");
await page.waitForURL("**/admin**", { timeout: 15000 }).catch(() => {});
console.log("admin url", page.url());

await page.goto("http://127.0.0.1:8080/admin/company", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const phoneBox = page.locator("textarea").nth(3);
await phoneBox.fill("7009950622\n7809099995\n9999911111");
await page.getByRole("button", { name: /save company/i }).click();
await page.waitForTimeout(1500);
console.log("company toast/text", (await page.locator("body").innerText()).includes("saved"));

await page.goto("http://127.0.0.1:8080/contact", { waitUntil: "networkidle" });
const contact = await page.locator("body").innerText();
console.log("new phone visible", contact.includes("99999 11111") || contact.includes("9999911111"));

await page.goto("http://127.0.0.1:8080/quote", { waitUntil: "networkidle" });
await page.fill("#fullName", "Test Buyer");
await page.fill("#companyName", "Test Carton Co");
await page.fill("#phone", "9876543210");
await page.fill("#message", "Please send a quotation.");
await page.getByRole("button", { name: /send quotation/i }).click();
await page.waitForTimeout(1500);
const quoteText = await page.locator("body").innerText();
console.log("quote ok", quoteText.includes("Enquiry received") || quoteText.includes("received"));

await page.goto("http://127.0.0.1:8080/admin/enquiries", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const enq = await page.locator("body").innerText();
console.log("enquiry listed", enq.includes("Test Buyer"));

await page.screenshot({ path: "/workspace/screenshots/enquiries.png" });
await browser.close();
