import express from "express";
import { chromium } from "playwright";

const app = express();
app.use(express.json());

app.post("/imar", async (req, res) => {
  const { ada, parsel } = req.body;

  if (!ada || !parsel) {
    return res.status(400).json({ error: "ada ve parsel zorunlu" });
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
    });

    console.log("KEOS açılıyor...");
    await page.goto("https://keos.seyhan.bel.tr:4443/keos/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Haritanın ve sol panelin gelmesini bekle
    await page.waitForTimeout(8000);

    console.log("Arama alanı tıklanıyor...");
    await page.keyboard.press("Control+f");
    await page.waitForTimeout(1000);

    // Sol arama inputuna tıkla (harita SDK olduğu için klavye ile)
    await page.keyboard.type(`${ada}/${parsel}`, { delay: 120 });
    await page.waitForTimeout(3000);
    await page.keyboard.press("Enter");

    console.log("Sonuç bekleniyor...");
    await page.waitForTimeout(6000);

    console.log("E-İmar tıklanıyor...");
    await page.getByText("E-İmar", { exact: false }).first().click();

    // İmar sayfasının açılmasını bekle
    await page.waitForLoadState("networkidle", { timeout: 60000 });
    await page.waitForTimeout(5000);

    const html = await page.content();

    await browser.close();

    return res.json({
      success: true,
      ada,
      parsel,
      html, // burada TAKS / KAKS vs parse edeceğiz
    });
  } catch (err) {
    if (browser) await browser.close();
    console.error(err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.get("/", (_, res) => res.send("KEOS Playwright backend çalışıyor"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server ${PORT} portunda ayakta`)
);
