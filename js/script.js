// Theme toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? 'Light Mode' : 'Dark Mode';
});

// Example: Dynamic dashboard update
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('totalGoals').textContent = 3;
    document.getElementById('totalInvestments').textContent = '$12,500';
    document.getElementById('roi').textContent = '8.5%';
    document.getElementById('recommendCount').textContent = 2;
});