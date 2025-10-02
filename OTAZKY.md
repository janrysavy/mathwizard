# Plán otázek pro MathWizard (zarovnání s českým kurikulem)

Účel: Definovat deset postupně náročnějších levelů pro každý ročník české školy tak, aby každý ročník začínal diagnostikou předchozích dovedností a končil rozšiřující výzvou pro rychlé mentální počítání. Obsah vychází ze souborů OTAZKY_GPT5.md a OTAZKY_CLAUDE.md.

Implementační zásady:
- Zachovejte krátké zadání na obrazovce (<20 znaků) pomocí aritmetických výrazů nebo velmi stručného textu.
- Každá šablona musí vést k jedinému číselnému výsledku (celé číslo nebo konečné desetinné číslo); podle toho přizpůsobte formulaci.
- "Poznámky pro generátor" popisují intervaly čísel nebo pomocné rutiny; "Ukázkové příklady" slouží pro rychlé ruční ověření.

## Předškoláci (mateřská škola, 5–6 let)
Přehled: Budování početní představy do 10, řazení a porovnávání bez formálních algoritmů.
- Level 1 – Počítej do 3
  Zaměření: Subitace velmi malých skupin.
  Poznámky pro generátor: Zobrazte 0–3 ikony, ptejte se na jejich počet.
  Ukázkové příklady: ●● = ?, ★ = ?
- Level 2 – Počítej do 5
  Zaměření: Početní řada 0–5.
  Poznámky pro generátor: Střídejte uspořádání, přijímejte číslici jako odpověď.
  Ukázkové příklady: ★★★★ = ?, Kolik je srdcí? (5)
- Level 3 – Porovnej rozdíl
  Zaměření: Určit, která množina je větší o kolik.
  Poznámky pro generátor: Dvě skupiny ≤5; dotaz „O kolik více?“.
  Ukázkové příklady: 4 vs 2 → rozdíl?, 5 vs 5 → rozdíl?
- Level 4 – Následující číslo
  Zaměření: Nástupce v intervalu 0–6.
  Poznámky pro generátor: Formát `Co je po n?`.
  Ukázkové příklady: Po 2?, Po 5?
- Level 5 – Přičti jedna
  Zaměření: `n + 1` pro 0–5.
  Poznámky pro generátor: Vyjádření `n + 1`.
  Ukázkové příklady: 3 + 1 = ?, 5 + 1 = ?
- Level 6 – Uber jedna
  Zaměření: `n - 1` pro 1–6.
  Poznámky pro generátor: Vyjádření `n - 1`.
  Ukázkové příklady: 4 - 1 = ?, 2 - 1 = ?
- Level 7 – Skládání do pěti
  Zaměření: Součty do 5 bez přenosu.
  Poznámky pro generátor: `a + b`, a,b ≤5, součet =5.
  Ukázkové příklady: 2 + 3 = ?, 4 + 1 = ?
- Level 8 – Skládání do šesti
  Zaměření: Součty ≤6.
  Poznámky pro generátor: `a + b`, součet ≤6.
  Ukázkové příklady: 3 + 2 = ?, 1 + 4 = ?
- Level 9 – Malé odčítání
  Zaměření: Rozdíly v 0–6.
  Poznámky pro generátor: `a - b`, výsledek ≥0.
  Ukázkové příklady: 6 - 2 = ?, 5 - 3 = ?
- Level 10 – Smíšený minidrill
  Zaměření: Náhodné střídání úloh z úrovní 4–9.
  Poznámky pro generátor: Míchejte nástupce, sčítání, odčítání.
  Ukázkové příklady: Po 4?, 2 + 3 = ?, 6 - 4 = ?
Logika progrese: Úrovně 1–4 ověřují připravenost na počítání; úrovně 5–10 upevňují fakta potřebná pro 1. třídu.

## 1. třída ZŠ (věk 6–7 let)
Přehled: Automatizovat sčítání a odčítání do 20 a posílit porozumění desítkové soustavě.
- Level 1 – Sčítání do 10
  Zaměření: `a + b` ≤10 bez přenosu.
  Poznámky pro generátor: Navazujte na úroveň 7 z předškoláků.
  Ukázkové příklady: 4 + 3 = ?, 5 + 5 = ?
- Level 2 – Odčítání do 10
  Zaměření: `a - b` ≤10.
  Poznámky pro generátor: Zajistěte a ≥ b.
  Ukázkové příklady: 8 - 2 = ?, 9 - 5 = ?
- Level 3 – Dostaň na deset
  Zaměření: Doplňování do 10.
  Poznámky pro generátor: Formát `7 + ? = 10`.
  Ukázkové příklady: 6 + ? = 10, ? + 4 = 10
- Level 4 – Sčítání do 20 (bez přechodu)
  Zaměření: `a + b` ≤20 bez přechodu přes desítku.
  Poznámky pro generátor: Jednotky se nesčítají přes 9.
  Ukázkové příklady: 11 + 4 = ?, 13 + 6 = ?
- Level 5 – Odčítání do 20 (bez půjčování)
  Zaměření: Rozdíl ve stejném desítkovém bloku.
  Poznámky pro generátor: Desítka se nemění.
  Ukázkové příklady: 18 - 3 = ?, 17 - 7 = ?
- Level 6 – Přechod přes desítku (sčítání)
  Zaměření: Rozklad na desítku.
  Poznámky pro generátor: Výsledek ≤20.
  Ukázkové příklady: 8 + 7 = ?, 9 + 6 = ?
- Level 7 – Přechod přes desítku (odčítání)
  Zaměření: Půjčování přes desítku.
  Poznámky pro generátor: 11–20 minus 2–9.
  Ukázkové příklady: 15 - 8 = ?, 14 - 6 = ?
