export type PassportQualityIssueCode =
  | 'background_not_white'
  | 'background_not_uniform'
  | 'light_clothing_blends_with_background';

export interface PassportQualityIssue {
  code: PassportQualityIssueCode;
  severity: 'warning' | 'error';
}

export interface PassportQualityReport {
  issues: PassportQualityIssue[];
  metrics: {
    backgroundMeanLuma: number;
    backgroundLumaStdDev: number;
    backgroundColorCast: number;
    lowerLightClothingRatio: number;
  };
}

const luma = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

/**
 * Local preflight for Vietnam's white-background passport upload.
 *
 * The lower-edge check is intentional: automated portrait validators often
 * start background-region growing from image borders. A white/patterned shirt
 * touching those borders can therefore be mistaken for a non-uniform grey
 * backdrop even when the replaced background itself is RGB(255,255,255).
 */
export function analyzeVietnamPassportPixels(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): PassportQualityReport {
  const emptyReport: PassportQualityReport = {
    issues: [{ code: 'background_not_uniform', severity: 'error' }],
    metrics: {
      backgroundMeanLuma: 0,
      backgroundLumaStdDev: 0,
      backgroundColorCast: 0,
      lowerLightClothingRatio: 0,
    },
  };

  if (width <= 0 || height <= 0 || rgba.length !== width * height * 4) {
    return emptyReport;
  }

  // Keep the analysis inexpensive for a 1200x1800 export while preserving the
  // broad regions used by automated background checks.
  const sampleStep = Math.max(1, Math.floor(Math.max(width, height) / 450));
  const sampleWidth = Math.ceil(width / sampleStep);
  const sampleHeight = Math.ceil(height / sampleStep);
  const sampled = new Uint8Array(sampleWidth * sampleHeight * 3);

  for (let sy = 0; sy < sampleHeight; sy++) {
    const y = Math.min(height - 1, sy * sampleStep);
    for (let sx = 0; sx < sampleWidth; sx++) {
      const x = Math.min(width - 1, sx * sampleStep);
      const sourceIndex = (y * width + x) * 4;
      const targetIndex = (sy * sampleWidth + sx) * 3;
      sampled[targetIndex] = rgba[sourceIndex];
      sampled[targetIndex + 1] = rgba[sourceIndex + 1];
      sampled[targetIndex + 2] = rgba[sourceIndex + 2];
    }
  }

  // The upper 8% must be empty white background for the Vietnam 4x6 crop. It
  // is also the safest region for measuring the actual replacement colour.
  const upperRows = Math.max(1, Math.floor(sampleHeight * 0.08));
  let lumaSum = 0;
  let lumaSquaredSum = 0;
  let redSum = 0;
  let greenSum = 0;
  let blueSum = 0;
  let backgroundSamples = 0;

  for (let y = 0; y < upperRows; y++) {
    for (let x = 0; x < sampleWidth; x++) {
      const index = (y * sampleWidth + x) * 3;
      const r = sampled[index];
      const g = sampled[index + 1];
      const b = sampled[index + 2];
      const value = luma(r, g, b);
      lumaSum += value;
      lumaSquaredSum += value * value;
      redSum += r;
      greenSum += g;
      blueSum += b;
      backgroundSamples++;
    }
  }

  const backgroundMeanLuma = lumaSum / backgroundSamples;
  const variance = Math.max(0, lumaSquaredSum / backgroundSamples - backgroundMeanLuma ** 2);
  const backgroundLumaStdDev = Math.sqrt(variance);
  const meanR = redSum / backgroundSamples;
  const meanG = greenSum / backgroundSamples;
  const meanB = blueSum / backgroundSamples;
  const backgroundColorCast = Math.max(meanR, meanG, meanB) - Math.min(meanR, meanG, meanB);

  // Inspect only the lower centre, where the shirt should be. Bright pixels
  // beside the shoulders are valid background, whereas a large bright area in
  // this central region is a meaningful risk even when the shirt has coloured
  // stripes and is therefore not neutral white.
  const lowerStartY = Math.floor(sampleHeight * 0.80);
  const centreStartX = Math.floor(sampleWidth * 0.20);
  const centreEndX = Math.max(centreStartX + 1, Math.ceil(sampleWidth * 0.80));
  let lowerLightPixels = 0;
  let lowerSamples = 0;
  for (let y = lowerStartY; y < sampleHeight; y++) {
    for (let x = centreStartX; x < centreEndX; x++) {
      const index = (y * sampleWidth + x) * 3;
      if (luma(sampled[index], sampled[index + 1], sampled[index + 2]) >= 185) {
        lowerLightPixels++;
      }
      lowerSamples++;
    }
  }
  const lowerLightClothingRatio = lowerLightPixels / Math.max(1, lowerSamples);

  const issues: PassportQualityIssue[] = [];
  if (backgroundMeanLuma < 245 || backgroundColorCast > 10) {
    issues.push({ code: 'background_not_white', severity: 'error' });
  }
  if (backgroundLumaStdDev > 8) {
    issues.push({ code: 'background_not_uniform', severity: 'error' });
  }
  if (lowerLightClothingRatio > 0.15) {
    issues.push({ code: 'light_clothing_blends_with_background', severity: 'warning' });
  }

  return {
    issues,
    metrics: {
      backgroundMeanLuma: Number(backgroundMeanLuma.toFixed(1)),
      backgroundLumaStdDev: Number(backgroundLumaStdDev.toFixed(1)),
      backgroundColorCast: Number(backgroundColorCast.toFixed(1)),
      lowerLightClothingRatio: Number(lowerLightClothingRatio.toFixed(3)),
    },
  };
}
