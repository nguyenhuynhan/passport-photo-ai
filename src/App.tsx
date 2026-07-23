import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Sparkles, ShieldCheck } from 'lucide-react';

import { PassportStandard, PHOTO_PRESETS, PhotoPreset, detectInitialPreset, getPresetForLanguage } from './types';
import { initModels } from './utils/ai';
import Step1SelectPhoto from './components/Step1SelectPhoto';
import PhotoEditor from './components/PhotoEditor';
import Step3ExportPrint from './components/Step3ExportPrint';
import LanguageSelector from './components/LanguageSelector';
import { Language, TRANSLATIONS, detectInitialLanguage, saveLanguagePreference } from './locales/translations';

export default function App() {
  const [language, setLanguage] = useState<Language>(() => detectInitialLanguage());
  const t = TRANSLATIONS[language];

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    saveLanguagePreference(newLang);
  };

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPreset, setSelectedPreset] = useState<PhotoPreset>(() => detectInitialPreset(language));

  // Custom specifications (shown if CUSTOM is selected)
  const [customWidth, setCustomWidth] = useState<number>(40);
  const [customHeight, setCustomHeight] = useState<number>(40);
  const [customFacePct, setCustomFacePct] = useState<number>(70);
  // Fast mode processing state (default: true -> Instant MediaPipe fast mode ~4s)
  const [fastMode, setFastMode] = useState<boolean>(true);

  // Photo source states
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Models loading state
  const [modelsLoading, setModelsLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [modelsReady, setModelsReady] = useState<boolean>(false);

  // Final cropped output photo
  const [croppedPhoto, setCroppedPhoto] = useState<string | null>(null);

  // Auto-scroll to top smoothly when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Expose automation test API on window & support ?autotest=true query parameter
  useEffect(() => {
    const sampleUrl = '/test-man.jpg';
    
    (window as any).passportTest = {
      setStep: (s: 1 | 2 | 3) => setStep(s),
      selectPhoto: (src: string) => {
        setImageSrc(src);
        setStep(2);
      },
      selectSamplePhoto: () => {
        setImageSrc(sampleUrl);
        setStep(2);
      },
      getStep: () => step,
      getImageSrc: () => imageSrc,
      getCroppedPhoto: () => croppedPhoto,
      getPreset: () => selectedPreset,
      setPreset: (p: PhotoPreset) => setSelectedPreset(p),
      resetAll: () => handleResetAll(),
    };

    // Auto-test query param handler
    const params = new URLSearchParams(window.location.search);
    if (params.get('autotest') === 'true' || params.get('autoTest') === 'true') {
      const customPhoto = params.get('photo') || sampleUrl;
      const presetIdxParam = params.get('presetIndex');
      if (presetIdxParam !== null) {
        const presetsList = Object.values(PHOTO_PRESETS);
        const idx = parseInt(presetIdxParam, 10);
        if (presetsList[idx]) {
          setSelectedPreset(presetsList[idx]);
        }
      }
      const fastParam = params.get('fastMode') ?? params.get('fast');
      if (fastParam !== null) {
        setFastMode(fastParam === 'true');
      }
      console.log('[AUTOMATION TEST] Auto-selecting photo and transitioning to Step 2:', customPhoto);
      setImageSrc(customPhoto);
      setStep(2);
    }
  }, []);

  // Pre-load models in background on mount
  useEffect(() => {
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

  // Callback when a photo is selected
  const handlePhotoSelected = (src: string) => {
    setImageSrc(src);
    setStep(2);
  };

  // Callback when editor updates cropped image result (Does NOT change step)
  const handleCropChange = (outputBase64: string) => {
    setCroppedPhoto(outputBase64);
  };

  // Reset and start over
  const handleResetAll = () => {
    setImageSrc(null);
    setCroppedPhoto(null);
    setStep(1);
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
                <span className="truncate text-teal-400 font-extrabold lowercase tracking-tight">idfoto</span>
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

      {/* Sticky Step Progress Tracker HUD */}
      <div className="sticky top-[53px] sm:top-[65px] z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-900/90 py-2.5 px-4 shadow-lg">
        <div className="grid grid-cols-3 max-w-xl mx-auto gap-2 items-center">
          {[
            { num: 1, text: t.step1Title, isAI: false, enabled: true },
            { num: 2, text: t.step2Title, isAI: true, enabled: !!imageSrc },
            { num: 3, text: t.step3Title, isAI: false, enabled: !!(croppedPhoto || imageSrc), isExportBtn: true }
          ].map((s) => {
            const isCurrent = step === s.num;

            // Render Step 3 as a prominent button component
            if (s.isExportBtn) {
              return (
                <button
                  id="step_3_export_hud_btn"
                  key={s.num}
                  disabled={!s.enabled}
                  onClick={() => s.enabled && setStep(3)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl font-bold text-xs transition-all select-none shadow-md ${
                    !s.enabled
                      ? 'bg-slate-900/70 border border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                      : isCurrent
                        ? 'bg-teal-500 text-slate-950 ring-2 ring-teal-400 shadow-teal-500/30 cursor-pointer active:scale-95'
                        : 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 cursor-pointer active:scale-95 animate-pulse'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    !s.enabled
                      ? 'bg-slate-800 text-slate-500'
                      : isCurrent
                        ? 'bg-slate-950 text-teal-400'
                        : 'bg-teal-500 text-slate-950'
                  }`}>
                    3
                  </div>
                  <span>{s.text}</span>
                </button>
              );
            }

            return (
              <button
                key={s.num}
                disabled={!s.enabled}
                onClick={() => {
                  if (s.num === 1) setStep(1);
                  else if (s.num === 2 && imageSrc) setStep(2);
                }}
                className={`flex flex-col items-center text-center gap-1 transition-all py-1 px-2 rounded-xl relative select-none ${
                  s.enabled ? 'cursor-pointer hover:bg-slate-900/60' : 'cursor-not-allowed opacity-40'
                } ${
                  isCurrent 
                    ? 'text-teal-400 font-semibold' 
                    : step > s.num 
                      ? 'text-slate-300' 
                      : 'text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold transition ${
                    isCurrent 
                      ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20' 
                      : step > s.num 
                        ? 'bg-slate-800 text-teal-400 border border-teal-500/30' 
                        : 'bg-slate-900 text-slate-600'
                  }`}>
                    {s.num}
                  </div>
                  <span className="text-xs font-medium leading-tight flex items-center gap-1">
                    {s.text}
                    {s.isAI && <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0 animate-pulse" />}
                  </span>
                </div>
                {isCurrent && (
                  <motion.div 
                    layoutId="active_step_indicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-teal-500 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        {/* STEP 1: Select Preset & Upload Photo */}
        {step === 1 && (
          <Step1SelectPhoto
            key="step-1"
            selectedPreset={selectedPreset}
            onSelectPreset={setSelectedPreset}
            customWidth={customWidth}
            setCustomWidth={setCustomWidth}
            customHeight={customHeight}
            setCustomHeight={setCustomHeight}
            customFacePct={customFacePct}
            setCustomFacePct={setCustomFacePct}
            onPhotoSelected={handlePhotoSelected}
            language={language}
          />
        )}

        {/* STEP 2: Edit & Align Photo (Preserve mounted state while imageSrc exists) */}
        {imageSrc && (
          <div className={step === 2 ? 'space-y-4' : 'hidden'}>
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">{t.editingPresetLabel}</span>
                <span className="text-teal-400 font-semibold">{getPresetName(selectedPreset.id)}</span>
              </div>
            </div>

            <PhotoEditor 
              imageSrc={imageSrc} 
              preset={selectedPreset} 
              language={language}
              fastMode={fastMode}
              onCropChange={handleCropChange} 
            />
          </div>
        )}

        {/* STEP 3: Export & Printable Grid */}
        {step === 3 && (croppedPhoto || imageSrc) && (
          <Step3ExportPrint
            key="step-3"
            croppedPhoto={croppedPhoto || imageSrc}
            preset={selectedPreset}
            language={language}
          />
        )}
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
