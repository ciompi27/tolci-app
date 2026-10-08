# Test fase 3: moduli Mole e Circuiti

Controlli fatti l'8 ottobre 2026 nel browser integrato (Chromium), larghezza telefono 390 px, tema chiaro e scuro,
con l'app servita da `python -m http.server` su http://localhost:8765.
Le sessioni sono state completate con clic automatici (script nella pagina).

## Prova automatica (`node test/esercizi.test.js`)
- [x] 200 esercizi per ogni tipo: mole (massa molare, grammi ↔ moli, bilanciamento, problemi stechiometrici)
      e circuiti (legge di Ohm, serie, parallelo, misto, potenza, partitore).
- [x] Per ogni esercizio: 5 risposte, una sola giusta, nessuna risposta ripetuta, nessun distrattore uguale alla
      soluzione, niente NaN / undefined / Infinity, tutti i valori positivi.
- [x] La soluzione è ricalcolata con codice indipendente da quello del modulo (masse molari con un altro modo di
      contare gli atomi; formule di Ohm, serie, parallelo, potenza, partitore riscritte nella prova).
- [x] Bilanciamento: la risposta giusta è l'unica che bilancia la reazione; nessun distrattore è bilanciato.
- [x] Reazioni del modulo mole: 32 su 32 bilanciabili in un solo modo, coefficienti minimi.
- [x] Calcolo del circuito interattivo: 5 circuiti di prova (serie, parallelo, misto) con risultati noti.
- [x] La prova trova davvero gli errori: con difetti messi apposta in una copia dei moduli (massa molare sbagliata,
      potenza raddoppiata, parallelo sommato come serie) segnala decine di errori.

## Soluzioni controllate a mano (campione)
- [x] H₂O 18 g/mol; Fe₂O₃ (2 × 56) + (3 × 16) = 160 g/mol; 200 g di NaOH = 5 mol; 5 mol di NH₃ = 85 g.
- [x] N₂ + 3 H₂ → 2 NH₃; 2 Na + Cl₂ → 2 NaCl; C₄H₁₀: 2, 13, 8, 10.
- [x] 19,5 g di Al(OH)₃ → 0,25 mol → 0,75 mol di H₂O → 13,5 g; 61,25 g di KClO₃ → 0,5 mol → 37,25 g di KCl.
- [x] 8 V / 10 kΩ = 0,8 mA; 3 + 5 + 2 Ω con 3 V → 0,3 A; 20 ∥ 60 Ω = 15 Ω; 40 + (20 ∥ 20) = 50 Ω;
      8 + (8 ∥ 2) = 9,6 Ω con 36 V → 3,75 A; 9² / 6 = 13,5 W; partitore 36 V × 40 / 60 = 24 V.

## Modulo Mole (`moduli/mole/`)
- [x] Si apre senza errori; font Atkinson locale; pulsante "← Indietro".
- [x] Impara: punti chiave dai paragrafi 4.5-4.6 del PDF (mole, Avogadro, massa molare, n = m/M, 22,4 L a 0 °C e 1 atm,
      rapporti tra moli, reagente limitante), tre esempi guidati del PDF, tabella delle masse con DA VERIFICARE.
- [x] Widget di bilanciamento: con + e − conta gli atomi per elemento, segna ✓ / ✗, dice quali non tornano;
      2, 4, 2, 4 per il metano → "bilanciata, ma si può dividere per 2"; "Mostra la soluzione" → 1, 2, 1, 2.
- [x] Widget catena: 32 g di CH₄ → 2 mol → 2 mol di CO₂ → 88 g; con 8 g → 22 g.
- [x] Sessione di 5 domande completata: riepilogo con punteggio, tabella per argomento, revisione delle risposte.
- [x] Timer: 5 domande → 10:00; allo scadere "Tempo scaduto" e salvataggio.
- [x] Salvataggio in `tolc-i:sessioni` con esercizi, errori, giuste, non date, punti e argomenti per sotto-tema.

## Modulo Circuiti (`moduli/circuiti/`)
- [x] Si apre senza errori; pulsante "← Indietro".
- [x] Impara: punti chiave dal 3.7 del PDF (analogia idraulica, Ohm, serie, parallelo, potenza, effetto Joule,
      apparecchi di casa in parallelo) e prefissi m e k dal 3.1. Energia e kWh non ci sono: nel PDF mancano.
- [x] Circuito interattivo nelle 5 configurazioni: resistenza equivalente, corrente totale, tensione e corrente su ogni
      resistore, disegno SVG con i valori (es. 6 + (6 ∥ 12) = 10 Ω, 1,2 A, 7,2 V e 4,8 V).
- [x] Corretto durante la prova: con 2 resistori il campo R₃ restava visibile.
- [x] Domande con lo schema del circuito disegnato; sessione completata, salvata, revisione con le figure.

## Collegamenti
- [x] `plan.json`: mole il 9 e il 24 ottobre, circuiti il 13 e il 23 ottobre (link nel dettaglio dei giorni).
- [x] Sezione "Moduli" di Oggi: 4 moduli.
- [x] In Oggi, "Nei moduli oggi" mostra le sessioni di mole e circuiti con esercizi ed errori.
- [x] Teoria: in 3.7 "cambia verso 100 volte al secondo", senza segnalazione; in 6.4 "Correlazione scambiata per causa",
      senza segnalazione.

## Offline
- [x] Service worker `tolc-i-v3`, 91 file in cache, compresi i due moduli nuovi.
- [x] Server spento (verificato): i due moduli si aprono, una sessione per modulo si completa e si salva,
      e le sessioni compaiono in Oggi.

## Non verificato
- Prova su telefono vero e su Safari / Firefox.
- Le masse atomiche diverse da H, C, O (DA VERIFICARE con la tavola del libro).
