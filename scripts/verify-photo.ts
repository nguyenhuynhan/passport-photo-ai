/**
 * Run one real portrait through the browser pipeline without committing the
 * private source image. Usage:
 *   npm run verify:photo -- "C:\\path\\portrait.jpg" [fast|quint8|fp16]
 */
import { createServer } from 'vite';
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { setJpegDpi } from '../src/utils/jpeg';

const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : '';
const mode = process.argv[3] ?? 'fast';

if (!inputPath || !fs.existsSync(inputPath)) {
  throw new Error('Pass an existing portrait path: npm run verify:photo -- "C:\\path\\portrait.jpg"');
}
if (!['fast', 'quint8', 'fp16'].includes(mode)) {
  throw new Error(`Unsupported mode "${mode}". Use fast, quint8, or fp16.`);
}

const outputDir = path.resolve(process.cwd(), 'output');
fs.mkdirSync(outputDir, { recursive: true });

const sourceDataUrl = `data:image/jpeg;base64,${fs.readFileSync(inputPath).toString('base64')}`;
const query = mode === 'fast'
  ? '?autotest=true&fastMode=true'
  : `?autotest=true&fastMode=false&modelType=${mode === 'quint8' ? 'isnet_quint8' : 'isnet_fp16'}`;

const server = await createServer({
  configFile: path.resolve(process.cwd(), 'vite.config.ts'),
  server: { port: 0, host: 'localhost' },
});
await server.listen();
const address = server.httpServer?.address();
const port = typeof address === 'object' && address ? address.port : 3000;

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
});

try {
  const page = await browser.newPage();
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') {
      console.error(`[browser:${message.type()}] ${message.text()}`);
    }
  });
  await page.setViewport({ width: 1280, height: 1000, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:${port}/${query}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean((window as any).passportTest), { timeout: 30_000 });
  await page.evaluate((dataUrl) => (window as any).passportTest.selectPhoto(dataUrl), sourceDataUrl);
  await page.waitForFunction(
    () => {
      const editor = (window as any).passportEditorTest;
      return editor?.hasCompletedAI() === true && editor?.isProcessing() === false;
    },
    { timeout: mode === 'fast' ? 60_000 : 120_000 },
  );
  await new Promise((resolve) => setTimeout(resolve, 500));

  const result = await page.evaluate(() => {
    const editor = (window as any).passportEditorTest;
    const canvas = Array.from(document.querySelectorAll('canvas'))
      .find((candidate) => candidate.width === 1200 && candidate.height === 1800);
    if (!canvas) throw new Error('The 1200x1800 passport canvas was not produced.');
    return {
      dataUrl: canvas.toDataURL('image/jpeg', 0.98),
      adjustments: editor?.getAdjustments(),
      faceDetected: editor?.isFaceDetected(),
    };
  });

  const tagged = setJpegDpi(result.dataUrl, 300);
  const photoPath = path.join(outputDir, `verification-${mode}.jpg`);
  fs.writeFileSync(photoPath, Buffer.from(tagged.replace(/^data:image\/jpeg;base64,/, ''), 'base64'));

  await page.evaluate(() => document.getElementById('step_3_export_hud_btn')?.click());
  await page.waitForSelector('#vneid_local_preflight', { timeout: 15_000 });
  const preflight = await page.evaluate(() => {
    const element = document.getElementById('vneid_local_preflight');
    return {
      text: element?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      warning: element?.className.includes('amber') ?? false,
    };
  });
  const screenshotPath = path.join(outputDir, `verification-${mode}-page.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  console.log(JSON.stringify({
    input: inputPath,
    mode,
    photoPath,
    screenshotPath,
    faceDetected: result.faceDetected,
    adjustments: result.adjustments,
    preflight,
  }, null, 2));
} finally {
  await browser.close();
  await server.close();
}
