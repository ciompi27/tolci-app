/* Prova automatica della fase 4: punteggio delle simulazioni, backup vecchi, unione senza doppioni, timer.
   Uso: node test/app.test.js
   Carica js/store.js e js/simulazioni.js in un ambiente con un localStorage finto. */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");

let errori = 0, prove = 0;
function ok(cond, msg) { prove++; if (!cond) { errori++; console.log("  ERRORE: " + msg); } }
const uguale = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function ambiente() {
  const dati = {};
  const localStorage = {
    getItem: k => (k in dati ? dati[k] : null), setItem: (k, v) => { dati[k] = String(v); }, removeItem: k => { delete dati[k]; }
  };
  const ctx = vm.createContext({ localStorage, console, Date, Math, JSON });
  const js = f => fs.readFileSync(path.join(__dirname, "..", "js", f), "utf8");
  vm.runInContext(js("store.js") + "\n" + js("simulazioni.js") + "\n;globalThis.__T = { Store, Timer, punteggio, totaleSim, SIM_SEZIONI };", ctx);
  return { T: ctx.__T, dati };
}

/* ---------- 1. punteggio +1 / 0 / −0,25 ---------- */
console.log("Punteggio");
{
  const { T } = ambiente();
  const casi = [[{ giuste: 20, sbagliate: 0 }, 20], [{ giuste: 15, sbagliate: 4 }, 14], [{ giuste: 0, sbagliate: 10 }, -2.5],
    [{ giuste: 12, sbagliate: 3 }, 11.25], [{ giuste: 0, sbagliate: 0 }, 0], [{ giuste: 7, sbagliate: 3 }, 6.25]];
  for (const [r, atteso] of casi) ok(T.punteggio(r) === atteso, `punteggio(${r.giuste} giuste, ${r.sbagliate} sbagliate) = ${T.punteggio(r)}, atteso ${atteso}`);
  const sim = { sezioni: { mat: { giuste: 15, sbagliate: 4 }, log: { giuste: 7, sbagliate: 2 }, sci: { giuste: 6, sbagliate: 4 }, ver: { giuste: 8, sbagliate: 0 } } };
  ok(T.totaleSim(sim) === 33.5, `totale simulazione = ${T.totaleSim(sim)}, atteso 33,5 (14 + 6,5 + 5 + 8)`);
  ok(T.SIM_SEZIONI.reduce((s, z) => s + z.quesiti, 0) === 50 && T.SIM_SEZIONI.reduce((s, z) => s + z.minuti, 0) === 110, "sezioni: 50 quesiti, 110 minuti");
  /* le sezioni salvate: non date calcolate, e più risposte dei quesiti non si possono salvare */
  const s = T.Store.nuovaSimulazione("2026-11-02");
  ok(s && s.nome === "A", "prima simulazione chiamata A");
  ok(T.Store.salvaSezione(s.id, "mat", { giuste: 15, sbagliate: 4 }, "2026-11-02"), "sezione salvata");
  ok(T.Store.simulazioni()[0].sezioni.mat.nonDate === 1, "non date = 20 − 15 − 4 = 1");
  ok(!T.Store.salvaSezione(s.id, "log", { giuste: 8, sbagliate: 5 }, "2026-11-03"), "13 risposte su 10 quesiti: rifiutato");
  ok(T.Store.nuovaSimulazione("2026-11-05").nome === "B", "seconda simulazione chiamata B");
}

