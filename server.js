import express from "express";
import { chromium } from "playwright";

const app = express();

/**
 * 🔴 BU SATIR OLMAZSA req.body UNDEFINED OLUR → 502
 */
app.use(express.json());

/**
 * 🔴 ROOT ENDPOINT (Cannot GET / hatasını keser)
 */
app.get("/", (req, res) => {
  res.send("KEOS Playwright backend is running");
});

/**
 * 🔵 ANA ENDPOINT
 */
app.post("/imar", async (req, res) => {
  const { ada, parsel } = req.body;

  if (!ada || !parsel) {
    return res.status(400).json({
      error: "ada ve parsel zorunlu"
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

    // 1️⃣ KEOS İMAR SAYFASI
    await page.goto(
      "https://keos.seyhan.bel.tr:4443/imardurumu/#",
      { waitUntil: "domcontentloaded", timeout: 60000 }
    );

    // 2️⃣ ADA / PARSEL GİR
    await page.waitForSelector("#txtAdaParsel", { timeout: 20000 });
    await page.fill("#txtAdaParsel", `${ada}/${parsel}`);

    // 3️⃣ ARA
    await page.click("#btnSearchAdaParsel");

    // 4️⃣ LİSTEYİ BEKLE
    await page.waitForSelector("a.list-group-item", { timeout: 20000 });

    // 5️⃣ İLK PARSELE TIKLA
    await page.click("a.list-group-item");

    // 6️⃣ İMAR DURUMU BUTONU
    await page.waitForSelector("#btnAdaParsel", { timeout: 20000 });
    await page.click("#btnAdaParsel");

    // 7️⃣ SONUÇ YÜKLENMESİ
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
