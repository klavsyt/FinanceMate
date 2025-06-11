// service-worker.js
const CACHE_NAME = "financemate-cache-v1";
const urlsToCache = [
  "/frontend/",
  "/frontend/index.html",
  "/frontend/style.css",
  "/frontend/main.js",
  "/frontend/api.js",
  "/frontend/budgets.js",
  "/frontend/categories.js",
  "/frontend/transactions.js",
  "/frontend/reports.js",
  "/frontend/currency.js",
  "/frontend/ui.js",
  "/frontend/tableUtils.js",
  "/frontend/favicon.ico",
  "/frontend/icon-192.png",
  "/frontend/icon-512.png",
  // Добавьте сюда пути к иконкам и другим статическим файлам
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
