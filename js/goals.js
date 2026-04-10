document.addEventListener('DOMContentLoaded', () => {
    const email = localStorage.getItem('finplan_active_user_email');
    const userKey = `goals_${email}`;
    const profileKey = `user_${email}`;
    
    let goals = JSON.parse(localStorage.getItem(userKey)) || [];
    const userData = JSON.parse(localStorage.getItem(profileKey)) || {};
    let editingIndex = -1; // Tracks which goal is currently being edited

    const goalForm = document.getElementById('goalForm');
    const goalList = document.getElementById('goalList');

    // Theme Toggle Logic
    const themeToggle = document.getElementById('themeToggle');
    if (localStorage.getItem('finplan_theme') === 'dark') { if(themeToggle) themeToggle.checked = true; }
    
    themeToggle?.addEventListener('change', () => {
        const isDark = themeToggle.checked;
        document.documentElement.classList.toggle('dark-mode', isDark);
        localStorage.setItem('finplan_theme', isDark ? 'dark' : 'light');
    });

    // --- AI Strategy Logic ---
    window.getAIAdvice = function(index) {
        const goal = goals[index];
        const income = parseFloat(userData.income) || 0;
        const months = Math.max(1, (new Date(goal.date).getFullYear() - new Date().getFullYear()) * 12 + (new Date(goal.date).getMonth() - new Date().getMonth()));
        const monthlySavingNeeded = (goal.amount - goal.saved) / months;
        const burden = (monthlySavingNeeded / income) * 100;

        let verdict = burden > 40 ? `⚠️ High Stress (${burden.toFixed(0)}%)` : burden > 20 ? `💡 Ambitious` : `✅ Achievable`;
        const adviceBox = document.getElementById(`aiAdvice-${index}`);
        adviceBox.innerHTML = `<div class="small fw-bold">${verdict}</div>`;
        adviceBox.classList.remove('d-none');
    };

    // --- Render Goals (Now with Edit Mode) ---
    function renderGoals() {
        goalList.innerHTML = '';
        goals.forEach((goal, index) => {
            const progress = Math.min((goal.saved / goal.amount) * 100, 100);
            
            // IF IN EDIT MODE: Show Inputs
            if (editingIndex === index) {
                goalList.innerHTML += `
                <div class="col-md-4">
                    <div class="card shadow border-primary h-100">
                        <div class="card-body p-4">
                            <h6 class="fw-bold mb-3 text-primary">Editing Goal</h6>
                            <input type="text" id="editName-${index}" class="form-control form-control-sm mb-2" value="${goal.name}">
                            <input type="number" id="editAmount-${index}" class="form-control form-control-sm mb-2" value="${goal.amount}">
                            <input type="date" id="editDate-${index}" class="form-control form-control-sm mb-3" value="${goal.date}">
                            
                            <div class="d-flex gap-2">
                                <button class="btn btn-success btn-sm w-100" onclick="saveEdit(${index})">Save</button>
                                <button class="btn btn-secondary btn-sm w-100" onclick="cancelEdit()">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>`;
            } 
            // OTHERWISE: Show Standard Card
            else {
                goalList.innerHTML += `
                <div class="col-md-4">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between mb-3">
                                <h5 class="fw-bold mb-0 text-primary-light">${goal.name}</h5>
                                <div class="d-flex gap-1">
                                    <button class="btn btn-sm btn-outline-secondary border-0 py-0" onclick="startEdit(${index})"><i class="fa-solid fa-pen-to-square"></i></button>
                                    <button class="btn btn-sm btn-outline-success rounded-pill py-0" onclick="getAIAdvice(${index})">AI</button>
                                </div>
                            </div>
                            <div id="aiAdvice-${index}" class="d-none border-start border-3 border-success ps-2 mb-3 py-1"></div>
                            <p class="text-muted small mb-2">Target Date: ${goal.date}</p>
                            <div class="progress mb-2" style="height: 10px;">
                                <div class="progress-bar bg-forestgreen" style="width: ${progress}%"></div>
                            </div>
                            <div class="d-flex justify-content-between small text-muted mb-3">
                                <span>RM ${goal.saved}</span>
                                <span>Target: RM ${goal.amount}</span>
                            </div>
                            <div class="input-group input-group-sm">
                                <input type="number" id="add-${index}" class="form-control" placeholder="+ RM">
                                <button class="btn btn-forestgreen" onclick="updateSavings(${index})">Add</button>
                            </div>
                            <button class="btn btn-link btn-sm text-danger w-100 mt-3 text-decoration-none" onclick="removeGoal(${index})">Delete</button>
                        </div>
                    </div>
                </div>`;
            }
        });
        localStorage.setItem(userKey, JSON.stringify(goals));
    }

    // --- New Edit Functions ---
    window.startEdit = (index) => {
        editingIndex = index;
        renderGoals();
    };

    window.cancelEdit = () => {
        editingIndex = -1;
        renderGoals();
    };

    window.saveEdit = (index) => {
        const newName = document.getElementById(`editName-${index}`).value;
        const newAmount = parseFloat(document.getElementById(`editAmount-${index}`).value);
        const newDate = document.getElementById(`editDate-${index}`).value;

        if (newName && newAmount && newDate) {
            goals[index].name = newName;
            goals[index].amount = newAmount;
            goals[index].date = newDate;
            editingIndex = -1;
            renderGoals();
        } else {
            alert("All fields are required!");
        }
    };

    // --- Standard CRUD ---
    goalForm.onsubmit = (e) => {
        e.preventDefault();
        goals.push({
            name: document.getElementById('goalName').value,
            amount: document.getElementById('goalAmount').value,
            date: document.getElementById('goalDate').value,
            saved: 0
        });
        goalForm.reset();
        renderGoals();
    };

    window.updateSavings = (index) => {
        const amt = parseFloat(document.getElementById(`add-${index}`).value) || 0;
        goals[index].saved += amt;
        renderGoals();
    };

    window.removeGoal = (index) => {
        if(confirm("Delete goal?")) { goals.splice(index, 1); renderGoals(); }
    };

    renderGoals();
});