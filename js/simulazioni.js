/* Simulazioni: timer delle sezioni, risultati, confronto. I quesiti sono su The Faculty: qui non ce ne sono.
   Il timer conta sull'orologio del dispositivo: salva l'ora di fine, e il tempo che resta è fine − adesso.
   Così è giusto anche se lo schermo si spegne o l'app va in secondo piano.
   Usa esc, oggiISO, render, PLAN di app.js e Store di store.js. */
"use strict";
const SIM_SEZIONI = [
  { id: "mat", nome: "Matematica", quesiti: 20, minuti: 50 },
  { id: "log", nome: "Logica", quesiti: 10, minuti: 20 },
  { id: "sci", nome: "Scienze", quesiti: 10, minuti: 20 },
  { id: "ver", nome: "Comprensione verbale", quesiti: 10, minuti: 20 }
];
const sezione = id => SIM_SEZIONI.find(s => s.id === id);

/* ---------- calcoli (senza pagina: si provano da Node) ---------- */
const Timer = {
  durata: id => sezione(id).minuti * 60000,
  nuovo(simId, coda) { const d = Timer.durata(coda[0]); return { simId, coda, i: 0, durata: d, stato: "pronto", fine: null, residuo: d }; },
  avvia(t, ora) { return t.stato === "pronto" || t.stato === "pausa" ? { ...t, stato: "corre", fine: ora + t.residuo } : t; },
  pausa(t, ora) { return t.stato === "corre" ? { ...t, stato: "pausa", residuo: Math.max(0, t.fine - ora), fine: null } : t; },
  azzera(t) { return { ...t, stato: "pronto", residuo: t.durata, fine: null }; },
  residuo(t, ora) { return t.stato === "corre" ? Math.max(0, t.fine - ora) : t.stato === "scaduto" ? 0 : t.residuo; },
  scade(t, ora) { return t.stato === "corre" && ora >= t.fine ? { ...t, stato: "scaduto", residuo: 0, fine: null } : t; },
  prossima(t) {
    if (t.i + 1 >= t.coda.length) return null;
    const id = t.coda[t.i + 1], d = Timer.durata(id);
    return { ...t, i: t.i + 1, durata: d, stato: "pronto", fine: null, residuo: d };
  }
};
/* Punteggio TOLC: +1 giusta, 0 non data, −0,25 sbagliata */
const punteggio = r => r.giuste - 0.25 * r.sbagliate;
const totaleSim = s => SIM_SEZIONI.reduce((t, z) => t + (s.sezioni[z.id] ? punteggio(s.sezioni[z.id]) : 0), 0);
const completaSim = s => SIM_SEZIONI.every(z => s.sezioni[z.id]);
const mmss = ms => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const pt = x => String(Math.round(x * 100) / 100).replace(".", ",").replace("-", "−");

