/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum PassportStandard {
  VIETNAM_4x6 = 'VIETNAM_4x6',
  VIETNAM_3x4 = 'VIETNAM_3x4',
  CHINA_VISA = 'CHINA_VISA',
  US_VISA = 'US_VISA',
  SCHENGEN = 'SCHENGEN',
  CUSTOM = 'CUSTOM',
}

export interface PhotoPreset {
  id: PassportStandard;
  name: string;
  country: string;
  widthMm: number;
  heightMm: number;
  aspectRatio: number; // width / height
  faceHeightMinPercent: number; // face height relative to total height
  faceHeightMaxPercent: number;
  defaultBgColor: string;
  description: string;
  overlaySpecs: {
    // Guidelines for overlay drawing
    headTopPercent: number; // top of head from top of photo
    chinPercent: number; // bottom of chin from top of photo
    eyeLinePercent: number; // eye line from top of photo
  };
}

export const PHOTO_PRESETS: Record<PassportStandard, PhotoPreset> = {
  [PassportStandard.VIETNAM_4x6]: {
    id: PassportStandard.VIETNAM_4x6,
    name: 'Ảnh Hộ chiếu Việt Nam (4x6 cm)',
    country: 'Việt Nam',
    widthMm: 40,
    heightMm: 60,
    aspectRatio: 2 / 3,
    faceHeightMinPercent: 70,
    faceHeightMaxPercent: 80,
    defaultBgColor: '#FFFFFF',
    description: 'Chuẩn Cổng dịch vụ công Bộ Công An: Nền trắng tinh. Đầu & vai thẳng, lộ rõ 2 vành tai & trán. Chiều cao đầu (từ cằm đến đỉnh đầu/tóc) từ 32mm-36mm (khoảng 53-60% chiều cao 60mm). Xuất độ phân giải 1200x1800px (300 DPI).',
    overlaySpecs: {
      headTopPercent: 8,
      chinPercent: 66,
      eyeLinePercent: 38,
    }
  },
  [PassportStandard.VIETNAM_3x4]: {
    id: PassportStandard.VIETNAM_3x4,
    name: 'Ảnh Chứng chỉ / Hồ sơ Việt Nam (3x4 cm)',
    country: 'Việt Nam',
    widthMm: 30,
    heightMm: 40,
    aspectRatio: 3 / 4,
    faceHeightMinPercent: 70,
    faceHeightMaxPercent: 80,
    defaultBgColor: '#FFFFFF',
    description: 'Nền trắng hoặc nền xanh dương. Thường dùng cho chứng chỉ, bằng lái xe, thẻ học sinh/sinh viên.',
    overlaySpecs: {
      headTopPercent: 10,
      chinPercent: 74,
      eyeLinePercent: 39,
    }
  },
  [PassportStandard.CHINA_VISA]: {
    id: PassportStandard.CHINA_VISA,
    name: 'Ảnh Hộ chiếu / Visa Trung Quốc (3.3x4.8 cm)',
    country: 'Trung Quốc',
    widthMm: 33,
    heightMm: 48,
    aspectRatio: 3.3 / 4.8,
    faceHeightMinPercent: 60,
    faceHeightMaxPercent: 70,
    defaultBgColor: '#FFFFFF',
    description: 'Nền trắng tinh. Mặt hướng thẳng, đầu chiếm từ 28mm-33mm chiều cao ảnh (khoảng 60-70%). Chiều rộng đầu 15mm-22mm.',
    overlaySpecs: {
      headTopPercent: 9,
      chinPercent: 71,
      eyeLinePercent: 39,
    }
  },
  [PassportStandard.US_VISA]: {
    id: PassportStandard.US_VISA,
    name: 'Ảnh Hộ chiếu / Visa Mỹ (2x2 inch)',
    country: 'Hoa Kỳ (USA)',
    widthMm: 50.8,
    heightMm: 50.8,
    aspectRatio: 1,
    faceHeightMinPercent: 50,
    faceHeightMaxPercent: 69,
    defaultBgColor: '#FFFFFF',
    description: 'Nền trắng tinh. Đầu phải chiếm từ 50% đến 69% tổng chiều cao của ảnh. Mắt phải cách cạnh dưới của ảnh từ 56% đến 69%.',
    overlaySpecs: {
      headTopPercent: 10,
      chinPercent: 68,
      eyeLinePercent: 39,
    }
  },
  [PassportStandard.SCHENGEN]: {
    id: PassportStandard.SCHENGEN,
    name: 'Ảnh Visa Châu Âu / Schengen (3.5x4.5 cm)',
    country: 'Châu Âu (EU)',
    widthMm: 35,
    heightMm: 45,
    aspectRatio: 3.5 / 4.5,
    faceHeightMinPercent: 70,
    faceHeightMaxPercent: 80,
    defaultBgColor: '#F0F0F0',
    description: 'Nền xám nhạt hoặc trắng nhạt. Mặt phải rõ nét, đầu chiếm 70% đến 80% (từ 32mm đến 36mm tính từ cằm đến đỉnh đầu, không kể tóc phồng).',
    overlaySpecs: {
      headTopPercent: 8,
      chinPercent: 78,
      eyeLinePercent: 38,
    }
  },
  [PassportStandard.CUSTOM]: {
    id: PassportStandard.CUSTOM,
    name: 'Ảnh kích thước Tuỳ chỉnh',
    country: 'Tuỳ chọn',
    widthMm: 40,
    heightMm: 40,
    aspectRatio: 1,
    faceHeightMinPercent: 60,
    faceHeightMaxPercent: 70,
    defaultBgColor: '#FFFFFF',
    description: 'Tự do căn chỉnh tỉ lệ và chiều cao đầu phù hợp với nhu cầu riêng của bạn.',
    overlaySpecs: {
      headTopPercent: 10,
      chinPercent: 70,
      eyeLinePercent: 39,
    }
  }
};

