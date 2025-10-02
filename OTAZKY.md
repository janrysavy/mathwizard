Zadání: Rozšíření hry MathWizard pro české školní ročníky
Úvod a průzkum požadavků

Na základě českých vzdělávacích osnov jsme zjistili, jaké početní dovednosti by měli žáci zvládat mentálně (zpaměti) v jednotlivých ročnících základní a střední školy. Ministerstvo školství a běžné učebnice stanovují například toto: ke konci 1. třídy žák sčítá a odčítá do 20
doucujte.cz
, ve 3. třídě ovládá malou násobilku do 10×10 a dělení v oboru do 100
doucujte.cz
, ve 4.–5. třídě zvládá sčítání a odčítání čísel až do 1 000 000 zpaměti
doucujte.cz
 a seznamuje se se zlomky a desetinnými čísly
doucujte.cz
. Na druhém stupni se přidávají záporná čísla, zlomky a procenta – v 7. ročníku žáci počítají v oboru celých i racionálních čísel a umějí vyjádřit část celku zlomkem či procentem
zs-msstrazek.cz
. V 8. třídě už používají druhé mocniny a odmocniny (znají druhé mocniny čísel do 20 zpaměti
zs-msstrazek.cz
). Na střední škole se dále prohlubují všechny tyto dovednosti – studenti by měli pohotově počítat s většími čísly, procenty, mocninami, odmocninami atd.

Kromě standardních požadavků jsme se inspirovali i alternativními zdroji a obtížnějšími cvičeními. Tyto nadstavbové úlohy jsme zařadili do vyšších úrovní (levelů 7–10) pro každou kategorii, aby hra nabízela výzvu i pokročilejším hráčům. Všechny otázky jsou navrženy jako krátké texty (do ~20 znaků) a jejich řešení je možné zpaměti během 2–3 vteřin – hráč nemá čas zdlouhavě počítat, musí vycházet z rychlé úvahy nebo naučených početních spojů.

Refaktoring hry – nové funkce a nastavení

Výběr ročníku na úvod: Při spuštění hry se zobrazí dialog pro volbu školního ročníku hráče. Implementuj interaktivní slider (nebo jiný výběrový prvek) s popisky pro jednotlivé úrovně: Předškolní, 1. třída ZŠ, 2. třída ZŠ, ..., 9. třída ZŠ, 1. ročník SŠ, ..., 4. ročník SŠ. Podle zvolené úrovně se ve hře nastaví odpovídající okruh otázek a obtížností.
Textově pro aktuální roční napiš krátký souhrn oborů, které v otázkách budou.

Sjednoť finální dialog pro prohru i výhru, přidej do něj pro jaký ročník byla hra hrána. Po jeho zavření se přejde zase na okno s výběrem ročníku a možností spustit hru.

Lokalizace do češtiny: Všechny texty ve hře budou nově v češtině. To zahrnuje zadání matematických příkladů, popisky uživatelského rozhraní i případné hlášky. Např. namísto „Score“ bude „Skóre“ apod. (Pozn.: Číslice a matematické symboly samozřejmě zůstávají stejné; jde o doprovodné texty.)

Deset úrovní (levels) pro každý ročník: Hra má mít 10 postupných levelů. Pro každý ročník definuj zvlášť sadu úloh pro level 1 až 10. Level 1 představuje nejjednodušší typ příkladů (látka na začátku daného ročníku), level 10 nejobtížnější (látka probíraná koncem ročníku). Nižší levely tedy opakují či lehce rozšiřují požadavky z předchozího roku, vyšší levely zahrnou i pokročilejší učivo daného ročníku.

Tematické zaměření levelů: Každý level se zaměří na jednu oblast počítání (aby si hráč postupně procvičil vše). Např. pro 2. třídu ZŠ bude level 1 obsahovat sčítání a odčítání do 10 s kladnými čísly (základ 1. třídy), level 2 podobně do 20, pozdější levely pak zahrnou sčítání a odčítání do 100, jednoduché násobení atd. U starších žáků se v nižších levelech objeví kombinace základních početních operací s většími čísly, v vyšších pak např. procenta, mocniny, zlomky apod. (viz detailní rozpis níže).

Generování otázek: Pro každý level naprogramuj generování náhodných příkladů definovaného typu a rozsahu čísel. Výsledek příkladu by měl vždy vyjít jako jednoduché číslo (celé číslo, případně jednoduchý zlomek nebo desetinné číslo, pokud je to v daném ročníku na místě). Všechny otázky musí mít číselnou odpověď, kterou hráč rychle vypočítá z hlavy. Formulace otázek bude většinou ve tvaru prostého příkladu (např. 7 + 8 = ?), případně krátkého výrazu či rovnice. Vyvaruj se dlouhého textu nebo slovních úloh – čas na čtení je omezen. Délka zadání cca do 20 znaků zajistí přehlednost na obrazovce. Příklady by měly pokrýt celé požadované rozpětí dané látky náhodně (aby se hráč neučil nazpaměť pořadí).

