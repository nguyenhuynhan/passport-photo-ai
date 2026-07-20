import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, UserCheck, Download } from 'lucide-react';
import { PhotoPreset, PassportStandard } from '../types';
import PrintingGrid from './PrintingGrid';
import { Language, TRANSLATIONS } from '../locales/translations';

interface Step3ExportPrintProps {
  key?: string;
  croppedPhoto: string;
  preset: PhotoPreset;
  language: Language;
  onBackToEditor: () => void;
  onCreateNew: () => void;
}

export default function Step3ExportPrint({
  croppedPhoto,
  preset,
  language,
  onBackToEditor,
  onCreateNew,
}: Step3ExportPrintProps) {
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
        <button
          id="final_step_back_btn"
          onClick={onBackToEditor}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToEditor}</span>
        </button>

        <button
          id="start_new_photo_btn"
          onClick={onCreateNew}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-lg text-xs transition"
        >
          <span>{t.createNew}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
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

          <div className="space-y-1">
            <h3 className="font-semibold text-slate-100 text-sm">
              {getPresetName(preset.id)} ({preset.widthMm}x{preset.heightMm} mm)
            </h3>
            <p className="text-xs text-slate-400">{t.singlePhotoSpecs}</p>
          </div>

          {/* Action download single image */}
          <a
            id="download_single_photo_btn"
            href={croppedPhoto}
            download={`Passport_Photo_${preset.widthMm}x${preset.heightMm}.jpg`}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-teal-400 hover:text-teal-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>{t.downloadSingleBtn}</span>
          </a>
        </div>

        {/* Printable Collage Generator Panel */}
        <div className="lg:col-span-8">
          <PrintingGrid photoSrc={croppedPhoto} preset={preset} language={language} />
        </div>
      </div>
    </motion.div>
  );
}
