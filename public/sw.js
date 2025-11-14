// שם ייחודי לזיכרון המטמון (שנה אותו אם תעשה שינויים גדולים בקבצים)
const CACHE_NAME = 'alofy-cache-v1';

// רשימת הקבצים המרכזיים שצריך לשמור
const urlsToCache = [
    '/',
    '/index.html',
    '/index.css',
    '/java.js',
    '/database.js',
    '/realdimond.png'
    // (אל תוסיף לכאן את קבצי Firebase, הם נטענים חיצונית)
];

// 1. התקנה (Install) - שמירת הקבצים במטמון
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

// 2. הפעלה (Fetch) - הגשת הקבצים מהמטמון
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            // אם הקובץ נמצא במטמון, הגש אותו
            if (response) {
                return response;
            }
            // אם לא, נסה להביא אותו מהרשת
            return fetch(event.request);
        })
    );
});