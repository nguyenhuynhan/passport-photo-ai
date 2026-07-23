/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServer } from 'vite';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const LOCAL_SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots');

async function runPixelLevelModelComparison() {
  console.log('===========================================================');
  console.log('PIXEL-LEVEL MODEL COMPARISON & DIFFERENCE HEATMAP SUITE');
  console.log('===========================================================\n');

  fs.mkdirSync(LOCAL_SCREENSHOT_DIR, { recursive: true });

  const server = await createServer({
    configFile: path.resolve(process.cwd(), 'vite.config.ts'),
    server: { port: 3339, host: 'localhost' },
  });
  await server.listen();
  const address = server.httpServer?.address();
  const actualPort = typeof address === 'object' && address ? address.port : 3339;
  const serverUrl = `http://localhost:${actualPort}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  try {
    // 1. Capture Canvas Data for Model 1: RMBG FP16
    console.log('[1/4] Processing Model 1: RMBG IS-Net FP16 (Heavy Matting)...');
    const pageFp16 = await browser.newPage();
    await pageFp16.setViewport({ width: 1280, height: 900 });
    const start1 = Date.now();
    await pageFp16.goto(`${serverUrl}?autotest=true&fastMode=false&modelType=isnet_fp16`, { waitUntil: 'domcontentloaded' });
    await pageFp16.waitForFunction('window.passportEditorTest && window.passportEditorTest.hasCompletedAI() === true', { timeout: 90000 });
    const time1 = Date.now() - start1;

    const dataUrl1 = await pageFp16.evaluate('document.querySelector("#photo_editor_section canvas").toDataURL("image/png")');
    await pageFp16.close();

    // 2. Capture Canvas Data for Model 2: MediaPipe Fast Mode
    console.log('[2/4] Processing Model 2: MediaPipe SelfieSegmenter (Fast Mode)...');
    const pageFast = await browser.newPage();
    await pageFast.setViewport({ width: 1280, height: 900 });
    const start2 = Date.now();
    await pageFast.goto(`${serverUrl}?autotest=true&fastMode=true`, { waitUntil: 'domcontentloaded' });
    await pageFast.waitForFunction('window.passportEditorTest && window.passportEditorTest.hasCompletedAI() === true', { timeout: 60000 });
    const time2 = Date.now() - start2;

    const dataUrl2 = await pageFast.evaluate('document.querySelector("#photo_editor_section canvas").toDataURL("image/png")');
    await pageFast.close();

    // 3. Perform Pixel-Level Delta Analysis in Browser DOM Context
    console.log('[3/4] Computing Pixel-Level Delta & Diff Heatmap...');
    const diffPage = await browser.newPage();
    await diffPage.setContent(`
      <!DOCTYPE html>
      <html>
      <body>
        <canvas id="c1"></canvas>
        <canvas id="c2"></canvas>
        <canvas id="diff"></canvas>
        <script>
          window.compareImages = function(imgBase64_1, imgBase64_2) {
            return new Promise((resolve) => {
              const img1 = new Image();
              const img2 = new Image();
              let loaded = 0;
              const check = () => {
                loaded++;
                if (loaded < 2) return;

                const w = Math.min(img1.width, img2.width);
                const h = Math.min(img1.height, img2.height);

                const c1 = document.getElementById('c1');
                const c2 = document.getElementById('c2');
                const cDiff = document.getElementById('diff');

                c1.width = w; c1.height = h;
                c2.width = w; c2.height = h;
                cDiff.width = w; cDiff.height = h;

                const ctx1 = c1.getContext('2d');
                const ctx2 = c2.getContext('2d');
                const ctxDiff = cDiff.getContext('2d');

                ctx1.drawImage(img1, 0, 0, w, h);
                ctx2.drawImage(img2, 0, 0, w, h);

                const data1 = ctx1.getImageData(0, 0, w, h).data;
                const data2 = ctx2.getImageData(0, 0, w, h).data;
                const diffImgData = ctxDiff.createImageData(w, h);
                const diffData = diffImgData.data;

                let totalDiffPixels = 0;
                let totalColorDelta = 0;
                const totalPixels = w * h;

                for (let i = 0; i < totalPixels; i++) {
                  const idx = i * 4;
                  const r1 = data1[idx], g1 = data1[idx + 1], b1 = data1[idx + 2];
                  const r2 = data2[idx], g2 = data2[idx + 1], b2 = data2[idx + 2];

                  const delta = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
                  totalColorDelta += delta;

                  if (delta > 35) {
                    // Highlight pixel difference in Magenta / Hot Pink
                    totalDiffPixels++;
                    diffData[idx] = 255;     // R
                    diffData[idx + 1] = 0;   // G
                    diffData[idx + 2] = 128; // B
                    diffData[idx + 3] = 255; // A
                  } else {
                    // Grayscale background
                    const gray = Math.round(0.299 * r1 + 0.587 * g1 + 0.114 * b1);
                    diffData[idx] = gray;
                    diffData[idx + 1] = gray;
                    diffData[idx + 2] = gray;
                    diffData[idx + 3] = 160;
                  }
                }

                ctxDiff.putImageData(diffImgData, 0, 0);

                const diffPct = ((totalDiffPixels / totalPixels) * 100).toFixed(2);
                const meanDelta = (totalColorDelta / (totalPixels * 3)).toFixed(2);

                resolve({
                  w,
                  h,
                  totalPixels,
                  totalDiffPixels,
                  diffPct,
                  meanDelta,
                  heatmapDataUrl: cDiff.toDataURL('image/png')
                });
              };

              img1.onload = check;
              img2.onload = check;
              img1.src = imgBase64_1;
              img2.src = imgBase64_2;
            });
          };
        </script>
      </body>
      </html>
    `);

    const result = await diffPage.evaluate(`window.compareImages(${JSON.stringify(dataUrl1)}, ${JSON.stringify(dataUrl2)})`);

    const heatmapBuffer = Buffer.from(result.heatmapDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
    const heatmapPath = path.join(LOCAL_SCREENSHOT_DIR, 'pixel_diff_fp16_vs_mediapipe.png');
    fs.writeFileSync(heatmapPath, heatmapBuffer);

    // 4. Output Quantitative Analysis Report
    console.log('\n[4/4] QUANTITATIVE PIXEL ANALYSIS REPORT:');
    console.log('-----------------------------------------------------------');
    console.log(`• Model 1 (RMBG FP16 Heavy): ~${time1}ms`);
    console.log(`• Model 2 (MediaPipe Fast): ~${time2}ms`);
    console.log(`• Tested Canvas Resolution: ${result.w}x${result.h} (${result.totalPixels.toLocaleString()} total pixels)`);
    console.log(`• Divergent Pixels (Delta > 35): ${result.totalDiffPixels.toLocaleString()} px (${result.diffPct}%)`);
    console.log(`• Mean Color Intensity Delta: ${result.meanDelta} / 255`);
    console.log(`• Diff Heatmap Saved to: screenshots/pixel_diff_fp16_vs_mediapipe.png`);
    console.log('-----------------------------------------------------------');

    await diffPage.close();
  } finally {
    await browser.close();
    await server.close();
  }
}

runPixelLevelModelComparison().catch((err) => {
  console.error('❌ Pixel comparison script failed:', err);
  process.exit(1);
});