Odpovědi a časový limit: Hráč bude odpovídat na každý příklad přímo číselným výsledkem. Vzhledem k zaměření na pamětní počítání nastav vhodně časový limit na odpověď (např. ~3 vteřiny). To už ve hře částečně je (zrychlování příšery při špatné odpovědi apod.), ale ujisti se, že obtížnost odpovídá schopnostem – tj. příklady jsou dost jednoduché, aby šly stihnout.

Testování (AGENTS.md): V testovacích scénářích budeme chtít ověřit správnost generování a vyhodnocení odpovědí. Pro každý level se automaticky vygeneruje sada 20 náhodných otázek i s odpověďmi a otestuje se, že hra správně rozpozná správné vs. špatné odpovědi. Uprav proto případně kód tak, aby výsledky byly jednoznačné a porovnání odpovědí spolehlivé (pozor např. na zaokrouhlování u desetinných čísel, formát zlomků atd.). Ve výpisu níže uvádíme ukázkové otázky a správné odpovědi pro každý ročník a každý level – slouží jako příklad očekávaného formátu a obtížnosti. Testy budou obdobné, ale s náhodně vygenerovanými čísly.

Uvedené příklady se týkají malých příšerek, kde má hráč několik vteřin času. Finální boss má 5 životů a otázky musí být řešitelné okamžitě z hlavy bez počítání, takže tam zařaď jen snadnou skupinu otázek.

Návrh úrovní a ukázkové příklady

Níže je rozpracováno, jaké okruhy by jednotlivé levely (1–10) měly obsahovat pro hráče daného ročníku. U každého levelu je stručně uvedeno zaměření a několik příkladů s uvedenou správnou odpovědí (v závorce). Tyto příklady jsou v českém jazyce a dodržují požadavek krátké formulace. Při implementaci v kódu použij stejný princip generování; konkrétní čísla se budou náhodně obměňovat.

Předškolní (mateřská škola, věk ~5 let)

Level 1: Základy sčítání malých čísel do 5. (Příklady: 2 + 1 = ? (3); 4 + 0 = ? (4))
Level 2: Základy odčítání v oboru do 5 (bez záporných výsledků). (Příklady: 5 – 1 = ? (4); 3 – 2 = ? (1))
Level 3: Sčítání v oboru do 10 (jednociferná čísla). (Příklady: 7 + 2 = ? (9); 1 + 6 = ? (7))
Level 4: Odčítání v oboru do 10. (Příklady: 9 – 3 = ? (6); 10 – 2 = ? (8))
Level 5: Porovnávání malých čísel – určování většího z dvou. (Příklady: Větší z 3 a 5 = ? (5); Větší číslo: 7 nebo 4? (7))
Level 6: Sčítání tří velmi malých čísel (výsledek do 10). (Příklad: 1 + 2 + 3 = ? (6))
Level 7: Doplnění do 10 (jedno sčítání typu „kolik chybí do 10“). (Příklady: 7 + ? = 10 (3); ? + 4 = 10 (6))
Level 8: Jednoduché dvojaké operace – kombinace sčítání a odčítání malých čísel. (Příklad: 5 + 2 – 1 = ? (6))
Level 9: Sčítání v oboru do 10 s přechodem přes 10 (výsledek lehce nad 10). (Příklad: 8 + 5 = ? (13))
Level 10: Odčítání v oboru do 10 s výsledkem 0 nebo 1 (kontrola pochopení rozdílu všechno–nic). (Příklady: 5 – 5 = ? (0); 6 – 5 = ? (1))

1. třída ZŠ (6–7 let)

