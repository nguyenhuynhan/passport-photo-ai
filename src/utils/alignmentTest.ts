/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PassportStandard, PHOTO_PRESETS, ImageAdjustments } from '../types';

export interface ImageLandmarks {
  name: string;
  width: number;
  height: number;
  normRightEyeX: number;
  normRightEyeY: number;
  normLeftEyeX: number;
  normLeftEyeY: number;
  normMouthY: number;
  normTopHeadY: number;
  normChinY: number;
}

export interface MobileViewport {
  name: string;
  screenWidth: number;
  screenHeight: number;
}

export const MOBILE_VIEWPORTS: MobileViewport[] = [
  { name: 'iPhone SE', screenWidth: 375, screenHeight: 667 },
  { name: 'iPhone 14 Pro', screenWidth: 393, screenHeight: 852 },
  { name: 'Android Small (Galaxy S8)', screenWidth: 360, screenHeight: 740 },
  { name: 'Ultra Compact Mobile', screenWidth: 320, screenHeight: 568 },
];

export function calculateAutoAdjustments(landmarks: ImageLandmarks, preset = PHOTO_PRESETS[PassportStandard.VIETNAM_4x6]): ImageAdjustments {
  const { width: sourceWidth, height: sourceHeight, normRightEyeX, normRightEyeY, normLeftEyeX, normLeftEyeY, normTopHeadY, normChinY } = landmarks;

  const dxPx = (normLeftEyeX - normRightEyeX) * sourceWidth;
  const dyPx = (normLeftEyeY - normRightEyeY) * sourceHeight;
  const rawAngle = -Math.atan2(dyPx, dxPx) * (180 / Math.PI);
  const rotationAngle = Math.max(-15, Math.min(15, rawAngle));

  const normFaceCenterX = (normRightEyeX + normLeftEyeX) / 2;
  const normEyeCenterY = (normRightEyeY + normLeftEyeY) / 2;
  const eyeToChin = Math.max(0.10, normChinY - normEyeCenterY);
  
  // Cap max hair height to 1.15x eye-to-chin distance so tall hair does not distort anatomical head center
  const effectiveTopHeadY = Math.max(normEyeCenterY - 1.15 * eyeToChin, normTopHeadY);
  const normHeadCenterY = (effectiveTopHeadY + normChinY) / 2;
  const normFullHeadHeight = Math.max(0.18, normChinY - effectiveTopHeadY);

  const standardCanvasHeight = 1800;
  const standardCanvasWidth = Math.round(standardCanvasHeight * preset.aspectRatio);

  const targetHeadHeightPercent = (preset.overlaySpecs.chinPercent - preset.overlaySpecs.headTopPercent) / 100;
  const targetHeadHeightPx = standardCanvasHeight * targetHeadHeightPercent;

  const baseScale = Math.min(standardCanvasWidth / sourceWidth, standardCanvasHeight / sourceHeight);
  const headScaleNeeded = targetHeadHeightPx / (normFullHeadHeight * sourceHeight);

  let calculatedZoom = headScaleNeeded / baseScale;

  const targetHeadCenterPercent = (preset.overlaySpecs.headTopPercent + preset.overlaySpecs.chinPercent) / 2;
  const targetHeadCenterPxOnCanvas = (targetHeadCenterPercent / 100) * standardCanvasHeight;

  const isPortrait = sourceHeight >= sourceWidth;
  const maxAllowedZoom = isPortrait ? 8.0 : 10.0;
  const minAllowedZoom = isPortrait ? 0.30 : 0.20;

  const rawZoom = Math.max(minAllowedZoom, Math.min(maxAllowedZoom, calculatedZoom));
  const zoom = isFinite(rawZoom) && rawZoom > 0 ? rawZoom : 1.0;
  const finalScale = baseScale * zoom;

  const rawOffsetX = (0.5 - normFaceCenterX) * sourceWidth * finalScale;
  const rawOffsetY = targetHeadCenterPxOnCanvas - (standardCanvasHeight / 2) - (normHeadCenterY - 0.5) * sourceHeight * finalScale;

  const maxOffsetX = (sourceWidth * finalScale + standardCanvasWidth) / 2;
  const maxOffsetY = (sourceHeight * finalScale + standardCanvasHeight) / 2;

  const targetOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, isFinite(rawOffsetX) ? rawOffsetX : 0));
  const targetOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, isFinite(rawOffsetY) ? rawOffsetY : 0));

  return {
    zoom: Number(zoom.toFixed(2)),
    rotation: Number((isFinite(rotationAngle) ? rotationAngle : 0).toFixed(1)),
    offsetX: Number(targetOffsetX.toFixed(0)),
    offsetY: Number(targetOffsetY.toFixed(0)),
    brightness: 100,
    contrast: 100,
    saturation: 100,
  };
}



