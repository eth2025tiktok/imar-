import express from "express";
import cors from "cors";
import { chromium } from "playwright";

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

/**
 * POST /imar
 * body:
 * {
 *   "ada": "10568",
 *   "parsel": "9"
 * }
 */
app.post("/imar", async (req, res) => {
  const { ada, parsel } = req.body;

  if (!ada || !parsel) {
    return res.status(400).json({ error: "ada ve parsel zorunlu" });
  }

  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 }
    });

    const page = await context.newPage();

    // 1️⃣ KEOS aç
    await page.goto(
      "https://keos.seyhan.bel.tr:4443/keos/",
      { waitUntil: "networkidle", timeout: 60000 }
    );

    // 2️⃣ Sol panel arama aç (ikon)
    await page.waitForTimeout(3000);

    // ⚠️ Selector'lar KEOS DOM'una göre örnek
    // Gerekirse küçük düzeltme yaparız
    await page.click("button[title*='Ara'], .nc-search-button");

    // 3️⃣ Ada / Parsel seç
    await page.waitForSelector("input", { timeout: 15000 });

    // Ada
    await page.fill("input[placeholder*='Ada']", ada);

    // Parsel
    await page.fill("input[placeholder*='Parsel']", parsel);

    // 4️⃣ Ara
    await page.click("button:has-text('Ara')");

    // 5️⃣ Sonuç yüklenmesini bekle
    await page.waitForTimeout(4000);

    // 6️⃣ E-İmar butonuna tıkla
    await page.click("button:has-text('E-İmar'), a:has-text('E-İmar')");

    // 7️⃣ Bilgi paneli açılmasını bekle
    await page.waitForTimeout(3000);

    // 8️⃣ Panelden veri oku (örnek)
    const data = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("table tr"));
      const result = {};
      rows.forEach(r => {
        const cols = r.querySelectorAll("td");
        if (cols.length === 2) {
          result[cols[0].innerText.trim()] =
            cols[1].innerText.trim();
        }
      });
      return result;
    });

    await browser.close();

    return res.json({
      success: true,
      ada,
      parsel,
      imar: data
    });

  } catch (err) {
    if (browser) await browser.close();

    console.error(err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get("/", (req, res) => {
  res.send("KEOS E-İmar Playwright Server OK");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
