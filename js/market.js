/**
 * FinPlan Market Insights Logic
 * Integrates NewsAPI (Pagination) and Alpha Vantage (Live Stocks)
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. AGGRESSIVE SECURITY & THEME ---
    window.addEventListener('pageshow', (event) => {
        if (event.persisted || !localStorage.getItem('finplan_session')) {
            if (!localStorage.getItem('finplan_session')) window.location.replace('login.html');
        }
    });

    const themeToggle = document.getElementById('themeToggle');
    if (localStorage.getItem('finplan_theme') === 'dark') { if(themeToggle) themeToggle.checked = true; }
    
    themeToggle?.addEventListener('change', () => {
        const isDark = themeToggle.checked;
        document.documentElement.classList.toggle('dark-mode', isDark);
        localStorage.setItem('finplan_theme', isDark ? 'dark' : 'light');
    });

    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('finplan_session');
        localStorage.removeItem('finplan_active_user_email'); 
        window.location.replace('login.html'); 
    });

    // --- 2. GLOBAL VARIABLES FOR PAGINATION ---
    const newsList = document.getElementById('newsList');
    const searchInput = document.getElementById('searchNews');
    const categorySelect = document.getElementById('categoryFilter');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const stockContainer = document.getElementById('stockTickerContainer');
    const userEmail = localStorage.getItem('finplan_active_user_email');
    
    let currentPage = 1;
    let currentActiveQuery = 'finance'; 
    let isFetching = false;

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

    // --- 4. LIVE STOCK TRACKER (Alpha Vantage) ---
    async function fetchStocks() {
        if (!stockContainer) return;
        
        try {
            const res = await fetch('/.netlify/functions/stocks');
            const result = await res.json();
            
            stockContainer.innerHTML = ''; // Clear loader
            
            if (result.data && result.data.length > 0) {
                result.data.forEach(stock => {
                    const isPositive = parseFloat(stock.change) >= 0;
                    const colorClass = isPositive ? 'text-success' : 'text-danger';
                    const icon = isPositive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
                    const bgClass = isPositive ? 'bg-success' : 'bg-danger';

                    const stockCard = `
                    <div class="col-md-4">
                        <div class="card market-card border-0 shadow-sm h-100">
                            <div class="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="fw-bold mb-0 text-charcoal">${stock.symbol}</h5>
                                    <h4 class="mb-0 mt-1">$${stock.price}</h4>
                                </div>
                                <div class="text-end">
                                    <div class="badge ${bgClass} bg-opacity-10 ${colorClass} p-2 mb-1 rounded-3">
                                        <i class="fa-solid ${icon} me-1"></i> ${stock.changePercent}
                                    </div>
                                    <p class="small text-muted mb-0">${stock.change} USD</p>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    stockContainer.innerHTML += stockCard;
                });
            }
        } catch (err) {
            stockContainer.innerHTML = '<div class="col-12 text-muted small"><i class="fa-solid fa-circle-exclamation text-warning me-1"></i> Market data temporarily unavailable.</div>';
        }
    }

    // --- 5. PAGINATED NEWS FEED ---
    async function fetchNews(query, page = 1, append = false) {
        if (isFetching) return;
        isFetching = true;
        currentActiveQuery = query;
        currentPage = page;

        if (!append) {
            newsList.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Analyzing market data...</p></div>';
            loadMoreContainer.classList.add('d-none');
        } else {
            const originalText = loadMoreBtn.innerHTML;
            loadMoreBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
        }
        
        try {
            // Note: Your news.js backend function needs to accept & pass the 'page' variable to NewsAPI!
            const API_URL = `/.netlify/functions/news?q=${encodeURIComponent(query)}&page=${page}`;
            const res = await fetch(API_URL);
            const data = await res.json();
            
            if (!append) newsList.innerHTML = '';

            if(data.status !== "ok" || !data.articles || data.articles.length === 0) {
                if (!append) {
                    newsList.innerHTML = `<div class="col-12 text-center py-5 text-muted"><i class="fa-solid fa-newspaper fa-2x mb-3"></i><br>No recent news found for "${query}".</div>`;
                }
                loadMoreContainer.classList.add('d-none');
                isFetching = false;
                return;
            }

            data.articles.forEach(article => {
                if (!article.title || !article.urlToImage) return; // Skip broken articles

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

            document.querySelectorAll('.lazy-image').forEach(img => imageObserver.observe(img));

            // Logic to show/hide Load More button
            // If the API returns exactly 9 articles (assuming your backend requests 9 per page), there might be more.
            if (data.articles.length > 0) {
                loadMoreContainer.classList.remove('d-none');
                loadMoreBtn.innerHTML = 'Load More News <i class="fa-solid fa-angle-down ms-1"></i>';
            } else {
                loadMoreContainer.classList.add('d-none');
            }

        } catch(err) {
            console.error(err);
            if (!append) {
                newsList.innerHTML = '<div class="col-12 text-center py-5 text-danger"><i class="fa-solid fa-triangle-exclamation fa-2x mb-3"></i><br>Failed to connect to the news server. Please try again later.</div>';
            }
        } finally {
            isFetching = false;
        }
    }

    // --- 6. EVENT LISTENERS ---
    
    // Load More Button Click
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            fetchNews(currentActiveQuery, currentPage + 1, true);
        });
    }

    // Dropdown change: IMMEDIATE fetch AND save to DB
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            const newCategory = e.target.value;
            searchInput.value = ''; 
            fetchNews(newCategory, 1, false); // Reset to page 1
            
            // Save preference to MongoDB
            if (userEmail) {
                fetch('/.netlify/functions/preferences', {
                    method: 'POST',
                    body: JSON.stringify({ email: userEmail, newsCategory: newCategory })
                }).catch(err => console.error("Could not save preference", err));
            }
        });
    }

    // Search bar typing (Debounced)
    let timeoutId;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const query = e.target.value.trim();
                fetchNews(query === '' ? categorySelect.value : query, 1, false);
            }, 500);
        });
    }

    // --- 7. INITIAL LOAD ---
    async function initMarketInsights() {
        // 1. Start fetching live stocks immediately
        fetchStocks(); 

        // 2. Figure out which news category to load
        let startingCategory = 'finance'; 
        if (userEmail) {
            try {
                const res = await fetch(`/.netlify/functions/preferences?email=${userEmail}`);
                if (res.ok) {
                    const prefData = await res.json();
                    startingCategory = prefData.newsCategory || 'finance';
                    if (categorySelect) categorySelect.value = startingCategory;
                }
            } catch (err) {}
        }
        
        // 3. Fetch initial news page
        fetchNews(startingCategory, 1, false);
    }

    initMarketInsights();
});