Level 1: Sčítání v oboru do 10 (bez přechodu přes desítku, opakování začátku 1. ročníku). (Př: 3 + 5 = ? (8); 1 + 6 = ? (7))
Level 2: Odčítání v oboru do 10 (bez vzniku záporných čísel). (Př: 9 – 4 = ? (5); 7 – 2 = ? (5))
Level 3: Sčítání v oboru do 20 (jednociferné + jednociferné, výsledek maximálně 20, zpočátku bez přechodu přes 10). (Př: 8 + 1 = ? (9); 7 + 2 = ? (9))
Level 4: Odčítání v oboru do 20. (Př: 15 – 5 = ? (10); 18 – 9 = ? (9))
Level 5: Sčítání do 20 s přechodem přes 10 (obtížnější případy ke konci 1. třídy). (Př: 9 + 8 = ? (17); 6 + 7 = ? (13))
Level 6: Odčítání do 20 s přechodem (půjčování, např. 13 – 5). (Př: 13 – 5 = ? (8); 16 – 7 = ? (9))
Level 7: Sčítání tří čísel do 10 (celkový součet do ~20). (Př: 5 + 2 + 1 = ? (8); 7 + 1 + 2 = ? (10))
Level 8: Doplňování do 20 – chybějící sčítanec nebo menšenec. (Př: ? + 4 = 15 (11); 12 – ? = 7 (5))
Level 9: Kombinované jednoduché operace (sčítání i odčítání v 1 příkladu). (Př: 10 – 3 + 2 = ? (9); 4 + 5 – 2 = ? (7))
Level 10: Sčítání a odčítání kulatých desítek (příprava na 2. třídu). (Př: 10 + 20 = ? (30); 30 – 10 = ? (20))

2. třída ZŠ (7–8 let)

Level 1: Sčítání a odčítání v oboru do 20 (rychlé opakování 1. třídy na úvod). (Př: 17 – 5 = ? (12); 9 + 8 = ? (17))
Level 2: Sčítání a odčítání kulatých desítek do 100. (Př: 30 + 20 = ? (50); 90 – 40 = ? (50))
Level 3: Sčítání dvojciferného a jednociferného čísla (výsledek do 100, zpočátku bez přechodu přes desítku). (Př: 45 + 4 = ? (49); 62 + 7 = ? (69))
Level 4: Odčítání dvojciferného a jednociferného čísla (výsledek kladný, zpočátku bez přechodu). (Př: 53 – 1 = ? (52); 68 – 5 = ? (63))
Level 5: Sčítání dvojciferných čísel do 100 (případy s přechodem přes desítku). (Př: 47 + 8 = ? (55); 76 + 9 = ? (85))
Level 6: Odčítání dvojciferných čísel (s přechodem, např. 52 – 9). (Př: 52 – 9 = ? (43); 41 – 6 = ? (35))
Level 7: Malá násobilka – násobení čísly 1–5 (což odpovídá rozsahu probíranému ve 2. třídě)
doucujte.cz
. (Př: 2 × 5 = ? (10); 4 × 3 = ? (12))
Level 8: Dělení v oboru malé násobilky do 5 (jen příklady beze zbytku). (Př: 15 ÷ 3 = ? (5); 16 ÷ 4 = ? (4))
Level 9: Chybějící činitel nebo dělenec u jednoduchého násobení či dělení. (Př: ? × 4 = 20 (5); 12 ÷ ? = 6 (2))
Level 10: Kombinace sčítání/odčítání a malé násobilky (dvě operace v jednom příkladu). (Př: 3 × 5 + 2 = ? (17); 18 – 2 × 7 = ? (4))

3. třída ZŠ (8–9 let)

Level 1: Sčítání a odčítání do 100 (procvičení základní látky 2. ročníku). (Př: 34 + 12 = ? (46); 90 – 45 = ? (45))
Level 2: Sčítání a odčítání dvouciferných čísel s přechodem přes desítku (např. 56 + 27, 83 – 48). (Př: 56 + 27 = ? (83); 83 – 48 = ? (35))
Level 3: Násobení v oboru do 100 (celá malá násobilka 1–10). (Př: 7 × 8 = ? (56); 9 × 9 = ? (81))
Level 4: Dělení v oboru do 100 (dělení čísly 1–10 beze zbytku). (Př: 64 ÷ 8 = ? (8); 45 ÷ 9 = ? (5))
Level 5: Sčítání trojic čísel do 100 (např. součet více menších čísel). (Př: 20 + 5 + 7 = ? (32); 15 + 30 + 5 = ? (50))
Level 6: Kombinované operace – jednoduché řetězení více sčítání/odčítání. (Př: 10 + 8 – 3 = ? (15); 5 + 6 + 4 = ? (15))
Level 7: Chybějící člen v násobilce – doplňování neznámé v násobení či dělení (ověření skutečného pochopení násobků). (Př: ? × 7 = 42 (6); 63 ÷ ? = 9 (7))
Level 8: Násobení dvouciferného jednociferným (např. 7×14 – tento typ lze počítat zpaměti rozkladem 14 = 10+4). (Př: 7 × 14 = ? (98); 3 × 15 = ? (45))
Level 9: Dělení dvouciferného jednociferným (pouze beze zbytku). (Př: 96 ÷ 4 = ? (24); 84 ÷ 7 = ? (12))
Level 10: Pokročilejší kombinace: např. násobení a sčítání v jednom výrazu. (Př: 6 × 5 – 8 = ? (22); 4 + 3 × 6 = ? (22))

