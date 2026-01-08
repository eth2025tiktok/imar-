import express from "express";
import { chromium } from "playwright";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("KEOS Playwright backend is running");
});

app.post("/imar", async (req, res) => {
  const { ada, parsel } = req.body;

  if (!ada || !parsel) {
    return res.status(400).json({
      success: false,
      message: "ada ve parsel zorunlu"
    });
  }

  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 }
    });

    await page.goto(
      "https://keos.seyhan.bel.tr:4443/imardurumu/#",
      { waitUntil: "domcontentloaded", timeout: 60000 }
    );

    await page.waitForSelector("#txtAdaParsel", { timeout: 20000 });
    await page.fill("#txtAdaParsel", `${ada}/${parsel}`);

    await page.click("#btnSearchAdaParsel");

    await page.waitForSelector("a.list-group-item", { timeout: 20000 });
    await page.click("a.list-group-item");

    await page.waitForSelector("#btnAdaParsel", { timeout: 20000 });
    await page.click("#btnAdaParsel");

    await page.waitForTimeout(4000);

    const text = await page.evaluate(() => document.body.innerText);

    await browser.close();

    res.json({
      success: true,
      ada,
      parsel,
      preview: text.slice(0, 4000)
    });

  } catch (err) {
    if (browser) await browser.close();

    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});    // 7️⃣ SONUÇ YÜKLENMESİ
    await page.waitForTimeout(4000);

    const text = await page.evaluate(() => {
      return document.body.innerText;
    });

    await browser.close();

    return res.json({
      success: true,
      ada,
      parsel,
      preview: text.slice(0, 4000)
    });

  } catch (err) {
    if (browser) await browser.close();

    console.error("HATA:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/**
 * 🔴 PORT MUTLAKA process.env.PORT
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
