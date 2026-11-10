# APD Isola — gestione editoriale

Il sito è ospitato su GitHub Pages (statico). Il pannello pubblico `/admin/` è un editor locale, **non** un'area privata con login e **non** pubblica automaticamente. La pubblicazione richiede un account GitHub autorizzato al repository.

## Aggiornare notizie, partite, orari e documenti

1. Apri `https://gianfranco0305-max.github.io/apd-isola/admin/`.
2. Modifica i campi e premi **Verifica contenuti**.
3. Premi **Copia JSON negli appunti**.
4. Apri `https://github.com/Gianfranco0305-max/apd-isola/edit/main/content/site.json`, seleziona tutto il testo e incolla il JSON.
5. Premi **Commit changes**: GitHub Pages pubblicherà i nuovi contenuti dopo la distribuzione.

In alternativa scarica il file `site.json` e copiane il contenuto nell'editor GitHub. Puoi anche importare una bozza JSON dal tuo dispositivo. Il pannello non memorizza bozze e non invia dati a server propri.

## Campi

- `schedule`: team, days, time, venue.
- `news`: title, date, description.
- `matches`: title, date, description.
- `documents`: title, url. Per i PDF locali: `./documents/nome.pdf`.
- `basketSlots`: fasce riservate alla società **esterna** Blue Basket, non allenamenti APD Isola.
- `fees`: quote della **pallavolo APD Isola**; da confermare con la segreteria.

Non pubblicare dati personali, moduli compilati, nominativi di minori o informazioni non autorizzate. Il modulo di contatto del sito prepara un'email sul dispositivo del visitatore; non invia messaggi automaticamente.

## Accesso privato e pubblicazione diretta

Per un vero CMS con login e salvataggio diretto servirà una soluzione con autenticazione OAuth e un backend/servizio di autorizzazione (o un provider CMS affidabile). Non inserire mai token GitHub, password o segreti nel JavaScript pubblico di GitHub Pages.