- Level 8 – Dvojčata a skoro dvojčata
  Zaměření: `n + n` a `n + (n±1)`.
  Poznámky pro generátor: n v intervalu [1,10].
  Ukázkové příklady: 7 + 7 = ?, 8 + 9 = ?
- Level 9 – Porovnej rozdíl
  Zaměření: `|a - b|` v intervalu 0–20.
  Poznámky pro generátor: Dotaz „O kolik je větší?“.
  Ukázkové příklady: 18 a 11 → rozdíl?, 12 a 12 → rozdíl?
- Level 10 – Smíšené příklady do 20
  Zaměření: Dvoukrokové výrazy s +/−.
  Poznámky pro generátor: `a + b - c`, výsledek 0–20.
  Ukázkové příklady: 6 + 5 - 3 = ?, 12 - 4 + 2 = ?
Logika progrese: Úrovně 1–3 ověřují znalosti z mateřské školy; úrovně 4–7 pokrývají jádro 1. třídy; úrovně 8–10 posilují automatizaci a pružnost.

## 2. třída ZŠ (věk 7–8 let)
Přehled: Rozšířit mentální aritmetiku do 100 a upevnit násobilku/dělení pro 2, 3, 4, 5, 10.
- Level 1 – Zahřívací mix do 20
  Zaměření: Kombinace +/− pro udržení dovednosti.
  Poznámky pro generátor: Vycházejte z úrovně 10 pro 1. třídu.
  Ukázkové příklady: 18 - 7 = ?, 9 + 6 = ?
- Level 2 – Skoky po desítkách
  Zaměření: Přičítání/odčítání násobků 10.
  Poznámky pro generátor: `a ± 10k`, výsledky ≤100.
  Ukázkové příklady: 40 + 30 = ?, 90 - 40 = ?
- Level 3 – Sčítání/odčítání bez přenosu
  Zaměření: Dvojciferná čísla bez přenosu/půjčky.
  Poznámky pro generátor: Součet jednotek <10.
  Ukázkové příklady: 32 + 15 = ?, 84 - 20 = ?
- Level 4 – Sčítání/odčítání s přenosem
  Zaměření: Přenos/půjčka v dvojciferných číslech.
  Poznámky pro generátor: Výsledek <100.
  Ukázkové příklady: 56 + 18 = ?, 73 - 27 = ?
- Level 5 – Násobení 2,5,10
  Zaměření: Automatizace „jednoduchých“ řad.
  Poznámky pro generátor: Násobitel 1–10.
  Ukázkové příklady: 5 × 6 = ?, 10 × 8 = ?
- Level 6 – Dělení 2,5,10
  Zaměření: Inverzní fakta s celým výsledkem.
  Poznámky pro generátor: Dělence jako násobky dělitele.
  Ukázkové příklady: 60 ÷ 10 = ?, 18 ÷ 2 = ?
- Level 7 – Násobení 3 a 4
  Zaměření: Rozšíření řad.
  Poznámky pro generátor: Násobitel 1–10.
  Ukázkové příklady: 3 × 8 = ?, 4 × 9 = ?
- Level 8 – Dělení 3 a 4
  Zaměření: Procvičení rodin příkladů.
  Poznámky pro generátor: Dělence ≤48.
  Ukázkové příklady: 24 ÷ 3 = ?, 32 ÷ 4 = ?
- Level 9 – Zdvojnásob a půlkuj
  Zaměření: Mentální ×2 a ÷2 do 100.
  Poznámky pro generátor: Zahrňte i lichá čísla.
  Ukázkové příklady: Dvojnásobek 27 = ?, Polovina 86 = ?
- Level 10 – Dvoukrokové úlohy do 100
  Zaměření: Kombinace ± a ×/÷ s „přátelskými“ čísly.
  Poznámky pro generátor: Výsledek ≤100.
  Ukázkové příklady: 3 × 5 + 10 = ?, 80 ÷ 4 - 7 = ?
Logika progrese: Úrovně 1–2 opakují; 3–8 přidávají nová fakta; 9–10 propojují násobení a vícekrokové myšlení.

## 3. třída ZŠ (věk 8–9 let)
Přehled: Ovládnout celou malou násobilku/dělení 1–10 a mentálně pracovat se třímístnými čísly.
- Level 1 – Dvojciferné opakování
  Zaměření: Mix ±/× z 2. třídy.
  Poznámky pro generátor: Zahrňte odčítání s půjčkou.
  Ukázkové příklady: 64 - 28 = ?, 4 × 7 = ?
- Level 2 – Násobilka 6 a 7
  Zaměření: Obtížnější řady.
  Poznámky pro generátor: Násobitel 1–10.
  Ukázkové příklady: 6 × 8 = ?, 7 × 9 = ?
- Level 3 – Násobilka 8 a 9
  Zaměření: Závěrečné řady.
  Poznámky pro generátor: Násobitel 1–10.
  Ukázkové příklady: 8 × 9 = ?, 9 × 7 = ?
- Level 4 – Dělení 6–9
  Zaměření: Inverzní vyvolávání.
  Poznámky pro generátor: Dělence ≤81.
  Ukázkové příklady: 72 ÷ 8 = ?, 54 ÷ 6 = ?
- Level 5 – Smíšený násobkový drill
  Zaměření: Libovolné dvojice 1–10.
  Poznámky pro generátor: Náhodně vybírejte.
  Ukázkové příklady: 4 × 9 = ?, 3 × 7 = ?
- Level 6 – Smíšený drill dělení
  Zaměření: `a ÷ b`, b ∈ [1,10].
  Poznámky pro generátor: Podíl celé číslo ≤10.
  Ukázkové příklady: 81 ÷ 9 = ?, 56 ÷ 7 = ?
- Level 7 – Třímístná ± (bez přenosu)
  Zaměření: Přičítání/odčítání stovek a desítek.
  Poznámky pro generátor: Jednotky nulové.
  Ukázkové příklady: 320 + 140 = ?, 760 - 230 = ?