/* ---------- pagina ---------- */
const Simulazioni = (() => {
  let bozza = { g: 0, s: 0 };       // risultato della sezione mentre lo scrivo
  let messaggio = "";

  function argomentoDi(sezId) {
    const m = PLAN.moduli.simulazioni, nome = sezione(sezId).nome;
    return (m && m.argomenti && m.argomenti[nome]) || nome.toLowerCase();
  }

  function scelta() {
    const tutte = Store.simulazioni();
    const aperta = tutte.slice().reverse().find(s => !completaSim(s));
    const prossimo = (() => { const usati = new Set(tutte.map(s => s.nome)); for (let n = 0; n < 26; n++) { const c = String.fromCharCode(65 + n); if (!usati.has(c)) return c; } return "?"; })();
    return `<label class="field">Simulazione<select id="sim-scelta">
      ${tutte.map(s => `<option value="${s.id}"${aperta && aperta.id === s.id ? " selected" : ""}>${esc(s.nome)} · ${Object.keys(s.sezioni).length} sezioni su 4 registrate</option>`).join("")}
      <option value="nuova"${aperta ? "" : " selected"}>Nuova simulazione (${prossimo})</option></select></label>
      <p class="small muted">Che cosa fai adesso?</p>
      <div class="sim-scelte">${SIM_SEZIONI.map(z => `<button type="button" class="btn" data-sim-avvio="${z.id}"><b>${z.nome}</b><span>${z.quesiti} quesiti · ${z.minuti} min</span></button>`).join("")}
      <button type="button" class="btn" data-sim-avvio="tutte"><b>Simulazione completa</b><span>50 quesiti · 110 min, sezione dopo sezione</span></button></div>`;
  }

  function timerHtml(t) {
    const sim = Store.simulazioni().find(s => s.id === t.simId), z = sezione(t.coda[t.i]), ora = Date.now();
    const res = Timer.residuo(t, ora);
    const giaFatta = sim && sim.sezioni[z.id];
    const comandi = t.stato === "corre"
      ? `<button type="button" class="btn primary" data-sim="pausa">Pausa</button>`
      : t.stato === "scaduto" ? "" : `<button type="button" class="btn primary" data-sim="avvia">${t.stato === "pausa" ? "Riprendi" : "Avvia"}</button>`;
    const g = bozza.g, s = bozza.s, nd = z.quesiti - g - s;
    const step = (k, lab, v) => `<div class="step"><span>${lab}</span><button type="button" data-sim-op="-1" data-k="${k}" aria-label="${lab}: meno uno">−</button>
      <output class="num">${v}</output><button type="button" data-sim-op="1" data-k="${k}" aria-label="${lab}: più uno">+</button></div>`;
    return `<p class="sim-sez">Simulazione <b>${esc(sim ? sim.nome : "?")}</b> · ${z.nome}${t.coda.length > 1 ? ` · sezione ${t.i + 1} di ${t.coda.length}` : ""}</p>
      <p class="sim-tempo${res <= 60000 && t.stato !== "pronto" ? " poco" : ""}" id="sim-tempo" role="timer" aria-live="off">${mmss(res)}</p>
      ${t.stato === "scaduto" ? `<p class="warn big"><b>Tempo scaduto.</b> Scrivi il risultato della sezione.</p>` : ""}
      <div class="btnrow">${comandi}<button type="button" class="btn" data-sim="azzera">Azzera</button><button type="button" class="btn" data-sim="chiudi">Chiudi il timer</button></div>
      <h3>Risultato della sezione (${z.quesiti} quesiti)</h3>
      ${giaFatta ? `<p class="small muted">Già registrato: ${giaFatta.giuste} giuste, ${giaFatta.sbagliate} sbagliate. Se salvi, lo sostituisci.</p>` : ""}
      <div class="cnt-row">${step("g", "giuste", g)}${step("s", "sbagliate", s)}</div>
      <p>Non date: <b>${nd}</b> · punteggio: <b>${pt(punteggio({ giuste: g, sbagliate: s }))}</b> su ${z.quesiti}</p>
      <div class="btnrow"><button type="button" class="btn primary wide" data-sim="salva">Salva il risultato di ${z.nome}</button></div>`;
  }

  function tabella(tutte) {
    if (!tutte.length) return `<p class="muted">Nessuna simulazione registrata.</p>`;
    const cella = (s, z) => s.sezioni[z.id] ? pt(punteggio(s.sezioni[z.id])) : "—";
    return `<div class="tabw"><table class="tab-sim"><thead><tr><th>Sim.</th>${SIM_SEZIONI.map(z => `<th>${z.nome === "Comprensione verbale" ? "Verb." : z.nome.slice(0, 3) + "."}<br><span class="small">/${z.quesiti}</span></th>`).join("")}<th>Totale<br><span class="small">/50</span></th></tr></thead>
      <tbody>${tutte.map(s => `<tr><td><b>${esc(s.nome)}</b></td>${SIM_SEZIONI.map(z => `<td>${cella(s, z)}</td>`).join("")}<td><b>${pt(totaleSim(s))}</b>${completaSim(s) ? "" : "*"}</td></tr>`).join("")}</tbody></table></div>
      ${tutte.some(s => !completaSim(s)) ? `<p class="small muted">* simulazione non ancora completa.</p>` : ""}
      ${tutte.map(s => `<details class="sim-det"><summary>Simulazione ${esc(s.nome)}: dettaglio ed errori</summary>
        ${SIM_SEZIONI.filter(z => s.sezioni[z.id]).map(z => { const r = s.sezioni[z.id];
          return `<div class="sim-riga"><p><b>${z.nome}</b>: ${r.giuste} giuste, ${r.sbagliate} sbagliate, ${r.nonDate} non date → <b>${pt(punteggio(r))}</b>${r.data ? ` <span class="small muted">(${esc(r.data)})</span>` : ""}</p>
          <button type="button" class="btn" data-sim-errore="${s.id}|${z.id}">Aggiungi errore al diario</button></div>`; }).join("") || `<p class="muted">Nessuna sezione registrata.</p>`}</details>`).join("")}`;
  }

  /* Grafico semplice: una piccola linea per sezione e una per il totale (stesso colore, niente libreria) */
  function grafico(titolo, valori, max) {
    const W = 320, H = 130, sx = 30, dx = 12, sy = 14, gy = 26, m = 26;   // m: margine dei punti dagli assi
    const min = Math.min(0, ...valori.filter(v => v.v != null).map(v => v.v));
    const x = i => valori.length === 1 ? (sx + W - dx) / 2 : sx + m + i * (W - sx - dx - 2 * m) / (valori.length - 1);
    const y = v => sy + (max - v) * (H - sy - gy) / (max - min || 1);
    let linea = "", punti = "";
    valori.forEach((p, i) => {
      if (p.v == null) return;
      linea += `${linea && valori[i - 1] && valori[i - 1].v != null ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)} `;
      punti += `<circle cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="4" class="g-punto"/><text x="${x(i).toFixed(1)}" y="${(y(p.v) - 8).toFixed(1)}" class="g-val">${pt(p.v)}</text>`;
    });
    const asse = valori.map((p, i) => `<text x="${x(i).toFixed(1)}" y="${H - 6}" class="g-x">${esc(p.nome)}</text>`).join("");
    return `<figure class="grafico"><figcaption>${titolo} <span class="small muted">(massimo ${max})</span></figcaption>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${titolo}: ${valori.map(p => `${p.nome} ${p.v == null ? "non fatta" : pt(p.v)}`).join(", ")}">
      <line x1="${sx}" x2="${W - dx}" y1="${y(max).toFixed(1)}" y2="${y(max).toFixed(1)}" class="g-max"/><text x="${sx - 4}" y="${(y(max) + 4).toFixed(1)}" class="g-y">${max}</text>
      <line x1="${sx}" x2="${W - dx}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}" class="g-zero"/><text x="${sx - 4}" y="${(y(0) + 4).toFixed(1)}" class="g-y">0</text>
      <path d="${linea}" class="g-linea"/>${punti}${asse}</svg></figure>`;
  }
  function grafici(tutte) {
    if (!tutte.length) return "";
    const serie = f => tutte.map(s => ({ nome: s.nome, v: f(s) }));
    return `<section class="card"><h2>Come vado</h2><p class="small muted">Punteggio di ogni simulazione, sezione per sezione.</p><div class="grafici">
      ${grafico("Totale", serie(s => completaSim(s) ? totaleSim(s) : null), 50)}
      ${SIM_SEZIONI.map(z => grafico(z.nome, serie(s => s.sezioni[z.id] ? punteggio(s.sezioni[z.id]) : null), z.quesiti)).join("")}</div>
      <p class="small muted">Il totale compare solo per le simulazioni complete.</p></section>`;
  }

  function render(main) {
    const t = Store.timer(), tutte = Store.simulazioni();
    main.innerHTML = `<h1>Simulazioni</h1>
      <p class="small muted">I quesiti si fanno su The Faculty: qui ci sono il tempo con le durate ufficiali e i risultati. Punteggio: +1 giusta, 0 non data, −0,25 sbagliata.</p>
      ${messaggio ? `<p class="note" role="status">${messaggio}</p>` : ""}
      <section class="card"><h2>Timer</h2>${t ? timerHtml(t) : scelta()}</section>
      <section class="card"><h2>Risultati</h2>${tabella(tutte)}</section>
      ${grafici(tutte)}`;
    messaggio = "";
  }

  /* ogni mezzo secondo: aggiorna il tempo e controlla se è scaduto (anche dalle altre schermate) */
  function tic() {
    let t = Store.timer();
    if (!t || t.stato !== "corre") return;
    const ora = Date.now(), el = document.getElementById("sim-tempo");
    if (el) { const r = Timer.residuo(t, ora); el.textContent = mmss(r); el.classList.toggle("poco", r <= 60000); }
    if (ora >= t.fine) {
      t = Timer.scade(t, ora);
      Store.salvaTimer(t);
      if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 800]);
      scadutoAvviso(sezione(t.coda[t.i]).nome);
      if (location.hash.startsWith("#simulazioni")) window.render();
    }
  }
  function scadutoAvviso(nome) {
    const box = document.getElementById("avvisi");
    if (!box || box.querySelector("[data-avviso=tempo]")) return;
    box.insertAdjacentHTML("beforeend", `<p class="warn big" data-avviso="tempo" role="alert"><b>Tempo scaduto</b> (${esc(nome)}). <a href="#simulazioni">Scrivi il risultato</a></p>`);
  }

  function clic(e) {
    const b = e.target.closest("[data-sim-avvio], [data-sim], [data-sim-op], [data-sim-errore]");
    if (!b) return false;
    const ora = Date.now(), oggi = oggiISO();
    let t = Store.timer();
    if (b.dataset.simAvvio) {
      let simId = document.getElementById("sim-scelta").value;
      if (simId === "nuova") { const s = Store.nuovaSimulazione(oggi); if (!s) return true; simId = s.id; }
      const coda = b.dataset.simAvvio === "tutte" ? SIM_SEZIONI.map(z => z.id) : [b.dataset.simAvvio];
      Store.salvaTimer(Timer.nuovo(simId, coda)); bozza = { g: 0, s: 0 };
    } else if (b.dataset.simOp) {
      const z = sezione(t.coda[t.i]), k = b.dataset.k, d = +b.dataset.simOp;
      const v = Math.max(0, bozza[k] + d);
      if (v + (k === "g" ? bozza.s : bozza.g) <= z.quesiti) bozza[k] = v;
    } else if (b.dataset.simErrore) {
      const [simId, sezId] = b.dataset.simErrore.split("|"), s = Store.simulazioni().find(x => x.id === simId);
      Diario.nuovo({ argomento: argomentoDi(sezId), dove: "sim", nota: `Simulazione ${s ? s.nome : ""}, ${sezione(sezId).nome}: ` });
      return true;
    } else {
      const az = b.dataset.sim;
      if (az === "avvia") t = Timer.avvia(t, ora);
      else if (az === "pausa") t = Timer.pausa(t, ora);
      else if (az === "azzera") t = Timer.azzera(t);
      else if (az === "chiudi") {
        if (t.stato === "corre" && !confirm("Il timer sta andando. Chiuderlo?")) return true;
        t = null;
      } else if (az === "salva") {
        const z = sezione(t.coda[t.i]);
        if (!Store.salvaSezione(t.simId, z.id, { giuste: bozza.g, sbagliate: bozza.s }, oggi)) { alert("Risultato non salvato: controlla i numeri."); return true; }
        const sim = Store.simulazioni().find(x => x.id === t.simId);
        messaggio = `Salvato: ${z.nome}, ${bozza.g} giuste, ${bozza.s} sbagliate → ${pt(punteggio({ giuste: bozza.g, sbagliate: bozza.s }))} punti.`;
        bozza = { g: 0, s: 0 };
        t = Timer.prossima(t);
        if (!t && sim && completaSim(sim)) messaggio += ` Simulazione ${esc(sim.nome)} completa: <b>${pt(totaleSim(sim))}</b> su 50.`;
      }
      const box = document.getElementById("avvisi"), av = box && box.querySelector("[data-avviso=tempo]");
      if (av && (!t || t.stato !== "scaduto")) av.remove();
      Store.salvaTimer(t);
    }
    window.render();
    return true;
  }

  return { render, tic, clic };
})();
