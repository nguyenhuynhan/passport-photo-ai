/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServer } from 'vite';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const LOCAL_SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots');

async function runModelComparisonSuite() {
  console.log('===========================================================');
  console.log('PASSPORT PHOTO AI - AUTOMATED 3-MODEL COMPARISON SUITE');
  console.log('===========================================================\n');

  fs.mkdirSync(LOCAL_SCREENSHOT_DIR, { recursive: true });

  // 1. Start local Vite server
  console.log('[1/5] Starting local Vite server on port 3338...');
  const server = await createServer({
    configFile: path.resolve(process.cwd(), 'vite.config.ts'),
    server: { port: 3338, host: 'localhost' },
  });
  await server.listen();
  const address = server.httpServer?.address();
  const actualPort = typeof address === 'object' && address ? address.port : 3338;
  const serverUrl = `http://localhost:${actualPort}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--allow-running-insecure-content'],
  });

  try {
    // 2. Capture Model 1: RMBG IS-Net FP16 (Heavy / Full Precision)
    console.log('[2/5] Capturing Model 1: RMBG IS-Net FP16 (Heavy / Slow Precision)...');
    const pageFp16 = await browser.newPage();
    await pageFp16.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    const startFp16 = Date.now();
    await pageFp16.goto(`${serverUrl}?autotest=true&fastMode=false&modelType=isnet_fp16`, { waitUntil: 'domcontentloaded' });

    await pageFp16.waitForFunction(
      () => {
        const editorTest = (window as any).passportEditorTest;
        return editorTest && editorTest.hasCompletedAI() === true && !editorTest.isProcessing();
      },
      { timeout: 90000 }
    );
    const fp16Time = Date.now() - startFp16;
    await new Promise((r) => setTimeout(r, 1000));

    const fp16ScreenshotPath = path.join(LOCAL_SCREENSHOT_DIR, 'compare_model_1_rmbg_fp16.png');
    const editorEl1 = await pageFp16.$('#photo_editor_section');
    if (editorEl1) {
      await editorEl1.screenshot({ path: fp16ScreenshotPath });
    }
    console.log(`  ✅ Model 1 Saved: screenshots/compare_model_1_rmbg_fp16.png (${fp16Time}ms)`);
    await pageFp16.close();

    // 3. Capture Model 2: RMBG IS-Net Quantized (Optimized High-Res)
    console.log('[3/5] Capturing Model 2: RMBG IS-Net Quint8 (Optimized High-Res)...');
    const pageQuint8 = await browser.newPage();
    await pageQuint8.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    const startQuint8 = Date.now();
    await pageQuint8.goto(`${serverUrl}?autotest=true&fastMode=false&modelType=isnet_quint8`, { waitUntil: 'domcontentloaded' });

    await pageQuint8.waitForFunction(
      () => {
        const editorTest = (window as any).passportEditorTest;
        return editorTest && editorTest.hasCompletedAI() === true && !editorTest.isProcessing();
      },
      { timeout: 90000 }
    );
    const quint8Time = Date.now() - startQuint8;
    await new Promise((r) => setTimeout(r, 1000));

    const quint8ScreenshotPath = path.join(LOCAL_SCREENSHOT_DIR, 'compare_model_2_rmbg_quint8.png');
    const editorEl2 = await pageQuint8.$('#photo_editor_section');
    if (editorEl2) {
      await editorEl2.screenshot({ path: quint8ScreenshotPath });
    }
    console.log(`  ✅ Model 2 Saved: screenshots/compare_model_2_rmbg_quint8.png (${quint8Time}ms)`);
    await pageQuint8.close();

    // 4. Capture Model 3: MediaPipe Fast Mode (256x256 MobileNet)
    console.log('[4/5] Capturing Model 3: MediaPipe SelfieSegmenter (Fast Mode 256x256)...');
    const pageFast = await browser.newPage();
    await pageFast.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    const startFast = Date.now();
    await pageFast.goto(`${serverUrl}?autotest=true&fastMode=true`, { waitUntil: 'domcontentloaded' });

    await pageFast.waitForFunction(
      () => {
        const editorTest = (window as any).passportEditorTest;
        return editorTest && editorTest.hasCompletedAI() === true && !editorTest.isProcessing();
      },
      { timeout: 60000 }
    );
    const fastTime = Date.now() - startFast;
    await new Promise((r) => setTimeout(r, 1000));

    const fastScreenshotPath = path.join(LOCAL_SCREENSHOT_DIR, 'compare_model_3_mediapipe_fast.png');
    const editorEl3 = await pageFast.$('#photo_editor_section');
    if (editorEl3) {
      await editorEl3.screenshot({ path: fastScreenshotPath });
    }
    console.log(`  ✅ Model 3 Saved: screenshots/compare_model_3_mediapipe_fast.png (${fastTime}ms)`);
    await pageFast.close();

    // 5. Output Benchmark Report Summary
    console.log('\n[5/5] BENCHMARK COMPARISON REPORT:');
    console.log('-----------------------------------------------------------');
    console.log(`• Model 1 (RMBG FP16 Heavy): 1024x1024 Full Floating Point Matting | ~${fp16Time}ms`);
    console.log(`• Model 2 (RMBG Quint8 Fast): 1024x1024 Quantized Precision Matting | ~${quint8Time}ms`);
    console.log(`• Model 3 (MediaPipe Fast): 256x256 MobileNet Fast Segmentation | ~${fastTime}ms`);
    console.log('-----------------------------------------------------------');

  } finally {
    await browser.close();
    await server.close();
  }

  console.log('\n🎉 ALL 3 MODELS COMPARISON TEST COMPLETED SUCCESSFULLY!');
}

runModelComparisonSuite().catch((err) => {
  console.error('❌ Comparison script failed:', err);
  process.exit(1);
});
