/* App TOLC-I: schermate Oggi e Piano, navigazione, backup, aggiornamenti.
   Teoria in js/teoria.js, Errori in js/diario.js, Simulazioni in js/simulazioni.js. */
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

let PLAN = null;
let giornoAperto = null;   // giorno aperto nella schermata Piano
let daImportare = null;    // backup letto, in attesa della scelta "unisci" / "sostituisci"
let msgBackup = "";

/* ---------- date ---------- */
/* Data di oggi nel fuso Europe/Rome, come "AAAA-MM-GG".
   Per i controlli manuali si può forzare con ?data=AAAA-MM-GG nell'indirizzo. */
function oggiISO() {
  const forzata = new URLSearchParams(location.search).get("data");
  if (forzata && /^\d{4}-\d{2}-\d{2}$/.test(forzata)) return forzata;
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const v = t => p.find(x => x.type === t).value;
  return `${v("year")}-${v("month")}-${v("day")}`;
}
const utc = iso => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d, 12); };
const giorniTra = (da, a) => Math.round((utc(a) - utc(da)) / 864e5);
const fmt = (iso, opz) => new Intl.DateTimeFormat("it-IT", { timeZone: "UTC", ...opz }).format(new Date(utc(iso)));
const dataLunga = iso => fmt(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const dataMedia = iso => fmt(iso, { weekday: "long", day: "numeric", month: "long" });
const GG = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"], MM = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
const dataBreve = iso => { const d = new Date(utc(iso)); return `${GG[d.getUTCDay()]} ${d.getUTCDate()} ${MM[d.getUTCMonth()]}`; };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const pl = (n, uno, molti) => `${n} ${n === 1 ? uno : molti}`;

/* ---------- stato dei giorni ---------- */
const ETICHETTA = { fatto: "fatto", arretrato: "arretrato", dafare: "da fare", pausa: "pausa", esame: "esame" };
function stato(g, oggi) {
  if (g.tipo === "pausa") return "pausa";
  if (g.tipo === "esame") return "esame";
  if (Store.giorno(g.data).fatto) return "fatto";
  return g.data < oggi ? "arretrato" : "dafare";
}
const badge = st => `<span class="badge b-${st}">${ETICHETTA[st]}</span>`;
const arretrati = oggi => PLAN.giorni.filter(g => stato(g, oggi) === "arretrato");

/* ---------- pezzi comuni a Oggi e Piano ---------- */
function linkModulo(id) {
  const m = PLAN.moduli[id];
  if (!m) return "";
  return `<a class="modlink" href="${esc(m.url)}"><b>${esc(m.nome)}</b><span>${esc(m.descrizione)}</span></a>`;
}

function contatoreHtml(g) {
  const arg = g.esercizi || [];
  if (!arg.length) return "";
  let tf = 0, ts = 0;
  const righe = arg.map(a => {
    const c = Store.contatore(g.data, a);
    tf += c.fatti; ts += c.sbagliati;
    const step = (k, lab, v) => `<div class="step"><span>${lab}</span>
      <button type="button" data-op="-1" data-k="${k}" aria-label="${esc(a)}, ${lab}: meno uno">−</button>
      <input type="number" inputmode="numeric" min="0" max="9999" value="${v}" data-k="${k}" aria-label="${esc(a)}: ${lab}">
      <button type="button" data-op="1" data-k="${k}" aria-label="${esc(a)}, ${lab}: più uno">+</button></div>`;
    return `<div class="cnt" data-arg="${esc(a)}"><p class="cnt-t">${esc(a)}</p><div class="cnt-row">${step("fatti", "fatti", c.fatti)}${step("sbagliati", "sbagliati", c.sbagliati)}</div></div>`;
  }).join("");
  return `<h3>Esercizi fatti su The Faculty</h3>${righe}
    <p class="tot" data-tot>Totale: <b>${tf}</b> fatti, <b>${ts}</b> sbagliati</p><p class="small muted" data-clamp hidden>Gli sbagliati non possono superare i fatti.</p>`;
}

function sessioniHtml(data, titolo) {
  const per = {};
  for (const s of Store.sessioni()) if (s.data === data) {
    const p = per[s.modulo] = per[s.modulo] || { n: 0, esercizi: 0, errori: 0 };
    p.n++; p.esercizi += Number(s.esercizi) || 0; p.errori += Number(s.errori) || 0;
  }
  const ids = Object.keys(per);
  if (!ids.length) return "";
  return `<h3>${titolo}</h3><ul>${ids.map(id => {
    const p = per[id], nome = PLAN.moduli[id] ? PLAN.moduli[id].nome : id;
    return `<li>${esc(nome)}: ${pl(p.esercizi, "esercizio", "esercizi")}, ${pl(p.errori, "errore", "errori")} (${pl(p.n, "sessione", "sessioni")})</li>`;
  }).join("")}</ul>`;
}

function dettaglioHtml(g, oggi, extra = "") {
  if (g.tipo === "pausa") return `<p>Domenica libera: niente studio.</p>`;
  if (g.tipo === "esame") return `<p>Giorno del test. 50 quesiti in 110 minuti, più la sezione di inglese.</p>`;
  const es = g.esercizi || [];
  const testoEs = es.length ? es.join(", ") + (g.nota ? ` (${g.nota})` : "") : (g.nota || "—");
  const fatto = !!Store.giorno(g.data).fatto;
  return `<dl class="kv"><dt>Teoria</dt><dd class="teo">${Teoria.pianoHtml(g)}</dd>
    <dt>Esercizi su The Faculty</dt><dd>${esc(testoEs)}</dd></dl>
    ${(g.moduli || []).length ? `<h3>${g.moduli.length === 1 ? "Pagina interattiva" : "Pagine interattive"}</h3>${g.moduli.map(linkModulo).join("")}` : ""}
    ${contatoreHtml(g)}
    ${sessioniHtml(g.data, g.data === oggi ? "Nei moduli oggi" : "Nei moduli in questa data")}
    ${extra}
    <div class="btnrow">${fatto
      ? `<button type="button" class="btn done wide" data-fatto="0">✓ Fatto · tocca per annullare</button>`
      : `<button type="button" class="btn primary wide" data-fatto="1">Segna come fatto</button>`}</div>`;
}

/* ---------- schermata Oggi ---------- */
function renderOggi(main) {
  const oggi = oggiISO(), esame = PLAN.esame, primo = PLAN.giorni[0], n = giorniTra(oggi, esame);
  let h = `<h1>${esc(cap(dataLunga(oggi)))}</h1>`;
  if (n > 1) h += `<p class="countdown"><b>${n}</b> giorni al TOLC-I (${esc(dataMedia(esame))})</p>`;
  else if (n === 1) h += `<p class="countdown"><b>Domani</b> c'è il TOLC-I</p>`;

  const g = PLAN.giorni.find(x => x.data === oggi);
  if (oggi < primo.data) {
    h += `<section class="card"><h2>Il piano non è ancora iniziato</h2>
      <p>Si parte ${esc(dataMedia(primo.data))}, fra ${pl(giorniTra(oggi, primo.data), "giorno", "giorni")}.</p>
      <p>Primo giorno: <b>${esc(primo.materia)}</b>, teoria ${esc(primo.teoria || "—")}.</p></section>`;
  } else if (oggi > esame) {
    const tot = PLAN.giorni.filter(x => x.tipo !== "pausa" && x.tipo !== "esame"), fatti = tot.filter(x => Store.giorno(x.data).fatto);
    h += `<section class="card"><h2>Il piano è finito</h2><p>Il TOLC-I era ${esc(dataLunga(esame))}.</p>
      <p>Giorni di studio fatti: <b>${fatti.length}</b> su ${tot.length}.</p></section>`;
  } else if (g && g.tipo === "esame") {
    h += `<section class="card today"><h2>Oggi c'è il TOLC-I</h2><p>In bocca al lupo!</p></section>`;
  } else if (g) {
    h += `<section class="card today" data-giorno="${g.data}"><p class="muted small">Oggi ${badge(stato(g, oggi))}</p>
      <p class="materia">${esc(g.tipo === "pausa" ? "Pausa" : g.materia)}</p>${dettaglioHtml(g, oggi, g.diario ? Diario.ripassoHtml() : "")}</section>`;
  } else {
    h += `<section class="card"><p class="warn">Questa data non è nel piano. Controlla data/plan.json (DA VERIFICARE).</p></section>`;
  }

  if (oggi >= primo.data && oggi < esame) {
    const arr = arretrati(oggi), primi = arr.slice(0, 5).map(x => esc(dataBreve(x.data))).join(", ");
    if (arr.length) h += `<p class="warn">${arr.length === 1 ? "1 giorno arretrato" : `${arr.length} giorni arretrati`}: ${primi}${arr.length > 5 ? ` e altri ${arr.length - 5}` : ""}. <a href="#piano">Apri il piano</a></p>`;
  }
  const ub = Store.ultimoBackup();
  if (Store.haDati() && (!ub || giorniTra(ub, oggi) > 7)) {
    h += `<div class="warn backup-avviso"><p>Ultimo backup: <b>${ub ? `${pl(giorniTra(ub, oggi), "giorno", "giorni")} fa` : "mai"}</b>. Se il telefono si rompe o si cancellano i dati del browser, si perde tutto.</p>
      <div class="btnrow"><button type="button" class="btn primary" data-backup="condividi">Fai il backup</button></div></div>`;
  }
  h += `<section class="card"><h2>Moduli</h2>${Object.keys(PLAN.moduli).map(linkModulo).join("")}</section>`;
  main.innerHTML = h;
}

/* ---------- schermata Piano ---------- */
function anteprimaHtml() {
  if (!daImportare) return "";
  const a = Store.anteprima(daImportare), q = Store.anteprima({ giorni: Store.giorni(), sessioni: Store.sessioni(), letti: {}, errori: Store.errori(), simulazioni: Store.simulazioni() });
  const riga = x => `${pl(x.giorniFatti, "giorno fatto", "giorni fatti")}, ${pl(x.errori, "errore", "errori")}, ${pl(x.sessioni, "sessione", "sessioni")}, ${pl(x.simulazioni, "simulazione", "simulazioni")}`;
  return `<div class="anteprima"><p><b>Il file contiene:</b> ${riga(a)}, ${pl(a.letti, "paragrafo letto", "paragrafi letti")}.</p>
    <p class="small muted">Su questo dispositivo ora: ${riga(q)}.</p>
    <p class="small"><b>Unisci</b>: tiene i dati di qui e aggiunge quelli del file, senza doppioni. <b>Sostituisci tutto</b>: restano solo i dati del file.</p>
    <div class="btnrow"><button type="button" class="btn primary" data-imp="unisci">Unisci</button><button type="button" class="btn" data-imp="sostituisci">Sostituisci tutto</button><button type="button" class="btn" data-imp="annulla">Annulla</button></div></div>`;
}

function renderPiano(main, scorri) {
  const oggi = oggiISO(), ub = Store.ultimoBackup();
  const conta = { fatto: 0, arretrato: 0, dafare: 0, pausa: 0 };
  const righe = PLAN.giorni.map(g => {
    const st = stato(g, oggi);
    if (st in conta) conta[st]++;
    const titolo = g.tipo === "pausa" ? "Pausa" : g.materia;
    return `<li><details class="day ${g.tipo === "pausa" ? "pausa" : ""} ${g.data === oggi ? "is-today" : ""}" data-giorno="${g.data}"${g.data === giornoAperto ? " open" : ""}>
      <summary><span class="d">${esc(dataBreve(g.data))}</span><span class="m">${g.data === oggi ? `<span class="oggi">OGGI</span>` : ""}${esc(titolo)}</span>${badge(st)}</summary>
      <div class="body">${dettaglioHtml(g, oggi)}</div></details></li>`;
  }).join("");
  main.innerHTML = `<h1>Piano</h1>
    <p class="legend">${badge("fatto")} ${conta.fatto} ${badge("arretrato")} ${conta.arretrato} ${badge("dafare")} ${conta.dafare} ${badge("pausa")} ${conta.pausa}</p>
    <p class="small muted">Un giorno non fatto resta arretrato: il piano non si sposta. Dopo ogni argomento finito: 10-15 domande dello stesso argomento dal libro Alfa Test.</p>
    <ul class="days">${righe}</ul>
    <section class="card" id="backup"><h2>Backup dei dati</h2>
      <p class="small muted">I dati restano su questo dispositivo. Telefono e computer non li condividono: fai il backup su uno e importalo sull'altro.
        Ultimo backup: <b>${ub ? esc(dataBreve(ub)) : "mai"}</b>.</p>
      <div class="btnrow"><button type="button" class="btn primary" data-backup="condividi">Condividi / salva il backup</button>
        <button type="button" class="btn" data-backup="scarica">Scarica il file</button><button type="button" class="btn" data-backup="importa">Importa un backup</button></div>
      <input type="file" id="file" accept="application/json,.json" hidden>
      ${anteprimaHtml()}
      <p id="backup-msg" role="status">${msgBackup}</p></section>
    <p class="small muted versione">Versione dell'app: ${esc(VERSIONE)}</p>`;
  msgBackup = "";
  main.querySelectorAll("details.day").forEach(d => d.addEventListener("toggle", () => {
    if (d.open) {
      giornoAperto = d.dataset.giorno;
      main.querySelectorAll("details.day[open]").forEach(x => { if (x !== d) x.open = false; });
    } else if (giornoAperto === d.dataset.giorno) giornoAperto = null;
  }));
  if (scorri) { const t = main.querySelector("details.is-today"); if (t) t.scrollIntoView({ block: "start" }); }
}

/* ---------- schermata Teoria (js/teoria.js) ---------- */
function renderTeoria(main, arg) {
  if (arg) Teoria.renderLettura(main, arg); else Teoria.renderIndice(main);
}

/* ---------- navigazione ---------- */
const VISTE = { oggi: renderOggi, piano: renderPiano, teoria: renderTeoria, errori: (m, a) => Diario.render(m, a), simulazioni: m => Simulazioni.render(m) };
const SCHEDA = { simulazioni: "oggi" };   // voce della barra in basso per le schermate che non ci sono
let vistaCorrente = null;
/* "#teoria/4.4-4.6" -> { v: "teoria", arg: "4.4-4.6" } */
function vista() {
  const [v, ...resto] = location.hash.slice(1).split("/");
  return VISTE[v] ? { v, arg: decodeURIComponent(resto.join("/")) } : { v: "oggi", arg: "" };
}
function render() {
  const main = $("#main"), { v, arg } = vista(), chiave = v + "/" + arg, nuova = chiave !== vistaCorrente;
  const scheda = SCHEDA[v] || v;
  document.querySelectorAll(".tabbar a").forEach(a => {
    if (a.getAttribute("href") === "#" + scheda) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  if (!PLAN) return;
  if (nuova && v === "piano" && giornoAperto === null) giornoAperto = oggiISO();
  const y = window.scrollY;
  if (v === "piano") renderPiano(main, nuova); else VISTE[v](main, arg);
  if (nuova) { if (v !== "piano") window.scrollTo(0, 0); } else window.scrollTo(0, y);
  vistaCorrente = v + "/" + vista().arg;
}

/* ---------- backup ---------- */
function messaggio(m) { msgBackup = m; const p = $("#backup-msg"); if (p) p.textContent = m; }
function erroreSalvataggio() { alert("Salvataggio non riuscito: la memoria del browser non è disponibile."); }
const nomeBackup = () => `tolc-backup-${oggiISO()}.json`;
const testoBackup = () => JSON.stringify(Store.esporta(), null, 2);

function scaricaBackup() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([testoBackup()], { type: "application/json" }));
  a.download = nomeBackup();
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  Store.segnaBackup(oggiISO());
  messaggio(`File ${nomeBackup()} scaricato.`);
  render();
}
/* Condividi (WhatsApp, Drive, email…) con la Web Share API; se il browser non la ha, scarica il file */
async function condividiBackup() {
  const file = new File([testoBackup()], nomeBackup(), { type: "application/json" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Backup TOLC-I" });
      Store.segnaBackup(oggiISO()); messaggio("Backup condiviso."); render();
    } catch (e) {
      if (e.name === "AbortError") messaggio("Condivisione annullata: il backup non è stato fatto.");
      else scaricaBackup();
    }
  } else scaricaBackup();
}

function leggiBackup(file) {
  const r = new FileReader();
  r.onload = () => {
    let dati;
    try { dati = Store.controlla(JSON.parse(r.result)); } catch (err) { dati = { errore: "Il file non è un JSON valido." }; }
    if (dati.errore) { daImportare = null; messaggio(dati.errore); return; }
    daImportare = dati;
    messaggio("");
    render();
    const box = $(".anteprima"); if (box) box.scrollIntoView({ block: "nearest" });
  };
  r.readAsText(file);
}
function importaBackup(modo) {
  if (!daImportare) return;
  if (modo === "sostituisci" && !confirm("Sostituire tutto? I dati di questo dispositivo verranno cancellati e restano solo quelli del file.")) return;
  if (!Store.importa(daImportare, modo)) { erroreSalvataggio(); return; }
  const a = Store.anteprima({ giorni: Store.giorni(), sessioni: Store.sessioni(), letti: {}, errori: Store.errori(), simulazioni: Store.simulazioni() });
  daImportare = null;
  messaggio(`${modo === "unisci" ? "Dati uniti" : "Dati sostituiti"}. Ora: ${pl(a.giorniFatti, "giorno fatto", "giorni fatti")}, ${pl(a.errori, "errore", "errori")}, ${pl(a.sessioni, "sessione", "sessioni")}, ${pl(a.simulazioni, "simulazione", "simulazioni")}.`);
  render();
}

/* ---------- eventi ---------- */
function aggiornaContatore(box, k, valore) {
  const giorno = box.closest("[data-giorno]"), cnt = box.closest("[data-arg]");
  const r = Store.impostaContatore(giorno.dataset.giorno, cnt.dataset.arg, k, valore);
  if (!r.ok) { erroreSalvataggio(); return; }
  cnt.querySelector('input[data-k="fatti"]').value = r.valore.fatti;
  cnt.querySelector('input[data-k="sbagliati"]').value = r.valore.sbagliati;
  let tf = 0, ts = 0;
  giorno.querySelectorAll("[data-arg]").forEach(c => { tf += +c.querySelector('input[data-k="fatti"]').value; ts += +c.querySelector('input[data-k="sbagliati"]').value; });
  giorno.querySelector("[data-tot]").innerHTML = `Totale: <b>${tf}</b> fatti, <b>${ts}</b> sbagliati`;
  giorno.querySelector("[data-clamp]").hidden = !r.tagliato;
}

document.addEventListener("click", e => {
  if (e.target.closest("[data-aggiorna]")) { location.reload(); return; }
  if (Simulazioni.clic(e) || Diario.clic(e)) return;
  const op = e.target.closest("button[data-op]");
  if (op) {
    const k = op.dataset.k, inp = op.closest(".step").querySelector("input");
    aggiornaContatore(op, k, Math.max(0, (+inp.value || 0) + Number(op.dataset.op)));
    return;
  }
  const l = e.target.closest("button[data-letto], button[data-letti]");
  if (l) {
    const nums = l.dataset.letto ? [l.dataset.letto] : Teoria.intervallo(l.dataset.letti).map(p => p.num);
    if (!Store.impostaLetti(nums, l.dataset.on === "1", oggiISO())) erroreSalvataggio();
    render();
    return;
  }
  const f = e.target.closest("button[data-fatto]");
  if (f) {
    const d = f.closest("[data-giorno]").dataset.giorno;
    if (!Store.impostaFatto(d, f.dataset.fatto === "1", oggiISO())) erroreSalvataggio();
    render();
    return;
  }
  const b = e.target.closest("[data-backup]");
  if (b) {
    if (b.dataset.backup === "condividi") condividiBackup();
    else if (b.dataset.backup === "scarica") scaricaBackup();
    else $("#file").click();
    return;
  }
  const imp = e.target.closest("[data-imp]");
  if (imp) { if (imp.dataset.imp === "annulla") { daImportare = null; render(); } else importaBackup(imp.dataset.imp); }
});

document.addEventListener("input", e => { Diario.cambio(e); });
document.addEventListener("change", e => {
  if (Diario.cambio(e)) return;
  const inp = e.target;
  if (inp.matches(".step input")) { aggiornaContatore(inp, inp.dataset.k, inp.value); return; }
  if (inp.id === "file" && inp.files[0]) { leggiBackup(inp.files[0]); inp.value = ""; }
});
document.addEventListener("submit", e => { Diario.invio(e); });

window.addEventListener("hashchange", render);
/* Al ritorno sull'app (da un modulo, dopo mezzanotte o dopo lo schermo spento) i dati, la data e il timer vanno riletti. */
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { Simulazioni.tic(); render(); } });
window.addEventListener("pageshow", e => { if (e.persisted) render(); });
window.addEventListener("storage", render);
setInterval(Simulazioni.tic, 500);