4. třída ZŠ (9–10 let)

Level 1: Sčítání a odčítání trojciferných čísel (zpočátku bez přechodu přes stovky). (Př: 200 + 150 = ? (350); 500 – 200 = ? (300))
Level 2: Sčítání a odčítání čísel do 1000 s přechodem (např. 700+380, 900–450). (Př: 700 + 380 = ? (1080); 900 – 450 = ? (450))
Level 3: Násobení a dělení čísly 10 a 100 (práce s násobky desítek, stovek)
doucujte.cz
. (Př: 25 × 10 = ? (250); 360 ÷ 10 = ? (36))
Level 4: Násobení jednociferným činitelem v mnohociferných číslech (např. 3× 205). (Př: 3 × 205 = ? (615); 4 × 120 = ? (480))
Level 5: Písemné algoritmy mentálně – násobení dvojciferným činitelem tam, kde to jde z hlavy (např. 20×15, 11×11). (Př: 20 × 15 = ? (300); 11 × 11 = ? (121))
Level 6: Dělení se zbytkem v oboru malé násobilky
doucujte.cz
 – v rámci levelu generuj příklady jak beze zbytku, tak se zbytkem, a hráč musí dát pouze celočíselný výsledek dělení. (Př: 7 ÷ 2 = ? (3) – pokud zbytek 1, bere se jen podíl; 13 ÷ 5 = ? (2) – podíl bez zbytku)
Level 7: Jednotky a převody – jednoduché převody jednotek, které dávají celé číslo. (Př: 100 cm = ? m (1); 3 m = ? cm (300))
Level 8: Zlomky – základ: jednoduché zlomky a jejich hodnoty. (Př: 1/2 z 20 = ? (10); 1/4 z 8 = ? (2))
Level 9: Smíšené operace: kombinace sčítání/odčítání s násobením nebo dělením (důraz na správné pořadí operací). (Př: 10 + 2 × 4 = ? (18); 20 – 9 ÷ 3 = ? (17))
Level 10: Kombinace zlomků a násobení: složitější příklad pro bystré žáky (nad rámec běžného učiva 4. tř.). (Př: 1/2 z 30 + 5 = ? (20); 1/3 z 15 + 2 = ? (7))

5. třída ZŠ (10–11 let)

Level 1: Sčítání a odčítání čtyřciferných čísel (do 10 000). (Př: 5000 + 3000 = ? (8000); 9000 – 4500 = ? (4500))
Level 2: Sčítání a odčítání čísel do 1 000 000 (i když mentálně se řeší jen jednodušší kombinace – velká čísla vol spíše kulatá)
doucujte.cz
. (Př: 200000 + 300000 = ? (500000); 500000 – 100000 = ? (400000))
Level 3: Násobení a dělení 10, 100, 1000 a jejich násobky (posun desetinné čárky). (Př: 250 × 100 = ? (25000); 3600 ÷ 100 = ? (36))
Level 4: Násobení dvouciferných čísel jednociferným (zpaměti jednodušší případy nebo využití distributivity). (Př: 7 × 15 = ? (105); 8 × 12 = ? (96))
Level 5: Dělení dvouciferných čísel jednociferným (většinou beze zbytku). (Př: 96 ÷ 8 = ? (12); 85 ÷ 5 = ? (17))
Level 6: Desetinná čísla – sčítání/odčítání (jednoduché desetinné hodnoty, max. 1 desetinné místo)
doucujte.cz
. (Př: 5,5 + 2,0 = ? (7,5); 3,0 – 1,5 = ? (1,5))
Level 7: Desetinná čísla – násobení a dělení celým číslem (jednoduché případy). (Př: 2,5 × 2 = ? (5,0); 6,0 ÷ 3 = ? (2,0))
Level 8: Zlomky – porozumění: určení jednoduché části celku, která vyjde jako celé číslo. (Př: 1/5 z 25 = ? (5); 3/4 z 20 = ? (15))
Level 9: Procenta – základní procentové hodnoty (celá procenta, které dají celé číslo výsledku). (Př: 50 % z 60 = ? (30); 10 % z 90 = ? (9))
Level 10: Kombinace desetinných čísel, zlomků a procent (výzva navíc, integrace látky). (Př: 0,5 + 1/2 = ? (1,0); 25 % z 8 + 2 = ? (4))

