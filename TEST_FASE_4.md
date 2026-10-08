# Test fase 4: diario errori, simulazioni, backup, aggiornamenti, rifiniture

Controlli fatti l'8 ottobre 2026 nel browser integrato (Chromium), larghezza 360 px, tema chiaro e scuro,
con l'app servita da `python -m http.server` su http://localhost:8765. Molte azioni sono state fatte con script nella pagina
(clic veri sui pulsanti e sui campi). I dati di prova sono stati cancellati alla fine.

## Prove automatiche
- [x] `node test/app.test.js`: 49 controlli, nessun errore.
  - Punteggio +1 / 0 / −0,25 con casi noti: 20/0 → 20; 15/4 → 14; 0/10 → −2,5; 12/3 → 11,25; 7/3 → 6,25;
    simulazione completa 14 + 6,5 + 5 + 8 = 33,5. Più risposte che quesiti: rifiutato. Nomi A, B in ordine.
  - Backup delle fasi 1, 2 e 3 (versioni 1 e 2): accettati, anteprima giusta, importati. Fase 4: esporta e reimporta identico.
  - Unione: errori per id (vince il più aggiornato) e per chiave dei moduli, sessioni senza doppioni, simulazione A con
    Matematica da un dispositivo e Logica dall'altro, contatori al valore più alto, paragrafi letti uniti.
    Unire due volte lo stesso backup (e i dati con se stessi) non cambia niente.
  - Timer: dopo 60 secondi senza aggiornamenti (schermo spento) restano 49 minuti su 50; pausa a 10 minuti → 40;
    una pausa di 60 secondi non toglie tempo; ripresa → la fine si sposta di 60 secondi; scade all'ora di fine;
    simulazione completa 50, 20, 20, 20 minuti.
- [x] `node test/esercizi.test.js` (fase 3) ancora a posto dopo le modifiche ai moduli.

## Diario degli errori (schermata Errori)
- [x] Aggiungi: argomento (30 argomenti: quelli di The Faculty in plan.json più quelli collegati a teoria, moduli, simulazioni),
      dove, tipo, nota, data automatica. Senza tipo: "Scegli il tipo di errore". Argomento e "dove" restano quelli dell'ultimo inserimento.
- [x] Filtri per argomento, tipo e Tutti / Da rifare / Rifatti (combinati).
- [x] "Rifatto" → rifatto con la data; "Sbagliato di nuovo" → di nuovo da rifare, ricadute 1.
- [x] Modifica: modulo già compilato; la nota scritta resta anche se la pagina si ridisegna; dopo il salvataggio data originale invariata.
- [x] Elimina: con conferma; annullando non si cancella niente.
- [x] I 3 argomenti più deboli in cima (es. bilanciamento 100%, probabilità 67%, logica 50%) e tabella per argomento ordinata dal più debole.
- [x] Oggi il 31 ottobre e il 4, 7, 10 novembre (prova con `?data=`): link al diario già filtrato su "Da rifare" e ai box TRAPPOLA
      dei 3 argomenti più deboli (paragrafi 4.6, 1.8, 2.1-2.6 → 4 box). Il 31 ottobre anche il campo Teoria apre quei box;
      il 10 novembre ("tutti i box TRAPPOLA") apre tutti i 17 box.

## Moduli: "Aggiungi gli sbagliati al diario"
- [x] Logica (2 sbagliate), combinatoria (3), mole (3), circuiti (2): errori creati con argomento dell'app
      (es. "Albero di probabilità" → probabilità, "Bilanciamento" → bilanciamento), testo breve della domanda e risposta giusta.
- [x] Premuto due volte (anche ridisegnando il riepilogo): "Erano già nel diario", nessun doppione.
- [x] Per il resto i moduli si comportano come prima (riepilogo, revisione, salvataggio della sessione).

## Simulazioni
- [x] Voce "Simulazioni" nella sezione Moduli di Oggi e nei giorni 2, 3, 5, 6, 9 novembre; la barra in basso evidenzia Oggi.
- [x] Simulazione completa con timer accorciato (la fine spostata a pochi secondi): 4 sezioni, a ogni scadenza vibrazione
      (registrata 4 volte: 400-200-400-200-800 ms) e avviso "Tempo scaduto", poi la sezione successiva pronta (50:00, 20:00…).