/* ---------- 2. backup delle fasi 1, 2, 3 e 4 ---------- */
console.log("Backup vecchi");
{
  const fase1 = { app: "TOLC-I", versione: 1, esportatoIl: "2026-10-07T20:00:00Z",
    giorni: { "2026-10-05": { fatto: true, fattoIl: "2026-10-05" }, "2026-10-07": { esercizi: { combinatoria: { fatti: 3, sbagliati: 3 } } } },
    sessioni: [{ modulo: "logica", data: "2026-10-07", ora: "2026-10-07T20:05:36.953Z", esercizi: 10, errori: 7, argomenti: { Sillogismi: { esercizi: 2, errori: 2 } } }] };
  const fase2 = { ...fase1, versione: 2, letti: { "2.1": "2026-10-07", "4.4": "2026-10-09" } };
  const fase3 = { ...fase2, sessioni: [...fase2.sessioni, { modulo: "mole", data: "2026-10-08", ora: "2026-10-08T13:03:54Z", esercizi: 5, errori: 4, argomenti: {} }] };
  for (const [nome, b, sess, letti] of [["fase 1", fase1, 1, 0], ["fase 2", fase2, 1, 2], ["fase 3", fase3, 2, 2]]) {
    const { T } = ambiente();
    const p = T.Store.controlla(JSON.parse(JSON.stringify(b)));
    ok(!p.errore, `${nome}: accettato`);
    const a = T.Store.anteprima(p);
    ok(a.giorniFatti === 1 && a.sessioni === sess && a.letti === letti && a.errori === 0 && a.simulazioni === 0, `${nome}: anteprima ${JSON.stringify(a)}`);
    ok(T.Store.importa(p, "sostituisci"), `${nome}: importato`);
    ok(T.Store.giorno("2026-10-05").fatto === true && T.Store.contatore("2026-10-07", "combinatoria").fatti === 3, `${nome}: dati letti dopo l'importazione`);
  }
  const { T } = ambiente();
  ok(T.Store.controlla({ ciao: 1 }).errore, "file che non è un backup: rifiutato");
  /* fase 4: esporta e reimporta, uguale */
  T.Store.impostaFatto("2026-10-09", true, "2026-10-09");
  T.Store.salvaErrore({ data: "2026-10-09", argomento: "stechiometria", dove: "tf", tipo: "calcolo", nota: "moli e grammi" });
  T.Store.salvaSezione(T.Store.nuovaSimulazione("2026-11-02").id, "mat", { giuste: 10, sbagliate: 6 }, "2026-11-02");
  const esportato = JSON.parse(JSON.stringify(T.Store.esporta()));
  const B = ambiente().T;
  const p = B.Store.controlla(esportato);
  ok(B.Store.importa(p, "sostituisci"), "fase 4: importato");
  ok(uguale(B.Store.errori(), T.Store.errori()) && uguale(B.Store.simulazioni(), T.Store.simulazioni()) && uguale(B.Store.giorni(), T.Store.giorni()), "fase 4: dopo esporta e importa i dati sono identici");
}

/* ---------- 3. unione senza doppioni ---------- */
console.log("Unione");
{
  const { T } = ambiente(), S = T.Store;
  const a = S.controlla({ app: "TOLC-I", versione: 3,
    giorni: { "2026-10-07": { fatto: true, fattoIl: "2026-10-08", esercizi: { combinatoria: { fatti: 5, sbagliati: 2 } } } },
    sessioni: [{ modulo: "logica", data: "2026-10-07", ora: "T1", esercizi: 10, errori: 3 }],
    letti: { "1.1": "2026-10-10" },
    errori: [{ id: "e1", data: "2026-10-07", argomento: "logica", dove: "tf", tipo: "regola", nota: "vecchia", stato: "darifare", aggiornato: "2026-10-07T10:00:00Z" },
      { id: "e2", data: "2026-10-07", argomento: "probabilità", dove: "modulo", tipo: "altro", nota: "x", stato: "darifare", chiave: "combinatoria|2026-10-07|abc", aggiornato: "2026-10-07T10:00:00Z" }],
    simulazioni: [{ id: "s1", nome: "A", creata: "2026-11-02", sezioni: { mat: { giuste: 10, sbagliate: 4, data: "2026-11-02", aggiornato: "2026-11-02T10:00:00Z" } }, aggiornato: "2026-11-02T10:00:00Z" }] });
  const b = S.controlla({ app: "TOLC-I", versione: 3,
    giorni: { "2026-10-07": { fatto: true, fattoIl: "2026-10-07", esercizi: { combinatoria: { fatti: 4, sbagliati: 3 }, statistica: { fatti: 6, sbagliati: 1 } } }, "2026-10-08": { fatto: true, fattoIl: "2026-10-08" } },
    sessioni: [{ modulo: "logica", data: "2026-10-07", ora: "T1", esercizi: 10, errori: 3 }, { modulo: "mole", data: "2026-10-08", ora: "T2", esercizi: 5, errori: 1 }],
    letti: { "1.1": "2026-10-09", "1.2": "2026-10-10" },
    errori: [{ id: "e1", data: "2026-10-07", argomento: "logica", dove: "tf", tipo: "regola", nota: "nuova", stato: "rifatto", rifattoIl: "2026-10-12", aggiornato: "2026-10-12T10:00:00Z" },
      { id: "e9", data: "2026-10-07", argomento: "probabilità", dove: "modulo", tipo: "altro", nota: "x", stato: "darifare", chiave: "combinatoria|2026-10-07|abc", aggiornato: "2026-10-07T10:00:00Z" },
      { id: "e3", data: "2026-10-08", argomento: "stechiometria", dove: "alfa", tipo: "calcolo", nota: "", stato: "darifare", aggiornato: "2026-10-08T10:00:00Z" }],
    simulazioni: [{ id: "s1", nome: "A", creata: "2026-11-02", sezioni: { log: { giuste: 6, sbagliate: 2, data: "2026-11-03", aggiornato: "2026-11-03T10:00:00Z" } }, aggiornato: "2026-11-03T10:00:00Z" },
      { id: "s2", nome: "B", creata: "2026-11-05", sezioni: {}, aggiornato: "2026-11-05T10:00:00Z" }] });
  const u = S.unisci(a, b);
  ok(u.errori.length === 3, `errori: ${u.errori.length}, attesi 3 (e1 aggiornato, e2 con la stessa chiave di e9, e3 nuovo)`);
  ok(u.errori.find(e => e.id === "e1").nota === "nuova" && u.errori.find(e => e.id === "e1").stato === "rifatto", "per lo stesso errore vale la versione più aggiornata");
  ok(u.sessioni.length === 2, `sessioni: ${u.sessioni.length}, attese 2`);
  ok(u.simulazioni.length === 2 && Object.keys(u.simulazioni.find(s => s.id === "s1").sezioni).sort().join() === "log,mat", "simulazione A: Matematica da un dispositivo, Logica dall'altro");
  const c = u.giorni["2026-10-07"].esercizi;
  ok(c.combinatoria.fatti === 5 && c.combinatoria.sbagliati === 3 && c.statistica.fatti === 6, `contatori: ${JSON.stringify(c)}`);
  ok(u.giorni["2026-10-07"].fattoIl === "2026-10-07" && u.giorni["2026-10-08"].fatto, "giorni fatti: unione, con la data più vecchia");
  ok(u.letti["1.1"] === "2026-10-09" && u.letti["1.2"] === "2026-10-10", "paragrafi letti: unione");
  const u2 = S.unisci(u, b);
  ok(uguale(u2, u), "unire due volte lo stesso backup non cambia niente");
  ok(uguale(S.unisci(u, u), u), "unire i dati con se stessi non cambia niente");
  /* importa "unisci" su localStorage */
  S.importa(a, "sostituisci");
  S.importa(b, "unisci"); S.importa(b, "unisci");
  ok(S.errori().length === 3 && S.sessioni().length === 2 && S.simulazioni().length === 2, "importa \"unisci\" due volte: nessun doppione");
}

