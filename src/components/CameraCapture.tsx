/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { PhotoPreset } from '../types';
import { Language, TRANSLATIONS } from '../locales/translations';

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
  preset: PhotoPreset;
  language?: Language;
}

export default function CameraCapture({ onCapture, preset, language = 'vi' }: CameraCaptureProps) {
  const t = TRANSLATIONS[language];
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isInitializing, setIsInitializing] = useState(false);

  // Stop camera stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  // Start camera stream
  const startCamera = async () => {
    setIsInitializing(true);
    setError(null);
    if (stream) {
      stopCamera();
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      let errMsg = t.cameraError;
      if (err.name === 'NotAllowedError') {
        errMsg = t.cameraError;
      }
      setError(errMsg);
    } finally {
      setIsInitializing(false);
    }
  };

  // Toggle camera direction (front/back)
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Restart camera when facing mode changes
  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Capture frame
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Set canvas dimensions to match video stream's actual dimensions
        const videoWidth = video.videoWidth || video.width || 640;
        const videoHeight = video.videoHeight || video.height || 480;
        canvas.width = videoWidth;
        canvas.height = videoHeight;

        // If facing user, flip horizontal so it behaves like a mirror
        if (facingMode === 'user') {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Turn canvas to data URL
        const imageSrc = canvas.toDataURL('image/jpeg', 0.95);
        onCapture(imageSrc);
        stopCamera();
      }
    }
  };

  // Automatically start camera on mount, stop on unmount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const overlaySpecs = preset.overlaySpecs;

  return (
    <div id="camera_container" className="flex flex-col items-center bg-slate-900 rounded-2xl overflow-hidden shadow-xl p-4 border border-slate-800">
      <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden flex items-center justify-center">
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-white gap-3 z-20">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-400" />
            <p className="text-sm font-medium">{t.cameraLoading}</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-6 text-center text-white gap-4 z-20">
            <AlertCircle className="w-12 h-12 text-rose-500" />
            <div className="space-y-1">
              <h3 className="font-semibold text-rose-400">Camera Error</h3>
              <p className="text-xs text-slate-300 max-w-sm leading-relaxed">{error}</p>
            </div>
            <button
              id="retry_camera_btn"
              onClick={startCamera}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 transition rounded-lg text-xs font-semibold shadow-md active:scale-95 text-slate-950"
            >
              Retry
            </button>
          </div>
        )}

        {/* Video feed */}
        <video
          id="webcam_feed"
          ref={videoRef}
          className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          playsInline
          muted
        />

        {/* Hidden canvas for capture processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Real-time Portrait HUD Guide Overlay */}
        {isCameraActive && !isInitializing && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Guide Grid & Oval Frame */}
            <div className="relative w-[320px] h-[320px] max-w-full flex items-center justify-center">
              {/* Outer dimmed boundary */}
              <div className="absolute inset-0 border-2 border-dashed border-teal-400/40 rounded-full animate-pulse" />
              
              {/* Head Silhouette Guideline */}
              <svg className="w-full h-full text-teal-400/80" viewBox="0 0 100 100">
                {/* Face Oval */}
                <ellipse cx="50" cy="46" rx="22" ry="29" fill="none" stroke="currentColor" strokeWidth="1.5" />
                
                {/* Eye line */}
                <line x1="20" y1="42" x2="80" y2="42" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2,2" />
                
                {/* Vertical Symmetry line */}
                <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />

                {/* Shoulder lines */}
                <path d="M15 85 Q 35 70 50 70 T 85 85" fill="none" stroke="currentColor" strokeWidth="1" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Control Actions */}
      <div className="flex items-center justify-center gap-4 w-full mt-4">
        <button
          id="toggle_camera_facing_btn"
          onClick={toggleCameraFacing}
          disabled={!isCameraActive || isInitializing}
          className="p-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        <button
          id="capture_snapshot_btn"
          onClick={handleCapture}
          disabled={!isCameraActive || isInitializing}
          className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-700 disabled:opacity-40 text-slate-900 font-semibold rounded-full shadow-lg hover:shadow-teal-500/20 active:scale-95 transition"
        >
          <Camera className="w-5 h-5" />
          <span>{t.captureBtn}</span>
        </button>

        <button
          id="stop_camera_btn"
          onClick={stopCamera}
          className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
