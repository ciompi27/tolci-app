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

  window.TOLC = { salvaSessione: salvaSessione };
})();
