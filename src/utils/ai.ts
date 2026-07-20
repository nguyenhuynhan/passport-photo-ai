/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FilesetResolver, FaceDetector, ImageSegmenter } from '@mediapipe/tasks-vision';

let visionTasks: any = null;
let faceDetector: FaceDetector | null = null;
let imageSegmenter: ImageSegmenter | null = null;
let initPromise: Promise<void> | null = null;

export async function initModels(onProgress?: (status: string) => void): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      onProgress?.('Đang tải công cụ xử lý (WASM)...');
      
      const wasmPath = `${window.location.origin}/wasm`;
      visionTasks = await FilesetResolver.forVisionTasks(wasmPath);

      const faceModelPath = `${window.location.origin}/models/blaze_face_short_range.tflite`;
      const selfieModelPath = `${window.location.origin}/models/selfie_segmenter.tflite`;

      onProgress?.('Đang tải mô hình Nhận diện khuôn mặt...');
      try {
        faceDetector = await FaceDetector.createFromOptions(visionTasks, {
          baseOptions: {
            modelAssetPath: faceModelPath,
            delegate: 'GPU',
          },
          runningMode: 'IMAGE',
          minDetectionConfidence: 0.15,
        });
      } catch (gpuError) {
        console.warn('Không khởi tạo được GPU delegate cho FaceDetector, chuyển sang CPU:', gpuError);
        faceDetector = await FaceDetector.createFromOptions(visionTasks, {
          baseOptions: {
            modelAssetPath: faceModelPath,
            delegate: 'CPU',
          },
          runningMode: 'IMAGE',
          minDetectionConfidence: 0.15,
        });
      }

      onProgress?.('Đang tải mô hình Tách nền Selfie...');
      try {
        imageSegmenter = await ImageSegmenter.createFromOptions(visionTasks, {
          baseOptions: {
            modelAssetPath: selfieModelPath,
            delegate: 'GPU',
          },
          runningMode: 'IMAGE',
          outputCategoryMask: false,
          outputConfidenceMasks: true,
        });
      } catch (gpuError) {
        console.warn('Không khởi tạo được GPU delegate cho ImageSegmenter, chuyển sang CPU:', gpuError);
        imageSegmenter = await ImageSegmenter.createFromOptions(visionTasks, {
          baseOptions: {
            modelAssetPath: selfieModelPath,
            delegate: 'CPU',
          },
          runningMode: 'IMAGE',
          outputCategoryMask: false,
          outputConfidenceMasks: true,
        });
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
    return { width: el.videoWidth || el.width || 600, height: el.videoHeight || el.height || 600 };
  }
  return { width: el.naturalWidth || el.width || 600, height: el.naturalHeight || el.height || 600 };
}

function ensureCanvasSource(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): HTMLCanvasElement | HTMLVideoElement {
  if (imageElement instanceof HTMLCanvasElement || imageElement instanceof HTMLVideoElement) {
    return imageElement;
  }

  const canvas = document.createElement('canvas');
  const dims = getElementDimensions(imageElement);
  
  // Scale down if image is huge (> 1280px) to make face detection much faster and more accurate for BlazeFace
  const maxDim = Math.max(dims.width, dims.height);
  const scale = maxDim > 1280 ? 1280 / maxDim : 1;
  
  canvas.width = Math.round(dims.width * scale);
  canvas.height = Math.round(dims.height * scale);
  
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

    // Sort detections by confidence * box area to ensure primary face comes first
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


