import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Upload, Camera, Sparkles, ShieldCheck, ChevronDown, Check } from 'lucide-react';
import { PassportStandard, PHOTO_PRESETS, PhotoPreset } from '../types';
import CameraCapture from './CameraCapture';
import { Language, TRANSLATIONS } from '../locales/translations';

const SAMPLE_PHOTOS = [
  {
    key: 'maleSample',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
  },
  {
    key: 'femaleSample',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
  },
  {
    key: 'childSample',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
  }
];

interface Step1SelectPhotoProps {
  key?: string;
  selectedPreset: PhotoPreset;
  onSelectPreset: (preset: PhotoPreset) => void;
  customWidth: number;
  setCustomWidth: (val: number) => void;
  customHeight: number;
  setCustomHeight: (val: number) => void;
  customFacePct: number;
  setCustomFacePct: (val: number) => void;
  onPhotoSelected: (imageSrc: string) => void;
  language: Language;
}

export default function Step1SelectPhoto({
  selectedPreset,
  onSelectPreset,
  customWidth,
  setCustomWidth,
  customHeight,
  setCustomHeight,
  customFacePct,
  setCustomFacePct,
  onPhotoSelected,
  language,
}: Step1SelectPhotoProps) {
  const t = TRANSLATIONS[language];
  const [cameraMode, setCameraMode] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  // Custom multiline dropdown open state & outside click handler
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPresetCountry = (presetId: PassportStandard) => {
    switch (presetId) {
      case PassportStandard.VIETNAM_4x6:
      case PassportStandard.VIETNAM_3x4: return t.presetViCountry;
      case PassportStandard.CHINA_VISA: return t.presetChinaCountry;
      case PassportStandard.US_VISA: return t.presetUsCountry;
      case PassportStandard.SCHENGEN: return t.presetSchengenCountry;
      case PassportStandard.CUSTOM: return t.presetCustomCountry;
    }
  };

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

  const getSampleLabel = (key: string) => {
    switch (key) {
      case 'maleSample': return t.maleSample;
      case 'femaleSample': return t.femaleSample;
      case 'childSample': return t.childSample;
      default: return key;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onPhotoSelected(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onPhotoSelected(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      key="step-1"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      {/* Presets Selection Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
          <Settings className="w-4 h-4 text-teal-400" />
          <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-300">
            {t.selectPresetTitle}
          </h2>
        </div>

        {/* Custom Multiline Presets Dropdown */}
        <div className="max-w-xl space-y-3 relative" ref={dropdownRef}>
          <button
            id="preset_select_dropdown_trigger"
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-teal-500 rounded-2xl p-4 text-left transition shadow-md flex items-center justify-between gap-3 cursor-pointer select-none"
          >
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] bg-slate-800 text-teal-300 font-semibold px-2 py-0.5 rounded uppercase shrink-0">
                  {getPresetCountry(selectedPreset.id)}
                </span>
                <span className="text-xs font-mono font-bold text-teal-400 shrink-0">
                  {selectedPreset.widthMm} x {selectedPreset.heightMm} mm
                </span>
              </div>
              <h3 className="font-semibold text-slate-100 text-sm leading-snug">{getPresetName(selectedPreset.id)}</h3>
            </div>
            <ChevronDown className={`w-5 h-5 text-teal-400 shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Multiline Dropdown Popover List */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 z-30 mt-2 bg-slate-950/98 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-2 space-y-2 max-h-[380px] overflow-y-auto"
              >
                {Object.values(PHOTO_PRESETS).map((preset) => {
                  const isSelected = selectedPreset.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        onSelectPreset(preset);
                        setDropdownOpen(false);
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition select-none space-y-1.5 ${
                        isSelected
                          ? 'bg-teal-500/10 border-teal-500/80 ring-1 ring-teal-500/30'
                          : 'bg-slate-900/60 border-slate-800/60 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded uppercase shrink-0">
                          {getPresetCountry(preset.id)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-teal-400">
                            {preset.widthMm} x {preset.heightMm} mm
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-teal-400 shrink-0 stroke-[2.5]" />}
                        </div>
                      </div>

                      <h4 className="font-semibold text-slate-100 text-sm leading-snug">{getPresetName(preset.id)}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed whitespace-normal break-words">{getPresetDesc(preset.id)}</p>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preset Details Summary Box */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 space-y-1.5">
            <p className="text-xs text-slate-400 leading-relaxed">{getPresetDesc(selectedPreset.id)}</p>
          </div>
        </div>

        {/* Custom preset options drawer */}
        {selectedPreset.id === PassportStandard.CUSTOM && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 max-w-xl"
          >
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">{t.customWidthLabel}</label>
              <div className="flex items-center gap-3">
                <input
                  id="custom_width_range"
                  type="range"
                  min="20"
                  max="100"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(parseInt(e.target.value))}
                  className="w-full accent-teal-400"
                />
                <span className="text-sm font-semibold text-teal-400 font-mono w-12 text-right">{customWidth}mm</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">{t.customHeightLabel}</label>
              <div className="flex items-center gap-3">
                <input
                  id="custom_height_range"
                  type="range"
                  min="20"
                  max="100"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(parseInt(e.target.value))}
                  className="w-full accent-teal-400"
                />
                <span className="text-sm font-semibold text-teal-400 font-mono w-12 text-right">{customHeight}mm</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">{t.customFacePctLabel}</label>
              <div className="flex items-center gap-3">
                <input
                  id="custom_face_pct_range"
                  type="range"
                  min="40"
                  max="90"
                  value={customFacePct}
                  onChange={(e) => setCustomFacePct(parseInt(e.target.value))}
                  className="w-full accent-teal-400"
                />
                <span className="text-sm font-semibold text-teal-400 font-mono w-12 text-right">{customFacePct}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Photo Source Inputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Upload Card */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
            <Upload className="w-4 h-4 text-teal-400" />
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-300">
              {t.choosePhotoTitle}
            </h2>
          </div>

          {cameraMode ? (
            <CameraCapture preset={selectedPreset} onCapture={(captured) => { setCameraMode(false); onPhotoSelected(captured); }} />
          ) : (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`h-72 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-6 transition ${
                dragActive
                  ? 'border-teal-400 bg-teal-500/5 text-teal-300'
                  : 'border-slate-800 bg-slate-900/10 hover:border-slate-700 text-slate-400'
              }`}
            >
              <Upload className="w-10 h-10 text-slate-500 mb-3" />
              <p className="text-sm font-medium text-slate-300">{t.dragDropTitle}</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">{t.dragDropSub}</p>

              <label className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg cursor-pointer">
                {t.browseBtn}
                <input
                  id="file_upload_input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[10px] text-slate-400 mt-3">{t.supportedFormats}</p>
            </div>
          )}

          {/* Toggle Source Camera Button */}
          {!cameraMode && (
            <button
              id="start_camera_source_btn"
              onClick={() => setCameraMode(true)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] border border-slate-800 text-slate-200 hover:text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold transition"
            >
              <Camera className="w-4 h-4 text-teal-400" />
              <span>{t.useCameraBtn}</span>
            </button>
          )}
        </div>

        {/* Right Sample Testing Card */}
        <div className="lg:col-span-5 space-y-4 bg-slate-900/20 border border-slate-900 rounded-2xl p-6">
          <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <h3 className="font-display font-semibold text-sm text-slate-300 uppercase tracking-wider">
              {t.tryAiTitle}
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t.tryAiDesc}
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {SAMPLE_PHOTOS.map((sample) => (
              <button
                id={`select_sample_${sample.key}_btn`}
                key={sample.key}
                onClick={() => onPhotoSelected(sample.url)}
                className="group flex flex-col items-center gap-2 p-1.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-xl transition text-center select-none cursor-pointer"
              >
                <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-950 relative">
                  <img
                    src={sample.url}
                    alt={getSampleLabel(sample.key)}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-slate-300">{getSampleLabel(sample.key)}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2 mt-4 text-[11px] text-slate-400 leading-relaxed">
            <p className="font-semibold text-teal-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              {t.guidelinesTitle}
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>{t.guidelineItem1}</li>
              <li>{t.guidelineItem2}</li>
              <li>{t.guidelineItem3}</li>
              <li>{t.guidelineItem4}</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
