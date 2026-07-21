/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServer } from 'vite';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/nha/.gemini/antigravity/brain/c1fd293c-3339-44dd-a7fd-af7967b915e1';
const LOCAL_SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots');
const ARTIFACT_SCREENSHOT_DIR = path.resolve(ARTIFACT_DIR, 'screenshots');

async function processUserUploadedPhoto() {
  console.log('===========================================================');
  console.log('PASSPORT PHOTO AI - PROCESS USER UPLOADED PORTRAIT PHOTO');
  console.log('===========================================================\n');

  fs.mkdirSync(LOCAL_SCREENSHOT_DIR, { recursive: true });
  fs.mkdirSync(ARTIFACT_SCREENSHOT_DIR, { recursive: true });

  // 1. Start local Vite server
  console.log('[1/3] Starting local Vite server...');
  const server = await createServer({
    configFile: path.resolve(process.cwd(), 'vite.config.ts'),
    server: { port: 3335, host: 'localhost' },
  });
  await server.listen();
  const serverUrl = 'http://localhost:3335';

  // 2. Launch Puppeteer
  console.log('[2/3] Loading user photo and running AI detection & alignment...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.on('console', (msg) => console.log('  [BROWSER LOG]', msg.text()));
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

  // Navigate with custom user photo parameter
  await page.goto(`${serverUrl}?autotest=true&photo=/user-photo.jpg`, { waitUntil: 'domcontentloaded' });

  // Wait for AI processing to finish in Step 2
  try {
    await page.waitForFunction(
      () => {
        const editorTest = (window as any).passportEditorTest;
        return editorTest && !editorTest.isProcessing() && editorTest.getAdjustments()?.zoom !== 1;
      },
      { timeout: 20000 }
    );
  } catch (e) {
    console.warn('⚠️ Wait timeout, capturing current render state...');
  }

  // Short delay for canvas draw loop to settle
  await new Promise((r) => setTimeout(r, 1000));

  // Get computed adjustments from window API
  const adjustments = await page.evaluate(() => {
    const editorTest = (window as any).passportEditorTest;
    return editorTest ? editorTest.getAdjustments() : null;
  });

  console.log(`  -> Computed Adjustments: zoom=${adjustments?.zoom}, offsetX=${adjustments?.offsetX}px, offsetY=${adjustments?.offsetY}px, rot=${adjustments?.rotation}°`);

  // Take screenshot of Step 2 Editor Preview
  const step2Filename = 'user_photo_step2_preview_4x6.png';
  const step2LocalPath = path.join(LOCAL_SCREENSHOT_DIR, step2Filename);
  const step2ArtifactPath = path.join(ARTIFACT_SCREENSHOT_DIR, step2Filename);

  const editorElement = await page.$('#photo_editor_section');
  if (editorElement) {
    await editorElement.screenshot({ path: step2LocalPath });
  } else {
    await page.screenshot({ path: step2LocalPath, fullPage: false });
  }
  fs.copyFileSync(step2LocalPath, step2ArtifactPath);
  console.log(`  ✅ Step 2 Preview saved: screenshots/${step2Filename}`);

  // Now click "Next" / "Tiếp theo" button to proceed to Step 3 (Export Final Photo)
  console.log('[3/3] Exporting high-resolution 4x6 passport photo for user image...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const nextBtn = btns.find(b => b.textContent?.includes('Tiếp') || b.textContent?.includes('Xuất'));
    if (nextBtn) nextBtn.click();
  });

  await new Promise((r) => setTimeout(r, 1200));

  // Take screenshot of final exported passport photo page
  const finalFilename = 'user_photo_final_passport_4x6.png';
  const finalLocalPath = path.join(LOCAL_SCREENSHOT_DIR, finalFilename);
  const finalArtifactPath = path.join(ARTIFACT_SCREENSHOT_DIR, finalFilename);

  await page.screenshot({ path: finalLocalPath, fullPage: false });
  fs.copyFileSync(finalLocalPath, finalArtifactPath);
  console.log(`  ✅ Final Exported Passport Photo saved: screenshots/${finalFilename}`);

  await browser.close();
  await server.close();

  console.log('\n===========================================================');
  console.log('🎉 USER PORTRAIT PHOTO PROCESSING COMPLETED SUCCESSFULLY!');
  console.log('===========================================================');
}

processUserUploadedPhoto().catch((err) => {
  console.error('❌ User photo processing script failed:', err);
  process.exit(1);
});
