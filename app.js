// ============================================
// CONSTANTS & CONFIG
// ============================================
const CONFIG = {
    API: {
        VIETQR_BANKS: 'https://api.vietqr.io/v2/banks',
        VIETQR_LOOKUP: 'https://api.vietqr.io/v2/lookup',
        QR_IMAGE_BASE: 'https://img.vietqr.io/image'
    },
    DEFAULT_BANK: '970415', // VietinBank
    LOOKUP_DELAY: 800, // ms
    RENDER_DELAY: 800, // ms
    PDF: {
        FORMAT: 'a4',
        ORIENTATION: 'l', // portrait
        SCALE: 2.5,
        MARGIN: 10
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

// ============================================
// STATE MANAGEMENT
// ============================================
const AppState = {
    studentsData: [],
    groupedStudents: {},
    banksList: [],
    lookupTimeout: null,

    reset() {
        this.studentsData = [];
        this.groupedStudents = {};
    },

    getStudentCount() {
        return Object.keys(this.groupedStudents).length;
    },

    getStudent(maSV) {
        return this.groupedStudents[maSV];
    },

    getAllStudents() {
        return Object.values(this.groupedStudents);
    },

    groupByClass() {
        const grouped = {};
        this.getAllStudents().forEach(sv => {
            const lop = sv.maLop || 'KhongCoLop';
            if (!grouped[lop]) grouped[lop] = [];
            grouped[lop].push(sv);
        });
        return grouped;
    }
};

// ============================================
// BANK API SERVICE
// ============================================
const BankService = {
    async loadBanksList() {
        try {
            const response = await fetch(CONFIG.API.VIETQR_BANKS);
            const data = await response.json();
            
            if (data.code === '00' && data.data) {
                AppState.banksList = data.data;
                this.renderBankOptions(data.data);
                return true;
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách ngân hàng:', error);
        }
        
        // Fallback
        AppState.banksList = FALLBACK_BANKS;
        this.renderBankOptions(FALLBACK_BANKS);
        return false;
    },

    renderBankOptions(banks) {
        const bankSelect = DOM.get('bankId');
        bankSelect.innerHTML = '<option value="">-- Chọn ngân hàng --</option>';
        
        banks.forEach(bank => {
            const option = document.createElement('option');
            option.value = bank.bin;
            option.textContent = `${bank.shortName} - ${bank.name}`;
            bankSelect.appendChild(option);
        });
        
        bankSelect.value = CONFIG.DEFAULT_BANK;
    },

    async lookupAccountName(bankId, accountNo) {
        if (!bankId || !accountNo) return null;

        try {
            const response = await fetch(CONFIG.API.VIETQR_LOOKUP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bin: bankId, accountNumber: accountNo })
            });
            
            const data = await response.json();
            
            if (data.code === '00' && data.data?.accountName) {
                return data.data.accountName;
            }
        } catch (error) {
            console.error('Lỗi tra cứu tài khoản:', error);
        }
        
        return null;
    },

    getBankName(bankId) {
        const bank = AppState.banksList.find(b => b.bin === bankId);
        return bank?.shortName || bankId;
    },

    generateQRUrl(bankId, accountNo, amount, content, accountName) {
        return `${CONFIG.API.QR_IMAGE_BASE}/${bankId}-${accountNo}-qr_only.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(accountName)}`;
    }
};

