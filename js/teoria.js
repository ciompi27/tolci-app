/* Teoria: capitoli in data/theory/, elenco dei paragrafi, lettura, filtri TRAPPOLA e FORMULA.
   Usa esc() di app.js e Store di store.js. */
"use strict";
const Teoria = (() => {
  let promessa = null, pronta = false, indice = null;
  const capitoli = [];   // { num, titolo, etichetta, intro, par: [] }
  const paragrafi = [];  // { num, titolo, etichetta, cap, el } in ordine
  const ETICH = { "RIPASSO": "ripasso", "DA RINFRESCARE": "rinfrescare", "DA STUDIARE": "studiare", "NUOVO": "nuovo" };
  const FILTRI = { trappola: "TRAPPOLA", formula: "FORMULA" };

  function scarica(url, json) {
    return fetch(url, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(url); return json ? r.json() : r.text(); });
  }

  function carica() {
    if (promessa) return promessa;
    promessa = scarica("data/theory/indice.json", true)
      .then(ind => { indice = ind; return Promise.all(ind.capitoli.map(f => scarica("data/theory/" + f, false))); })
      .then(testi => {
        testi.forEach(t => {
          const tpl = document.createElement("template");
          tpl.innerHTML = t;
          const art = tpl.content.querySelector("article.capitolo");
          if (!art) return;
          const cap = { num: art.dataset.cap, titolo: art.dataset.titolo, etichetta: art.dataset.etichetta, intro: art.querySelector(".cap-intro"), par: [] };
          art.querySelectorAll("section.par").forEach(s => {
            const p = { num: s.dataset.par, titolo: s.dataset.titolo, etichetta: s.dataset.etichetta, cap, el: s };
            cap.par.push(p); paragrafi.push(p);
          });
          capitoli.push(cap);
        });
        pronta = true;
      })
      .catch(e => { promessa = null; throw e; });
    return promessa;
  }

  const trova = num => paragrafi.find(p => p.num === num);

  /* "4.4-4.6", "1.8", "3.8, 3.9" -> paragrafi in ordine. Vuoto se qualcosa non esiste. */
  function intervallo(testo) {
    const out = [];
    for (const pezzo of String(testo || "").split(",")) {
      const [a, b] = pezzo.split("-").map(s => s.trim());
      const i = paragrafi.findIndex(p => p.num === a), j = b ? paragrafi.findIndex(p => p.num === b) : i;
      if (i < 0 || j < i) return [];
      out.push(...paragrafi.slice(i, j + 1));
    }
    return out;
  }

  const badge = e => e ? `<span class="etichetta ${ETICH[e] || ""}">${esc(e)}</span>` : "";
  const quantiLetti = ps => ps.filter(p => Store.letto(p.num)).length;

  function bottoneLetto(p) {
    return Store.letto(p.num)
      ? `<button type="button" class="btn done wide" data-letto="${p.num}" data-on="0">✓ Letto · tocca per annullare</button>`
      : `<button type="button" class="btn primary wide" data-letto="${p.num}" data-on="1">Segna come letto</button>`;
  }

  /* Per il piano: link ai paragrafi del giorno, quanti letti e pulsante. */
  function pianoHtml(g) {
    if (g.box === "trappola-deboli") return `<a href="${Diario.linkTrappola(Diario.deboli().map(v => v.argomento))}">${esc(g.teoria)}</a>`;   // js/diario.js
    if (g.box && FILTRI[g.box]) return `<a href="#teoria/${g.box}">${esc(g.teoria)}</a>`;
    if (!g.paragrafi) return esc(g.teoria || "—");
    const link = `<a href="#teoria/${encodeURIComponent(g.paragrafi)}">${esc(g.teoria || g.paragrafi)}</a>`;
    const ps = pronta ? intervallo(g.paragrafi) : [];
    if (!ps.length) return link;
    const n = quantiLetti(ps), tutti = n === ps.length, uno = ps.length === 1;
    return `${link}<span class="letti">Letti ${n} di ${ps.length}</span>
      <button type="button" class="btn small ${tutti ? "done" : ""}" data-letti="${esc(g.paragrafi)}" data-on="${tutti ? 0 : 1}">${tutti ? `✓ ${uno ? "Letto" : "Letti"} · annulla` : `Segna come ${uno ? "letto" : "letti"}`}</button>`;
  }

  function renderIndice(main) {
    if (!pronta) return attesa(main);
    let h = `<h1>Teoria</h1>
      <div class="btnrow"><a class="btn" href="#teoria/trappola">Box TRAPPOLA</a><a class="btn" href="#teoria/formula">Box FORMULA</a></div>
      <ul class="legenda">${indice.legenda.map(l => `<li>${badge(l.etichetta)} ${esc(l.testo)}</li>`).join("")}</ul>`;
    for (const c of capitoli) {
      h += `<section class="card"><h2>${esc(c.num)} ${esc(c.titolo)}</h2><p class="small muted">Letti ${quantiLetti(c.par)} di ${c.par.length}</p>
        <ul class="pars">${c.par.map(p => `<li><a href="#teoria/${p.num}"><span class="pn">${esc(p.num)}</span><span class="pt">${esc(p.titolo)} ${badge(p.etichetta)}</span>
          <span class="st ${Store.letto(p.num) ? "si" : ""}">${Store.letto(p.num) ? "✓ letto" : "da leggere"}</span></a></li>`).join("")}</ul></section>`;
    }
    h += `<p class="small muted">${esc(indice.fonte)}</p>`;
    main.innerHTML = h;
  }

  function renderLettura(main, arg) {
    if (!pronta) return attesa(main);
    const [base, solo] = arg.split("/");
    if (FILTRI[base]) return renderFiltro(main, base, solo);
    const ps = intervallo(arg);
    if (!ps.length) {
      main.innerHTML = `<p><a href="#teoria">← Teoria</a></p><p class="warn">Paragrafo «${esc(arg)}» non trovato.</p>`;
      return;
    }
    main.innerHTML = `<p class="indietro"><a href="#teoria">← Teoria</a></p>` +
      (ps.length > 1 ? `<p class="small muted">Paragrafi ${esc(ps[0].num)}-${esc(ps[ps.length - 1].num)} · letti ${quantiLetti(ps)} di ${ps.length}</p>` : "");
    const box = document.createElement("div");
    box.className = "teoria";
    for (const p of ps) {
      if (p.cap.intro && p.cap.par[0] === p) box.appendChild(p.cap.intro.cloneNode(true));
      box.appendChild(p.el.cloneNode(true));
      box.insertAdjacentHTML("beforeend", `<div class="btnrow letto">${bottoneLetto(p)}</div>`);
    }
    const dopo = paragrafi[paragrafi.indexOf(ps[ps.length - 1]) + 1];
    if (dopo) box.insertAdjacentHTML("beforeend", `<p class="succ"><a class="btn wide" href="#teoria/${dopo.num}">Successivo: ${esc(dopo.num)} ${esc(dopo.titolo)} →</a></p>`);
    main.appendChild(box);
    avvisoScorri(main);
  }

  /* solo: paragrafi a cui limitare il filtro (es. "1.8, 3.7"), per i box degli argomenti più deboli */
  function renderFiltro(main, tipo, solo) {
    const nome = FILTRI[tipo];
    let n = 0;
    const box = document.createElement("div");
    box.className = "teoria";
    const ammessi = solo ? new Set(intervallo(solo).map(p => p.num)) : null;
    for (const p of paragrafi) {
      if (ammessi && !ammessi.has(p.num)) continue;
      const trovati = p.el.querySelectorAll(`.box.${tipo}`);
      if (!trovati.length) continue;
      n += trovati.length;
      box.insertAdjacentHTML("beforeend", `<h3 class="filtro-par"><a href="#teoria/${p.num}">${esc(p.num)} ${esc(p.titolo)}</a></h3>`);
      trovati.forEach(b => box.appendChild(b.cloneNode(true)));
    }
    main.innerHTML = `<p class="indietro"><a href="#teoria">← Teoria</a></p><h1>Box ${nome}</h1><p class="small muted">${n} box, paragrafo per paragrafo${ammessi ? ` (solo i paragrafi ${esc(solo)}: <a href="#teoria/${tipo}">vedi tutti</a>)` : ""}. Tocca il titolo per aprire il paragrafo.</p>`;
    main.appendChild(box);
  }

  /* Figure più larghe dello schermo: si scorrono di lato. */
  function avvisoScorri(main) {
    requestAnimationFrame(() => main.querySelectorAll(".pannelli").forEach(p => {
      if (p.scrollWidth > p.clientWidth + 4 && !p.nextElementSibling?.classList.contains("fig-scorri"))
        p.insertAdjacentHTML("afterend", `<p class="fig-scorri">↔ Scorri la figura di lato per vederla tutta.</p>`);
    }));
  }

  function attesa(main) {
    main.innerHTML = `<h1>Teoria</h1><p>Caricamento…</p>`;
    carica().then(render).catch(() => {
      main.innerHTML = `<h1>Teoria</h1><p class="warn">Non riesco a leggere i file in <b>data/theory/</b>.</p>`;
    });
  }

  return { carica, pronta: () => pronta, intervallo, pianoHtml, renderIndice, renderLettura };
})();
