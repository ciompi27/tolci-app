# App TOLC-I: specifica del progetto

## Obiettivo
App web personale per preparare il **TOLC-I (CISIA) del 12 novembre 2026**: 1 ora di studio al giorno, domenica libera. Chi la usa viene da un istituto tecnico CAT (geometri). Deve dire che giorno è e cosa studiare, mostrare la teoria, ospitare pagine interattive e tenere il diario degli errori.

## Ruoli: cosa fa l'app e cosa no
- **L'app**: piano del giorno, teoria con le figure, pagine interattive, diario errori, conto alla rovescia.
- **The Faculty** (app esterna, gratuita): lì si fanno **tutti gli esercizi e le simulazioni**. L'app non li copia e non si collega a The Faculty: registra solo quanti esercizi ho fatto e quanti ne ho sbagliati, per argomento.
- **Libri Alfa Test** (esercizi svolti, 3800 quiz, 10 simulazioni): solo **a fine argomento**, come verifica (10-15 domande). Non vanno riprodotti nell'app. Il libro di teoria Alfa Test non si usa.

## Cosa c'è nel TOLC-I (fonte: sillabo CISIA 2026)
- 50 quesiti, 110 minuti: Matematica 20 (50'), Logica 10 (20'), Scienze 10 (20'), Comprensione verbale 10 (20').
- Punteggio: +1 giusta, 0 non data, -0,25 sbagliata.
- Inglese: 30 quesiti in 15', sezione separata, senza penalità. **Non inclusa** nell'app.
- **Matematica**: aritmetica e algebra (esponenziali, logaritmi, equazioni e disequazioni, sistemi, radicali), geometria piana e solida, geometria analitica e funzioni, trigonometria, statistica elementare (permutazioni, combinazioni, media, varianza, frequenza, istogrammi).
- **Scienze**: meccanica (grandezze, forze, lavoro, fluidi), ottica, termodinamica, elettromagnetismo, chimica (atomo e molecole, tavola periodica, simbologia, stechiometria e mole, chimica organica semplice, soluzioni e pH, ossidoriduzione).
- **Logica e Comprensione verbale**: domande attitudinali, nessuna teoria da studiare. Si allenano solo con esercizi.
- **NON sono nel TOLC-I: biologia e Scienze della Terra.** Il PDF di teoria ha una sezione 5 su questi argomenti: **non va inserita nell'app**.

## Materiali nella cartella
- `TOLC-I_teoria_con_figure.pdf`: la teoria (sezioni 1-4 e 6, con figure). La sezione 5 va esclusa.
- `Calendario_TOLC-I.pdf`: il piano giorno per giorno (stessa tabella qui sotto).
- `moduli_esistenti/logica_INT-1.html`: la pagina interattiva di logica (INT-1), già fatta e funzionante (890 righe, tutto in un file: teoria, generatori di esercizi, modalità Impara/Allenati, timer, ripasso risposte). Qualità buona: **è la base del modulo Logica**.

## Teoria nell'app (fase 2)
- Il PDF non va su GitHub (`.gitignore`): la teoria è stata convertita in `data/theory/`, un file HTML per capitolo (`1-matematica.html`, `2-logica.html`, `3-fisica.html`, `4-chimica.html`, `6-comprensione-verbale.html`) più `indice.json` (ordine dei file e legenda delle etichette).
- Ogni paragrafo è `<section class="par" data-par="4.4" data-titolo="…" data-etichetta="DA STUDIARE">`. Riquadri: `div.box.formula|trappola|esempio|sapere`, `figure.box.figura`. Segnalazioni: `span.verifica` (DA VERIFICARE).
- Testo e figure vengono dal PDF senza riscritture. Le figure sono ritagli PNG del PDF in `assets/figure/` (nome `capitolo-paragrafo-figura+pannello`, es. `1-2-1a.png`).
- **3.9 Ottica** è un paragrafo nuovo (etichetta NUOVO), con due figure SVG fatte a mano (`3-9-1a.svg`, `3-9-2a.svg`).
- In `plan.json` il campo `paragrafi` (es. `"4.4-4.6"`, `"3.8-3.9"`) collega il giorno ai paragrafi; il campo `box` (`"trappola"` o `"formula"`) apre il filtro dei box.
- Stato "letto" in localStorage, chiave `tolc-i:letti`, incluso nel backup JSON (versione 2; i backup della versione 1 si importano ancora).
- Se si aggiunge un file all'app va aggiunto alla lista `FILE` di `sw.js` e va cambiata `VERSIONE`.

## Regole per importare INT-1
- Non riscriverla e non cambiarne il comportamento: spostarla in `moduli/logica/` (index, css, js separati solo se il comportamento resta identico) e collegarla alla barra in basso e al piano.
- Unico difetto da correggere: carica **Atkinson Hyperlegible da Google Fonts** (non funziona offline). Scaricare il font e metterlo in `assets/fonts/` (formato woff2), oppure usare il font di sistema.
- Aggiungere solo il salvataggio: a fine quiz registrare in `localStorage` n. esercizi, n. errori, data. Il resto resta com'è.
- Mantenere il suo stile (variabili CSS `--bg`, `--accent` ecc., tema chiaro/scuro) come stile di tutta l'app.