// ============================================
// FILE PROCESSING
// ============================================
const FileProcessor = {
    handleFile(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            this.processData(jsonData);
        };
        reader.readAsArrayBuffer(file);
    },

    processData(data) {
        AppState.reset();
        
        data.forEach(row => {
            const maSV = row.MaSV;
            if (!maSV) return;

            if (!AppState.groupedStudents[maSV]) {
                AppState.groupedStudents[maSV] = {
                    maSV,
                    tenDayDu: row.TenDayDu || `${row.HoLotSV} ${row.TenSV}`,
                    maLop: row.MaLop || '',
                    tenLop: row.TenLop || '',
                    ngaySinh: row.NgaySinhC || '',
                    tenNgChng: row.TenNgChng || '',
                    maBH: row.MaBH || '',
                    tenKhoi: row.TenKhoi || '',
                    monHoc: [],
                    tongTien: 0,
                    tongMienGiam: 0
                };
            }

            const phaiThu = parseFloat(row.PhaiThu) || 0;
            const mienGiam = parseFloat(row.MienGiam) || 0;
            const donGia = parseFloat(row.DonGiaHPCT) || 0;
            const phuThu = parseFloat(row.TienPhuThu) || 0;

            AppState.groupedStudents[maSV].monHoc.push({
                maMH: row.MaMH,
                tenMH: row.TenMH || row.DienGiaiHP,
                nhom: row.NhomTo || '',
                toTH: row.ToTH || '',
                soTC: row.SoTCHP || 0,
                donGia,
                mienGiam,
                phuThu,
                phaiThu
            });

            AppState.groupedStudents[maSV].tongTien += phaiThu;
            AppState.groupedStudents[maSV].tongMienGiam += mienGiam;
            AppState.groupedStudents[maSV].tongPhuThu = (AppState.groupedStudents[maSV].tongPhuThu || 0) + phuThu;
        });

        UI.showStudentList();
        DOM.show('btnExportAll');
        alert(`Đã tải thành công ${AppState.getStudentCount()} sinh viên!`);
    }
};

// ============================================
// DOM UTILITIES
// ============================================
const DOM = {
    get(id) {
        return document.getElementById(id);
    },

    show(id) {
        const el = this.get(id);
        if (el) el.style.display = 'inline-block';
    },

    hide(id) {
        const el = this.get(id);
        if (el) el.style.display = 'none';
    },

    setValue(id, value) {
        const el = this.get(id);
        if (el) el.value = value;
    },

    getValue(id) {
        return this.get(id)?.value || '';
    }
};

// ============================================
// UI RENDERING
// ============================================
const UI = {
    showStudentList(students = null) {
        const list = students || AppState.getAllStudents();
        const listDiv = DOM.get('studentList');
        
        let html = `<p style="margin-bottom: 10px; color: #6b7280; font-size: 0.85rem;">
            ${students ? 'Tìm thấy' : 'Tổng số'}: <strong>${list.length}</strong> sinh viên
        </p>`;
        
        html += '<div style="flex: 1; overflow-y: auto; border: 0.2px solid #d1d5db;">';
        html += '<table class="student-table"><thead><tr>';
        html += '<th>Mã SV</th><th>Họ tên</th><th>Lớp</th>';
        html += '<th style="text-align: right;">Tổng tiền</th>';
        html += '<th style="text-align: center;">Thao tác</th>';
        html += '</tr></thead><tbody>';
        
        list.forEach(sv => {
            html += `<tr>
                <td>${sv.maSV}</td>
                <td>${sv.tenDayDu}</td>
                <td>${sv.maLop}</td>
                <td style="text-align: right; font-weight: 600; color: #dc2626;">
                    ${Utils.formatCurrency(sv.tongTien)}
                </td>
                <td style="text-align: center;">
                    <button class="btn btn-primary btn-sm" onclick="QRGenerator.show('${sv.maSV}')">
                        Tạo QR
                    </button>
                </td>
            </tr>`;
        });
        
        html += '</tbody></table></div>';
        listDiv.innerHTML = html;
    },

    showNoResults() {
        DOM.get('studentList').innerHTML = 
            '<p style="color: #dc2626; text-align: center; padding: 20px;">Không tìm thấy sinh viên nào!</p>';
    },

    updateAccountLookupStatus(message, color) {
        const statusEl = DOM.get('accountLookupStatus');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.color = color;
        }
    }
};

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
const Search = {
    perform() {
        const keyword = DOM.getValue('searchInput').toLowerCase().trim();
        
        if (!keyword) {
            UI.showStudentList();
            return;
        }

        const filtered = AppState.getAllStudents().filter(sv =>
            sv.maSV.toLowerCase().includes(keyword) ||
            sv.tenDayDu.toLowerCase().includes(keyword)
        );

        if (filtered.length === 0) {
            UI.showNoResults();
        } else {
            UI.showStudentList(filtered);
        }
    }
};