6. třída ZŠ (11–12 let)

Level 1: Sčítání a odčítání desetinných čísel (více desetinných míst, výsledky do tisíců)
zs-msstrazek.cz
. (Př: 1,25 + 3,5 = ? (4,75); 5,0 – 2,75 = ? (2,25))
Level 2: Násobení a dělení desetinných čísel celým číslem. (Př: 2,5 × 4 = ? (10,0); 6,4 ÷ 2 = ? (3,2))
Level 3: Pravidla dělitelnosti – jednoduché ověření dělitelnosti výsledkem. (Př: 84 ÷ 6 = ? (14) – kontrola dělitelnosti 84 šesti; 75 ÷ 5 = ? (15) – dělitelnost pěti)
Level 4: Výpočet zbytku při dělení (v jednoduchých případech). (Př: 17 ÷ 5, zbytek = ? (2); 10 ÷ 4, zbytek = ? (2))
Level 5: Násobení vícemístných čísel jednociferným (např. 6× 247, lze rozložit 6×200 + 6×47). (Př: 6 × 200 = ? (1200); 6 × 47 = ? (282) → dohromady; ale zde zadáváme každý díl zvlášť)
Level 6: Násobení více činitelů (řetězení, např. součin tří malých čísel). (Př: 2 × 3 × 4 = ? (24); 2 × 2 × 2 × 2 = ? (16))
Level 7: Celá čísla – zavedení záporných hodnot (jednoduché operace). (Př: 0 – 5 = ? (–5); –3 + 8 = ? (5))
Level 8: Celá čísla – násobení a dělení se zápornými (znak výsledku). (Př: –4 × 3 = ? (–12); –15 ÷ 3 = ? (–5))
Level 9: Kombinace kladných a záporných (např. součet tří čísel různých znamének). (Př: –2 + 5 – 4 = ? (–1); 3 + (–7) + 2 = ? (–2))
Level 10: Alternativní výzva – mocniny: výpočet objemu krychle malého čísla (třetí mocnina). (Př: 3 × 3 × 3 = ? (27); 2³ = ? (8))

7. třída ZŠ (12–13 let)

Level 1: Operace v oboru celých čísel – sčítání a odčítání se zápornými čísly (běžné případy)
zs-msstrazek.cz
. (Př: 5 – 8 = ? (–3); –4 + 7 = ? (3))
Level 2: Násobení a dělení celých čísel (záporná × kladná, záporná ÷ kladná). (Př: –3 × 4 = ? (–12); –10 ÷ 2 = ? (–5))
Level 3: Procenta – základní výpočty (10 %, 20 %, 50 % z celku). (Př: 10 % z 50 = ? (5); 50 % z 30 = ? (15))
Level 4: Zlomky – výpočet části celku, případně převod jednoduchého poměru na zlomek
zs-msstrazek.cz
. (Př: 1/3 z 33 = ? (11); 3/4 z 16 = ? (12))
Level 5: Kombinace zlomku a celého čísla (sčítání, odčítání) – výsledkem celé číslo nebo jednoduchý zlomek. (Př: 5 + 1/2 = ? (5½); 4 – 3/2 = ? (2½)) – pozn.: ve hře lze přijmout desetinný ekvivalent 5,5 a 2,5*
Level 6: Procenta – složitější hodnoty (25 %, 5 %, 15 % ze základu). (Př: 25 % z 80 = ? (20); 5 % z 200 = ? (10))
Level 7: Poměr a úměra – jednoduchá úměrnost, hledání neznámé hodnoty. (Př: 2 : 3 = 4 : ? (6); 3 : 5 = 9 : ? (15))
Level 8: Negativní × negativní (součin dvou záporných čísel). (Př: –4 × –3 = ? (12); –2 × –7 = ? (14))
Level 9: Jednoduché lineární rovnice (řešení „z hlavy“). (Př: x – 5 = 2, x = ? (7); 2x + 1 = 9, x = ? (4))
Level 10: Alternativní výzva – kombinace různých formátů čísel (zlomky, desetinná čísla, procenta) v jednom výrazu. (Př: 0,5 + 1/2 + 10 % z 10 = ? (1,5); 1/4 z 8 + 0,5 = ? (2,5))

8. třída ZŠ (13–14 let)

