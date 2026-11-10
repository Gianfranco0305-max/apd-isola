# Gestione contenuti APD Isola

## Accesso redazione
Aprire `/admin/` per i collegamenti rapidi al repository. **Non è un pannello autenticato**: chiunque può vedere questa pagina, ma solo gli utenti autorizzati da GitHub possono modificare i file.

## Aggiornare il sito
1. Aprire `content/site.json` su GitHub e premere Edit.
2. Modificare i campi JSON senza eliminare virgole o virgolette.
3. Premere Commit changes.
4. Attendere la distribuzione di GitHub Pages.

## Campi
- `schedule`: team, days, time, venue.
- `matches`: title, date, description.
- `news`: title, date, description.
- `documents`: title, url (es. `./documents/modulo.pdf`).

Non pubblicare dati personali, elenchi atleti, recapiti privati o moduli compilati. Per la pubblicazione di fotografie di minori servono autorizzazioni appropriate.

## Contatti
Il form usa `mailto:` e non trasmette automaticamente i dati. Un form server-side sarà una fase separata.

## Pubblicazione
Settings > Pages > Deploy from a branch > main > root.
