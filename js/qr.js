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
            Modal.show({
                title: 'Thiếu thông tin',
                content: 'Vui lòng nhập đầy đủ thông tin ngân hàng trong bảng Cấu hình để tạo mã QR!',
                type: 'error'
            });
            return;
        }

        const hocKyNamHoc = DOM.getValue('hocKyNamHoc') || CONFIG.ACADEMIC_YEAR;
        const hocKyShort = hocKyNamHoc.replace(/Học kỳ\s*/i, 'HK').replace(/\s*-\s*Năm học\s*/i, ' ').replace(/\s*-\s*/g, ' ');
        const content = `BDU ${sv.maSV} ${Utils.removeVietnameseTones(sv.tenDayDu)} ${sv.maLop} HP ${hocKyShort}`;
        const qrUrl = BankService.generateQRUrl(bankId, accountNo, sv.tongTien, content, accountName);

        const html = `
            <div class="card" style="padding: 15px; background: white; border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div id="pdfContent" style="padding: 0; background: white;">
                    ${PDFTemplate.generate(sv, qrUrl)}
                </div>
                <div style="text-align: center; margin-top: 15px; display: flex; gap: 8px; justify-content: center;">
                    <button class="btn btn-success" onclick="QRGenerator.download('${qrUrl}', '${maSV}')">
                        Tải mã QR
                    </button>
                    <button class="btn btn-primary" onclick="PDFExporter.exportSingle('${maSV}')">
                        Xuất PDF
                    </button>
                </div>
            </div>
        `;

        const resultSection = DOM.get('resultSection');
        if (resultSection) {
            resultSection.innerHTML = html;
            resultSection.style.display = 'block';
        }
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