/* ---------- avvio ---------- */
fetch("data/plan.json", { cache: "no-cache" })
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(p => { PLAN = p; render(); Simulazioni.tic(); Teoria.carica().then(render).catch(() => {}); })
  .catch(() => {
    $("#main").innerHTML = `<h1>TOLC-I</h1><p class="warn">Non riesco a leggere <b>data/plan.json</b>.${location.protocol === "file:"
      ? " Aperta come file dal computer il browser blocca la lettura: aprila da un indirizzo web (vedi LEGGIMI.md)."
      : " Controlla che il file esista e sia un JSON valido."}</p>`;
  });
render();

/* ---------- service worker e aggiornamenti ---------- */
/* Quando arriva una versione nuova, il service worker la installa e prende il controllo:
   compare l'avviso, e "Aggiorna" ricarica l'app con i file nuovi. */
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  const cera = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(reg => {
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reg.update().catch(() => {}); });
  }).catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    const box = $("#avvisi");
    if (!cera || !box || box.querySelector("[data-avviso=versione]")) return;
    box.insertAdjacentHTML("afterbegin", `<div class="note" data-avviso="versione" role="status"><p><b>Nuova versione disponibile.</b></p>
      <div class="btnrow"><button type="button" class="btn primary" data-aggiorna>Aggiorna</button></div></div>`);
  });
}
