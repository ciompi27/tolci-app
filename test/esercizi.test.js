/* Prova automatica dei generatori di esercizi (moduli mole e circuiti).
   Uso: node test/esercizi.test.js
   Carica il motore di ogni modulo (lo <script id="core">, che non usa la pagina) e per ogni tipo genera 200 esercizi.
   Controlla: 5 risposte, una sola giusta, nessun doppione, niente NaN/undefined, valori positivi,
   e ricalcola la soluzione con un codice indipendente da quello del modulo. */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");

const N = 200;
let errori = 0;
function errore(msg) { errori++; if (errori <= 40) console.log("  ERRORE: " + msg); }

/* generatore casuale ripetibile */
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function carica(modulo, esporta) {
  const html = fs.readFileSync(path.join(__dirname, "..", "moduli", modulo, "index.html"), "utf8");
  const core = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
  const ctx = vm.createContext({ console });
  vm.runInContext(core + `\n;globalThis.__T = { genera, TIPI, imposta: (r) => { RNG = r; STRICT = true; }, ${esporta} };`, ctx);
  return ctx.__T;
}

/* numero mostrato nelle risposte ("1 234,5 g") -> 1234.5 */
const leggi = t => parseFloat(t.replace(/<[^>]+>/g, "").replace(/[\s ]/g, "").replace(",", ".").replace("−", "-"));
const vicino = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));

function controlliComuni(q, etichetta) {
  const tutto = [q.testo, q.fig || "", ...q.passi, ...q.opzioni.map(o => o.t + " " + o.why)].join(" ");
  if (/NaN|undefined|Infinity|\?\s*(g|mol|A|V|W|Ω)/.test(tutto)) errore(`${etichetta}: valore non valido nel testo: ${tutto.slice(0, 160)}`);
  if (q.opzioni.length !== 5) errore(`${etichetta}: ${q.opzioni.length} risposte invece di 5`);
  const giuste = q.opzioni.filter(o => o.ok);
  if (giuste.length !== 1) errore(`${etichetta}: ${giuste.length} risposte giuste`);
  const testi = q.opzioni.map(o => o.t);
  if (new Set(testi).size !== testi.length) errore(`${etichetta}: risposte ripetute: ${testi.join(" | ")}`);
  for (const o of q.opzioni) if (!o.ok && !o.why) errore(`${etichetta}: risposta sbagliata senza spiegazione`);
  return giuste[0];
}
function controlliNumerici(q, etichetta, atteso) {
  const g = controlliComuni(q, etichetta);
  if (!g) return;
  for (const o of q.opzioni) {
    const v = leggi(o.t);
    if (!Number.isFinite(v) || v <= 0) errore(`${etichetta}: valore non positivo o non numerico: ${o.t}`);
  }
  const gv = leggi(g.t);
  if (!vicino(gv, Math.round(atteso * 100) / 100) && !vicino(gv, Math.round(atteso * 10) / 10)) errore(`${etichetta}: giusta ${g.t}, ricalcolata ${atteso}`);
  for (const o of q.opzioni) if (!o.ok && vicino(leggi(o.t), gv)) errore(`${etichetta}: un distrattore coincide con la soluzione (${o.t})`);
}

/* ---------- controlli indipendenti: chimica ---------- */
const MASSE = { H: 1, C: 12, N: 14, O: 16, Na: 23, Mg: 24, Al: 27, S: 32, Cl: 35.5, K: 39, Ca: 40, Fe: 56 };
/* conteggio atomi scritto in modo diverso dal modulo: si espandono le parentesi come testo */
function atomi(f) {
  let s = f;
  while (/\(([^()]*)\)(\d*)/.test(s)) s = s.replace(/\(([^()]*)\)(\d*)/, (_, g, k) => g.repeat(+k || 1));
  const c = {};
  for (const [, e, n] of s.matchAll(/([A-Z][a-z]?)(\d*)/g)) c[e] = (c[e] || 0) + (+n || 1);
  return c;
}
const M = f => Object.entries(atomi(f)).reduce((s, [e, n]) => s + n * MASSE[e], 0);
function equilibrio(testo, coeff) {
  const [a, b] = testo.split("->").map(x => x.split("+").map(y => y.trim()));
  const sp = [...a, ...b], tot = {};
  sp.forEach((f, j) => { for (const [e, n] of Object.entries(atomi(f))) tot[e] = (tot[e] || 0) + (j < a.length ? 1 : -1) * n * coeff[j]; });
  return Object.values(tot).every(x => x === 0);
}

