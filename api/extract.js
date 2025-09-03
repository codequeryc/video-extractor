import { chromium } from "@playwright/test";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle" });

    // Click play button
    await page.click("#player-button");

    // Wait for <video><source> to load
    await page.waitForSelector("video > source");

    // Extract source
    const src = await page.$eval("video > source", el => el.src);

    await browser.close();

    return res.json({ video: src });
  } catch (err) {
    await browser.close();
    return res.status(500).json({ error: err.message });
  }
}
