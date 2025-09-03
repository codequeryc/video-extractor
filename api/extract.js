import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

// delay helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    let videoUrl = null;

    // 🔹 Capture all requests (look for .m3u8 or .mp4)
    page.on("request", (req) => {
      const rurl = req.url();
      if (rurl.includes(".m3u8") || rurl.includes(".mp4")) {
        videoUrl = rurl;
      }
    });

    await page.goto(url, { waitUntil: "networkidle2" });

    // 🔹 Try clicking play
    try {
      await page.click("media-play-button", { timeout: 5000 });
    } catch (e) {
      console.log("No media-play-button, maybe autoplay");
    }

    // 🔹 Wait for video element
    try {
      await page.waitForSelector("media-provider > video", { timeout: 10000 });
      if (!videoUrl) {
        videoUrl = await page.$eval("media-provider > video", (el) => el.src || null);
      }
    } catch (e) {
      console.log("Video element not found");
    }

    // 🔹 Extra time for network sniffing
    await delay(5000);

    await browser.close();

    if (videoUrl) {
      return res.json({ video: videoUrl });
    } else {
      return res.status(404).json({ error: "No video source found" });
    }
  } catch (err) {
    if (browser) await browser.close();
    return res.status(500).json({ error: err.message });
  }
}