function provaMole() {
  const T = carica("mole", "CONTROLLO, VALIDE, REAZIONI, massaMolare");
  T.imposta(mulberry32(12345));
  console.log(`Modulo mole: reazioni valide ${T.VALIDE.length} su ${T.REAZIONI.length}; escluse: ${T.CONTROLLO.errori.length ? T.CONTROLLO.errori.join("; ") : "nessuna"}`);
  if (T.CONTROLLO.errori.length) errore("reazioni non valide: " + T.CONTROLLO.errori.join("; "));
  for (const R of T.VALIDE) {
    if (!equilibrio(R.testo, R.coeff)) errore(`reazione non bilanciata dai coefficienti calcolati: ${R.testo} ${R.coeff}`);
    if (R.coeff.reduce((a, b) => { while (b) [a, b] = [b, a % b]; return a; }) !== 1) errore(`coefficienti non minimi: ${R.testo}`);
  }
  for (const tipo of Object.keys(T.TIPI)) {
    const conteggio = {};
    for (let i = 0; i < N; i++) {
      const q = T.genera(tipo), et = `mole/${tipo}#${i}`, m = q.meta;
      if (tipo === "massa") controlliNumerici(q, et, M(m.f));
      else if (tipo === "conv") {
        if (!vicino(m.m, m.n * M(m.f))) errore(`${et}: massa e moli non coerenti`);
        controlliNumerici(q, et, m.verso === "mol" ? m.m / M(m.f) : m.n * M(m.f));
      } else if (tipo === "stech") {
        const atteso = m.mA / M(m.A) * m.cB / m.cA * M(m.B);
        controlliNumerici(q, et, atteso);
        if (!vicino(m.mB, atteso)) errore(`${et}: massa calcolata ${m.mB}, attesa ${atteso}`);
      } else if (tipo === "bil") {
        const g = controlliComuni(q, et);
        const bilanciate = q.opzioni.filter(o => equilibrio(m.testo, o.k));
        if (bilanciate.length !== 1 || !bilanciate[0].ok) errore(`${et}: le risposte bilanciate sono ${bilanciate.length}`);
        if (g && g.k.join() !== m.coeff.join()) errore(`${et}: la giusta non sono i coefficienti calcolati`);
      }
      conteggio[q.testo] = 1;
    }
    console.log(`  ${tipo}: ${N} esercizi, ${Object.keys(conteggio).length} testi diversi`);
  }
}

/* ---------- controlli indipendenti: circuiti ---------- */
function provaCircuiti() {
  const T = carica("circuiti", "risolvi");
  T.imposta(mulberry32(67890));
  console.log("Modulo circuiti:");
  const par = Rs => 1 / Rs.reduce((s, r) => s + 1 / r, 0);
  for (const tipo of Object.keys(T.TIPI)) {
    const conteggio = {};
    for (let i = 0; i < N; i++) {
      const q = T.genera(tipo), et = `circuiti/${tipo}#${i}`, m = q.meta;
      let atteso;
      if (tipo === "ohm") {
        if (!vicino(m.V, m.R * m.I)) errore(`${et}: V, R, I non rispettano V = R·I`);
        const si = m.caso === "I" ? m.V / m.R : m.caso === "V" ? m.R * m.I : m.V / m.I;
        atteso = si * { A: 1, mA: 1000, V: 1, "Ω": 1, "kΩ": 0.001 }[m.unita];
      } else if (tipo === "serie") {
        const Req = m.Rs.reduce((a, b) => a + b, 0); atteso = m.chiede === "R" ? Req : m.V / Req;
      } else if (tipo === "parallelo") {
        atteso = m.chiede === "R" ? par(m.Rs) : m.V / par(m.Rs);
      } else if (tipo === "misto") {
        const Req = m.Rs[0] + par(m.Rs.slice(1)); atteso = m.chiede === "R" ? Req : m.V / Req;
      } else if (tipo === "potenza") {
        atteso = m.caso === "VI" ? m.V * m.I : m.caso === "RI" ? m.R * m.I * m.I : m.V * m.V / m.R;
      } else if (tipo === "partitore") {
        atteso = m.V * (m.k ? m.R2 : m.R1) / (m.R1 + m.R2);
      }
      controlliNumerici(q, et, atteso);
      conteggio[q.testo] = 1;
    }
    console.log(`  ${tipo}: ${N} esercizi, ${Object.keys(conteggio).length} testi diversi`);
  }
  /* il calcolo del widget: serie, parallelo e misto contro formule scritte qui */
  const casi = [["s2", [6, 6], 12, 12, 1], ["p2", [6, 6], 12, 3, 4], ["s3", [2, 4, 6], 24, 12, 2], ["p3", [6, 6, 6], 12, 2, 6], ["m3", [4, 6, 12], 12, 8, 1.5]];
  for (const [conf, R, V, Req, I] of casi) {
    const s = T.risolvi(conf, R, V);
    if (!vicino(s.Req, Req) || !vicino(s.I, I)) errore(`widget ${conf} ${R}: R = ${s.Req}, I = ${s.I} (attesi ${Req}, ${I})`);
    const somma = s.el.reduce((a, e) => a + (conf[0] === "s" ? e.V : 0), 0);
    if (conf[0] === "s" && !vicino(somma, V)) errore(`widget ${conf}: le tensioni non danno V`);
  }
  console.log("  widget: 5 circuiti di prova controllati");
}

provaMole();
provaCircuiti();
console.log(errori ? `\n${errori} ERRORI` : "\nTutto a posto: nessun errore.");
process.exit(errori ? 1 : 0);
