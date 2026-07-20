/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'vi' | 'en' | 'zh';

export interface Translations {
  // Navigation & Header
  appTitle: string;
  appSubtitle: string;
  privacyBadge: string;
  localAiBadge: string;

  // Steps
  step1Title: string;
  step2Title: string;
  step3Title: string;

  // Step 1: Select Preset & Upload
  selectStandard: string;
  selectStandardDesc: string;
  choosePhoto: string;
  uploadFromDevice: string;
  takePhoto: string;
  samplePhotos: string;
  dragDropText: string;
  clickToBrowse: string;
  orChooseSample: string;
  customWidth: string;
  customHeight: string;
  customFacePct: string;
  samplePhotoLabel: string;
  maleSample: string;
  femaleSample: string;
  childSample: string;

  // Step 2: Editor & AI
  aiAnalyzing: string;
  aiFaceFound: string;
  aiSmartFallback: string;
  aiNoFace: string;
  aiProcessingComplete: string;
  topHead: string;
  eyeLine: string;
  chin: string;
  toggleGuides: string;
  resetTransform: string;
  removeBg: string;
  bgColor: string;
  adjustments: string;
  zoom: string;
  rotate: string;
  brightness: string;
  contrast: string;
  saturation: string;
  nextPrintGrid: string;
  backToStep1: string;

  // Background Colors
  bgWhite: string;
  bgLightBlue: string;
  bgDarkBlue: string;
  bgLightGrey: string;
  bgTransparent: string;

  // Step 3: Printing Grid
  printGridTitle: string;
  printGridDesc: string;
  downloadSingle: string;
  downloadSheet: string;
  printNow: string;
  paperSize: string;
  paperA4: string;
  paper4x6: string;
  paper5x7: string;
  photoCount: string;
  copies: string;
  backToEditor: string;
  createNew: string;