- Level 8 – Třímístná ± (s přenosem)
  Zaměření: Půjčka/přenos přes stovky.
  Poznámky pro generátor: Výsledek <1000.
  Ukázkové příklady: 487 + 268 = ?, 703 - 189 = ?
- Level 9 – 2cif × 1cif
  Zaměření: Mentální částečné součiny.
  Poznámky pro generátor: Součiny ≤300.
  Ukázkové příklady: 24 × 3 = ?, 17 × 4 = ?
- Level 10 – Rodiny příkladů
  Zaměření: Dvoukrokové kombinace, včetně závorek.
  Poznámky pro generátor: `(a × b) ± c`, `(a ÷ b) + c`.
  Ukázkové příklady: (8 × 9) ÷ 4 = ?, 5 × 6 - 12 = ?
Logika progrese: Úrovně 1–4 upevňují náročná fakta; 5–8 prohlubují počítání; 9–10 propojují násobení/dělení s vícekrokovým uvažováním.

## 4. třída ZŠ (věk 9–10 let)
Přehled: Konsolidovat operace s velkými čísly, zavést zlomky a desetinná čísla, propojit aritmetiku s geometrií.
- Level 1 – Vyjádření řádů
  Zaměření: Hodnota číslice v číslech do šesti míst.
  Poznámky pro generátor: Dotazy typu „Jakou hodnotu má 5 ve 352 546?“.
  Ukázkové příklady: Hodnota 5 v 352 546 = ?, Počet stovek v 68 400 = ?
- Level 2 – Čtyřmístná ± (bez přenosu)
  Zaměření: Mentální součty/rozdíly čistých řádů.
  Poznámky pro generátor: Pracujte s tisíci a stovkami.
  Ukázkové příklady: 2 300 + 1 400 = ?, 8 500 - 2 200 = ?
- Level 3 – Čtyřmístná ± (s přenosem)
  Zaměření: Jedno až dvě půjčení/přenosy.
  Poznámky pro generátor: Výsledek <10 000.
  Ukázkové příklady: 4 785 + 2 368 = ?, 9 002 - 3 678 = ?
- Level 4 – 2cif × 1cif (větší činitelé)
  Zaměření: Součiny ≤600.
  Poznámky pro generátor: Dovolte přenos v desítkách.
  Ukázkové příklady: 36 × 7 = ?, 48 × 6 = ?
- Level 5 – 3cif ÷ 1cif
  Zaměření: Přesné dělení s malými zbytky.
  Poznámky pro generátor: Lze zobrazit zbytek zvlášť.
  Ukázkové příklady: 144 ÷ 6 = ?, 225 ÷ 5 = ?
- Level 6 – Zlomek z celku
  Zaměření: Poloviny, třetiny, čtvrtiny do 100.
  Poznámky pro generátor: Počítejte `zlomek × celek`.
  Ukázkové příklady: 1/2 z 18 = ?, 3/4 z 40 = ?
- Level 7 – Rozdíl zlomků (stejné jmenovatele)
  Zaměření: Zlomky se stejným jmenovatelem.
  Poznámky pro generátor: Jmenovatele 4, 6, 8, 10.
  Ukázkové příklady: 3/4 - 2/4 = ?, 7/10 - 3/10 = ?
- Level 8 – Desetinná čísla (desetiny/stotiny)
  Zaměření: Sčítání/odčítání s max. dvěma desetinnými místy.
  Poznámky pro generátor: Zarovnejte desetinnou čárku.
  Ukázkové příklady: 2,5 + 1,2 = ?, 5,0 - 0,7 = ?
- Level 9 – Obsah/obvod obdélníku
  Zaměření: Převod na násobení/sčítání.
  Poznámky pro generátor: Strany ≤30; výsledek celé číslo.
  Ukázkové příklady: Obsah 6 × 4 = ?, Obvod 9 + 9 + 4 + 4 = ?
- Level 10 – Smíšené zlomky/desetinná čísla
  Zaměření: Převody a operace.
  Poznámky pro generátor: Kombinujte poloviny/čtvrtiny s desetinnými čísly.
  Ukázkové příklady: 1/2 + 0,25 = ?, 12 ÷ 0,5 = ?
Logika progrese: Úrovně 1–3 řeší řády a velká čísla; 4–8 školní učivo; 9–10 propojují geometrii a konverze.

## 5. třída ZŠ (věk 10–11 let)
Přehled: Ovládat desetinná čísla a zlomky, zavést procenta.
- Level 1 – Desetinná čísla: sčítání/odčítání
  Zaměření: Operace s desetinnými čísly na setiny.
  Poznámky pro generátor: Součty ≤20.
  Ukázkové příklady: 6,25 + 3,5 = ?, 9,4 - 2,75 = ?
- Level 2 – Ekvivalentní zlomky
  Zaměření: Doplnění čitatele/jmenovatele nebo převod na desetinné číslo.
  Poznámky pro generátor: Jmenovatele 4, 5, 8, 10.
  Ukázkové příklady: 3/4 = ?/8, 2/5 = ? (0,4)
- Level 3 – Zlomek ± (stejné jmenovatele)
  Zaměření: Jmenovatele 4, 5, 8, 10.
  Poznámky pro generátor: Součet ≤2.
  Ukázkové příklady: 3/10 + 4/10 = ?, 5/8 - 1/8 = ?
- Level 4 – Zlomek ↔ procenta ↔ desetinné číslo
  Zaměření: Klíčové převody.
  Poznámky pro generátor: 1/2, 1/4, 3/4, 1/5, 1/10.
  Ukázkové příklady: 1/2 = ? %, 0,2 = ? %
