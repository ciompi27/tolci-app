# App TOLC-I: come si usa

App personale per preparare il TOLC-I del 12 novembre 2026: piano del giorno, teoria, pagine interattive,
diario degli errori, simulazioni. Gli esercizi e le simulazioni si fanno su **The Faculty**: l'app registra solo i risultati.

## Aprirla

L'app legge `data/plan.json`, quindi va aperta da un indirizzo web, non con doppio clic su `index.html`.

**Sul telefono (installabile e offline)** serve un indirizzo https. Il modo più semplice e gratuito è GitHub Pages:
1. Carica la cartella in un repository GitHub (`git push`).
2. Nel repository: Settings → Pages → Branch `main`, cartella `/ (root)` → Save.
3. Dopo un minuto l'app è su `https://<nome-utente>.github.io/<nome-repository>/`.
4. Sul telefono: Android (Chrome) menu ⋮ → **Installa app**; iPhone (Safari) Condividi → **Aggiungi alla schermata Home**.
5. Aprila una volta con internet: da lì funziona anche offline.

Con GitHub gratuito il repository è pubblico. I PDF sono esclusi da git (`.gitignore`).

**Sul computer**, nella cartella dell'app:
```
python -m http.server 8000
```
poi apri http://localhost:8000.

## Giorno per giorno

1. **Oggi** dice che giorno è, quanti giorni mancano e cosa studiare: teoria (tocca il link per aprire i paragrafi),
   esercizi su The Faculty, pagina interattiva del giorno.
2. Leggi la teoria e segna i paragrafi come **letti**.
3. Fai gli esercizi su The Faculty e scrivi nel **contatore** quanti ne hai fatti e quanti sbagliati, argomento per argomento.
4. Gli errori che vuoi ricordare li metti nel **diario** (barra in basso → Errori → "+ Aggiungi un errore"):
   argomento, dove, tipo di errore, una nota breve. Nei moduli, a fine sessione, "Aggiungi gli sbagliati al diario" lo fa da solo.
5. A fine giornata: **Segna come fatto**. Un giorno non fatto resta "arretrato": il piano non si sposta da solo.
6. Dopo ogni argomento finito: 10-15 domande dello stesso argomento dal libro Alfa Test.

**Ripasso degli errori** (31 ottobre, 4, 7 e 10 novembre): in Oggi ci sono il link al diario con gli errori da rifare e ai
box TRAPPOLA dei 3 argomenti più deboli. Quando rifai un errore: **Rifatto**; se lo sbagli ancora: **Sbagliato di nuovo**.

**Simulazioni** (2, 3, 5, 6 e 9 novembre): Oggi → Moduli → Simulazioni. Scegli la simulazione (A, B, C…) e la sezione,
oppure "Simulazione completa". Il timer usa le durate ufficiali e conta sull'orologio del telefono: se lo schermo si spegne,
il tempo continua giusto. Alla fine vibra (su Android) e scrive "Tempo scaduto"; con lo schermo spento te ne accorgi quando
riapri l'app. Poi scrivi giuste e sbagliate: l'app calcola il punteggio (+1, 0, −0,25) e il confronto tra le simulazioni.

La schermata **Errori** mostra anche le statistiche per argomento (esercizi fatti, sbagliati, % di errori, errori nel diario)
e i 3 argomenti più deboli.

## Backup

I dati restano sul dispositivo: telefono e computer non li condividono, e se si cancellano i dati del browser si perde tutto.
- **Piano → Backup dei dati → Condividi / salva il backup**: manda il file `tolc-backup-AAAA-MM-GG.json` su WhatsApp, Drive,
  email… Se il browser non sa condividere, il file viene scaricato.
- Se l'ultimo backup ha più di 7 giorni, Oggi lo ricorda con un pulsante.
- **Importa un backup**: mostra cosa contiene e chiede se **unire** (tiene i dati di qui e aggiunge quelli del file, senza doppioni)
  o **sostituire tutto** (restano solo i dati del file; chiede conferma). Vanno bene anche i backup delle versioni precedenti.
- Unione: per i contatori di uno stesso giorno e argomento vale il numero più alto dei due dispositivi.

Su iPhone conviene usare l'app installata sulla schermata Home e fare spesso il backup.

## Aggiornamenti

- La versione è scritta in fondo alla schermata Piano.
- Quando carichi su GitHub una versione nuova, all'apertura successiva compare **"Nuova versione disponibile"**:
  tocca **Aggiorna** e l'app si ricarica con i file nuovi.
- Per chi modifica l'app: a ogni modifica dei file va cambiato il numero in `js/versione.js`, e un file nuovo va aggiunto
  alla lista `FILE` di `sw.js`.

## Modificare il piano

Il piano è in `data/plan.json`. Per ogni giorno: `materia`, `teoria`, `paragrafi` (link alla teoria), `esercizi`
(argomenti di The Faculty, uno per contatore), `nota`, `moduli`. In cima ci sono le tabelle che collegano gli argomenti
ai paragrafi di teoria (`teoriaArgomenti`) e i sotto-temi dei moduli agli argomenti (`argomenti` di ogni modulo).
Dopo una modifica ricarica l'app con internet: il piano nuovo si vede subito.

## Prove automatiche

```
node test/esercizi.test.js
node test/app.test.js
```
