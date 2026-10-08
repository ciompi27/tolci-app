/* Salvataggio in localStorage, esporta, importa e unisce i backup JSON.
   Chiavi:
   - tolc-i:giorni       stato dei giorni del piano: { "2026-10-05": { fatto, fattoIl, esercizi: { argomento: { fatti, sbagliati } } } }
   - tolc-i:sessioni     sessioni finite nei moduli: la scrive moduli/modulo.js (stessa chiave).
   - tolc-i:letti        paragrafi di teoria letti: { "4.4": "2026-10-09" }.
   - tolc-i:errori       diario degli errori: [{ id, data, argomento, dove, tipo, nota, stato, rifattoIl, ricadute, chiave, modulo, aggiornato }].
                         Anche moduli/modulo.js aggiunge errori qui (stessa chiave).
   - tolc-i:simulazioni  [{ id, nome, creata, sezioni: { mat: { giuste, sbagliate, nonDate, data, aggiornato } }, aggiornato }].
   - tolc-i:timer        timer delle simulazioni in corso (non va nel backup).
   - tolc-i:backup       data dell'ultimo backup fatto (non va nel backup). */
"use strict";
const Store = (() => {
  const K = { giorni: "tolc-i:giorni", sessioni: "tolc-i:sessioni", letti: "tolc-i:letti", errori: "tolc-i:errori",
    simulazioni: "tolc-i:simulazioni", timer: "tolc-i:timer", backup: "tolc-i:backup" };
  const PAR = /^\d+\.\d+$/;
  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  const DOVE = ["tf", "alfa", "sim", "modulo"];
  const TIPI = ["formula", "calcolo", "regola", "distrazione", "tempo", "altro"];
  const SEZIONI = { mat: 20, log: 10, sci: 10, ver: 10 };   // quesiti per sezione

  function leggi(k, vuoto) {
    try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? vuoto : v; } catch (e) { return vuoto; }
  }
  function scrivi(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
  }
  const isObj = v => v !== null && typeof v === "object" && !Array.isArray(v);
  const intero = v => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? Math.min(n, 9999) : 0; };
  const testo = (v, max) => typeof v === "string" ? v.slice(0, max) : "";
  const adesso = () => new Date().toISOString();
  const nuovoId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function giorni() { const g = leggi(K.giorni, {}); return isObj(g) ? g : {}; }
  function sessioni() { const s = leggi(K.sessioni, []); return Array.isArray(s) ? s.filter(isObj) : []; }
  function giorno(data) { const d = giorni()[data]; return isObj(d) ? d : {}; }
  function letti() { const l = leggi(K.letti, {}); return isObj(l) ? l : {}; }
  const letto = num => !!letti()[num];
  function errori() { const e = leggi(K.errori, []); return Array.isArray(e) ? e.filter(x => isObj(x) && x.id) : []; }
  function simulazioni() { const s = leggi(K.simulazioni, []); return Array.isArray(s) ? s.filter(x => isObj(x) && x.id) : []; }

  /* Legge sempre da localStorage prima di scrivere: un modulo può aver scritto nel frattempo. */
  function aggiornaGiorno(data, fn) {
    const g = giorni(), d = isObj(g[data]) ? g[data] : {};
    fn(d);
    g[data] = d;
    return scrivi(K.giorni, g);
  }

  /* Contatore esercizi di The Faculty: gli sbagliati non superano i fatti. */
  function contatore(data, arg) {
    const e = giorno(data).esercizi, c = isObj(e) && isObj(e[arg]) ? e[arg] : {};
    return { fatti: intero(c.fatti), sbagliati: intero(c.sbagliati) };
  }
  function impostaContatore(data, arg, chiave, valore) {
    let tagliato = false, out = null;
    const ok = aggiornaGiorno(data, d => {
      if (!isObj(d.esercizi)) d.esercizi = {};
      const c = { fatti: intero((d.esercizi[arg] || {}).fatti), sbagliati: intero((d.esercizi[arg] || {}).sbagliati) };
      c[chiave] = intero(valore);
      if (c.sbagliati > c.fatti) { c.sbagliati = c.fatti; tagliato = true; }
      d.esercizi[arg] = c;
      out = c;
    });
    return { ok, tagliato, valore: out };
  }

  function impostaFatto(data, fatto, oggi) {
    return aggiornaGiorno(data, d => {
      if (fatto) { d.fatto = true; d.fattoIl = oggi; } else { delete d.fatto; delete d.fattoIl; }
    });
  }

  /* Segna (o toglie) come letti uno o più paragrafi. */
  function impostaLetti(nums, on, oggi) {
    const l = letti();
    for (const n of nums) { if (on) l[n] = oggi; else delete l[n]; }
    return scrivi(K.letti, l);
  }

  /* ---------- diario degli errori ---------- */
  function salvaErrore(e) {
    const tutti = errori(), i = tutti.findIndex(x => x.id === e.id);
    const pulito = pulisciErrore({ ...e, id: e.id || nuovoId("e"), aggiornato: adesso() });
    if (!pulito) return false;
    if (i >= 0) tutti[i] = pulito; else tutti.push(pulito);
    return scrivi(K.errori, tutti);
  }
  function eliminaErrore(id) { return scrivi(K.errori, errori().filter(x => x.id !== id)); }
  /* "Rifatto" (con la data) e "Sbagliato di nuovo" (torna da rifare e conta una ricaduta) */
  function segnaErrore(id, rifatto, oggi) {
    const tutti = errori(), e = tutti.find(x => x.id === id);
    if (!e) return false;
    if (rifatto) { e.stato = "rifatto"; e.rifattoIl = oggi; }
    else { e.stato = "darifare"; delete e.rifattoIl; e.ricadute = intero(e.ricadute) + 1; }
    e.aggiornato = adesso();
    return scrivi(K.errori, tutti);
  }

  /* ---------- simulazioni ---------- */
  function nuovaSimulazione(oggi) {
    const tutte = simulazioni(), usati = new Set(tutte.map(s => s.nome));
    let n = 0, nome;
    do { nome = String.fromCharCode(65 + (n % 26)) + (n >= 26 ? Math.floor(n / 26) : ""); n++; } while (usati.has(nome));
    const s = { id: nuovoId("s"), nome, creata: oggi, sezioni: {}, aggiornato: adesso() };
    tutte.push(s);
    return scrivi(K.simulazioni, tutte) ? s : null;
  }
  function salvaSezione(simId, sez, r, oggi) {
    const tutte = simulazioni(), s = tutte.find(x => x.id === simId);
    if (!s || !(sez in SEZIONI)) return false;
    const n = SEZIONI[sez], g = intero(r.giuste), b = intero(r.sbagliate);
    if (g + b > n) return false;
    s.sezioni = isObj(s.sezioni) ? s.sezioni : {};
    s.sezioni[sez] = { giuste: g, sbagliate: b, nonDate: n - g - b, data: oggi, aggiornato: adesso() };
    s.aggiornato = adesso();
    return scrivi(K.simulazioni, tutte);
  }
  const timer = () => { const t = leggi(K.timer, null); return isObj(t) ? t : null; };
  function salvaTimer(t) {
    if (t) return scrivi(K.timer, t);
    try { localStorage.removeItem(K.timer); return true; } catch (e) { return false; }
  }

  /* ---------- backup ---------- */
  const ultimoBackup = () => { const d = leggi(K.backup, null); return ISO.test(d) ? d : null; };
  const segnaBackup = oggi => scrivi(K.backup, oggi);
  const haDati = () => Object.keys(giorni()).length > 0 || sessioni().length > 0 || errori().length > 0 || simulazioni().length > 0 || Object.keys(letti()).length > 0;

  function esporta() {
    return { app: "TOLC-I", versione: 3, esportatoIl: adesso(), giorni: giorni(), sessioni: sessioni(), letti: letti(), errori: errori(), simulazioni: simulazioni() };
  }

  function pulisciErrore(x) {
    if (!isObj(x) || typeof x.id !== "string" || !ISO.test(x.data)) return null;
    const e = { id: testo(x.id, 40), data: x.data, argomento: testo(x.argomento, 80) || "altro", dove: DOVE.includes(x.dove) ? x.dove : "tf",
      tipo: TIPI.includes(x.tipo) ? x.tipo : "altro", nota: testo(x.nota, 300), stato: x.stato === "rifatto" ? "rifatto" : "darifare",
      ricadute: intero(x.ricadute), aggiornato: testo(x.aggiornato, 30) };
    if (e.stato === "rifatto" && ISO.test(x.rifattoIl)) e.rifattoIl = x.rifattoIl;
    if (typeof x.chiave === "string") e.chiave = testo(x.chiave, 200);
    if (typeof x.modulo === "string") e.modulo = testo(x.modulo, 30);
    return e;
  }
  function pulisciSimulazione(x) {
    if (!isObj(x) || typeof x.id !== "string") return null;
    const s = { id: testo(x.id, 40), nome: testo(x.nome, 20) || "?", creata: ISO.test(x.creata) ? x.creata : "", sezioni: {}, aggiornato: testo(x.aggiornato, 30) };
    if (isObj(x.sezioni)) for (const [k, r] of Object.entries(x.sezioni)) {
      if (!(k in SEZIONI) || !isObj(r)) continue;
      const g = intero(r.giuste), b = intero(r.sbagliate);
      if (g + b > SEZIONI[k]) continue;
      s.sezioni[k] = { giuste: g, sbagliate: b, nonDate: SEZIONI[k] - g - b, data: ISO.test(r.data) ? r.data : "", aggiornato: testo(r.aggiornato, 30) };
    }
    return s;
  }

  /* Controlla il file e restituisce i dati puliti, oppure un messaggio di errore.
     Vanno bene anche i backup delle fasi 1 (versione 1), 2 e 3 (versione 2): mancano solo i campi nuovi. */
  function controlla(obj) {
    if (!isObj(obj) || obj.app !== "TOLC-I") return { errore: "Il file non è un backup di questa app." };
    const g = {}, s = [], l = {}, e = [], sim = [];
    if (isObj(obj.giorni)) for (const [data, d] of Object.entries(obj.giorni)) {
      if (!ISO.test(data) || !isObj(d)) continue;
      const n = {};
      if (d.fatto === true) { n.fatto = true; if (ISO.test(d.fattoIl)) n.fattoIl = d.fattoIl; }
      if (isObj(d.esercizi)) {
        n.esercizi = {};
        for (const [a, c] of Object.entries(d.esercizi)) if (isObj(c)) {
          const f = intero(c.fatti);
          n.esercizi[a] = { fatti: f, sbagliati: Math.min(intero(c.sbagliati), f) };
        }
      }
      g[data] = n;
    }
    if (Array.isArray(obj.sessioni)) for (const x of obj.sessioni) {
      if (isObj(x) && ISO.test(x.data) && typeof x.modulo === "string") s.push(x);
    }
    if (isObj(obj.letti)) for (const [n, d] of Object.entries(obj.letti)) {
      if (PAR.test(n) && ISO.test(d)) l[n] = d;
    }
    if (Array.isArray(obj.errori)) for (const x of obj.errori) { const p = pulisciErrore(x); if (p) e.push(p); }
    if (Array.isArray(obj.simulazioni)) for (const x of obj.simulazioni) { const p = pulisciSimulazione(x); if (p) sim.push(p); }
    return { giorni: g, sessioni: s, letti: l, errori: e, simulazioni: sim };
  }

  /* Cosa contiene un backup già controllato */
  function anteprima(p) {
    return { giorniFatti: Object.values(p.giorni).filter(d => d.fatto).length, sessioni: p.sessioni.length,
      errori: p.errori.length, simulazioni: p.simulazioni.length, letti: Object.keys(p.letti).length };
  }

  /* Unisce due insiemi di dati senza duplicare. Regole:
     giorni: "fatto" se lo è in uno dei due; nei contatori di uno stesso giorno e argomento vale il numero più alto
             (lo stesso backup unito due volte non raddoppia niente);
     sessioni: una sola per modulo + ora + data;  letti: unione, con la data più vecchia;
     errori e simulazioni: uno per id (e per chiave, per gli errori dei moduli); se c'è in tutti e due vale il più aggiornato. */
  function unisci(a, b) {
    const g = JSON.parse(JSON.stringify(a.giorni));
    for (const [data, d] of Object.entries(b.giorni)) {
      const x = g[data] || (g[data] = {});
      if (d.fatto) { x.fatto = true; if (d.fattoIl && (!x.fattoIl || d.fattoIl < x.fattoIl)) x.fattoIl = d.fattoIl; }
      if (d.esercizi) {
        x.esercizi = x.esercizi || {};
        for (const [arg, c] of Object.entries(d.esercizi)) {
          const v = x.esercizi[arg] || { fatti: 0, sbagliati: 0 };
          const f = Math.max(v.fatti, c.fatti);
          x.esercizi[arg] = { fatti: f, sbagliati: Math.min(f, Math.max(v.sbagliati, c.sbagliati)) };
        }
      }
    }
    const chiaveS = x => `${x.modulo}|${x.ora || ""}|${x.data}`;
    const visteS = new Set(a.sessioni.map(chiaveS)), s = a.sessioni.slice();
    for (const x of b.sessioni) if (!visteS.has(chiaveS(x))) { visteS.add(chiaveS(x)); s.push(x); }
    const l = { ...a.letti };
    for (const [n, d] of Object.entries(b.letti)) if (!l[n] || d < l[n]) l[n] = d;
    const e = a.errori.map(x => ({ ...x }));
    for (const x of b.errori) {
      const i = e.findIndex(y => y.id === x.id || (x.chiave && y.chiave === x.chiave));
      if (i < 0) e.push({ ...x });
      else if ((x.aggiornato || "") > (e[i].aggiornato || "")) e[i] = { ...x };
    }
    const sim = a.simulazioni.map(x => JSON.parse(JSON.stringify(x)));
    for (const x of b.simulazioni) {
      const y = sim.find(z => z.id === x.id);
      if (!y) { sim.push(JSON.parse(JSON.stringify(x))); continue; }
      for (const [k, r] of Object.entries(x.sezioni)) if (!y.sezioni[k] || (r.aggiornato || "") > (y.sezioni[k].aggiornato || "")) y.sezioni[k] = { ...r };
      if ((x.aggiornato || "") > (y.aggiornato || "")) { y.nome = x.nome; y.aggiornato = x.aggiornato; }
    }
    return { giorni: g, sessioni: s, letti: l, errori: e, simulazioni: sim };
  }

  /* modo: "sostituisci" (tutto come nel file) oppure "unisci" (con i dati di questo dispositivo) */
  function importa(pulito, modo) {
    const d = modo === "unisci" ? unisci({ giorni: giorni(), sessioni: sessioni(), letti: letti(), errori: errori(), simulazioni: simulazioni() }, pulito) : pulito;
    return scrivi(K.giorni, d.giorni) && scrivi(K.sessioni, d.sessioni) && scrivi(K.letti, d.letti) && scrivi(K.errori, d.errori) && scrivi(K.simulazioni, d.simulazioni);
  }

  return { SEZIONI, DOVE, TIPI, giorni, sessioni, giorno, contatore, impostaContatore, impostaFatto, letto, impostaLetti,
    errori, salvaErrore, eliminaErrore, segnaErrore,
    simulazioni, nuovaSimulazione, salvaSezione, timer, salvaTimer,
    ultimoBackup, segnaBackup, haDati, esporta, controlla, anteprima, unisci, importa };
})();