- Level 5 – Procento z celku
  Zaměření: 10 %, 20 %, 25 %, 50 %, 75 %.
  Poznámky pro generátor: Celky dělitelné daným procentem.
  Ukázkové příklady: 25 % z 80 = ?, 10 % ze 140 = ?
- Level 6 – Násobení desetinného čísla celým číslem
  Zaměření: Max. dvě desetinná místa.
  Poznámky pro generátor: Výsledek ≤200.
  Ukázkové příklady: 3,4 × 5 = ?, 12 × 0,8 = ?
- Level 7 – Dělení a násobení 10, 100, 1000
  Zaměření: Posuny desetinné čárky.
  Poznámky pro generátor: Zahrňte celá i desetinná čísla.
  Ukázkové příklady: 720 ÷ 10 = ?, 0,36 × 100 = ?
- Level 8 – Smíšená čísla
  Zaměření: Sčítání/odčítání půlek a čtvrtin.
  Poznámky pro generátor: Interně převádějte na nepravé zlomky.
  Ukázkové příklady: 1 1/2 + 1/4 = ?, 2 - 3/4 = ?
- Level 9 – Aritmetický průměr
  Zaměření: Průměr 3–4 čísel.
  Poznámky pro generátor: Součet dělitelný počtem čísel.
  Ukázkové příklady: Průměr 6, 8, 10 = ?, Průměr 12, 15, 9, 14 = ?
- Level 10 – Vícekroková procenta/zlomky
  Zaměření: Kombinace převodů a aritmetiky.
  Poznámky pro generátor: Např. „najdi 30 % a odečti“.
  Ukázkové příklady: 120 - 25 % z 120 = ?, 30 % z 80 + 0,5 = ?
Logika progrese: Úrovně 1–3 opakují; prostřední budují procenta; vrcholové spojují reprezentace.

## 6. třída ZŠ (věk 11–12 let)
Přehled: Formalizovat teorii čísel, pracovat se zlomky a desetinnými čísly, řešit poměry a procentní změny.
- Level 1 – Připomenutí zlomků/procent
  Zaměření: Rychlé převody.
  Poznámky pro generátor: Náhodné hodnoty z běžných zlomků.
  Ukázkové příklady: 0,75 = ? %, 30 % = ? jako desetinné číslo
- Level 2 – Dělitelnost přes zbytek
  Zaměření: Mentální dělení pro kontrolu dělitelnosti.
  Poznámky pro generátor: Ptejte se na zbytek nebo výsledek.
  Ukázkové příklady: Zbytek 85 ÷ 6 = ?, 96 ÷ 6 = ?
- Level 3 – Prvočísla a faktory
  Zaměření: Nejmenší prvočíselný dělitel, následující prvočíslo.
  Poznámky pro generátor: Čísla 20–100.
  Ukázkové příklady: Nejmenší prvočíselný dělitel 91 = ?, Další prvočíslo po 47 = ?
- Level 4 – NSD/NSN
  Zaměření: Největší společný dělitel a nejmenší společný násobek ≤60.
  Poznámky pro generátor: Kombinujte nesoudělná i sdílející faktory.
  Ukázkové příklady: NSD(24,36) = ?, NSN(12,18) = ?
- Level 5 – Zlomky s různými jmenovateli
  Zaměření: Sčítání/odčítání s jmenovateli 6, 8, 12.
  Poznámky pro generátor: Zajistěte rozumné NSN.
  Ukázkové příklady: 1/3 + 1/4 = ?, 5/6 - 1/8 = ?
- Level 6 – Násobení a dělení zlomků
  Zaměření: Správné i nepravé zlomky.
  Poznámky pro generátor: Výsledek zjednodušte.
  Ukázkové příklady: 3/4 × 2/3 = ?, 5/6 ÷ 1/3 = ?
- Level 7 – Desetinná čísla × a ÷
  Zaměření: Desetinná čísla na setiny.
  Poznámky pro generátor: Zahrňte dělení desetinami.
  Ukázkové příklady: 4,2 × 3 = ?, 2,5 ÷ 0,5 = ?
- Level 8 – Poměry a úměry
  Zaměření: Doplňování chybějící složky `a:b = c:?`.
  Poznámky pro generátor: Výsledky ≤50.
  Ukázkové příklady: 3:5 = ? : 20, 12:18 zjednodušeně = ?
- Level 9 – Procentní změna
  Zaměření: Zvýšení/snížení o 5–25 %.
  Poznámky pro generátor: Výsledek celé číslo nebo jedno desetinné místo.
  Ukázkové příklady: Zvýš 80 o 10 % = ?, Sniž 150 o 20 % = ?
- Level 10 – Geometrie s desetinnými čísly
  Zaměření: Obvod/obsah s desetinnými délkami.
  Poznámky pro generátor: Obdélníky/prav. trojúhelníky s přátelskými hodnotami.
  Ukázkové příklady: Obsah 0,5 × 8 × 5 = ?, Obvod 3,5 + 4,2 + 5,1 = ?
Logika progrese: Úrovně 1–3 opakují; 4–7 rozvíjejí aritmetiku; 8–10 integrují poměry a geometrii.

## 7. třída ZŠ (věk 12–13 let)
Přehled: Zavést celá čísla, prohloubit práci se zlomky/procenty a začít řešit lineární rovnice.
- Level 1 – Pozitivní zahřátí
  Zaměření: ± v intervalu 0–100.
  Poznámky pro generátor: Zahrňte půjčování.
  Ukázkové příklady: 75 - 48 = ?, 36 + 27 = ?
- Level 2 – Sčítání/odčítání záporných čísel
  Zaměření: Součty a rozdíly v intervalu [-50,50].
  Poznámky pro generátor: Včetně přechodu přes nulu.
  Ukázkové příklady: -7 + 12 = ?, 18 - 25 = ?
