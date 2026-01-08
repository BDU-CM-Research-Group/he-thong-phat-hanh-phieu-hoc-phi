// ============================================
// SEARCH FUNCTIONALITY
// ============================================
const Search = {
    perform() {
        const keyword = DOM.getValue('searchInput').toLowerCase().trim();
        const lop = DOM.getValue('classFilter');

        let filtered = AppState.getAllStudents();

        if (lop) {
            filtered = filtered.filter(sv => sv.maLop === lop);
        }

        if (keyword) {
            filtered = filtered.filter(sv =>
                sv.maSV.toLowerCase().includes(keyword) ||
                sv.tenDayDu.toLowerCase().includes(keyword)
            );
        }

        if (filtered.length === 0) {
            UI.showNoResults();
        } else {
            UI.showStudentList(filtered);
        }
    },

    getCurrentFilteredList() {
        const keyword = DOM.getValue('searchInput').toLowerCase().trim();
        const lop = DOM.getValue('classFilter');
        let filtered = AppState.getAllStudents();
        if (lop) filtered = filtered.filter(sv => sv.maLop === lop);
        if (keyword) {
            filtered = filtered.filter(sv =>
                sv.maSV.toLowerCase().includes(keyword) ||
                sv.tenDayDu.toLowerCase().includes(keyword)
            );
        }
        return filtered;
    }
};
