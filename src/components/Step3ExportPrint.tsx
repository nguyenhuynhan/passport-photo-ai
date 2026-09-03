import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { UserCheck, Download, AlertTriangle, ShieldCheck } from 'lucide-react';
import { PhotoPreset, PassportStandard } from '../types';
import PrintingGrid from './PrintingGrid';
import { Language, TRANSLATIONS } from '../locales/translations';
import { analyzeVietnamPassportPixels, PassportQualityReport } from '../utils/passportQuality';

interface Step3ExportPrintProps {
  key?: string;
  croppedPhoto: string;
  preset: PhotoPreset;
  language: Language;
  onBackToEditor?: () => void;
  onCreateNew?: () => void;
}

export default function Step3ExportPrint({
  croppedPhoto,
  preset,
  language,
}: Step3ExportPrintProps) {
  const t = TRANSLATIONS[language];
  const [qualityReport, setQualityReport] = useState<PassportQualityReport | null>(null);

  useEffect(() => {
    if (preset.id !== PassportStandard.VIETNAM_4x6) {
      setQualityReport(null);
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context || !canvas.width || !canvas.height) return;
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      setQualityReport(analyzeVietnamPassportPixels(pixels.data, canvas.width, canvas.height));
    };
    image.src = croppedPhoto;

    return () => {
      cancelled = true;
    };
  }, [croppedPhoto, preset.id]);

  const qualityText = {
    vi: {
      passTitle: 'Kiểm tra cục bộ: nền trắng đạt',
      passBody: 'Nền đủ sáng và đồng nhất. VNeID vẫn là hệ thống đưa ra kết quả xác thực cuối cùng.',
      warningTitle: 'Có rủi ro bị VNeID từ chối',
      background_not_white: 'Nền chưa đủ trắng trung tính. Hãy chọn nền Trắng và tách nền lại.',
      background_not_uniform: 'Nền chưa đồng nhất hoặc còn bóng/mảng xám.',
      light_clothing_blends_with_background: 'Áo sáng hoặc có sọc đang chạm mép nền trắng. VNeID có thể nhầm áo là nền và báo “độ xám không phù hợp”. Nên chụp lại với áo có cổ màu tối, trơn.',
    },
    en: {
      passTitle: 'Local preflight: white background passed',
      passBody: 'The background is bright and uniform. The government portal remains the final validator.',
      warningTitle: 'Government portal rejection risk detected',
      background_not_white: 'The background is not neutral white. Select White and run background removal again.',
      background_not_uniform: 'The background is not uniform or still contains shadows/grey patches.',
      light_clothing_blends_with_background: 'Pale or striped clothing touches the white background. An automated validator may treat it as background. Retake the photo in a plain, dark collared top.',
    },
    zh: {
      passTitle: '本地预检：白色背景通过',
      passBody: '背景明亮且均匀，最终结果仍以政府系统验证为准。',
      warningTitle: '检测到政府系统可能拒绝的风险',
      background_not_white: '背景不是中性白色，请选择白色并重新抠图。',
      background_not_uniform: '背景不均匀，或仍有阴影/灰色斑块。',
      light_clothing_blends_with_background: '浅色或条纹衣物接触白色背景，自动系统可能把衣物误判为背景。建议穿深色纯色有领上衣重新拍摄。',
    },
  }[language];

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

  return (
    <motion.div
      key="step-3"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">{t.editingPresetLabel}</span>
          <span className="text-teal-400 font-semibold">{getPresetName(preset.id)}</span>
        </div>
      </div>

      {/* Result Grid with Printable Grid on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Single Image Export Panel */}
        <div className="lg:col-span-4 flex flex-col items-center bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg text-center">
          <div className="flex items-center gap-1.5 text-xs text-teal-400 font-semibold self-start bg-teal-500/10 px-2.5 py-1 rounded-full">
            <UserCheck className="w-3.5 h-3.5" />
            <span>{t.singlePhotoCompleted}</span>
          </div>

          {/* Rendered cropped output image */}
          <div className="relative aspect-[2/3] w-full max-w-[180px] bg-white rounded-xl shadow-xl overflow-hidden p-0.5 border border-slate-700">
            <img
              src={croppedPhoto}
              alt="Passport Photo Output"
              className="w-full h-full object-cover rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-2 text-center w-full">
            <h3 className="font-semibold text-slate-100 text-sm">
              {getPresetName(preset.id)} ({preset.widthMm}x{preset.heightMm} mm)
            </h3>
            <p className="text-xs text-teal-400 font-medium font-mono bg-teal-500/10 py-1 px-2.5 rounded-lg border border-teal-500/20">
              1200 x 1800 px (300 DPI) • {preset.id === PassportStandard.VIETNAM_4x6 ? 'Đúng kích thước xuất' : 'High Resolution'}
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">{t.singlePhotoSpecs}</p>
          </div>

          {preset.id === PassportStandard.VIETNAM_4x6 && qualityReport && (
            <div
              id="vneid_local_preflight"
              className={`w-full rounded-xl border p-3 text-left space-y-1.5 text-[11px] ${
                qualityReport.issues.length
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
              }`}
            >
              <p className="font-bold flex items-center gap-1.5">
                {qualityReport.issues.length
                  ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  : <ShieldCheck className="w-3.5 h-3.5 shrink-0" />}
                {qualityReport.issues.length ? qualityText.warningTitle : qualityText.passTitle}
              </p>
              {qualityReport.issues.length ? (
                <ul className="list-disc pl-4 space-y-1 text-amber-100/80">
                  {qualityReport.issues.map((issue) => (
                    <li key={issue.code}>{qualityText[issue.code]}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-emerald-100/70">{qualityText.passBody}</p>
              )}
            </div>
          )}

          {/* Action download single image */}
          <a
            id="download_single_photo_btn"
            href={croppedPhoto}
            download={`Anh_Ho_Chieu_${preset.widthMm}x${preset.heightMm}_BoCongAn.jpg`}
            className="w-full py-3 bg-teal-500 hover:bg-teal-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t.downloadSingleBtn}</span>
          </a>

          {/* Special Portal Tip */}
          {preset.id === PassportStandard.VIETNAM_4x6 && (
            <div className="bg-slate-950/80 border border-teal-500/30 rounded-xl p-3 text-left space-y-1 text-[11px]">
              <p className="font-bold text-teal-300 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                Mẹo nộp Cổng dịch vụ công không bị lỗi:
              </p>
              <ul className="text-slate-400 list-disc list-inside space-y-1">
                <li>Tải trực tiếp file <strong className="text-slate-200">.JPG</strong> này về máy.</li>
                <li><strong className="text-amber-300">Không gửi qua Zalo / Messenger</strong> (vì các app này nén làm giảm pixel).</li>
                <li>Nộp file trực tiếp lên hệ thống Bộ Công An.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Printable Collage Generator Panel */}
        <div className="lg:col-span-8">
          <PrintingGrid photoSrc={croppedPhoto} preset={preset} language={language} />
        </div>
      </div>
    </motion.div>
  );
}
