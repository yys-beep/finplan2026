/**
 * FinPlan Recommendations & Visualization (Module 6)
 * AI-Powered Portfolio Recommendations with Dynamic Data Visualization
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

    // --- 1. THEME & LOGOUT LOGIC ---
    const themeToggle = document.getElementById('themeToggle');
    const isDark = localStorage.getItem('finplan_theme') === 'dark';
    if (isDark) { if(themeToggle) themeToggle.checked = true; }
    
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

    // --- 2. DATA RETRIEVAL ---
    const email = localStorage.getItem('finplan_active_user_email');
    const userData = JSON.parse(localStorage.getItem(`user_${email}`)) || { risk: 'Medium', income: 0, name: 'User' };
    const goals = JSON.parse(localStorage.getItem(`goals_${email}`)) || [];

    const riskLevel = userData.risk || 'Medium';
    const userIncome = parseFloat(userData.income) || 0;
    const userName = userData.name || 'Investor';
    
    // --- 3. CALCULATE KEY METRICS ---
    const totalGoalAmount = goals.reduce((sum, g) => sum + parseFloat(g.amount || 0), 0);
    const totalSaved = goals.reduce((sum, g) => sum + parseFloat(g.saved || 0), 0);
    const overallProgress = totalGoalAmount > 0 ? (totalSaved / totalGoalAmount) * 100 : 0;
    const emergencyFundTarget = userIncome * 6;
    
    // --- 4. DYNAMIC PORTFOLIO ALLOCATION ---
    let chartLabels = [];
    let chartData = [];
    let chartColors = [];

    if (riskLevel === 'Low') {
        chartLabels = ['Fixed Deposits', 'Govt Bonds', 'Blue-chip Stocks', 'Cash Reserve'];
        chartData = [50, 30, 10, 10];
        chartColors = ['#1b4332', '#2D6A4F', '#52B788', '#95D5B2'];
    } else if (riskLevel === 'High') {
        chartLabels = ['Growth Stocks', 'ETFs', 'Crypto/Alt-assets', 'Cash Reserve'];
        chartData = [50, 30, 15, 5];
        chartColors = ['#081c15', '#1b4332', '#40916c', '#b7e4c7'];
    } else {
        chartLabels = ['Index Funds', 'Blue-chip Stocks', 'Corporate Bonds', 'Cash Reserve'];
        chartData = [40, 30, 20, 10];
        chartColors = ['#1b4332', '#2D6A4F', '#74c69d', '#d8f3dc'];
    }

    // --- 5. RENDER PORTFOLIO ALLOCATION CHART ---
    const canvas = document.getElementById('portfolioChart');
    const textColor = isDark ? '#ffffff' : '#333333';
    
    if (canvas && typeof Chart !== 'undefined') {
        const ctx = canvas.getContext('2d');
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
                    labels: { color: textColor, padding: 20, font: { size: 12, family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            },
            cutout: '65%'
        }
        });
    }

    const captionEl = document.getElementById('chartCaption');
    if (captionEl) captionEl.innerHTML = `📊 <b>${riskLevel} Risk</b> profile allocation strategy for optimal growth.`;

    // --- 6. INTELLIGENT MULTI-RULE RECOMMENDATION ENGINE ---
    const recsList = document.getElementById('recommendationsList');
    if (!recsList) return;
    let recs = [];

    // ===== RULE 1: RISK-BASED ADVICE =====
    if (riskLevel === 'Low') {
        recs.push({ 
            icon: 'fa-shield-alt', 
            text: ' <b>Capital Preservation Focus:</b> Prioritize safety. Look into Amanah Saham Bumiputera (ASB) or high-yield Fixed Deposits. Target 5-6% annual returns.',
            priority: 'high'
        });
    } else if (riskLevel === 'High') {
        recs.push({ 
            icon: 'fa-rocket', 
            text: ' <b>Growth Aggressive:</b> High risk appetite identified. Diversify into tech ETFs, emerging markets, and growth stocks. Target 10%+ annual returns.',
            priority: 'high'
        });
    } else {
        recs.push({ 
            icon: 'fa-balance-scale', 
            text: ' <b>Balanced Growth:</b> Maintain equilibrium. Dollar-cost average into index funds (VTSAX/VOO equivalents) for steady 7-8% returns.',
            priority: 'high'
        });
    }

    // ===== RULE 2: GOAL TRACKING ADVICE =====
    if (goals.length === 0) {
        recs.push({ 
            icon: 'fa-bullseye', 
            text: ' <b>No Goals Set:</b> Visit the Goal Planner module to define specific financial targets. AI recommendations require goal context!',
            priority: 'critical'
        });
    } else {
        const avgGoalDuration = goals.reduce((sum, g) => {
            const months = Math.max(1, (new Date(g.date).getFullYear() - new Date().getFullYear()) * 12 + (new Date(g.date).getMonth() - new Date().getMonth()));
            return sum + months;
        }, 0) / goals.length;

        if (overallProgress < 10) {
            recs.push({ 
                icon: 'fa-seedling', 
                text: ` <b>Early Stage:</b> You've saved RM ${totalSaved.toLocaleString()} toward RM ${totalGoalAmount.toLocaleString()}. Set up automated monthly transfers now!`,
                priority: 'high'
            });
        } else if (overallProgress < 50) {
            recs.push({ 
                icon: 'fa-chart-line', 
                text: ` <b>On Track:</b> You're ${overallProgress.toFixed(1)}% toward your goals. Increase monthly contributions by 10% to accelerate timeline.`,
                priority: 'medium'
            });
        } else {
            recs.push({ 
                icon: 'fa-trophy', 
                text: ` <b>Excellent Progress:</b> You've saved RM ${totalSaved.toLocaleString()} (${overallProgress.toFixed(1)}% complete)! Momentum is strong.`,
                priority: 'low'
            });
        }
    }

    // ===== RULE 3: EMERGENCY FUND ADVICE =====
    if (userIncome > 0) {
        recs.push({ 
            icon: 'fa-piggy-bank', 
            text: ` <b>Emergency Fund Check:</b> Ensure you have RM ${emergencyFundTarget.toLocaleString()} (6 months income) in liquid savings before aggressive investing.`,
            priority: 'high'
        });
    }

    // ===== RULE 4: TAX OPTIMIZATION ADVICE =====
    if (userIncome > 50000) {
        recs.push({ 
            icon: 'fa-file-invoice-dollar', 
            text: ' <b>Tax Planning:</b> With your income level, consider tax-advantaged instruments: ASB dividends, EPF contributions, and dividend-focused stocks.',
            priority: 'medium'
        });
    }

    // ===== RULE 5: DIVERSIFICATION ADVICE =====
    if (goals.length > 0) {
        const goalDiversity = new Set(goals.map(g => g.name.substring(0, 3))).size;
        if (goalDiversity < 2) {
            recs.push({ 
                icon: 'fa-code-branch', 
                text: ' <b>Diversification Tip:</b> Consider adding different goal types (retirement, education, home) to reduce concentration risk.',
                priority: 'medium'
            });
        }
    }

    // ===== RENDER HARDCODED RECOMMENDATIONS =====
    recs.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // 1. Inject the Real AI Strategy Box at the top (matches screenshot exactly)
    recsList.innerHTML = `
        <div id="aiHolisticInsight" class="p-4 border rounded-3 mb-4 shadow-sm" style="background-color: #f1f8f4;">
            <div class="d-flex align-items-center mb-2">
                <i class="fa-solid fa-brain text-forestgreen fa-lg me-2"></i>
                <h6 class="fw-bold text-forestgreen mb-0">Gemini Holistic Strategy</h6>
            </div>
            <p id="aiHolisticText" class="small mb-0 mt-2" style="color: var(--text-color);">
                <span class="spinner-border spinner-border-sm me-2 text-forestgreen"></span> Analyzing your portfolio...
            </p>
        </div>
    `;

    // 2. Append the Hardcoded Expert Rules below it (clean white cards, centered icons)
    recs.forEach(rec => {
        recsList.insertAdjacentHTML('beforeend', `
        <div class="p-4 border rounded-3 d-flex align-items-center recommendation-card mb-3 shadow-sm bg-white">
            <div class="bg-mintgreen text-forestgreen rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 me-4" style="width: 48px; height: 48px;">
                <i class="fa-solid ${rec.icon} fa-lg"></i>
            </div>
            <div style="color: var(--text-color);">
                <p class="mb-0 small">${rec.text}</p>
            </div>
        </div>`);
    });

    // ===== FETCH REAL HOLISTIC AI =====
    async function fetchHolisticAI() {
        const aiTextEl = document.getElementById('aiHolisticText');
        try {
            const response = await fetch('/.netlify/functions/ai-portfolio', {
                method: 'POST',
                body: JSON.stringify({
                    income: userIncome,
                    riskLevel: riskLevel,
                    goals: goals
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Update the placeholder with the AI's response
                aiTextEl.innerHTML = result.advice;
            } else {
                aiTextEl.innerHTML = "<span class='text-danger'>AI Analysis temporarily unavailable. Please rely on the expert rules below.</span>";
            }
        } catch (error) {
            aiTextEl.innerHTML = "<span class='text-danger'>Network error connecting to AI core.</span>";
        }
    }

    // Trigger the AI fetch in the background
    fetchHolisticAI();
});