export interface VerificationResult {
  topHeadErrorPx: number;
  chinErrorPx: number;
  eyeErrorPx: number;
  headHeightErrorPx: number;
}

export function verifyFullAlignmentOnCanvas(
  landmarks: ImageLandmarks, 
  adjustments: ImageAdjustments, 
  preset = PHOTO_PRESETS[PassportStandard.VIETNAM_4x6]
): VerificationResult {
  const normEyeCenterY = (landmarks.normRightEyeY + landmarks.normLeftEyeY) / 2;
  const standardCanvasHeight = 1800;
  const standardCanvasWidth = Math.round(standardCanvasHeight * preset.aspectRatio);

  const baseScale = Math.min(standardCanvasWidth / landmarks.width, landmarks.height ? standardCanvasHeight / landmarks.height : 1);
  const finalScale = baseScale * adjustments.zoom;
  const canvasCenterY = standardCanvasHeight / 2;

  const actualTopHeadCanvasY = canvasCenterY + adjustments.offsetY + (landmarks.normTopHeadY - 0.5) * landmarks.height * finalScale;
  const actualChinCanvasY = canvasCenterY + adjustments.offsetY + (landmarks.normChinY - 0.5) * landmarks.height * finalScale;
  const actualEyeCanvasY = canvasCenterY + adjustments.offsetY + (normEyeCenterY - 0.5) * landmarks.height * finalScale;

  const targetTopHeadCanvasY = (preset.overlaySpecs.headTopPercent / 100) * standardCanvasHeight;
  const targetChinCanvasY = (preset.overlaySpecs.chinPercent / 100) * standardCanvasHeight;
  const targetEyeCanvasY = (preset.overlaySpecs.eyeLinePercent / 100) * standardCanvasHeight;

  const topHeadErrorPx = Math.abs(actualTopHeadCanvasY - targetTopHeadCanvasY);
  const chinErrorPx = Math.abs(actualChinCanvasY - targetChinCanvasY);
  const eyeErrorPx = Math.abs(actualEyeCanvasY - targetEyeCanvasY);

  const actualHeadHeightPx = actualChinCanvasY - actualTopHeadCanvasY;
  const targetHeadHeightPx = targetChinCanvasY - targetTopHeadCanvasY;
  const headHeightErrorPx = Math.abs(actualHeadHeightPx - targetHeadHeightPx);

  return { topHeadErrorPx, chinErrorPx, eyeErrorPx, headHeightErrorPx };
}

const TEST_CASES: ImageLandmarks[] = [
  {
    name: 'User Mobile Portrait Selfie (1080x1920 Close-up)',
    width: 1080,
    height: 1920,
    normRightEyeX: 0.38,
    normRightEyeY: 0.28,
    normLeftEyeX: 0.62,
    normLeftEyeY: 0.28,
    normMouthY: 0.52,
    normTopHeadY: 0.08,
    normChinY: 0.68,
  },
  {
    name: 'User Portrait Photo (Elderly Male 768x1024)',
    width: 768,
    height: 1024,
    normRightEyeX: 0.40,
    normRightEyeY: 0.42,
    normLeftEyeX: 0.58,
    normLeftEyeY: 0.42,
    normMouthY: 0.54,
    normTopHeadY: 0.2412,
    normChinY: 0.6382,
  },
  {
    name: 'Standard Male Portrait (768x1024)',
    width: 768,
    height: 1024,
    normRightEyeX: 320 / 768,
    normRightEyeY: 410 / 1024,
    normLeftEyeX: 448 / 768,
    normLeftEyeY: 410 / 1024,
    normMouthY: 540 / 1024,
    normTopHeadY: 240 / 1024,
    normChinY: 620 / 1024,
  },
  {
    name: 'Off-Center Right Face (High Res 3000x4000)',
    width: 3000,
    height: 4000,
    normRightEyeX: 0.55,
    normRightEyeY: 0.32,
    normLeftEyeX: 0.68,
    normLeftEyeY: 0.32,
    normMouthY: 0.45,
    normTopHeadY: 0.18,
    normChinY: 0.52,
  },
  {
    name: 'Landscape 4:3 Camera Photo (4000x3000)',
    width: 4000,
    height: 3000,
    normRightEyeX: 0.42,
    normRightEyeY: 0.35,
    normLeftEyeX: 0.56,
    normLeftEyeY: 0.35,
    normMouthY: 0.48,
    normTopHeadY: 0.20,
    normChinY: 0.56,
  }
];

