# Test fase 2: la teoria

Controlli fatti il 7 ottobre 2026 nel browser integrato (Chromium), con l'app servita da
`python -m http.server` su http://localhost:8765. Larghezza telefono (390 px) e computer, tema chiaro e scuro.
I giri su tutti i paragrafi e su tutti i link del piano sono stati fatti con uno script nella pagina.

## Conversione dal PDF
- [x] Pagine usate: 2-18 e 21 (sezioni 1, 2, 3, 4, 6). Escluse la copertina, le pagine 19-20 (sezione 5)
      e la "mappa del documento" di pagina 2. La legenda delle etichette (pagina 1) è nella schermata Teoria.
- [x] Testo estratto in automatico dal PDF (non ricopiato a mano): grassetti, apici e pedici presi dalla
      posizione e dalla dimensione dei caratteri; a capo del PDF distinti dagli a capo voluti.
- [x] Conteggi uguali al PDF: 22 FORMULA, 16 TRAPPOLA, 24 ESEMPIO, 31 DA SAPERE, 22 FIGURA, 14 tabelle,
      57 voci di elenco, 16 sottotitoli. Nell'app ci sono in più solo i box e le voci del 3.9 Ottica.
- [x] Confronto a vista con le immagini delle pagine del PDF, paragrafo per paragrafo.
- [x] Correzioni di resa trovate e sistemate: esponente annidato a^(log_a x) in 1.3; v0² (pedice e apice sovrapposti)
      in 3.2; m² in "pascal" (3.1); etichetta "F sin θ" che usciva dal pannello in 3.2.
- [x] Nessun carattere illeggibile (�) nei file.
- [x] Simboli controllati: √, ⇒, ⇔, ≤, ≥, ≠, ≈, ∧, ∨, ¬, ∩, ∪, ±, ∓, ⊥, Δ, Σ, θ, λ, μ, π, ℓ, °, ½, apici e pedici.

## Nessun contenuto della sezione 5
- [x] Paragrafi presenti: 1.1-1.8, 2.1-2.6, 3.1-3.9, 4.1-4.10, 6.1-6.4 (37). Nessun 5.x.
- [x] Ricerca di parole della sezione 5 (cellula, mitosi, genetica, rocce, atmosfera, stagioni, metabolismo):
      nessuna. "DNA" e "fotosintesi" compaiono solo dove li cita la chimica (4.10 biomolecole, 4.6 endotermica).

## Schermata Teoria
- [x] Elenco dei 5 capitoli e dei 37 paragrafi con etichetta (RIPASSO / DA RINFRESCARE / DA STUDIARE / NUOVO)
      e stato "da leggere" / "✓ letto"; "Letti N di M" per capitolo.
- [x] Ogni paragrafo si apre (37 su 37), con titolo giusto, box, tabelle e pulsante "Segna come letto".
- [x] Figure: 64 immagini (62 ritagli PNG + 2 SVG), tutte caricate, nessuna rotta.
- [x] Le figure larghe (albero 1.8, diagramma "Quale formula uso?", spettro, pH, combustione) si scorrono di lato
      sul telefono, con la scritta "Scorri la figura di lato"; le altre stanno nella larghezza dello schermo.
- [x] Le tabelle larghe si scorrono di lato senza allargare la pagina.
- [x] Tema scuro: testo e box leggibili, figure su fondo bianco leggermente attenuato.
- [x] "Successivo" porta al paragrafo dopo; "← Teoria" torna all'elenco.

## "Letto"
- [x] "Segna come letto" in un paragrafo → salvato in `tolc-i:letti` con la data; ritocco → annullato.
- [x] Dopo il ricaricamento della pagina il paragrafo risulta ancora letto.
- [x] Esporta JSON (versione 2) contiene `letti`; importandolo tornano i paragrafi letti.
- [x] Un backup della fase 1 (senza `letti`) si importa ancora.

## Collegamento al piano
- [x] In Oggi e nel dettaglio di ogni giorno il campo Teoria è un link, con "Letti N di M" e il pulsante
      "Segna come letti" (prova con `?data=2026-10-09`: 4.4-4.6, segnati tutti e tre, poi annullati).
- [x] Ogni link del piano porta ai paragrafi giusti:
  - 5 ott → 2.1-2.6 · 6 ott → 1.8 · 8 ott → 4.1-4.3 · 9 ott → 4.4-4.6 · 10 ott → 1.1-1.7
  - 12 ott → 3.1-3.5 · 13 ott → 3.6-3.7 · 14 ott → 3.8 e 3.9 (ottica) · 15 ott → 4.7-4.10
  - 16 ott → 1.8 · 17 ott → 6.1-6.4
  - 31 ott e 10 nov → box TRAPPOLA (17) · 11 nov → box FORMULA (26)
  - 4 e 7 nov ("PDF sugli errori"): nessun link, dipende dagli errori fatti.

## Filtri
- [x] "Box TRAPPOLA": 17 box, ognuno sotto il titolo del suo paragrafo (link al paragrafo).
- [x] "Box FORMULA": 26 box.

## 3.9 Ottica (nuovo)
- [x] Riflessione, rifrazione e legge di Snell, indice di rifrazione, riflessione totale, specchi piani e sferici,
      lenti sottili, punti coniugati, ingrandimento. Box DA SAPERE, FORMULA, ESEMPIO, TRAPPOLA come il resto.
- [x] Conti rifatti: sin θ₂ = 0,707/1,5 = 0,471 → 28,1°; angolo limite acqua 48,8°, vetro 41,8°;
      lente f = 10 cm, p = 30 cm → q = 15 cm, G = −0,5; le due figure SVG sono disegnate con questi numeri.

## Offline
- [x] Service worker `tolc-i-v2`: 89 file in cache (6 file di teoria, 64 figure); la cache v1 è stata cancellata.
- [x] Server spento (verificato: non risponde) → elenco, tutti i 37 paragrafi, tutte le 64 figure, filtro TRAPPOLA
      e "Segna come letto" funzionano.

## Fase 1 ancora a posto
- [x] Oggi, Piano, contatori, "fatto", esporta/importa provati di nuovo dopo le modifiche.

## Non verificato
- Prova su telefono vero (Android e iPhone) e su Firefox e Safari.
- Leggibilità delle figure più larghe su uno schermo piccolo vero: nel browser integrato il testo delle figure
  scorrevoli è piccolo (circa 6-8 px); si può ingrandire con due dita.
