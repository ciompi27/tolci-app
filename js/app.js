/* App TOLC-I: schermate Oggi, Piano, Teoria, Errori. */
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

let PLAN = null;
let giornoAperto = null; // giorno aperto nella schermata Piano

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
      <button type="button" data-op="-1" data-k="${k}" aria-label="${lab}: meno uno">−</button>
      <input type="number" inputmode="numeric" min="0" max="9999" value="${v}" data-k="${k}" aria-label="${esc(a)}: ${lab}">
      <button type="button" data-op="1" data-k="${k}" aria-label="${lab}: più uno">+</button></div>`;
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
    return `<li>${esc(nome)}: ${p.esercizi} ${p.esercizi === 1 ? "esercizio" : "esercizi"}, ${p.errori} ${p.errori === 1 ? "errore" : "errori"} (${p.n} ${p.n === 1 ? "sessione" : "sessioni"})</li>`;
  }).join("")}</ul>`;
}

function dettaglioHtml(g, oggi) {
  if (g.tipo === "pausa") return `<p>Domenica libera: niente studio.</p>`;
  if (g.tipo === "esame") return `<p>Giorno del test. 50 quesiti in 110 minuti, più la sezione di inglese.</p>`;
  const es = g.esercizi || [];
  const testoEs = es.length ? es.join(", ") + (g.nota ? ` (${g.nota})` : "") : (g.nota || "—");
  const fatto = !!Store.giorno(g.data).fatto;
  return `<dl class="kv"><dt>Teoria</dt><dd class="teo">${Teoria.pianoHtml(g)}</dd>
    <dt>Esercizi su The Faculty</dt><dd>${esc(testoEs)}</dd></dl>
    ${(g.moduli || []).length ? `<h3>Pagina interattiva</h3>${g.moduli.map(linkModulo).join("")}` : ""}
    ${contatoreHtml(g)}
    ${sessioniHtml(g.data, g.data === oggi ? "Nei moduli oggi" : "Nei moduli in questa data")}
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
      <p>Si parte ${esc(dataMedia(primo.data))}, fra ${giorniTra(oggi, primo.data)} ${giorniTra(oggi, primo.data) === 1 ? "giorno" : "giorni"}.</p>
      <p>Primo giorno: <b>${esc(primo.materia)}</b>, teoria ${esc(primo.teoria || "—")}.</p></section>`;
  } else if (oggi > esame) {
    const tot = PLAN.giorni.filter(x => x.tipo !== "pausa" && x.tipo !== "esame"), fatti = tot.filter(x => Store.giorno(x.data).fatto);
    h += `<section class="card"><h2>Il piano è finito</h2><p>Il TOLC-I era ${esc(dataLunga(esame))}.</p>
      <p>Giorni di studio fatti: <b>${fatti.length}</b> su ${tot.length}.</p></section>`;
  } else if (g && g.tipo === "esame") {
    h += `<section class="card today"><h2>Oggi c'è il TOLC-I</h2><p>In bocca al lupo!</p></section>`;
  } else if (g) {
    h += `<section class="card today" data-giorno="${g.data}"><p class="muted small">Oggi ${badge(stato(g, oggi))}</p>
      <p class="materia">${esc(g.tipo === "pausa" ? "Pausa" : g.materia)}</p>${dettaglioHtml(g, oggi)}</section>`;
  } else {
    h += `<section class="card"><p class="warn">Questa data non è nel piano. Controlla data/plan.json (DA VERIFICARE).</p></section>`;
  }

  if (oggi >= primo.data && oggi < esame) {
    const arr = arretrati(oggi), primi = arr.slice(0, 5).map(x => esc(dataBreve(x.data))).join(", ");
    if (arr.length) h += `<p class="warn">${arr.length === 1 ? "1 giorno arretrato" : `${arr.length} giorni arretrati`}: ${primi}${arr.length > 5 ? ` e altri ${arr.length - 5}` : ""}. <a href="#piano">Apri il piano</a></p>`;
  }

  h += `<section class="card"><h2>Moduli</h2>${Object.keys(PLAN.moduli).map(linkModulo).join("")}</section>`;
  main.innerHTML = h;
}

