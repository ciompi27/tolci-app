/* Collegamento dei moduli all'app TOLC-I: pulsante Indietro e salvataggio delle sessioni.
   Ogni modulo, a fine quiz, chiama TOLC.salvaSessione({...}).
   La chiave "tolc-i:sessioni" è la stessa letta da js/store.js. */
(function () {
  "use strict";
  var KEY = "tolc-i:sessioni";

  function oggiRoma() {
    var p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    var v = function (t) { return p.find(function (x) { return x.type === t; }).value; };
    return v("year") + "-" + v("month") + "-" + v("day");
  }

  function stato(testo) {
    var el = document.querySelector("[data-tolc-stato]");
    if (el) el.textContent = testo;
  }

  /* s = { modulo, esercizi, errori, giuste, nonDate, punti, argomenti: { nome: { esercizi, errori } } } */
  function salvaSessione(s) {
    if (!s || !s.esercizi) return false; // sessione chiusa senza risposte: niente da salvare
    try {
      var arr = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(arr)) arr = [];
      arr.push({
        modulo: s.modulo, data: oggiRoma(), ora: new Date().toISOString(),
        esercizi: s.esercizi, errori: s.errori, giuste: s.giuste, nonDate: s.nonDate, punti: s.punti,
        argomenti: s.argomenti || {}
      });
      localStorage.setItem(KEY, JSON.stringify(arr));
      stato("Sessione salvata: " + s.esercizi + (s.esercizi === 1 ? " esercizio, " : " esercizi, ") + s.errori + (s.errori === 1 ? " errore." : " errori."));
      return true;
    } catch (e) {
      stato("Sessione NON salvata: memoria del browser non disponibile.");
      return false;
    }
  }

  /* Indietro: se si arriva dall'app torna alla stessa schermata, altrimenti apre l'app. */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-tolc-back]");
    if (!a) return;
    var dallApp = false;
    try { dallApp = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (err) {}
    if (dallApp && history.length > 1) { e.preventDefault(); history.back(); }
  });

  /* ---------- diario degli errori (stessa chiave di js/store.js) ---------- */
  var KEY_ERRORI = "tolc-i:errori";

  /* Testo semplice e breve da HTML: frazioni "a/b", apici con ^, niente figure */
  function testoBreve(html, max) {
    var d = document.createElement("div");
    d.innerHTML = String(html || "")
      .replace(/<span class="fr"><span>([\s\S]*?)<\/span><span>([\s\S]*?)<\/span><\/span>/g, "$1/$2")
      .replace(/<sup>/g, "^").replace(/<svg[\s\S]*?<\/svg>/g, " ")
      .replace(/<br\s*\/?>|<\/li>|<\/p>|<\/div>|<\/q>|<span class="masse">/g, " ");
    var t = (d.textContent || "").replace(/\s+/g, " ").trim();
    return t.length > max ? t.slice(0, max - 1) + "…" : t;
  }
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

  /* Argomento dell'app per un sotto-tema del modulo (tabella "argomenti" in data/plan.json) */
  function mappaArgomenti(modulo) {
    return fetch("../../data/plan.json").then(function (r) { return r.json(); })
      .then(function (p) { var m = p.moduli && p.moduli[modulo]; return (m && m.argomenti) || {}; })
      .catch(function () { return {}; });
  }

  /* lista: [{ argomento (sotto-tema), testo, corretta, chiave }]. Ogni errore ha una chiave: due volte la stessa domanda nello stesso giorno non si duplica. */
  function aggiungiErrori(modulo, lista) {
    return mappaArgomenti(modulo).then(function (mappa) {
      var oggi = oggiRoma(), arr, nuovi = 0;
      try { arr = JSON.parse(localStorage.getItem(KEY_ERRORI) || "[]"); if (!Array.isArray(arr)) arr = []; } catch (e) { return -1; }
      var chiavi = {};
      arr.forEach(function (x) { if (x && x.chiave) chiavi[x.chiave] = true; });
      lista.forEach(function (x) {
        var chiave = modulo + "|" + oggi + "|" + hash(String(x.chiave));
        if (chiavi[chiave]) return;
        chiavi[chiave] = true; nuovi++;
        var nota = testoBreve(x.testo, 200) + " → giusta: " + testoBreve(x.corretta, 80);
        arr.push({ id: "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), data: oggi,
          argomento: mappa[x.argomento] || mappa["*"] || x.argomento, dove: "modulo", tipo: "altro", nota: nota.slice(0, 300),
          stato: "darifare", ricadute: 0, chiave: chiave, modulo: modulo, aggiornato: new Date().toISOString() });
      });
      try { localStorage.setItem(KEY_ERRORI, JSON.stringify(arr)); } catch (e) { return -1; }
      return nuovi;
    });
  }

  /* Pulsante "Aggiungi gli sbagliati al diario" in fondo al riepilogo di un modulo */
  function pulsanteDiario(contenitore, modulo, lista) {
    if (!contenitore || !lista || !lista.length) return;
    var box = document.createElement("div");
    box.className = "tolc-diario";
    box.innerHTML = '<button type="button">Aggiungi gli sbagliati al diario (' + lista.length + ')</button><span role="status"></span>';
    var b = box.querySelector("button"), s = box.querySelector("span");
    b.addEventListener("click", function () {
      b.disabled = true;
      aggiungiErrori(modulo, lista).then(function (n) {
        if (n < 0) { s.textContent = "Non salvato: memoria del browser non disponibile."; b.disabled = false; return; }
        s.textContent = n ? "✓ Aggiunti al diario: " + n + (n === 1 ? " errore." : " errori.") : "Erano già nel diario.";
      });
    });
    contenitore.appendChild(box);
  }

  window.TOLC = { salvaSessione: salvaSessione, pulsanteDiario: pulsanteDiario };
})();
