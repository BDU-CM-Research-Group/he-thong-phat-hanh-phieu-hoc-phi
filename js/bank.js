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
        const optionsContainer = DOM.get('bankOptions');
        if (!optionsContainer) return;

        let html = '';
        banks.forEach(bank => {
            html += `
                <div class="select-option" onclick="UI.selectCustomOption('bankSelect', '${bank.bin}', '${bank.shortName}')">
                    <div class="bank-option">
                        <img src="${bank.logo || 'https://via.placeholder.com/45x25?text=Bank'}" class="bank-logo" alt="${bank.shortName}">
                        <div class="bank-info">
                            <span class="bank-short-name">${bank.shortName}</span>
                            <span class="bank-full-name">${bank.name}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        optionsContainer.innerHTML = html;

        // Set default bank
        const defaultBank = banks.find(b => b.bin === CONFIG.DEFAULT_BANK);
        if (defaultBank) {
            UI.selectCustomOption('bankSelect', defaultBank.bin, defaultBank.shortName);
        }
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

    quickFill(bankCode) {
        let bankId, shortName, accountNo, accountName;

        switch (bankCode) {
            case 'OCB':
                bankId = '970448';
                shortName = 'OCB';
                accountNo = '3833939339';
                accountName = 'PHAN HIEU DAI HOC BINH DUONG';
                break;
            case 'STB':
                bankId = '970403';
                shortName = 'Sacombank';
                accountNo = '197939339';
                accountName = 'PHAN HIEU DAI HOC BINH DUONG';
                break;
            case 'VCB':
                bankId = '970436';
                shortName = 'Vietcombank';
                accountNo = '7372739339';
                accountName = 'PHAN HIEU DAI HOC BINH DUONG';
                break;
        }

        if (bankId) {
            // Find full name if available to be nicer
            const bank = AppState.banksList.find(b => b.bin === bankId);
            const label = bank ? `${bank.shortName} - ${bank.name}` : shortName;

            UI.selectCustomOption('bankSelect', bankId, label);
            DOM.setValue('accountNo', accountNo);
            DOM.setValue('accountName', accountName);
            UI.updateAccountLookupStatus('✓ Đã điền thông tin mẫu', '#059669');
        }
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
