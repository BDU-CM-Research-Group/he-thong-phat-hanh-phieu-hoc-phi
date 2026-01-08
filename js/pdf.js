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
        <div style="font-family: 'Times New Roman', Times, serif; font-size: 11px; color: #000; position: relative; max-width: 200mm; margin: 0 auto; padding: 0;">
            ${this._renderHeader(qrUrl, hocKyNamHoc)}
            ${this._renderStudentInfo(sv)}
            ${this._renderTable(sv, tongMienGiam)}
            ${this._renderFooter(dateStr, sv.tenDayDu)}
        </div>`;
    },

    _renderHeader(qrUrl, hocKyNamHoc) {
        return `
        <table style="width: 100%; margin-bottom: 0;">
            <tr>
                <td style="width: 120px; vertical-align: top;">
                    <img src="logo.png" alt="Logo" style="width: 90px; height: 40px;">
                </td>
                <td style="text-align: center; vertical-align: middle;">
                     <h2 style="color: #1a56db; margin: 0 0 1px 0; font-size: 13px; font-weight: bold;">
                        GIẤY BÁO HỌC PHÍ
                    </h2>
                    <p style="margin: 0; font-size: 10px;">${hocKyNamHoc}</p>
                </td>
                 <td style="text-align: right; vertical-align: top; width: 120px;">
                    <img src="${qrUrl}" alt="QR Code" style="width: 75px; height: 75px;">
                    <p style="font-size: 7px; color: #141516ff; margin-right: 5px;">Quét mã QR thanh toán</p>
                </td>
            </tr>
        </table>`;
    },

    _renderStudentInfo(sv) {
        return `
        <table style="width: 100%; margin-bottom: 0; margin-top: 0;">
            <tr>
                <td style="vertical-align: top;">
                    <table style="width: 100%; font-size: 10px; margin-top: 0;">
                        <tr>
                            <td style="padding: 1px 0; width: 40%;">Họ và tên: <strong>${sv.tenDayDu}</strong></td>
                            <td style="padding: 1px 0; width: 30%;">MSSV: <strong>${sv.maSV}</strong></td>
                            <td style="padding: 1px 0; width: 30%;">Lớp: <strong>${sv.maLop}</strong></td>
                        </tr>
                        <tr>
                            <td style="padding: 1px 0;">Ngành: <strong>${sv.tenNgChng || ''}</strong></td>
                            <td style="padding: 1px 0;" colspan="2">Hệ đào tạo: <strong>${sv.tenLop || ''}</strong></td>
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


        const cellStyle = `padding: 1px 2px; border-right: ${borderStyle}; border-bottom: ${borderStyle};`;
        const cellStyleLeft = `padding: 1px 2px; border-left: ${borderStyle}; border-right: ${borderStyle}; border-bottom: ${borderStyle};`;
        const cellStyleRight = `padding: 1px 2px; border-bottom: ${borderStyle};`;

        const thStyle = `padding: 1px 2px; border-right: ${borderStyle}; border-bottom: ${borderStyle};`;
        const thStyleLeft = `padding: 1px 2px; border-left: ${borderStyle}; border-right: ${borderStyle}; border-bottom: ${borderStyle};`;
        const thStyleRight = `padding: 1px 2px; border-bottom: ${borderStyle};`;

        const thStyleTop = `padding: 1px 2px; border-top: ${borderStyle}; border-right: ${borderStyle}; border-bottom: ${borderStyle};`;
        const thStyleTopLeft = `padding: 1px 2px; border-top: ${borderStyle}; border-left: ${borderStyle}; border-right: ${borderStyle}; border-bottom: ${borderStyle};`;
        const thStyleTopRight = `padding: 1px 2px; border-top: ${borderStyle}; border-bottom: ${borderStyle};`;


        let html = `
        <table style="width: 100%; border-collapse: collapse; border-spacing: 0; font-size: 10px; margin-bottom: 0;">
            <thead>
                <tr style="${hBg}">
                    <th style="${thStyleTopLeft} text-align: center; width: 25px; ${hBg}">STT</th>
                    <th style="${thStyleTop} text-align: center; ${hBg}">Học phần</th>
                    <th style="${thStyleTop} text-align: center; width: 25px; ${hBg}">Nhóm</th>
                    <th style="${thStyleTop} text-align: center; width: 25px; ${hBg}">Tín chỉ</th>
                    <th style="${thStyleTop} text-align: center; width: 35px; ${hBg}">Đơn giá</th>
                    <th style="${thStyleTop} text-align: center; width: 45px; ${hBg}">Thành tiền</th>
                    <th style="${thStyleTop} text-align: center; width: 45px; ${hBg}">Miễn giảm</th>
                    <th style="${thStyleTop} text-align: center; width: 55px; ${hBg}">Phải thu</th>
                    <th style="${thStyleTopRight} text-align: center; width: 35px; border-right: ${borderStyle}; ${hBg}">Ghi chú</th>
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
                    <th style="${thStyleRight} text-align: center; border-right: ${borderStyle}; ${hBg}; ">(6)</th>
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
                <td style="${cellStyle} text-align: right;">${Utils.formatNumber(mh.phaiThu)}</td>
                <td style="${cellStyleRight} text-align: center; border-right: ${borderStyle};">${mh.ghiChu ? 'HL' : ''}</td>
            </tr>`;
        });

        // Tính tổng thành tiền và tổng phụ thu
        const tongThanhTien = sv.monHoc.reduce((sum, mh) => sum + (mh.soTC * mh.donGia), 0);

        html += `
                <tr style="${sumBg}">
                    <td colspan="5" style="${cellStyleLeft} padding: 6px; text-align: center; font-weight: bold; ${sumBg}">Tổng cộng:</td>
                    <td style="${cellStyle} padding: 6px; text-align: right; font-weight: bold; ${sumBg}">${Utils.formatNumber(tongThanhTien)}</td>
                    <td style="${cellStyle} padding: 6px; text-align: right; font-weight: bold; ${sumBg}">${Utils.formatNumber(tongMienGiam)}</td>
                    <td style="${cellStyle} padding: 6px; text-align: right; font-weight: bold; ${sumBg}">${Utils.formatNumber(sv.tongTien)}</td>
                    <td style="${cellStyle} padding: 6px; text-align: right; border-right: ${borderStyle}; ${sumBg}"></td>
                </tr>
            </tbody>
        </table>`;

        return html;
    },

    _renderFooter(dateStr, tenDayDu) {
        const today = new Date();
        const printDate = `Ngày in: ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

        const tieuDeCot1 = DOM.getValue('tieuDeCot1') || 'Người đăng ký';
        const tieuDeCot2 = DOM.getValue('tieuDeCot2') || 'Phòng ĐTKT&BĐCL';
        const tieuDeCot3 = DOM.getValue('tieuDeCot3') || 'Người lập biểu';
        const nguoiKyCot2 = DOM.getValue('nguoiKyCot2') || 'Lê Ngọc Nữ';
        const nguoiKyCot3 = DOM.getValue('nguoiKyCot3') || 'Nguyễn Chí Thanh';
        return `
        <div style="position: relative;">
            <p style="text-align: right; margin: 0 25px; font-size: 10px; font-style: italic;">${dateStr}</p>
            <table style="width: 100%; font-size: 10px; margin-top: 0;">
                <tr>
                    <td style="width: 33%; text-align: center;"><p style="font-weight: bold; margin: 0; font-size: 10px;">${tieuDeCot1}</p></td>
                    <td style="width: 33%; text-align: center;"><p style="font-weight: bold; margin: 0; font-size: 10px;">${tieuDeCot2}</p></td>
                    <td style="width: 33%; text-align: center;"><p style="font-weight: bold; margin: 0; font-size: 10px;">${tieuDeCot3}</p></td>
                </tr>
                <tr>
                    <td style="text-align: center; padding-top: 60px; font-size: 10px;"><b>${tenDayDu}</b></td>
                    <td style="text-align: center; padding-top: 60px; font-size: 10px;"><b>${nguoiKyCot2}</b></td>
                    <td style="text-align: center; padding-top: 60px; font-size: 10px;"><b>${nguoiKyCot3}</b></td>
                </tr>
            </table>
            <p style="text-align: left; margin-top: 5px; margin-bottom: 0; font-size: 9px; color: #666; font-style: italic;">${printDate}</p>
        </div>`;
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
            Modal.show({
                title: 'Lỗi',
                content: 'Không tìm thấy nội dung để xuất PDF!',
                type: 'error'
            });
            return;
        }

        const canvas = await this._renderCanvas(pdfContent);
        const pdf = this._createPDF(canvas);
        const fileName = `GiayBaoHocPhi_${sv.maSV}_${Utils.removeVietnameseTones(sv.tenDayDu).replace(/\s/g, '_')}.pdf`;
        pdf.save(fileName);
    },

    async exportSingleFileBatch() {
        const bankInfo = this._validateBankInfo();
        if (!bankInfo) return;

        const selectedMaSVs = Array.from(AppState.selectedSVs);
        let studentsToExport = [];
        let message = '';

        if (selectedMaSVs.length > 0) {
            studentsToExport = selectedMaSVs.map(maSV => AppState.getStudent(maSV));
            message = `Bạn có chắc muốn xuất <strong>1 file PDF</strong> cho <strong>${studentsToExport.length}</strong> sinh viên đã chọn?`;
        } else {
            const currentList = Search.getCurrentFilteredList();
            studentsToExport = currentList;
            if (studentsToExport.length === AppState.getStudentCount()) {
                message = `Bạn có muốn xuất <strong>1 file PDF</strong> cho <strong>tất cả ${studentsToExport.length}</strong> sinh viên không?`;
            } else {
                message = `Bạn có muốn xuất <strong>1 file PDF</strong> cho <strong>${studentsToExport.length}</strong> sinh viên đang hiển thị không?`;
            }
        }

        if (studentsToExport.length === 0) {
            Modal.show({ title: 'Thông báo', content: 'Không có sinh viên nào để xuất!', type: 'info' });
            return;
        }

        Modal.confirm(message + `<br>Quá trình này có thể mất vài phút.`, async () => {
            this._showProgress();

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('l', 'mm', 'a5');
            const stats = { success: 0, error: 0, current: 0 };
            const totalToExport = studentsToExport.length;
            const BATCH_SIZE = 10; // Xử lý 10 file/lượt

            try {
                // Batch processing optimization
                for (let i = 0; i < totalToExport; i += BATCH_SIZE) {
                    const batch = studentsToExport.slice(i, i + BATCH_SIZE);

                    // Render 10 canvases in parallel
                    const canvasResults = await Promise.all(batch.map(async (sv) => {
                        try {
                            const tempContainer = document.createElement('div');
                            // Fixed width 200mm for consistency
                            tempContainer.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 200mm; background: white;';
                            document.body.appendChild(tempContainer);

                            tempContainer.innerHTML = this._generatePDFContent(sv);

                            // Scale 1.5: Good balance between clarity and file size
                            const canvas = await this._renderCanvas(tempContainer.firstElementChild, true, 1.5);

                            document.body.removeChild(tempContainer);
                            return { success: true, canvas: canvas, sv: sv };
                        } catch (err) {
                            return { success: false, error: err, sv: sv };
                        }
                    }));

                    // Add to PDF sequentially to maintain order and prevent memory spikes
                    for (let j = 0; j < canvasResults.length; j++) {
                        const res = canvasResults[j];
                        stats.current++;

                        if (res.success) {
                            // Add new page if not the very first page
                            if (i > 0 || j > 0) pdf.addPage();

                            // Use JPEG quality 0.75 to keep file size < 1MB per page
                            this._addImageToPDF(pdf, res.canvas, 1.5, 0.75);
                            stats.success++;
                        } else {
                            console.error(`Lỗi xuất PDF cho ${res.sv.maSV}:`, res.error);
                            stats.error++;
                        }
                    }

                    const percent = Math.round((stats.current / totalToExport) * 100);
                    DOM.get('progressBar').style.width = percent + '%';
                    DOM.get('progressText').textContent = `${stats.current} / ${totalToExport} - Đang xử lý...`;

                    // Small delay to prevent browser freeze
                    await new Promise(resolve => setTimeout(resolve, 50));
                }

                const fileName = `DanhSachPhieuHocPhi_Gop_${new Date().toISOString().slice(0, 10)}.pdf`;
                pdf.save(fileName);

                Modal.show({
                    title: 'Hoàn thành xuất PDF',
                    content: `
                        <div style="text-align: center;">
                            <div class="success-icon">✓</div>
                            <p>Đã xuất thành công file PDF gộp.</p>
                            <p>Tổng số phiếu: <strong>${stats.success}</strong></p>
                            ${stats.error > 0 ? `<p style="color: red">Lỗi: <strong>${stats.error}</strong></p>` : ''}
                        </div>
                    `,
                    type: 'success'
                });

            } catch (err) {
                console.error(err);
                Modal.show({ title: 'Lỗi', content: 'Có lỗi xảy ra trong quá trình xuất file.', type: 'error' });
            } finally {
                this._hideProgress();
            }
        });
    },

    async exportBatch() {
        const bankInfo = this._validateBankInfo();
        if (!bankInfo) return;

        const selectedMaSVs = Array.from(AppState.selectedSVs);
        let studentsToExport = [];
        let message = '';

        if (selectedMaSVs.length > 0) {
            studentsToExport = selectedMaSVs.map(maSV => AppState.getStudent(maSV));
            message = `Bạn có chắc muốn xuất <strong>file ZIP</strong> cho <strong>${studentsToExport.length}</strong> sinh viên đã chọn?`;
        } else {
            const currentList = Search.getCurrentFilteredList();
            studentsToExport = currentList;
            if (studentsToExport.length === AppState.getStudentCount()) {
                message = `Bạn có muốn xuất <strong>file ZIP</strong> cho <strong>tất cả ${studentsToExport.length}</strong> sinh viên không?`;
            } else {
                message = `Bạn có muốn xuất <strong>file ZIP</strong> cho <strong>${studentsToExport.length}</strong> sinh viên đang hiển thị không?`;
            }
        }

        if (studentsToExport.length === 0) {
            Modal.show({ title: 'Thông báo', content: 'Không có sinh viên nào để xuất!', type: 'info' });
            return;
        }

        // Gom nhóm theo lớp để nén ZIP
        const studentsByClass = {};
        studentsToExport.forEach(sv => {
            const lop = sv.maLop || 'KhongCoLop';
            if (!studentsByClass[lop]) studentsByClass[lop] = [];
            studentsByClass[lop].push(sv);
        });

        const classCount = Object.keys(studentsByClass).length;
        const totalToExport = studentsToExport.length;

        Modal.confirm(message + `<br>Quá trình này có thể mất vài phút.`, async () => {
            this._showProgress();
            const hiddenContainer = this._createHiddenContainer();
            const zip = new JSZip();
            const stats = { success: 0, error: 0, current: 0 };

            const BATCH_SIZE = 5;

            for (const [lop, students] of Object.entries(studentsByClass)) {
                const folder = zip.folder(lop);

                for (let i = 0; i < students.length; i += BATCH_SIZE) {
                    const batch = students.slice(i, i + BATCH_SIZE);

                    await Promise.all(batch.map(async (sv) => {
                        stats.current++;
                        await this._exportStudentPDF(sv, folder, hiddenContainer, stats, totalToExport, lop, true);
                    }));

                    const percent = Math.round((stats.current / totalToExport) * 100);
                    DOM.get('progressBar').style.width = percent + '%';
                    DOM.get('progressText').textContent = `${stats.current} / ${totalToExport} - Lớp ${lop}: Đang xử lý...`;

                    if (i % (BATCH_SIZE * 2) === 0) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }
            }

            await this._downloadZip(zip);
            document.body.removeChild(hiddenContainer);
            this._hideProgress();

            Modal.show({
                title: 'Hoàn thành xuất PDF',
                content: `
                    <div style="text-align: center;">
                        <div class="success-icon">✓</div>
                        <p>Thành công: <strong>${stats.success}</strong></p>
                        <p>Lỗi: <strong>${stats.error}</strong></p>
                        <p>📁 Đã nén <strong>${classCount}</strong> lớp vào file ZIP.</p>
                    </div>
                `,
                type: 'success'
            });
        });
    },

    async exportAll() {
        this.exportBatch();
    },

    _validateBankInfo() {
        const accountNo = DOM.getValue('accountNo');
        const accountName = DOM.getValue('accountName');
        const bankId = DOM.getValue('bankId');

        if (!accountNo || !accountName || !bankId) {
            Modal.show({
                title: 'Thiếu thông tin',
                content: 'Vui lòng nhập đầy đủ thông tin ngân hàng trước khi xuất PDF!',
                type: 'error'
            });
            return null;
        }

        return { accountNo, accountName, bankId };
    },

    _createHiddenContainer() {
        // Container này không còn cần thiết vì mỗi student sẽ có container riêng
        // Nhưng giữ lại để không break code cũ
        const container = document.createElement('div');
        container.id = 'hiddenPdfContainer';
        container.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 200mm;';
        document.body.appendChild(container);
        return container;
    },

    async _renderCanvas(element, isBatch = false, customScale = null) {
        // Giảm scale cho batch processing để tăng tốc độ
        const scale = customScale ? customScale : (isBatch ? 1.2 : 2);
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
        const pdf = new jsPDF('l', 'mm', 'a5');
        this._addImageToPDF(pdf, canvas, scale);
        return pdf;
    },

    _addImageToPDF(pdf, canvas, scale, quality = 0.8) {
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const marginX = 5;
        const marginY = 5;
        const availableWidth = pdfWidth - (marginX * 2);
        const availableHeight = pdfHeight - (marginY * 2);

        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const pixelToMm = 25.4 / 96; // Conversion factor from pixels to mm at 96 DPI
        const logicalWidthPx = imgWidth / scale;
        const logicalHeightPx = imgHeight / scale;
        const contentWidthMm = logicalWidthPx * pixelToMm;
        const contentHeightMm = logicalHeightPx * pixelToMm;

        // Scale to fit both width and height to prevent overflow
        const ratioWidth = availableWidth / contentWidthMm;
        const ratioHeight = availableHeight / contentHeightMm;
        const ratio = Math.min(ratioWidth, ratioHeight); // Use the smaller ratio to fit within page

        // Calculate final dimensions after scaling
        const finalWidthMm = contentWidthMm * ratio;
        const finalHeightMm = contentHeightMm * ratio;

        // Center the content horizontally if it's smaller than available width
        const xPosition = marginX + (availableWidth - finalWidthMm) / 2;

        const imgData = canvas.toDataURL('image/jpeg', quality);

        // Center horizontally and align to top
        pdf.addImage(imgData, 'JPEG', xPosition, marginY, finalWidthMm, finalHeightMm);
    },

    _generatePDFContent(sv) {
        const bankId = DOM.getValue('bankId');
        const accountNo = DOM.getValue('accountNo');
        const accountName = DOM.getValue('accountName');

        const hocKyNamHoc = DOM.getValue('hocKyNamHoc') || CONFIG.ACADEMIC_YEAR;
        const hocKyShort = hocKyNamHoc.replace(/Học kỳ\s*/i, 'HK').replace(/\s*-\s*Năm học\s*/i, ' ').replace(/\s*-\s*/g, ' ');
        const content = `BDU ${sv.maSV} ${Utils.removeVietnameseTones(sv.tenDayDu)} ${sv.maLop} HP ${hocKyShort}`;
        const qrUrl = BankService.generateQRUrl(bankId, accountNo, sv.tongTien, content, accountName);

        return `<div class="card" style="background: white; padding: 0; max-width: 200mm; margin: 0 auto; border-radius: 0; border: none;">${PDFTemplate.generate(sv, qrUrl)}</div>`;
    },

    async _exportStudentPDF(sv, folder, container, stats, total, lop, isBatch = false) {
        try {
            // Tạo một container riêng cho mỗi student để tránh conflict
            const tempContainer = document.createElement('div');
            // Use 195mm to match A5 landscape width for full page content
            tempContainer.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 200mm; background: white;';
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
        downloadLink.download = `GiayBaoHocPhi_${new Date().toISOString().slice(0, 10)}.zip`;
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