  // Presets
  presetVi4x6Name: string;
  presetVi4x6Desc: string;
  presetVi3x4Name: string;
  presetVi3x4Desc: string;
  presetUsVisaName: string;
  presetUsVisaDesc: string;
  presetSchengenName: string;
  presetSchengenDesc: string;
  presetCustomName: string;
  presetCustomDesc: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  vi: {
    appTitle: 'Trình Tạo Ảnh Hộ Chiếu AI',
    appSubtitle: 'Tự động căn chỉnh & tách nền chuẩn quốc tế trên thiết bị của bạn',
    privacyBadge: 'Bảo mật 100% (Offline)',
    localAiBadge: 'AI CỤC BỘ',

    step1Title: '1. Chọn Chuẩn Ảnh & Tải Ảnh',
    step2Title: '2. Căn Chỉnh & Tách Nền AI',
    step3Title: '3. Xuất & In Tấm Ảnh',

    selectStandard: 'Chọn Tiêu Chuẩn Hộ Chiếu / Thẻ',
    selectStandardDesc: 'Mỗi quốc gia và loại giấy tờ yêu cầu kích thước và tỉ lệ khuôn mặt khác nhau.',
    choosePhoto: 'Tải Ảnh Của Bạn Lên',
    uploadFromDevice: 'Tải ảnh từ thiết bị',
    takePhoto: 'Chụp ảnh bằng Camera',
    samplePhotos: 'Hoặc dùng ảnh mẫu thử nghiệm:',
    dragDropText: 'Kéo & thả ảnh vào đây',
    clickToBrowse: 'hoặc bấm để chọn tệp từ máy tính / điện thoại',
    orChooseSample: 'Chọn ảnh mẫu thử nghiệm nhanh',
    customWidth: 'Rộng (mm)',
    customHeight: 'Cao (mm)',
    customFacePct: 'Tỉ lệ mặt (%)',
    samplePhotoLabel: 'Ảnh Mẫu (sample.jpg)',
    maleSample: 'Mẫu Nam',
    femaleSample: 'Mẫu Nữ',
    childSample: 'Mẫu Trẻ Em',

    aiAnalyzing: 'AI đang phân tích khuôn mặt & tách nền...',
    aiFaceFound: 'Đã phát hiện khuôn mặt! Đang căn chỉnh trục mắt và tỉ lệ chuẩn...',
    aiSmartFallback: 'Đã tự động định vị khuôn mặt từ nhận diện chân dung!',
    aiNoFace: 'Không tìm thấy khuôn mặt rõ ràng. Chuyển sang căn chỉnh thủ công.',
    aiProcessingComplete: 'Xử lý AI thành công!',
    topHead: 'Đỉnh đầu (Top Head)',
    eyeLine: 'Trục mắt (Eyes)',
    chin: 'Cằm (Chin)',
    toggleGuides: 'Đường hướng dẫn',
    resetTransform: 'Đặt lại trục',
    removeBg: 'Tự động Tách nền AI',
    bgColor: 'Màu nền thay thế',
    adjustments: 'Điều chỉnh ánh sáng & màu sắc',
    zoom: 'Thu phóng',
    rotate: 'Xoay nghiêng',
    brightness: 'Độ sáng',
    contrast: 'Độ tương phản',
    saturation: 'Độ bão hòa',
    nextPrintGrid: 'Tiếp tục: Dàn trang In ➜',
    backToStep1: '← Chọn ảnh khác',

    bgWhite: 'Trắng (White)',
    bgLightBlue: 'Xanh nhạt (Light Blue)',
    bgDarkBlue: 'Xanh đậm (Blue)',
    bgLightGrey: 'Xám sáng (Light Grey)',
    bgTransparent: 'Trong suốt (PNG)',

    printGridTitle: 'Dàn Trang In Ảnh Hộ Chiếu',
    printGridDesc: 'Tự động sắp xếp nhiều ảnh lên khổ giấy in tiêu chuẩn sẵn sàng mang đi in.',
    downloadSingle: 'Tải 1 ảnh đơn (HQ)',
    downloadSheet: 'Tải trang in (PNG)',
    printNow: 'In ngay',
    paperSize: 'Khổ giấy in',
    paperA4: 'Giấy A4 (210 x 297 mm)',
    paper4x6: 'Giấy in ảnh 4x6 inch (10x15 cm)',
    paper5x7: 'Giấy in ảnh 5x7 inch (13x18 cm)',
    photoCount: 'Số lượng ảnh',
    copies: 'tấm ảnh',
    backToEditor: '← Chỉnh sửa lại',
    createNew: 'Tạo ảnh mới',

    presetVi4x6Name: 'Ảnh Hộ chiếu Việt Nam (4x6 cm)',
    presetVi4x6Desc: 'Nền trắng. Đầu và vai thẳng. Đầu chiếm khoảng 70-80% chiều cao ảnh. Khoảng cách từ đỉnh đầu đến viền trên ảnh khoảng 2-4mm.',
    presetVi3x4Name: 'Ảnh Chứng chỉ / Hồ sơ Việt Nam (3x4 cm)',
    presetVi3x4Desc: 'Nền trắng hoặc nền xanh dương. Thường dùng cho chứng chỉ, bằng lái xe, thẻ học sinh/sinh viên.',
    presetUsVisaName: 'Ảnh Hộ chiếu / Visa Mỹ (2x2 inch)',
    presetUsVisaDesc: 'Nền trắng tinh. Đầu phải chiếm từ 50% đến 69% tổng chiều cao của ảnh. Mắt cách cạnh dưới 56%-69%.',
    presetSchengenName: 'Ảnh Visa Châu Âu / Schengen (3.5x4.5 cm)',
    presetSchengenDesc: 'Nền xám nhạt hoặc trắng nhạt. Mặt rõ nét, đầu chiếm 70% đến 80% chiều cao ảnh (32mm - 36mm).',
    presetCustomName: 'Ảnh kích thước Tuỳ chỉnh',
    presetCustomDesc: 'Tự do căn chỉnh tỉ lệ và chiều cao đầu phù hợp với nhu cầu riêng của bạn.',
  },

