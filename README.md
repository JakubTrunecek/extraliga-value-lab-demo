# Extraliga Value Lab — veřejný přehled

[Otevřít web bez přihlášení](https://jakubtrunecek.github.io/extraliga-value-lab-demo/)

Soukromá aplikace načítá předzápasové kurzy a ověřené výsledky, archivuje první tipy a vyhodnocuje je. Tento web přebírá jejich uložený přehled přibližně každých 30 minut přes GitHub Actions. Plán může mít zpoždění. Čas přenosu je nahoře; stáří kurzů a čas ověření výsledků jsou uvedené zvlášť.

Návštěva ani klikání nevolají poskytovatele dat a nespotřebují jeho limit. Login není potřeba. Stránka obsahuje pouze veřejná data a prohlížeč komunikuje jen se statickými soubory Pages. Serverové aktualizace a klíč PulseScore zůstávají soukromé.

## Co sledovat

- Načtené kurzy: gólové a 60minutové průzkumné tipy, původní ceny a stáří nabídky.
- Přehled kola: rozpis a orientační výpočty.
- Jak si model vede: vyšlo / nevyšlo / čeká / před zápasem, přesný původní tip a ověřené skóre; srovnání modelu s kurzem očištěným o marži.
- Jak to počítáme: metodika a omezení. Výhoda ani ziskovost nejsou prokázané.

Vyloučení jsou experiment bez potvrzených pravidel. Vítěz do rozhodnutí je jen přesně rozpoznaná dvoucestná nabídka, zatím bez samostatného modelu a vyhodnocení. Střely jsou mimo nové tipy. Chybějící výsledek není prohra; bez tipu není totéž co chybějící data.

## Provoz

Workflow sync-pages.yml při pushi, ručním spuštění nebo plánu sestaví artifact ze site/ a nového data/live.json. Export pouze čte uložený serverový stav. Nevyvolává načítání poskytovatele. Při chybě validace nic nového nepublikuje a zůstane poslední úspěšný web; starší přenos má upozornění. Nové úpravy UI se exportují ze soukromého zdroje skriptem build-pages.mjs.

Secrets SITE_BYPASS_TOKEN a PAGES_EXPORT_TOKEN jsou pouze v GitHub Actions; druhý povoluje jen export. Žádný klíč nepatří do repozitáře ani do artifactu. Repo neobsahuje server, raw archivy, soukromé poznámky ani historii soukromého vývoje. Model a dělení tréninku/testu se tímto přenosem nemění.

Aktualizováno 9. 10. 2026.

Aktualizace 10. 10. 2026: aktuální zápasy a čekající výsledky mají vlastní tabulku; vyhodnocená historie je od nejnovějšího data. Stav před zápasem / probíhá podle rozpisu / čeká na ověřený výsledek se přepočítává i bez přenosu dat. Probíhá je časový odhad do tří hodin od startu. Server dává novým výsledkům přednost před historickými stránkami; hodinový plán zachovává 2h/6h odstupy a společný limit.
