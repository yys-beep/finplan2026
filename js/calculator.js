/**
 * FinPlan ROI Calculator & Export Logic (Cloud Connected)
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- AGGRESSIVE BACK-BUTTON PROTECTION ---
    window.addEventListener('pageshow', (event) => {
        // event.persisted is TRUE if the browser loaded the page from the "Back" button cache
        if (event.persisted || !localStorage.getItem('finplan_session')) {
            if (!localStorage.getItem('finplan_session')) {
                window.location.replace('login.html');
            }
        }
    });
    
    const sessionEmail = localStorage.getItem('finplan_active_user_email');
    
    // Safety check: redirect if not logged in
    if (!sessionEmail) {
        window.location.href = 'login.html';
        return;
    }

    // --- 1. THEME & LOGOUT LOGIC ---
    const themeToggle = document.getElementById('themeToggle');
    if (localStorage.getItem('finplan_theme') === 'dark') { 
        if(themeToggle) themeToggle.checked = true; 
        document.documentElement.classList.add('dark-mode');
    }
    
    themeToggle?.addEventListener('change', () => {
        const isDark = themeToggle.checked;
        document.documentElement.classList.toggle('dark-mode', isDark);
        localStorage.setItem('finplan_theme', isDark ? 'dark' : 'light');
    });

    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        
        // 1. Clear the security tokens
        localStorage.removeItem('finplan_session');
        localStorage.removeItem('finplan_active_user_email'); 
        
        // 2. Use REPLACE instead of HREF
        window.location.replace('login.html'); 
    });

    // --- 2. CALCULATOR DOM ELEMENTS ---
    const calcForm = document.getElementById('calcForm');
    const principalInput = document.getElementById('principal');
    const rateInput = document.getElementById('rate');
    const yearsInput = document.getElementById('years');
    
    const simpleROI = document.getElementById('simpleROI');
    const compoundROI = document.getElementById('compoundROI');
    const simpleProfitEl = document.getElementById('simpleProfit');
    const compoundProfitEl = document.getElementById('compoundProfit');
    const exportCSVBtn = document.getElementById('exportCSV');
    const calcSummary = document.getElementById('calcSummary');

    let currentCalc = null;

    // --- 3. FETCH PREVIOUS CALCULATION FROM CLOUD ---
    async function loadSavedCalculation() {
        try {
            const res = await fetch(`/.netlify/functions/calculations?email=${sessionEmail}`);
            const data = await res.json();
            
            if (res.ok && data.calculation) {
                // Pre-fill the inputs with their last saved numbers
                principalInput.value = data.calculation.principal;
                rateInput.value = data.calculation.rate;
                yearsInput.value = data.calculation.years;
                
                // Programmatically click the calculate button to show the graphs
                const submitEvent = new Event('submit', { cancelable: true });
                calcForm.dispatchEvent(submitEvent);
            }
        } catch (err) {
            console.log("No previous calculation found or network error.");
        }
    }
    
    // Run the fetch on load
    loadSavedCalculation();

    // --- 4. MATHEMATICAL LOGIC & CLOUD SAVING ---
    calcForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Retrieve and parse inputs
        const P = parseFloat(principalInput.value);
        const R = parseFloat(rateInput.value) / 100;
        const T = parseFloat(yearsInput.value);

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

        exportCSVBtn.classList.remove('disabled');

        // SILENTLY SAVE TO MONGODB
        try {
            await fetch('/.netlify/functions/calculations', {
                method: 'POST',
                body: JSON.stringify({
                    email: sessionEmail,
                    principal: P,
                    rate: R * 100,
                    years: T,
                    simpleTotal: simpleTotal,
                    compoundTotal: compoundTotal
                })
            });
            console.log("Calculation securely backed up to cloud!");
        } catch (err) {
            console.error("Failed to backup calculation.");
        }
    });

    // --- 5. CSV DATA EXPORT ---
    exportCSVBtn.addEventListener('click', () => {
        if (!currentCalc) return; 

        const headers = ["Principal (RM)", "Interest Rate (%)", "Duration (Years)", "Simple Interest Total (RM)", "Compound Interest Total (RM)", "Compound Advantage (RM)"];
        const row = [
            currentCalc.principal, 
            currentCalc.rate, 
            currentCalc.years, 
            currentCalc.simpleTotal, 
            currentCalc.compoundTotal,
            currentCalc.difference
        ];

        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + row.join(",");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute("download", `FinPlan_ROI_Report_${date}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});