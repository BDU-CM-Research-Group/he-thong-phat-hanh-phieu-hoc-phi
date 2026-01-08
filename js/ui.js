// ============================================
// UI RENDERING
// ============================================
const UI = {
    showStudentList(students = null) {
        const list = students || AppState.getAllStudents();
        const listDiv = DOM.get('studentList');

        const allSelected = list.length > 0 && list.every(sv => AppState.selectedSVs.has(sv.maSV));

        let html = `<p style="margin-bottom: 10px; color: #6b7280; font-size: 0.85rem;">
            ${students ? 'Tìm thấy' : 'Tổng số'}: <strong>${list.length}</strong> sinh viên | 
            Đã chọn: <strong id="selectedCountDisplay">${AppState.selectedSVs.size}</strong>
        </p>`;

        html += '<div style="flex: 1; overflow-y: auto; border: 0.2px solid #d1d5db;">';
        html += '<table class="student-table"><thead><tr>';
        html += `<th style="width: 40px; text-align: center;"><input type="checkbox" id="selectAll" ${allSelected ? 'checked' : ''} onchange="UI.toggleSelectAll(this)"></th>`;
        html += '<th>Mã SV</th><th>Họ tên</th><th>Lớp</th>';
        html += '<th style="text-align: right;">Tổng tiền</th>';
        html += '<th style="text-align: center;">Thao tác</th>';
        html += '</tr></thead><tbody>';

        list.forEach(sv => {
            const isSelected = AppState.selectedSVs.has(sv.maSV);
            html += `<tr>
                <td style="text-align: center;"><input type="checkbox" class="sv-checkbox" value="${sv.maSV}" ${isSelected ? 'checked' : ''} onchange="UI.toggleStudentSelection('${sv.maSV}')"></td>
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

    populateClassFilter() {
        const optionsContainer = DOM.get('classOptions');
        if (!optionsContainer) return;

        const studentsByClass = AppState.groupByClass();
        const classes = Object.keys(studentsByClass).sort();

        let html = `<div class="select-option selected" onclick="UI.selectCustomOption('classSelect', '', 'Tất cả lớp')">Tất cả lớp</div>`;
        classes.forEach(lop => {
            html += `<div class="select-option" onclick="UI.selectCustomOption('classSelect', '${lop}', '${lop}')">${lop}</div>`;
        });

        optionsContainer.innerHTML = html;

        // Reset displayed value
        DOM.setValue('classFilter', '');
        const labelEl = DOM.get('classSelectValue');
        if (labelEl) labelEl.textContent = 'Tất cả lớp';
    },

    toggleCustomSelect(id) {
        const el = DOM.get(id);
        if (!el) return;

        const isActive = el.classList.contains('active');

        // Close all other custom selects first
        document.querySelectorAll('.custom-select').forEach(s => s.classList.remove('active'));

        if (!isActive) {
            el.classList.add('active');
            // Focus search input if exists
            const searchInput = el.querySelector('.select-search input');
            if (searchInput) {
                setTimeout(() => searchInput.focus(), 100);
            }
        }
    },

    selectCustomOption(id, value, label) {
        const el = DOM.get(id);
        if (!el) return;

        // Update hidden input and label
        if (id === 'classSelect') {
            DOM.setValue('classFilter', value);
            const labelEl = DOM.get('classSelectValue');
            if (labelEl) labelEl.textContent = label;

            // Trigger search
            Search.perform();
        } else if (id === 'bankSelect') {
            DOM.setValue('bankId', value);
            const labelEl = DOM.get('bankSelectValue');
            if (labelEl) labelEl.textContent = label;

            // Trigger account lookup if account number exists
            if (typeof AccountLookup !== 'undefined' && AccountLookup.perform) {
                AccountLookup.perform();
            }
        }

        // Update selection styles (mark as selected)
        el.querySelectorAll('.select-option').forEach(opt => {
            const onclick = opt.getAttribute('onclick') || '';
            opt.classList.toggle('selected', onclick.includes(`'${value}'`));
        });

        // Close dropdown
        el.classList.remove('active');
    },

    filterCustomSelect(id, query) {
        const el = DOM.get(id);
        if (!el) return;

        const q = query.toLowerCase().trim();
        const options = el.querySelectorAll('.select-option');

        options.forEach(opt => {
            const text = opt.textContent.toLowerCase();
            if (text.includes(q)) {
                opt.classList.remove('hidden');
            } else {
                opt.classList.add('hidden');
            }
        });
    },

    toggleStudentSelection(maSV) {
        AppState.toggleSelection(maSV);
        const countEl = DOM.get('selectedCountDisplay');
        if (countEl) countEl.textContent = AppState.selectedSVs.size;
    },

    toggleSelectAll(checkbox) {
        const isChecked = checkbox.checked;
        const currentList = Search.getCurrentFilteredList();

        currentList.forEach(sv => {
            if (isChecked) {
                AppState.selectedSVs.add(sv.maSV);
            } else {
                AppState.selectedSVs.delete(sv.maSV);
            }
        });

        this.showStudentList(currentList);
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
