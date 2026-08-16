import { estimateSourceBackgroundRgb, fusePortraitMasks, normalizeRmbgAlpha } from './mask';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function runMaskRegressionTests() {
  assert(normalizeRmbgAlpha(0.42) === 0.42, 'Soft RMBG alpha must not be erased by a 0.55 cutoff');
  assert(normalizeRmbgAlpha(0) === 0, 'True background must remain transparent');
  assert(normalizeRmbgAlpha(1) === 1, 'Certain foreground must remain opaque');

  const width = 5;
  const height = 5;
  const primary = new Float32Array(width * height).fill(0);
  const fallback = new Float32Array(width * height).fill(0);
  primary[4 * width + 1] = 1; // retained lower garment
  fallback[4 * width + 1] = 1;
  fallback[4 * width + 2] = 1; // garment patch missed by RMBG
  const fused = fusePortraitMasks(primary, width, height, fallback, width, height);
  assert(fused[4 * width + 2] > 0.9, 'Strong lower-torso evidence must restore missing clothing');
  assert(fused[0] === 0, 'Upper-corner background must not be added by torso rescue');

  const rgba = new Uint8ClampedArray(10 * 10 * 4).fill(255);
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = 210;
    rgba[i + 1] = 215;
    rgba[i + 2] = 220;
    rgba[i + 3] = 255;
  }
  const estimated = estimateSourceBackgroundRgb(rgba, 10, 10);
  assert(estimated.join(',') === '210,215,220', 'Background refinement must use source backdrop color');

  console.log('✅ Segmentation mask regression tests passed');
}

runMaskRegressionTests();
