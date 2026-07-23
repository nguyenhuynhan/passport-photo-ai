/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FilesetResolver, FaceDetector, FaceLandmarker, ImageSegmenter } from '@mediapipe/tasks-vision';

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

      onProgress?.('Đang tải mô hình Nhận diện khuôn mặt...');
      const tryLoadFaceDetector = async (modelPath: string) => {
        try {
          return await FaceDetector.createFromOptions(visionTasks, {
            baseOptions: { modelAssetPath: modelPath, delegate: 'GPU' },
            runningMode: 'IMAGE',
            minDetectionConfidence: 0.15,
          });
        } catch {
          return await FaceDetector.createFromOptions(visionTasks, {
            baseOptions: { modelAssetPath: modelPath, delegate: 'CPU' },
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
          baseOptions: { modelAssetPath: landmarkerModelCdn, delegate: 'GPU' },
          runningMode: 'IMAGE',
          numFaces: 1,
        });
      } catch {
        try {
          faceLandmarker = await FaceLandmarker.createFromOptions(visionTasks, {
            baseOptions: { modelAssetPath: landmarkerModelCdn, delegate: 'CPU' },
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
            baseOptions: { modelAssetPath: modelPath, delegate: 'GPU' },
            runningMode: 'IMAGE',
            outputCategoryMask: false,
            outputConfidenceMasks: true,
          });
        } catch {
          return await ImageSegmenter.createFromOptions(visionTasks, {
            baseOptions: { modelAssetPath: modelPath, delegate: 'CPU' },
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
