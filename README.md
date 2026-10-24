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
Podrobnosti třícestného hodnocení: rozbalovací seznam ukazuje zápas, čas prvního úplného odhadu, tehdejší pravděpodobnosti a kurzy, ověřené skóre, chyby modelu a trhu i důvody čekání nebo rozporu. Konfigurace modelu ani soukromé archivy se nezveřejňují.

## Kontrola plánovaných přenosů 17. 10. 2026
Workflow sync-pages.yml je aktivní s plánem 11,41 každé hodiny. Posledních 30 kontrolovaných běhů bylo úspěšných, včetně plánovaných. Dnešní plánované běhy vznikly v 00:27:57, 05:00:07, 09:19:35 a 13:12:34 UTC: mezery 4 h 32 min, 4 h 19 min a 3 h 53 min. Jde o pozorované mezery mezi vznikem běhů, nikoli přesně změřené zpoždění konkrétního plánovaného okamžiku. Historie sama neodhaluje příčinu. GitHub uvádí možnost zpoždění a vynechání plánovaných běhů: https://docs.github.com/en/actions/how-tos/troubleshoot-workflows .
Banner již neslibuje skutečný půlhodinový přenos. Místní pojistka zůstává závislá na dostupném počítači a Codexu. Pro nezávislé cloudové spouštění je potřeba samostatný omezený přístup k Actions tohoto veřejného repozitáře, uložený jako serverové tajemství. Stávající místní GitHub přihlášení se na hosting nepřenáší. Cloudový spouštěč zatím není implementován; tento audit neopravuje spolehlivost GitHub plánovače. Poskytovatel nebyl dotazován a plány ani původní tipy se nezměnily.

## Přehled zápasů (17. 10. 2026)
Navigace má tři části: Zápasy, Výsledky modelu a Jak to funguje. Zápasy spojují uložené kurzy s rozpisem (7 dnů zpět a 8 dopředu). Chybějící nabídka není rozhodnutí bez tipu. Orientační odhady jsou v detailech; staré ceny nevytvářejí aktuální tip dne. Veřejná stránka pouze čte přenesená data a nespouští dotazy poskytovateli.


## Kontrola přesnosti před publikací
Každý přenos před zveřejněním nezávisle ověří třícestné předzápasové odhady, normalizaci kurzů bez marže, Brier, log loss, souhrn remíz a počty. Chyba zastaví nasazení; poslední úspěšný web zůstává dostupný. Čekající a rozporné výsledky nejsou prohry. Kontrola ověřuje aritmetiku exportu, nikoli autenticitu zdrojového skóre nebo tréninkovou historii. Nevolá poskytovatele a nemění interval přenosu. Testy: node --test scripts/audit-model-public.test.mjs.


## Kontrola gólových skóre před zveřejněním — 23. 10. 2026

Veřejné workflow sync-pages.yml nyní před publikací nezávisle přepočítá i všechny gólové hranice. Kontroluje jedinečnost zápasů a hranic, původní cenový pár a normalizaci marže, předzápasový čas, výsledky hranic, Brier jednotlivých řádků i průměry se stejnou vahou zápasů. Nesrovnalost nebo chybějící gólová sekce zastaví nové zveřejnění; poslední úspěšná publikace zůstane. Čekání, rozpor a neplatná evidence bez započtených skóre jsou přípustné; prázdný vzorek musí mít null místo nulové chyby. Jde o kontrolu aritmetiky veřejných dat, ne ověření pravosti výsledků nebo tréninku. Model, původní tipy, plán a načítání poskytovatele se nemění. Přidáno 21 testů; spolu s třícestnou kontrolou prošlo 31 testů.


### Ligový kontrolní základ (24. 10. 2026)
Gólové hranice ukazují také ligový Poissonův základ ze zmrazeného předzápasového tréninku. Jde o dodatečný kontrolní výpočet, ne původní tip. Souhrn tří metod používá stejné zápasy a hranice. Nezávislý publikační audit ověřuje pravděpodobnosti, chyby i společný vzorek; neověřuje soukromé tréninkové zdroje ani ziskovost.