  en: {
    appTitle: 'AI Passport Photo Maker',
    appSubtitle: 'Automatic biometric alignment & AI background removal on your device',
    privacyBadge: '100% Private (Offline)',
    localAiBadge: 'LOCAL AI',

    step1Title: '1. Select Preset & Upload Photo',
    step2Title: '2. Align & Remove Background',
    step3Title: '3. Export & Print Sheet',

    selectStandard: 'Choose Passport / Visa Standard',
    selectStandardDesc: 'Different countries and documents require specific dimensions and head proportions.',
    choosePhoto: 'Upload Your Photo',
    uploadFromDevice: 'Upload from device',
    takePhoto: 'Take a photo with Camera',
    samplePhotos: 'Or try sample test photos:',
    dragDropText: 'Drag & drop your photo here',
    clickToBrowse: 'or click to browse files from computer / phone',
    orChooseSample: 'Quick select a test sample photo',
    customWidth: 'Width (mm)',
    customHeight: 'Height (mm)',
    customFacePct: 'Face Size (%)',
    samplePhotoLabel: 'Sample Photo (sample.jpg)',
    maleSample: 'Male Sample',
    femaleSample: 'Female Sample',
    childSample: 'Child Sample',

    aiAnalyzing: 'AI is analyzing face & removing background...',
    aiFaceFound: 'Face detected! Auto-aligning eye line and proportions...',
    aiSmartFallback: 'Auto-located face position from portrait detection!',
    aiNoFace: 'No clear face detected. Switch to manual adjustment.',
    aiProcessingComplete: 'AI processing complete!',
    topHead: 'Top of Head',
    eyeLine: 'Eye Line',
    chin: 'Chin',
    toggleGuides: 'Toggle Guidelines',
    resetTransform: 'Reset Adjustments',
    removeBg: 'Auto AI Background Removal',
    bgColor: 'Background Color',
    adjustments: 'Light & Color Adjustments',
    zoom: 'Zoom',
    rotate: 'Rotation',
    brightness: 'Brightness',
    contrast: 'Contrast',
    saturation: 'Saturation',
    nextPrintGrid: 'Next: Print Layout ➜',
    backToStep1: '← Choose another photo',

    bgWhite: 'White',
    bgLightBlue: 'Light Blue',
    bgDarkBlue: 'Blue',
    bgLightGrey: 'Light Grey',
    bgTransparent: 'Transparent (PNG)',

    printGridTitle: 'Passport Photo Print Sheet',
    printGridDesc: 'Automatically arrange multiple photos onto standard photo paper sizes ready for printing.',
    downloadSingle: 'Download Single Photo (HQ)',
    downloadSheet: 'Download Print Sheet (PNG)',
    printNow: 'Print Now',
    paperSize: 'Paper Size',
    paperA4: 'A4 Paper (210 x 297 mm)',
    paper4x6: '4x6 Inch Photo Paper (10x15 cm)',
    paper5x7: '5x7 Inch Photo Paper (13x18 cm)',
    photoCount: 'Number of photos',
    copies: 'photos',
    backToEditor: '← Back to Editor',
    createNew: 'Create New Photo',

    presetVi4x6Name: 'Vietnam Passport Photo (4x6 cm)',
    presetVi4x6Desc: 'White background. Head and shoulders straight. Head takes up 70-80% of height.',
    presetVi3x4Name: 'Vietnam ID / Certificate Photo (3x4 cm)',
    presetVi3x4Desc: 'White or light blue background. Used for licenses, student cards, and certificates.',
    presetUsVisaName: 'US Passport / Visa Photo (2x2 inch)',
    presetUsVisaDesc: 'Off-white or white background. Head must be 50%-69% of image height.',
    presetSchengenName: 'Schengen / Europe Visa Photo (3.5x4.5 cm)',
    presetSchengenDesc: 'Light grey or white background. Head takes up 70-80% of image height (32-36mm).',
    presetCustomName: 'Custom Dimensions',
    presetCustomDesc: 'Freely set width, height, and face ratio according to your specific needs.',
  },

