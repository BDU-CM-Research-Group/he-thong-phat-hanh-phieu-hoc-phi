// ============================================
// CONSTANTS & CONFIG
// ============================================
const CONFIG = {
    API: {
        VIETQR_BANKS: 'https://api.vietqr.io/v2/banks',
        VIETQR_LOOKUP: 'https://api.vietqr.io/v2/lookup'
    },
    DEFAULT_BANK: '970415', // VietinBank
    LOOKUP_DELAY: 800, // ms
    RENDER_DELAY: 800, // ms
    PDF: {
        FORMAT: 'a5',
        ORIENTATION: 'l', 
        SCALE: 2.5,
        MARGIN: 5
    },
    ACADEMIC_YEAR: 'Học kỳ 2 - Năm học 2025 - 2026'
};

const FALLBACK_BANKS = [
    { bin: '970415', shortName: 'VietinBank', name: 'Ngân hàng TMCP Công Thương Việt Nam' },
    { bin: '970436', shortName: 'Vietcombank', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam' },
    { bin: '970418', shortName: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
    { bin: '970405', shortName: 'Agribank', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam' },
    { bin: '970407', shortName: 'Techcombank', name: 'Ngân hàng TMCP Kỹ Thương Việt Nam' },
    { bin: '970416', shortName: 'ACB', name: 'Ngân hàng TMCP Á Châu' },
    { bin: '970432', shortName: 'VPBank', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng' },
    { bin: '970423', shortName: 'TPBank', name: 'Ngân hàng TMCP Tiên Phong' },
    { bin: '970422', shortName: 'MBBank', name: 'Ngân hàng TMCP Quân Đội' }
];