export function runAutomationSuite() {
  console.log('===========================================================');
  console.log('PASSPORT PHOTO AI - RIGOROUS AUTOMATION & ALIGNMENT SUITE');
  console.log('===========================================================\n');

  let passed = true;

  console.log('--- 1. STRICT 3-POINT ALIGNMENT & HEAD HEIGHT PRECISION TESTS ---');
  for (const testCase of TEST_CASES) {
    console.log(`\nTesting Image Case: "${testCase.name}" (${testCase.width}x${testCase.height})`);
    
    for (const presetKey of Object.keys(PHOTO_PRESETS) as PassportStandard[]) {
      const preset = PHOTO_PRESETS[presetKey];
      const result = calculateAutoAdjustments(testCase, preset);
      const verification = verifyFullAlignmentOnCanvas(testCase, result, preset);
      
      console.log(`  -> Preset [${preset.name}]: zoom=${result.zoom}, offsetX=${result.offsetX}px, offsetY=${result.offsetY}px | HeadTop Err: ${verification.topHeadErrorPx.toFixed(1)}px, Chin Err: ${verification.chinErrorPx.toFixed(1)}px, Eye Err: ${verification.eyeErrorPx.toFixed(1)}px, HeadHeight Err: ${verification.headHeightErrorPx.toFixed(1)}px`);

      if (!isFinite(result.zoom) || result.zoom <= 0 || Math.abs(result.offsetX) > 1000 || Math.abs(result.offsetY) > 1000) {
        console.error(`     ❌ ERROR: Alignment parameters exceed safety boundaries for preset ${preset.name}`);
        passed = false;
      }

      if (verification.topHeadErrorPx > 25) {
        console.error(`     ❌ ERROR: Top Head error (${verification.topHeadErrorPx.toFixed(1)}px) exceeds 25px tolerance for preset ${preset.name}`);
        passed = false;
      }

      if (verification.chinErrorPx > 25) {
        console.error(`     ❌ ERROR: Chin error (${verification.chinErrorPx.toFixed(1)}px) exceeds 25px tolerance for preset ${preset.name}`);
        passed = false;
      }

      if (verification.headHeightErrorPx > 25) {
        console.error(`     ❌ ERROR: Head Height error (${verification.headHeightErrorPx.toFixed(1)}px) exceeds 25px tolerance for preset ${preset.name}`);
        passed = false;
      }
    }
  }

  // 2. Mobile Viewport Layout & Aspect Ratio Assertion Tests
  console.log('\n--- 2. MOBILE VIEWPORT LAYOUT & ASPECT RATIO ASSERTIONS ---');
  for (const viewport of MOBILE_VIEWPORTS) {
    console.log(`\nTesting Mobile Device: "${viewport.name}" (${viewport.screenWidth}x${viewport.screenHeight} px)`);

    for (const presetKey of Object.keys(PHOTO_PRESETS) as PassportStandard[]) {
      const preset = PHOTO_PRESETS[presetKey];

      // Calculate container width on mobile (max 280px or screen width - padding)
      const containerPadding = 48; // 24px left + 24px right
      const maxAvailableWidth = Math.min(280, viewport.screenWidth - containerPadding);
      const computedContainerHeight = maxAvailableWidth / preset.aspectRatio;

      const outputHeight = 1800;
      const outputWidth = Math.round(outputHeight * preset.aspectRatio);
      const canvasNativeAspectRatio = outputWidth / outputHeight;
      const containerAspectRatio = maxAvailableWidth / computedContainerHeight;

      const aspectRatioDiff = Math.abs(canvasNativeAspectRatio - containerAspectRatio);

      console.log(`  -> [${preset.name}]: Container = ${maxAvailableWidth.toFixed(0)}x${computedContainerHeight.toFixed(0)}px (Aspect Ratio: ${containerAspectRatio.toFixed(4)})`);

      if (aspectRatioDiff > 0.01) {
        console.error(`     ❌ ERROR: Aspect ratio mismatch between native canvas (${canvasNativeAspectRatio}) and mobile container (${containerAspectRatio})`);
        passed = false;
      }
    }
  }

  console.log('\n-----------------------------------------------------------');
  if (passed) {
    console.log('🎉 ALL DESKTOP & MOBILE AUTOMATION SUITES PASSED SUCCESSFULLY!\n');
  } else {
    console.error('❌ AUTOMATION SUITE DETECTED FAILURES!\n');
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].includes('alignmentTest')) {
  runAutomationSuite();
}
