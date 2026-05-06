/**
 * FinPlan Dashboard Visualizations (Module 6)
 * Ensures Chart.js is available, then initializes charts
 */

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

function initDashboardCharts() {
  // --- 1. THEME & AUTH CHECK ---
  if (!localStorage.getItem('finplan_session')) {
    // not logged in; don't attempt to render
    return;
  }

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
    localStorage.removeItem('finplan_session');
    window.location.href = 'login.html';
  });

  // --- 2. DATA RETRIEVAL ---
  const email = localStorage.getItem('finplan_active_user_email');
  const userData = JSON.parse(localStorage.getItem(`user_${email}`)) || { risk: 'Medium', income: 0, name: 'User', employment: '---' };
  const goals = JSON.parse(localStorage.getItem(`goals_${email}`)) || [];

  // --- 3. UPDATE DASHBOARD STATS ---
  document.getElementById('navGreeting').textContent = `Hello, ${userData.name || 'User'}!`;
  document.getElementById('statIncome').textContent = `RM ${(parseFloat(userData.income) || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
  document.getElementById('statRisk').textContent = userData.risk || '---';
  document.getElementById('statJob').textContent = userData.employment || '---';
  document.getElementById('displayDate').textContent = new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Set top goal badge
  if (goals.length > 0) {
    const topGoal = goals.reduce((prev, curr) => (parseFloat(curr.amount) > parseFloat(prev.amount)) ? curr : prev);
    const el = document.getElementById('topGoal');
    if (el) el.textContent = topGoal.name.substring(0, 20) + (topGoal.name.length > 20 ? '...' : '');
  }

  // helper to safe-get canvas context
  function ctxFor(id) {
    const c = document.getElementById(id);
    return c ? c.getContext('2d') : null;
  }

  // --- 4. GOALS PROGRESS CHART (Bar Chart) ---
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
            borderRadius: 6,
            borderSkipped: false
          }, {
            label: 'Target (RM)',
            data: goals.map(g => parseFloat(g.amount || 0)),
            backgroundColor: '#d8f3dc',
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor, font: { size: 11 } } },
            tooltip: { callbacks: { label: function(context) { return context.dataset.label + ': RM ' + context.parsed.x.toLocaleString('en-MY'); } } }
          },
          scales: { x: { stacked: false, ticks: { color: textColor }, grid: { color: gridColor } }, y: { ticks: { color: textColor }, grid: { color: gridColor } } }
        }
      });
    }
  } else {
    const cap = document.getElementById('goalsCaption'); if (cap) cap.textContent = 'No goals created yet. Visit Goal Planner to create your first goal!';
  }

  // --- 5. RISK PROFILE CHART (Doughnut) ---
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
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor, padding: 15, font: { size: 11 } } }, tooltip: { callbacks: { label: function(context) { return context.label + ': ' + context.parsed + '%'; } } } }, cutout: '65%' }
    });
    const rc = document.getElementById('riskCaption'); if (rc) rc.textContent = `${riskTitle} profile asset allocation recommended.`;
  }

  // --- 6. INCOME VS SAVINGS CHART (Line/Bar) ---
  const incomeCtx = ctxFor('incomeChart');
  if (incomeCtx) {
    const monthlyIncome = parseFloat(userData.income) || 0;
    const totalSaved = goals.reduce((sum, g) => sum + parseFloat(g.saved || 0), 0);
    const monthsSinceCreation = goals.length > 0 ? 3 : 1;
    const avgMonthlySavings = monthsSinceCreation > 0 ? totalSaved / monthsSinceCreation : 0;
    const savingsRate = monthlyIncome > 0 ? (avgMonthlySavings / monthlyIncome) * 100 : 0;

    new Chart(incomeCtx, {
      type: 'bar',
      data: { labels: ['Monthly Income', 'Avg Monthly Savings', 'Savings Rate %'], datasets: [{ label: 'Amount (RM)', data: [monthlyIncome, avgMonthlySavings, savingsRate], backgroundColor: ['#2D6A4F', '#52B788', '#95D5B2'], borderRadius: 6, borderSkipped: false }] },
      options: { indexAxis: 'x', responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: textColor } }, tooltip: { callbacks: { label: function(context) { if (context.dataIndex === 2) { return 'Savings Rate: ' + context.parsed.y.toFixed(1) + '%'; } return 'RM ' + context.parsed.y.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); } } } }, scales: { y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } }, x: { ticks: { color: textColor }, grid: { color: gridColor } } } }
    });
    const ic = document.getElementById('incomeCaption'); if (ic) ic.textContent = `You're saving an average of ${savingsRate.toFixed(1)}% of your monthly income.`;
  }

  // --- 7. QUICK TIPS FROM AI ---
  const tipsContainer = document.getElementById('dashboardTips');
  const tips = [];
  if (goals.length === 0) {
    tips.push('🎯 Create your first financial goal to get personalized recommendations!');
  } else {
    const totalTarget = goals.reduce((sum, g) => sum + parseFloat(g.amount || 0), 0);
    const totalSaved = goals.reduce((sum, g) => sum + parseFloat(g.saved || 0), 0);
    const progress = (totalSaved / totalTarget) * 100;
    if (progress < 25) tips.push('🚀 You\'re just getting started! Increase your monthly contributions to accelerate progress.');
    else if (progress < 75) tips.push('📈 Great momentum! You\'re on track. Consider increasing your savings by 10% next month.');
    else tips.push('🏆 Excellent! You\'re nearly there. Plan your next financial goal!');
  }
  if (userData.income && parseFloat(userData.income) > 0) {
    const emergencyFund = parseFloat(userData.income) * 6;
    tips.push(`🏦 Emergency Fund Target: RM ${emergencyFund.toLocaleString('en-MY')} (6 months of income)`);
  }
  if (userData.risk === 'Low') tips.push('🛡️ Conservative investor? Explore ASB and fixed-income securities for steady returns.');
  else if (userData.risk === 'High') tips.push('🚀 Growth-focused! Consider diversifying into tech ETFs and emerging market funds.');
  if (tipsContainer) tipsContainer.innerHTML = tips.map(tip => `<p class="small mb-2 text-muted"><i class="fa-solid fa-check text-success me-2"></i>${tip}</p>`).join('');

  // --- 8. SERVICE WORKER REGISTRATION ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('js/sw.js')
        .then(() => console.log('SW Registered from Dashboard'))
        .catch(err => console.log('SW Registration failed: ', err));
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ensureChartThenInit(initDashboardCharts);
});