Level 1: Procenta – běžné výpočty (např. 120 % nebo 75 % z čísla). (Př: 120 % z 50 = ? (60); 75 % z 40 = ? (30))
Level 2: Druhá mocnina čísla (nácvik na čtverce čísel do 20)
zs-msstrazek.cz
. (Př: 7² = ? (49); 15² = ? (225))
Level 3: Druhá odmocnina – odhady a známé hodnoty (dokonalé čtverce). (Př: √49 = ? (7); √144 = ? (12))
Level 4: Kombinace mocniny a sčítání/odčítání. (Př: 5² – 3 = ? (22); √36 + 5 = ? (11))
Level 5: Jednoduché algebraické výrazy – dosazení hodnot a vyčíslení. (Př: Pro x=3: 2x + 1 = ? (7); Pro n=4: n² – n = ? (12))
Level 6: Lineární rovnice – řešení (včetně záporných výsledků). (Př: 3x – 5 = 7, x = ? (4); –2x = 8, x = ? (–4))
Level 7: Úměra (trojčlenka) – složitější poměry. (Př: 5 : 8 = 15 : ? (24); 3 : 4 = ? : 20 (15))
Level 8: Smíšené výrazy se dvěma operacemi – důraz na pořadí (např. násobení a sčítání). (Př: 2^3 + 4 = ? (12); 8 + 6 ÷ 2 = ? (11))
Level 9: Kombinace mocnin a odmocnin v jednom výrazu. (Př: √81 + 4² = ? (89); √25 + √9 = ? (8))
Level 10: Alternativní výzva – komplexnější výpočty s racionálními čísly. (Př: (1/2 z 12) + (10 % z 50) = ? (11); 3/4 z 16 + 2 = ? (14))

9. třída ZŠ (14–15 let) – příprava na přijímačky SŠ

Level 1: Procenta – výpočty „zpaměti“ i zpětné (urči celek nebo procentovou část). (Př: 15 % z 120 = ? (18); 30 je ? % z 60 (50))
Level 2: Zlomky – sčítání/odčítání se stejným jmenovatelem, násobení zlomku číslem. (Př: 1/2 + 1/4 = ? (3/4); 2/3 z 90 = ? (60))
Level 3: Druhé mocniny a odmocniny čísel do 20 (opakování 8. tř). (Př: 18² = ? (324); √361 = ? (19))
Level 4: Jednoduché algebraické výrazy – dosazení a výpočet (mohou být i dvouproměnné). (Př: Pro x=2, y=3: x² + y² = ? (13); Pro a=3: 2a² – a = ? (15))
Level 5: Lineární rovnice a nerovnice – rychlé řešení. (Př: 2x + 5 = 11, x = ? (3); x + 4 < 7, x < ? (3))
Level 6: Geometrické počty – Pythagorova trojice, obvod, obsah (jednoduché případy). (Př: 3² + 4² = ?² (5²); obvod čtverce 5×5 = ? (20))
Level 7: Kombinatorika/úvaha – jednoduchý výpočet bez kalkulačky. (Př: 5! = ? (120); Počet dnů v 8 týdnech = ? (56))
Level 8: Směsi a poměry – zjednodušené výpočty (např. průměry, směšovací poměr v malých číslech). (Př: průměr(4, 6) = ? (5); poměr 2:3 z 50 ks = ? ks (20 a 30))
Level 9: Funkce – dosazení do jednoduchých funkcí (lineární, kvadratické) a výpočet. (Př: f(x)=2x–1, pro x=5: f(x)=? (9); g(x)=x², pro x=–4: g(x)=? (16))
Level 10: Alternativní výzva – komplexní příklad integrující více oblastí. (Př: (1/2 z 20) + (25 % z 8) + √16 = ? (10 + 2 + 4 = 16); (–3)² + 15 % z 40 = ? (9 + 6 = 15))

1. ročník SŠ (15–16 let)

