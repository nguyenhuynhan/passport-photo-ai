/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Download, Grid, RefreshCw, Printer, FileText } from 'lucide-react';
import { PhotoPreset, PassportStandard } from '../types';
import { Language, TRANSLATIONS } from '../locales/translations';

interface PrintingGridProps {
  photoSrc: string; // The base64 output of the cropped photo
  preset: PhotoPreset;
  language?: Language;
}

export default function PrintingGrid({ photoSrc, preset, language = 'vi' }: PrintingGridProps) {
  const t = TRANSLATIONS[language];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paperSize, setPaperSize] = useState<'10x15' | 'A4'>('10x15');
  const [photoCount, setPhotoCount] = useState<number>(4);
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Set default photo count based on preset and paper size
  useEffect(() => {
    if (paperSize === '10x15') {
      if (preset.id === PassportStandard.VIETNAM_4x6) {
        setPhotoCount(4); // 2x2 grid
      } else if (preset.id === PassportStandard.VIETNAM_3x4) {
        setPhotoCount(6); // 2x3 grid
      } else if (preset.id === PassportStandard.US_VISA) {
        setPhotoCount(2); // 1x2 or 2x1
      } else {
        setPhotoCount(4);
      }
    } else {
      // A4 paper
      if (preset.id === PassportStandard.VIETNAM_4x6) {
        setPhotoCount(12);
      } else if (preset.id === PassportStandard.VIETNAM_3x4) {
        setPhotoCount(18);
      } else if (preset.id === PassportStandard.US_VISA) {
        setPhotoCount(12);
      } else {
        setPhotoCount(12);
      }
    }
  }, [preset, paperSize]);

  // Generate printable canvas
  const generatePrintSheet = () => {
    setIsGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = photoSrc;
    img.onload = () => {
      // 300 DPI constants
      const DPI = 300;
      const CM_TO_INCH = 2.54;
      const PIXELS_PER_CM = DPI / CM_TO_INCH; // ~118.11 pixels per cm

      let paperWidthPx = 0;
      let paperHeightPx = 0;

      if (paperSize === '10x15') {
        // 10x15 cm photo paper
        paperWidthPx = Math.round(15 * PIXELS_PER_CM); // 1772 px (landscape standard for prints)
        paperHeightPx = Math.round(10 * PIXELS_PER_CM); // 1181 px
      } else {
        // A4 paper (21 x 29.7 cm) - landscape
        paperWidthPx = Math.round(29.7 * PIXELS_PER_CM); // 3508 px
        paperHeightPx = Math.round(21 * PIXELS_PER_CM); // 2480 px
      }

      canvas.width = paperWidthPx;
      canvas.height = paperHeightPx;

      // Fill canvas background with clean white (photo printing paper)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, paperWidthPx, paperHeightPx);

      // Draw title or helper margins (extremely subtle, won't print if borderless but good for cutting)
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, paperWidthPx - 20, paperHeightPx - 20);

      // Photo size in pixels
      const photoWidthPx = Math.round((preset.widthMm / 10) * PIXELS_PER_CM);
      const photoHeightPx = Math.round((preset.heightMm / 10) * PIXELS_PER_CM);

      // Grid calculations
      const paddingPx = Math.round(0.4 * PIXELS_PER_CM); // 4mm space between photos
      const borderLinePx = 1; // 1px light gray line for cutting guide

      // Compute columns and rows that fit the paper size
      const maxCols = Math.floor((paperWidthPx - paddingPx) / (photoWidthPx + paddingPx));
      const maxRows = Math.floor((paperHeightPx - paddingPx) / (photoHeightPx + paddingPx));

      // Draw photos in grid
      let countDrawn = 0;
      const actualCount = Math.min(photoCount, maxCols * maxRows);

      // Center the entire grid on the paper
      const gridWidth = actualCount < maxCols 
        ? actualCount * (photoWidthPx + paddingPx) - paddingPx
        : maxCols * (photoWidthPx + paddingPx) - paddingPx;
      
      const colsUsed = Math.min(actualCount, maxCols);
      const rowsUsed = Math.ceil(actualCount / colsUsed);
      const gridHeight = rowsUsed * (photoHeightPx + paddingPx) - paddingPx;

      const startX = (paperWidthPx - gridWidth) / 2;
      const startY = (paperHeightPx - gridHeight) / 2;

      for (let r = 0; r < rowsUsed; r++) {
        for (let c = 0; c < colsUsed; c++) {
          if (countDrawn >= actualCount) break;

          const x = startX + c * (photoWidthPx + paddingPx);
          const y = startY + r * (photoHeightPx + paddingPx);

          // Draw cutting border helper slightly larger than photo
          ctx.strokeStyle = '#D1D5DB'; // Light grey cutting line
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]); // Dashed line
          ctx.strokeRect(
            x - borderLinePx, 
            y - borderLinePx, 
            photoWidthPx + borderLinePx * 2, 
            photoHeightPx + borderLinePx * 2
          );
          ctx.setLineDash([]); // Reset dashed

          // Draw the photo
          ctx.drawImage(img, x, y, photoWidthPx, photoHeightPx);
          countDrawn++;
        }
      }

      // Convert printable canvas to data URL for screen rendering
      setPreviewSrc(canvas.toDataURL('image/jpeg', 0.95));
      setIsGenerating(false);
    };
  };

  // Re-generate print sheet whenever dependencies change
  useEffect(() => {
    if (photoSrc) {
      generatePrintSheet();
    }
  }, [photoSrc, preset, paperSize, photoCount]);

  const handleDownloadSheet = () => {
    if (!previewSrc) return;
    const link = document.createElement('a');
    link.download = `In_Anh_Ho_Chieu_${preset.widthMm}x${preset.heightMm}_${paperSize}.jpg`;
    link.href = previewSrc;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="printing_grid_section" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Grid className="w-5 h-5 text-teal-400" />
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Xếp Tấm Ảnh Để In (Collage Grid)</h3>
            <p className="text-xs text-slate-400">Tạo file ảnh xếp nhiều tấm chuẩn kích thước để mang ra tiệm in</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Configurations Column */}
        <div className="space-y-4">
          {/* Paper Size selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">{t.paperSizeLabel}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="paper_10x15_btn"
                onClick={() => setPaperSize('10x15')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition ${
                  paperSize === '10x15'
                    ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                    : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t.paper4x6}</span>
              </button>
              <button
                id="paper_A4_btn"
                onClick={() => setPaperSize('A4')}
                className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition ${
                  paperSize === 'A4'
                    ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                    : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t.paperA4}</span>
              </button>
            </div>
          </div>

          {/* Photo count selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">{t.photoCountLabel}</label>
            <div className="flex items-center gap-3">
              <input
                id="photo_count_range"
                type="range"
                min="1"
                max={paperSize === '10x15' ? '8' : '24'}
                value={photoCount}
                onChange={(e) => setPhotoCount(parseInt(e.target.value))}
                className="w-full accent-teal-400"
              />
              <span className="text-sm font-semibold text-teal-400 w-12 text-right">{photoCount} {t.copiesUnit}</span>
            </div>
          </div>

          {/* Guidelines info */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5 text-xs text-slate-300 leading-relaxed space-y-2">
            <p className="font-semibold text-teal-400">Actual Size Printing Tip:</p>
            <ol className="list-decimal list-inside space-y-1 text-[11px]">
              <li>Download this printable sheet to your computer/phone.</li>
              <li>Select exact paper size ({paperSize === '10x15' ? '10x15cm / 4x6"' : 'A4'}).</li>
              <li>Select <strong className="text-white">"Actual Size" / 100% Scale</strong> in printer dialog.</li>
            </ol>
          </div>
        </div>

        {/* Preview Column */}
        <div className="md:col-span-2 flex flex-col items-center justify-center bg-slate-950 rounded-xl border border-slate-800 p-4 min-h-[220px] relative">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-teal-400" />
              <p className="text-xs text-slate-400">Rendering...</p>
            </div>
          ) : previewSrc ? (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="relative shadow-md border border-slate-700 rounded overflow-hidden max-w-[280px] md:max-w-xs aspect-video bg-white flex items-center justify-center p-1">
                <img src={previewSrc} alt="Print Sheet Preview" className="max-h-56 object-contain" referrerPolicy="no-referrer" />
                <span className="absolute top-2 left-2 bg-black/75 text-[9px] text-slate-200 px-1.5 py-0.5 rounded font-mono">
                  {paperSize === '10x15' ? '15cm x 10cm' : '29.7cm x 21cm'} @300DPI
                </span>
              </div>

              <button
                id="download_print_sheet_btn"
                onClick={handleDownloadSheet}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 active:scale-95 text-slate-900 font-semibold rounded-lg text-xs transition shadow-md shadow-teal-500/10"
              >
                <Download className="w-4 h-4" />
                <span>{t.downloadSheetBtn} ({paperSize === '10x15' ? '10x15 cm' : 'A4'})</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No preview available</p>
          )}

          {/* Hidden Canvas used for generating print sheet */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
}
