import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL required" });
  }

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // Play button click simulate karna (agar selector pata ho)
    try {
      await page.click("button.play"); // apne selector ke hisaab se change karo
      await page.waitForTimeout(3000); // thoda wait karo source load hone tak
    } catch {}

    // Source nikalna
    const source = await page.evaluate(() => {
      const el = document.querySelector("video source");
      return el ? el.src : null;
    });

    await browser.close();

    if (source) {
      res.status(200).json({ source });
    } else {
      res.status(404).json({ error: "Source not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
