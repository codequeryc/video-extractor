import { chromium } from "playwright";

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    let videoUrl = null;

    // listen to network requests
    page.on("response", (resp) => {
      const rurl = resp.url();
      if (rurl.includes(".m3u8") || rurl.includes(".mp4")) {
        videoUrl = rurl;
      }
    });

    await page.goto(url, { waitUntil: "domcontentloaded" });

    // wait 10s to capture requests
    await page.waitForTimeout(10000);

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
