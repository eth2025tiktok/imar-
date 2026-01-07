import express from "express";
import { chromium } from "playwright";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Sağlık kontrolü
app.get("/", (req, res) => {
  res.send("OK - Playwright KEOS Server Running");
});

app.post("/imar", async (req, res) => {
  const { il, ilce, mahalle, ada, parsel } = req.body;

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
    });

    console.log(">>> KEOS sayfası açılıyor");

    await page.goto("https://keos.seyhan.bel.tr:4443/keos/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // ⬇️ KRİTİK: HTML dump (selector çıkarmak için)
    console.log("===== PAGE HTML START =====");
    console.log(await page.content());
    console.log("===== PAGE HTML END =====");

    // Şimdilik sadece sayfa açıldığını dönüyoruz
    res.json({
      success: true,
      message: "KEOS sayfası açıldı, HTML loglara basıldı",
      input: { il, ilce, mahalle, ada, parsel },
    });
  } catch (err) {
    console.error("❌ HATA:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
