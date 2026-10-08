/* Diario degli errori e statistiche per argomento (schermata "Errori").
   Usa esc, oggiISO, dataBreve, PLAN di app.js, Store di store.js e Teoria di teoria.js. */
"use strict";
const Diario = (() => {
  const DOVE = { tf: "The Faculty", alfa: "Libro Alfa Test", sim: "Simulazione", modulo: "Modulo dell'app" };
  const TIPO = { formula: "Formula sbagliata", calcolo: "Errore di calcolo", regola: "Non ricordavo la regola", distrazione: "Distrazione o lettura", tempo: "Tempo finito", altro: "Altro" };
  const STATO = { "": "Tutti", darifare: "Da rifare", rifatto: "Rifatti" };
  let filtro = { argomento: "", tipo: "", stato: "" };
  let bozza = null;                       // errore nel modulo (nuovo o in modifica)
  let ultimi = { argomento: "", dove: "tf" };   // per aggiungere il successivo con meno tocchi
  let messaggio = "";

  /* Elenco degli argomenti: quelli di The Faculty in plan.json e quelli collegati a teoria, moduli e simulazioni */
  function argomenti() {
    const s = new Set();
    for (const g of PLAN.giorni) (g.esercizi || []).forEach(a => s.add(a));
    Object.keys(PLAN.teoriaArgomenti || {}).forEach(a => s.add(a));
    for (const m of Object.values(PLAN.moduli)) if (m.argomenti) Object.values(m.argomenti).forEach(a => s.add(a));
    return [...s].sort((a, b) => a.localeCompare(b, "it"));
  }
  /* Sotto-tema di un modulo -> argomento (es. "Albero di probabilità" -> "probabilità") */
  function mappa(modId, sub) {
    const m = PLAN.moduli[modId];
    if (!m || !m.argomenti) return sub;
    return m.argomenti[sub] || m.argomenti["*"] || sub;
  }

  /* Per argomento: esercizi fatti e sbagliati (contatori di Oggi + sessioni dei moduli) ed errori nel diario.
     Ordine: dal più debole (% di errori più alta); a parità, più errori nel diario. */
  function statistiche() {
    const s = {};
    const voce = a => s[a] || (s[a] = { argomento: a, fatti: 0, sbagliati: 0, diario: 0, darifare: 0 });
    for (const d of Object.values(Store.giorni())) for (const [a, c] of Object.entries(d.esercizi || {})) {
      const v = voce(a); v.fatti += c.fatti || 0; v.sbagliati += c.sbagliati || 0;
    }
    for (const x of Store.sessioni()) for (const [sub, c] of Object.entries(x.argomenti || {})) {
      const v = voce(mappa(x.modulo, sub)); v.fatti += Number(c.esercizi) || 0; v.sbagliati += Number(c.errori) || 0;
    }
    for (const e of Store.errori()) { const v = voce(e.argomento); v.diario++; if (e.stato === "darifare") v.darifare++; }
    const lista = Object.values(s).filter(v => v.fatti > 0 || v.diario > 0);
    lista.forEach(v => v.pct = v.fatti > 0 ? v.sbagliati / v.fatti : null);
    return lista.sort((a, b) => (a.pct == null) - (b.pct == null) || (b.pct || 0) - (a.pct || 0) || b.diario - a.diario || a.argomento.localeCompare(b.argomento, "it"));
  }
  const deboli = (n = 3) => statistiche().filter(v => v.pct != null && v.sbagliati > 0).slice(0, n);
  const perc = v => v.pct == null ? "—" : Math.round(v.pct * 100) + "%";

  /* Link ai box TRAPPOLA dei paragrafi collegati agli argomenti dati */
  function linkTrappola(args) {
    const r = [...new Set(args.map(a => (PLAN.teoriaArgomenti || {})[a]).filter(x => x && Teoria.intervallo(x).length))];
    return "#teoria/trappola" + (r.length ? "/" + encodeURIComponent(r.join(", ")) : "");
  }
  /* Riquadro per Oggi nei giorni di ripasso degli errori */
  function ripassoHtml() {
    const n = Store.errori().filter(e => e.stato === "darifare").length, d = deboli();
    return `<h3>Ripasso degli errori</h3><div class="btnrow">
      <a class="btn primary" href="#errori/darifare">Diario: ${n} ${n === 1 ? "errore" : "errori"} da rifare</a>
      <a class="btn" href="${linkTrappola(d.map(v => v.argomento))}">Box TRAPPOLA ${d.length ? "di: " + esc(d.map(v => v.argomento).join(", ")) : "(tutti)"}</a></div>
      ${d.length ? "" : `<p class="small muted">Ancora nessun argomento con errori registrati: il link apre tutti i box TRAPPOLA.</p>`}`;
  }

  /* ---------- schermata ---------- */
  function modulo() {
    const b = bozza, args = argomenti();
    if (b.argomento && !args.includes(b.argomento)) args.unshift(b.argomento);
    const scelte = (nome, voci, val) => Object.entries(voci).map(([k, t]) => `<label class="chip"><input type="radio" name="${nome}" value="${k}"${k === val ? " checked" : ""}><span>${t}</span></label>`).join("");
    return `<form class="card" id="err-form" novalidate><h2>${b.id ? "Modifica l'errore" : "Nuovo errore"}</h2>
      <label class="field">Argomento<select name="argomento">${args.map(a => `<option${a === b.argomento ? " selected" : ""}>${esc(a)}</option>`).join("")}</select></label>
      <fieldset class="chips"><legend>Dove l'ho fatto</legend>${scelte("dove", DOVE, b.dove)}</fieldset>
      <fieldset class="chips"><legend>Tipo di errore</legend>${scelte("tipo", TIPO, b.tipo)}</fieldset>
      <label class="field">Nota breve<input type="text" name="nota" maxlength="140" value="${esc(b.nota || "")}" placeholder="es. dimenticato che sin 30° = 1/2" autocomplete="off"></label>
      <p class="ko small" id="err-avviso" hidden>Scegli il tipo di errore.</p>
      <div class="btnrow"><button type="submit" class="btn primary">Salva</button><button type="button" class="btn" data-err="annulla">Annulla</button></div></form>`;
  }

  function voce(e) {
    return `<li class="err-item"><p class="err-testa"><b>${esc(e.argomento)}</b> <span class="small muted">· ${esc(dataBreve(e.data))} · ${DOVE[e.dove]} · ${TIPO[e.tipo]}</span></p>
      ${e.nota ? `<p class="err-nota">${esc(e.nota)}</p>` : ""}
      <p class="small">${e.stato === "rifatto" ? `<span class="badge b-fatto">rifatto ${e.rifattoIl ? "il " + esc(dataBreve(e.rifattoIl)) : ""}</span>` : `<span class="badge b-arretrato">da rifare</span>`}
      ${e.ricadute ? ` <span class="badge">sbagliato di nuovo: ${e.ricadute} ${e.ricadute === 1 ? "volta" : "volte"}</span>` : ""}</p>
      <div class="btnrow">${e.stato === "rifatto"
        ? `<button type="button" class="btn" data-err="ricaduta" data-id="${e.id}">Sbagliato di nuovo</button>`
        : `<button type="button" class="btn primary" data-err="rifatto" data-id="${e.id}">Rifatto</button>`}
        <button type="button" class="btn" data-err="modifica" data-id="${e.id}">Modifica</button>
        <button type="button" class="btn" data-err="elimina" data-id="${e.id}">Elimina</button></div></li>`;
  }

  function render(main, arg) {
    if (arg === "darifare") { filtro = { argomento: "", tipo: "", stato: "darifare" }; history.replaceState(null, "", "#errori"); }
    if (arg === "nuovo") { if (!bozza) bozza = { argomento: ultimi.argomento, dove: ultimi.dove, tipo: "", nota: "" }; history.replaceState(null, "", "#errori"); }
    const tutti = Store.errori(), st = statistiche(), d = deboli();
    const lista = tutti.filter(e => (!filtro.argomento || e.argomento === filtro.argomento) && (!filtro.tipo || e.tipo === filtro.tipo) && (!filtro.stato || e.stato === filtro.stato))
      .sort((a, b) => b.data.localeCompare(a.data) || (b.aggiornato || "").localeCompare(a.aggiornato || ""));
    const argUsati = [...new Set(tutti.map(e => e.argomento))].sort((a, b) => a.localeCompare(b, "it"));
    main.innerHTML = `<h1>Errori</h1>
      ${messaggio ? `<p class="note" role="status">${messaggio}</p>` : ""}
      <section class="card"><h2>I 3 argomenti più deboli</h2>
        ${d.length ? `<ol class="deboli">${d.map(v => `<li><b>${esc(v.argomento)}</b>: ${perc(v)} sbagliati (${v.sbagliati} su ${v.fatti})${v.diario ? ` · ${v.diario} nel diario` : ""}</li>`).join("")}</ol>
          <div class="btnrow"><a class="btn" href="${linkTrappola(d.map(v => v.argomento))}">Box TRAPPOLA di questi argomenti</a></div>`
          : `<p class="muted">Ancora pochi dati: segna gli esercizi di The Faculty in Oggi o fai una sessione nei moduli.</p>`}</section>
      ${bozza ? modulo() : `<div class="btnrow aggiungi"><button type="button" class="btn primary wide" data-err="nuovo">+ Aggiungi un errore</button></div>`}
      <section class="card"><h2>Diario <span class="small muted">(${lista.length} di ${tutti.length})</span></h2>
        <div class="row2"><label class="field">Argomento<select data-filtro="argomento"><option value="">Tutti</option>${argUsati.map(a => `<option${a === filtro.argomento ? " selected" : ""}>${esc(a)}</option>`).join("")}</select></label>
        <label class="field">Tipo<select data-filtro="tipo"><option value="">Tutti</option>${Object.entries(TIPO).map(([k, t]) => `<option value="${k}"${k === filtro.tipo ? " selected" : ""}>${t}</option>`).join("")}</select></label></div>
        <div class="seg" role="group" aria-label="Stato">${Object.entries(STATO).map(([k, t]) => `<button type="button" data-stato="${k}" aria-pressed="${filtro.stato === k}">${t}</button>`).join("")}</div>
        ${lista.length ? `<ul class="err-lista">${lista.map(voce).join("")}</ul>` : `<p class="muted">${tutti.length ? "Nessun errore con questi filtri." : "Il diario è vuoto."}</p>`}</section>
      <section class="card"><h2>Statistiche per argomento</h2>
        ${st.length ? `<div class="tabw"><table class="tab-st"><thead><tr><th>Argomento</th><th>Fatti</th><th>Sbagliati</th><th>%</th><th>Diario</th></tr></thead>
          <tbody>${st.map(v => `<tr><td>${esc(v.argomento)}</td><td>${v.fatti}</td><td>${v.sbagliati}</td><td>${perc(v)}</td><td>${v.diario}${v.darifare ? ` <span class="small muted">(${v.darifare} da rifare)</span>` : ""}</td></tr>`).join("")}</tbody></table></div>
          <p class="small muted">Fatti e sbagliati: contatori di The Faculty in Oggi più le sessioni dei moduli. Dal più debole in giù.</p>`
          : `<p class="muted">Nessun dato ancora.</p>`}</section>`;
    messaggio = "";
  }

  /* Apre il modulo già compilato (dalle simulazioni) */
  function nuovo(pre) {
    bozza = { argomento: pre.argomento || ultimi.argomento, dove: pre.dove || ultimi.dove, tipo: "", nota: pre.nota || "" };
    if (location.hash === "#errori") window.render(); else location.hash = "#errori";
  }

  function clic(e) {
    const b = e.target.closest("[data-err], [data-stato]");
    if (!b || !document.getElementById("main").contains(b) || !location.hash.startsWith("#errori")) return false;
    if (b.dataset.stato !== undefined) { filtro.stato = b.dataset.stato; window.render(); return true; }
    const az = b.dataset.err, id = b.dataset.id, oggi = oggiISO();
    if (az === "nuovo") bozza = { argomento: ultimi.argomento, dove: ultimi.dove, tipo: "", nota: "" };
    else if (az === "annulla") bozza = null;
    else if (az === "rifatto" || az === "ricaduta") Store.segnaErrore(id, az === "rifatto", oggi);
    else if (az === "modifica") { const x = Store.errori().find(y => y.id === id); if (x) bozza = { ...x }; window.scrollTo(0, 0); }
    else if (az === "elimina") {
      const x = Store.errori().find(y => y.id === id);
      if (!x || !confirm(`Eliminare l'errore "${x.argomento}${x.nota ? ": " + x.nota.slice(0, 60) : ""}"?`)) return true;
      Store.eliminaErrore(id); messaggio = "Errore eliminato.";
    }
    window.render();
    return true;
  }
  /* il modulo tiene in memoria quello che scrivo (se la pagina si ridisegna non si perde) */
  function cambio(e) {
    const f = e.target.closest("#err-form");
    if (f && bozza) { const v = new FormData(f); bozza.argomento = v.get("argomento"); bozza.dove = v.get("dove"); bozza.tipo = v.get("tipo") || ""; bozza.nota = v.get("nota") || ""; return true; }
    const s = e.target.closest("select[data-filtro]");
    if (s) { filtro[s.dataset.filtro] = s.value; window.render(); return true; }
    return false;
  }
  function invio(e) {
    if (e.target.id !== "err-form") return false;
    e.preventDefault();
    cambio({ target: e.target });
    if (!bozza.tipo) { document.getElementById("err-avviso").hidden = false; return true; }
    const nuovoErr = !bozza.id;
    if (!Store.salvaErrore({ ...bozza, data: bozza.data || oggiISO(), stato: bozza.stato || "darifare" })) { alert("Errore non salvato: la memoria del browser non è disponibile."); return true; }
    ultimi = { argomento: bozza.argomento, dove: bozza.dove };
    messaggio = nuovoErr ? "Errore aggiunto al diario." : "Errore modificato.";
    bozza = null;
    window.render();
    return true;
  }

  return { render, nuovo, clic, cambio, invio, statistiche, deboli, ripassoHtml, linkTrappola, mappa };
})();
