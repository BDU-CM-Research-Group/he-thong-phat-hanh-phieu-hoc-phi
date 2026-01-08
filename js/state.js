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

    selectedSVs: new Set(),

    toggleSelection(maSV) {
        if (this.selectedSVs.has(maSV)) {
            this.selectedSVs.delete(maSV);
        } else {
            this.selectedSVs.add(maSV);
        }
    },

    clearSelection() {
        this.selectedSVs.clear();
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
