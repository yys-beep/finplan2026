/**
 * FinPlan Recommendations & Visualization
 * Managed by Member F
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. THEME & LOGOUT LOGIC ---
    const themeToggle = document.getElementById('themeToggle');
    const isDark = localStorage.getItem('finplan_theme') === 'dark';
    if (isDark) { if(themeToggle) themeToggle.checked = true; }
    
    themeToggle?.addEventListener('change', () => {
        const darkState = themeToggle.checked;
        document.documentElement.classList.toggle('dark-mode', darkState);
        localStorage.setItem('finplan_theme', darkState ? 'dark' : 'light');
        location.reload(); // Reload to redraw chart colors
    });

    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('finplan_session');
        window.location.href = 'login.html'; 
    });

    // --- 2. DATA RETRIEVAL ---
    const email = localStorage.getItem('finplan_active_user_email');
    const userData = JSON.parse(localStorage.getItem(`user_${email}`)) || { risk: 'Medium', income: 0 };
    const goals = JSON.parse(localStorage.getItem(`goals_${email}`)) || [];

    const riskLevel = userData.risk || 'Medium';
    
    // --- 3. DYNAMIC CHART DATA GENERATOR ---
    let chartLabels = [];
    let chartData = [];
    let chartColors = [];

    // Adjust allocations based on the user's risk tolerance from Module 2
    if (riskLevel === 'Low') {
        chartLabels = ['Fixed Deposits', 'Govt Bonds', 'Blue-chip Stocks', 'Cash'];
        chartData = [50, 30, 10, 10];
        chartColors = ['#1b4332', '#2D6A4F', '#52B788', '#95D5B2'];
    } else if (riskLevel === 'High') {
        chartLabels = ['Growth Stocks', 'ETFs', 'Crypto / Alt-assets', 'Cash'];
        chartData = [50, 30, 15, 5];
        chartColors = ['#081c15', '#1b4332', '#40916c', '#b7e4c7'];
    } else { // Medium
        chartLabels = ['Index Funds', 'Blue-chip Stocks', 'Corporate Bonds', 'Cash'];
        chartData = [40, 30, 20, 10];
        chartColors = ['#1b4332', '#2D6A4F', '#74c69d', '#d8f3dc'];
    }

    // --- 4. RENDER CHART.JS ---
    const ctx = document.getElementById('portfolioChart').getContext('2d');
    const textColor = isDark ? '#ffffff' : '#333333';

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartData,
                backgroundColor: chartColors,
                borderWidth: isDark ? 2 : 0,
                borderColor: isDark ? '#1a1a1a' : '#ffffff'
            }]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: textColor, padding: 20, font: { family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" } }
                }
            },
            cutout: '65%' // Makes it a nice thin doughnut
        }
    });

    document.getElementById('chartCaption').innerHTML = `Target allocation for your <b>${riskLevel} Risk</b> profile.`;

    // --- 5. INTELLIGENT TEXT RECOMMENDATIONS ---
    const recsList = document.getElementById('recommendationsList');
    let recs = [];

    // Rule 1: Based on Risk
    if (riskLevel === 'Low') recs.push({ icon: 'fa-shield-halved', text: 'Prioritize capital preservation. Look into Amanah Saham Bumiputera (ASB) or high-yield Fixed Deposits.'});
    else if (riskLevel === 'High') recs.push({ icon: 'fa-rocket', text: 'You have a high risk appetite. Consider diversifying into tech ETFs or emerging markets to maximize growth.'});
    else recs.push({ icon: 'fa-scale-balanced', text: 'Maintain a balanced approach. Dollar-cost average into an S&P 500 index fund to minimize volatility.'});

    // Rule 2: Based on Goals from Module 3
    if (goals.length === 0) {
        recs.push({ icon: 'fa-bullseye', text: 'You have no active goals. Go to the Goal Planner to set a target so we can give better advice!' });
    } else {
        const totalTarget = goals.reduce((sum, g) => sum + parseFloat(g.amount), 0);
        const totalSaved = goals.reduce((sum, g) => sum + parseFloat(g.saved), 0);
        
        if (totalSaved < totalTarget * 0.1) {
            recs.push({ icon: 'fa-seedling', text: `You are just starting on your RM ${totalTarget.toLocaleString()} goal journey. Set up automated monthly transfers.` });
        } else {
            recs.push({ icon: 'fa-trophy', text: `You've saved RM ${totalSaved.toLocaleString()} across your goals! Keep up the momentum.` });
        }
    }

    // Rule 3: Based on Income (if available)
    if (userData.income && parseFloat(userData.income) > 0) {
        const emergencyFund = parseFloat(userData.income) * 6;
        recs.push({ icon: 'fa-piggy-bank', text: `Ensure you have an emergency fund of RM ${emergencyFund.toLocaleString()} (6 months income) before investing aggressively.` });
    }

    // Render Recommendations
    recs.forEach(rec => {
        recsList.innerHTML += `
        <div class="p-3 border rounded-3 d-flex align-items-start" style="background-color: var(--bg-card);">
            <div class="bg-mintgreen text-primary rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                <i class="fa-solid ${rec.icon}"></i>
            </div>
            <div>
                <p class="mb-0 small" style="color: var(--text-color);">${rec.text}</p>
            </div>
        </div>`;
    });
});