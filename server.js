import express from "express";
import cors from "cors";
import { chromium } from "playwright";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/imar", async (req, res) => {
  const { ilce, ada, parsel } = req.body;

  if (!ilce || !ada || !parsel) {
    return res.status(400).json({ error: "ilce, ada, parsel zorunlu" });
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto("https://eplan.ibb.istanbul/sorgu/plansorgu", {
      waitUntil: "networkidle"
    });

    // İlçe dropdown
    await page.click("mat-select");
    await page.click(`mat-option >> text=${ilce}`);

    // Ada / Parsel
    await page.fill("input[formcontrolname='ada']", ada.toString());
    await page.fill("input[formcontrolname='parsel']", parsel.toString());

    // Ara
    await page.click("button >> text=Ara");

    // Sonuç bekle
    await page.waitForTimeout(5000);

    const text = await page.evaluate(() => document.body.innerText);

    res.json({
      success: true,
      ilce,
      ada,
      parsel,
      raw: text
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  } finally {
    if (browser) await browser.close();
  }
});

app.get("/", (req, res) => {
  res.send("Istanbul e-İmar API çalışıyor");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});    });

    await page.goto(
      "https://eplan.ibb.istanbul/sorgu/plansorgu",
      { waitUntil: "networkidle", timeout: 60000 }
    );

    // KVKK / popup çıkarsa kapat
    await page.waitForTimeout(3000);
    const kvkkBtn = await page.$("button:has-text('Kabul'), button:has-text('Onay')");
    if (kvkkBtn) await kvkkBtn.click();

    // Ada/Parsel arama alanları (İBB e-Plan)
    await page.waitForSelector("input", { timeout: 20000 });

    await page.fill("input[placeholder*='Ada']", ada);
    await page.fill("input[placeholder*='Parsel']", parsel);

    await page.click("button:has-text('Sorgula'), button:has-text('Ara')");
    await page.waitForTimeout(5000);

    // Sağ panelde görünen plan/imar metinlerini oku
    const result = await page.evaluate(() => {
      const text = document.body.innerText;
      return text
        .split("\n")
        .map(t => t.trim())
        .filter(t => t.includes("TAKS") || t.includes("KAKS") || t.includes("Emsal") || t.includes("Plan"));
    });

    await browser.close();

    res.json({
      success: true,
      ada,
      parsel,
      data: result
    });

  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on " + PORT);
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