## Regole di contenuto
- Correttezza prima di tutto. Il testo della teoria viene dal PDF e non si riscrive. Se un contenuto, un numero o una formula non sono sicuri, scrivere **DA VERIFICARE** invece di indovinare.
- Italiano, frasi brevi, punti chiave. Niente testo di riempimento.
- Gli esercizi generati dall'app calcolano la soluzione con il codice; le risposte sbagliate corrispondono a errori tipici reali (formula, segno, unità, caso dimenticato).
- Non aggiungere funzioni non richieste.

## Regole tecniche
- HTML, CSS e JavaScript semplici. Nessun framework, nessun server, nessun account.
- Si apre da `index.html` e funziona da telefono. Installabile (PWA) e offline.
- Dati (fatto/non fatto, esercizi, errori, punteggi) in `localStorage`. Pulsanti **esporta/importa JSON** (computer e telefono non condividono i dati).
- Mobile first, testo grande, massimo 3 colori, niente animazioni inutili.
- Data presa dal dispositivo (fuso Europe/Rome).
- Cartelle: `index.html`, `css/`, `js/`, `data/plan.json`, `data/theory/`, `moduli/`, `assets/`.
- Un commit git alla fine di ogni fase. Alla fine di ogni fase scrivere `TEST_FASE_N.md` con i controlli manuali fatti.

## Le 4 fasi
1. Scheletro, schermata "Oggi", piano, salvataggio, installabile.
2. Teoria dal PDF (senza sezione 5) + capitolo nuovo di ottica.
3. Pagine interattive: logica (importata), combinatoria e probabilità, mole e bilanciamento, circuiti.
4. Diario errori, simulazioni, backup, rifiniture.

## Piano giorno per giorno (da convertire in data/plan.json)
Legenda: **PDF** = sezione del PDF di teoria. **TF** = esercizi su The Faculty. Dopo ogni argomento finito: 10-15 domande dello stesso argomento dal libro Alfa Test.

| Data | Materia | Teoria (PDF) | Esercizi su TF |
|---|---|---|---|
| Lun 5 ott | Logica | 2.1-2.6 | logica |
| Mar 6 ott | Matematica | 1.8 combinatoria, probabilità, statistica | - |
| Mer 7 ott | Matematica | - | combinatoria, probabilità, statistica |
| Gio 8 ott | Chimica | 4.1-4.3 atomo, tavola, legami | atomo, tavola periodica, legami |
| Ven 9 ott | Chimica | 4.4-4.6 nomenclatura, mole, bilanciamento | stechiometria, bilanciamento |
| Sab 10 ott | Matematica (ripasso) | 1.1-1.7, solo box e figure; coniche e funzioni con attenzione | algebra, disequazioni, geometria |
| Dom 11 ott | PAUSA | | |
| Lun 12 ott | Fisica: meccanica | 3.1-3.5, cinematica con attenzione | meccanica |
| Mar 13 ott | Fisica | 3.6 calore, 3.7 elettricità e magnetismo | termodinamica, circuiti |
| Mer 14 ott | Fisica | 3.9 ottica (capitolo NUOVO), 3.8 onde | ottica, onde |
| Gio 15 ott | Chimica | 4.7-4.10 soluzioni, pH, ossidoriduzione, organica semplice | soluzioni, pH, ossidoriduzione |
| Ven 16 ott | Matematica | ripasso 1.8 | combinatoria, statistica |
| Sab 17 ott | Logica + Verbale | sez. 6 (15 min) | logica, comprensione verbale |
| Dom 18 ott | PAUSA | | |
| Lun 19 ott | Matematica | - | algebra, disequazioni, esponenziali e logaritmi |
| Mar 20 ott | Matematica | - | geometria piana e solida, geometria analitica |
| Mer 21 ott | Matematica | - | trigonometria, funzioni |
| Gio 22 ott | Fisica | - | meccanica, termodinamica |
| Ven 23 ott | Fisica | - | elettromagnetismo, ottica |
| Sab 24 ott | Chimica | - | tutti gli argomenti |
| Dom 25 ott | PAUSA | | |
| Lun 26 ott | Logica | - | logica |
| Mar 27 ott | Comprensione verbale | - | comprensione verbale |
| Mer 28 ott | Matematica | - | combinatoria e statistica |
| Gio 29 ott | Matematica | - | esercizi misti |
| Ven 30 ott | Scienze | - | fisica e chimica miste |
| Sab 31 ott | Ripasso errori | box TRAPPOLA degli argomenti con più errori | rifare gli errori del diario |
| Dom 1 nov | PAUSA | | |
| Lun 2 nov | Simulazione A: Matematica | - | 50 min a tempo vero |
| Mar 3 nov | Simulazione A: Logica, Scienze, Verbale | - | 3 x 20 min a tempo vero |
| Mer 4 nov | Correzione simulazione A | PDF sugli errori | - |
| Gio 5 nov | Simulazione B: Matematica | - | 50 min a tempo vero |
| Ven 6 nov | Simulazione B: Logica, Scienze, Verbale | - | 3 x 20 min a tempo vero |
| Sab 7 nov | Correzione simulazione B | PDF sugli errori | - |
| Dom 8 nov | PAUSA | | |
| Lun 9 nov | Simulazione C completa (circa 2 ore) | - | 110 min di fila |
| Mar 10 nov | Correzione simulazione C | tutti i box TRAPPOLA | - |
| Mer 11 nov | Ripasso leggero (30-45 min) | figure e box FORMULA | niente quiz nuovi |
| Gio 12 nov | **TOLC-I** | | |

I nomi degli argomenti di The Faculty sono indicativi: li correggo io a mano in `plan.json`. Un giorno non fatto resta "arretrato": l'app non sposta il piano da sola.
