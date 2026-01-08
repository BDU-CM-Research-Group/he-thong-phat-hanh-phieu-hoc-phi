// ============================================
// MODAL SERVICE
// ============================================
const Modal = {
    show({ title, content, footer, type = 'info' }) {
        const modal = DOM.get('appModal');
        const titleEl = DOM.get('modalTitle');
        const bodyEl = DOM.get('modalBody');
        const footerEl = DOM.get('modalFooter');

        if (!modal) return;

        titleEl.textContent = title || 'Thông báo';
        bodyEl.innerHTML = content;

        if (footer) {
            footerEl.innerHTML = footer;
        } else {
            footerEl.innerHTML = `<button class="btn btn-primary" onclick="Modal.hide()">Đóng</button>`;
        }

        // Tùy chỉnh màu sắc dựa trên type
        const header = modal.querySelector('.modal-header');
        if (type === 'error') {
            header.style.background = '#dc2626';
        } else if (type === 'success') {
            header.style.background = '#059669';
        } else {
            header.style.background = 'var(--primary)';
        }

        // Reset kích thước mặc định
        const modalContainer = modal.querySelector('.modal-container');
        if (modalContainer) modalContainer.style.maxWidth = '500px';

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    },

    hide() {
        const modal = DOM.get('appModal');
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    },

    confirm(message, onConfirm) {
        this.show({
            title: 'Xác nhận',
            content: `<p>${message}</p>`,
            footer: `
                <button class="btn" style="background: #d1d5db;" onclick="Modal.hide()">Hủy</button>
                <button class="btn btn-primary" id="modalConfirmBtn">Đồng ý</button>
            `
        });

        const confirmBtn = DOM.get('modalConfirmBtn');
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                this.hide();
                if (onConfirm) onConfirm();
            };
        }
    }
};
