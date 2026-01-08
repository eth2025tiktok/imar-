import express from "express";
import { chromium } from "playwright";

const app = express();
app.use(express.json());

app.post("/imar", async (req, res) => {
  const { ada, parsel } = req.body;

  if (!ada || !parsel) {
    return res.status(400).json({ error: "ada ve parsel zorunlu" });
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    // 1️⃣ KEOS İMAR SAYFASI
    await page.goto(
      "https://keos.seyhan.bel.tr:4443/imardurumu/#",
      { waitUntil: "networkidle" }
    );

    // 2️⃣ ADA / PARSEL YAZ
    await page.fill("#txtAdaParsel", `${ada}/${parsel}`);

    // 3️⃣ ARA BUTONU
    await page.click("#btnSearchAdaParsel");

    // 4️⃣ PARSEL LİSTEDE ÇIKSIN
    await page.waitForSelector("a.list-group-item", { timeout: 10000 });

    // 5️⃣ PARSELE TIKLA
    await page.click("a.list-group-item");

    // 6️⃣ İMAR DURUMU BUTONU
    await page.waitForSelector("#btnAdaParsel", { timeout: 10000 });
    await page.click("#btnAdaParsel");

    // 7️⃣ SAYFADAN BİLGİ OKU (GENEL)
    await page.waitForTimeout(3000);

    const text = await page.evaluate(() => {
      return document.body.innerText;
    });

    await browser.close();

    res.json({
      ada,
      parsel,
      rawText: text.slice(0, 4000) // çok uzunsa kesiyoruz
    });

  } catch (err) {
    await browser.close();
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
