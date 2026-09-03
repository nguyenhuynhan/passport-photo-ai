import { analyzeVietnamPassportPixels } from './passportQuality';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function makeImage(width: number, height: number, rgb: [number, number, number]) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = rgb[0];
    rgba[i + 1] = rgb[1];
    rgba[i + 2] = rgb[2];
    rgba[i + 3] = 255;
  }
  return rgba;
}

function fillRect(
  rgba: Uint8ClampedArray,
  width: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  rgb: [number, number, number],
) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const index = (y * width + x) * 4;
      rgba[index] = rgb[0];
      rgba[index + 1] = rgb[1];
      rgba[index + 2] = rgb[2];
    }
  }
}

const width = 120;
const height = 180;

const compliant = makeImage(width, height, [255, 255, 255]);
fillRect(compliant, width, 35, 20, 85, 125, [90, 70, 60]);
fillRect(compliant, width, 20, 125, 100, height, [35, 55, 80]);
const compliantReport = analyzeVietnamPassportPixels(compliant, width, height);
assert(
  compliantReport.issues.length === 0,
  'White background beside dark clothing should pass local preflight',
);

const paleShirt = makeImage(width, height, [255, 255, 255]);
fillRect(paleShirt, width, 35, 20, 85, 125, [90, 70, 60]);
fillRect(paleShirt, width, 20, 125, 100, height, [215, 215, 212]);
const paleShirtReport = analyzeVietnamPassportPixels(paleShirt, width, height);
assert(
  paleShirtReport.issues.some((issue) => issue.code === 'light_clothing_blends_with_background'),
  'Pale clothing touching the image border must be reported as a VNeID segmentation risk',
);

const greyBackground = makeImage(width, height, [225, 225, 225]);
fillRect(greyBackground, width, 35, 20, 85, 125, [90, 70, 60]);
fillRect(greyBackground, width, 0, 125, width, height, [35, 55, 80]);
const greyReport = analyzeVietnamPassportPixels(greyBackground, width, height);
assert(
  greyReport.issues.some((issue) => issue.code === 'background_not_white'),
  'Grey background must fail the local white-background check',
);

console.log('✅ Vietnam passport local preflight regression tests passed');
