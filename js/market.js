/**
 * FinPlan Market Insights Logic
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

    // --- 2. API CONFIGURATION ---
    const newsList = document.getElementById('newsList');
    const searchInput = document.getElementById('searchNews');
    const categorySelect = document.getElementById('categoryFilter');

    // --- 3. LAZY LOADING OBSERVER ---
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src; 
                img.classList.remove('lazy-image');
                observer.unobserve(img); 
            }
        });
    });

    // --- 4. FETCH AND RENDER LOGIC ---
    async function fetchNews(query) {
        newsList.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Analyzing market data...</p></div>';
        
        try {
            const res = await fetch(`/news?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            
            newsList.innerHTML = '';

            if(data.status !== "ok" || !data.articles || data.articles.length === 0) {
                newsList.innerHTML = `<div class="col-12 text-center py-5 text-muted"><i class="fa-solid fa-newspaper fa-2x mb-3"></i><br>No recent news found for "${query}".</div>`;
                return;
            }

            data.articles.forEach(article => {
                if (!article.title || !article.urlToImage) return;

                const cardHTML = `
                <div class="col-md-4 d-flex align-items-stretch">
                    <div class="card border-0 shadow-sm w-100 overflow-hidden market-card">
                        <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjE1MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==" 
                             data-src="${article.urlToImage}" 
                             class="card-img-top lazy-image" alt="News Image" style="height: 180px; object-fit: cover;">
                        
                        <div class="card-body d-flex flex-column">
                            <span class="badge bg-mintgreen text-primary mb-2 align-self-start">${article.source.name || 'News'}</span>
                            <h6 class="card-title fw-bold text-primary-light">${article.title}</h6>
                            <p class="card-text text-muted small flex-grow-1">${article.description ? article.description.substring(0, 100) + '...' : ''}</p>
                            <a href="${article.url}" target="_blank" class="btn btn-outline-forestgreen btn-sm w-100 mt-3">Read Full Article</a>
                        </div>
                    </div>
                </div>`;
                
                newsList.innerHTML += cardHTML;
            });

            // Trigger Lazy Loading
            document.querySelectorAll('.lazy-image').forEach(img => imageObserver.observe(img));

        } catch(err) {
            console.error(err);
            newsList.innerHTML = '<div class="col-12 text-center py-5 text-danger"><i class="fa-solid fa-triangle-exclamation fa-2x mb-3"></i><br>Failed to connect to the news server. Please try again later.</div>';
        }
    }

    // --- 5. INSTANT EVENT LISTENERS ---
    
    // Dropdown change: IMMEDIATE fetch
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            searchInput.value = ''; // Clear custom search text
            fetchNews(e.target.value); // Instantly load the new category
        });
    }

    // Search bar typing: Waits half a second after you stop typing to avoid spamming the API
    let timeoutId;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const query = e.target.value.trim();
                fetchNews(query === '' ? categorySelect.value : query);
            }, 500);
        });
    }

    // --- 6. INITIAL LOAD ---
    // Instantly loads news before the user even clicks anything!
    const defaultSubject = categorySelect ? categorySelect.value : 'finance';
    fetchNews(defaultSubject);
});