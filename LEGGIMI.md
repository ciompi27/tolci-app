# App TOLC-I: come aprirla

L'app legge `data/plan.json`, quindi va aperta da un indirizzo web, non con doppio clic su `index.html`
(aperta come file il browser blocca la lettura e il funzionamento offline).

## Sul computer
Nella cartella dell'app:

```
python -m http.server 8000
```

Poi apri http://localhost:8000 nel browser.

## Sul telefono (installabile e offline)
Serve un indirizzo **https**. Il modo più semplice e gratuito è GitHub Pages:

1. Crea un repository su GitHub e carica il contenuto di questa cartella (`git push`).
2. Nel repository: Settings → Pages → Branch `main`, cartella `/ (root)` → Save.
3. Dopo un minuto l'app è su `https://<nome-utente>.github.io/<nome-repository>/`.
4. Aprila sul telefono:
   - Android (Chrome): menu ⋮ → **Installa app** (o "Aggiungi a schermata Home").
   - iPhone (Safari): Condividi → **Aggiungi alla schermata Home**.
5. Apri l'app una volta con internet: da lì funziona anche offline.

Con GitHub gratuito il repository è pubblico. I PDF sono esclusi da git (`.gitignore`).

## Dati
I dati (giorni fatti, esercizi, sessioni dei moduli) restano sul dispositivo.
Telefono e computer non li condividono: Piano → Backup dei dati → Esporta JSON su uno, Importa JSON sull'altro.
Su iPhone conviene usare l'app installata sulla schermata Home e fare un backup ogni tanto.

## Modificare il piano
Il piano è in `data/plan.json`. Per ogni giorno: `materia`, `teoria`, `esercizi` (argomenti di The Faculty,
uno per contatore), `nota`, `moduli`. Dopo una modifica, ricarica l'app (con internet).
