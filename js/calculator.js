/**
 * FinPlan ROI Calculator & Export Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. THEME & LOGOUT LOGIC ---
    const themeToggle = document.getElementById('themeToggle');
    if (localStorage.getItem('finplan_theme') === 'dark') { if(themeToggle) themeToggle.checked = true; }
    
    themeToggle?.addEventListener('change', () => {
        const isDark = themeToggle.checked;
        document.documentElement.classList.toggle('dark-mode', isDark);
        localStorage.setItem('finplan_theme', isDark ? 'dark' : 'light');
    });

    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('finplan_session');
        window.location.href = 'login.html'; 
    });

    // --- 2. CALCULATOR DOM ELEMENTS ---
    const calcForm = document.getElementById('calcForm');
    const simpleROI = document.getElementById('simpleROI');
    const compoundROI = document.getElementById('compoundROI');
    const simpleProfitEl = document.getElementById('simpleProfit');
    const compoundProfitEl = document.getElementById('compoundProfit');
    const exportCSVBtn = document.getElementById('exportCSV');
    const calcSummary = document.getElementById('calcSummary');

    // Variables to store current calculation state for export
    let currentCalc = null;

    // --- 3. MATHEMATICAL LOGIC ---
    calcForm.addEventListener('submit', e => {
        e.preventDefault();
        
        // Retrieve and parse inputs
        const P = parseFloat(document.getElementById('principal').value);
        const R = parseFloat(document.getElementById('rate').value) / 100;
        const T = parseFloat(document.getElementById('years').value);

        // Core Member E Logic: Simple vs Compound
        const simpleTotal = P + (P * R * T);
        const compoundTotal = P * Math.pow((1 + R), T);

        const simpleProfit = simpleTotal - P;
        const compoundProfit = compoundTotal - P;

        // Update UI with localized formatting
        simpleROI.textContent = `RM ${simpleTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        compoundROI.textContent = `RM ${compoundTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        simpleProfitEl.textContent = `Profit: RM ${simpleProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        compoundProfitEl.textContent = `Profit: RM ${compoundProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

        calcSummary.textContent = `Comparison over ${T} years at ${(R*100).toFixed(1)}%`;

        // Store state for the CSV exporter
        currentCalc = {
            principal: P,
            rate: R * 100,
            years: T,
            simpleTotal: simpleTotal.toFixed(2),
            compoundTotal: compoundTotal.toFixed(2),
            difference: (compoundTotal - simpleTotal).toFixed(2)
        };

        // Enable Export Button
        exportCSVBtn.classList.remove('disabled');
    });

    // --- 4. CSV DATA EXPORT ---
    exportCSVBtn.addEventListener('click', () => {
        if (!currentCalc) return; // Safety check

        // Create CSV structure
        const headers = ["Principal (RM)", "Interest Rate (%)", "Duration (Years)", "Simple Interest Total (RM)", "Compound Interest Total (RM)", "Compound Advantage (RM)"];
        const row = [
            currentCalc.principal, 
            currentCalc.rate, 
            currentCalc.years, 
            currentCalc.simpleTotal, 
            currentCalc.compoundTotal,
            currentCalc.difference
        ];

        // Join arrays with commas, and rows with newlines
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + row.join(",");

        // Encode and trigger download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        
        // Naming the file with a timestamp for professionalism
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute("download", `FinPlan_ROI_Report_${date}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});