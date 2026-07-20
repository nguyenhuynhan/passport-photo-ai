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
      
      visionTasks = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
      );

      onProgress?.('Đang tải mô hình Nhận diện khuôn mặt...');
      try {
        faceDetector = await FaceDetector.createFromOptions(visionTasks, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
            delegate: 'GPU',
          },
          runningMode: 'IMAGE',
          minDetectionConfidence: 0.2,
        });
      } catch (gpuError) {
        console.warn('Không khởi tạo được GPU delegate cho FaceDetector, chuyển sang CPU:', gpuError);
        faceDetector = await FaceDetector.createFromOptions(visionTasks, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
            delegate: 'CPU',
          },
          runningMode: 'IMAGE',
          minDetectionConfidence: 0.2,
        });
      }

      onProgress?.('Đang tải mô hình Tách nền Selfie...');
      try {
        imageSegmenter = await ImageSegmenter.createFromOptions(visionTasks, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite',
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
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite',
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

function ensureCanvasSource(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): HTMLCanvasElement | HTMLVideoElement | HTMLCanvasElement {
  if (imageElement instanceof HTMLImageElement) {
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.naturalWidth || imageElement.width;
    canvas.height = imageElement.naturalHeight || imageElement.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(imageElement, 0, 0);
      return canvas;
    }
  }
  return imageElement;
}

export async function detectFace(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) {
  if (!faceDetector) {
    await initModels();
  }
  if (!faceDetector) {
    throw new Error('Chưa khởi tạo FaceDetector');
  }
  const source = ensureCanvasSource(imageElement);
  return faceDetector.detect(source);
}

export async function segmentSelfie(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) {
  if (!imageSegmenter) {
    await initModels();
  }
  if (!imageSegmenter) {
    throw new Error('Chưa khởi tạo ImageSegmenter');
  }
  const source = ensureCanvasSource(imageElement);
  return imageSegmenter.segment(source);
}

