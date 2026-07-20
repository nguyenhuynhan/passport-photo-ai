/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, Upload, Download, Grid, Sparkles, RefreshCw, 
  Settings, ArrowLeft, ArrowRight, UserCheck, ShieldCheck, 
  HelpCircle, Trash2, Printer, Check
} from 'lucide-react';

import { PassportStandard, PHOTO_PRESETS, PhotoPreset } from './types';
import { initModels, isLoaded } from './utils/ai';
import CameraCapture from './components/CameraCapture';
import PhotoEditor from './components/PhotoEditor';
import PrintingGrid from './components/PrintingGrid';
import LanguageSelector from './components/LanguageSelector';
import { Language, TRANSLATIONS, detectInitialLanguage, saveLanguagePreference } from './locales/translations';

// Sample photos for easy testing
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

export default function App() {
  const [language, setLanguage] = useState<Language>(() => detectInitialLanguage());
  const t = TRANSLATIONS[language];

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    saveLanguagePreference(newLang);
  };

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPreset, setSelectedPreset] = useState<PhotoPreset>(PHOTO_PRESETS[PassportStandard.VIETNAM_4x6]);
  
  // Custom specifications (shown if CUSTOM is selected)
  const [customWidth, setCustomWidth] = useState<number>(40);
  const [customHeight, setCustomHeight] = useState<number>(40);
  const [customFacePct, setCustomFacePct] = useState<number>(70);

  // Photo source states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<boolean>(false);
  
  // Models loading state
  const [modelsLoading, setModelsLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [modelsReady, setModelsReady] = useState<boolean>(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Final cropped output photo
  const [croppedPhoto, setCroppedPhoto] = useState<string | null>(null);

  // Drag and drop state
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Helper for localized presets
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

  // Auto-load models on mount or when switching to editor step
  useEffect(() => {
    // Lazy pre-load the models in background so it's ready when needed
    const preLoad = async () => {
      try {
        setModelsLoading(true);
        await initModels((progress) => setLoadingProgress(progress));
        setModelsReady(true);
      } catch (err) {
        console.error('Không thể pre-load mô hình:', err);
      } finally {
        setModelsLoading(false);
      }
    };
    preLoad();
  }, []);

  // Update custom preset when values change
  useEffect(() => {
    if (selectedPreset.id === PassportStandard.CUSTOM) {
      setSelectedPreset({
        id: PassportStandard.CUSTOM,
        name: t.presetCustomName,
        country: 'Custom',
        widthMm: customWidth,
        heightMm: customHeight,
        aspectRatio: customWidth / customHeight,
        faceHeightMinPercent: customFacePct - 5,
        faceHeightMaxPercent: customFacePct + 5,
        defaultBgColor: '#FFFFFF',
        description: t.presetCustomDesc,
        overlaySpecs: {
          headTopPercent: 15,
          chinPercent: 15 + customFacePct,
          eyeLinePercent: 42,
        }
      });
    }
  }, [customWidth, customHeight, customFacePct, language]);

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          setCameraMode(false);
          setStep(2);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle Drop Events
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          setCameraMode(false);
          setStep(2);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle camera capture callback
  const handleCameraCapture = (capturedBase64: string) => {
    setImageSrc(capturedBase64);
    setCameraMode(false);
    setStep(2);
  };

  // Select a sample photo for testing
  const selectSample = (sampleUrl: string) => {
    // Convert url to dataURL or load directly (cors allowed on unsplash)
    setImageSrc(sampleUrl);
    setCameraMode(false);
    setStep(2);
  };

  // Callback when editor successfully exports cropped result
  const handleEditorSave = (outputBase64: string) => {
    setCroppedPhoto(outputBase64);
    setStep(3);
  };

  // Reset and start over
  const handleResetAll = () => {
    setImageSrc(null);
    setCroppedPhoto(null);
    setCameraMode(false);
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Top Header Navigation bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-3 sm:px-6 py-2.5 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/10 shrink-0">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-sm sm:text-lg md:text-xl text-slate-100 tracking-tight flex items-center gap-1.5 leading-snug">
                <span className="truncate">{t.appTitle}</span>
                <span className="text-[9px] sm:text-[10px] bg-teal-500/15 text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded-full font-mono font-medium uppercase tracking-wider shrink-0">
                  {t.localAiBadge}
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block leading-normal">{t.appSubtitle}</p>
            </div>
          </div>

          {/* Top Info Icons & Language Selector */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs text-slate-400 font-medium shrink-0">
            <LanguageSelector currentLang={language} onLanguageChange={handleLanguageChange} />

            <div className="hidden lg:flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t.privacyBadge}</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        
        {/* Step Progress Tracker HUD */}
        <div className="grid grid-cols-3 max-w-2xl mx-auto border-b border-slate-900 pb-2 relative gap-2">
          {[
            { num: 1, text: t.step1Title },
            { num: 2, text: t.step2Title },
            { num: 3, text: t.step3Title }
          ].map((s) => (
            <div 
              key={s.num} 
              className={`flex flex-col items-center text-center gap-1.5 transition pb-3 relative ${
                step === s.num 
                  ? 'text-teal-400 font-semibold' 
                  : step > s.num 
                    ? 'text-slate-300' 
                    : 'text-slate-500'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                step === s.num 
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20' 
                  : step > s.num 
                    ? 'bg-slate-800 text-teal-400 border border-teal-500/20' 
                    : 'bg-slate-900 text-slate-600'
              }`}>
                {s.num}
              </div>
              <span className="text-[10px] md:text-xs leading-tight">{s.text}</span>
              {step === s.num && (
                <motion.div 
                  layoutId="active_step_indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500"
                />
              )}
            </div>
          ))}
        </div>

        {/* Dynamic Workflow Steps */}
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Presets selection & Image input sources */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Presets Grid */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                  <Settings className="w-4 h-4 text-teal-400" />
                  <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-300">
                    {t.selectPresetTitle}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.values(PHOTO_PRESETS).map((preset) => (
                    <div
                      id={`preset_card_${preset.id}`}
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset)}
                      className={`relative rounded-2xl p-5 border cursor-pointer select-none transition flex flex-col justify-between min-h-[160px] ${
                        selectedPreset.id === preset.id
                          ? 'bg-teal-500/5 border-teal-500 shadow-md shadow-teal-500/5 ring-1 ring-teal-500/20'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-md uppercase">
                            {getPresetCountry(preset.id)}
                          </span>
                          <span className="text-xs font-mono font-semibold text-teal-400">
                            {preset.widthMm}x{preset.heightMm} mm
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-100 text-sm leading-tight">{getPresetName(preset.id)}</h3>
                        <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">{getPresetDesc(preset.id)}</p>
                      </div>

                      {/* Tick circle indicator */}
                      {selectedPreset.id === preset.id && (
                        <div className="absolute bottom-4 right-4 bg-teal-500 text-slate-950 rounded-full p-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Custom preset options drawer */}
                {selectedPreset.id === PassportStandard.CUSTOM && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 mt-4"
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
                    <CameraCapture preset={selectedPreset} onCapture={handleCameraCapture} />
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
                        onClick={() => selectSample(sample.url)}
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
          )}

          {/* STEP 2: Main editor */}
          {step === 2 && imageSrc && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <button
                  id="editor_back_btn"
                  onClick={handleResetAll}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t.chooseAnotherPhoto}</span>
                </button>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400">{t.editingPresetLabel}</span>
                  <span className="text-teal-400 font-semibold">{getPresetName(selectedPreset.id)}</span>
                </div>
              </div>

              {/* Editor wrapper */}
              <PhotoEditor 
                imageSrc={imageSrc} 
                preset={selectedPreset} 
                language={language}
                onSave={handleEditorSave} 
              />
            </motion.div>
          )}

          {/* STEP 3: Save results & Collage sheets */}
          {step === 3 && croppedPhoto && (
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
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t.backToEditor}</span>
                </button>

                <button
                  id="start_new_photo_btn"
                  onClick={handleResetAll}
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
                    <h3 className="font-semibold text-slate-100 text-sm">{getPresetName(selectedPreset.id)} ({selectedPreset.widthMm}x{selectedPreset.heightMm} mm)</h3>
                    <p className="text-xs text-slate-400">{t.singlePhotoSpecs}</p>
                  </div>

                  {/* Action download single image */}
                  <a
                    id="download_single_photo_btn"
                    href={croppedPhoto}
                    download={`Passport_Photo_${selectedPreset.widthMm}x${selectedPreset.heightMm}.jpg`}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-teal-400 hover:text-teal-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.downloadSingleBtn}</span>
                  </a>
                </div>

                {/* Printable Collage Generator Panel */}
                <div className="lg:col-span-8">
                  <PrintingGrid photoSrc={croppedPhoto} preset={selectedPreset} language={language} />
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* Footer information details */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500 mt-12 space-y-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>{t.footerCopyright}</p>
          <div className="flex items-center gap-4 text-slate-400 max-w-xl text-left">
            <span className="flex items-center gap-1.5 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              {t.footerPrivacyText}
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
