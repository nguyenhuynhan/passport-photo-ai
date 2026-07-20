/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum PassportStandard {
  VIETNAM_4x6 = 'VIETNAM_4x6',
  VIETNAM_3x4 = 'VIETNAM_3x4',
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
    description: 'Nền trắng. Đầu và vai thẳng. Đầu chiếm khoảng 70-80% chiều cao ảnh. Khoảng cách từ đỉnh đầu đến viền trên ảnh khoảng 2-4mm.',
    overlaySpecs: {
      headTopPercent: 12, // approx 2-4mm/60mm from top (3-6%) - let's make it 10-15%
      chinPercent: 85,    // chin at 85% leaves ~70-75% for face
      eyeLinePercent: 40,
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
      headTopPercent: 15,
      chinPercent: 88,
      eyeLinePercent: 42,
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
    description: 'Nền trắng tinh. Đầu phải chiếm từ 50% đến 69% tổng chiều cao của ảnh. Mắt phải cách cạnh dưới của ảnh từ 56% đến 69% (khoảng 40-44% từ đỉnh).',
    overlaySpecs: {
      headTopPercent: 15,
      chinPercent: 75, // 15% to 75% gives 60% face height, centered perfectly
      eyeLinePercent: 42, // 42% from top, which is 58% from bottom
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
      headTopPercent: 12,
      chinPercent: 85,
      eyeLinePercent: 40,
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
      headTopPercent: 15,
      chinPercent: 80,
      eyeLinePercent: 42,
    }
  }
};

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
