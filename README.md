# Strategisk trening v6

Denne versjonen bygger sjakkdelen om for korrekthet fremfor kunstig mengde.

## Sjakk v6
- De syntetisk genererte sjakkoppgavene fra v4/v5 er fjernet.
- Nye treningsoppgaver hentes fra Lichess sitt offisielle puzzle-API.
- Lichess-oppgaver har motoranalyserte løsningslinjer og ekte spillstillinger.
- `chess.js` brukes til lovlige trekk, FEN/PGN, sjakk og sjakkmatt.
- Appen nekter ulovlige trekk før fasit vurderes.
- Når du gjør riktig trekk, spiller appen automatisk motstanderens offisielle svar og lar deg finne neste trekk i kombinasjonen.
- Hint er trinnvise: riktig brikke, så fra/til-rute, så hele trekket.
- Kandidatmodus krever minst to lovlige kandidat-trekk før sluttvalget.
- Brikkene vises med Lichess sitt cburnett SVG-sett i stedet for systemets Unicode-brikker.
- Rating og Lichess puzzle-ID vises, mens temaet skjules til oppgaven er løst.
- Inntil 30 tidligere hentede puzzle-data lagres lokalt som fallback.
- Stockfish-analyse finnes fortsatt som separat modus, men brukes ikke til å late som en håndlaget oppgave er korrekt.

## Viktig om nett
Første gang må appen være på nett for å laste `chess.js`, Lichess-oppgaver og SVG-brikker. Service workeren forsøker å cache de eksterne sjakkressursene etter første bruk. Tidligere hentede puzzle-data lagres også lokalt.

## Oppdater GitHub Pages
Erstatt filene i det eksisterende repoet med ALLE filene i denne mappen. Det finnes nå en ny fil som heter `chess-core.js`, og den må også lastes opp.

Når GitHub Pages er ferdig:
1. Åpne siden i Safari.
2. Bekreft at det står `v6` øverst i appen.
3. Lukk hjemskjerm-appen helt og åpne den igjen.
4. Gå til Sjakk -> Lichess-oppgave.

## Kilder/lisenser
- Lichess puzzle-data: CC0.
- chess.js: BSD-2-Clause.
- Stockfish.js / Stockfish: GPLv3 (motor lastes eksternt ved behov).
