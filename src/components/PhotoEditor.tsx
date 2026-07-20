/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
  Maximize2, RotateCcw, ZoomIn, ZoomOut, Check, Sliders, 
  Sparkles, RefreshCw, Scissors, Compass, Sun, Eye, EyeOff
} from 'lucide-react';
import { PhotoPreset, PassportStandard, ImageAdjustments, DEFAULT_ADJUSTMENTS, BG_COLOR_OPTIONS } from '../types';
import { detectFace, segmentSelfie } from '../utils/ai';
import { Language, TRANSLATIONS } from '../locales/translations';

interface PhotoEditorProps {
  imageSrc: string;
  preset: PhotoPreset;
  language?: Language;
  onSave: (outputBase64: string) => void;
}

export default function PhotoEditor({ imageSrc, preset, language = 'vi', onSave }: PhotoEditorProps) {
  const t = TRANSLATIONS[language];

  const getPresetName = (presetId: PassportStandard) => {
    switch (presetId) {
      case PassportStandard.VIETNAM_4x6: return t.presetVi4x6Name;
      case PassportStandard.VIETNAM_3x4: return t.presetVi3x4Name;
      case PassportStandard.CHINA_VISA: return t.presetChinaName;
      case PassportStandard.US_VISA: return t.presetUsVisaName;
      case PassportStandard.SCHENGEN: return t.presetSchengenName;
      case PassportStandard.CUSTOM: return t.presetCustomName;
    }
  };

  const getPresetDesc = (presetId: PassportStandard) => {
    switch (presetId) {
      case PassportStandard.VIETNAM_4x6: return t.presetVi4x6Desc;
      case PassportStandard.VIETNAM_3x4: return t.presetVi3x4Desc;
      case PassportStandard.CHINA_VISA: return t.presetChinaDesc;
      case PassportStandard.US_VISA: return t.presetUsVisaDesc;
      case PassportStandard.SCHENGEN: return t.presetSchengenDesc;
      case PassportStandard.CUSTOM: return t.presetCustomDesc;
    }
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  
  // Offscreen canvas for background segmentation blending
  const segmentedCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({ ...DEFAULT_ADJUSTMENTS });
  const [initialAdjustments, setInitialAdjustments] = useState<ImageAdjustments | null>(null);
  const [bgColor, setBgColor] = useState<string>(preset.defaultBgColor);
  const [removeBg, setRemoveBg] = useState<boolean>(true);
  const [showGuide, setShowGuide] = useState<boolean>(true);
  
  // AI processing states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [aiLog, setAiLog] = useState<string>('');
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [segmentationMask, setSegmentationMask] = useState<Float32Array | null>(null);
  const [maskWidth, setMaskWidth] = useState<number>(0);
  const [maskHeight, setMaskHeight] = useState<number>(0);

  // Dimensions of original loaded image
  const [imgWidth, setImgWidth] = useState<number>(0);
  const [imgHeight, setImgHeight] = useState<number>(0);
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);

  // Load preset defaults when preset changes
  useEffect(() => {
    setBgColor(preset.defaultBgColor);
  }, [preset]);

  // Load original image and run AI on mount/change
  useEffect(() => {
    if (!imageSrc) return;

    // Reset previous image states
    setLoadedImg(null);
    originalImageRef.current = null;
    setSegmentationMask(null);
    setFaceDetected(false);
    setInitialAdjustments(null);
    setAdjustments({ ...DEFAULT_ADJUSTMENTS });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.src = imageSrc;
    
    img.onload = async () => {
      originalImageRef.current = img;
      setImgWidth(img.width);
      setImgHeight(img.height);
      setLoadedImg(img);

      // Immediately render base image to offscreen canvas so preview shows right away
      if (!segmentedCanvasRef.current) {
        segmentedCanvasRef.current = document.createElement('canvas');
      }
      const segCanvas = segmentedCanvasRef.current;
      segCanvas.width = img.width;
      segCanvas.height = img.height;
      const ctx = segCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }

      // Run AI
      await runAIProcessing(img);
    };

    img.onerror = (err) => {
      console.error('Lỗi khi tải ảnh:', err);
      setIsProcessing(false);
    };
  }, [imageSrc]);

  // Run face detection and segmentation with Hybrid Alignment algorithm
  const runAIProcessing = async (img: HTMLImageElement) => {
    if (!img || !img.width || !img.height) return;

    setIsProcessing(true);
    setAiLog(t.aiProcessingStep1);
    // Yield to browser UI thread so loading spinner renders immediately
    await new Promise((r) => setTimeout(r, 60));

    try {
      // 1. Run Segmentation
      let maskData: Float32Array | null = null;
      let mWidth = 0;
      let mHeight = 0;

      try {
        setAiLog(t.aiProcessingStep2);
        const segmentResult = await segmentSelfie(img);
        if (segmentResult && segmentResult.confidenceMasks && segmentResult.confidenceMasks.length > 0) {
          // MediaPipe SelfieSegmenter with outputConfidenceMasks=true returns:
          // index 0: Background confidence mask
          // index 1: Person (Foreground) confidence mask
          const personMaskIndex = segmentResult.confidenceMasks.length > 1 ? 1 : 0;
          const mask = segmentResult.confidenceMasks[personMaskIndex];
          maskData = mask.getAsFloat32Array();
          mWidth = mask.width;
          mHeight = mask.height;
          setSegmentationMask(maskData);
          setMaskWidth(mWidth);
          setMaskHeight(mHeight);
        }
      } catch (segErr) {
        console.warn('Lỗi phân tách nền:', segErr);
      }

      // 2. Run Face Detection
      let faceFound = false;

      try {
        setAiLog(t.aiProcessingStep3);
        const detectRes = await detectFace(img);
        const { faceResult, sourceWidth, sourceHeight } = detectRes;

        if (faceResult && faceResult.detections && faceResult.detections.length > 0) {
          const detection = faceResult.detections[0];
          const box = detection.boundingBox;

          if (box && sourceWidth > 0 && sourceHeight > 0) {
            faceFound = true;
            setFaceDetected(true);
            setAiLog(t.aiFaceFound);

            // Extract keypoints (normalized 0..1 relative to detection source)
            let normRightEyeX = 0, normRightEyeY = 0;
            let normLeftEyeX = 0, normLeftEyeY = 0;
            let normMouthY = 0;
            let hasKeypoints = false;

            if (detection.keypoints && detection.keypoints.length >= 2) {
              hasKeypoints = true;
              normRightEyeX = detection.keypoints[0].x;
              normRightEyeY = detection.keypoints[0].y;
              normLeftEyeX = detection.keypoints[1].x;
              normLeftEyeY = detection.keypoints[1].y;

              if (detection.keypoints.length >= 4) {
                normMouthY = detection.keypoints[3].y;
              }
            }

            // Calculate rotation angle to level the eye line
            let rotationAngle = 0;
            if (hasKeypoints) {
              const dx = normLeftEyeX - normRightEyeX;
              const dy = normLeftEyeY - normRightEyeY;
              const rawAngle = -Math.atan2(dy, dx) * (180 / Math.PI);
              // Clamp tilt angle to +/- 15 degrees for stability
              rotationAngle = Math.max(-15, Math.min(15, rawAngle));
            }

            // Normalized face center & eye center
            const normFaceCenterX = hasKeypoints 
              ? (normRightEyeX + normLeftEyeX) / 2 
              : (box.originX + box.width / 2) / sourceWidth;

            const normEyeCenterY = hasKeypoints 
              ? (normRightEyeY + normLeftEyeY) / 2 
              : (box.originY + box.height * 0.35) / sourceHeight;

            const normEyeDistance = hasKeypoints 
              ? Math.hypot(normLeftEyeX - normRightEyeX, normLeftEyeY - normRightEyeY) 
              : (box.width / sourceWidth) * 0.5;

            // Step A: Find Top of Head (Hairline/Top Head) using Segmentation Mask scan around face center
            let normTopHeadY = -1;
            if (maskData && mWidth > 0 && mHeight > 0) {
              const scanCenterX = Math.floor(normFaceCenterX * mWidth);
              const scanHalfWidth = Math.max(3, Math.floor(normEyeDistance * mWidth * 0.9));
              const startX = Math.max(0, scanCenterX - scanHalfWidth);
              const endX = Math.min(mWidth - 1, scanCenterX + scanHalfWidth);

              // Find topmost pixel row where mask confidence > 0.35
              for (let y = 0; y < mHeight; y++) {
                let foundRow = false;
                for (let x = startX; x <= endX; x++) {
                  if (maskData[y * mWidth + x] > 0.35) {
                    normTopHeadY = y / mHeight;
                    foundRow = true;
                    break;
                  }
                }
                if (foundRow) break;
              }
            }

            // Fallback / Validation with Anatomical Proportions
            // Human proportion: Top of head is approx 1.35x eyeDistance above eye line
            const geomTopHeadY = Math.max(0.01, normEyeCenterY - 1.35 * normEyeDistance);

            if (normTopHeadY <= 0 || (normEyeCenterY - normTopHeadY) < 0.6 * normEyeDistance || (normEyeCenterY - normTopHeadY) > 2.2 * normEyeDistance) {
              normTopHeadY = geomTopHeadY;
            }

            // Step B: Find Chin Y
            let normChinY = 0;
            if (normMouthY > 0) {
              normChinY = normMouthY + 0.65 * normEyeDistance;
            } else {
              normChinY = normEyeCenterY + 1.60 * normEyeDistance;
            }
            normChinY = Math.min(0.99, normChinY);

            // Step C: Calculate Full Head Height
            const normFullHeadHeight = Math.max(0.18, normChinY - normTopHeadY);

            // Output Dimensions
            const standardCanvasHeight = 600;
            const standardCanvasWidth = standardCanvasHeight * preset.aspectRatio;

            // Target head height on canvas based on overlay guidelines
            const targetHeadHeightPercent = (preset.overlaySpecs.chinPercent - preset.overlaySpecs.headTopPercent) / 100;
            const targetHeadHeightPx = standardCanvasHeight * targetHeadHeightPercent;

            // Base scale to fit entire image into canvas
            const baseScale = Math.min(standardCanvasWidth / img.width, standardCanvasHeight / img.height);
            
            // Calculate exact scale required to fit head height into guideline box
            const headScaleNeeded = targetHeadHeightPx / (normFullHeadHeight * img.height);
            
            // Zoom factor relative to base scale
            const calculatedZoom = headScaleNeeded / baseScale;
            const rawZoom = Math.max(0.65, Math.min(1.75, calculatedZoom));
            const zoom = isFinite(rawZoom) && rawZoom > 0 ? rawZoom : 1.0;
            const finalScale = baseScale * zoom;

            // Align top of head EXACTLY with preset overlay's headTopPercent (e.g. 12% of canvas height)
            const targetHeadTopPxOnCanvas = (preset.overlaySpecs.headTopPercent / 100) * standardCanvasHeight;
            
            // Horizontal centering offset:
            const rawOffsetX = (0.5 - normFaceCenterX) * img.width * finalScale;
            
            // Vertical offset: position normTopHeadY at targetHeadTopPxOnCanvas
            const rawOffsetY = targetHeadTopPxOnCanvas - (standardCanvasHeight / 2) - (normTopHeadY - 0.5) * img.height * finalScale;

            // Clamp offsets safely so image doesn't get pushed off canvas
            const targetOffsetX = Math.max(-180, Math.min(180, isFinite(rawOffsetX) ? rawOffsetX : 0));
            const targetOffsetY = Math.max(-180, Math.min(180, isFinite(rawOffsetY) ? rawOffsetY : 0));

            const computedAdjustments: ImageAdjustments = {
              ...DEFAULT_ADJUSTMENTS,
              zoom: Number(zoom.toFixed(2)),
              rotation: Number((isFinite(rotationAngle) ? rotationAngle : 0).toFixed(1)),
              offsetX: Number(targetOffsetX.toFixed(0)),
              offsetY: Number(targetOffsetY.toFixed(0)),
            };
            setAdjustments(computedAdjustments);
            setInitialAdjustments(computedAdjustments);
          }
        }
      } catch (faceErr) {
        console.warn('Lỗi phát hiện khuôn mặt:', faceErr);
      }

      // 3. Smart Fallback using Segmentation Mask if Face Detection was empty
      if (!faceFound && maskData && mWidth > 0 && mHeight > 0) {
        let minY = mHeight, maxY = 0, minX = mWidth, maxX = 0;
        let count = 0;

        for (let y = 0; y < mHeight; y++) {
          for (let x = 0; x < mWidth; x++) {
            const confidence = maskData[y * mWidth + x];
            if (confidence > 0.35) {
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              count++;
            }
          }
        }

        if (count > 50 && minY < maxY) {
          faceFound = true;
          setFaceDetected(true);
          setAiLog(t.aiSmartFallback);

          const normTopHeadY = minY / mHeight;
          const normFaceCenterX = ((minX + maxX) / 2) / mWidth;
          const normPersonHeight = (maxY - minY) / mHeight;

          const normFullHeadHeight = Math.min(0.35, normPersonHeight * 0.35);

          const standardCanvasHeight = 600;
          const standardCanvasWidth = standardCanvasHeight * preset.aspectRatio;

          const baseScale = Math.min(standardCanvasWidth / img.width, standardCanvasHeight / img.height);
          const targetHeadHeightPercent = (preset.overlaySpecs.chinPercent - preset.overlaySpecs.headTopPercent) / 100;
          const targetHeadHeightPx = standardCanvasHeight * targetHeadHeightPercent;
          const headScaleNeeded = targetHeadHeightPx / (normFullHeadHeight * img.height);

          const calculatedZoom = headScaleNeeded / baseScale;
          const rawZoom = Math.max(0.70, Math.min(1.40, calculatedZoom));
          const zoom = isFinite(rawZoom) && rawZoom > 0 ? rawZoom : 1.0;
          const finalScale = baseScale * zoom;

          const targetHeadTopPxOnCanvas = (preset.overlaySpecs.headTopPercent / 100) * standardCanvasHeight;
          const rawOffsetX = (0.5 - normFaceCenterX) * img.width * finalScale;
          const rawOffsetY = targetHeadTopPxOnCanvas - (standardCanvasHeight / 2) - (normTopHeadY - 0.5) * img.height * finalScale;

          const targetOffsetX = Math.max(-180, Math.min(180, isFinite(rawOffsetX) ? rawOffsetX : 0));
          const targetOffsetY = Math.max(-180, Math.min(180, isFinite(rawOffsetY) ? rawOffsetY : 0));

          const computedAdjustments: ImageAdjustments = {
            ...DEFAULT_ADJUSTMENTS,
            zoom: Number(zoom.toFixed(2)),
            rotation: 0,
            offsetX: Number(targetOffsetX.toFixed(0)),
            offsetY: Number(targetOffsetY.toFixed(0)),
          };
          setAdjustments(computedAdjustments);
          setInitialAdjustments(computedAdjustments);
        }
      }

      if (!faceFound) {
        setFaceDetected(false);
        setAiLog(t.aiNoFace);
        setInitialAdjustments({ ...DEFAULT_ADJUSTMENTS });
      }
    } catch (err) {
      console.error('Lỗi khi chạy mô hình AI cục bộ:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Restore initial AI alignment calculation
  const restoreInitialAlign = () => {
    if (initialAdjustments) {
      setAdjustments({ ...initialAdjustments });
    } else {
      setAdjustments({ ...DEFAULT_ADJUSTMENTS });
    }
  };

  // Generate the segmented image on offscreen canvas whenever original image, mask, removeBg state, or bgColor changes
  useEffect(() => {
    const originalImg = loadedImg || originalImageRef.current;
    if (!originalImg || !originalImg.width || !originalImg.height) return;

    // Create offscreen canvas if it doesn't exist
    if (!segmentedCanvasRef.current) {
      segmentedCanvasRef.current = document.createElement('canvas');
    }
    const segCanvas = segmentedCanvasRef.current;
    segCanvas.width = originalImg.width;
    segCanvas.height = originalImg.height;

    const ctx = segCanvas.getContext('2d');
    if (!ctx) return;

    // Draw original image first
    ctx.drawImage(originalImg, 0, 0);

    // Apply segmentation mask if enabled
    if (removeBg && segmentationMask && maskWidth > 0 && maskHeight > 0) {
      const imgData = ctx.getImageData(0, 0, originalImg.width, originalImg.height);
      const data = imgData.data;

      // Parse background color hex to RGB
      let bgR = 255, bgG = 255, bgB = 255, bgA = 1;
      if (bgColor === 'transparent') {
        bgA = 0;
      } else {
        const hex = bgColor.replace('#', '');
        bgR = parseInt(hex.substring(0, 2), 16);
        bgG = parseInt(hex.substring(2, 4), 16);
        bgB = parseInt(hex.substring(4, 6), 16);
      }

      // Blend pixels
      // Note: mask may have different dimensions than original image, so we must map coordinates
      for (let y = 0; y < originalImg.height; y++) {
        for (let x = 0; x < originalImg.width; x++) {
          const pixelIndex = (y * originalImg.width + x) * 4;

          // Map original coordinates to mask coordinates
          const maskX = Math.floor((x / originalImg.width) * maskWidth);
          const maskY = Math.floor((y / originalImg.height) * maskHeight);
          const maskIndex = maskY * maskWidth + maskX;

          const confidence = segmentationMask[maskIndex] || 0; // 0.0 to 1.0 (1.0 is person)

          const origR = data[pixelIndex];
          const origG = data[pixelIndex + 1];
          const origB = data[pixelIndex + 2];
          const origA = data[pixelIndex + 3] / 255;

          // Blend alpha
          const finalAlpha = origA * confidence + bgA * (1 - confidence);

          if (finalAlpha > 0) {
            // Blend RGB
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

    // Redraw the main canvas
    drawMainCanvas();

  }, [loadedImg, imageSrc, removeBg, segmentationMask, bgColor, adjustments.zoom, adjustments.rotation, adjustments.offsetX, adjustments.offsetY]);

  // Redraw when adjustments change
  useEffect(() => {
    drawMainCanvas();
  }, [adjustments, showGuide, preset]);

  // Main drawing logic
  const drawMainCanvas = () => {
    const displayCanvas = displayCanvasRef.current;
    const segCanvas = segmentedCanvasRef.current;
    if (!displayCanvas || !segCanvas || !segCanvas.width || !segCanvas.height) return;

    const ctx = displayCanvas.getContext('2d');
    if (!ctx) return;

    // Fixed standard output dimensions
    const outputHeight = 600;
    const outputWidth = Math.round(outputHeight * preset.aspectRatio);

    displayCanvas.width = outputWidth;
    displayCanvas.height = outputHeight;

    ctx.clearRect(0, 0, outputWidth, outputHeight);

    const safeZoom = isFinite(adjustments.zoom) && adjustments.zoom > 0 ? adjustments.zoom : 1.0;
    const safeRotation = isFinite(adjustments.rotation) ? adjustments.rotation : 0;
    const safeOffsetX = isFinite(adjustments.offsetX) ? adjustments.offsetX : 0;
    const safeOffsetY = isFinite(adjustments.offsetY) ? adjustments.offsetY : 0;
    const safeBrightness = isFinite(adjustments.brightness) ? adjustments.brightness : 100;
    const safeContrast = isFinite(adjustments.contrast) ? adjustments.contrast : 100;
    const safeSaturation = isFinite(adjustments.saturation) ? adjustments.saturation : 100;

    // Apply color corrections
    ctx.filter = `brightness(${safeBrightness}%) contrast(${safeContrast}%) saturate(${safeSaturation}%)`;

    ctx.save();

    // Move center to center of canvas
    ctx.translate(outputWidth / 2 + safeOffsetX, outputHeight / 2 + safeOffsetY);

    // Rotate
    ctx.rotate((safeRotation * Math.PI) / 180);

    // Zoom/Scale: we calculate scale based on fits
    // Default fit scales image to match standard output dimensions
    const baseScale = Math.min(outputWidth / segCanvas.width, outputHeight / segCanvas.height);
    const finalScale = isFinite(baseScale) && baseScale > 0 ? baseScale * safeZoom : safeZoom;

    ctx.scale(finalScale, finalScale);

    // Draw the pre-segmented image centered
    ctx.drawImage(segCanvas, -segCanvas.width / 2, -segCanvas.height / 2);

    ctx.restore();
    ctx.filter = 'none'; // reset filter
  };

  // Preset guide overlay specifications
  const guideLines = useMemo(() => {
    return preset.overlaySpecs;
  }, [preset]);

  // Handle adjustments update
  const handleSliderChange = (key: keyof ImageAdjustments, val: number) => {
    setAdjustments((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  // Reset Adjustments
  const resetAllAdjustments = () => {
    setAdjustments({ ...DEFAULT_ADJUSTMENTS });
  };

  // Trigger final export
  const handleExport = () => {
    const displayCanvas = displayCanvasRef.current;
    if (!displayCanvas) return;

    // Export with highest quality
    const finalDataUrl = displayCanvas.toDataURL('image/jpeg', 0.98);
    onSave(finalDataUrl);
  };

  return (
    <div id="photo_editor_section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* LEFT: Live Interactive Preview */}
      <div className="lg:col-span-6 flex flex-col items-center space-y-4">
        
        {/* Canvas container with exact guideline overlay */}
        <div 
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 flex items-center justify-center p-6 w-full max-w-[380px] md:max-w-[420px]"
        >
          {/* AI Busy indicator with glassmorphism overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center gap-4 p-6 z-20 transition-all duration-300">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin" />
                <Sparkles className="w-6 h-6 text-teal-400 absolute animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-100 text-sm tracking-tight">{t.aiProcessingTitle}</h4>
                <p className="text-xs text-teal-400 font-medium animate-pulse max-w-xs">{aiLog}</p>
              </div>
            </div>
          )}

          {/* Guidelines Overlay Layer */}
          <div className="relative aspect-[2/3] w-full max-w-[280px] md:max-w-[300px] flex items-center justify-center">
            
            {/* Display Canvas containing the image */}
            <canvas 
              ref={displayCanvasRef} 
              className="w-full h-full object-contain rounded-lg shadow-lg"
            />

            {/* Passport template guidelines (strictly drawn on top) */}
            {showGuide && !isProcessing && (
              <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between">
                {/* Visual guidelines drawn with absolute coordinates matching the percentage of output */}
                <div className="relative w-full h-full">
                  
                  {/* Top margin buffer marker (2-4mm vietnam, custom for US) */}
                  <div 
                    className="absolute left-0 right-0 border-t border-dashed border-yellow-400/80 flex items-center justify-end pr-2 text-[9px] text-yellow-300 font-medium"
                    style={{ top: `${guideLines.headTopPercent}%` }}
                  >
                    {t.topHead}
                  </div>

                  {/* Eye line guidelines */}
                  <div 
                    className="absolute left-0 right-0 border-t border-dotted border-sky-400/80 flex items-center justify-end pr-2 text-[9px] text-sky-300 font-medium"
                    style={{ top: `${guideLines.eyeLinePercent}%` }}
                  >
                    {t.eyeLine}
                  </div>

                  {/* Chin guidelines */}
                  <div 
                    className="absolute left-0 right-0 border-t border-dashed border-yellow-400/80 flex items-center justify-end pr-2 text-[9px] text-yellow-300 font-medium"
                    style={{ top: `${guideLines.chinPercent}%` }}
                  >
                    {t.chin}
                  </div>

                  {/* Portrait Oval frame centered */}
                  <div 
                    className="absolute left-1/2 -translate-x-1/2 border-2 border-teal-400/60 rounded-[50%/40%] flex items-center justify-center"
                    style={{ 
                      top: `${guideLines.headTopPercent}%`, 
                      bottom: `${100 - guideLines.chinPercent}%`,
                      width: '56%'
                    }}
                  >
                    {/* Inner cross guide */}
                    <div className="w-full h-px bg-teal-400/20" />
                  </div>

                  {/* Symmetry Vertical Line */}
                  <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-teal-400/20 -translate-x-1/2" />
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Floating actions under preview */}
        <div className="flex flex-wrap gap-2 w-full max-w-[360px] justify-center">
          <button
            id="restore_initial_align_btn"
            onClick={restoreInitialAlign}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/30 rounded-lg text-xs font-semibold transition active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>{t.autoAlignBtn}</span>
          </button>

          <button
            id="toggle_guide_btn"
            onClick={() => setShowGuide(!showGuide)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              showGuide ? 'bg-teal-500/15 text-teal-400' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showGuide ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{t.toggleGuides}</span>
          </button>

          <button
            id="reset_adjustments_btn"
            onClick={resetAllAdjustments}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetTransform}</span>
          </button>
        </div>

        {/* AI feedback banner */}
        {!isProcessing && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 max-w-[300px] ${
            faceDetected 
              ? 'bg-teal-950/40 border border-teal-900/50 text-teal-300' 
              : 'bg-amber-950/30 border border-amber-900/40 text-amber-300'
          }`}>
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>
              {faceDetected 
                ? 'AI đã tự căn chỉnh khuôn mặt thẳng trục mắt và đúng kích cỡ!'
                : 'Không phát hiện khuôn mặt. Di chuyển thanh trượt để căn chỉnh thủ công.'}
            </span>
          </div>
        )}
      </div>

      {/* RIGHT: High Fidelity Slider & Option Panels */}
      <div className="lg:col-span-6 space-y-6">
        
        {/* Presets and details view */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-teal-400 tracking-wider uppercase">{t.nationalStandardLabel}</span>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">{preset.widthMm}x{preset.heightMm} mm</span>
          </div>
          <h3 className="font-semibold text-slate-100 text-sm leading-snug">{getPresetName(preset.id)}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{getPresetDesc(preset.id)}</p>
        </div>

        {/* Segment Background Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-teal-400" />
              <h4 className="font-semibold text-slate-100 text-sm">Tách nền phía sau bằng AI</h4>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                id="remove_bg_toggle"
                type="checkbox" 
                checked={removeBg} 
                onChange={() => setRemoveBg(!removeBg)} 
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 peer-checked:after:bg-slate-900" />
            </label>
          </div>

          {removeBg && (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-400">Chọn màu phông nền hộ chiếu/visa đúng yêu cầu:</p>
              <div className="flex flex-wrap gap-2">
                {BG_COLOR_OPTIONS.map((opt) => (
                  <button
                    id={`bg_color_${opt.value.replace('#', '')}_btn`}
                    key={opt.value}
                    onClick={() => setBgColor(opt.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer select-none transition ${
                      bgColor === opt.value
                        ? 'ring-2 ring-teal-400 border-teal-500'
                        : 'hover:bg-slate-800 border-slate-700'
                    } ${opt.label}`}
                  >
                    {bgColor === opt.value && <Check className="w-3.5 h-3.5" />}
                    <span>{opt.name.split(' (')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Position / Rotation Adjustment Sliders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Compass className="w-4 h-4 text-teal-400" />
            <h4 className="font-semibold text-slate-100 text-sm">Căn chỉnh khuôn mặt (Face Tuning)</h4>
          </div>

          <div className="space-y-4">
            {/* Zoom / Scale Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Kích thước ảnh (Zoom)</span>
                </span>
                <span className="text-teal-400 font-mono font-bold">{(adjustments.zoom * 100).toFixed(0)}%</span>
              </div>
              <input
                id="adjust_zoom_range"
                type="range"
                min="0.3"
                max="3.0"
                step="0.05"
                value={adjustments.zoom}
                onChange={(e) => handleSliderChange('zoom', parseFloat(e.target.value))}
                className="w-full accent-teal-400 bg-slate-800"
              />
            </div>

            {/* Rotation Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Xoay ảnh (Rotation)</span>
                </span>
                <span className="text-teal-400 font-mono font-bold">{adjustments.rotation}°</span>
              </div>
              <input
                id="adjust_rotation_range"
                type="range"
                min="-30"
                max="30"
                step="0.5"
                value={adjustments.rotation}
                onChange={(e) => handleSliderChange('rotation', parseFloat(e.target.value))}
                className="w-full accent-teal-400 bg-slate-800"
              />
            </div>

            {/* X Offset Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Dịch chuyển Ngang (X Offset)</span>
                <span className="text-teal-400 font-mono font-bold">{adjustments.offsetX}px</span>
              </div>
              <input
                id="adjust_offset_x_range"
                type="range"
                min="-200"
                max="200"
                step="2"
                value={adjustments.offsetX}
                onChange={(e) => handleSliderChange('offsetX', parseInt(e.target.value))}
                className="w-full accent-teal-400 bg-slate-800"
              />
            </div>

            {/* Y Offset Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Dịch chuyển Dọc (Y Offset)</span>
                <span className="text-teal-400 font-mono font-bold">{adjustments.offsetY}px</span>
              </div>
              <input
                id="adjust_offset_y_range"
                type="range"
                min="-200"
                max="200"
                step="2"
                value={adjustments.offsetY}
                onChange={(e) => handleSliderChange('offsetY', parseInt(e.target.value))}
                className="w-full accent-teal-400 bg-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Color Correction Sliders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Sun className="w-4 h-4 text-teal-400" />
            <h4 className="font-semibold text-slate-100 text-sm">Chỉnh ánh sáng / Màu sắc (Corrections)</h4>
          </div>

          <div className="space-y-4">
            {/* Brightness */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Độ sáng (Brightness)</span>
                <span className="text-teal-400 font-mono font-bold">{adjustments.brightness}%</span>
              </div>
              <input
                id="adjust_brightness_range"
                type="range"
                min="50"
                max="150"
                step="1"
                value={adjustments.brightness}
                onChange={(e) => handleSliderChange('brightness', parseInt(e.target.value))}
                className="w-full accent-teal-400 bg-slate-800"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Độ tương phản (Contrast)</span>
                <span className="text-teal-400 font-mono font-bold">{adjustments.contrast}%</span>
              </div>
              <input
                id="adjust_contrast_range"
                type="range"
                min="50"
                max="150"
                step="1"
                value={adjustments.contrast}
                onChange={(e) => handleSliderChange('contrast', parseInt(e.target.value))}
                className="w-full accent-teal-400 bg-slate-800"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Độ bão hoà (Saturation)</span>
                <span className="text-teal-400 font-mono font-bold">{adjustments.saturation}%</span>
              </div>
              <input
                id="adjust_saturation_range"
                type="range"
                min="0"
                max="200"
                step="2"
                value={adjustments.saturation}
                onChange={(e) => handleSliderChange('saturation', parseInt(e.target.value))}
                className="w-full accent-teal-400 bg-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Next / Export Action */}
        <button
          id="confirm_export_photo_btn"
          onClick={handleExport}
          className="w-full py-4 bg-teal-500 hover:bg-teal-600 font-bold text-slate-900 rounded-2xl shadow-lg hover:shadow-teal-500/20 active:scale-[0.99] transition text-center block text-sm"
        >
          Xác nhận ảnh & Xuất File In
        </button>

      </div>

    </div>
  );
}
