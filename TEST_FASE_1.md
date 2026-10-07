# Test fase 1

Controlli fatti il 7 ottobre 2026 nel browser integrato (Chromium), vista telefono 375×812,
con l'app servita da `python -m http.server` su http://localhost:8765.
Le sessioni di quiz sono state completate con clic automatici (script nella pagina), non a mano.

Per ripetere i controlli su un'altra data: aggiungere `?data=AAAA-MM-GG` all'indirizzo, per esempio
`index.html?data=2026-11-12`.

## Piano (data/plan.json)
- [x] 39 giorni, dal 5 ottobre al 12 novembre, nessun buco.
- [x] Il giorno della settimana di ogni data coincide con la tabella di CLAUDE.md (controllo con script).
- [x] Pause solo di domenica (5); 12 novembre = TOLC-I.

## Schermata Oggi
- [x] Data di oggi in italiano, fuso Europe/Rome: "Mercoledì 7 ottobre 2026".
- [x] Conto alla rovescia: 36 giorni al TOLC-I.
- [x] Materia, teoria PDF, esercizi su The Faculty del giorno; link al modulo Combinatoria.
- [x] Contatore: +/− e numero scritto a mano; totale aggiornato; gli sbagliati non superano i fatti
      (4 clic su "sbagliati +" con 3 fatti → resta 3).
- [x] "Segna come fatto" → stato "fatto"; ritocco → annullato.
- [x] Avviso dei giorni arretrati con link al piano.
- [x] Sezione Moduli con i due moduli.
- [x] Date fuori dal piano:
  - 30 settembre: "Il piano non è ancora iniziato", si parte fra 5 giorni.
  - 11 ottobre (domenica): pausa.
  - 11 novembre: "Domani c'è il TOLC-I".
  - 12 novembre: "Oggi c'è il TOLC-I" (senza elenco degli arretrati).
  - 20 novembre: "Il piano è finito", giorni di studio fatti su 33.

## Schermata Piano
- [x] Tutti i giorni con stato: fatto / arretrato / da fare / pausa (+ esame il 12 novembre).
- [x] All'apertura è aperto il giorno di oggi; aprendo un altro giorno il precedente si chiude.
- [x] Un giorno passato non fatto resta "arretrato" (5 e 6 ottobre); segnato come fatto dal piano diventa "fatto".
- [x] Il piano non si sposta: le date restano quelle di plan.json.

## Salvataggio, esporta, importa
- [x] Contatori e "fatto" salvati in localStorage (`tolc-i:giorni`), ritrovati dopo il ricaricamento.
- [x] Esporta: crea `tolc-i-backup-2026-10-07.json` con giorni e sessioni
      (nel test il download è stato intercettato, il file non è stato salvato su disco).
- [x] Importa: dopo aver cancellato i dati, l'importazione del file chiede conferma e ripristina tutto.
- [x] Importa un JSON che non è un backup → messaggio "Il file non è un backup di questa app."

## Moduli
- [x] Logica (INT-1): si apre, font Atkinson Hyperlegible caricato da `assets/fonts/`, nessuna richiesta a siti esterni.
- [x] Logica: quiz da 10 completato → salvato "10 esercizi, 7 errori", uguale al riepilogo del modulo
      (giuste 2, sbagliate 7, non date 1).
- [x] Logica: quiz chiuso con "Termina" dopo 3 risposte → salvate 3 risposte; chiuso subito senza risposte → niente salvato.
- [x] Combinatoria: sessione da 5 completata → salvato "5 esercizi, 1 errore", uguale al riepilogo
      (3 giuste, 1 sbagliata, 1 non data), con il dettaglio per argomento.
- [x] Pulsante "← Indietro": torna alla schermata dell'app da cui si è partiti.
- [x] In Oggi compare "Nei moduli oggi" con esercizi ed errori delle sessioni.
- [x] Differenze con i file originali (`diff`): solo font locale, barra Indietro, file `../modulo.js` e `../modulo.css`,
      chiamata di salvataggio a fine quiz. Nient'altro cambiato.

## Offline (PWA)
- [x] Service worker attivo, 18 file in cache (app, piano, font, icone, entrambi i moduli).
- [x] Server spento (verificato: non risponde) → Oggi, Piano, modulo Logica e modulo Combinatoria si aprono lo stesso.
- [x] Offline: sessione di Logica completata e salvata.
- [x] Manifest valido (JSON), icone 192 e 512 px, tema chiaro e scuro.

## Non verificato
- Installazione vera su telefono Android e iPhone (serve l'indirizzo https, vedi LEGGIMI.md).
- Apertura con doppio clic su index.html: deve comparire il messaggio "aprila da un indirizzo web".
- Timer dei moduli fino allo scadere (stesso salvataggio di "Termina", non atteso il tempo reale).
- Firefox e Safari.