/* ---------- schermata Piano ---------- */
function renderPiano(main, scorri) {
  const oggi = oggiISO();
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
    <section class="card"><h2>Backup dei dati</h2>
      <p class="small muted">I dati restano su questo dispositivo. Telefono e computer non li condividono: esporta il file da uno e importalo nell'altro. L'importazione sostituisce i dati attuali.</p>
      <div class="btnrow"><button type="button" class="btn" id="esporta">Esporta JSON</button><button type="button" class="btn" id="importa">Importa JSON</button></div>
      <input type="file" id="file" accept="application/json,.json" hidden>
      <p id="backup-msg" role="status"></p></section>`;
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

/* ---------- segnaposto ---------- */
function renderErrori(main) {
  main.innerHTML = `<h1>Errori</h1><section class="card"><p>Il diario degli errori arriva nella <b>fase 4</b>.</p></section>`;
}

/* ---------- navigazione ---------- */
const VISTE = { oggi: renderOggi, piano: renderPiano, teoria: renderTeoria, errori: renderErrori };
let vistaCorrente = null;
/* "#teoria/4.4-4.6" -> { v: "teoria", arg: "4.4-4.6" } */
function vista() {
  const [v, ...resto] = location.hash.slice(1).split("/");
  return VISTE[v] ? { v, arg: decodeURIComponent(resto.join("/")) } : { v: "oggi", arg: "" };
}
function render() {
  const main = $("#main"), { v, arg } = vista(), chiave = v + "/" + arg, nuova = chiave !== vistaCorrente;
  document.querySelectorAll(".tabbar a").forEach(a => {
    if (a.getAttribute("href") === "#" + v) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  if (!PLAN) return;
  if (nuova && v === "piano" && giornoAperto === null) giornoAperto = oggiISO();
  const y = window.scrollY;
  if (v === "piano") renderPiano(main, nuova); else VISTE[v](main, arg);
  if (nuova) { if (v !== "piano") window.scrollTo(0, 0); } else window.scrollTo(0, y);
  vistaCorrente = chiave;
}

/* ---------- eventi ---------- */
function avviso(msg) { const p = $("#backup-msg"); if (p) p.textContent = msg; }
function erroreSalvataggio() { alert("Salvataggio non riuscito: la memoria del browser non è disponibile."); }

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
  if (e.target.id === "esporta") {
    const blob = new Blob([JSON.stringify(Store.esporta(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tolc-i-backup-${oggiISO()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    avviso("File esportato.");
    return;
  }
  if (e.target.id === "importa") $("#file").click();
});

document.addEventListener("change", e => {
  const inp = e.target;
  if (inp.matches(".step input")) { aggiornaContatore(inp, inp.dataset.k, inp.value); return; }
  if (inp.id === "file" && inp.files[0]) {
    const r = new FileReader();
    r.onload = () => {
      let dati;
      try { dati = Store.controlla(JSON.parse(r.result)); } catch (err) { dati = { errore: "Il file non è un JSON valido." }; }
      inp.value = "";
      if (dati.errore) { avviso(dati.errore); return; }
      const nf = Object.values(dati.giorni).filter(d => d.fatto).length, nl = Object.keys(dati.letti).length;
      const pl = (n, uno, molti) => `${n} ${n === 1 ? uno : molti}`;
      if (!confirm(`Importare il backup? Contiene ${pl(nf, "giorno fatto", "giorni fatti")}, ${pl(dati.sessioni.length, "sessione dei moduli", "sessioni dei moduli")} e ${pl(nl, "paragrafo letto", "paragrafi letti")}. I dati attuali su questo dispositivo verranno sostituiti.`)) return;
      if (!Store.importa(dati)) { erroreSalvataggio(); return; }
      render();
      avviso("Dati importati.");
    };
    r.readAsText(inp.files[0]);
  }
});

window.addEventListener("hashchange", render);
/* Al ritorno sull'app (da un modulo o dopo mezzanotte) i dati e la data vanno riletti. */
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") render(); });
window.addEventListener("pageshow", e => { if (e.persisted) render(); });
window.addEventListener("storage", render);

/* ---------- avvio ---------- */
fetch("data/plan.json", { cache: "no-cache" })
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(p => { PLAN = p; render(); Teoria.carica().then(render).catch(() => {}); })
  .catch(() => {
    $("#main").innerHTML = `<h1>TOLC-I</h1><p class="warn">Non riesco a leggere <b>data/plan.json</b>.${location.protocol === "file:"
      ? " Aperta come file dal computer il browser blocca la lettura: aprila da un indirizzo web (vedi LEGGIMI.md)."
      : " Controlla che il file esista e sia un JSON valido."}</p>`;
  });
render();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