/* ---------- 4. timer dall'ora di fine ---------- */
console.log("Timer");
{
  const { T } = ambiente(), M = 60000, t0 = 1_800_000_000_000;
  let t = T.Timer.nuovo("s1", ["mat"]);
  ok(t.durata === 50 * M && T.Timer.residuo(t, t0) === 50 * M, "Matematica: 50 minuti");
  t = T.Timer.avvia(t, t0);
  ok(t.fine === t0 + 50 * M, "avviato: ora di fine = adesso + 50 minuti");
  ok(T.Timer.residuo(t, t0 + 60000) === 49 * M, "dopo 60 secondi senza aggiornamenti (schermo spento): restano 49 minuti");
  t = T.Timer.pausa(t, t0 + 10 * M);
  ok(t.stato === "pausa" && t.residuo === 40 * M, "pausa dopo 10 minuti: restano 40 minuti");
  ok(T.Timer.residuo(t, t0 + 11 * M) === 40 * M, "durante una pausa di 60 secondi il tempo non scende");
  t = T.Timer.avvia(t, t0 + 11 * M);
  ok(t.fine === t0 + 51 * M, "ripreso dopo 60 secondi di pausa: la fine si sposta di 60 secondi");
  ok(T.Timer.residuo(t, t0 + 16 * M) === 35 * M, "5 minuti dopo la ripresa: restano 35 minuti");
  ok(T.Timer.scade(t, t0 + 50 * M).stato === "corre", "prima della fine non scade");
  const s = T.Timer.scade(t, t0 + 51 * M);
  ok(s.stato === "scaduto" && T.Timer.residuo(s, t0 + 52 * M) === 0, "all'ora di fine: scaduto, tempo 0");
  ok(T.Timer.azzera(t).residuo === 50 * M && T.Timer.azzera(t).stato === "pronto", "azzera: di nuovo 50 minuti");
  /* simulazione completa: passa alla sezione successiva */
  let c = T.Timer.nuovo("s1", ["mat", "log", "sci", "ver"]);
  const durate = [c.durata];
  while ((c = T.Timer.prossima(c))) durate.push(c.durata);
  ok(uguale(durate, [50 * M, 20 * M, 20 * M, 20 * M]), `completa: ${durate.map(d => d / M).join(", ")} minuti`);
}

console.log(errori ? `\n${errori} ERRORI su ${prove} controlli` : `\nTutto a posto: ${prove} controlli, nessun errore.`);
process.exit(errori ? 1 : 0);
