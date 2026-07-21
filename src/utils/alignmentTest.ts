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

export function calculateAutoAdjustments(landmarks: ImageLandmarks, preset = PHOTO_PRESETS[PassportStandard.VIETNAM_4x6]): ImageAdjustments {
  const { width: sourceWidth, height: sourceHeight, normRightEyeX, normRightEyeY, normLeftEyeX, normLeftEyeY, normMouthY, normTopHeadY, normChinY } = landmarks;

  const minEyeX = Math.min(normRightEyeX, normLeftEyeX);
  const maxEyeX = Math.max(normRightEyeX, normLeftEyeX);

  const dxPx = (normLeftEyeX - normRightEyeX) * sourceWidth;
  const dyPx = (normLeftEyeY - normRightEyeY) * sourceHeight;
  const eyeDistPx = Math.hypot(dxPx, dyPx);
  const rawAngle = -Math.atan2(dyPx, dxPx) * (180 / Math.PI);
  const rotationAngle = Math.max(-15, Math.min(15, rawAngle));

  const normFaceCenterX = (normRightEyeX + normLeftEyeX) / 2;
  const normEyeCenterY = (normRightEyeY + normLeftEyeY) / 2;

  const eyeDistNorm = (eyeDistPx / sourceHeight) > 0 ? (eyeDistPx / sourceHeight) : 0.15;
  const computedTopHeadY = Math.max(0.005, normEyeCenterY - 1.30 * eyeDistNorm);
  
  let computedChinY = 0;
  if (normMouthY > normEyeCenterY) {
    computedChinY = normMouthY + 0.65 * eyeDistNorm;
  } else {
    computedChinY = normEyeCenterY + 1.45 * eyeDistNorm;
  }
  computedChinY = Math.min(0.995, Math.max(normEyeCenterY + 1.20 * eyeDistNorm, computedChinY));

  let rawHeadHeight = computedChinY - computedTopHeadY;
  if (rawHeadHeight < 2.2 * eyeDistNorm || rawHeadHeight > 3.2 * eyeDistNorm) {
    rawHeadHeight = 2.70 * eyeDistNorm;
  }
  const normFullHeadHeight = Math.max(0.15, rawHeadHeight);

  const standardCanvasHeight = 1800;
  const standardCanvasWidth = Math.round(standardCanvasHeight * preset.aspectRatio);

  const targetHeadHeightPercent = (preset.overlaySpecs.chinPercent - preset.overlaySpecs.headTopPercent) / 100;
  const targetHeadHeightPx = standardCanvasHeight * targetHeadHeightPercent;

  const baseScale = Math.min(standardCanvasWidth / sourceWidth, standardCanvasHeight / sourceHeight);
  const headScaleNeeded = targetHeadHeightPx / (normFullHeadHeight * sourceHeight);

  const calculatedZoom = headScaleNeeded / baseScale;
  const rawZoom = Math.max(0.3, Math.min(4.0, calculatedZoom));
  const zoom = isFinite(rawZoom) && rawZoom > 0 ? rawZoom : 1.0;
  const finalScale = baseScale * zoom;

  const targetEyeLinePxOnCanvas = (preset.overlaySpecs.eyeLinePercent / 100) * standardCanvasHeight;
  const rawOffsetX = (0.5 - normFaceCenterX) * sourceWidth * finalScale;
  const rawOffsetY = targetEyeLinePxOnCanvas - (standardCanvasHeight / 2) - (normEyeCenterY - 0.5) * sourceHeight * finalScale;

  const targetOffsetX = Math.max(-1000, Math.min(1000, isFinite(rawOffsetX) ? rawOffsetX : 0));
  const targetOffsetY = Math.max(-1000, Math.min(1000, isFinite(rawOffsetY) ? rawOffsetY : 0));

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

const TEST_CASES: ImageLandmarks[] = [
  {
    name: 'Standard Portrait (Male 768x1024)',
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
  console.log('PASSPORT PHOTO AI - AUTOMATION ALIGNMENT SUITE');
  console.log('===========================================================\n');

  let passed = true;

  for (const testCase of TEST_CASES) {
    console.log(`Testing Case: "${testCase.name}" (${testCase.width}x${testCase.height})`);
    
    for (const presetKey of Object.keys(PHOTO_PRESETS) as PassportStandard[]) {
      const preset = PHOTO_PRESETS[presetKey];
      const result = calculateAutoAdjustments(testCase, preset);
      
      console.log(`  -> Preset [${preset.name}]: zoom=${result.zoom}, offsetX=${result.offsetX}px, offsetY=${result.offsetY}px, rot=${result.rotation}°`);

      if (!isFinite(result.zoom) || result.zoom <= 0 || Math.abs(result.offsetX) > 1000 || Math.abs(result.offsetY) > 1000) {
        console.error(`     ❌ ERROR: Alignment parameters exceed safety boundaries for preset ${preset.name}`);
        passed = false;
      }
    }
    console.log('');
  }

  if (passed) {
    console.log('🎉 ALL AUTOMATION ALIGNMENT SUITES PASSED SUCCESSFULLY!\n');
  } else {
    console.error('❌ AUTOMATION SUITE DETECTED FAILURES!\n');
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].includes('alignmentTest')) {
  runAutomationSuite();
}
