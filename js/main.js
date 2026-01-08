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