- Level 3 – Násobení/dělení celých čísel
  Zaměření: Pravidla pro znaménka.
  Poznámky pro generátor: Činitele ≤12.
  Ukázkové příklady: (-6) × 7 = ?, -48 ÷ 6 = ?
- Level 4 – Výrazy se závorkami
  Zaměření: Pořadí operací, záporné číslo v závorce.
  Poznámky pro generátor: Zahrňte záporné závorky.
  Ukázkové příklady: 5 - (-3) = ?, -2 - (4 - 7) = ?
- Level 5 – Zlomky se znaménky
  Zaměření: Sčítání/odčítání se společným jmenovatelem.
  Poznámky pro generátor: Jmenovatel 6, 8, 12.
  Ukázkové příklady: -3/4 + 1/2 = ?, 5/6 - (-1/6) = ?
- Level 6 – Procenta v praxi
  Zaměření: Najdi část, celek nebo procentní sazbu.
  Poznámky pro generátor: Zajistěte celá čísla.
  Ukázkové příklady: 15 % z 80 = ?, 24 je 30 % z ? = ?
- Level 7 – Dosazování do výrazů
  Zaměření: Dosazení celých čísel.
  Poznámky pro generátor: Výrazy typu `2a - 3b`.
  Ukázkové příklady: Pro x=-3: 2x + 5 = ?, Pro a=4: 3a - 2 = ?
- Level 8 – Jednokrokové rovnice
  Zaměření: `ax + b = c`.
  Poznámky pro generátor: Řešení celé číslo.
  Ukázkové příklady: x + 7 = 3, x = ?, 3x = -12, x = ?
- Level 9 – Dvoukrokové rovnice a úměry
  Zaměření: `2x - 5 = 11`, `x/3 = 5/9`.
  Poznámky pro generátor: Řešení celé nebo jednoduchý zlomek.
  Ukázkové příklady: 2x - 5 = 11, x = ?, x/3 = 5/9, x = ?
- Level 10 – Smíšený drill
  Zaměření: Vícekrokové výrazy s celými čísly a zlomky.
  Poznámky pro generátor: Kombinujte celá čísla, zlomky, procenta.
  Ukázkové příklady: (-4 + 9) × 2 = ?, 0,2 × (-15) + 6 = ?
Logika progrese: Úrovně 1–2 opakují kladná čísla; 3–7 budují práci se znaménky; 8–10 přinášejí jednoduchou algebru.

## 8. třída ZŠ (věk 13–14 let)
Přehled: Memorovat mocniny a odmocniny, uplatnit pravidla exponentů, řešit rovnice se zlomky a použít Pythagorovu větu.
- Level 1 – Diagnostika základů
  Zaměření: Rychlá kontrola dovedností z 7. třídy.
  Poznámky pro generátor: Kombinujte celá čísla, zlomky, procenta.
  Ukázkové příklady: -18 + 27 = ?, 25 % z 60 = ?
- Level 2 – Druhé mocniny do 15^2
  Zaměření: Zapamatování čtverců.
  Poznámky pro generátor: n ∈ [1,15].
  Ukázkové příklady: 12^2 = ?, 15^2 = ?
- Level 3 – Druhé odmocniny dokonalých čtverců
  Zaměření: Hlavní odmocniny ≤225.
  Poznámky pro generátor: Uvádějte kladnou odmocninu.
  Ukázkové příklady: √144 = ?, √196 = ?
- Level 4 – Třetí mocniny a odmocniny
  Zaměření: 2^3–6^3 a jejich inverze.
  Poznámky pro generátor: Hodnoty {8, 27, 64, 125, 216}.
  Ukázkové příklady: 4^3 = ?, ³√125 = ?
- Level 5 – Pravidla pro exponenty
  Zaměření: Násobení/dělení stejných základen.
  Poznámky pro generátor: Výsledky ≤ 10^4.
  Ukázkové příklady: 2^3 × 2^4 = ?, 3^5 ÷ 3^2 = ?
- Level 6 – Výrazy s mocninami
  Zaměření: Dosazení do výrazů s exponenty.
  Poznámky pro generátor: Výsledky <500.
  Ukázkové příklady: Pro a=3: 2a^2 + 1 = ?, 5^2 - 3^2 = ?
- Level 7 – Lineární rovnice se zlomky
  Zaměření: Řešení pro x.
  Poznámky pro generátor: Jmenovatele ≤6.
  Ukázkové příklady: (2/3)x = 8, x = ?, x/4 + 3 = 7, x = ?
- Level 8 – Pythagorovské trojice
  Zaměření: Doplňování stran pravoúhlého trojúhelníku.
  Poznámky pro generátor: Trojice (3,4,5), (5,12,13), (8,15,17).
  Ukázkové příklady: Odvěsny 3 a 4 → přepona?, Přepona 13, odvěsna 5 → druhá odvěsna?
- Level 9 – Jednoduché kvadratické rovnice
  Zaměření: `x^2 = k`, x ≥ 0.
  Poznámky pro generátor: k dokonalý čtverec ≤400.
  Ukázkové příklady: x^2 = 121, x = ?, x^2 = 64, x = ?
- Level 10 – Kombinované výzvy s mocninami
  Zaměření: Propojit mocniny, odmocniny a lineární rovnice.
  Poznámky pro generátor: Výrazy typu `√81 + 2^2`, `2x + 5 = √121`.
  Ukázkové příklady: √81 + 16 = ?, 2x + 5 = 11, x = ?
Logika progrese: Úroveň 1 rekapituluje; 2–6 budují exponenty; 7–10 propojují algebru a geometrii.

## 9. třída ZŠ (věk 14–15 let)
Přehled: Přechod k středoškolské algebře – diskriminant, rozklad kvadratických rovnic, racionální výrazy, soustavy a úvod do goniometrie.
- Level 1 – Mocniny a lineární start
  Zaměření: Opakování 8. třídy.
  Poznámky pro generátor: Kombinujte čtverce a lineární rovnice.
  Ukázkové příklady: (-4)^2 = ?, 3x + 4 = 16, x = ?
