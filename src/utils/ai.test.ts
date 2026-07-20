/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PassportStandard, PHOTO_PRESETS, ImageAdjustments } from '../types';

export interface ImageLandmarks {
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

/**
 * Calculates auto-alignment adjustments matching PhotoEditor AI pipeline.
 */
export function calculateAutoAdjustments(landmarks: ImageLandmarks, preset = PHOTO_PRESETS[PassportStandard.VIETNAM_4x6]): ImageAdjustments {
  const { width: sourceWidth, height: sourceHeight, normRightEyeX, normRightEyeY, normLeftEyeX, normLeftEyeY, normMouthY, normTopHeadY, normChinY } = landmarks;

  const dxPx = (normLeftEyeX - normRightEyeX) * sourceWidth;
  const dyPx = (normLeftEyeY - normRightEyeY) * sourceHeight;
  const eyeDistPx = Math.hypot(dxPx, dyPx);
  const rawAngle = -Math.atan2(dyPx, dxPx) * (180 / Math.PI);
  const rotationAngle = Math.max(-15, Math.min(15, rawAngle));

  const normFaceCenterX = (normRightEyeX + normLeftEyeX) / 2;
  const normEyeCenterY = (normRightEyeY + normLeftEyeY) / 2;

  const normFullHeadHeight = Math.max(0.15, normChinY - normTopHeadY);

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

// Measured Ground Truth landmarks for test-man photo (768 x 1024)
const TEST_MAN_LANDMARKS: ImageLandmarks = {
  width: 768,
  height: 1024,
  normRightEyeX: 320 / 768,  // 0.4167
  normRightEyeY: 410 / 1024, // 0.4004
  normLeftEyeX: 448 / 768,   // 0.5833
  normLeftEyeY: 410 / 1024,  // 0.4004
  normMouthY: 540 / 1024,     // 0.5273
  normTopHeadY: 240 / 1024,   // 0.2344
  normChinY: 620 / 1024,      // 0.6055
};

// Manually Calibrated Ideal Adjustments (Ground Truth)
const MANUAL_GROUND_TRUTH: ImageAdjustments = {
  zoom: 1.76,
  rotation: 0,
  offsetX: 0,
  offsetY: 65,
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

function runTest() {
  console.log('====================================================');
  console.log('PASSPORT PHOTO AI - ALIGNMENT ALGORITHM UNIT TEST');
  console.log('====================================================\n');

  console.log('Standard Preset:', PHOTO_PRESETS[PassportStandard.VIETNAM_4x6].name);
  console.log('Test Image:', `${TEST_MAN_LANDMARKS.width}x${TEST_MAN_LANDMARKS.height} px\n`);

  console.log('--- Ground Truth (Manual Calibration) ---');
  console.log(MANUAL_GROUND_TRUTH);

  const algoResult = calculateAutoAdjustments(TEST_MAN_LANDMARKS);
  console.log('\n--- Algorithm Output ---');
  console.log(algoResult);

  const zoomDiff = Math.abs(algoResult.zoom - MANUAL_GROUND_TRUTH.zoom);
  const offsetXDiff = Math.abs(algoResult.offsetX - MANUAL_GROUND_TRUTH.offsetX);
  const offsetYDiff = Math.abs(algoResult.offsetY - MANUAL_GROUND_TRUTH.offsetY);
  const rotationDiff = Math.abs(algoResult.rotation - MANUAL_GROUND_TRUTH.rotation);

  console.log('\n--- Accuracy Metrics & Verification ---');
  console.log(`Zoom Error: ${zoomDiff.toFixed(2)} (Tolerance < 0.05) => ${zoomDiff < 0.05 ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`Offset X Error: ${offsetXDiff}px (Tolerance < 5px) => ${offsetXDiff < 5 ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`Offset Y Error: ${offsetYDiff}px (Tolerance < 5px) => ${offsetYDiff < 5 ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`Rotation Error: ${rotationDiff}° (Tolerance < 0.5°) => ${rotationDiff < 0.5 ? 'PASSED ✅' : 'FAILED ❌'}`);

  if (zoomDiff < 0.05 && offsetXDiff < 5 && offsetYDiff < 5 && rotationDiff < 0.5) {
    console.log('\nSUCCESS: Auto-alignment algorithm perfectly matches manual ground truth tuning! 🎉');
    process.exit(0);
  } else {
    console.error('\nFAILURE: Algorithm tuning error exceeds tolerance threshold!');
    process.exit(1);
  }
}

runTest();