export function getPresetForLanguage(lang: string): PhotoPreset {
  if (lang === 'vi') {
    return PHOTO_PRESETS[PassportStandard.VIETNAM_4x6];
  }
  if (lang === 'zh') {
    return PHOTO_PRESETS[PassportStandard.CHINA_VISA];
  }
  if (lang === 'en') {
    return PHOTO_PRESETS[PassportStandard.US_VISA];
  }
  return PHOTO_PRESETS[PassportStandard.VIETNAM_4x6];
}

export function detectInitialPreset(lang?: string): PhotoPreset {
  if (lang) {
    return getPresetForLanguage(lang);
  }
  if (typeof navigator !== 'undefined') {
    const browserLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
    if (browserLang.startsWith('zh')) {
      return PHOTO_PRESETS[PassportStandard.CHINA_VISA];
    }
    if (browserLang.startsWith('en')) {
      return PHOTO_PRESETS[PassportStandard.US_VISA];
    }
  }
  return PHOTO_PRESETS[PassportStandard.VIETNAM_4x6];
}

export interface ImageAdjustments {
  zoom: number;       // scale multiplier (e.g. 1.0 = fit)
  rotation: number;   // tilt angle in degrees (-45 to 45)
  offsetX: number;    // horizontal shift in px
  offsetY: number;    // vertical shift in px
  brightness: number; // 50 to 150 (percentage, default 100)
  contrast: number;   // 50 to 150 (percentage, default 100)
  saturation: number; // 0 to 200 (percentage, default 100)
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  zoom: 1.0,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

export interface BgColorOption {
  name: string;
  value: string;
  label: string;
}

export const BG_COLOR_OPTIONS: BgColorOption[] = [
  { name: 'Trắng (White)', value: '#FFFFFF', label: 'bg-white text-black border-slate-300' },
  { name: 'Xanh nhạt (Light Blue)', value: '#89CFF0', label: 'bg-[#89CFF0] text-black border-[#68b5db]' },
  { name: 'Xanh đậm (Blue)', value: '#0F4C81', label: 'bg-[#0F4C81] text-white border-[#09355c]' },
  { name: 'Xám sáng (Light Grey)', value: '#F0F0F0', label: 'bg-[#F0F0F0] text-black border-slate-300' },
  { name: 'Trong suốt (Transparent)', value: 'transparent', label: 'bg-slate-100 text-black border-slate-300' },
];