  zh: {
    appTitle: 'AI 护照照片制作工具',
    appSubtitle: '在您的设备上自动完成生物特征对齐与 AI 背景替换',
    privacyBadge: '100% 隐私保护 (离线运行)',
    localAiBadge: '本地 AI',

    step1Title: '1. 选择规格与上传照片',
    step2Title: '2. 智能对齐与 AI 抠图',
    step3Title: '3. 导出与打印排版',

    selectStandard: '选择护照 / 签证照片规格',
    selectStandardDesc: '不同国家和证件类型对尺寸及头部比例有特定要求。',
    choosePhoto: '上传您的照片',
    uploadFromDevice: '从设备上传',
    takePhoto: '使用摄像头拍摄',
    samplePhotos: '或使用测试示例照片：',
    dragDropText: '拖放照片到此处',
    clickToBrowse: '或点击浏览电脑/手机文件',
    orChooseSample: '快速选择测试示例照片',
    customWidth: '宽度 (mm)',
    customHeight: '高度 (mm)',
    customFacePct: '人脸比例 (%)',
    samplePhotoLabel: '示例照片 (sample.jpg)',
    maleSample: '男士示例',
    femaleSample: '女士示例',
    childSample: '儿童示例',

    aiAnalyzing: 'AI 正在分析人脸与分割背景...',
    aiFaceFound: '已检测到人脸！正在自动对齐眼线与标准比例...',
    aiSmartFallback: '已根据人像轮廓自动定位人脸位置！',
    aiNoFace: '未检测到清晰人脸，已切换至手动微调。',
    aiProcessingComplete: 'AI 处理完成！',
    topHead: '头顶线',
    eyeLine: '眼睛水平线',
    chin: '下巴线',
    toggleGuides: '辅助线开关',
    resetTransform: '重置调整',
    removeBg: '自动 AI 背景替换',
    bgColor: '背景颜色',
    adjustments: '光照与色彩调整',
    zoom: '缩放',
    rotate: '旋转角度',
    brightness: '亮度',
    contrast: '对比度',
    saturation: '饱和度',
    nextPrintGrid: '下一步：打印排版 ➜',
    backToStep1: '← 重新选择照片',

    bgWhite: '白色 (White)',
    bgLightBlue: '浅蓝色 (Light Blue)',
    bgDarkBlue: '深蓝色 (Blue)',
    bgLightGrey: '浅灰色 (Light Grey)',
    bgTransparent: '透明 (PNG)',

    printGridTitle: '护照照片排版打印 Sheet',
    printGridDesc: '自动将多张照片排版至标准相纸尺寸，方便直接打印。',
    downloadSingle: '下载单张照片 (高清)',
    downloadSheet: '下载打印排版图 (PNG)',
    printNow: '立即打印',
    paperSize: '相纸尺寸',
    paperA4: 'A4 纸 (210 x 297 mm)',
    paper4x6: '4x6 英寸相纸 (10x15 cm)',
    paper5x7: '5x7 英寸相纸 (13x18 cm)',
    photoCount: '照片数量',
    copies: '张',
    backToEditor: '← 返回编辑',
    createNew: '制作新照片',

    presetVi4x6Name: '越南护照照片 (4x6 cm)',
    presetVi4x6Desc: '白底，头部和肩膀端正，头部占照片高度 70-80%。',
    presetVi3x4Name: '越南证件 / 证书照片 (3x4 cm)',
    presetVi3x4Desc: '白底或蓝底，适用于驾照、学生证及各类证书。',
    presetUsVisaName: '美国护照 / 签证照片 (2x2 英寸)',
    presetUsVisaDesc: '纯白底，头部必须占据总高度的 50% 至 69%。',
    presetSchengenName: '欧洲申根签证照片 (3.5x4.5 cm)',
    presetSchengenDesc: '浅灰或浅白底，头部占据高度 70% 至 80% (32mm - 36mm)。',
    presetCustomName: '自定义尺寸照片',
    presetCustomDesc: '自由设置宽度、高度和人脸比例，满足个性化需求。',
  }
};
