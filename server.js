import express from "express";
import { chromium } from "playwright";

const app = express();
app.use(express.json());

app.post("/imar", async (req, res) => {
  const data = req.body;

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  try {
    await page.goto("https://cbs.adana.bel.tr/imar", {
      waitUntil: "networkidle",
      timeout: 60000
    });

    // DEBUG (ilk sefer için)
    console.log(await page.content());

    // İlçe
    await page.waitForSelector('select');
    await page.selectOption(
      'select[name*="ilce"], select[id*="ilce"]',
      { label: data.ilce }
    );

    // Mahalle
    await page.waitForTimeout(2000);
    await page.selectOption(
      'select[name*="mahalle"], select[id*="mahalle"]',
      { label: data.mahalle }
    );

    // Ada
    await page.fill(
      'input[name*="ada"], input[id*="ada"]',
      data.ada
    );

    // Parsel
    await page.fill(
      'input[name*="parsel"], input[id*="parsel"]',
      data.parsel
    );

    // Sorgula butonu
    await page.click('button:has-text("Sorgula"), button:has-text("Getir")');

    await page.waitForTimeout(3000);

    const resultText = await page.textContent("body");

    await browser.close();

    res.json({
      success: true,
      result: resultText
    });

  } catch (err) {
    await browser.close();
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
