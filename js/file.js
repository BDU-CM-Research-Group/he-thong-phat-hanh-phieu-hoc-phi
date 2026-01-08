// ============================================
// FILE PROCESSING
// ============================================
const FileProcessor = {
    async handleFile(file) {
        if (!file) return;

        // Hiện vùng tiến trình
        const container = DOM.get('uploadProgressContainer');
        const progressBar = DOM.get('uploadProgressBar');
        const statusText = DOM.get('uploadStatusText');
        const percentText = DOM.get('uploadPercentText');

        if (container) container.style.display = 'block';
        if (progressBar) progressBar.style.width = '0%';

        statusText.textContent = 'Đang đọc file...';
        percentText.textContent = '0%';

        try {
            const reader = new FileReader();

            // Theo dõi tiến trình đọc file
            reader.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 50);
                    if (progressBar) progressBar.style.width = percent + '%';
                    percentText.textContent = percent + '%';
                }
            };

            const data = await new Promise((resolve, reject) => {
                reader.onload = (e) => resolve(new Uint8Array(e.target.result));
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
            });

            statusText.textContent = 'Đang xử lý dữ liệu...';
            if (progressBar) progressBar.style.width = '70%';
            percentText.textContent = '70%';

            await Utils.delay(300);

            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (progressBar) progressBar.style.width = '90%';
            percentText.textContent = '90%';

            this.processData(jsonData);

            if (progressBar) progressBar.style.width = '100%';
            percentText.textContent = '100%';
            statusText.textContent = 'Hoàn tất!';

            await Utils.delay(500);
            if (container) container.style.display = 'none';

            // Hiện Model thông báo thành công
            Modal.show({
                title: 'Tải dữ liệu thành công',
                content: `
                    <div style="text-align: center; padding: 10px;">
                        <div class="success-icon">✓</div>
                        <h3 style="color: #10b981; margin-bottom: 10px;">Đã tải thành công!</h3>
                        <p>Hệ thống đã xử lý xong dữ liệu của <strong>${AppState.getStudentCount()}</strong> sinh viên.</p>
                        <p style="font-size: 0.85rem; color: #6b7280; margin-top: 10px;">Bạn có thể tìm kiếm và tạo mã QR ngay bây giờ.</p>
                    </div>
                `,
                footer: `<button class="btn btn-primary" onclick="Modal.hide()">Bắt đầu ngay</button>`
            });

        } catch (error) {
            console.error('Lỗi xử lý file:', error);
            if (container) container.style.display = 'none';
            Modal.show({
                title: 'Lỗi xử lý',
                content: `Có lỗi xảy ra khi đọc file Excel. Vui lòng kiểm tra lại định dạng file. <br><small>${error.message}</small>`,
                type: 'error'
            });
        }
    },

    processData(data) {
        AppState.reset();

        const findValue = (row, names) => {
            for (const name of names) {
                if (row[name] !== undefined) return row[name];
            }
            // Case-insensitive fallback
            const keys = Object.keys(row);
            for (const name of names) {
                const lowerName = name.toLowerCase();
                const key = keys.find(k => k.toLowerCase() === lowerName);
                if (key) return row[key];
            }
            return undefined;
        };

        const mapping = {
            maSV: ['MaSV', 'Mã SV', 'MA SV', 'Mã sinh viên', 'Ma sinh vien', 'MSSV'],
            hoLot: ['HoLotSV', 'Họ lót', 'Họ và tên lót', 'Ho lot SV'],
            ten: ['TenSV', 'Tên SV', 'Tên', 'Ten SV'],
            hoTen: ['TenDayDu', 'Họ tên', 'Họ và tên', 'Ten Day Du', 'Full Name'],
            maLop: ['MaLop', 'Mã lớp', 'Lớp', 'MA LOP', 'Lop'],
            tenLop: ['TenLop', 'Tên lớp', 'Khối', 'He dao tao'],
            ngaySinh: ['NgaySinhC', 'Ngày sinh', 'Ngay sinh', 'Birth Date'],
            tenNgChng: ['TenNgChng', 'Ngành', 'Ten nganh'],
            maMH: ['MaMH', 'Mã MH', 'Mã học phần', 'Mã môn học', 'Ma MH'],
            tenMH: ['TenMH', 'Tên MH', 'Tên học phần', 'Tên môn học', 'DienGiaiHP', 'Ten MH'],
            soTC: ['SoTCHP', 'Số TC', 'Số tín chỉ', 'Tín chỉ', 'So TC', 'STC'],
            donGia: ['DonGiaHPCT', 'Đơn giá', 'Đơn giá HP', 'Don gia'],
            mienGiam: ['MienGiam', 'Miễn giảm', 'Số tiền miễn giảm', 'Mien giam'],
            phuThu: ['TienPhuThu', 'Phụ thu', 'Tiền phụ thu', 'Phu thu'],
            phaiThu: ['PhaiThu', 'Phải thu', 'PHẢI THU', 'Phai thu', 'Phải nộp', 'Tong nộp', 'Thực thu'],
            heSoHP: ['HeSoHP', 'Hệ số HP', 'He so HP', 'HeSo']
        };

        data.forEach(row => {
            const maSV = findValue(row, mapping.maSV);
            if (!maSV) return;

            if (!AppState.groupedStudents[maSV]) {
                const hoLot = findValue(row, mapping.hoLot) || '';
                const ten = findValue(row, mapping.ten) || '';
                const hoTen = findValue(row, mapping.hoTen) || (hoLot ? `${hoLot} ${ten}` : ten);

                AppState.groupedStudents[maSV] = {
                    maSV: String(maSV),
                    tenDayDu: hoTen,
                    maLop: findValue(row, mapping.maLop) || '',
                    tenLop: findValue(row, mapping.tenLop) || '',
                    ngaySinh: findValue(row, mapping.ngaySinh) || '',
                    tenNgChng: findValue(row, mapping.tenNgChng) || '',
                    maBH: row.MaBH || '',
                    tenKhoi: row.TenKhoi || '',
                    monHoc: [],
                    tongTien: 0,
                    tongMienGiam: 0,
                    tongPhuThu: 0
                };
            }

            const rawPhaiThu = findValue(row, mapping.phaiThu);
            const rawMienGiam = findValue(row, mapping.mienGiam);
            const rawDonGia = findValue(row, mapping.donGia);
            const rawPhuThu = findValue(row, mapping.phuThu);
            const rawSoTC = findValue(row, mapping.soTC);

            const donGia = parseFloat(rawDonGia) || 0;
            const mienGiam = parseFloat(rawMienGiam) || 0;
            const phuThu = parseFloat(rawPhuThu) || 0;
            const soTC = parseFloat(rawSoTC) || 0;

            // Nếu Phải thu trống, có thể tính toán: (soTC * donGia) - mienGiam + phuThu
            let phaiThu = parseFloat(rawPhaiThu);
            if (isNaN(phaiThu)) {
                phaiThu = (soTC * donGia) - mienGiam + phuThu;
            }

            AppState.groupedStudents[maSV].monHoc.push({
                maMH: findValue(row, mapping.maMH),
                tenMH: findValue(row, mapping.tenMH),
                nhom: row.NhomTo || row.Nhom || '',
                toTH: row.ToTH || '',
                soTC: soTC,
                donGia: donGia,
                mienGiam: mienGiam,
                phuThu: phuThu,
                phaiThu: phaiThu,
                heSoHP: findValue(row, mapping.heSoHP)
            });

            AppState.groupedStudents[maSV].tongTien += phaiThu;
            AppState.groupedStudents[maSV].tongMienGiam += mienGiam;
            AppState.groupedStudents[maSV].tongPhuThu += phuThu;
        });

        UI.showStudentList();
        UI.populateClassFilter();
        const exportActions = DOM.get('exportActions');
        if (exportActions) exportActions.style.display = 'flex';
    }
};
