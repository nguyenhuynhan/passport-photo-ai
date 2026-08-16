const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  if (edge1 <= edge0) return value >= edge1 ? 1 : 0;
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

/**
 * RMBG already returns a soft alpha matte. Keep that information intact so a
 * second, aggressive threshold does not erase low-contrast clothes.
 */
export function normalizeRmbgAlpha(rawAlpha: number): number {
  if (!Number.isFinite(rawAlpha)) return 0;
  if (rawAlpha <= 0.01) return 0;
  if (rawAlpha >= 0.99) return 1;
  return clamp01(rawAlpha);
}

function sampleMaskBilinear(
  mask: Float32Array,
  width: number,
  height: number,
  xNorm: number,
  yNorm: number,
) {
  const gx = clamp01(xNorm) * (width - 1);
  const gy = clamp01(yNorm) * (height - 1);
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const tx = gx - x0;
  const ty = gy - y0;
  const c00 = mask[y0 * width + x0] || 0;
  const c10 = mask[y0 * width + x1] || 0;
  const c01 = mask[y1 * width + x0] || 0;
  const c11 = mask[y1 * width + x1] || 0;
  return (1 - tx) * (1 - ty) * c00 + tx * (1 - ty) * c10 +
    (1 - tx) * ty * c01 + tx * ty * c11;
}

/**
 * Conservatively restores torso/clothing pixels that RMBG misses by consulting
 * MediaPipe's independent person mask. Rescue strength ramps up below the face,
 * so fine hair and the clean upper-background boundary remain RMBG-controlled.
 */
export function fusePortraitMasks(
  primary: Float32Array,
  primaryWidth: number,
  primaryHeight: number,
  fallback: Float32Array,
  fallbackWidth: number,
  fallbackHeight: number,
): Float32Array {
  if (primary.length !== primaryWidth * primaryHeight ||
      fallback.length !== fallbackWidth * fallbackHeight ||
      primaryWidth <= 0 || primaryHeight <= 0 || fallbackWidth <= 0 || fallbackHeight <= 0) {
    return primary.slice();
  }

  const fused = primary.slice();
  for (let y = 0; y < primaryHeight; y++) {
    const yNorm = y / Math.max(1, primaryHeight - 1);
    const torsoWeight = smoothstep(0.40, 0.62, yNorm);
    if (torsoWeight <= 0) continue;

    for (let x = 0; x < primaryWidth; x++) {
      const index = y * primaryWidth + x;
      const current = clamp01(primary[index]);
      if (current >= 0.92) continue;

      const fallbackConfidence = sampleMaskBilinear(
        fallback,
        fallbackWidth,
        fallbackHeight,
        x / Math.max(1, primaryWidth - 1),
        yNorm,
      );
      const strongPersonEvidence = smoothstep(0.72, 0.92, fallbackConfidence);
      const rescued = fallbackConfidence * strongPersonEvidence * torsoWeight;
      fused[index] = Math.max(current, rescued);
    }
  }
  return fused;
}

/** Estimate the real source backdrop from top-corner patches. */
export function estimateSourceBackgroundRgb(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): [number, number, number] {
  if (rgba.length !== width * height * 4 || width <= 0 || height <= 0) {
    return [255, 255, 255];
  }

  const patchWidth = Math.max(1, Math.round(width * 0.14));
  const patchHeight = Math.max(1, Math.round(height * 0.08));
  const channels: [number[], number[], number[]] = [[], [], []];

  for (let y = 0; y < patchHeight; y++) {
    for (let localX = 0; localX < patchWidth; localX++) {
      for (const x of [localX, width - 1 - localX]) {
        const index = (y * width + x) * 4;
        channels[0].push(rgba[index]);
        channels[1].push(rgba[index + 1]);
        channels[2].push(rgba[index + 2]);
      }
    }
  }

  return channels.map((values) => {
    values.sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)] ?? 255;
  }) as [number, number, number];
}
