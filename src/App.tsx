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

// Sample photos for easy testing
const SAMPLE_PHOTOS = [
  {
    name: 'Ảnh Mẫu (sample.jpg)',
    url: '/sample.jpg',
    gender: 'Nam',
  },
  {
    name: 'Mẫu Nam',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    gender: 'Nam',
  },
  {
    name: 'Mẫu Nữ',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
    gender: 'Nữ',
  },
  {
    name: 'Mẫu Trẻ Em',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
    gender: 'Bé gái',
  }
];

export default function App() {
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
        name: 'Ảnh kích thước Tuỳ chỉnh',
        country: 'Tuỳ chọn',
        widthMm: customWidth,
        heightMm: customHeight,
        aspectRatio: customWidth / customHeight,
        faceHeightMinPercent: customFacePct - 5,
        faceHeightMaxPercent: customFacePct + 5,
        defaultBgColor: '#FFFFFF',
        description: `Ảnh tự chọn ${customWidth}x${customHeight} mm với khuôn mặt chiếm khoảng ${customFacePct}% chiều cao ảnh.`,
        overlaySpecs: {
          headTopPercent: 15,
          chinPercent: 15 + customFacePct,
          eyeLinePercent: 42,
        }
      });
    }
  }, [customWidth, customHeight, customFacePct]);

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
  const handleCameraCapture = (capturedSrc: string) => {
    setImageSrc(capturedSrc);
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
  const handleEditorSave = (output: string) => {
    setCroppedPhoto(output);
    setStep(3);
  };

  // Reset and start over
  const handleReset = () => {
    setImageSrc(null);
    setCroppedPhoto(null);
    setCameraMode(false);
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Top Header Navigation bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/10">
              <Camera className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg md:text-xl text-slate-100 tracking-tight flex items-center gap-2">
                Trình Tạo Ảnh Hộ Chiếu AI
                <span className="text-[10px] bg-teal-500/15 text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded-full font-mono font-medium uppercase tracking-wider animate-pulse">
                  Local AI
                </span>
              </h1>
              <p className="text-xs text-slate-400">Tự động căn chỉnh & tách nền chuẩn quốc tế trên thiết bị của bạn</p>
            </div>
          </div>

          {/* Top Info Icons */}
          <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Bảo mật 100% (Offline)</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        
        {/* Step Progress Tracker HUD */}
        <div className="grid grid-cols-3 max-w-2xl mx-auto border-b border-slate-900 pb-2 relative gap-2">
          {[
            { num: 1, text: 'Chọn chuẩn & Tải ảnh' },
            { num: 2, text: 'Căn chỉnh & Tách nền' },
            { num: 3, text: 'Xếp tấm in & Tải về' }
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
                    Chọn chuẩn kích thước ảnh:
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
                            {preset.country}
                          </span>
                          <span className="text-xs font-mono font-semibold text-teal-400">
                            {preset.widthMm}x{preset.heightMm} mm
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-100 text-sm leading-tight">{preset.name}</h3>
                        <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">{preset.description}</p>
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
                      <label className="text-xs font-semibold text-slate-300 block">Chiều rộng (mm):</label>
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
                      <label className="text-xs font-semibold text-slate-300 block">Chiều cao (mm):</label>
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
                      <label className="text-xs font-semibold text-slate-300 block">Tỉ lệ khuôn mặt đầu chiếm (%):</label>
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
                      Tải lên hình chân dung:
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
                      <p className="text-sm font-medium text-slate-300">Kéo thả file ảnh vào đây</p>
                      <p className="text-xs text-slate-400 mt-1 mb-4">hoặc</p>
                      
                      <label className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg cursor-pointer">
                        Chọn File Ảnh Từ Máy
                        <input 
                          id="file_upload_input"
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileUpload} 
                          className="hidden" 
                        />
                      </label>
                      <p className="text-[10px] text-slate-400 mt-3">Hỗ trợ định dạng JPG, PNG, WEBP. Ảnh sắc nét, hướng thẳng.</p>
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
                      <span>Sử dụng Camera trực tiếp của thiết bị</span>
                    </button>
                  )}
                </div>

                {/* Right Sample Testing Card */}
                <div className="lg:col-span-5 space-y-4 bg-slate-900/20 border border-slate-900 rounded-2xl p-6">
                  <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <h3 className="font-display font-semibold text-sm text-slate-300 uppercase tracking-wider">
                      Trải nghiệm thử AI ngay:
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Bạn không có sẵn ảnh chân dung? Hãy click chọn một ảnh mẫu chất lượng cao dưới đây để trải nghiệm tức thì khả năng căn chỉnh khuôn mặt và tách phông nền đỉnh cao của mô hình AI:
                  </p>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {SAMPLE_PHOTOS.map((sample) => (
                      <button
                        id={`select_sample_${sample.name.replace(' ', '_')}_btn`}
                        key={sample.name}
                        onClick={() => selectSample(sample.url)}
                        className="group flex flex-col items-center gap-2 p-1.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-xl transition text-center select-none cursor-pointer"
                      >
                        <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-950 relative">
                          <img 
                            src={sample.url} 
                            alt={sample.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-semibold text-slate-300">{sample.name}</p>
                          <span className="text-[8px] bg-slate-800 px-1 py-0.2 rounded text-slate-400 font-mono">{sample.gender}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2 mt-4 text-[11px] text-slate-400 leading-relaxed">
                    <p className="font-semibold text-teal-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      Yêu cầu ảnh chụp hộ chiếu đạt chuẩn:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Khuôn mặt hướng thẳng, nhìn trực diện vào ống kính.</li>
                      <li>Nét mặt trung tính, không cười hở răng, mở mắt rõ.</li>
                      <li>Ánh sáng phân bổ đều trên mặt, không đổ bóng đậm.</li>
                      <li>Không đeo kính râm, không đội mũ (trừ trang phục tôn giáo).</li>
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
                  onClick={handleReset}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Chọn ảnh khác</span>
                </button>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400">Đang chỉnh sửa:</span>
                  <span className="text-teal-400 font-semibold">{selectedPreset.name}</span>
                </div>
              </div>

              {/* Editor wrapper */}
              <PhotoEditor 
                imageSrc={imageSrc} 
                preset={selectedPreset} 
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
                  <span>Quay lại chỉnh sửa thêm</span>
                </button>

                <button
                  id="start_new_photo_btn"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-lg text-xs transition"
                >
                  <span>Tạo ảnh mới</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Result Grid with Printable Grid on right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Single Image Export Panel */}
                <div className="lg:col-span-4 flex flex-col items-center bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg text-center">
                  <div className="flex items-center gap-1.5 text-xs text-teal-400 font-semibold self-start bg-teal-500/10 px-2.5 py-1 rounded-full">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Ảnh Đơn Lẻ Đã Hoàn Thành</span>
                  </div>

                  {/* Rendered cropped output image */}
                  <div className="relative aspect-[2/3] w-full max-w-[180px] bg-white rounded-xl shadow-xl overflow-hidden p-0.5 border border-slate-700">
                    <img 
                      src={croppedPhoto} 
                      alt="Ảnh hộ chiếu thành phẩm" 
                      className="w-full h-full object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-100 text-sm">Ảnh hộ chiếu {selectedPreset.widthMm}x{selectedPreset.heightMm} mm</h3>
                    <p className="text-xs text-slate-400">File PNG chất lượng cao chuẩn in ấn</p>
                  </div>

                  {/* Action download single image */}
                  <a
                    id="download_single_photo_btn"
                    href={croppedPhoto}
                    download={`Anh_Ho_Chieu_${selectedPreset.widthMm}x${selectedPreset.heightMm}.jpg`}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-teal-400 hover:text-teal-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải ảnh đơn lẻ chất lượng cao</span>
                  </a>
                </div>

                {/* Printable Collage Generator Panel */}
                <div className="lg:col-span-8">
                  <PrintingGrid photoSrc={croppedPhoto} preset={selectedPreset} />
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* Footer information details */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500 mt-12 space-y-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 AI Passport Photo Maker. Bản quyền được bảo lưu.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Bảo mật tuyệt đối: Toàn bộ quá trình tách nền & phân tích AI được thực hiện 100% offline tại trình duyệt của bạn. Chúng tôi không bao giờ tải ảnh chân dung của bạn lên bất kỳ máy chủ nào.
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
