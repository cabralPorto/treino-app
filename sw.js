const CACHE_NAME = "treino-app-v2";
const APP_SHELL = [
    "./",
    "./index.html",
    "./css/styles.css",
    "./js/app.js",
    "./manifest.webmanifest",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(nomes =>
            Promise.all(nomes.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    if(event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then(respostaCache => {
            if(respostaCache) return respostaCache;

            return fetch(event.request).then(respostaRede => {
                const copia = respostaRede.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, copia));
                return respostaRede;
            }).catch(() => {
                if(event.request.mode === "navigate") return caches.match("./index.html");
            });
        })
    );
});
