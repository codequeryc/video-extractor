import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(), // Important for Vercel
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Optionally, agar play button ka selector pata ho to click karo:
    try {
      await page.click("button"); // selector change karna padega
      await page.waitForTimeout(4000);
    } catch {}

    // Source tag nikalna
    const source = await page.evaluate(() => {
      const el = document.querySelector("video source");
      return el ? el.src : null;
    });

    await browser.close();

    if (source) {
      return res.status(200).json({ source });
    } else {
      return res.status(404).json({ error: "No source found" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
