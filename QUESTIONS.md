# MathWizard Question Plan (Czech Curriculum Alignment)

Purpose: Provide 10 progressively challenging question levels for each Czech school year, ensuring every grade starts with a diagnostic of prerequisite skills and finishes with stretch goals for quick mental computation. Content synthesizes OTAZKY_GPT5.md and OTAZKY_CLAUDE.md.

Implementation conventions:
- Keep on-screen prompts short (<20 characters) by using arithmetic expressions or minimal text.
- All prompt templates must evaluate to a single numeric answer (integer or terminating decimal); adjust question framing accordingly.
- "Generator notes" flag the number ranges or helper routines the game needs; "Sample prompts" list a few cases to test manually.

## Pre-school (Pre-primary, Age 5-6)
Overview: Build number sense to 10, sequencing, and comparison without formal algorithms.
- Level 1 - Count up to 3
  Focus: Subitize very small groups.
  Generator notes: display 0-3 icons, ask for the count.
  Sample prompts: dotdot = ?, star = ?
- Level 2 - Count up to 5
  Focus: One-to-one counting 0-5.
  Generator notes: vary arrangements; accept digit.
  Sample prompts: starstarstarstar = ?, How many hearts? (5)
- Level 3 - Compare by difference
  Focus: Judge which set is larger by finding the difference.
  Generator notes: show two groups <=5; ask "How many more?"
  Sample prompts: 4 vs 2 -> difference?, 5 vs 5 -> difference?
- Level 4 - Next in sequence
  Focus: Successor within 0-6.
  Generator notes: prompt `Next after n`.
  Sample prompts: Next after 2?, Next after 5?
- Level 5 - Add one
  Focus: `n + 1` with 0-5.
  Generator notes: expression format `n + 1`.
  Sample prompts: 3 + 1 = ?, 5 + 1 = ?
- Level 6 - Take away one
  Focus: `n - 1` with 1-6.
  Generator notes: expression `n - 1`.
  Sample prompts: 4 - 1 = ?, 2 - 1 = ?
- Level 7 - Compose to five
  Focus: Sums to 5 without carrying.
  Generator notes: `a + b`, a,b <=5, sum=5.
  Sample prompts: 2 + 3 = ?, 4 + 1 = ?
- Level 8 - Compose to six
  Focus: Sums <=6.
  Generator notes: `a + b`, sum <=6.
  Sample prompts: 3 + 2 = ?, 1 + 4 = ?
- Level 9 - Small takeaways
  Focus: Differences within 0-6.
  Generator notes: `a - b`, result >=0.
  Sample prompts: 6 - 2 = ?, 5 - 3 = ?
- Level 10 - Mixed mini drills
  Focus: Blend Levels 4-9 randomly.
  Generator notes: shuffle successor, addition, subtraction.
  Sample prompts: Next after 4?, 2 + 3 = ?, 6 - 4 = ?
Progression logic: Levels 1-4 certify counting readiness; Levels 5-10 rehearse the addition/subtraction facts Grade 1 depends on.

## Grade 1 (Primary Year 1, Age 6-7)
Overview: Automate addition/subtraction within 20 and strengthen place-value intuition.
- Level 1 - Add within 10
  Focus: `a + b` <=10, no carry.
  Generator notes: reuse Pre-school Level 7 items.
  Sample prompts: 4 + 3 = ?, 5 + 5 = ?
- Level 2 - Subtract within 10
  Focus: `a - b` <=10.
  Generator notes: ensure a >= b.
  Sample prompts: 8 - 2 = ?, 9 - 5 = ?
- Level 3 - Make ten
  Focus: Missing addends to 10.
  Generator notes: prompt `7 + ? = 10`.
  Sample prompts: 6 + ? = 10, ? + 4 = 10
- Level 4 - Add within 20 (no crossing)
  Focus: `a + b` <=20 without tens rollover.
  Generator notes: units sum <=9.
  Sample prompts: 11 + 4 = ?, 13 + 6 = ?
- Level 5 - Subtract within 20 (no borrowing)
  Focus: Differences that stay within tens block.
  Generator notes: tens digit does not change.
  Sample prompts: 18 - 3 = ?, 17 - 7 = ?
- Level 6 - Crossing ten addition
  Focus: Decompose to make ten.
  Generator notes: totals <=20.
  Sample prompts: 8 + 7 = ?, 9 + 6 = ?
- Level 7 - Crossing ten subtraction
  Focus: Borrow across ten.
  Generator notes: 11-20 minus 2-9.
  Sample prompts: 15 - 8 = ?, 14 - 6 = ?
- Level 8 - Doubles and near doubles
  Focus: `n + n` and `n + (n+/-1)`.
  Generator notes: n in [1,10].
  Sample prompts: 7 + 7 = ?, 8 + 9 = ?
