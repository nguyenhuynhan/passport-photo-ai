/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
  Maximize2, RotateCcw, ZoomIn, ZoomOut, Check, Sliders, 
  Sparkles, RefreshCw, Scissors, Compass, Sun, Eye, EyeOff
} from 'lucide-react';
import { PhotoPreset, ImageAdjustments, DEFAULT_ADJUSTMENTS, BG_COLOR_OPTIONS } from '../types';
import { detectFace, segmentSelfie } from '../utils/ai';

interface PhotoEditorProps {
  imageSrc: string;
  preset: PhotoPreset;
  onSave: (outputBase64: string) => void;
}

export default function PhotoEditor({ imageSrc, preset, onSave }: PhotoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  
  // Offscreen canvas for background segmentation blending
  const segmentedCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({ ...DEFAULT_ADJUSTMENTS });
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

  // Load preset defaults when preset changes
  useEffect(() => {
    setBgColor(preset.defaultBgColor);
  }, [preset]);

  // Load original image and run AI on mount/change
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.src = imageSrc;
    img.onload = async () => {
      originalImageRef.current = img;
      setImgWidth(img.width);
      setImgHeight(img.height);
      
      // Reset adjustments first
      setAdjustments({ ...DEFAULT_ADJUSTMENTS });
      setSegmentationMask(null);
      setFaceDetected(false);

      // Run AI
      await runAIProcessing(img);
    };
  }, [imageSrc]);

  // Run face detection and segmentation
  // Run face detection and segmentation
  const runAIProcessing = async (img: HTMLImageElement) => {
    setIsProcessing(true);
    setAiLog('AI đang phân tích khuôn mặt & tách nền...');

    try {
      // 1. Run Segmentation first
      let maskData: Float32Array | null = null;
      let mWidth = 0;
      let mHeight = 0;

      try {
        const segmentResult = await segmentSelfie(img);
        if (segmentResult && segmentResult.confidenceMasks && segmentResult.confidenceMasks.length > 0) {
          const mask = segmentResult.confidenceMasks[0];
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
        const faceResult = await detectFace(img);
        if (faceResult && faceResult.detections && faceResult.detections.length > 0) {
          const detection = faceResult.detections[0];
          const box = detection.boundingBox;

          if (box) {
            faceFound = true;
            setFaceDetected(true);
            setAiLog('Đã phát hiện khuôn mặt! Đang căn chỉnh trục mắt và tỉ lệ chuẩn...');

            let rotationAngle = 0;
            if (detection.keypoints && detection.keypoints.length >= 2) {
              const rightEye = detection.keypoints[0];
              const leftEye = detection.keypoints[1];
              const rightEyeX = rightEye.x * img.width;
              const rightEyeY = rightEye.y * img.height;
              const leftEyeX = leftEye.x * img.width;
              const leftEyeY = leftEye.y * img.height;

              const dx = leftEyeX - rightEyeX;
              const dy = leftEyeY - rightEyeY;
              rotationAngle = -Math.atan2(dy, dx) * (180 / Math.PI);
            }

            const estimatedHeadHeight = box.height * 1.35;
            const targetFaceHeightPercent = (preset.faceHeightMinPercent + preset.faceHeightMaxPercent) / 2;
            const standardCanvasHeight = 600;
            const standardCanvasWidth = standardCanvasHeight * preset.aspectRatio;

            const desiredHeadHeightPxOnCanvas = standardCanvasHeight * (targetFaceHeightPercent / 100);
            const targetScale = (desiredHeadHeightPxOnCanvas / standardCanvasHeight) * (img.height / estimatedHeadHeight);

            const faceCenterX = box.originX + box.width / 2;
            const faceCenterY = box.originY + box.height / 2;
            const cropCenterY = faceCenterY - box.height * 0.15;

            const currentCanvasCenterX = img.width / 2;
            const currentCanvasCenterY = img.height / 2;

            const targetOffsetX = (currentCanvasCenterX - faceCenterX) * (standardCanvasWidth / img.width);
            const targetOffsetY = (currentCanvasCenterY - cropCenterY) * (standardCanvasHeight / img.height);

            setAdjustments({
              ...DEFAULT_ADJUSTMENTS,
              zoom: Number(targetScale.toFixed(2)),
              rotation: Number(rotationAngle.toFixed(1)),
              offsetX: Number(targetOffsetX.toFixed(0)),
              offsetY: Number(targetOffsetY.toFixed(0)),
            });
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
          setAiLog('Đã tự động định vị khuôn mặt từ nhận diện chân dung!');

          const topHeadYImg = (minY / mHeight) * img.height;
          const bodyWidthImg = ((maxX - minX) / mWidth) * img.width;
          const estimatedHeadHeightImg = bodyWidthImg * 0.75;
          const faceCenterXImg = (((minX + maxX) / 2) / mWidth) * img.width;
          const faceCenterYImg = topHeadYImg + estimatedHeadHeightImg * 0.5;

          const targetFaceHeightPercent = (preset.faceHeightMinPercent + preset.faceHeightMaxPercent) / 2;
          const standardCanvasHeight = 600;
          const standardCanvasWidth = standardCanvasHeight * preset.aspectRatio;

          const desiredHeadHeightPxOnCanvas = standardCanvasHeight * (targetFaceHeightPercent / 100);
          const targetScale = (desiredHeadHeightPxOnCanvas / standardCanvasHeight) * (img.height / estimatedHeadHeightImg);

          const currentCanvasCenterX = img.width / 2;
          const currentCanvasCenterY = img.height / 2;

          const targetOffsetX = (currentCanvasCenterX - faceCenterXImg) * (standardCanvasWidth / img.width);
          const targetOffsetY = (currentCanvasCenterY - faceCenterYImg) * (standardCanvasHeight / img.height);

          setAdjustments({
            ...DEFAULT_ADJUSTMENTS,
            zoom: Number(Math.max(0.5, Math.min(3, targetScale)).toFixed(2)),
            rotation: 0,
            offsetX: Number(targetOffsetX.toFixed(0)),
            offsetY: Number(targetOffsetY.toFixed(0)),
          });
        }
      }

      if (!faceFound) {
        setFaceDetected(false);
        setAiLog('Không tìm thấy khuôn mặt rõ ràng. Chuyển sang căn chỉnh thủ công.');
      }
    } catch (err) {
      console.error('Lỗi khi chạy mô hình AI cục bộ:', err);
      setAiLog('AI cục bộ không hỗ trợ trên thiết bị này. Đã sẵn sàng chỉnh sửa thủ công.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate the segmented image on offscreen canvas whenever original image, mask, removeBg state, or bgColor changes
  useEffect(() => {
    const originalImg = originalImageRef.current;
    if (!originalImg) return;

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

  }, [imageSrc, removeBg, segmentationMask, bgColor, adjustments.zoom, adjustments.rotation, adjustments.offsetX, adjustments.offsetY]);

  // Redraw when adjustments change
  useEffect(() => {
    drawMainCanvas();
  }, [adjustments, showGuide, preset]);

  // Main drawing logic
  const drawMainCanvas = () => {
    const displayCanvas = displayCanvasRef.current;
    const segCanvas = segmentedCanvasRef.current;
    if (!displayCanvas || !segCanvas) return;

    const ctx = displayCanvas.getContext('2d');
    if (!ctx) return;

    // Fixed standard output dimensions
    const outputHeight = 600;
    const outputWidth = Math.round(outputHeight * preset.aspectRatio);

    displayCanvas.width = outputWidth;
    displayCanvas.height = outputHeight;

    ctx.clearRect(0, 0, outputWidth, outputHeight);

    // Apply color corrections
    // canvas 2D supports standard filters
    ctx.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`;

    ctx.save();

    // Move center to center of canvas
    ctx.translate(outputWidth / 2, outputHeight / 2);

    // Translate adjustments offset
    ctx.translate(adjustments.offsetX, adjustments.offsetY);

    // Rotate
    ctx.rotate((adjustments.rotation * Math.PI) / 180);

    // Zoom/Scale: we calculate scale based on fits
    // Default fit scales image to match standard output dimensions
    const baseScale = Math.min(outputWidth / segCanvas.width, outputHeight / segCanvas.height);
    const finalScale = baseScale * adjustments.zoom;

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
          {/* AI Busy indicator */}
          {isProcessing && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-center gap-3 p-6 z-10">
              <RefreshCw className="w-8 h-8 animate-spin text-teal-400" />
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-100 text-sm">AI Đang Làm Việc Cục Bộ...</h4>
                <p className="text-[11px] text-slate-400 font-mono max-w-xs">{aiLog}</p>
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
                    Đỉnh đầu (Top Head)
                  </div>

                  {/* Eye line guidelines */}
                  <div 
                    className="absolute left-0 right-0 border-t border-dotted border-sky-400/80 flex items-center justify-end pr-2 text-[9px] text-sky-300 font-medium"
                    style={{ top: `${guideLines.eyeLinePercent}%` }}
                  >
                    Trục mắt (Eyes)
                  </div>

                  {/* Chin guidelines */}
                  <div 
                    className="absolute left-0 right-0 border-t border-dashed border-yellow-400/80 flex items-center justify-end pr-2 text-[9px] text-yellow-300 font-medium"
                    style={{ top: `${guideLines.chinPercent}%` }}
                  >
                    Cằm (Chin)
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
        <div className="flex gap-3 w-full max-w-[300px] justify-center">
          <button
            id="toggle_guide_btn"
            onClick={() => setShowGuide(!showGuide)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              showGuide ? 'bg-teal-500/15 text-teal-400' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showGuide ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Đường hướng dẫn</span>
          </button>

          <button
            id="reset_adjustments_btn"
            onClick={resetAllAdjustments}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại trục</span>
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
            <span className="text-xs font-bold text-teal-400 tracking-wider uppercase">Tiêu chuẩn quốc gia:</span>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">{preset.widthMm}x{preset.heightMm} mm</span>
          </div>
          <h3 className="font-semibold text-slate-100 text-sm leading-snug">{preset.name}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{preset.description}</p>
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