- Level 2 – Výpočty `(x ± y)^2`
  Zaměření: Numerická hodnota vzorců.
  Poznámky pro generátor: Celá čísla ≤15.
  Ukázkové příklady: Pro x=3,y=5: (x + y)^2 = ?, Pro x=9,y=4: (x - y)^2 = ?
- Level 3 – Diskriminant
  Zaměření: Výpočet `b^2 - 4ac`.
  Poznámky pro generátor: Koeficienty vedou k nezápornému Δ.
  Ukázkové příklady: Pro x^2 - 6x + 8: Δ = ?, Pro 2x^2 + 3x - 5: Δ = ?
- Level 4 – Faktorizovatelné kvadratické rovnice
  Zaměření: Najděte vybraný kořen.
  Poznámky pro generátor: Uveďte, který kořen hráč hledá.
  Ukázkové příklady: Větší kořen x^2 - 7x + 12 = 0 = ?, Kladný kořen x^2 - 4x - 21 = 0 = ?
- Level 5 – Hodnocení racionálních výrazů
  Zaměření: Dosazení bezpečných celých hodnot.
  Poznámky pro generátor: Vyhněte se nulovému jmenovateli.
  Ukázkové příklady: Pro x=2: (x^2 - 4)/(x + 2) = ?, Pro x=3: (x + 1)/(x - 1) = ?
- Level 6 – Zjednoduš před dosazením
  Zaměření: Dosadit po zrušení.
  Poznámky pro generátor: Volte x tak, aby šlo krátit.
  Ukázkové příklady: Pro x=6: (x^2 - 9)/(x - 3) = ?, Pro x=5: (x^2 - 25)/(x - 5) = ?
- Level 7 – Řešení soustav 2×2
  Zaměření: Vraťte x nebo y.
  Poznámky pro generátor: Řešení v celých číslech.
  Ukázkové příklady: {x + y = 10, x - y = 2} → x = ?, {2x + y = 11, x - y = 1} → y = ?
- Level 8 – Procenta a poměry recap
  Zaměření: Aplikovaná aritmetika.
  Poznámky pro generátor: Kombinujte procentní změnu a krácení poměru.
  Ukázkové příklady: 20 % z 250 = ?, Zkrať 45:60 = ?
- Level 9 – Goniometrické hodnoty
  Zaměření: sin, cos, tan pro význačné úhly.
  Poznámky pro generátor: Výsledky 0, ±1/2, ±√3/2, ±1.
  Ukázkové příklady: sin 30° = ?, tan 45° = ?
- Level 10 – Smíšená algebra + goniometrie
  Zaměření: Kombinace kvadratického kořene a trigonometrie.
  Poznámky pro generátor: Výsledek jedno číslo.
  Ukázkové příklady: √81 + sin 30° = ?, Pokud x^2 = 25 a x > 0, spočítej x + cos 60° = ?
Logika progrese: Úrovně 1–3 opakují; 4–7 řeší rovnice a výrazy; 8–10 přidávají aplikovanou aritmetiku a trigonometrické hodnoty.

## 1. ročník SŠ (věk 15–16 let)
Přehled: Posílit lineární algebru, vyhodnocování funkcí a základy analytické geometrie.
- Level 1 – Zjednoduš lineární výraz
  Zaměření: Vyhodnocení po dosazení.
  Poznámky pro generátor: Uveďte hodnotu proměnné.
  Ukázkové příklady: Pro x=4: 3(x + 2) = ?, Pro a=5: 5a - 3a + 4 = ?
- Level 2 – Dvoukrokové lineární rovnice
  Zaměření: Řešení pro x.
  Poznámky pro generátor: Koeficienty do ±12.
  Ukázkové příklady: 2x - 5 = 9, x = ?, (3/4)x + 2 = 5, x = ?
- Level 3 – Soustavy lineárních rovnic
  Zaměření: Eliminace/dosazení.
  Poznámky pro generátor: V dotazu specifikujte hledanou proměnnou.
  Ukázkové příklady: {2x + y = 11, x - y = 1} → x = ?, {x + 2y = 7, x - y = 1} → y = ?
- Level 4 – Vyhodnocení lineárních funkcí
  Zaměření: f(x) = ax + b.
  Poznámky pro generátor: Včetně záporných x.
  Ukázkové příklady: f(x)=3x-4, f(5)=?, g(x)=-2x+7, g(-3)=?
- Level 5 – Směrnice přímky
  Zaměření: Směrnice ze dvou bodů nebo z rovnice.
  Poznámky pro generátor: Výsledek celé číslo.
  Ukázkové příklady: Body (1,3) a (4,9) → směrnice?, Pro y=2x-5 → směrnice?
- Level 6 – Lineární nerovnice
  Zaměření: Vyřešit a uvést hranici.
  Poznámky pro generátor: Jednoduché výsledky typu `x > 3`.
  Ukázkové příklady: 3x - 4 > 5 ⇒ nejmenší celé číslo > řešení?, -2x + 6 ≤ 0 ⇒ x ≥ ?
- Level 7 – Vyhodnocení polynomů
  Zaměření: Dosazení do kvadratů/kubiků.
  Poznámky pro generátor: Koeficienty ≤5.
  Ukázkové příklady: Pro x=-1: x^2 + 3x + 2 = ?, Pro x=2: (x - 1)(x + 3) = ?
- Level 8 – Kořeny z faktorizovaného tvaru
  Zaměření: Najít součet/produkt kořenů.
  Poznámky pro generátor: Uveďte faktorizovaný tvar.
  Ukázkové příklady: Kořeny (x - 2)(x + 5) = 0 → větší kořen?, Součin kořenů (x - 3)(x - 4) = ?
