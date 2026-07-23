/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FilesetResolver, FaceDetector, FaceLandmarker, ImageSegmenter } from '@mediapipe/tasks-vision';
import { removeBackground } from '@imgly/background-removal';

let visionTasks: any = null;
let faceDetector: FaceDetector | null = null;
let faceLandmarker: FaceLandmarker | null = null;
let imageSegmenter: ImageSegmenter | null = null;
let initPromise: Promise<void> | null = null;

export async function initModels(onProgress?: (status: string) => void): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      onProgress?.('Đang tải công cụ xử lý (WASM)...');
      
      const localWasmPath = `${window.location.origin}/wasm`;
      const cdnWasmPath = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';

      try {
        visionTasks = await FilesetResolver.forVisionTasks(localWasmPath);
      } catch (wasmErr) {
        console.warn('Không thể tải WASM cục bộ, chuyển sang CDN:', wasmErr);
        visionTasks = await FilesetResolver.forVisionTasks(cdnWasmPath);
      }

      const faceModelLocal = `${window.location.origin}/models/blaze_face_short_range.tflite`;
      const faceModelCdn = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

      const landmarkerModelCdn = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

      const selfieModelLocal = `${window.location.origin}/models/selfie_segmenter.tflite`;
      const selfieModelCdn = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite';

      const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const preferredDelegate = isMobile ? 'CPU' : 'GPU';
      const fallbackDelegate = isMobile ? 'GPU' : 'CPU';

      onProgress?.('Đang tải mô hình Nhận diện khuôn mặt...');
      const tryLoadFaceDetector = async (modelPath: string) => {
        try {
          return await FaceDetector.createFromOptions(visionTasks, {
            baseOptions: { modelAssetPath: modelPath, delegate: preferredDelegate },
            runningMode: 'IMAGE',
            minDetectionConfidence: 0.15,
          });
        } catch {
          return await FaceDetector.createFromOptions(visionTasks, {
            baseOptions: { modelAssetPath: modelPath, delegate: fallbackDelegate },
            runningMode: 'IMAGE',
            minDetectionConfidence: 0.15,
          });
        }
      };

      try {
        faceDetector = await tryLoadFaceDetector(faceModelLocal);
      } catch {
        console.warn('Không tải được FaceDetector local, dùng CDN...');
        faceDetector = await tryLoadFaceDetector(faceModelCdn);
      }

      onProgress?.('Đang tải mô hình Lưới 3D 478 Điểm (FaceLandmarker)...');
      try {
        faceLandmarker = await FaceLandmarker.createFromOptions(visionTasks, {
          baseOptions: { modelAssetPath: landmarkerModelCdn, delegate: preferredDelegate },
          runningMode: 'IMAGE',
          numFaces: 1,
        });
      } catch {
        try {
          faceLandmarker = await FaceLandmarker.createFromOptions(visionTasks, {
            baseOptions: { modelAssetPath: landmarkerModelCdn, delegate: fallbackDelegate },
            runningMode: 'IMAGE',
            numFaces: 1,
          });
        } catch (e) {
          console.warn('Không thể khởi tạo FaceLandmarker:', e);
        }
      }

      onProgress?.('Đang tải mô hình Tách nền Selfie...');
      const tryLoadImageSegmenter = async (modelPath: string) => {
        try {
          return await ImageSegmenter.createFromOptions(visionTasks, {
            baseOptions: { modelAssetPath: modelPath, delegate: preferredDelegate },
            runningMode: 'IMAGE',
            outputCategoryMask: false,
            outputConfidenceMasks: true,
          });
        } catch {
          return await ImageSegmenter.createFromOptions(visionTasks, {
            baseOptions: { modelAssetPath: modelPath, delegate: fallbackDelegate },
            runningMode: 'IMAGE',
            outputCategoryMask: false,
            outputConfidenceMasks: true,
          });
        }
      };

      try {
        imageSegmenter = await tryLoadImageSegmenter(selfieModelLocal);
      } catch {
        console.warn('Không tải được ImageSegmenter local, dùng CDN...');
        imageSegmenter = await tryLoadImageSegmenter(selfieModelCdn);
      }

      onProgress?.('Hoàn tất tải các mô hình AI!');
    } catch (error) {
      initPromise = null;
      console.error('Lỗi khi khởi tạo mô hình AI:', error);
      throw error;
    }
  })();

  return initPromise;
}

export function isLoaded(): boolean {
  return faceDetector !== null && imageSegmenter !== null;
}

function getElementDimensions(el: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): { width: number; height: number } {
  if (el instanceof HTMLCanvasElement) {
    return { width: el.width, height: el.height };
  }
  if (el instanceof HTMLVideoElement) {
    return { width: el.videoWidth || el.width || 0, height: el.videoHeight || el.height || 0 };
  }
  return { width: el.naturalWidth || el.width || 0, height: el.naturalHeight || el.height || 0 };
}