- Level 9 - Compare by difference
  Focus: `|a - b|` within 0-20.
  Generator notes: ask "How much bigger?".
  Sample prompts: 18 and 11 -> difference?, 12 and 12 -> difference?
- Level 10 - Mixed within 20
  Focus: Two-step expressions using +/-.
  Generator notes: `a + b - c`, result 0-20.
  Sample prompts: 6 + 5 - 3 = ?, 12 - 4 + 2 = ?
Progression logic: Levels 1-3 confirm Pre-school mastery; Levels 4-7 cover Grade 1 core; Levels 8-10 push automaticity and mental flexibility.

## Grade 2 (Primary Year 2, Age 7-8)
Overview: Extend mental arithmetic to 100 and lock in multiplication/division for 2, 3, 4, 5, 10.
- Level 1 - Warm-up within 20
  Focus: Mixed +/- to 20 for retention.
  Generator notes: remix Grade 1 Level 10 patterns.
  Sample prompts: 18 - 7 = ?, 9 + 6 = ?
- Level 2 - Tens jumps
  Focus: Add/sub multiples of 10.
  Generator notes: `a +/- 10k`, totals <=100.
  Sample prompts: 40 + 30 = ?, 90 - 40 = ?
- Level 3 - Add/sub without crossing 100
  Focus: Two-digit numbers, no regrouping.
  Generator notes: units sum <10.
  Sample prompts: 32 + 15 = ?, 84 - 20 = ?
- Level 4 - Add/sub with regrouping
  Focus: Carry/borrow in two-digit numbers.
  Generator notes: totals <100.
  Sample prompts: 56 + 18 = ?, 73 - 27 = ?
- Level 5 - Multiplication 2,5,10
  Focus: Memorize easy rows.
  Generator notes: 1-10 multiplier.
  Sample prompts: 5 * 6 = ?, 10 * 8 = ?
- Level 6 - Division by 2,5,10
  Focus: Inverse facts with whole results.
  Generator notes: dividends multiples of divisor.
  Sample prompts: 60 / 10 = ?, 18 / 2 = ?
- Level 7 - Multiplication 3 and 4
  Focus: Extend times tables.
  Generator notes: 1-10 multiplier.
  Sample prompts: 3 * 8 = ?, 4 * 9 = ?
- Level 8 - Division by 3 and 4
  Focus: Reinforce fact families.
  Generator notes: dividends <= 48.
  Sample prompts: 24 / 3 = ?, 32 / 4 = ?
- Level 9 - Doubling and halving
  Focus: Mental *2, /2 up to 100.
  Generator notes: include odd numbers.
  Sample prompts: double 27 = ?, half of 86 = ?
- Level 10 - Two-step within 100
  Focus: Combine +/- and */ with friendly numbers.
  Generator notes: results <=100.
  Sample prompts: 3 * 5 + 10 = ?, 80 / 4 - 7 = ?
Progression logic: Levels 1-2 review; Levels 3-8 introduce new facts; Levels 9-10 integrate scaling and multi-step fluency.