- [x] Risultati per sezione con + e −: non date calcolate, punteggio in anteprima; totale 33,5 su 50 salvato.
- [x] Timer reale: avvia → dopo 2 s 19:58; pausa → resta 19:58 anche dopo 2,5 s; riprendi. Ricaricando la pagina il timer
      riparte dall'ora di fine (19:49 mostrato = 1189 s calcolati).
- [x] Chiudere un timer che corre chiede conferma.
- [x] Confronto: tabella A/B (A 33,5, B 39,5) e 5 grafici SVG (totale e sezioni) senza librerie.
- [x] "Aggiungi errore al diario" dalla simulazione: argomento suggerito dalla sezione (Scienze → fisica e chimica miste), dove = simulazione.

## Backup
- [x] Nome del file: `tolc-backup-2026-10-08.json`.
- [x] "Condividi / salva il backup": con la Web Share API (simulata nella prova) condivide il file JSON; se il browser non sa
      condividere file scarica il file; se la condivisione viene annullata lo dice e non segna il backup.
- [x] Promemoria in Oggi: compare con "mai" e con 8 giorni, non con 7; sparisce dopo il backup.
- [x] Importa: anteprima (giorni fatti, errori, sessioni, simulazioni, paragrafi letti) del file e del dispositivo.
- [x] "Unisci": 4 errori (3 dal file + 1 nuovo di qui); unendo di nuovo restano 4.
- [x] "Sostituisci tutto": chiede conferma; annullando non cambia niente; confermando restano solo i dati del file (backup della fase 1).
- [x] File non di questa app e file non JSON: messaggio di errore, nessuna modifica.

## Aggiornamenti
- [x] Versione in fondo al Piano ("v4"), dalla costante di `js/versione.js` usata anche dal service worker (cache `tolc-i-v4`).
- [x] Cambiata la versione per prova: con la pagina aperta compare "Nuova versione disponibile"; "Aggiorna" ricarica,
      in fondo al Piano c'è la versione nuova e la cache vecchia è cancellata. Poi riportata a v4.
- [x] Trovato e corretto: il browser dava a volte file vecchi dalla sua cache. Ora il service worker chiede sempre al server
      se un file è cambiato e usa la cache solo senza rete.

## Rifiniture (360 px)
- [x] Nessuno scorrimento orizzontale in Oggi, Piano, Teoria (indice, paragrafi, box TRAPPOLA), Errori (con e senza modulo
      aperto), Simulazioni (scelta e timer) e nei 4 moduli.
- [x] Aree di tocco ≥ 44 px per tutti i controlli dell'app (pulsanti, scelte, menu, voci del piano, barra in basso).
- [x] Contrasto (WCAG): minimo 5,2:1 nel tema chiaro e 6,1:1 nello scuro (testo, testo secondario, link, pulsanti, etichette).
- [x] Focus visibile da tastiera (contorno di 3 px), anche sulle scelte del diario.
- [x] Barra in basso con la voce attiva. Nessun testo segnaposto rimasto (Teoria, Errori).
- [x] Aggiunto spazio sotto "+ Aggiungi un errore"; tabella risultati e grafici sistemati per 360 px; avvisi visibili anche scorrendo.
- [x] `moduli_esistenti/` non toccata.

## Offline
- [x] Service worker v4: 94 file in cache, compresi `js/versione.js`, `js/diario.js`, `js/simulazioni.js`.
- [x] Server spento (verificato): diario (aggiunta di un errore), statistiche, timer, box TRAPPOLA, versione,
      modulo Circuiti con "Aggiungi gli sbagliati al diario" funzionano.

## Non verificato
- Telefono vero (Android e iPhone), Safari e Firefox.
- Vibrazione vera: provata solo come chiamata alla funzione. Su iPhone Safari la vibrazione non esiste.
- Con lo schermo spento o l'app in secondo piano il telefono non vibra allo scadere: lo si vede alla riapertura.
- Condivisione vera verso WhatsApp, Drive o email (nel test la Web Share API è simulata).
- Nei moduli logica e combinatoria alcuni pulsanti e menu originali sono alti 40-43 px (sotto 44): non toccati, per non
  cambiare i moduli esistenti.