function ensureCanvasSource(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): HTMLCanvasElement | HTMLVideoElement {
  if (imageElement instanceof HTMLCanvasElement || imageElement instanceof HTMLVideoElement) {
    return imageElement;
  }

  const dims = getElementDimensions(imageElement);
  if (dims.width <= 0 || dims.height <= 0) {
    // Return empty 1x1 canvas if image dimensions are not loaded yet
    const emptyCanvas = document.createElement('canvas');
    emptyCanvas.width = 1;
    emptyCanvas.height = 1;
    return emptyCanvas;
  }

  const canvas = document.createElement('canvas');
  const maxDim = Math.max(dims.width, dims.height);
  const scale = maxDim > 1280 ? 1280 / maxDim : 1;
  
  canvas.width = Math.max(1, Math.round(dims.width * scale));
  canvas.height = Math.max(1, Math.round(dims.height * scale));
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

export async function detectFace(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) {
  if (!faceDetector) {
    await initModels();
  }
  if (!faceDetector) {
    throw new Error('Chưa khởi tạo FaceDetector');
  }
  try {
    const source = ensureCanvasSource(imageElement);
    const faceResult = faceDetector.detect(source);
    const dims = getElementDimensions(source);
    const sourceWidth = dims.width;
    const sourceHeight = dims.height;

    if (faceResult && faceResult.detections && faceResult.detections.length > 1) {
      faceResult.detections.sort((a, b) => {
        const scoreA = (a.categories && a.categories[0]?.score) || 0.5;
        const scoreB = (b.categories && b.categories[0]?.score) || 0.5;
        const areaA = (a.boundingBox?.width || 0) * (a.boundingBox?.height || 0);
        const areaB = (b.boundingBox?.width || 0) * (b.boundingBox?.height || 0);
        return (scoreB * areaB) - (scoreA * areaA);
      });
    }

    return {
      faceResult,
      sourceWidth,
      sourceHeight,
    };
  } catch (err) {
    console.warn('Lỗi khi gọi MediaPipe detectFace:', err);
    return {
      faceResult: null,
      sourceWidth: 0,
      sourceHeight: 0,
    };
  }
}

export async function detectFaceLandmarks(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) {
  if (!faceLandmarker) {
    try {
      await initModels();
    } catch (e) {
      console.warn('FaceLandmarker init skipped:', e);
    }
  }
  if (!faceLandmarker) return null;

  try {
    const source = ensureCanvasSource(imageElement);
    const result = faceLandmarker.detect(source);
    const dims = getElementDimensions(source);
    return {
      landmarksResult: result,
      sourceWidth: dims.width,
      sourceHeight: dims.height,
    };
  } catch (err) {
    console.warn('Lỗi khi gọi MediaPipe detectFaceLandmarks:', err);
    return null;
  }
}

export async function segmentSelfie(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) {
  if (!imageSegmenter) {
    await initModels();
  }
  if (!imageSegmenter) {
    throw new Error('Chưa khởi tạo ImageSegmenter');
  }
  try {
    const source = ensureCanvasSource(imageElement);
    return imageSegmenter.segment(source);
  } catch (err) {
    console.warn('Lỗi khi gọi MediaPipe segmentSelfie:', err);
    return null;
  }
}

export async function segmentHighQuality(
  imageSource: HTMLImageElement | HTMLCanvasElement | string,
  onProgress?: (progressPct: number, status: string) => void
): Promise<{ cutoutCanvas: HTMLCanvasElement; maskData: Float32Array; width: number; height: number } | null> {
  try {
    onProgress?.(0, 'Đang chuẩn bị mô hình AI RMBG...');
    
    let sourceInput: string | Blob = typeof imageSource === 'string' ? imageSource : '';
    if (imageSource instanceof HTMLImageElement) {
      if (!imageSource.complete || !imageSource.naturalWidth) {
        return null;
      }
      sourceInput = imageSource.src;
    } else if (imageSource instanceof HTMLCanvasElement) {
      const canvasBlob = await new Promise<Blob | null>((resolve) => imageSource.toBlob(resolve, 'image/png'));
      if (!canvasBlob) return null;
      sourceInput = canvasBlob;
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('RMBG processing timeout (90s)')), 90000)
    );

    const blob = await Promise.race([
      removeBackground(sourceInput, {
        progress: (key, current, total) => {
          if (total > 0) {
            const pct = Math.round((current / total) * 100);
            onProgress?.(pct, `Đang tải mô hình AI RMBG...`);
          }
        },
        model: 'isnet_fp16',
        output: {
          format: 'image/png',
          quality: 1.0,
        }
      }),
      timeoutPromise
    ]);

    const img = new Image();
    const url = URL.createObjectURL(blob);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
      img.src = url;
    });

    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    const cutoutCanvas = document.createElement('canvas');
    cutoutCanvas.width = width;
    cutoutCanvas.height = height;
    const ctx = cutoutCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const maskData = new Float32Array(width * height);

    for (let i = 0; i < maskData.length; i++) {
      const rawAlpha = data[i * 4 + 3] / 255;
      // Aggressive background noise cutoff (rawAlpha < 0.55) to eliminate grey wall artifacts
      if (rawAlpha < 0.55) {
        maskData[i] = 0;
      } else if (rawAlpha > 0.85) {
        maskData[i] = 1;
      } else {
        const t = (rawAlpha - 0.55) / 0.30;
        maskData[i] = t * t * (3 - 2 * t);
      }
    }

    return {
      cutoutCanvas,
      maskData,
      width,
      height,
    };
  } catch (err) {
    console.warn('Lỗi khi chạy mô hình RMBG tách nền cao cấp:', err);
    return null;
  }
}



