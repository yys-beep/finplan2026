/**
 * FinPlan Dashboard Visualizations (Module 6)
 * Securely synced with MongoDB Cloud
 */

// unit testing UT-10
// --- Logic Section (Safe for Node.js) ---
function generateChartData(data) {
    // Your logic to process data for the chart
    return data.map(item => item.amount);
}

function ensureChartThenInit(initFn) {
    if (typeof Chart !== 'undefined') return initFn();
    const src = 'https://cdn.jsdelivr.net/npm/chart.js';
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
        existing.addEventListener('load', initFn);
        existing.addEventListener('error', () => { console.warn('Chart.js failed to load from CDN'); initFn(); });
        return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.onload = initFn;
    s.onerror = () => { console.warn('Chart.js failed to load from CDN'); initFn(); };
    document.head.appendChild(s);
}

async function initDashboardCharts() {
    // --- 1. AUTH CHECK ---
    const email = localStorage.getItem('finplan_active_user_email');
    if (!localStorage.getItem('finplan_session') || !email) {
        window.location.href = 'login.html';
        return;
    }

    // --- 2. THEME & LOGOUT ---
    const isDark = localStorage.getItem('finplan_theme') === 'dark';
    const textColor = isDark ? '#ffffff' : '#333333';
    const gridColor = isDark ? '#333333' : '#eeeeee';
    const themeToggle = document.getElementById('themeToggle');

    if (isDark && themeToggle) themeToggle.checked = true;
    themeToggle?.addEventListener('change', () => {
        const darkState = themeToggle.checked;
        document.documentElement.classList.toggle('dark-mode', darkState);
        localStorage.setItem('finplan_theme', darkState ? 'dark' : 'light');
        location.reload();
    });

    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        
        // 1. Clear the security tokens
        localStorage.removeItem('finplan_session');
        localStorage.removeItem('finplan_active_user_email'); 
        
        // 2. Use REPLACE instead of HREF
        window.location.replace('login.html'); 
    });

    // --- 3. CLOUD DATA SYNC (MongoDB) ---
    // Actively pull the latest profile and goals from the database
    try {
        const [userRes, goalsRes] = await Promise.all([
            fetch('/.netlify/functions/auth-api', {
                method: 'POST',
                body: JSON.stringify({ action: 'get-profile', email: email })
            }),
            fetch(`/.netlify/functions/goals-api?email=${encodeURIComponent(email)}`)
        ]);

        if (userRes.ok && goalsRes.ok) {
            const userDataObj = await userRes.json();
            const goalsData = await goalsRes.json();
            
            // Update local storage so charts have the freshest data
            localStorage.setItem(`user_${email}`, JSON.stringify(userDataObj.user));
            localStorage.setItem(`goals_${email}`, JSON.stringify(goalsData));
        }
    } catch (err) {
        console.warn("Running in offline mode. Using cached data.");
    }

    // --- 4. LOAD SYNCED DATA ---
    const userData = JSON.parse(localStorage.getItem(`user_${email}`)) || { risk: 'Medium', income: 0, name: 'User', employment: '---' };
    const goals = JSON.parse(localStorage.getItem(`goals_${email}`)) || [];

    // --- 5. UPDATE DASHBOARD STATS ---
    const welcomeEl = document.getElementById('welcomeHeading');
    if (welcomeEl) {
        welcomeEl.textContent = `Welcome back, ${userData.name || 'User'}!`;
    }
    if (navGreeting && userData.name) {
        // Split the name by spaces and grab the first item [0]
        const firstName = userData.name.trim().split(' ')[0]; 
        navGreeting.textContent = `Hello, ${firstName}!`;
    }
    
    document.getElementById('statIncome').textContent = `RM ${(parseFloat(userData.income) || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
    document.getElementById('statRisk').textContent = userData.risk || '---';
    document.getElementById('statJob').textContent = userData.employment || '---';
    document.getElementById('displayDate').textContent = new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (goals.length > 0) {
        const topGoal = goals.reduce((prev, curr) => (parseFloat(curr.amount) > parseFloat(prev.amount)) ? curr : prev);
        const el = document.getElementById('topGoal');
        if (el) el.textContent = topGoal.name.substring(0, 20) + (topGoal.name.length > 20 ? '...' : '');
    }

    function ctxFor(id) {
        const c = document.getElementById(id);
        return c ? c.getContext('2d') : null;
    }

    // --- 6. GOALS PROGRESS CHART ---
    if (goals.length > 0) {
        const goalsCtx = ctxFor('goalsChart');
        if (goalsCtx) {
            new Chart(goalsCtx, {
                type: 'bar',
                data: {
                    labels: goals.map(g => g.name.substring(0, 12)),
                    datasets: [{
                        label: 'Saved (RM)',
                        data: goals.map(g => parseFloat(g.saved || 0)),
                        backgroundColor: '#52B788',
                        borderRadius: 6
                    }, {
                        label: 'Target (RM)',
                        data: goals.map(g => parseFloat(g.amount || 0)),
                        backgroundColor: '#d8f3dc',
                        borderRadius: 6
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: textColor, font: { size: 11 } } } },
                    scales: { x: { ticks: { color: textColor }, grid: { color: gridColor } }, y: { ticks: { color: textColor }, grid: { color: gridColor } } }
                }
            });
        }
    } else {
        const cap = document.getElementById('goalsCaption'); 
        if (cap) cap.textContent = 'No goals created yet. Visit Goal Planner to create your first goal!';
    }

    // --- 7. RISK PROFILE CHART ---
    const riskCtx = ctxFor('riskChart');
    if (riskCtx) {
        let riskLabels = ['Fixed Deposits', 'Govt Bonds', 'Blue-chip Stocks', 'Cash'];
        let riskData = [50, 30, 10, 10];
        let riskColors = ['#1b4332', '#2D6A4F', '#52B788', '#95D5B2'];
        let riskTitle = 'Low Risk';

        if (userData.risk === 'High') {
            riskLabels = ['Growth Stocks', 'ETFs', 'Crypto/Alt', 'Cash'];
            riskData = [50, 30, 15, 5];
            riskColors = ['#081c15', '#1b4332', '#40916c', '#b7e4c7'];
            riskTitle = 'High Risk';
        } else if (userData.risk === 'Medium') {
            riskLabels = ['Index Funds', 'Blue-chip', 'Corp Bonds', 'Cash'];
            riskData = [40, 30, 20, 10];
            riskColors = ['#1b4332', '#2D6A4F', '#74c69d', '#d8f3dc'];
            riskTitle = 'Moderate Risk';
        }

        new Chart(riskCtx, {
            type: 'doughnut',
            data: { labels: riskLabels, datasets: [{ data: riskData, backgroundColor: riskColors, borderWidth: isDark ? 2 : 0, borderColor: isDark ? '#1a1a1a' : '#ffffff' }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor } } }, cutout: '65%' }
        });
        const rc = document.getElementById('riskCaption'); 
        if (rc) rc.textContent = `${riskTitle} profile asset allocation recommended.`;
    }

    // --- 8. INCOME VS SAVINGS CHART ---
    const incomeCtx = ctxFor('incomeChart');
    if (incomeCtx) {
        const monthlyIncome = parseFloat(userData.income) || 0;
        const totalSaved = goals.reduce((sum, g) => sum + parseFloat(g.saved || 0), 0);
        const monthsSinceCreation = goals.length > 0 ? 3 : 1; 
        const avgMonthlySavings = monthsSinceCreation > 0 ? totalSaved / monthsSinceCreation : 0;
        const savingsRate = monthlyIncome > 0 ? (avgMonthlySavings / monthlyIncome) * 100 : 0;

        new Chart(incomeCtx, {
            type: 'bar',
            data: { 
                labels: ['Monthly Income', 'Avg Monthly Savings', 'Savings Rate %'], 
                datasets: [{ label: 'Amount (RM)', data: [monthlyIncome, avgMonthlySavings, savingsRate], backgroundColor: ['#2D6A4F', '#52B788', '#95D5B2'], borderRadius: 6 }] 
            },
            options: { 
                indexAxis: 'x', 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { labels: { color: textColor } } }, 
                scales: { y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } }, x: { ticks: { color: textColor }, grid: { color: gridColor } } } 
            }
        });
        const ic = document.getElementById('incomeCaption'); 
        if (ic) ic.textContent = `You're saving an average of ${savingsRate.toFixed(1)}% of your monthly income.`;
    }

    // --- 9. QUICK TIPS FROM REAL AI ---
    const tipsContainer = document.getElementById('dashboardTips');
    if (tipsContainer) {
        tipsContainer.innerHTML = '<p class="small mb-2 text-muted"><span class="spinner-border spinner-border-sm me-2 text-success"></span>AI is generating your daily insights...</p>';
        
        async function loadDashboardTips() {
            try {
                const response = await fetch('/.netlify/functions/ai-dashboard-tips', {
                    method: 'POST',
                    body: JSON.stringify({
                        income: parseFloat(userData.income) || 0,
                        riskLevel: userData.risk || 'Medium',
                        goals: goals
                    })
                });
                
                const result = await response.json();
                
                if (response.ok && result.tips) {
                    tipsContainer.innerHTML = result.tips.map(tip => 
                        `<p class="small mb-2 text-muted"><i class="fa-solid fa-bolt text-warning me-2"></i>${tip}</p>`
                    ).join('');
                } else {
                    throw new Error("API Format Error");
                }
            } catch (err) {
                tipsContainer.innerHTML = `
                    <p class="small mb-2 text-muted"><i class="fa-solid fa-shield-alt text-success me-2"></i>Stay consistent with your ${userData.risk || 'Medium'} risk investment strategy.</p>
                    <p class="small mb-2 text-muted"><i class="fa-solid fa-piggy-bank text-success me-2"></i>Consider automating your monthly deposits.</p>
                `;
            }
        }
        loadDashboardTips();
    }
}

if (typeof document !== 'undefined') {
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
    
    ensureChartThenInit(initDashboardCharts);
});
}

// unit testing UT-10
// This prevents the browser from crashing while still allowing Unit Tests to run
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateChartData };
}