## Grade 3 (Primary Year 3, Age 8-9)
Overview: Master full 1-10 multiplication/division tables and manipulate three-digit numbers mentally.
- Level 1 - Two-digit review
  Focus: Mixed +/-/* from Grade 2.
  Generator notes: include subtraction with regrouping.
  Sample prompts: 64 - 28 = ?, 4 * 7 = ?
- Level 2 - Multiplication 6 and 7
  Focus: Tough rows.
  Generator notes: 1-10 multiplier.
  Sample prompts: 6 * 8 = ?, 7 * 9 = ?
- Level 3 - Multiplication 8 and 9
  Focus: Final rows.
  Generator notes: 1-10 multiplier.
  Sample prompts: 8 * 9 = ?, 9 * 7 = ?
- Level 4 - Division facts 6-9
  Focus: Inverse recall.
  Generator notes: dividends <=81.
  Sample prompts: 72 / 8 = ?, 54 / 6 = ?
- Level 5 - Mixed multiplication drill
  Focus: Any 1-10 * 1-10.
  Generator notes: random pairs.
  Sample prompts: 4 * 9 = ?, 3 * 7 = ?
- Level 6 - Division mixed drill
  Focus: `a / b` with b in [1,10].
  Generator notes: ensure integer quotient <=10.
  Sample prompts: 81 / 9 = ?, 56 / 7 = ?
- Level 7 - Three-digit +/- (no regroup)
  Focus: Add/sub multiples of hundreds and tens.
  Generator notes: keep ones zero.
  Sample prompts: 320 + 140 = ?, 760 - 230 = ?
- Level 8 - Three-digit +/- (with regroup)
  Focus: Borrow/carry across hundreds.
  Generator notes: limit result <1000.
  Sample prompts: 487 + 268 = ?, 703 - 189 = ?
- Level 9 - 2-digit * 1-digit
  Focus: Mental partial products.
  Generator notes: product <= 300.
  Sample prompts: 24 * 3 = ?, 17 * 4 = ?
- Level 10 - Fact families challenge
  Focus: Two-step combos, include brackets.
  Generator notes: `(a * b) +/- c`, `(a / b) + c`.
  Sample prompts: (8 * 9) / 4 = ?, 5 * 6 - 12 = ?
Progression logic: Levels 1-4 shore up tricky facts; Levels 5-8 deepen computation; Levels 9-10 connect multiplication/division to multi-step reasoning.

## Grade 4 (Primary Year 4, Age 9-10)
Overview: Consolidate large-number operations, introduce fractions and decimals, and connect arithmetic to geometry.
- Level 1 - Place value drill
  Focus: Identify digit value in up to 6-digit numbers.
  Generator notes: ask "What is the value of the 5 in 352 546?"
  Sample prompts: Value of 5 in 352 546 = ?, Hundreds in 68 400 = ?
- Level 2 - Four-digit +/- (no regroup)
  Focus: Mental addition/subtraction with clean digits.
  Generator notes: limit to thousands and hundreds.
  Sample prompts: 2 300 + 1 400 = ?, 8 500 - 2 200 = ?
- Level 3 - Four-digit +/- (with regroup)
  Focus: Carry/borrow once or twice.
  Generator notes: results <10 000.
  Sample prompts: 4 785 + 2 368 = ?, 9 002 - 3 678 = ?
- Level 4 - 2-digit * 1-digit (larger factors)
  Focus: Extend to products <=600.
  Generator notes: allow carrying in tens.
  Sample prompts: 36 * 7 = ?, 48 * 6 = ?
- Level 5 - 3-digit / 1-digit
  Focus: Exact division with small remainders.
  Generator notes: optionally surface remainder separately.
  Sample prompts: 144 / 6 = ?, 225 / 5 = ?
- Level 6 - Fraction of a whole
  Focus: halves, thirds, quarters of numbers <=100.
  Generator notes: compute `fraction * whole`.
  Sample prompts: 1/2 of 18 = ?, 3/4 of 40 = ?
- Level 7 - Fraction difference (like denominators)
  Focus: subtract fractions sharing denominator.
  Generator notes: denominators 4, 6, 8, 10.
  Sample prompts: 3/4 - 2/4 = ?, 7/10 - 3/10 = ?
- Level 8 - Decimal tenths/hundredths
  Focus: Add/sub decimals with <=2 places.
  Generator notes: align decimal points.
  Sample prompts: 2.5 + 1.2 = ?, 5.0 - 0.7 = ?
- Level 9 - Rectangle area/perimeter
  Focus: Apply multiplication/addition.
  Generator notes: sides <=30; area/perimeter integer.
  Sample prompts: Area 6 * 4 = ?, Perimeter 9 + 9 + 4 + 4 = ?
- Level 10 - Mixed fraction/decimal tasks
  Focus: Convert and operate.
  Generator notes: combine halves/quarters with decimals.
  Sample prompts: 1/2 + 0.25 = ?, 12 / 0.5 = ?
Progression logic: Levels 1-3 reinforce large-number place value; Levels 4-8 target curriculum goals; Levels 9-10 integrate geometry and conversions.

## Grade 5 (Primary Year 5, Age 10-11)
Overview: Operate with decimals and fractions confidently and introduce percentage reasoning.
- Level 1 - Decimal +/- warm-up
  Focus: Add/sub decimals to hundredths.
  Generator notes: totals <=20.
  Sample prompts: 6.25 + 3.5 = ?, 9.4 - 2.75 = ?
- Level 2 - Equivalent fractions
  Focus: Find missing numerator/denominator or decimal form.
  Generator notes: denominators 4, 5, 8, 10.
  Sample prompts: 3/4 = ?/8, 2/5 = ? (0.4)
- Level 3 - Fraction +/- same denominator
  Focus: denominators 4, 5, 8, 10.
  Generator notes: sums <=2.
  Sample prompts: 3/10 + 4/10 = ?, 5/8 - 1/8 = ?
- Level 4 - Fraction <-> percent <-> decimal
  Focus: Core conversions.
  Generator notes: include 1/2, 1/4, 3/4, 1/5, 1/10.
  Sample prompts: 1/2 = ?%, 0.2 = ?%
- Level 5 - Percent of whole
  Focus: 10%, 20%, 25%, 50%, 75%.
  Generator notes: wholes divisible appropriately.
  Sample prompts: 25% of 80 = ?, 10% of 140 = ?
- Level 6 - Multiply decimals by whole numbers
  Focus: <=2 decimal places.
  Generator notes: products <=200.
  Sample prompts: 3.4 * 5 = ?, 12 * 0.8 = ?
- Level 7 - Divide by 10, 100, 1000
  Focus: place-value shifts.
  Generator notes: include decimals and whole numbers.
  Sample prompts: 720 / 10 = ?, 0.36 * 100 = ?
- Level 8 - Mixed number adjustments
  Focus: add/sub halves and quarters.
  Generator notes: convert to improper fraction internally.
  Sample prompts: 1 1/2 + 1/4 = ?, 2 - 3/4 = ?
- Level 9 - Mean of small data set
  Focus: average 3-4 numbers.
  Generator notes: ensure total divisible by count.
  Sample prompts: Mean of 6,8,10 = ?, Mean of 12,15,9,14 = ?
- Level 10 - Multi-step percent/fraction
  Focus: combine conversions and arithmetic.
  Generator notes: sequences like "find 30% then subtract".
  Sample prompts: 120 - 25% of 120 = ?, 30% of 80 + 0.5 = ?
Progression logic: Levels 1-3 revisit decimals/fractions; mid-levels establish percent fluency; top levels mix representations in two-step tasks.

## Grade 6 (Lower Secondary Year 6, Age 11-12)
Overview: Formalize number theory, operate with fractions and decimals, and explore ratios and percent change.
- Level 1 - Fraction/percent recap
  Focus: quick conversions to ensure Grade 5 retention.
  Generator notes: random value among common fractions.
  Sample prompts: 0.75 = ?%, 30% = ? as a decimal
- Level 2 - Divisibility via remainder
  Focus: mental division to check divisibility.
  Generator notes: ask for remainder or quotient when clean.
  Sample prompts: Remainder of 85 / 6 = ?, 96 / 6 = ?
- Level 3 - Prime factors insight
  Focus: identify smallest prime factor or next prime.
  Generator notes: numbers 20-100.
  Sample prompts: Smallest prime factor of 91 = ?, Next prime after 47 = ?
- Level 4 - GCD/LCM pairs
  Focus: compute quickly for numbers <=60.
  Generator notes: use co-prime vs shared factors mix.
  Sample prompts: GCD(24,36) = ?, LCM(12,18) = ?
- Level 5 - Fraction +/- unlike denominators
  Focus: denominators 6, 8, 12.
  Generator notes: ensure manageable LCM.
  Sample prompts: 1/3 + 1/4 = ?, 5/6 - 1/8 = ?
- Level 6 - Fraction * and /
  Focus: proper/improper fractions.
  Generator notes: simplify result.
  Sample prompts: 3/4 * 2/3 = ?, 5/6 / 1/3 = ?
- Level 7 - Decimal * and /
  Focus: decimals up to hundredths.
  Generator notes: include division by tenths.
  Sample prompts: 4.2 * 3 = ?, 2.5 / 0.5 = ?
- Level 8 - Ratios and proportions
  Focus: find missing term in `a:b = c:?`.
  Generator notes: solutions integer <=50.
  Sample prompts: 3:5 = ? : 20, 12:18 simplified = ?
- Level 9 - Percentage change
  Focus: increase/decrease by 5-25%.
  Generator notes: outputs integer or one decimal.
  Sample prompts: Increase 80 by 10% = ?, Decrease 150 by 20% = ?
- Level 10 - Geometry with decimals
  Focus: perimeter/area with decimal sides.
  Generator notes: rectangles/triangles with friendly values.
  Sample prompts: Area 0.5 * 8 * 5 = ?, Perimeter 3.5 + 4.2 + 5.1 = ?
Progression logic: Levels 1-3 recover prior knowledge; Levels 4-7 deliver core arithmetic; Levels 8-10 integrate proportional reasoning and geometry.

## Grade 7 (Lower Secondary Year 7, Age 12-13)
Overview: Introduce signed numbers, deepen fraction/percent fluency, and begin solving linear equations.
- Level 1 - Positive integer warm-up
  Focus: +/- within 0-100.
  Generator notes: include regrouping.
  Sample prompts: 75 - 48 = ?, 36 + 27 = ?
- Level 2 - Add/sub negative integers
  Focus: sums/differences in [-50,50].
  Generator notes: include zero crossings.
  Sample prompts: -7 + 12 = ?, 18 - 25 = ?
- Level 3 - Multiply/divide integers
  Focus: sign rules.
  Generator notes: factors <=12.
  Sample prompts: (-6) * 7 = ?, -48 / 6 = ?
- Level 4 - Integer expressions with parentheses
  Focus: apply order of operations.
  Generator notes: include nested negatives.
  Sample prompts: 5 - ( -3 ) = ?, -2 - (4 - 7) = ?
- Level 5 - Fraction operations with signs
  Focus: add/sub like denominators including negatives.
  Generator notes: denominators 6, 8, 12.
  Sample prompts: -3/4 + 1/2 = ?, 5/6 - (-1/6) = ?
- Level 6 - Percent applications
  Focus: find part, whole, or rate.
  Generator notes: ensure integer answers.
  Sample prompts: 15% of 80 = ?, 24 is 30% of ? = ?
- Level 7 - Evaluate algebraic expressions
  Focus: substitute integers into simple expressions.
  Generator notes: `2a - 3b` style.
  Sample prompts: For x=-3: 2x + 5 = ?, For a=4: 3a - 2 = ?
- Level 8 - One-step linear equations
  Focus: `ax + b = c` patterns.
  Generator notes: integer solutions.
  Sample prompts: x + 7 = 3, x = ?, 3x = -12, x = ?
- Level 9 - Two-step equations & proportions
  Focus: `2x - 5 = 11`, `x/3 = 5/9`.
  Generator notes: answers integer or simple fraction.
  Sample prompts: 2x - 5 = 11, x = ?, x/3 = 5/9, x = ?
- Level 10 - Mixed integer/fraction drill
  Focus: multi-step expressions blending signs and fractions.
  Generator notes: pair integers, fractions, percents.
  Sample prompts: ( -4 + 9 ) * 2 = ?, 0.2 * ( -15 ) + 6 = ?
Progression logic: Levels 1-2 revisit positives; Levels 3-7 build signed arithmetic; Levels 8-10 bring in algebraic solving.

## Grade 8 (Lower Secondary Year 8, Age 13-14)
Overview: Memorize powers and roots, apply exponent rules, solve linear equations with fractions, and use the Pythagorean theorem.
- Level 1 - Mixed basics diagnostic
  Focus: quick check of prior-year fluency.
  Generator notes: combine integers, fractions, percents.
  Sample prompts: -18 + 27 = ?, 25% of 60 = ?
- Level 2 - Squares up to 15^2
  Focus: recall perfect squares.
  Generator notes: n in [1,15].
  Sample prompts: 12^2 = ?, 15^2 = ?
- Level 3 - Square roots of perfect squares
  Focus: principal square roots <=225.
  Generator notes: respond with positive root.
  Sample prompts: sqrt(144) = ?, sqrt(196) = ?
- Level 4 - Cubes and cube roots
  Focus: 2^3-6^3 and inverses.
  Generator notes: limited set {8,27,64,125,216}.
  Sample prompts: 4^3 = ?, cubeRoot(125) = ?
- Level 5 - Exponent rules
  Focus: same-base multiplication/division.
  Generator notes: keep results <= 10^4.
  Sample prompts: 2^3 * 2^4 = ?, 3^5 / 3^2 = ?
- Level 6 - Evaluate expressions with powers
  Focus: substitute integers into exponential expressions.
  Generator notes: keep answers <500.
  Sample prompts: For a=3: 2a^2 + 1 = ?, (5^2 - 3^2) = ?
- Level 7 - Linear equations with fractions
  Focus: solve for x.
  Generator notes: coefficient denominators <=6.
  Sample prompts: (2/3)x = 8, x = ?, x/4 + 3 = 7, x = ?
- Level 8 - Pythagorean triples
  Focus: find missing side in right triangle.
  Generator notes: use (3,4,5), (5,12,13), (8,15,17).
  Sample prompts: Legs 3 & 4 => hypotenuse?, Hypotenuse 13, leg 5 => other leg?
- Level 9 - Quadratic principal roots
  Focus: solve `x^2 = k` with x >= 0.
  Generator notes: k is perfect square <=400.
  Sample prompts: x^2 = 121, x = ?, x^2 = 64, x = ?
- Level 10 - Multi-step power challenge
  Focus: combine powers, roots, linear solving.
  Generator notes: expressions like `sqrt(81) + 2^2`, `2x + 5 = sqrt(121)`.
  Sample prompts: sqrt(81) + 16 = ?, 2x + 5 = 11, x = ?
Progression logic: Level 1 confirms basics; Levels 2-6 build power/ exponent fluency; Levels 7-10 integrate algebra and geometry.

## Grade 9 (Lower Secondary Year 9, Age 14-15)
Overview: Transition to high-school algebra with discriminants, factorable quadratics, rational expressions, systems, and introductory trigonometry.
- Level 1 - Power & linear warm-up
  Focus: ensure Level 8 skills persist.
  Generator notes: mix squares, linear solves.
  Sample prompts: (-4)^2 = ?, 3x + 4 = 16, x = ?
- Level 2 - Evaluate perfect-square forms
  Focus: compute `(x +/- y)^2` numerically.
  Generator notes: choose integer x,y <=15.
  Sample prompts: For x=3,y=5: (x + y)^2 = ?, For x=9,y=4: (x - y)^2 = ?
- Level 3 - Discriminant drill
  Focus: compute `b^2 - 4ac`.
  Generator notes: coefficients produce non-negative discriminants.
  Sample prompts: For x^2 - 6x + 8, Delta = ?, For 2x^2 + 3x - 5, Delta = ?
- Level 4 - Factorable quadratics (selected root)
  Focus: find larger (or positive) root when factorable.
  Generator notes: provide guidance in prompt.
  Sample prompts: Larger root of x^2 - 7x + 12 = 0 = ?, Positive root of x^2 - 4x - 21 = 0 = ?
- Level 5 - Evaluate rational expressions
  Focus: substitute safe integer values.
  Generator notes: avoid zero denominator.
  Sample prompts: For x=2: (x^2 - 4)/(x + 2) = ?, For x=3: (x + 1)/(x - 1) = ?
- Level 6 - Simplify via substitution
  Focus: plug value after conceptual simplification.
  Generator notes: choose x so cancellation is evident.
  Sample prompts: For x=6: (x^2 - 9)/(x - 3) = ?, For x=5: (x^2 - 25)/(x - 5) = ?
- Level 7 - Solve 2x2 linear systems
  Focus: report x or y as specified.
  Generator notes: integer solutions.
  Sample prompts: {x + y = 10, x - y = 2} -> x = ?, {2x + y = 11, x - y = 1} -> y = ?
- Level 8 - Percent and ratio recap
  Focus: ensure applied arithmetic fluency.
  Generator notes: combine percent change and ratio simplification.
  Sample prompts: 20% of 250 = ?, Simplify 45:60 = ?
- Level 9 - Trigonometric values (special angles)
  Focus: sin, cos, tan for standard angles.
  Generator notes: restrict to results 0, +/-1/2, +/-sqrt(3)/2, +/-1.
  Sample prompts: sin 30 deg = ?, tan 45 deg = ?
- Level 10 - Mixed algebra/trig challenge
  Focus: combine quadratic roots and trig recall.
  Generator notes: ensure single numeric.
  Sample prompts: sqrt(81) + sin 30 deg = ?, If x^2 = 25 and x > 0, compute x + cos 60 deg = ?
Progression logic: Levels 1-3 refresh algebraic patterns; Levels 4-7 tackle solving and rational evaluation; Levels 8-10 add applied arithmetic and trigonometry.

## Upper Secondary Year 1 (Age 15-16)
Overview: Strengthen linear algebra, function evaluation, and coordinate geometry fundamentals.
- Level 1 - Linear expression simplification
  Focus: evaluate expression after substitution.
  Generator notes: supply integer value for variable.
  Sample prompts: For x=4: 3(x + 2) = ?, For a=5: 5a - 3a + 4 = ?
- Level 2 - Two-step linear equations
  Focus: solve for x (integer or simple fraction).
  Generator notes: coefficients up to +/-12.
  Sample prompts: 2x - 5 = 9, x = ?, (3/4)x + 2 = 5, x = ?
- Level 3 - Linear systems (return requested variable)
  Focus: elimination/substitution.
  Generator notes: specify variable in prompt.
  Sample prompts: {2x + y = 11, x - y = 1} -> x = ?, {x + 2y = 7, x - y = 1} -> y = ?
- Level 4 - Evaluate linear functions
  Focus: compute f(x) = ax + b for given x.
  Generator notes: include negative x.
  Sample prompts: f(x)=3x-4, f(5)=?, g(x)=-2x+7, g(-3)=?
- Level 5 - Slope calculations
  Focus: slope from two points or equation.
  Generator notes: ensure integer outcome.
  Sample prompts: Points (1,3) & (4,9) -> slope?, For y=2x-5 -> slope?
- Level 6 - Linear inequalities
  Focus: solve and state boundary value.
  Generator notes: ensure simple solution set like `x > 3`.
  Sample prompts: 3x - 4 > 5 => smallest integer > solution?, -2x + 6 <= 0 => x >= ?
- Level 7 - Polynomial evaluation
  Focus: substitute into quadratics/cubics.
  Generator notes: coefficients <=5.
  Sample prompts: For x=-1: x^2 + 3x + 2 = ?, For x=2: (x - 1)(x + 3) = ?
- Level 8 - Quadratic roots via factor form
  Focus: evaluate numeric roots from factored expression.
  Generator notes: Provide factored form, ask for sum/product numeric.
  Sample prompts: Roots of (x - 2)(x + 5) = 0 -> larger root?, Product of roots of (x - 3)(x - 4) = ?
- Level 9 - Distance formula
  Focus: compute distance between points.
  Generator notes: use Pythagorean-friendly coordinates.
  Sample prompts: Dist((0,0),(6,8)) = ?, Dist((2,3),(5,7)) = ?
- Level 10 - Linear modeling challenge
  Focus: evaluate linear pattern after interpretation.
  Generator notes: convert simple word scenario to arithmetic.
  Sample prompts: Start 50, add 7 each level -> value at level 5?, Passing through (2,5) slope 3 => output at x=4?
Progression logic: Levels 1-4 revisit algebra basics; Levels 5-8 widen to slopes/polynomials; Levels 9-10 tie in coordinate geometry and modeling.

## Upper Secondary Year 2 (Age 16-17)
Overview: Expand into quadratics, sequences, exponentials, logarithms, and trigonometry.
- Level 1 - Quadratic recap
  Focus: solve factorable quadratics (selected root).
  Generator notes: specify positive/larger root.
  Sample prompts: Positive root of x^2 - 9 = 0 = ?, Larger root of x^2 - x - 12 = 0 = ?
- Level 2 - Quadratic formula drills
  Focus: apply formula with perfect-square discriminants.
  Generator notes: solutions rational.
  Sample prompts: x^2 - 4x - 21 = 0 -> x = ?, 2x^2 - 3x - 5 = 0 -> x = ?
- Level 3 - Sequences (arithmetic/geometric)
  Focus: compute next term or nth term.
  Generator notes: keep results integer.
  Sample prompts: Next term 5,8,11,? = ?, 7th term (a1=2,d=3) = ?
- Level 4 - Exponentials
  Focus: evaluate `a^n` and combined powers.
  Generator notes: bases 2,3,5; exponents <=6.
  Sample prompts: 3^4 = ?, 5^3 * 5^2 = ?
- Level 5 - Logarithms
  Focus: evaluate logs with friendly arguments.
  Generator notes: base 2,3,10.
  Sample prompts: log2 32 = ?, log10 1000 = ?
- Level 6 - Trig value recall
  Focus: sin/cos/tan for standard angles (degrees & radians).
  Generator notes: map pi/6, pi/4, pi/3 to degree equivalents.
  Sample prompts: cos 60 deg = ?, sin (pi/6) = ?
- Level 7 - Basic trig equations
  Focus: find smallest positive solution for special-angle values.
  Generator notes: limit to 0 deg-360 deg.
  Sample prompts: sin x = 0.5 => smallest x = ?, cos x = 0 => smallest positive x = ?
- Level 8 - Composite function evaluation
  Focus: g(f(x)) and f(g(x)) numeric.
  Generator notes: use linear/quadratic pairs.
  Sample prompts: f(x)=2x+1, g(x)=x^2 -> g(f(3))=?, f(x)=x^2-1, g(x)=x-4 -> f(g(5))=?
- Level 9 - Radical arithmetic
  Focus: multiply/divide radicals yielding rational or simplified radical results represented numerically (use perfect squares).
  Generator notes: pick pairs where product is integer.
  Sample prompts: sqrt(2) * sqrt(8) = ?, sqrt(12) / sqrt(3) = ?
- Level 10 - Probability basics
  Focus: compute combinations/permutations or simple probability.
  Generator notes: small n <=10; results integer or simple fraction.
  Sample prompts: C(5,2) = ?, Chance of rolling a 6 on a die = ?
Progression logic: Levels 1-3 reinforce quadratic/sequence fluency; Levels 4-9 broaden to exponential/log/trig/radical skills; Level 10 adds introductory probability.

## Upper Secondary Year 3 (Age 17-18)
Overview: Introduce calculus concepts, matrix/vector basics, and strengthen advanced algebra.
- Level 1 - Exponent/log combo review
  Focus: evaluate mixed expressions.
  Generator notes: ensure results integer or simple decimal.
  Sample prompts: 2^3 * 5^2 = ?, log10 100 + log10 1000 = ?
- Level 2 - Remainder & factors
  Focus: compute remainder when dividing polynomials by linear factors (numeric via substitution).
  Generator notes: use Remainder Theorem.
  Sample prompts: Remainder of x^3 - 2x + 1 at x=2 = ?, Remainder of x^2 + 5x + 6 at x=-3 = ?
- Level 3 - Derivative at a point
  Focus: use power rule then evaluate.
  Generator notes: polynomials degree <=3.
  Sample prompts: d/dx(x^3) at x=2 = ?, d/dx(5x^2 - 3x) at x=1 = ?
- Level 4 - Tangent slope interpretation
  Focus: translate word prompt to derivative evaluation.
  Generator notes: provide function and x-value.
  Sample prompts: Slope of y = x^2 at x=3 = ?, Instant rate of y=2x^3 at x=1 = ?
- Level 5 - Antiderivative check
  Focus: find definite integrals of simple polynomials.
  Generator notes: bounds yielding integers.
  Sample prompts: Integral0^1 (3x^2) dx = ?, Integral0^2 (2x) dx = ?
- Level 6 - Definite integral with substitution-lite
  Focus: simple linear inner function requiring factor adjustment.
  Generator notes: ensure integer result.
  Sample prompts: Integral0^1 4x dx = ?, Integral0^1 6x^2 dx = ?
- Level 7 - Limits of rational functions
  Focus: evaluate limit as x->a for factorable expressions.
  Generator notes: use cancellation to avoid 0/0.
  Sample prompts: lim_{x->2} (x^2 - 4)/(x - 2) = ?, lim_{x->1} (x^3 - 1)/(x - 1) = ?
- Level 8 - 2*2 determinants
  Focus: compute determinant quickly.
  Generator notes: integers within +/-9.
  Sample prompts: |1 2; 3 4| = ?, |2 -1; 5 0| = ?
- Level 9 - Vectors (dot product)
  Focus: compute dot product of 2D/3D integer vectors.
  Generator notes: components <=10.
  Sample prompts: (2,3) dot (4,5) = ?, (1, -2, 3) dot (0, 5, -1) = ?
- Level 10 - Mixed advanced drill
  Focus: combine calculus, algebra, and vectors.
  Generator notes: design two-step numeric outputs.
  Sample prompts: (d/dx x^2 at x=4) + sqrt(49) = ?, Determinant |1 1; 1 2| + Integral0^1 x dx = ?
Progression logic: Levels 1-4 cement algebra/calculus basics; Levels 5-7 practise integration and limits; Levels 8-10 bring in linear algebra and mixed challenges.

## Upper Secondary Year 4 (Age 18-19)
Overview: Prepare for graduation exams with calculus consolidation, advanced trig, series, and probability/statistics.
- Level 1 - Mixed review warm-up
  Focus: ensure retention from Year 3.
  Generator notes: combine derivative/integral basics with exponent.
  Sample prompts: d/dx(x^3) at x=2 + 5 = ?, sqrt(144) + log10 100 = ?
- Level 2 - Trig identities numeric
  Focus: evaluate using sin^2theta + cos^2theta = 1 etc.
  Generator notes: use standard angles.
  Sample prompts: If sin 30 deg = 0.5, compute cos^230 deg + sin^230 deg = ?, tan 45 deg * cos 45 deg = ?
- Level 3 - Exponential/log equations
  Focus: solve for x in simple forms yielding numeric.
  Generator notes: restrict to integer solutions.
  Sample prompts: 2^x = 32, x = ?, log3(x) = 2, x = ?
- Level 4 - Derivative-based optimization snippet
  Focus: compute critical point candidate numerically.
  Generator notes: simple quadratic derivative.
  Sample prompts: For y = -2x^2 + 8x, vertex x-coordinate = ?, Max value of y = -x^2 + 9 from derivative? (hint: vertex y-value) = ?
- Level 5 - Series sums
  Focus: evaluate arithmetic/geometric series sums.
  Generator notes: small n for mental sums.
  Sample prompts: Sum of first 10 natural numbers = ?, Sum of geometric series 1 + 2 + 4 + 8 = ?
- Level 6 - Probability combinations
  Focus: compute binomial probabilities or counts.
  Generator notes: keep fractions simple.
  Sample prompts: Ways to choose 3 of 6 = ?, Probability of drawing red (3/5) then blue (2/4) = ?
- Level 7 - Complex numbers (modulus/real components)
  Focus: compute numeric magnitude or real/imag parts.
  Generator notes: keep to simple integer components.
  Sample prompts: |3 + 4i| = ?, Real part of (2 + 5i) + (3 - 2i) = ?
- Level 8 - Matrix inverse elements (2*2)
  Focus: compute determinant and inverse entry (numeric).
  Generator notes: use matrices with determinant !=0; ask for specific entry.
  Sample prompts: For |1 2; 3 4|, determinant = ?, Inverse a11 entry (rounded to 2 decimals) = ?
- Level 9 - Limits & continuity
  Focus: evaluate simple limits producing numeric constants.
  Generator notes: include e-based limits with agreed rounding.
  Sample prompts: lim_{n->infinity} (1 + 1/n)^n ~ ?, lim_{x->0} sin x / x = ?
- Level 10 - Capstone mixed challenge
  Focus: chain calculus, trig, probability in one question.
  Generator notes: ensure manageable computation.
  Sample prompts: (d/dx x^3 at x=3) + sin 90 deg = ?, [C(5,2)] + sqrt(cos^2 0 deg) = ?
Progression logic: Levels 1-3 revisit key algebra/trig; Levels 4-7 incorporate calculus, series, complex numbers; Levels 8-10 finalize exam-ready mixed practice.

---

Usage notes: Each grade's first two or three levels intentionally compress lower-grade fundamentals (per requirement that older students still prove basic skills) before introducing grade-level and stretch content. When implementing, map these level definitions to generator configs in `questions.js`, ensuring output formats stay numeric and time-to-answer remains under ~3 seconds.
