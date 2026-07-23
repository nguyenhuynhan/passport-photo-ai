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

  // Steps HUD
  step1Title: string;
  step2Title: string;
  step3Title: string;

  // Step 1: Select Preset & Upload
  selectPresetTitle: string;
  choosePhotoTitle: string;
  dragDropTitle: string;
  dragDropSub: string;
  browseBtn: string;
  supportedFormats: string;
  useCameraBtn: string;
  tryAiTitle: string;
  tryAiDesc: string;
  customWidthLabel: string;
  customHeightLabel: string;
  customFacePctLabel: string;
  maleSample: string;
  femaleSample: string;
  childSample: string;

  // Passport Photo Guidelines Card
  guidelinesTitle: string;
  guidelineItem1: string;
  guidelineItem2: string;
  guidelineItem3: string;
  guidelineItem4: string;

  // Step 2: Editor & AI
  editingPresetLabel: string;
  chooseAnotherPhoto: string;
  localAiWorking: string;
  aiAnalyzing: string;
  aiFaceFound: string;
  aiSmartFallback: string;
  aiNoFace: string;
  aiAutoAlignedBanner: string;
  aiManualFallbackBanner: string;
  topHead: string;
  eyeLine: string;
  chin: string;
  toggleGuides: string;
  resetTransform: string;
  autoAlignBtn: string;
  highQualitySegmentationBtn: string;
  aiProcessingTitle: string;
  aiProcessingStep1: string;
  aiProcessingStep2: string;
  aiProcessingStep3: string;
  nationalStandardLabel: string;
  removeBgToggle: string;
  bgColorLabel: string;
  lightAndColorLabel: string;
  zoom: string;
  rotate: string;
  brightness: string;
  contrast: string;
  saturation: string;
  edgeFeatherLabel: string;
  fastModeLabel: string;
  fastModeDesc: string;
  nextPrintGrid: string;

  // Camera Component
  cameraLoading: string;
  cameraError: string;
  captureBtn: string;

  // Background Colors
  bgWhite: string;
  bgLightBlue: string;
  bgDarkBlue: string;
  bgLightGrey: string;
  bgTransparent: string;

  // Step 3: Printing Grid & Export
  singlePhotoCompleted: string;
  singlePhotoSpecs: string;
  downloadSingleBtn: string;
  printGridTitle: string;
  printGridDesc: string;
  downloadSheetBtn: string;
  printNowBtn: string;
  paperSizeLabel: string;
  paperA4: string;
  paper4x6: string;
  paper5x7: string;
  photoCountLabel: string;
  copiesUnit: string;
  backToEditor: string;
  createNew: string;

  // Footer
  footerCopyright: string;
  footerPrivacyText: string;

  // Country Badges
  presetViCountry: string;
  presetChinaCountry: string;
  presetUsCountry: string;
  presetSchengenCountry: string;
  presetCustomCountry: string;

  // Presets
  presetVi4x6Name: string;
  presetVi4x6Desc: string;
  presetVi3x4Name: string;
  presetVi3x4Desc: string;
  presetChinaName: string;
  presetChinaDesc: string;
  presetUsVisaName: string;
  presetUsVisaDesc: string;
  presetSchengenName: string;
  presetSchengenDesc: string;
  presetCustomName: string;
  presetCustomDesc: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  vi: {
    appTitle: 'idfoto',
    appSubtitle: 'Tự động căn chỉnh & tách nền chuẩn quốc tế trên thiết bị của bạn',
    privacyBadge: 'Bảo mật 100% (Offline)',
    localAiBadge: 'AI CỤC BỘ',

    step1Title: 'Chọn',
    step2Title: 'Sửa',
    step3Title: 'Xuất',

    selectPresetTitle: 'Chọn chuẩn kích thước ảnh:',
    choosePhotoTitle: 'Tải lên hình chân dung:',
    dragDropTitle: 'Kéo thả file ảnh vào đây',
    dragDropSub: 'hoặc',
    browseBtn: 'Chọn File Ảnh Từ Máy',
    supportedFormats: 'Hỗ trợ định dạng JPG, PNG, WEBP. Ảnh sắc nét, hướng thẳng.',
    useCameraBtn: 'Sử dụng Camera trực tiếp của thiết bị',
    tryAiTitle: 'Trải nghiệm thử AI ngay:',
    tryAiDesc: 'Bạn không có sẵn ảnh chân dung? Hãy click chọn một ảnh mẫu chất lượng cao dưới đây để trải nghiệm tức thì khả năng căn chỉnh khuôn mặt và tách phông nền đỉnh cao:',
    customWidthLabel: 'Chiều rộng (mm):',
    customHeightLabel: 'Chiều cao (mm):',
    customFacePctLabel: 'Tỉ lệ khuôn mặt đầu chiếm (%):',
    maleSample: 'Mẫu Nam',
    femaleSample: 'Mẫu Nữ',
    childSample: 'Mẫu Trẻ Em',

    guidelinesTitle: 'Quy định ảnh nộp Cổng dịch vụ công Bộ Công An:',
    guidelineItem1: 'Kích thước 4x6 cm (đã tự động xuất 1200x1800 pixel, chuẩn 300 DPI, vượt mức tối thiểu 480px).',
    guidelineItem2: 'Khuôn mặt hướng thẳng, lộ rõ 2 vành tai và trán, chiếm khoảng 75% chiều cao ảnh.',
    guidelineItem3: 'KHÔNG đeo kính (kể cả kính cận), không đội mũ, trang phục lịch sự, phông nền trắng tinh.',
    guidelineItem4: 'Dung lượng file dưới 1MB (định dạng JPG/JPEG), ảnh chụp mới không quá 6 tháng.',

    editingPresetLabel: 'Đang chỉnh sửa:',
    chooseAnotherPhoto: 'Chọn ảnh khác',
    localAiWorking: 'AI Đang Làm Việc Cục Bộ...',
    aiAnalyzing: 'AI đang phân tích khuôn mặt & tách nền...',
    aiFaceFound: 'Đã phát hiện khuôn mặt! Đang căn chỉnh trục mắt và tỉ lệ chuẩn...',
    aiSmartFallback: 'Đã tự động định vị khuôn mặt từ nhận diện chân dung!',
    aiNoFace: 'Không tìm thấy khuôn mặt rõ ràng. Chuyển sang căn chỉnh thủ công.',
    aiAutoAlignedBanner: 'AI đã tự căn chỉnh khuôn mặt thẳng trục mắt và đúng kích cỡ!',
    aiManualFallbackBanner: 'Không phát hiện khuôn mặt. Di chuyển thanh trượt để căn chỉnh thủ công.',
    topHead: 'Đỉnh đầu (Top Head)',
    eyeLine: 'Trục mắt (Eyes)',
    chin: 'Cằm (Chin)',
    toggleGuides: 'Đường hướng dẫn',
    resetTransform: 'Đặt lại mặc định',
    autoAlignBtn: 'Khôi phục căn chỉnh AI',
    highQualitySegmentationBtn: 'Tách nền nâng cao (AI)',
    aiProcessingTitle: 'AI Đang Xử Lý Cục Bộ...',
    aiProcessingStep1: 'Phân tích khuôn mặt & trục mắt...',
    aiProcessingStep2: 'Tách phông nền chân dung bằng AI...',
    aiProcessingStep3: 'Căn chỉnh tỷ lệ khung hình chuẩn hộ chiếu...',
    nationalStandardLabel: 'Tiêu chuẩn quốc gia:',
    removeBgToggle: 'Tách nền phía sau bằng AI',
    bgColorLabel: 'Màu phông nền thay thế:',
    lightAndColorLabel: 'Điều chỉnh ánh sáng & màu sắc',
    zoom: 'Thu phóng (Zoom)',
    rotate: 'Xoay nghiêng (Rotate)',
    brightness: 'Độ sáng (Brightness)',
    contrast: 'Độ tương phản (Contrast)',
    saturation: 'Độ bão hòa (Saturation)',
    edgeFeatherLabel: 'Độ mịn đường viền (Feathering)',
    fastModeLabel: 'Xử lý nhanh',
    fastModeDesc: 'Giảm chất lượng tách nền một chút, nhưng nhanh và phù hợp cho máy yếu',
    nextPrintGrid: 'Tiếp tục: Dàn trang In ➜',

    cameraLoading: 'Đang khởi động Camera...',
    cameraError: 'Không thể truy cập Camera. Vui lòng cấp quyền truy cập trình duyệt.',
    captureBtn: 'Chụp ảnh ngay',

    bgWhite: 'Trắng (White)',
    bgLightBlue: 'Xanh nhạt (Light Blue)',
    bgDarkBlue: 'Xanh đậm (Blue)',
    bgLightGrey: 'Xám sáng (Light Grey)',
    bgTransparent: 'Trong suốt (PNG)',

    singlePhotoCompleted: 'Ảnh Hộ Chiếu Chuẩn Dịch Vụ Công',
    singlePhotoSpecs: 'File JPG 1200x1800px (300 DPI) - Đạt chuẩn Cổng dịch vụ công Bộ Công An',
    downloadSingleBtn: 'Tải ảnh nộp Cổng dịch vụ công (.JPG)',
    printGridTitle: 'Dàn Trang In Ảnh Hộ Chiếu',
    printGridDesc: 'Tự động sắp xếp nhiều ảnh lên khổ giấy in tiêu chuẩn sẵn sàng mang đi in.',
    downloadSheetBtn: 'Tải trang in (JPG)',
    printNowBtn: 'In ngay',
    paperSizeLabel: 'Khổ giấy in:',
    paperA4: 'Giấy A4 (210 x 297 mm)',
    paper4x6: 'Giấy in ảnh 4x6 inch (10x15 cm)',
    paper5x7: 'Giấy in ảnh 5x7 inch (13x18 cm)',
    photoCountLabel: 'Số lượng ảnh:',
    copiesUnit: 'tấm ảnh',
    backToEditor: 'Quay lại chỉnh sửa thêm',
    createNew: 'Tạo ảnh mới',

    footerCopyright: '© 2026 idfoto. Bản quyền được bảo lưu.',
    footerPrivacyText: 'Bảo mật tuyệt đối: Toàn bộ quá trình tách nền & phân tích AI được thực hiện 100% offline tại trình duyệt của bạn. Chúng tôi không bao giờ tải ảnh chân dung của bạn lên bất kỳ máy chủ nào.',

    presetViCountry: 'VIỆT NAM',
    presetChinaCountry: 'TRUNG QUỐC',
    presetUsCountry: 'HOÀ KỲ (USA)',
    presetSchengenCountry: 'CHÂU ÂU (EU)',
    presetCustomCountry: 'TUỲ CHỌN',

    presetVi4x6Name: 'Ảnh Hộ chiếu Việt Nam (4x6 cm)',
    presetVi4x6Desc: 'Chuẩn Cổng dịch vụ công Bộ Công An: Nền trắng tinh, lộ rõ 2 vành tai & trán, không đeo kính, mặt chiếm 75% chiều cao. Xuất độ phân giải 1200x1800px (300DPI).',
    presetVi3x4Name: 'Ảnh Chứng chỉ / Hồ sơ Việt Nam (3x4 cm)',
    presetVi3x4Desc: 'Nền trắng hoặc nền xanh dương. Thường dùng cho chứng chỉ, bằng lái xe, thẻ học sinh/sinh viên.',
    presetChinaName: 'Ảnh Hộ chiếu / Visa Trung Quốc (3.3x4.8 cm)',
    presetChinaDesc: 'Nền trắng tinh. Mặt hướng thẳng, đầu chiếm từ 28mm-33mm chiều cao ảnh (khoảng 60-70%). Chiều rộng đầu 15mm-22mm.',
    presetUsVisaName: 'Ảnh Hộ chiếu / Visa Mỹ (2x2 inch)',
    presetUsVisaDesc: 'Nền trắng tinh. Đầu phải chiếm từ 50% đến 69% tổng chiều cao của ảnh. Mắt cách cạnh dưới 56%-69%.',
    presetSchengenName: 'Ảnh Visa Châu Âu / Schengen (3.5x4.5 cm)',
    presetSchengenDesc: 'Nền xám nhạt hoặc trắng nhạt. Mặt rõ nét, đầu chiếm 70% đến 80% chiều cao ảnh (32mm - 36mm).',
    presetCustomName: 'Ảnh kích thước Tuỳ chỉnh',
    presetCustomDesc: 'Tự do căn chỉnh tỉ lệ và chiều cao đầu phù hợp với nhu cầu riêng của bạn.',
  },

  en: {
    appTitle: 'idfoto',
    appSubtitle: 'Automatic biometric alignment & AI background removal on your device',
    privacyBadge: '100% Private (Offline)',
    localAiBadge: 'LOCAL AI',

    step1Title: 'Select',
    step2Title: 'Edit',
    step3Title: 'Export',

    selectPresetTitle: 'Select photo dimensions preset:',
    choosePhotoTitle: 'Upload portrait photo:',
    dragDropTitle: 'Drag & drop image file here',
    dragDropSub: 'or',
    browseBtn: 'Choose Image File From Device',
    supportedFormats: 'Supports JPG, PNG, WEBP. Sharp, front-facing photo recommended.',
    useCameraBtn: 'Use Device Camera Directly',
    tryAiTitle: 'Try AI with sample photos:',
    tryAiDesc: "Don't have a portrait photo ready? Click a sample photo below to instantly test AI face alignment and background removal:",
    customWidthLabel: 'Width (mm):',
    customHeightLabel: 'Height (mm):',
    customFacePctLabel: 'Face ratio (%):',
    maleSample: 'Male Sample',
    femaleSample: 'Female Sample',
    childSample: 'Child Sample',

    guidelinesTitle: 'Official Passport Photo Requirements:',
    guidelineItem1: 'Face facing straight ahead, looking directly into camera.',
    guidelineItem2: 'Neutral expression, no smiling showing teeth, eyes wide open.',
    guidelineItem3: 'Even lighting across face, no harsh dark shadows.',
    guidelineItem4: 'No sunglasses, no hats (except religious attire).',

    editingPresetLabel: 'Editing:',
    chooseAnotherPhoto: 'Choose another photo',
    localAiWorking: 'AI Working Locally...',
    aiAnalyzing: 'AI is analyzing face & removing background...',
    aiFaceFound: 'Face detected! Auto-aligning eye line and proportions...',
    aiSmartFallback: 'Auto-located face position from portrait detection!',
    aiNoFace: 'No clear face detected. Switch to manual adjustment.',
    aiAutoAlignedBanner: 'AI auto-aligned face alignment and target scale!',
    aiManualFallbackBanner: 'No face detected. Use sliders to adjust manually.',
    topHead: 'Top of Head',
    eyeLine: 'Eye Line',
    chin: 'Chin',
    toggleGuides: 'Toggle Guidelines',
    resetTransform: 'Reset Adjustments',
    autoAlignBtn: 'Restore AI Alignment',
    highQualitySegmentationBtn: 'High Precision Matting (AI)',
    aiProcessingTitle: 'AI Processing Locally...',
    aiProcessingStep1: 'Analyzing face & eye line...',
    aiProcessingStep2: 'Removing portrait background...',
    aiProcessingStep3: 'Aligning passport frame scale...',
    nationalStandardLabel: 'National Standard:',
    removeBgToggle: 'AI Background Removal',
    bgColorLabel: 'Replacement Background Color:',
    lightAndColorLabel: 'Lighting & Color Adjustments',
    zoom: 'Zoom',
    rotate: 'Rotate',
    brightness: 'Brightness',
    contrast: 'Contrast',
    saturation: 'Saturation',
    edgeFeatherLabel: 'Edge Feathering & Softness',
    fastModeLabel: 'Fast Processing Mode',
    fastModeDesc: 'Slightly reduced quality, but faster and suitable for low-spec devices',
    nextPrintGrid: 'Next: Print Layout ➜',

    cameraLoading: 'Starting Camera...',
    cameraError: 'Cannot access camera. Please grant browser permissions.',
    captureBtn: 'Take Photo Now',

    bgWhite: 'White',
    bgLightBlue: 'Light Blue',
    bgDarkBlue: 'Blue',
    bgLightGrey: 'Light Grey',
    bgTransparent: 'Transparent (PNG)',

    singlePhotoCompleted: 'Single Photo Ready',
    singlePhotoSpecs: 'High-quality PNG print file',
    downloadSingleBtn: 'Download Single Photo (HQ)',
    printGridTitle: 'Passport Photo Print Sheet',
    printGridDesc: 'Automatically arrange multiple photos onto standard photo paper sizes ready for printing.',
    downloadSheetBtn: 'Download Print Sheet (PNG)',
    printNowBtn: 'Print Now',
    paperSizeLabel: 'Paper size:',
    paperA4: 'A4 Paper (210 x 297 mm)',
    paper4x6: '4x6 Inch Photo Paper (10x15 cm)',
    paper5x7: '5x7 Inch Photo Paper (13x18 cm)',
    photoCountLabel: 'Photo count:',
    copiesUnit: 'photos',
    backToEditor: 'Back to Editor',
    createNew: 'Create New Photo',

    footerCopyright: '© 2026 idfoto. All rights reserved.',
    footerPrivacyText: '100% Private: All AI background removal and biometric analysis run 100% offline inside your browser. We never upload your portrait photos to any server.',

    presetViCountry: 'VIETNAM',
    presetChinaCountry: 'CHINA',
    presetUsCountry: 'USA',
    presetSchengenCountry: 'EUROPE (EU)',
    presetCustomCountry: 'CUSTOM',

    presetVi4x6Name: 'Vietnam Passport Photo (4x6 cm)',
    presetVi4x6Desc: 'White background. Head and shoulders straight. Head takes up 70-80% of height.',
    presetVi3x4Name: 'Vietnam ID / License Photo (3x4 cm)',
    presetVi3x4Desc: 'White or light blue background. Used for licenses, student cards, and certificates.',
    presetChinaName: 'Chinese Passport / Visa Photo (3.3x4.8 cm)',
    presetChinaDesc: 'Pure white background. Head width 15-22mm, head height 28-33mm (approx 60-70% of height).',
    presetUsVisaName: 'US Passport / Visa Photo (2x2 inch)',
    presetUsVisaDesc: 'Off-white or white background. Head must be 50%-69% of image height.',
    presetSchengenName: 'Schengen / Europe Visa Photo (3.5x4.5 cm)',
    presetSchengenDesc: 'Light grey or white background. Head takes up 70-80% of image height (32-36mm).',
    presetCustomName: 'Custom Dimensions',
    presetCustomDesc: 'Freely set width, height, and face ratio according to your specific needs.',
  },

  zh: {
    appTitle: 'idfoto',
    appSubtitle: '在您的设备上自动完成生物特征对齐与 AI 背景替换',
    privacyBadge: '100% 隐私保护 (离线运行)',
    localAiBadge: '本地 AI',

    step1Title: '选',
    step2Title: '修',
    step3Title: '导',

    selectPresetTitle: '选择照片尺寸规格：',
    choosePhotoTitle: '上传人像照片：',
    dragDropTitle: '拖放照片到此处',
    dragDropSub: '或',
    browseBtn: '从设备选择照片文件',
    supportedFormats: '支持 JPG、PNG、WEBP 格式。建议照片清晰、正面朝前。',
    useCameraBtn: '直接使用设备摄像头拍摄',
    tryAiTitle: '使用示例照片体验 AI：',
    tryAiDesc: '没有准备好照片？点击下方高质量示例照片，立即体验 AI 智能对齐与抠图：',
    customWidthLabel: '宽度 (mm)：',
    customHeightLabel: '高度 (mm)：',
    customFacePctLabel: '人脸比例 (%)：',
    maleSample: '男士示例',
    femaleSample: '女士示例',
    childSample: '儿童示例',

    guidelinesTitle: '官方护照照片合规要求：',
    guidelineItem1: '头部端正，眼睛直视镜头。',
    guidelineItem2: '表情自然中性，请勿露齿笑，双眼睁开。',
    guidelineItem3: '面部光照均匀，无浓重阴影。',
    guidelineItem4: '请勿佩戴墨镜或帽子（宗教服饰除外）。',

    editingPresetLabel: '正在编辑：',
    chooseAnotherPhoto: '重新选择照片',
    localAiWorking: 'AI 正在本地运行...',
    aiAnalyzing: 'AI 正在分析人脸与分割背景...',
    aiFaceFound: '已检测到人脸！正在自动对齐眼线与标准比例...',
    aiSmartFallback: '已根据人像轮廓自动定位人脸位置！',
    aiNoFace: '未检测到清晰人脸，已切换至手动微调。',
    aiAutoAlignedBanner: 'AI 已自动将人脸对齐至标准水平线与尺寸！',
    aiManualFallbackBanner: '未检测到人脸，请使用下方滑块手动调整。',
    topHead: '头顶线',
    eyeLine: '眼睛水平线',
    chin: '下巴线',
    toggleGuides: '辅助线开关',
    resetTransform: '重置调整',
    autoAlignBtn: '恢复 AI 对齐',
    highQualitySegmentationBtn: '高级AI抠图 (Precision)',
    aiProcessingTitle: 'AI 正在本地处理...',
    aiProcessingStep1: '正在分析人脸与眼线...',
    aiProcessingStep2: '正在分割人像背景...',
    aiProcessingStep3: '正在调整护照标准比例...',
    nationalStandardLabel: '国家/地区标准：',
    removeBgToggle: 'AI 智能背景替换',
    bgColorLabel: '替换背景颜色：',
    lightAndColorLabel: '光照与色彩调节',
    zoom: '缩放 (Zoom)',
    rotate: '旋转角度 (Rotate)',
    brightness: '亮度 (Brightness)',
    contrast: '对比度 (Contrast)',
    saturation: '饱和度 (Saturation)',
    edgeFeatherLabel: '边缘羽化平滑度',
    fastModeLabel: '快速处理模式',
    fastModeDesc: '稍微降低抠图质量，但速度更快且适合低配设备',
    nextPrintGrid: '下一步：打印排版 ➜',

    cameraLoading: '正在启动摄像头...',
    cameraError: '无法访问摄像头，请在浏览器设置中授予权限。',
    captureBtn: '立即拍照',

    bgWhite: '白色 (White)',
    bgLightBlue: '浅蓝色 (Light Blue)',
    bgDarkBlue: '深蓝色 (Blue)',
    bgLightGrey: '浅灰色 (Light Grey)',
    bgTransparent: '透明 (PNG)',

    singlePhotoCompleted: '单张照片已生成',
    singlePhotoSpecs: '高清 PNG 打印文件',
    downloadSingleBtn: '下载高清单张照片',
    printGridTitle: '护照照片排版打印 Sheet',
    printGridDesc: '自动将多张照片排版至标准相纸尺寸，方便直接打印。',
    downloadSheetBtn: '下载打印排版图 (PNG)',
    printNowBtn: '立即打印',
    paperSizeLabel: '相纸尺寸：',
    paperA4: 'A4 纸 (210 x 297 mm)',
    paper4x6: '4x6 英寸相纸 (10x15 cm)',
    paper5x7: '5x7 英寸相纸 (13x18 cm)',
    photoCountLabel: '照片数量：',
    copiesUnit: '张',
    backToEditor: '返回继续编辑',
    createNew: '制作新照片',

    footerCopyright: '© 2026 idfoto. 版权所有。',
    footerPrivacyText: '100% 隐私安全：所有 AI 抠图与生物特征分析均在您的浏览器本地 100% 离线运行，我们绝不会将您的照片上传至任何服务器。',

    presetViCountry: '越南',
    presetChinaCountry: '中国',
    presetUsCountry: '美国',
    presetSchengenCountry: '欧洲 (EU)',
    presetCustomCountry: '自定义',

    presetVi4x6Name: '越南护照照片 (4x6 cm)',
    presetVi4x6Desc: '白底，头部和肩膀端正，头部占照片高度 70-80%。',
    presetVi3x4Name: '越南证件 / 证书照片 (3x4 cm)',
    presetVi3x4Desc: '白底或蓝底，适用于驾照、学生证及各类证书。',
    presetChinaName: '中国护照 / 签证照片 (3.3x4.8 cm)',
    presetChinaDesc: '纯白底。头部宽度 15-22mm，头部高度 28-33mm（约占照片总高度的 60-70%）。',
    presetUsVisaName: '美国护照 / 签证照片 (2x2 英寸)',
    presetUsVisaDesc: '纯白底，头部必须占据总高度的 50% 至 69%。',
    presetSchengenName: '欧洲申根签证照片 (3.5x4.5 cm)',
    presetSchengenDesc: '浅灰或浅白底，头部占据高度 70% 至 80% (32mm - 36mm)。',
    presetCustomName: '自定义尺寸照片',
    presetCustomDesc: '自由设置宽度、高度和人脸比例，满足个性化需求。',
  }
};

export function detectInitialLanguage(): Language {
  // 1. Check if user manually saved language preference in localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem('passport_app_lang') as Language;
    if (saved && (saved === 'vi' || saved === 'en' || saved === 'zh')) {
      return saved;
    }
  }

  // 2. Detect browser default language
  if (typeof navigator !== 'undefined') {
    const browserLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
    if (browserLang.startsWith('zh')) {
      return 'zh';
    }
    if (browserLang.startsWith('vi')) {
      return 'vi';
    }
  }

  // Default fallback for international browsers
  return 'vi';
}

export function saveLanguagePreference(lang: Language) {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('passport_app_lang', lang);
  }
}
