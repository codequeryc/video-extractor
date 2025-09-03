import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    let videoUrl = null;

    await page.goto(url, { waitUntil: "domcontentloaded" });

    // wait for iframe
    await delay(3000);
    const frames = page.frames();

    for (const frame of frames) {
      try {
        const playBtn = await frame.$("#player-button");
        if (playBtn) {
          await playBtn.click();
          console.log("Clicked play inside iframe");
        }

        await delay(5000);

        // try to get video src
        const video = await frame.$("video");
        if (video) {
          videoUrl = await frame.$eval("video", el => el.src || null);
        }
      } catch (e) {
        // skip inaccessible frames
      }
    }

    // sniff network requests for m3u8/mp4
    page.on("request", req => {
      const rurl = req.url();
      if (rurl.includes(".m3u8") || rurl.includes(".mp4")) {
        videoUrl = rurl;
      }
    });

    await delay(8000);

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
