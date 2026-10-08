/* Service worker: tiene in cache tutti i file dell'app, moduli compresi, per l'uso offline.
   Strategia: prima la rete (così le modifiche a plan.json si vedono subito), con la cache come riserva
   se la rete manca o non risponde entro 3 secondi.
   Quando si aggiunge un file all'app va aggiunto a FILE e va cambiato VERSIONE. */
const VERSIONE = "tolc-i-v3";
const FILE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/app.css",
  "./js/store.js",
  "./js/teoria.js",
  "./js/app.js",
  "./data/plan.json",
  "./data/theory/indice.json",
  "./data/theory/1-matematica.html",
  "./data/theory/2-logica.html",
  "./data/theory/3-fisica.html",
  "./data/theory/4-chimica.html",
  "./data/theory/6-comprensione-verbale.html",
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
  "./moduli/combinatoria/index.html",
  "./moduli/mole/index.html",
  "./moduli/circuiti/index.html",
  "./assets/figure/1-2-1a.png",
  "./assets/figure/1-2-1b.png",
  "./assets/figure/1-2-1c.png",
  "./assets/figure/1-4-1a.png",
  "./assets/figure/1-4-1b.png",
  "./assets/figure/1-4-1c.png",
  "./assets/figure/1-4-1d.png",
  "./assets/figure/1-4-1e.png",
  "./assets/figure/1-5-1a.png",
  "./assets/figure/1-5-1b.png",
  "./assets/figure/1-5-1c.png",
  "./assets/figure/1-5-1d.png",
  "./assets/figure/1-7-1a.png",
  "./assets/figure/1-7-1b.png",
  "./assets/figure/1-7-1c.png",
  "./assets/figure/1-7-1d.png",
  "./assets/figure/1-7-1e.png",
  "./assets/figure/1-7-1f.png",
  "./assets/figure/1-7-1g.png",
  "./assets/figure/1-7-1h.png",
  "./assets/figure/1-7-1i.png",
  "./assets/figure/1-8-1a.png",
  "./assets/figure/1-8-1b.png",
  "./assets/figure/1-8-2a.png",
  "./assets/figure/1-8-3a.png",
  "./assets/figure/1-8-3b.png",
  "./assets/figure/1-8-3c.png",
  "./assets/figure/1-8-4a.png",
  "./assets/figure/1-8-4b.png",
  "./assets/figure/2-2-1a.png",
  "./assets/figure/2-2-1b.png",
  "./assets/figure/2-4-1a.png",
  "./assets/figure/2-4-1b.png",
  "./assets/figure/2-4-1c.png",
  "./assets/figure/3-2-1a.png",
  "./assets/figure/3-2-1b.png",
  "./assets/figure/3-2-1c.png",
  "./assets/figure/3-2-2a.png",
  "./assets/figure/3-2-2b.png",
  "./assets/figure/3-2-2c.png",
  "./assets/figure/3-6-1a.png",
  "./assets/figure/3-6-1b.png",
  "./assets/figure/3-7-1a.png",
  "./assets/figure/3-7-1b.png",
  "./assets/figure/3-8-1a.png",
  "./assets/figure/3-8-1b.png",
  "./assets/figure/3-8-1c.png",
  "./assets/figure/3-9-1a.svg",
  "./assets/figure/3-9-2a.svg",
  "./assets/figure/4-1-1a.png",
  "./assets/figure/4-1-1b.png",
  "./assets/figure/4-2-1a.png",
  "./assets/figure/4-2-1b.png",
  "./assets/figure/4-3-1a.png",
  "./assets/figure/4-3-1b.png",
  "./assets/figure/4-3-1c.png",
  "./assets/figure/4-3-1d.png",
  "./assets/figure/4-6-1a.png",
  "./assets/figure/4-6-1b.png",
  "./assets/figure/4-6-2a.png",
  "./assets/figure/4-6-2b.png",
  "./assets/figure/4-8-1a.png",
  "./assets/figure/4-9-1a.png",
  "./assets/figure/4-9-1b.png"
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