- Level 9 – Vzdálenost bodů
  Zaměření: Vzdálenost ve 2D podle Pythagora.
  Poznámky pro generátor: Souřadnice dávají „přátelskou“ vzdálenost.
  Ukázkové příklady: dist((0,0),(6,8)) = ?, dist((2,3),(5,7)) = ?
- Level 10 – Lineární modelování
  Zaměření: Převod jednoduchého scénáře na výpočet.
  Poznámky pro generátor: Např. aritmetická posloupnost.
  Ukázkové příklady: Začátek 50, přičítej 7 → hodnota v 5. kroku?, Přímka prochází (2,5) se směrnicí 3 ⇒ hodnota v x=4?
Logika progrese: Úrovně 1–4 opakují algebru; 5–8 rozšiřují na směrnice/polynomy; 9–10 propojují s geometrií a modely.

## 2. ročník SŠ (věk 16–17 let)
Přehled: Kvadratické rovnice, posloupnosti, exponenciály, logaritmy a goniometrie.
- Level 1 – Kvadratické opakování
  Zaměření: Faktorizovatelné kvadratické rovnice.
  Poznámky pro generátor: Uveďte, který kořen vrátit.
  Ukázkové příklady: Kladný kořen x^2 - 9 = 0 = ?, Větší kořen x^2 - x - 12 = 0 = ?
- Level 2 – Kvadratický vzorec
  Zaměření: Použití vzorce s dokonalým diskriminantem.
  Poznámky pro generátor: Řešení racionální.
  Ukázkové příklady: x^2 - 4x - 21 = 0 → x = ?, 2x^2 - 3x - 5 = 0 → x = ?
- Level 3 – Posloupnosti
  Zaměření: Další člen nebo n-tý člen.
  Poznámky pro generátor: Celé výsledky.
  Ukázkové příklady: Další člen 5,8,11,? = ?, 7. člen (a1=2, d=3) = ?
- Level 4 – Exponenciální výrazy
  Zaměření: `a^n` a jejich kombinace.
  Poznámky pro generátor: Základy 2,3,5; exponenty ≤6.
  Ukázkové příklady: 3^4 = ?, 5^3 × 5^2 = ?
- Level 5 – Logaritmy
  Zaměření: Výpočet logaritmů s přátelskými argumenty.
  Poznámky pro generátor: Základ 2, 3, 10.
  Ukázkové příklady: log2 32 = ?, log10 1000 = ?
- Level 6 – Goniometrické hodnoty
  Zaměření: sin/cos/tan pro standardní úhly (stupně a radiány).
  Poznámky pro generátor: Uveďte π/6, π/4, π/3.
  Ukázkové příklady: cos 60° = ?, sin (π/6) = ?
- Level 7 – Jednoduché goniometrické rovnice
  Zaměření: Nejmenší kladné řešení v 0°–360°.
  Poznámky pro generátor: Pracujte s tabulkovými hodnotami.
  Ukázkové příklady: sin x = 0,5 → nejmenší x = ?, cos x = 0 → nejmenší kladné x = ?
- Level 8 – Složené funkce
  Zaměření: g(f(x)) a f(g(x)).
  Poznámky pro generátor: Lineární/kvadratické páry.
  Ukázkové příklady: f(x)=2x+1, g(x)=x^2 → g(f(3))=?, f(x)=x^2-1, g(x)=x-4 → f(g(5))=?
- Level 9 – Práce s odmocninami
  Zaměření: Násobení/dělení odmocnin (výsledek -> celé číslo nebo zjednodušený tvar).
  Poznámky pro generátor: Volte páry, kde je možné racionalizovat.
  Ukázkové příklady: √2 × √8 = ?, √12 ÷ √3 = ?
- Level 10 – Základy pravděpodobnosti
  Zaměření: Kombinace/permutace nebo jednoduché pravděpodobnosti.
  Poznámky pro generátor: Malé n ≤10, výsledky celé číslo nebo jednoduchý zlomek.
  Ukázkové příklady: C(5,2) = ?, Pravděpodobnost hodu 6 na kostce = ?
Logika progrese: Úrovně 1–3 upevňují kvadratické rovnice a posloupnosti; 4–9 rozšiřují na exponenciály/logaritmy/gonio; 10 přidává pravděpodobnost.

## 3. ročník SŠ (věk 17–18 let)
Přehled: Úvod do diferenciálního a integrálního počtu, základy matic a vektorů, pokročilejší algebra.
- Level 1 – Kombinace exponentů/logaritmů
  Zaměření: Vyhodnotit smíšené výrazy.
  Poznámky pro generátor: Výsledek celé číslo nebo jednoduché desetinné.
  Ukázkové příklady: 2^3 × 5^2 = ?, log10 100 + log10 1000 = ?
- Level 2 – Zbytek po dělení polynomem
  Zaměření: Využití věty o zbytku.
  Poznámky pro generátor: Dosazení lineárního kořene.
  Ukázkové příklady: Zbytek x^3 - 2x + 1 při x=2 = ?, Zbytek x^2 + 5x + 6 při x=-3 = ?
- Level 3 – Derivace v bodě
  Zaměření: Pravidlo pro mocniny, dosazení.
  Poznámky pro generátor: Polynom stupně ≤3.
  Ukázkové příklady: d/dx(x^3) v x=2 = ?, d/dx(5x^2 - 3x) v x=1 = ?
- Level 4 – Směrnice tečny
  Zaměření: Interpretace derivace.
  Poznámky pro generátor: Uveďte funkci a x.
  Ukázkové příklady: Směrnice y = x^2 v x=3 = ?, Okamžitá rychlost y=2x^3 v x=1 = ?