/**
 * Applies segmentation mask to a canvas using bilinear sampling, smoothstep thresholding, and edge refinement.
 */
export function applyHighQualitySegmentationMask(
  ctx: CanvasRenderingContext2D,
  workWidth: number,
  workHeight: number,
  maskData: Float32Array,
  maskWidth: number,
  maskHeight: number,
  bgColor: string,
  edgeFeather: number = 0.5
) {
  const imgData = ctx.getImageData(0, 0, workWidth, workHeight);
  const data = imgData.data;

  let bgR = 255, bgG = 255, bgB = 255, bgA = 1;
  if (bgColor === 'transparent') {
    bgA = 0;
  } else {
    const hex = bgColor.replace('#', '');
    bgR = parseInt(hex.substring(0, 2), 16);
    bgG = parseInt(hex.substring(2, 4), 16);
    bgB = parseInt(hex.substring(4, 6), 16);
  }

  const lowThreshold = Math.max(0.02, 0.12 - edgeFeather * 0.05);
  const highThreshold = Math.min(0.98, 0.86 + edgeFeather * 0.05);
  const thresholdRange = highThreshold - lowThreshold || 1;

  for (let y = 0; y < workHeight; y++) {
    const yNorm = y / (workHeight - 1 || 1);
    for (let x = 0; x < workWidth; x++) {
      const xNorm = x / (workWidth - 1 || 1);
      const pixelIndex = (y * workWidth + x) * 4;

      // Bilinear mask interpolation for smooth sub-pixel confidence sampling
      const gx = xNorm * (maskWidth - 1);
      const gy = yNorm * (maskHeight - 1);
      const gx0 = Math.floor(gx);
      const gy0 = Math.floor(gy);
      const gx1 = Math.min(maskWidth - 1, gx0 + 1);
      const gy1 = Math.min(maskHeight - 1, gy0 + 1);
      const tx = gx - gx0;
      const ty = gy - gy0;

      const c00 = maskData[gy0 * maskWidth + gx0] || 0;
      const c10 = maskData[gy0 * maskWidth + gx1] || 0;
      const c01 = maskData[gy1 * maskWidth + gx0] || 0;
      const c11 = maskData[gy1 * maskWidth + gx1] || 0;

      const rawConfidence = (1 - tx) * (1 - ty) * c00 + tx * (1 - ty) * c10 + (1 - tx) * ty * c01 + tx * ty * c11;

      // Color-Guided Alpha Refinement for spotless background output
      let confidence = 0;
      const bgCutoff = Math.max(0.18, 0.25 - edgeFeather * 0.08);
      const fgCutoff = Math.min(0.92, 0.65 + edgeFeather * 0.10);

      if (rawConfidence <= bgCutoff) {
        confidence = 0;
      } else if (rawConfidence >= fgCutoff) {
        confidence = 1;
      } else {
        const normT = (rawConfidence - bgCutoff) / (fgCutoff - bgCutoff || 1);
        const smoothT = normT * normT * (3 - 2 * normT);

        // Color-guided edge matting: evaluate color distance to background wall
        const origR = data[pixelIndex];
        const origG = data[pixelIndex + 1];
        const origB = data[pixelIndex + 2];
        const colorDiffToBg = Math.hypot(origR - bgR, origG - bgG, origB - bgB);

        if (colorDiffToBg < 32 && bgColor !== 'transparent') {
          // Pixel color matches background wall closely => clean up background noise
          confidence = smoothT * Math.pow(colorDiffToBg / 32, 1.5);
        } else {
          confidence = smoothT;
        }
      }

      const origR = data[pixelIndex];
      const origG = data[pixelIndex + 1];
      const origB = data[pixelIndex + 2];
      const origA = data[pixelIndex + 3] / 255;

      const finalAlpha = origA * confidence + bgA * (1 - confidence);

      if (finalAlpha > 0.001) {
        data[pixelIndex] = Math.round(origR * confidence + bgR * (1 - confidence));
        data[pixelIndex + 1] = Math.round(origG * confidence + bgG * (1 - confidence));
        data[pixelIndex + 2] = Math.round(origB * confidence + bgB * (1 - confidence));
        data[pixelIndex + 3] = Math.round(finalAlpha * 255);
      } else {
        data[pixelIndex + 3] = 0;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
