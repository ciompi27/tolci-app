/* Salvataggio in localStorage, esporta e importa JSON.
   Due chiavi:
   - tolc-i:giorni    stato dei giorni del piano: { "2026-10-05": { fatto, fattoIl, esercizi: { argomento: { fatti, sbagliati } } } }
   - tolc-i:sessioni  sessioni finite nei moduli: la scrive moduli/modulo.js (stessa chiave). */
"use strict";
const Store = (() => {
  const K_GIORNI = "tolc-i:giorni";
  const K_SESSIONI = "tolc-i:sessioni";
  const ISO = /^\d{4}-\d{2}-\d{2}$/;

  function leggi(k, vuoto) {
    try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? vuoto : v; } catch (e) { return vuoto; }
  }
  function scrivi(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
  }
  const isObj = v => v !== null && typeof v === "object" && !Array.isArray(v);
  const intero = v => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? Math.min(n, 9999) : 0; };

  function giorni() { const g = leggi(K_GIORNI, {}); return isObj(g) ? g : {}; }
  function sessioni() { const s = leggi(K_SESSIONI, []); return Array.isArray(s) ? s.filter(isObj) : []; }
  function giorno(data) { const d = giorni()[data]; return isObj(d) ? d : {}; }

  /* Legge sempre da localStorage prima di scrivere: un modulo può aver scritto nel frattempo. */
  function aggiornaGiorno(data, fn) {
    const g = giorni(), d = isObj(g[data]) ? g[data] : {};
    fn(d);
    g[data] = d;
    return scrivi(K_GIORNI, g);
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

  function esporta() {
    return { app: "TOLC-I", versione: 1, esportatoIl: new Date().toISOString(), giorni: giorni(), sessioni: sessioni() };
  }

  /* Controlla il file e restituisce i dati puliti, oppure un messaggio di errore. */
  function controlla(obj) {
    if (!isObj(obj) || obj.app !== "TOLC-I") return { errore: "Il file non è un backup di questa app." };
    const g = {}, s = [];
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
    return { giorni: g, sessioni: s };
  }
  function importa(pulito) {
    return scrivi(K_GIORNI, pulito.giorni) && scrivi(K_SESSIONI, pulito.sessioni);
  }

  return { giorni, sessioni, giorno, contatore, impostaContatore, impostaFatto, esporta, controlla, importa };
})();