- Level 5 – Kontrola primitivních funkcí
  Zaměření: Určité integrály jednoduchých polynomů.
  Poznámky pro generátor: Intervaly s celým výsledkem.
  Ukázkové příklady: ∫_0^1 3x^2 dx = ?, ∫_0^2 2x dx = ?
- Level 6 – Integrál se substitucí „light“
  Zaměření: Lineární vnitřní funkce.
  Poznámky pro generátor: Výsledek celé číslo.
  Ukázkové příklady: ∫_0^1 4x dx = ?, ∫_0^1 6x^2 dx = ?
- Level 7 – Limity racionálních funkcí
  Zaměření: Limita v bodě po vykrácení.
  Poznámky pro generátor: Vyhněte se 0/0 po zjednodušení.
  Ukázkové příklady: lim_{x→2} (x^2 - 4)/(x - 2) = ?, lim_{x→1} (x^3 - 1)/(x - 1) = ?
- Level 8 – Determinanty 2×2
  Zaměření: Rychlý výpočet determinantu.
  Poznámky pro generátor: Prvky v ±9.
  Ukázkové příklady: |1 2; 3 4| = ?, |2 -1; 5 0| = ?
- Level 9 – Vektory (skalární součin)
  Zaměření: Skalární součin 2D/3D.
  Poznámky pro generátor: Složky ≤10.
  Ukázkové příklady: (2,3) · (4,5) = ?, (1, -2, 3) · (0, 5, -1) = ?
- Level 10 – Smíšená pokročilá výzva
  Zaměření: Spojit počet, algebru a vektory.
  Poznámky pro generátor: Dvoukrokový numerický výsledek.
  Ukázkové příklady: (d/dx x^2 v x=4) + √49 = ?, Determinant |1 1; 1 2| + ∫_0^1 x dx = ?
Logika progrese: Úrovně 1–4 upevňují algebru/diferenciální počet; 5–7 přidávají integrály a limity; 8–10 lineární algebru a kombinované úlohy.

## 4. ročník SŠ (věk 18–19 let)
Přehled: Příprava na maturitu – upevnění počtu, pokročilá goniometrie, posloupnosti, pravděpodobnost a komplexní čísla.
- Level 1 – Smíšené opakování
  Zaměření: Ujistit se o dovednostech z 3. ročníku.
  Poznámky pro generátor: Kombinujte derivace/integrály s exponenty.
  Ukázkové příklady: d/dx(x^3) v x=2 + 5 = ?, √144 + log10 100 = ?
- Level 2 – Číselné trig. identity
  Zaměření: sin^2θ + cos^2θ = 1 apod.
  Poznámky pro generátor: Standardní úhly.
  Ukázkové příklady: Pokud sin 30° = 0,5, spočtěte cos^230° + sin^230° = ?, tan 45° × cos 45° = ?
- Level 3 – Exponenciální/logaritmické rovnice
  Zaměření: Najděte x.
  Poznámky pro generátor: Celá řešení.
  Ukázkové příklady: 2^x = 32, x = ?, log3(x) = 2, x = ?
- Level 4 – Optimalizace pomocí derivace
  Zaměření: Najít stacionární bod.
  Poznámky pro generátor: Jednoduché kvadratické funkce.
  Ukázkové příklady: y = -2x^2 + 8x → x vrcholu = ?, Max y = -x^2 + 9 = ?
- Level 5 – Součty posloupností
  Zaměření: Součet aritmetické/geometrické řady.
  Poznámky pro generátor: Malé n pro mentální výpočet.
  Ukázkové příklady: Součet prvních 10 přirozených čísel = ?, Součet 1 + 2 + 4 + 8 = ?
- Level 6 – Kombinatorika/pravděpodobnost
  Zaměření: Binomické počty nebo jednoduché pravděpodobnosti.
  Poznámky pro generátor: Výsledek jednoduchý zlomek.
  Ukázkové příklady: Počet výběrů 3 z 6 = ?, Pravděpodobnost červená (3/5) pak modrá (2/4) = ?
- Level 7 – Komplexní čísla
  Zaměření: Absolutní hodnota, reálná/imaginární složka.
  Poznámky pro generátor: Celá čísla ve složkách.
  Ukázkové příklady: |3 + 4i| = ?, Reálná část (2 + 5i) + (3 - 2i) = ?
- Level 8 – Inverzní matice 2×2
  Zaměření: Determinant a prvky inverze.
  Poznámky pro generátor: Determinant ≠0; specifikujte hledaný prvek.
  Ukázkové příklady: Pro |1 2; 3 4|, det = ?, Prvek a₁₁ inverze (na 2 desetinná místa) = ?
- Level 9 – Limity a spojitost
  Zaměření: Jednoduché limity s konstantním výsledkem.
  Poznámky pro generátor: Zahrňte limity s e a sin x / x.
  Ukázkové příklady: lim_{n→∞} (1 + 1/n)^n ≈ ?, lim_{x→0} sin x / x = ?
- Level 10 – Finální mix
  Zaměření: Propojit počet, goniometrii, pravděpodobnost.
  Poznámky pro generátor: Výsledek snadno spočitatelný.
  Ukázkové příklady: (d/dx x^3 v x=3) + sin 90° = ?, C(5,2) + √(cos^2 0°) = ?
Logika progrese: Úrovně 1–3 opakují algebra/trig; 4–7 přidávají počet, posloupnosti, komplexní čísla; 8–10 uzavírají maturitní přípravu.

---

Poznámky k použití: První dvě až tři úrovně každého ročníku záměrně zhušťují dovednosti z nižších ročníků (aby starší žáci prokázali základy) a následné úrovně rozvíjejí učivo ročníku až po náročné výzvy. Při implementaci mapujte tyto definice na konfiguraci generátorů v `questions.js` tak, aby výstupy zůstaly číselné a čas pro odpověď byl přibližně do 3 sekund.
