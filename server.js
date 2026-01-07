import express from "express";
import { chromium } from "playwright";
import fs from "fs";

const app = express();
app.use(express.json());

app.post("/imar", async (req, res) => {
  const { site, data } = req.body;
  const config = JSON.parse(fs.readFileSync(`./sites/${site}.json`, "utf8"));

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto(config.url, { waitUntil: "networkidle" });

  for (const key in config.fields) {
    await page.getByLabel(config.fields[key]).fill(data[key]);
  }

  await page.getByRole("button", {
    name: new RegExp(config.submitText, "i")
  }).click();

  await page.waitForTimeout(3000);
  const html = await page.content();

  await browser.close();
  res.json({ success: true, html });
});

app.listen(3000, () => console.log("Playwright imar backend hazır"));
