# Extraliga Value Lab — veřejná ukázka

[Otevřít web](https://jakubtrunecek.github.io/extraliga-value-lab-demo/)

Statická ukázka rozhraní s archivovanými kurzy a historickými daty. Lze prohlížet nabídky, přehled kol, kalkulačku a historický test. Nové kurzy a výsledky se v této veřejné kopii nenačítají. Plná aplikace a její vývojový repozitář jsou soukromé.

## Jak odhad vzniká

Statistický model pracuje s historickou silou útoku a obrany, domácím/venkovním průměrem a časovým vážením. Poissonovo nebo negativně binomické rozdělení dává pravděpodobnost over/under. Férový kurz je 1/p; modelová výhoda p × kurz − 1. Samotná aplikace nepoužívá GPT ani OpenAI API.

Střely a góly jsou za 60 minut; tresty experimentální. Zobrazené kurzy nejsou živé sázkové nabídky. Nejde o prokázaně ziskový systém, automatické sázení ani jisté tipy.

## Stav vývoje k 29. 9. 2026

Soukromá verze má serverové načítání PulseScore při otevřeném webu, limity spotřeby a archivaci prvního zvýrazněného nápadu pro každý zápas. Výsledky gólů lze po utkání doplnit ručním tlačítkem; potvrzené střelecké statistiky nadále chybějí. Tato veřejná ukázka nové výsledky ani kurzy nenačítá. Devět výzkumných variant na historických datech nedoložilo přínos pro nahrazení původního modelu. Historické testy nedokládají skutečné sázkové ROI.

Tento repozitář obsahuje pouze vybrané statické soubory. Neobsahuje server, API klíče ani historii soukromého repozitáře. Aktualizace ukázky jsou manuální.
