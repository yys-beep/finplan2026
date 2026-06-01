/**
 * FinPlan Service Worker (PWA) - Module 6
 * Enhanced caching strategy with offline support and real-time development sync
 */

// BUMPED TO V5 to force browsers to replace the old cache rules instantly
const CACHE_NAME = 'finplan-cache-v5';
const RUNTIME_CACHE = 'finplan-runtime-v5';

// Core files to cache on install (app shell)
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/dashboard.html',
  '/goals.html',
  '/calculator.html',
  '/profile.html',
  '/recommendations.html',
  '/security.html',
  '/market.html',
  '/css/bootstrap.min.css',
  '/css/style.css',
  '/js/auth.js',
  '/js/script.js',
  '/js/goals.js',
  '/js/calculator.js',
  '/js/profile.js',
  '/js/recommendations.js',
  '/js/security.js',
  '/js/market.js',
  '/manifest.json'
];

// Install Event - Cache app shell
self.addEventListener('install', event => {
  console.log('ServiceWorker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Activates immediately
  );
});

// Activate Event - Clean old caches
self.addEventListener('activate', event => {
  console.log('ServiceWorker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Takes control of pages immediately
  );
});

// Fetch Event - Smart caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // ===== RULE 0: NEVER CACHE MONGODB CLOUD APIS =====
  if (url.pathname.includes('/.netlify/functions/')) {
    return; // Bypasses service worker completely
  }

  // ===== STRATEGY 1: Network-First for External APIs =====
  if (url.pathname.startsWith('/news') || url.hostname.includes('newsapi')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (!response || response.status !== 200) {
            throw new Error('API request failed');
          }
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then(cached => cached || new Response(
              JSON.stringify({ error: 'Offline - no cached data' }), 
              { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'application/json' } }
            ));
        })
    );
  }
  
  // ===== STRATEGY 2A: NEW! Network-First for Code & Styling (.js, .css) =====
  // This lets any standard refresh load your updated code files instantly!
  else if (request.method === 'GET' && (url.pathname.endsWith('.css') || url.pathname.endsWith('.js'))) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request)) // Fallback to cache if offline
    );
  }

  // ===== STRATEGY 2B: Cache-First for static Images (.png, .jpg, .svg) =====
  else if (request.method === 'GET' && (
    url.pathname.endsWith('.png') || 
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg')
  )) {
    event.respondWith(
      caches.match(request)
        .then(cached => cached || fetch(request)
          .then(response => {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
            return response;
          })
        )
    );
  }
  
  // ===== STRATEGY 3: Network-First for HTML pages =====
  else if (request.method === 'GET' && url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
  
  // ===== DEFAULT: Cache-first, then network =====
  else {
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request))
    );
  }
});