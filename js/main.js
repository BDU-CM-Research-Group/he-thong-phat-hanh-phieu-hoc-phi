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
                    Modal.show({
                        title: 'Sai định dạng file',
                        content: 'Vui lòng chọn file Excel (.xlsx hoặc .xls)',
                        type: 'error'
                    });
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
window.exportBatch = () => PDFExporter.exportBatch();
window.exportSingleFileBatch = () => PDFExporter.exportSingleFileBatch();
window.exportAllPDF = () => PDFExporter.exportAll();

// ============================================
// SIGNATURE UPLOAD HANDLERS
// ============================================
window.handleSignatureUpload = (column, input) => {
    const file = input.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        Modal.show({
            title: 'Lỗi',
            content: 'Vui lòng chọn file ảnh (JPG, PNG, etc.)',
            type: 'error'
        });
        return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        Modal.show({
            title: 'Lỗi',
            content: 'Kích thước file không được vượt quá 2MB',
            type: 'error'
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target.result;
        const columnId = column === 'cot2' ? 'Cot2' : 'Cot3';
        
        // Store signature data
        DOM.setValue(`signatureData${columnId}`, dataUrl);
        
        // Show preview
        const previewDiv = DOM.get(`signaturePreview${columnId}`);
        const previewImg = DOM.get(`signatureImage${columnId}`);
        
        if (previewDiv && previewImg) {
            previewImg.src = dataUrl;
            previewDiv.style.display = 'block';
        }
    };
    
    reader.onerror = () => {
        Modal.show({
            title: 'Lỗi',
            content: 'Không thể đọc file. Vui lòng thử lại.',
            type: 'error'
        });
    };
    
    reader.readAsDataURL(file);
};

window.removeSignature = (column) => {
    const columnId = column === 'cot2' ? 'Cot2' : 'Cot3';
    
    // Clear signature data
    DOM.setValue(`signatureData${columnId}`, '');
    
    // Hide preview
    const previewDiv = DOM.get(`signaturePreview${columnId}`);
    const previewImg = DOM.get(`signatureImage${columnId}`);
    const fileInput = DOM.get(`signatureUpload${columnId}`);
    
    if (previewDiv) previewDiv.style.display = 'none';
    if (previewImg) previewImg.src = '';
    if (fileInput) fileInput.value = '';
};

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
