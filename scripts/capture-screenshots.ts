/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createServer } from 'vite';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/nha/.gemini/antigravity/brain/a2acfec0-3079-43e6-9250-2e815f64a995';
const LOCAL_SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots');
const ARTIFACT_SCREENSHOT_DIR = path.resolve(ARTIFACT_DIR, 'screenshots');

async function runScreenshotAutomation() {
  console.log('===========================================================');
  console.log('AUTOMATION SCREENSHOT CAPTURE - PASSPORT PHOTO AI (STEP 2)');
  console.log('===========================================================\n');

  // Ensure output directories exist
  fs.mkdirSync(LOCAL_SCREENSHOT_DIR, { recursive: true });
  fs.mkdirSync(ARTIFACT_SCREENSHOT_DIR, { recursive: true });

  // 1. Start local Vite dev server programmatically
  console.log('[1/4] Starting local Vite web server...');
  const server = await createServer({
    configFile: path.resolve(process.cwd(), 'vite.config.ts'),
    server: { port: 3333, host: 'localhost' },
  });
  await server.listen();
  const serverUrl = 'http://localhost:3333';
  console.log(`Vite server running at: ${serverUrl}\n`);

  // 2. Launch Puppeteer browser
  console.log('[2/4] Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const testScenarios = [
    {
      name: '01_desktop_vietnam_4x6_male',
      device: 'Desktop (1280x900)',
      viewport: { width: 1280, height: 900, deviceScaleFactor: 1 },
      presetIndex: 0, // Vietnam 4x6
    },
    {
      name: '02_desktop_vietnam_3x4',
      device: 'Desktop (1280x900)',
      viewport: { width: 1280, height: 900, deviceScaleFactor: 1 },
      presetIndex: 1, // Vietnam 3x4
    },
    {
      name: '03_mobile_iphone14_vietnam_4x6',
      device: 'Mobile iPhone 14 (393x852)',
      viewport: { width: 393, height: 852, deviceScaleFactor: 2, isMobile: true },
      presetIndex: 0, // Vietnam 4x6
    },
    {
      name: '04_mobile_galaxy_s20_us_visa',
      device: 'Mobile Galaxy S20 (360x800)',
      viewport: { width: 360, height: 800, deviceScaleFactor: 2, isMobile: true },
      presetIndex: 3, // US Visa
    },
    {
      name: '05_mobile_ultra_compact_schengen',
      device: 'Mobile Ultra Compact (320x568)',
      viewport: { width: 320, height: 568, deviceScaleFactor: 2, isMobile: true },
      presetIndex: 4, // Schengen
    },
  ];

  console.log('[3/4] Executing scenarios & taking Step 2 screenshots...');

  const capturedResults: Array<{ name: string; device: string; localPath: string; artifactPath: string; adjustments: any }> = [];

  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log(`\n  Scenario ${i + 1}/${testScenarios.length}: ${scenario.name} (${scenario.device})`);

    const page = await browser.newPage();
    page.on('pageerror', (err) => console.log('    ⚠️ [PAGE ERROR]', err.message));
    await page.setViewport(scenario.viewport);

    // Navigate with autotest query param and scenario presetIndex
    await page.goto(`${serverUrl}?autotest=true&presetIndex=${scenario.presetIndex}`, { waitUntil: 'domcontentloaded' });

    // Wait for editor preview section and AI processing completion
    try {
      await page.waitForSelector('#photo_editor_section', { timeout: 30000 });
      await page.waitForFunction(
        () => {
          const editorTest = (window as any).passportEditorTest;
          return editorTest && editorTest.hasCompletedAI && editorTest.hasCompletedAI() && !editorTest.isProcessing();
        },
        { timeout: 30000 }
      );
    } catch (e) {
      console.warn('    ⚠️ Processing wait timeout, capturing current render state...');
    }

    // Additional delay for canvas draw loop and CSS animations to settle 100%
    await new Promise((r) => setTimeout(r, 2500));

    // Get calculated adjustments from window API
    const adjustments = await page.evaluate(() => {
      const editorTest = (window as any).passportEditorTest;
      return editorTest ? editorTest.getAdjustments() : null;
    });

    console.log(`    -> Computed Adjustments: zoom=${adjustments?.zoom}, offsetX=${adjustments?.offsetX}px, offsetY=${adjustments?.offsetY}px`);

    // Capture Full Page Screenshot with timestamp & versioning
    const timestamp = Date.now();
    const versionedFilename = `${scenario.name}_v${timestamp}.png`;
    const standardFilename = `${scenario.name}.png`;

    const localPath = path.join(LOCAL_SCREENSHOT_DIR, standardFilename);
    const localVersionedPath = path.join(LOCAL_SCREENSHOT_DIR, versionedFilename);
    const artifactPath = path.join(ARTIFACT_SCREENSHOT_DIR, standardFilename);
    const artifactVersionedPath = path.join(ARTIFACT_SCREENSHOT_DIR, versionedFilename);

    const editorElement = await page.$('#photo_editor_section');
    if (editorElement) {
      await editorElement.screenshot({ path: localPath });
    } else {
      await page.screenshot({ path: localPath, fullPage: false });
    }

    fs.copyFileSync(localPath, localVersionedPath);
    fs.copyFileSync(localPath, artifactPath);
    fs.copyFileSync(localPath, artifactVersionedPath);

    console.log(`    ✅ Screenshot saved: screenshots/${standardFilename} & ${versionedFilename}`);

    capturedResults.push({
      name: scenario.name,
      device: scenario.device,
      localPath: `file:///${localPath.replace(/\\/g, '/')}`,
      artifactPath: `file:///${artifactPath.replace(/\\/g, '/')}`,
      adjustments,
    });

    await page.close();
  }

  // 4. Clean up
  console.log('\n[4/4] Closing browser and server...');
  await browser.close();
  await server.close();

  console.log('\n===========================================================');
  console.log('🎉 AUTOMATION CAPTURE COMPLETED SUCCESSFULLY!');
  console.log(`Saved ${capturedResults.length} screenshots to: ${LOCAL_SCREENSHOT_DIR}`);
  console.log('===========================================================');
}

runScreenshotAutomation().catch((err) => {
  console.error('❌ Automation screenshot script failed:', err);
  process.exit(1);
});