Level 1: Rychlé sčítání a odčítání vícečíselných hodnot (revize ZŠ). (Př: 120 + 450 = ? (570); 1000 – 375 = ? (625))
Level 2: Násobení a dělení dvoucifernými čísly (jednodušší případy, využití známých násobilkových spojů). (Př: 14 × 9 = ? (126); 1000 ÷ 25 = ? (40))
Level 3: Pokročilá malá násobilka – násobení větších jednociferných a dvouciferných (např. 13×7, 15×15). (Př: 13 × 7 = ? (91); 15 × 15 = ? (225))
Level 4: Mocniny a odmocniny – obecné použití (i nad rámec 20², jednoduché vyšší mocniny). (Př: 2^10 = ? (1024); √256 = ? (16))
Level 5: Dosazování do vzorců – výpočet hodnot jednoduchých výrazů s více proměnnými. (Př: Pro x=2, y=5: 3x + y = ? (11); Pro a=4: a^2 – 2a = ? (8))
Level 6: Základy finanční matematiky – výpočty s % navýšením či snížením (bez složeného úročení). (Př: cena 200 Kč + 21 % DPH = ? (242); sleva 15 % ze 1000 Kč = ? (850))
Level 7: Fyzikální aplikace – převody jednotek s desetinnými čísly. (Př: 0,5 kg = ? g (500); 36 km/h = ? m/s (10) – přepočet: 36 000 m za 3600 s)
Level 8: Pokročilé zlomky – kombinace operací se zlomky (sčítání, násobení; výsledky v základním tvaru). (Př: 1/2 + 2/3 = ? (7/6); 4/3 × 9 = ? (12))
Level 9: Goniometrické hodnoty – jednoduché známé úhly. (Př: sin 30° = ? (0,5); cos 60° = ? (0,5))
Level 10: Alternativní výzva – komplexní úloha kombinující více kroků (např. dosazení do vzorce a výpočet procent). (Př: y = 2x+1, pro x=3: y + 10 % z 50 = ? (7 + 5 = 12); √(3^2 + 4^2) + 1 = ? (5 + 1 = 6))

2. ročník SŠ (16–17 let)

Level 1: Sčítání, odčítání, násobení a dělení běžných racionálních čísel (včetně smíšených čísel, desetinných, procent) – rutinní procvičení. (Př: 5,75 – 2,5 = ? (3,25); 120 % ze 30 = ? (36))
Level 2: Mocniny – vyšší exponenty a jejich použití (čtverce nad 20, krychle malých čísel). (Př: 25² = ? (625); 4^3 = ? (64))
Level 3: Odmocniny – odmocniny větších čísel, zjednodušování výrazů s odmocninami. (Př: √400 = ? (20); √(50 000/2) = ? (√25000 = 158,113… – tento spíše ne, raději jednodušší))
Level 4: Logické odhady – např. odhad výsledku nebo kontrola číslic (alternativní cvičení pro mentální postřeh). (Př: přibližně: 51 × 19 ≈ ? (≈970); odhad: 203 ÷ 2 ≈ ? (≈100))
Level 5: Algebra – hodnoty kvadratických výrazů, pokud jsou faktorizovatelné (bez řešení rovnic, jen dosazení). (Př: Pro x=3: x² – 2x – 3 = ? (–3); Pro t=2: (t–1)(t+2) = ? (3))
Level 6: Algebra – řešení jednoduchých kvadratických rovnic se známými kořeny (např. vzorec a²=b). (Př: x² = 16, x = ? (±4); x² – 9 = 0, x = ? (±3))
Level 7: Kombinatorika – výpočty faktoriálů, kombinací pro malá čísla. (Př: 4! = ? (24); C(5,2) = ? (10))
Level 8: Pokročilá procenta – složené úrokování na 1 krok (např. jedno navýšení o X %). (Př: 1000 Kč po navýšení o 10 % = ? (1100); po 10% snížení z 200 = ? (180))
Level 9: Goniometrie – hodnoty goniometrických funkcí běžných úhlů v radiánech. (Př: sin π/6 = ? (0,5); cos π/3 = ? (0,5))
Level 10: Alternativní výzva – komplexní úloha s více prvky. (Př: (1/2 + 0,5) × 2^3 = ? (1 × 8 = 8); 3! + 2³ = ? (6 + 8 = 14))

3. ročník SŠ (17–18 let)

Level 1: Rychlé kombinované operace s celými i desetinnými čísly (směs +, –, ×, ÷ v jednom výrazu). (Př: 12 + 7 × 2 – 5 = ? (21); 100 – 40 ÷ 5 = ? (92))
Level 2: Mocniny a odmocniny – i ne zcela triviální hodnoty (např. odmocniny nečtvercových čísel s jednoduchým výsledkem). (Př: ³√27 = ? (3); √0,04 = ? (0,2))
Level 3: Logaritmy – jednoduché logaritmické rovnice, kde výsledek je celé číslo. (Př: log₁₀(1000) = ? (3); log₂(16) = ? (4))
Level 4: Algebra – hodnoty složitějších výrazů při dosazení (např. s potenciálně nulovým jmenovatelem – kontrola definičního oboru). (Př: Pro x=2: (x² – 4)/(x – 2) = ? (4–? – pozor, nedefinováno, tento příklad by v testu vyvolal chybu))
Level 5: Řešení rovnic – kvadratické rovnice řešitelné snadno faktorizací. (Př: x² – 5x + 6 = 0, x = ? (2 nebo 3); x² = 5x, x = ? (0 nebo 5))
Level 6: Řešení soustav dvou lineárních rovnic o dvou neznámých (s jednoduchými kořeny). (Př: x+y=7, x-y=3, x = ? (5); 2a+b=5, a-b=1; b = ? (3))
Level 7: Funkce – složení dvou funkcí nebo inverzní funkce na konkrétní hodnotě. (Př: f(x)=2x, g(x)=x+1, g(f(3)) = ? (7); f(x)=x³, f⁻¹(8) = ? (2))
Level 8: Goniometrie – hodnoty goniometrických funkcí pro specifické úhly, případně jednoduché trigonometrické rovnice. (Př: tan 45° = ? (1); sin x = 1, x = ? (90°))
Level 9: Matice a determinanty – determinant 2×2 matice zpaměti. (Př: | 1 2; 3 4 | = ? (–2); | 2 0; 0 5 | = ? (10))
Level 10: Alternativní výzva – komplexní úloha zahrnující více oblastí vyšší matematiky (základní prvky). (Př: (2 + 3i) + (4 – 2i) = ? (6 + 1i); lim(x→0) (sin x / x) = ? (1))

