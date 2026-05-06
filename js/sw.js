/**
 * FinPlan Service Worker (PWA) - Module 6
 * Enhanced caching strategy with offline support and network-first for APIs
 */

const CACHE_NAME = 'finplan-cache-v2';
const RUNTIME_CACHE = 'finplan-runtime-v1';

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
      .then(() => self.skipWaiting()) // Skip waiting, activate immediately
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
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Smart caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // ===== STRATEGY 1: Network-First for API calls =====
  if (url.pathname.startsWith('/news') || url.hostname.includes('newsapi')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (!response || response.status !== 200) {
            throw new Error('API request failed');
          }
          // Cache successful API responses
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Return cached API response if network fails
          return caches.match(request)
            .then(cached => cached || new Response(
              JSON.stringify({ error: 'Offline - no cached data' }), 
              { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'application/json' } }
            ));
        })
    );
  }
  // ===== STRATEGY 2: Cache-First for static assets =====
  else if (request.method === 'GET' && (
    url.pathname.endsWith('.css') || 
    url.pathname.endsWith('.js') || 
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
  // ===== STRATEGY 3: Cache with network fallback for HTML pages =====
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