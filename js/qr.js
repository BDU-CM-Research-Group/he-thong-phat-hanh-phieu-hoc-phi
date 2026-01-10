// ============================================
// QR CODE GENERATOR - VietQR EMVCo Standard
// ============================================
const QRGenerator = {
    // Logo được cache để tái sử dụng
    logoDataUrl: null,
    logoLoaded: false,

    // Load logo một lần khi khởi tạo
    async loadLogo() {
        if (this.logoLoaded) return this.logoDataUrl;
        
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                this.logoDataUrl = canvas.toDataURL('image/png');
                this.logoLoaded = true;
                resolve(this.logoDataUrl);
            };
            img.onerror = () => {
                console.warn('Không thể load logo, QR sẽ không có logo');
                this.logoLoaded = true;
                resolve(null);
            };
            img.src = './logo1.png';
        });
    },

    // Tạo TLV (Tag-Length-Value)
    tlv(tag, value) {
        const len = String(value.length).padStart(2, '0');
        return `${tag}${len}${value}`;
    },

    // Tạo chuỗi VietQR theo chuẩn EMVCo
    generateVietQRString(bankBin, accountNo, amount, content) {


        let qrData = '';
        
        // 00 - Payload Format Indicator (bắt buộc)
        qrData += this.tlv('00', '01');
        
        // 01 - Point of Initiation Method (11 = static, 12 = dynamic)
        qrData += this.tlv('01', '12');
        
        // 38 - Merchant Account Information - VietQR
        // Sub-fields:
        // 00: GUID = A000000727 (VietQR)
        // 01: Beneficiary Organization (sub: 00=NAPAS BIN, 01=Account Number)
        // 02: Service Code = QRIBFTTA (Transfer to Account)
        const guid = this.tlv('00', 'A000000727');
        const beneficiaryOrg = this.tlv('01', 
            this.tlv('00', bankBin) + this.tlv('01', accountNo)
        );
        const serviceCode = this.tlv('02', 'QRIBFTTA');
        const merchantAccInfo = guid + beneficiaryOrg + serviceCode;
        qrData += this.tlv('38', merchantAccInfo);
        
  
        
        // 52 - Merchant Category Code (không bắt buộc, nhưng nên có)
        // qrData += this.tlv('52', '0000');
        
        // 53 - Transaction Currency (704 = VND)
        qrData += this.tlv('53', '704');
        
        // 54 - Transaction Amount (nếu có)
        if (amount && amount > 0) {
            qrData += this.tlv('54', String(Math.round(amount)));
          
        }
        
        // 58 - Country Code
        qrData += this.tlv('58', 'VN');
        
        // 62 - Additional Data Field Template (nếu có nội dung)
        if (content && content.trim()) {
            // 08 = Purpose of Transaction
            const additionalData = this.tlv('08', content);
            qrData += this.tlv('62', additionalData);
          
        }
        
        // 63 - CRC (tính sau)
        qrData += '6304';
        
        // Tính CRC16-CCITT
        const crc = this.calculateCRC16(qrData);
        qrData += crc;
        
        return qrData;
    },

    // Tính CRC16-CCITT (polynomial 0x1021, init 0xFFFF)
    calculateCRC16(str) {
        let crc = 0xFFFF;
        
        for (let i = 0; i < str.length; i++) {
            crc ^= (str.charCodeAt(i) << 8);
            for (let j = 0; j < 8; j++) {
                if (crc & 0x8000) {
                    crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
                } else {
                    crc = (crc << 1) & 0xFFFF;
                }
            }
        }
        
        return crc.toString(16).toUpperCase().padStart(4, '0');
    },

    // Tạo QR code với logo ở giữa
    async generateQRWithLogo(qrString, size = 200) {
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = 'position: absolute; left: -9999px; top: -9999px;';
        document.body.appendChild(tempDiv);

        return new Promise(async (resolve, reject) => {
            try {
                // Tạo QR code
                const qr = new QRCode(tempDiv, {
                    text: qrString,
                    width: size,
                    height: size,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });

                await new Promise(r => setTimeout(r, 150));

                const qrCanvas = tempDiv.querySelector('canvas');
                if (!qrCanvas) {
                    throw new Error('Không thể tạo QR code');
                }

                const finalCanvas = document.createElement('canvas');
                finalCanvas.width = size;
                finalCanvas.height = size;
                const ctx = finalCanvas.getContext('2d');

                ctx.drawImage(qrCanvas, 0, 0, size, size);

                const logoDataUrl = await this.loadLogo();
                if (logoDataUrl) {
                    const logoImg = new Image();
                    logoImg.onload = () => {
                        const logoSize = size * 0.2;
                        const logoX = (size - logoSize) / 2;
                        const logoY = (size - logoSize) / 2;

                        // Vẽ nền trắng cho logo
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.arc(size / 2, size / 2, logoSize / 2 + 3, 0, Math.PI * 2);
                        ctx.fill();

                        // Vẽ logo
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(size / 2, size / 2, logoSize / 2, 0, Math.PI * 2);
                        ctx.clip();
                        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
                        ctx.restore();

                        document.body.removeChild(tempDiv);
                        resolve(finalCanvas.toDataURL('image/png'));
                    };
                    logoImg.onerror = () => {
                        document.body.removeChild(tempDiv);
                        resolve(finalCanvas.toDataURL('image/png'));
                    };
                    logoImg.src = logoDataUrl;
                } else {
                    document.body.removeChild(tempDiv);
                    resolve(finalCanvas.toDataURL('image/png'));
                }
            } catch (error) {
                document.body.removeChild(tempDiv);
                reject(error);
            }
        });
    },

    async show(maSV) {
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

        const resultSection = DOM.get('resultSection');
        if (resultSection) {
            resultSection.innerHTML = '<div style="text-align: center; padding: 40px;"><p>Đang tạo mã QR...</p></div>';
            resultSection.style.display = 'block';
        }

        try {
            const qrString = this.generateVietQRString(bankId, accountNo, sv.tongTien, content);
            const qrDataUrl = await this.generateQRWithLogo(qrString, 250);

            const html = `
                <div class="card" style="padding: 15px; background: white; border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    <div id="pdfContent" style="padding: 0; background: white;">
                        ${PDFTemplate.generate(sv, qrDataUrl)}
                    </div>
                    <div style="text-align: center; margin-top: 15px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                        <button class="btn btn-success" onclick="QRGenerator.download('${qrDataUrl}', '${maSV}')">
                            Tải mã QR
                        </button>
                    </div>
                </div>
            `;

            if (resultSection) {
                resultSection.innerHTML = html;
            }
        } catch (error) {
            console.error('Lỗi tạo QR:', error);
            Modal.show({
                title: 'Lỗi',
                content: 'Không thể tạo mã QR. Vui lòng thử lại!',
                type: 'error'
            });
        }
    },

    copyQRString(maSV) {
        const sv = AppState.getStudent(maSV);
        if (!sv) return;

        const bankId = DOM.getValue('bankId');
        const accountNo = DOM.getValue('accountNo');
        const hocKyNamHoc = DOM.getValue('hocKyNamHoc') || CONFIG.ACADEMIC_YEAR;
        const hocKyShort = hocKyNamHoc.replace(/Học kỳ\s*/i, 'HK').replace(/\s*-\s*Năm học\s*/i, ' ').replace(/\s*-\s*/g, ' ');
        const content = `BDU ${sv.maSV} ${Utils.removeVietnameseTones(sv.tenDayDu)} ${sv.maLop} HP ${hocKyShort}`;

        const qrString = this.generateVietQRString(bankId, accountNo, sv.tongTien, content);
        
        navigator.clipboard.writeText(qrString).then(() => {
            alert('Đã copy QR String! Bạn có thể test tại: https://www.vietqr.io/test-qr');
        });
    },

    download(dataUrl, maSV) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `QR_HocPhi_${maSV}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    async generateQRDataUrl(bankId, accountNo, amount, content, size = 200) {
        const qrString = this.generateVietQRString(bankId, accountNo, amount, content);
        return await this.generateQRWithLogo(qrString, size);
    }
};
