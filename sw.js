/* Service worker: tiene in cache tutti i file dell'app, moduli compresi, per l'uso offline.
   Strategia: prima la rete (così le modifiche a plan.json si vedono subito), con la cache come riserva
   se la rete manca o non risponde entro 3 secondi.
   Quando si aggiunge un file all'app va aggiunto a FILE e va cambiato VERSIONE. */
const VERSIONE = "tolc-i-v1";
const FILE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/app.css",
  "./js/store.js",
  "./js/app.js",
  "./data/plan.json",
  "./assets/fonts/atkinson-hyperlegible.css",
  "./assets/fonts/atkinson-hyperlegible-400.woff2",
  "./assets/fonts/atkinson-hyperlegible-700.woff2",
  "./assets/fonts/atkinson-hyperlegible-400-italic.woff2",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./moduli/modulo.js",
  "./moduli/modulo.css",
  "./moduli/logica/index.html",
  "./moduli/combinatoria/index.html"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(FILE.map(f => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSIONE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function dallaCache(req) {
  return caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === "navigate" ? caches.match("./index.html") : undefined));
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(new Promise(resolve => {
    let fatto = false;
    const cache = () => dallaCache(req).then(r => { if (r && !fatto) { fatto = true; resolve(r); } return r; });
    const timer = setTimeout(cache, 3000);
    fetch(req).then(res => {
      if (res.ok) { const copia = res.clone(); caches.open(VERSIONE).then(c => c.put(req.url.split(/[?#]/)[0], copia)); }
      clearTimeout(timer);
      if (!fatto) { fatto = true; resolve(res); }
    }).catch(() => {
      clearTimeout(timer);
      cache().then(r => { if (!fatto) { fatto = true; resolve(r || Response.error()); } });
    });
  }));
});
