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
Kontrola úplnosti kol: samostatné počty předzápasových záznamů a ověřených výsledků, každý známý zápas včetně absence tipu a rozporů. Historické mezery do 28 dní dohledává stávající omezený plán; předzápasový tip zpětně nevytváříme.

## Oddělené hodnocení (11. 10. 2026)

Průzkumné tipy a referenční volby mají samostatné počty pro góly a výsledek po 60 minutách. Srovnání Brier modelu a kurzu bez marže používá v každé skupině stejná utkání; chybějící podklady zůstávají viditelné. Původní volby se nemění. Soukromý zdroj: 135 úspěšných testů.

## Diagnostika čekajících výsledků (12. 10. 2026)

Přehled ukazuje důvody odmítnutí poslední uložené odpovědi poskytovatele. Kontrola nevyvolává placený dotaz a veřejný export neobsahuje surová data. Chybějící výsledek není prohra. Soukromý zdroj prošel 138 automatickými testy.

## Doplněný výsledek Pardubice–Třinec

Jednorázová kontrola zápisů Hokej.cz a HC Oceláři Třinec potvrdila 4:4 po 60 minutách dne 11. 10. 2026. Původní volba Třince za 3,26 nevyšla. Záznam a zdroje jsou v soukromém repozitáři v reports/goal-review-2026-10-12.md. Nejde o nový automatický scraper.

## Úspora výsledkového limitu

Soukromý server zohledňuje také zkontrolované výsledky Hokej.cz a doložená ruční ověření. Vyřešený zápas nevyvolává zbytečné dotazy PulseScore; rozpory a chybějící data nadále dohledává. Ověřeno 143 testy.

Aktuálnost dat (13. 10. 2026): přehled odděluje stáří cen, kontrolu výsledků a přenos Pages. Upozornění na zpoždění nevolá poskytovatele a neznamená potvrzený výpadek. Ceny po 15 minutách zůstávají archivní; přenos po 90 minutách je označen jako zpožděný.

Jak si model vede nově odděluje neměnný původní tip a poslední použitelnou cenu stejné strany a hranice před začátkem. Ukazuje čas ceny, změnu a po výsledku porovnání Brier. Poslední zachycená cena nemusí být skutečný závěrečný kurz.
Automatické třícestné hodnocení (16. 10. 2026): přehled porovnává původní model s trhem bez marže na stejných ověřených výsledcích za 60 minut. Ukazuje Brier, logaritmickou ztrátu, odhadovanou a skutečnou četnost remíz i počty čekajících a rozporných zápasů. Výpočet probíhá v soukromé aplikaci z uložených archivů; Pages pouze přebírají souhrn. Původní tipy se nemění a nejde o důkaz výhody.
