import { chromium } from 'playwright';
import fs from 'fs';

const baseUrl = 'http://localhost:5173';

const pages = [
  ['home', '/'],
  ['recommendation', '/recommendation'],
  ['create-meeting', '/create-meeting'],
  ['waiting', '/waiting'],
  ['join', '/join'],
  ['complete', '/complete'],
];

const outputDir = 'exports/pages';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const browser = await chromium.launch();

const page = await browser.newPage({
  viewport: {
    width: 390,
    height: 844,
  },
  deviceScaleFactor: 2,
});

for (const [name, path] of pages) {
  const url = `${baseUrl}${path}`;

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    await page.screenshot({
      path: `${outputDir}/${name}.png`,
      fullPage: true,
    });

    console.log(`Saved: ${name} → ${url}`);
  } catch (error) {
    console.log(`Failed: ${name} → ${url}`);
    console.log(error.message);
  }
}

await browser.close();
