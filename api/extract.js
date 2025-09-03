import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // Click play button if exists
    try {
      await page.click("#player-button", { timeout: 5000 });
    } catch (e) {
      console.log("No play button found, maybe auto-playing...");
    }

    // Wait for video source
    await page.waitForSelector("video > source", { timeout: 10000 });

    const src = await page.$eval("video > source", el => el.src);

    await browser.close();

    return res.json({ video: src });
  } catch (err) {
    if (browser) await browser.close();
    return res.status(500).json({ error: err.message });
  }
}
