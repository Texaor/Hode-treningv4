# Strategisk trening v3

Én lokal treningsapp for PC og mobil, uten abonnement eller konto.

## Innhold
- Adaptiv progresjon per ferdighet
- Guidet daglig økt som faktisk følger fullførte moduler
- Hoderegning: +, -, ×, ÷, prosent, brøk, estimasjon, kjederegning
- 60-sekundersmodus og Hard mode
- Hukommelse: sekvens, arbeidsminne, enkel N-back
- Logikk: mønster, relasjoner, sannhet/løgn, matriser og usikkerhet
- Sjakk: taktikk, forsvar og kandidat-trekk
- Reaksjon + Go/No-Go inhibisjon
- Observasjon: gjenkalling og finn endringen
- Selvkontrolløvelser og strategiske scenarioer
- Eksamenmodus, rekorder, achievements, feilanalyse og historikk
- Focus mode og valgfri begrunnelse før feedback
- Eksport OG import av progresjonsbackup
- PWA-ikoner og offline-cache når appen kjøres via webserver

## PC
Du kan pakke ut ZIP-filen og åpne `index.html`. For best støtte, åpne Terminal/Kommandolinje i mappen og kjør:

`python -m http.server 8000`

Gå så til `http://localhost:8000`.

## iPhone / mobil
Åpne appen via en lokal eller offentlig webserver i Safari, og velg Del → Legg til på Hjem-skjermen.

## Backup
Progresjonen lagres lokalt. Bruk Progresjon → Eksporter backup av og til. Backupen kan nå importeres igjen fra samme side.

## Sjakk
Sjakkdelen trener tankeprosess og taktiske mønstre, men er ikke en full sjakkmotor. En Stockfish-integrasjon vil være neste store tekniske sjakkoppgradering.