4. ročník SŠ (18–19 let) – příprava na maturitu

Level 1: Opakování – pestrá směs základních početních operací s důrazem na rychlost a přesnost. (Př: 150 – 4 × 25 = ? (50); 0,75 + 3/4 = ? (1,5))
Level 2: Pokročilé mocniny – výpočty typu 〖(1+1/n)〗^n pro velké n (přibližně e), případně jednoduché limity. (Př: (1 + 1/100)¹⁰⁰ ≈ ? (~2,704); lim(n→∞) (1+1/n)^n ≈ ? (~2,718))
Level 3: Pokročilé odmocniny a logaritmy – kombinace (např. logaritmus odmocniny, řešitelné zjednodušením). (Př: log₁₀(√100) = ? (1); ln(e³) = ? (3))
Level 4: Kombinatorika a pravděpodobnost – mentální odhad nebo výpočet jednoduché pravděpodobnosti. (Př: Při hodu kostkou šance na 6 = ? (1/6); C(6,3) = ? (20))
Level 5: Derivace a integrály – velmi jednoduché případy z hlavy (derivace mocninné funkce, určitý integrál konstanty). (Př: (x²)’ = ? (2x); ∫₀¹ 2 dx = ? (2))
Level 6: Řešení exponenciálních a logaritmických rovnic – mentálně, pokud mají „kulatá“ řešení. (Př: 2^x = 16, x = ? (4); log₂(x) = 3, x = ? (8))
Level 7: Goniometrické rovnice – jednoduché případy v rámci 0–360°. (Př: sin x = 0, x = ? (0° nebo 180°); cos x = 1, x = ? (0°))
Level 8: Počítání s komplexními čísly – součty, součiny jednoduchých komplexních čísel. (Př: (1 + i) + (2 – 2i) = ? (3 – i); (1 + i)·(1 – i) = ? (2))
Level 9: Matice – výpočty s 2×2 maticemi (násobení matic, determinant), případně invertování jednoduchých matic. (Př: | 3 0; 0 3 | = ? (9); | 1 1; 1 1 | = ? (0))
Level 10: Alternativní výzva (maturitní úroveň) – komplexní úloha spojující více pokročilých konceptů. (Př: e^(ln(5)) + √(sin² 45°) = ? (5 + 0,707… – přesně 5,707…); d/dx(x³) při x=2 + 4! = ? (12 + 24 = 36))

(Poznámka: U pokročilejších SŠ úloh už některé výstupy nejsou celá čísla – ve hře však můžeme akceptovat přibližné desetinné odpovědi nebo zjednodušené tvary podle potřeby. Nicméně, hlavním cílem implementace jsou úrovně ZŠ a odpovídající maturitní minimum, takže extrémní SŠ příklady lze případně vypustit nebo zjednodušit.)

Zdrojová podpora: Při sestavování úloh jsme vycházeli z rámcových požadavků MŠMT pro matematiku (RVP ZV a G, katalogy požadavků k přijímacím zkouškám a maturitě) a z typických příkladů v učebnicích daných ročníků. Pro ověření jsme použili např. přehledy požadovaných výstupů pro 1.–5. ročník
doucujte.cz
doucujte.cz
 a 6.–9. ročník ZŠ
zs-msstrazek.cz
zs-msstrazek.cz
. Tyto zdroje potvrzují, že námi zvolené typy příkladů odpovídají úrovni daného ročníku (a případně lehce rozšiřují obtížnost v rámci levelů 7–10, aby hra byla dostatečně náročná i pro šikovné žáky).