// ============================================
// QR CODE GENERATOR
// ============================================
const QRGenerator = {
    show(maSV) {
        const sv = AppState.getStudent(maSV);
        if (!sv) return;

        const bankId = DOM.getValue('bankId');
        const accountNo = DOM.getValue('accountNo');
        const accountName = DOM.getValue('accountName');

        if (!accountNo || !accountName || !bankId) {
            alert('Vui lòng nhập đầy đủ thông tin ngân hàng!');
            return;
        }

        const hocKyNamHoc = DOM.getValue('hocKyNamHoc') || CONFIG.ACADEMIC_YEAR;
        // Chuyển "Học kỳ 2 - Năm học 2025 - 2026" thành "HP HK2 2025 2026"
        const hocKyShort = hocKyNamHoc.replace(/Học kỳ\s*/i, 'HK').replace(/\s*-\s*Năm học\s*/i, ' ').replace(/\s*-\s*/g, ' ');
        const content = `BDU ${sv.maSV} ${Utils.removeVietnameseTones(sv.tenDayDu)} ${sv.maLop} HP ${hocKyShort}`;
        const qrUrl = BankService.generateQRUrl(bankId, accountNo, sv.tongTien, content, accountName);

        const html = `
            <div class="card" id="pdfContent" style="position: relative; max-width: 140mm; margin: 0 auto; border-radius: 0; border: none;">
                ${PDFTemplate.generate(sv, qrUrl)}
            </div>
            <div style="text-align: center; margin-top: 15px;">
                <button class="btn btn-primary" onclick="PDFExporter.exportSingle('${maSV}')" style="margin-right: 10px;">
                    Xuất PDF
                </button>
                <button class="btn btn-success" onclick="QRGenerator.download('${qrUrl}', '${maSV}')">
                    Tải mã QR
                </button>
            </div>
        `;

        DOM.get('resultSection').innerHTML = html;
    },

    download(url, maSV) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `QR_HocPhi_${maSV}.png`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// ============================================
// PDF TEMPLATE
// ============================================
const PDFTemplate = {
    generate(sv, qrUrl) {
        const today = new Date();
        const dateStr = `Cà Mau, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;
        const tongMienGiam = sv.monHoc.reduce((sum, mh) => sum + mh.mienGiam, 0);
        const hocKyNamHoc = DOM.getValue('hocKyNamHoc') || CONFIG.ACADEMIC_YEAR;

        return `
        <div style="font-family: 'Times New Roman', Times, serif; font-size: 11px; color: #000; position: relative; max-width: 140mm; margin: 0 auto;">
            ${this._renderHeader(qrUrl)}
            ${this._renderTitle(hocKyNamHoc)}
            ${this._renderStudentInfo(sv)}
            ${this._renderTable(sv, tongMienGiam)}
            ${this._renderFooter(dateStr, sv.tenDayDu)}
        </div>`;
    },

    _renderHeader(qrUrl) {
        return `
        <table style="width: 100%; margin-bottom: 8px;">
            <tr>
                <td style="width: 90px; vertical-align: top;">
                    <img src="logo.png" alt="Logo" style="width: 90px; height: 40px;">
                </td>
                 <td style="text-align: right; vertical-align: top; width: 120px;">
                    <img src="${qrUrl}" alt="QR Code" style="width: 75px; height: 75px;">
                    <p style="font-size: 7px; color: #141516ff; margin-right: 5px;">Quét mã QR thanh toán</p>
                </td>
            </tr>
        </table>`;
    },

    _renderTitle(hocKyNamHoc) {
        return `
        <h2 style="text-align: center; color: #1a56db; margin: -40px 0 4px 0; font-size: 13px; font-weight: bold;">
            GIẤY BÁO HỌC PHÍ
        </h2>
        <p style="text-align: center; margin: 0 0 8px 0; font-size: 10px;">${hocKyNamHoc}</p>`;
    },

    _renderStudentInfo(sv) {
        return `
        <table style="width: 100%; margin-bottom: 6px; margin-top: 5px;">
            <tr>
                <td style="vertical-align: top;">
                    <table style="width: 100%; font-size: 9px; margin-top: 2px;">
                        <tr>
                            <td style="padding: 1px 0; width: 40%;">Họ và tên: <strong>${sv.tenDayDu}</strong></td>
                            <td style="padding: 1px 0; width: 30%;">MSSV: <strong>${sv.maSV}</strong></td>
                            <td style="padding: 1px 0; width: 30%;">Lớp: <strong>${sv.maLop}</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 1px 0;">Ngành: <strong>${sv.tenNgChng || ''}</strong></td>
                            <td style="padding: 1px 0;" colspan="2">Hệ đào tạo: <strong>${sv.tenLop || ''} (${sv.maLop})</strong></td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>`;
    },

    _renderTable(sv, tongMienGiam) {
   
        const borderStyle = '1px solid #333';
        const hBg = 'background-color: #dbeafe;';
        const sumBg = 'background-color: #dbeafe;';
        
  
        const cellStyle = `padding: 3px; border-right: ${borderStyle}; border-bottom: ${borderStyle};`;
        const cellStyleLeft = `padding: 3px; border-left: ${borderStyle}; border-right: ${borderStyle}; border-bottom: ${borderStyle};`;
        const cellStyleRight = `padding: 3px; border-bottom: ${borderStyle};`;
       
        const thStyle = `padding: 4px; border-right: ${borderStyle}; border-bottom: ${borderStyle};`;
        const thStyleLeft = `padding: 4px; border-left: ${borderStyle}; border-right: ${borderStyle}; border-bottom: ${borderStyle};`;
        const thStyleRight = `padding: 4px; border-bottom: ${borderStyle};`;
       
        const thStyleTop = `padding: 4px; border-top: ${borderStyle}; border-right: ${borderStyle}; border-bottom: ${borderStyle};`;
        const thStyleTopLeft = `padding: 4px; border-top: ${borderStyle}; border-left: ${borderStyle}; border-right: ${borderStyle}; border-bottom: ${borderStyle};`;
        const thStyleTopRight = `padding: 4px; border-top: ${borderStyle}; border-bottom: ${borderStyle};`;
     
        
        let html = `
        <table style="width: 100%; border-collapse: collapse; border-spacing: 0; font-size: 9px; margin-bottom: 3px;">
            <thead>
                <tr style="${hBg}">
                    <th style="${thStyleTopLeft} text-align: center; width: 25px; ${hBg}">STT</th>
                    <th style="${thStyleTop} text-align: center; ${hBg}">Học phần</th>
                    <th style="${thStyleTop} text-align: center; width: 25px; ${hBg}">Nhóm</th>
                    <th style="${thStyleTop} text-align: center; width: 25px; ${hBg}">Tín chỉ</th>
                    <th style="${thStyleTop} text-align: center; width: 35px; ${hBg}">Đơn giá</th>
                    <th style="${thStyleTop} text-align: center; width: 35px; ${hBg}">Thành tiền</th>
                    <th style="${thStyleTop} text-align: center; width: 35px; ${hBg}">Miễn giảm</th>
                    <th style="${thStyleTop} text-align: center; width: 35px; ${hBg}">Phụ thu</th>
                    <th style="${thStyleTopRight} text-align: center; width: 55px; border-right: ${borderStyle}; ${hBg}">Phải thu</th>
                </tr>
                <tr style="font-size: 7px; ${hBg}">
                    <th style="${thStyleLeft} text-align: center; ${hBg}">(A)</th>
                    <th style="${thStyle} text-align: center; ${hBg}">(B)</th>
                    <th style="${thStyle} text-align: center; ${hBg}">(C)</th>
                    <th style="${thStyle} text-align: center; ${hBg}">(1)</th>
                    <th style="${thStyle} text-align: center; ${hBg}">(2)</th>
                     <th style="${thStyle} text-align: center; ${hBg}">(3)=(1)*(2)</th>
                    <th style="${thStyle} text-align: center; ${hBg}">(4)</th>
                    <th style="${thStyle} text-align: center; ${hBg}">(5)</th>
                    <th style="${thStyleRight} text-align: center; border-right: ${borderStyle}; ${hBg}; ">(6)=(3)-(4)+(5)</th>
                </tr>
            </thead>
            <tbody>
                
                   
                </tr>`;

        sv.monHoc.forEach((mh, idx) => {
            const thanhTien = mh.soTC * mh.donGia;
            html += `<tr>
                <td style="${cellStyleLeft} text-align: center;">${idx + 1}</td>
                <td style="${cellStyle}">${mh.tenMH}</td>
                <td style="${cellStyle} text-align: center;">${mh.nhom || ''}</td>
                <td style="${cellStyle} text-align: center;">${mh.soTC}</td>
                <td style="${cellStyle} text-align: right;">${Utils.formatNumber(mh.donGia)}</td>
                <td style="${cellStyle} text-align: right;">${Utils.formatNumber(thanhTien)}</td>
                <td style="${cellStyle} text-align: right;">${Utils.formatNumber(mh.mienGiam)}</td>
                <td style="${cellStyle} text-align: right;">${Utils.formatNumber(mh.phuThu || 0)}</td>
                <td style="${cellStyleRight} text-align: right; border-right: ${borderStyle};">${Utils.formatNumber(mh.phaiThu)}</td>
            </tr>`;
        });

        // Tính tổng thành tiền và tổng phụ thu
        const tongThanhTien = sv.monHoc.reduce((sum, mh) => sum + (mh.soTC * mh.donGia), 0);
        const tongPhuThu = sv.monHoc.reduce((sum, mh) => sum + (mh.phuThu || 0), 0);

        html += `
                <tr style="${sumBg}">
                    <td colspan="5" style="${cellStyleLeft} padding: 4px; text-align: right; font-weight: bold; ${sumBg}">Tổng cộng</td>
                    <td style="${cellStyle} padding: 4px; text-align: right; font-weight: bold; ${sumBg}">${Utils.formatNumber(tongThanhTien)}</td>
                    <td style="${cellStyle} padding: 4px; text-align: right; font-weight: bold; ${sumBg}">${Utils.formatNumber(tongMienGiam)}</td>
                    <td style="${cellStyle} padding: 4px; text-align: right; font-weight: bold; ${sumBg}">${Utils.formatNumber(tongPhuThu)}</td>
                    <td style="${cellStyle} padding: 4px; text-align: right; color: #000000ff; font-weight: bold; border-right: ${borderStyle}; ${sumBg}">${Utils.formatNumber(sv.tongTien)}</td>
                </tr>
            </tbody>
        </table>`;

        return html;
    },

    _renderFooter(dateStr, tenDayDu) {
        
       
        const tieuDeCot1 = DOM.getValue('tieuDeCot1') || 'Người đăng ký';
        const tieuDeCot2 = DOM.getValue('tieuDeCot2') || 'Phòng ĐTKT&BĐCL';
        const tieuDeCot3 = DOM.getValue('tieuDeCot3') || 'Người lập biểu';
        const nguoiKyCot2 = DOM.getValue('nguoiKyCot2') || 'Lê Ngọc Nữ';
        const nguoiKyCot3 = DOM.getValue('nguoiKyCot3') || 'Nguyễn Chí Thanh';
        return `
        <p style="text-align: right; margin: 4px 5px; font-size: 9px; font-style: italic;">${dateStr}</p>
        <table style="width: 100%; font-size: 9px; margin-top: 4px;">
            <tr>
                <td style="width: 33%; text-align: center;"><p style="font-weight: bold; margin: 0; font-size: 9px;">${tieuDeCot1}</p></td>
                <td style="width: 33%; text-align: center;"><p style="font-weight: bold; margin: 0; font-size: 9px;">${tieuDeCot2}</p></td>
                <td style="width: 33%; text-align: center;"><p style="font-weight: bold; margin: 0; font-size: 9px;">${tieuDeCot3}</p></td>
            </tr>
            <tr>
                <td style="text-align: center; padding-top: 40px; font-size: 9px;"><b>${tenDayDu}</b></td>
                <td style="text-align: center; padding-top: 40px; font-size: 9px;"><b>${nguoiKyCot2}</b></td>
                <td style="text-align: center; padding-top: 40px; font-size: 9px;"><b>${nguoiKyCot3}</b></td>
            </tr>
        </table>
        <p style="text-align: left; margin-top: 8px; font-size: 8px; color: #666; font-style: italic;"></p>`;
    }
};

// ============================================
// PDF EXPORTER (using html2canvas + jsPDF)
// ============================================
const PDFExporter = {
    async exportSingle(maSV) {
        const sv = AppState.getStudent(maSV);
        if (!sv) return;

        const pdfContent = DOM.get('pdfContent');
        if (!pdfContent) {
            alert('Không tìm thấy nội dung để xuất PDF!');
            return;
        }

        const canvas = await this._renderCanvas(pdfContent);
        const pdf = this._createPDF(canvas);
        const fileName = `GiayBaoHocPhi_${sv.maSV}_${Utils.removeVietnameseTones(sv.tenDayDu).replace(/\s/g, '_')}.pdf`;
        pdf.save(fileName);
    },

    async exportAll() {
        const bankInfo = this._validateBankInfo();
        if (!bankInfo) return;

        const studentsByClass = AppState.groupByClass();
        const classCount = Object.keys(studentsByClass).length;
        const totalStudents = AppState.getStudentCount();

        if (!confirm(`Bạn có chắc muốn xuất PDF cho ${totalStudents} sinh viên (${classCount} lớp)?\nFile sẽ được nén thành ZIP phân theo lớp.\nQuá trình này có thể mất vài phút.`)) {
            return;
        }

        this._showProgress();
        const hiddenContainer = this._createHiddenContainer();
        const zip = new JSZip();
        const stats = { success: 0, error: 0, current: 0 };

        // Xử lý theo batch để tăng tốc độ (5 PDF cùng lúc)
        const BATCH_SIZE = 5;

        for (const [lop, students] of Object.entries(studentsByClass)) {
            const folder = zip.folder(lop);
            
            // Chia students thành các batch
            for (let i = 0; i < students.length; i += BATCH_SIZE) {
                const batch = students.slice(i, i + BATCH_SIZE);
                
                // Xử lý batch song song
                await Promise.all(batch.map(async (sv) => {
                    stats.current++;
                    await this._exportStudentPDF(sv, folder, hiddenContainer, stats, totalStudents, lop, true);
                }));

                // Cập nhật progress sau mỗi batch
                const percent = Math.round((stats.current / totalStudents) * 100);
                DOM.get('progressBar').style.width = percent + '%';
                DOM.get('progressText').textContent = `${stats.current} / ${totalStudents} - Lớp ${lop}: Đang xử lý...`;
                
                // Nhường CPU cho browser để tránh freeze
                if (i % (BATCH_SIZE * 2) === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }
        }

        await this._downloadZip(zip);
        document.body.removeChild(hiddenContainer);
        this._hideProgress();

        alert(`Hoàn thành xuất PDF!\n✅ Thành công: ${stats.success}\n❌ Lỗi: ${stats.error}\n📁 Đã nén ${classCount} lớp vào file ZIP`);
    },

    _validateBankInfo() {
        const accountNo = DOM.getValue('accountNo');
        const accountName = DOM.getValue('accountName');
        const bankId = DOM.getValue('bankId');

        if (!accountNo || !accountName || !bankId) {
            alert('Vui lòng nhập đầy đủ thông tin ngân hàng trước khi xuất PDF!');
            return null;
        }

        return { accountNo, accountName, bankId };
    },

    _createHiddenContainer() {
        // Container này không còn cần thiết vì mỗi student sẽ có container riêng
        // Nhưng giữ lại để không break code cũ
        const container = document.createElement('div');
        container.id = 'hiddenPdfContainer';
        container.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 140mm;';
        document.body.appendChild(container);
        return container;
    },

    async _renderCanvas(element, isBatch = false) {
        // Giảm scale cho batch processing để tăng tốc độ
        const scale = isBatch ? 1.2 : 2;
        return await html2canvas(element, {
            scale: scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            imageTimeout: 0,
            removeContainer: true, // Tự động dọn dẹp để giảm memory
            onclone: (clonedDoc) => {
                const tables = clonedDoc.querySelectorAll('table');
                tables.forEach(table => {
                    table.style.borderCollapse = 'collapse';
                    table.style.borderSpacing = '0';
                });
            }
        });
    },

    _createPDF(canvas, scale = 2) {
        const { jsPDF } = window.jspdf;
       
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();  
        const pdfHeight = pdf.internal.pageSize.getHeight(); 
        const marginX = 5;
        const marginY = 3;
        const availableWidth = pdfWidth - (marginX * 2);
        const availableHeight = pdfHeight - (marginY * 2);
        
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        // Tính toán dựa trên scale thực tế được sử dụng
        const ratio = Math.min(availableWidth / (imgWidth / scale), availableHeight / (imgHeight / scale));
        const finalWidth = (imgWidth / scale) * ratio;
        const finalHeight = (imgHeight / scale) * ratio;
        const imgX = (pdfWidth - finalWidth) / 2;
        const imgY = marginY;
        
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        pdf.addImage(imgData, 'JPEG', imgX, imgY, finalWidth, finalHeight);
        
        return pdf;
    },

    _generatePDFContent(sv) {
        const bankId = DOM.getValue('bankId');
        const accountNo = DOM.getValue('accountNo');
        const accountName = DOM.getValue('accountName');
        
        const hocKyNamHoc = DOM.getValue('hocKyNamHoc') || CONFIG.ACADEMIC_YEAR;
        const hocKyShort = hocKyNamHoc.replace(/Học kỳ\s*/i, 'HK').replace(/\s*-\s*Năm học\s*/i, ' ').replace(/\s*-\s*/g, ' ');
        const content = `BDU ${sv.maSV} ${Utils.removeVietnameseTones(sv.tenDayDu)} ${sv.maLop} HP ${hocKyShort}`;
        const qrUrl = BankService.generateQRUrl(bankId, accountNo, sv.tongTien, content, accountName);

        return `<div class="card" style="background: white; padding: 12px; max-width: 140mm; margin: 0 auto; border-radius: 0; border: none;">${PDFTemplate.generate(sv, qrUrl)}</div>`;
    },

    async _exportStudentPDF(sv, folder, container, stats, total, lop, isBatch = false) {
        try {
            // Tạo một container riêng cho mỗi student để tránh conflict
            const tempContainer = document.createElement('div');
            tempContainer.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 140mm;';
            document.body.appendChild(tempContainer);
            
            tempContainer.innerHTML = this._generatePDFContent(sv);
            
            // Scale cho batch processing (1.2) hoặc single (2)
            const scale = isBatch ? 1.2 : 2;
            const canvas = await this._renderCanvas(tempContainer.firstElementChild, isBatch);
            
            // Cleanup temp container ngay sau khi render để giải phóng memory
            document.body.removeChild(tempContainer);
            
            const pdf = this._createPDF(canvas, scale);
            
            const pdfBlob = pdf.output('blob');
            const fileName = `GiayBaoHocPhi_${sv.maSV}_${Utils.removeVietnameseTones(sv.tenDayDu).replace(/\s/g, '_')}.pdf`;
            folder.file(fileName, pdfBlob);
            
            stats.success++;
            
        } catch (error) {
            console.error(`Lỗi xuất PDF cho ${sv.maSV}:`, error);
            stats.error++;
        }
    },

    async _downloadZip(zip) {
        DOM.get('progressText').textContent = 'Đang nén file ZIP...';
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(zipBlob);
        downloadLink.download = `GiayBaoHocPhi_${new Date().toISOString().slice(0,10)}.zip`;
        downloadLink.click();
        URL.revokeObjectURL(downloadLink.href);
    },

    _showProgress() {
        DOM.get('exportProgress').style.display = 'block';
        DOM.get('progressBar').style.width = '0%';
    },

    _hideProgress() {
        DOM.get('exportProgress').style.display = 'none';
        DOM.get('progressBar').style.width = '0%';
    }
};

// ============================================
// UTILITIES
// ============================================
const Utils = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND' 
        }).format(amount);
    },

    formatNumber(num) {
        return new Intl.NumberFormat('vi-VN').format(num);
    },

    removeVietnameseTones(str) {
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
        str = str.replace(/đ/g, "d");
        str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
        str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
        str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
        str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
        str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
        str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
        str = str.replace(/Đ/g, "D");
        return str;
    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// ============================================
// ACCOUNT LOOKUP
// ============================================
const AccountLookup = {
    async perform() {
        const bankId = DOM.getValue('bankId');
        const accountNo = DOM.getValue('accountNo').trim();
        
        if (!bankId || accountNo.length < 6) {
            UI.updateAccountLookupStatus('', '#6b7280');
            return;
        }

        UI.updateAccountLookupStatus('Đang tra cứu...', '#1a56db');

        const accountName = await BankService.lookupAccountName(bankId, accountNo);
        
        if (accountName) {
            DOM.setValue('accountName', accountName);
            UI.updateAccountLookupStatus('✓ Đã tìm thấy tên tài khoản', '#059669');
        } else {
            UI.updateAccountLookupStatus('Không tra cứu được, vui lòng nhập tay', '#f59e0b');
        }
    },

    setupAutoLookup() {
        const accountNoInput = DOM.get('accountNo');
        const bankSelect = DOM.get('bankId');

        if (accountNoInput) {
            accountNoInput.addEventListener('input', () => {
                clearTimeout(AppState.lookupTimeout);
                const accountNo = accountNoInput.value.trim();
                
                if (accountNo.length >= 6) {
                    UI.updateAccountLookupStatus('Đang chờ tra cứu...', '#6b7280');
                    AppState.lookupTimeout = setTimeout(() => {
                        this.perform();
                    }, CONFIG.LOOKUP_DELAY);
                } else {
                    UI.updateAccountLookupStatus('', '#6b7280');
                }
            });
        }

        if (bankSelect) {
            bankSelect.addEventListener('change', () => {
                const accountNo = DOM.getValue('accountNo').trim();
                if (accountNo.length >= 6) {
                    this.perform();
                }
            });
        }
    }
};

// ============================================
// DRAG & DROP HANDLER
// ============================================
const DragDropHandler = {
    setup() {
        const uploadSection = document.querySelector('.upload-section');
        if (!uploadSection) return;

        uploadSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadSection.style.background = '#dbeafe';
        });

        uploadSection.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadSection.style.background = '#e8effc';
        });

        uploadSection.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadSection.style.background = '#e8effc';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    DOM.get('fileInput').files = files;
                    FileProcessor.handleFile(file);
                } else {
                    alert('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
                }
            }
        });
    }
};

// ============================================
// EVENT HANDLERS - Exposed to Global
// ============================================
window.handleFile = (event) => {
    const file = event.target.files[0];
    if (file) FileProcessor.handleFile(file);
};

window.searchStudent = () => Search.perform();
window.exportAllPDF = () => PDFExporter.exportAll();

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Load banks list
    await BankService.loadBanksList();
    
    // Setup drag & drop
    DragDropHandler.setup();
    
    // Setup account lookup
    AccountLookup.setupAutoLookup();
    
    // Setup search on Enter
    const searchInput = DOM.get('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') Search.perform();
        });
    }
});