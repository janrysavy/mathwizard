/**
 * MATH WIZARD - Educational Math Game
 *
 * Key Features:
 * - 8 progressive stages with different math problem types
 * - Stage 1: Addition 0-10
 * - Stage 2: Subtraction 0-10
 * - Stage 3: Addition 0-20
 * - Stage 4: Subtraction without crossing tens (e.g., 15-4 not 11-2)
 * - Stage 5: Addition 0-10 with unknown (? + 4 = 9)
 * - Stage 6: Subtraction 0-10 with unknown (? - 2 = 8)
 * - Stage 7: Addition of 3 numbers 0-10
 * - Stage 8+: Addition of 3 numbers 0-20
 *
 * Important Rules:
 * - No operand repeats in the next 3 problems
 * - Wrong answer: spell misses, monster speeds up by 0.5
 * - Speed resets to 1.0 with each new monster/boss
 * - Score is added AFTER explosion completes
 * - Red aura around monsters (hidden during inflation)
 */

// Game state
const game = {
    score: 0,
    correct: 0,
    currentQuestion: null,
    currentMonster: null,
    monsterX: 800,
    monsterSpeed: 1,
    isGameOver: false,
    startTime: 0,
    spellEffect: null,
    wizardAnimFrame: 0,
    monsterAnimFrame: 0,
    explosion: null,
    particles: [],
    monsterScale: 1,
    shockwaves: [],
    screenShake: 0,
    recentProblems: [], // Track last 3 problems to avoid repeats
    recentOperands: [], // Track last 3 operands (num1 and num2)
    pendingScore: 0, // Score to add after explosion
    parallax: {
        mountains: 0,
        trees: 0,
        bushes: 0
    },
    celestialProgress: 0,
    isDay: true,
    bats: [],
    stage: 1,
    questionsInStage: 0,
    isBossFight: false,
    bossHealth: 5,
    bossAnimFrame: 0,
    bossX: 400,
    bossHitFlash: 0,
    bossDeathAnim: null,
    screenFlash: 0,
    waveDistortion: [],
    stageAnnouncement: null,
    witchDeathAnim: null,
    shootingStars: [],
    seagulls: []
};

// Initialize stars
const stars = [];
for(let i = 0; i < 50; i++) {
    stars.push({
        x: Math.random() * 800,
        y: Math.random() * 200,
        size: 1 + Math.random() * 2,
        twinkleSpeed: 0.02 + Math.random() * 0.03,
        brightness: Math.random()
    });
}

// Initialize bats
function initBats() {
    game.bats = [];
    for(let i = 0; i < 5; i++) {
        game.bats.push({
            x: Math.random() * 800,
            y: 50 + Math.random() * 150,
            speed: 0.5 + Math.random() * 1,
            wingPhase: Math.random() * Math.PI * 2,
            amplitude: 10 + Math.random() * 20
        });
    }
}

// Initialize seagulls
function initSeagulls() {
    game.seagulls = [];
    for(let i = 0; i < 4; i++) {
        game.seagulls.push({
            x: Math.random() * 800,
            y: 30 + Math.random() * 120,
            speed: 0.3 + Math.random() * 0.8,
            wingPhase: Math.random() * Math.PI * 2,
            amplitude: 5 + Math.random() * 15
        });
    }
}

// Create squeak sound effect using Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSqueak() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Monster definitions (pixel art data)
const monsters = [
    { name: 'Slime', color: '#00ff00', eyes: '#000' },
    { name: 'Ghost', color: '#ffffff', eyes: '#0000ff' },
    { name: 'Demon', color: '#ff0000', eyes: '#ffff00' },
    { name: 'Bat', color: '#8b4513', eyes: '#ff0000' },
    { name: 'Spider', color: '#4b0082', eyes: '#00ff00' },
    { name: 'Zombie', color: '#90ee90', eyes: '#ff0000' },
    { name: 'Skeleton', color: '#f0f0f0', eyes: '#000' },
    { name: 'Goblin', color: '#228b22', eyes: '#ff0000' },
    { name: 'Orc', color: '#556b2f', eyes: '#ffff00' },
    { name: 'Dragon', color: '#8b0000', eyes: '#ffa500' }
];

// Boss definitions
const bosses = [
    { name: 'Ancient Tree', type: 'tree' },
    { name: 'Stone Golem', type: 'golem' },
    { name: 'Fire Elemental', type: 'fire' },
    { name: 'Ice Giant', type: 'ice' },
    { name: 'Shadow Demon', type: 'shadow' },
    { name: 'Crystal Serpent', type: 'serpent' },
    { name: 'Thunder Bird', type: 'bird' },
    { name: 'Lava Beast', type: 'lava' },
    { name: 'Necromancer', type: 'necro' },
    { name: 'Dark Dragon', type: 'darkdragon' }
];

// Stage names
const stageNames = [
    'Enchanted Forest',
    'Stone Mountains',
    'Volcanic Crater',
    'Frozen Wastes',
    'Shadow Realm',
    'Crystal Caverns',
    'Storm Peaks',
    'Molten Core',
    'Death\'s Domain',
    'Dragon\'s Lair'
];

// Draw pixel art witch on broomstick
function drawWizard() {
    const x = 50;
    const y = 80;
    const bounce = Math.sin(Date.now() / 300) * 3;
    const windWave = Math.sin(Date.now() / 200);

    // Death animation handling
    let scale = 1;
    if(game.witchDeathAnim) {
        const elapsed = Date.now() - game.witchDeathAnim.startTime;

        if(game.witchDeathAnim.phase === 'inflate') {
            const inflateProgress = Math.min(elapsed / 800, 1);
            scale = 1 + inflateProgress * 1.5;
        } else {
            // After explosion - hide witch completely
            return;
        }
    }

    ctx.save();
    ctx.translate(x + 25, y + 25);
    ctx.scale(scale, scale);
    ctx.translate(-25, -25);

    // Broomstick
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x + 5, y + 35 + bounce, 45, 4);

    // Broomstick bristles
    ctx.fillStyle = '#d2691e';
    for(let i = 0; i < 8; i++) {
        const bristleFlow = Math.sin(Date.now() / 150 + i * 0.3) * 2;
        ctx.fillRect(x - 5 + i * 2 + bristleFlow, y + 39 + bounce, 2, 6);
        ctx.fillRect(x - 3 + i * 2 + bristleFlow, y + 43 + bounce, 2, 4);
    }

    // Dress (flowing)
    ctx.fillStyle = '#8b008b';
    const dressFlow1 = Math.sin(Date.now() / 180) * 3;
    const dressFlow2 = Math.sin(Date.now() / 200 + 0.5) * 4;

    ctx.fillRect(x + 20, y + 10 + bounce, 18, 25);
    ctx.fillRect(x + 18 + dressFlow1, y + 30 + bounce, 8, 10);
    ctx.fillRect(x + 28 + dressFlow2, y + 30 + bounce, 8, 10);
    ctx.fillRect(x + 16 + dressFlow1, y + 38 + bounce, 6, 6);
    ctx.fillRect(x + 32 + dressFlow2, y + 38 + bounce, 6, 6);

    // Body
    ctx.fillStyle = '#ffd8b1';
    ctx.fillRect(x + 24, y + 8 + bounce, 10, 12);

    // Arms
    ctx.fillStyle = '#ffd8b1';
    ctx.fillRect(x + 20, y + 10 + bounce, 4, 10);
    ctx.fillRect(x + 34, y + 10 + bounce, 4, 10);

    // Hands on broomstick
    ctx.fillRect(x + 16, y + 20 + bounce, 4, 4);
    ctx.fillRect(x + 38, y + 20 + bounce, 4, 4);

    // Head
    ctx.fillStyle = '#ffd8b1';
    ctx.fillRect(x + 22, y - 8 + bounce, 14, 16);

    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 25, y - 2 + bounce, 2, 2);
    ctx.fillRect(x + 31, y - 2 + bounce, 2, 2);

    // Mouth
    ctx.fillRect(x + 27, y + 3 + bounce, 4, 1);

    // Witch hat
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 20, y - 12 + bounce, 18, 5);
    ctx.fillRect(x + 24, y - 28 + bounce, 10, 16);

    // Hat buckle
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x + 22, y - 10 + bounce, 14, 2);

    // Hair flowing in wind (long flowing strands)
    ctx.fillStyle = '#8b4513';
    const hairFlow1 = Math.sin(Date.now() / 150) * 5;
    const hairFlow2 = Math.sin(Date.now() / 180 + 0.3) * 6;
    const hairFlow3 = Math.sin(Date.now() / 160 + 0.7) * 4;

    // Left side hair
    ctx.fillRect(x + 18 + hairFlow1, y - 6 + bounce, 3, 12);
    ctx.fillRect(x + 16 + hairFlow2, y - 4 + bounce, 3, 16);
    ctx.fillRect(x + 14 + hairFlow3, y - 2 + bounce, 3, 14);

    // Right side hair
    ctx.fillRect(x + 37 + hairFlow1, y - 6 + bounce, 3, 12);
    ctx.fillRect(x + 39 + hairFlow2, y - 4 + bounce, 3, 16);
    ctx.fillRect(x + 41 + hairFlow3, y - 2 + bounce, 3, 14);

    // Cape flowing behind
    ctx.fillStyle = '#4b0082';
    const capeFlow1 = Math.sin(Date.now() / 170) * 4;
    const capeFlow2 = Math.sin(Date.now() / 190 + 0.5) * 5;
    ctx.fillRect(x + 10 + capeFlow1, y + 8 + bounce, 6, 18);
    ctx.fillRect(x + 8 + capeFlow2, y + 12 + bounce, 5, 16);

    // Magic sparkle
    if (game.spellEffect) {
        ctx.fillStyle = game.spellEffect.color;
        ctx.globalAlpha = game.spellEffect.alpha;
        ctx.fillRect(x + 50, y + bounce, 8, 8);
        ctx.fillRect(x + 52, y - 4 + bounce, 4, 4);
        ctx.fillRect(x + 52, y + 4 + bounce, 4, 4);
        ctx.globalAlpha = 1;
    }

    ctx.restore();
}

// Draw pixel art monster with animation
function drawMonster(monster, x, y, scale = 1) {
    game.monsterAnimFrame += 0.1;
    const frame = Math.floor(game.monsterAnimFrame) % 3;
    const bounce = Math.sin(Date.now() / 200) * 2;

    ctx.save();
    ctx.translate(x + 40, y + 40);
    ctx.scale(scale, scale);
    ctx.translate(-40, -40);

    switch(monster.name) {
        case 'Slime':
            // Body - jiggly slime animation
            ctx.fillStyle = monster.color;
            const slimeWidth = [50, 52, 48][frame];
            const slimeHeight = [35, 33, 37][frame];
            ctx.fillRect(15, 45 - slimeHeight, slimeWidth, slimeHeight);
            ctx.fillRect(10, 50 - slimeHeight + 10, 60, slimeHeight - 10);

            // Shine effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(25, 20, 8, 8);
            ctx.fillRect(30, 15, 5, 5);

            // Eyes
            ctx.fillStyle = monster.eyes;
            const eyeY = [25, 26, 24][frame];
            ctx.fillRect(25, eyeY, 6, 6);
            ctx.fillRect(45, eyeY, 6, 6);

            // Mouth
            ctx.fillRect(32, 35, 12, 3);
            break;

        case 'Ghost':
            // Body - floating animation
            const ghostY = bounce / scale;
            ctx.fillStyle = monster.color;
            ctx.fillRect(10, 5 + ghostY, 60, 45);
            ctx.fillRect(5, 15 + ghostY, 70, 35);

            // Wavy bottom
            const ghostTails = [
                [10, 45, 12, 12],
                [28, 45, 12, 12],
                [46, 45, 12, 12],
                [64, 45, 12, 12]
            ];
            const waveOffset = [0, -2, 0][frame];
            ghostTails.forEach(([tx, ty, tw, th]) => {
                ctx.fillRect(tx, ty + ghostY + waveOffset, tw, th);
            });

            // Eyes
            ctx.fillStyle = monster.eyes;
            const ghostEyeSize = [8, 10, 8][frame];
            ctx.fillRect(20, 20 + ghostY, ghostEyeSize, ghostEyeSize);
            ctx.fillRect(50, 20 + ghostY, ghostEyeSize, ghostEyeSize);

            // Mouth - spooky
            ctx.fillStyle = '#000';
            ctx.fillRect(35, 35 + ghostY, 3, 8);
            break;

        case 'Demon':
            // Head
            ctx.fillStyle = monster.color;
            ctx.fillRect(15, 15, 50, 40);

            // Horns - animated
            const hornOffset = [0, -2, 0][frame];
            ctx.fillRect(10, 10 + hornOffset, 8, 12);
            ctx.fillRect(62, 10 + hornOffset, 8, 12);
            ctx.fillRect(8, 8 + hornOffset, 6, 8);
            ctx.fillRect(66, 8 + hornOffset, 6, 8);

            // Body
            ctx.fillRect(20, 50, 40, 30);

            // Arms
            const armSwing = [0, 3, 0][frame];
            ctx.fillRect(10, 55 + armSwing, 15, 20);
            ctx.fillRect(55, 55 - armSwing, 15, 20);

            // Claws
            ctx.fillStyle = '#000';
            ctx.fillRect(10, 73 + armSwing, 4, 6);
            ctx.fillRect(18, 73 + armSwing, 4, 6);
            ctx.fillRect(58, 73 - armSwing, 4, 6);
            ctx.fillRect(66, 73 - armSwing, 4, 6);

            // Eyes - glowing
            ctx.fillStyle = monster.eyes;
            ctx.fillRect(25, 25, 8, 8);
            ctx.fillRect(47, 25, 8, 8);

            // Fangs
            ctx.fillStyle = '#fff';
            ctx.fillRect(28, 38, 4, 8);
            ctx.fillRect(48, 38, 4, 8);
            break;

        case 'Bat':
            // Body
            ctx.fillStyle = monster.color;
            ctx.fillRect(30, 25, 20, 18);

            // Head
            ctx.fillRect(25, 18, 30, 15);

            // Ears
            ctx.fillRect(22, 12, 6, 8);
            ctx.fillRect(52, 12, 6, 8);
            ctx.fillRect(20, 10, 4, 6);
            ctx.fillRect(56, 10, 4, 6);

            // Wings - flapping animation
            const wingSpread = [
                { left: 15, right: 15, up: 5 },
                { left: 20, right: 20, up: 0 },
                { left: 15, right: 15, up: 5 }
            ][frame];

            // Left wing
            ctx.fillRect(10, 25 + wingSpread.up, wingSpread.left, 25);
            ctx.fillRect(5, 30 + wingSpread.up, wingSpread.left - 5, 20);

            // Right wing
            ctx.fillRect(50, 25 + wingSpread.up, wingSpread.right, 25);
            ctx.fillRect(60, 30 + wingSpread.up, wingSpread.right - 5, 20);

            // Eyes
            ctx.fillStyle = monster.eyes;
            ctx.fillRect(30, 22, 5, 5);
            ctx.fillRect(45, 22, 5, 5);

            // Fangs
            ctx.fillStyle = '#fff';
            ctx.fillRect(35, 30, 3, 5);
            ctx.fillRect(42, 30, 3, 5);
            break;

        case 'Spider':
            // Body
            ctx.fillStyle = monster.color;
            ctx.fillRect(25, 25, 30, 30);

            // Head
            ctx.fillRect(20, 20, 20, 18);

            // Abdomen
            ctx.fillRect(28, 50, 24, 20);

            // Legs - walking animation
            const legPositions = [
                [0, -2, 0, 2, 0, -2, 0, 2],
                [2, 0, -2, 0, 2, 0, -2, 0],
                [0, 2, 0, -2, 0, 2, 0, -2]
            ][frame];

            // Left legs
            for(let i = 0; i < 4; i++) {
                const legY = 28 + i * 8 + legPositions[i];
                ctx.fillRect(5, legY, 20, 4);
                ctx.fillRect(0, legY + 4, 10, 4);
            }

            // Right legs
            for(let i = 0; i < 4; i++) {
                const legY = 28 + i * 8 + legPositions[i + 4];
                ctx.fillRect(55, legY, 20, 4);
                ctx.fillRect(70, legY + 4, 10, 4);
            }

            // Eyes - multiple spider eyes
            ctx.fillStyle = monster.eyes;
            ctx.fillRect(23, 23, 4, 4);
            ctx.fillRect(30, 23, 4, 4);
            ctx.fillRect(26, 28, 3, 3);
            ctx.fillRect(33, 28, 3, 3);
            break;

        case 'Zombie':
            // Body
            ctx.fillStyle = monster.color;
            ctx.fillRect(25, 40, 30, 40);

            // Head - tilted
            const headTilt = [0, 2, 0][frame];
            ctx.fillRect(22 + headTilt, 10, 36, 35);

            // Arms - reaching
            const armReach = [0, 3, 6][frame];
            ctx.fillRect(15, 45, 12, 25 + armReach);
            ctx.fillRect(53, 45, 12, 25 + armReach);

            // Hands
            ctx.fillRect(12, 68 + armReach, 15, 10);
            ctx.fillRect(53, 68 + armReach, 15, 10);

            // Torn clothes
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(28, 50, 24, 15);
            ctx.fillRect(30, 66, 20, 8);

            // Eyes - dead
            ctx.fillStyle = monster.eyes;
            ctx.fillRect(30 + headTilt, 20, 6, 6);
            ctx.fillRect(44 + headTilt, 20, 6, 6);

            // Mouth - gaping
            ctx.fillStyle = '#000';
            ctx.fillRect(35 + headTilt, 32, 12, 8);
            break;

        case 'Skeleton':
            // Skull
            ctx.fillStyle = monster.color;
            ctx.fillRect(20, 10, 40, 35);

            // Jaw - chattering
            const jawOpen = [0, 3, 0][frame];
            ctx.fillRect(25, 45 + jawOpen, 30, 10);

            // Body - ribcage
            ctx.fillRect(25, 50, 30, 30);

            // Ribs
            ctx.fillStyle = '#d0d0d0';
            for(let i = 0; i < 4; i++) {
                ctx.fillRect(28, 55 + i * 6, 24, 3);
            }

            // Arms - waving
            const armWave = [0, -4, 0][frame];
            ctx.fillStyle = monster.color;
            ctx.fillRect(12, 55 + armWave, 15, 25);
            ctx.fillRect(53, 55 - armWave, 15, 25);

            // Hands
            ctx.fillRect(10, 78 + armWave, 12, 8);
            ctx.fillRect(58, 78 - armWave, 12, 8);

            // Eye sockets
            ctx.fillStyle = monster.eyes;
            ctx.fillRect(28, 20, 8, 10);
            ctx.fillRect(44, 20, 8, 10);

            // Nose hole
            ctx.fillRect(36, 32, 8, 6);
            break;

        case 'Goblin':
            // Body
            ctx.fillStyle = monster.color;
            ctx.fillRect(25, 35, 30, 35);

            // Head - big
            ctx.fillRect(20, 10, 40, 30);

            // Ears - large goblin ears
            const earFlap = [0, -2, 0][frame];
            ctx.fillRect(10, 15 + earFlap, 12, 18);
            ctx.fillRect(58, 15 + earFlap, 12, 18);

            // Arms
            const goblinArm = [0, 2, 0][frame];
            ctx.fillRect(15, 40, 12, 25);
            ctx.fillRect(53, 40, 12, 25);

            // Legs - crouching
            ctx.fillRect(27, 65, 10, 15);
            ctx.fillRect(43, 65, 10, 15);

            // Weapon - club
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(10, 42 + goblinArm, 8, 20);
            ctx.fillRect(8, 40 + goblinArm, 12, 8);

            // Eyes - beady
            ctx.fillStyle = monster.eyes;
            ctx.fillRect(28, 20, 7, 7);
            ctx.fillRect(45, 20, 7, 7);

            // Teeth
            ctx.fillStyle = '#fff';
            ctx.fillRect(32, 32, 4, 6);
            ctx.fillRect(38, 32, 4, 6);
            ctx.fillRect(44, 32, 4, 6);
            break;

        case 'Orc':
            // Body - muscular
            ctx.fillStyle = monster.color;
            ctx.fillRect(20, 40, 40, 40);

            // Head
            ctx.fillRect(22, 10, 36, 35);

            // Tusks
            ctx.fillStyle = '#fff';
            const tuskSize = [8, 10, 8][frame];
            ctx.fillRect(25, 35, 6, tuskSize);
            ctx.fillRect(49, 35, 6, tuskSize);

            // Arms - flexing
            const muscleSize = [12, 15, 12][frame];
            ctx.fillStyle = monster.color;
            ctx.fillRect(10, 45, muscleSize, 30);
            ctx.fillRect(60, 45, muscleSize, 30);

            // Fists
            ctx.fillRect(8, 72, 14, 12);
            ctx.fillRect(58, 72, 14, 12);

            // Shoulder pads
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(12, 42, 16, 8);
            ctx.fillRect(52, 42, 16, 8);

            // Eyes - angry
            ctx.fillStyle = monster.eyes;
            ctx.fillRect(28, 18, 8, 8);
            ctx.fillRect(44, 18, 8, 8);

            // Brow - furrowed
            ctx.fillStyle = '#000';
            ctx.fillRect(26, 16, 12, 3);
            ctx.fillRect(42, 16, 12, 3);
            break;

        case 'Dragon':
            // Body
            ctx.fillStyle = monster.color;
            ctx.fillRect(25, 30, 40, 30);

            // Head
            ctx.fillRect(15, 20, 30, 25);

            // Snout
            ctx.fillRect(5, 25, 15, 15);

            // Horns
            ctx.fillRect(18, 10, 8, 12);
            ctx.fillRect(34, 10, 8, 12);
            ctx.fillRect(16, 6, 6, 8);
            ctx.fillRect(38, 6, 6, 8);

            // Wings - flapping
            const dragonWing = [
                { size: 20, angle: 0 },
                { size: 25, angle: -5 },
                { size: 20, angle: 0 }
            ][frame];

            // Left wing
            ctx.fillRect(15, 25 + dragonWing.angle, dragonWing.size, 30);
            ctx.fillRect(10, 30 + dragonWing.angle, dragonWing.size - 5, 25);

            // Right wing
            ctx.fillRect(50, 25 + dragonWing.angle, dragonWing.size, 30);
            ctx.fillRect(55, 30 + dragonWing.angle, dragonWing.size - 5, 25);

            // Tail
            ctx.fillRect(60, 40, 15, 10);
            ctx.fillRect(70, 38, 8, 14);

            // Spikes on back
            ctx.fillStyle = '#ff4500';
            for(let i = 0; i < 4; i++) {
                ctx.fillRect(28 + i * 8, 28, 5, 8);
            }

            // Eyes - fierce
            ctx.fillStyle = monster.eyes;
            ctx.fillRect(20, 28, 7, 7);
            ctx.fillRect(33, 28, 7, 7);

            // Nostrils
            ctx.fillStyle = '#000';
            ctx.fillRect(8, 30, 4, 4);
            ctx.fillRect(8, 36, 4, 4);

            // Fire breath - occasional
            if(frame === 1) {
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(0, 28, 8, 8);
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(-5, 30, 8, 4);
            }
            break;
    }

    ctx.restore();
}

// Draw boss
function drawBoss(boss, x, y, scale = 1) {
    game.bossAnimFrame += 0.05;

    // Death animation handling
    if(game.bossDeathAnim) {
        const elapsed = Date.now() - game.bossDeathAnim.startTime;

        if(game.bossDeathAnim.phase === 'blink') {
            // Rapid blinking
            const blinkSpeed = 50;
            ctx.globalAlpha = Math.abs(Math.sin(elapsed / blinkSpeed)) * 0.8 + 0.2;
        } else if(game.bossDeathAnim.phase === 'inflate') {
            // Inflate boss
            const inflateProgress = Math.min((elapsed - 500) / 700, 1);
            scale = 1 + inflateProgress * 0.8;

            // Add red glow during inflation
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 30 * inflateProgress;
        } else if(game.bossDeathAnim.phase === 'explode') {
            // Boss is exploding - make it flash white
            ctx.globalAlpha = 0;
        }
    } else if(game.bossHitFlash > 0) {
        // Normal hit flash effect
        game.bossHitFlash -= 0.05;
        ctx.globalAlpha = 0.5 + Math.sin(game.bossHitFlash * 20) * 0.5;
    }

    ctx.save();
    ctx.translate(x + 100, y + 100);
    ctx.scale(scale, scale);
    ctx.translate(-100, -100);

    const sway = Math.sin(game.bossAnimFrame) * 5;
    const breathe = Math.sin(game.bossAnimFrame * 2) * 2;
    const leftBranch = Math.sin(game.bossAnimFrame) * 10;
    const rightBranch = Math.sin(game.bossAnimFrame + Math.PI) * 10;

    switch(boss.type) {
        case 'tree':
            // Trunk
            ctx.fillStyle = '#654321';
            ctx.fillRect(70 + sway * 0.3, 80, 60, 120);

            // Roots
            ctx.fillStyle = '#543210';
            for(let i = 0; i < 5; i++) {
                const rootX = 50 + i * 25;
                const rootSway = Math.sin(game.bossAnimFrame + i) * 3;
                ctx.fillRect(rootX + rootSway, 195, 15, 20);
                ctx.fillRect(rootX + rootSway - 5, 210, 25, 10);
            }

            // Tree crown
            ctx.fillStyle = '#2d5016';
            ctx.fillRect(40, 40 + breathe, 120, 50);
            ctx.fillRect(50, 20 + breathe, 100, 30);
            ctx.fillRect(60, 10 + breathe, 80, 20);

            // Branches (animated)
            ctx.fillStyle = '#654321';

            // Left branches
            ctx.fillRect(30 + leftBranch, 60 + breathe, 40, 10);
            ctx.fillRect(20 + leftBranch * 1.2, 50 + breathe, 30, 8);

            // Right branches
            ctx.fillRect(130 + rightBranch, 60 + breathe, 40, 10);
            ctx.fillRect(150 + rightBranch * 1.2, 50 + breathe, 30, 8);

            // Eyes
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(75, 90, 15, 15);
            ctx.fillRect(110, 90, 15, 15);

            // Pupils
            ctx.fillStyle = '#000';
            ctx.fillRect(80 + Math.sin(game.bossAnimFrame * 3) * 3, 95, 5, 5);
            ctx.fillRect(115 + Math.sin(game.bossAnimFrame * 3) * 3, 95, 5, 5);

            // Mouth (animated)
            ctx.fillStyle = '#000';
            const treeMouthOpen = Math.abs(Math.sin(game.bossAnimFrame * 2)) * 10;
            ctx.fillRect(80, 120, 40, 5);
            ctx.fillRect(85, 125, 30, treeMouthOpen);

            // Leaves detail
            ctx.fillStyle = '#3d6026';
            for(let i = 0; i < 10; i++) {
                const leafX = 50 + i * 10;
                const leafY = 30 + breathe + Math.sin(game.bossAnimFrame + i) * 5;
                ctx.fillRect(leafX, leafY, 8, 8);
            }
            break;

        case 'golem':
            // Stone body
            ctx.fillStyle = '#6b7280';
            ctx.fillRect(60, 80 + breathe, 80, 100);

            // Arms
            ctx.fillRect(30, 90 + breathe + leftBranch, 35, 30);
            ctx.fillRect(135, 90 + breathe + rightBranch, 35, 30);

            // Head
            ctx.fillRect(70, 40 + breathe, 60, 50);

            // Eyes (glowing)
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(80, 55 + breathe, 12, 12);
            ctx.fillRect(108, 55 + breathe, 12, 12);

            // Cracks
            ctx.fillStyle = '#4b5563';
            ctx.fillRect(75, 50 + breathe, 3, 30);
            ctx.fillRect(70, 100, 80, 3);
            ctx.fillRect(90, 120, 3, 40);
            break;

        case 'fire':
        case 'lava':
            // Massive lava beast (stage 2 boss)
            const isLavaBoss = boss.type === 'lava' || game.stage === 2;

            // Core body - molten rock
            ctx.fillStyle = isLavaBoss ? '#2B0000' : '#8b0000';
            ctx.fillRect(40, 60 + breathe, 120, 140);

            // Lava cracks on body (animated glow)
            const crackGlow = Math.sin(game.bossAnimFrame * 4) * 0.5 + 0.5;
            ctx.fillStyle = '#FF4500';
            ctx.globalAlpha = 0.7 + crackGlow * 0.3;

            // Vertical cracks
            ctx.fillRect(60, 70 + breathe, 8, 120);
            ctx.fillRect(90, 80 + breathe, 6, 110);
            ctx.fillRect(120, 75 + breathe, 8, 115);

            // Horizontal cracks
            ctx.fillRect(50, 100 + breathe, 100, 6);
            ctx.fillRect(55, 140 + breathe, 90, 8);

            ctx.globalAlpha = 1;

            // Bright lava core
            ctx.fillStyle = '#FFAA00';
            ctx.fillRect(85, 110 + breathe, 30, 40);
            ctx.fillRect(75, 120 + breathe, 50, 20);

            // Arms - dripping lava
            ctx.fillStyle = isLavaBoss ? '#3B0000' : '#8b0000';
            ctx.fillRect(20, 90 + breathe + leftBranch, 25, 80);
            ctx.fillRect(155, 90 + breathe + rightBranch, 25, 80);

            // Lava drips from arms
            for(let i = 0; i < 3; i++) {
                const dripPhase = (game.bossAnimFrame * 2 + i) % 2;
                if(dripPhase < 1) {
                    const dripY = 170 + breathe + leftBranch + dripPhase * 30;
                    ctx.fillStyle = '#FF6600';
                    ctx.fillRect(28 + i * 8, dripY, 4, 8);
                }
            }

            for(let i = 0; i < 3; i++) {
                const dripPhase = (game.bossAnimFrame * 2 + i + 0.5) % 2;
                if(dripPhase < 1) {
                    const dripY = 170 + breathe + rightBranch + dripPhase * 30;
                    ctx.fillStyle = '#FF6600';
                    ctx.fillRect(163 + i * 8, dripY, 4, 8);
                }
            }

            // Head
            ctx.fillStyle = isLavaBoss ? '#2B0000' : '#8b0000';
            ctx.fillRect(60, 30 + breathe, 80, 40);

            // Horns - magma
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(50, 20 + breathe, 15, 25);
            ctx.fillRect(135, 20 + breathe, 15, 25);
            ctx.fillRect(45, 15 + breathe, 10, 15);
            ctx.fillRect(145, 15 + breathe, 10, 15);

            // Eyes - glowing like lava
            const eyeGlow = Math.sin(game.bossAnimFrame * 5) * 0.3 + 0.7;
            ctx.fillStyle = '#FFFF00';
            ctx.globalAlpha = eyeGlow;
            ctx.fillRect(75, 45 + breathe, 15, 15);
            ctx.fillRect(110, 45 + breathe, 15, 15);

            // Eye pupils
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(80, 50 + breathe, 5, 5);
            ctx.fillRect(115, 50 + breathe, 5, 5);
            ctx.globalAlpha = 1;

            // Mouth - lava glow
            ctx.fillStyle = '#FF6600';
            ctx.globalAlpha = 0.8;
            const mouthOpen = Math.abs(Math.sin(game.bossAnimFrame * 2)) * 15;
            ctx.fillRect(75, 60 + breathe, 50, 8);
            ctx.fillRect(80, 68 + breathe, 40, mouthOpen);
            ctx.globalAlpha = 1;

            // Flame eruptions from body (random bursts)
            for(let i = 0; i < 5; i++) {
                const flamePhase = (game.bossAnimFrame * 3 + i * 0.7) % 1;
                if(flamePhase < 0.6) {
                    const flameX = 50 + i * 25;
                    const flameHeight = (1 - flamePhase / 0.6) * 30;
                    const flameY = 60 + breathe - flameHeight;

                    // Flame
                    ctx.fillStyle = '#FF6600';
                    ctx.globalAlpha = 0.8;
                    ctx.fillRect(flameX, flameY, 12, flameHeight);

                    ctx.fillStyle = '#FFAA00';
                    ctx.fillRect(flameX + 2, flameY + 5, 8, flameHeight - 10);

                    ctx.fillStyle = '#FFFF00';
                    ctx.fillRect(flameX + 4, flameY + 10, 4, Math.max(0, flameHeight - 15));

                    ctx.globalAlpha = 1;
                }
            }

            // Smoke/ash particles rising
            for(let i = 0; i < 8; i++) {
                const smokePhase = (game.bossAnimFrame + i * 0.3) % 2;
                const smokeX = 60 + i * 15 + Math.sin(smokePhase * Math.PI) * 10;
                const smokeY = 60 - smokePhase * 40;
                const smokeAlpha = Math.max(0, 1 - smokePhase / 2);

                ctx.fillStyle = '#4B0000';
                ctx.globalAlpha = smokeAlpha * 0.5;
                ctx.fillRect(smokeX, smokeY, 6, 6);
                ctx.globalAlpha = 1;
            }
            break;

        default:
            // Generic large monster
            ctx.fillStyle = '#8b0000';
            ctx.fillRect(50, 80 + breathe, 100, 120);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(70, 100 + breathe, 15, 15);
            ctx.fillRect(115, 100 + breathe, 15, 15);
    }

    ctx.restore();

    // Health bar
    const healthBarY = y - 30;
    const healthBarWidth = 200;

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(x, healthBarY, healthBarWidth, 20);

    // Health
    const healthPercent = game.bossHealth / 5;
    if(healthPercent > 0.6) {
        ctx.fillStyle = '#00ff00'; // Green
    } else if(healthPercent > 0.3) {
        ctx.fillStyle = '#ffff00'; // Yellow
    } else {
        ctx.fillStyle = '#ff0000'; // Red
    }
    ctx.fillRect(x, healthBarY, (healthBarWidth * game.bossHealth) / 5, 20);

    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, healthBarY, healthBarWidth, 20);

    // Hearts
    for(let i = 0; i < 5; i++) {
        const heartX = x + 10 + i * 36;
        const heartY = healthBarY + 10;

        if(i < game.bossHealth) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(heartX - 5, heartY - 3, 4, 4);
            ctx.fillRect(heartX + 1, heartY - 3, 4, 4);
            ctx.fillRect(heartX - 6, heartY + 1, 12, 6);
        }
    }

    // Boss name
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(boss.name, x + healthBarWidth / 2, healthBarY - 10);

    ctx.globalAlpha = 1;
}

// Create explosion particles
function createExplosion(x, y, color) {
    playSqueak();

    // Screen shake
    game.screenShake = 15;

    // Create shockwave
    game.shockwaves.push({
        x: x + 30,
        y: y + 30,
        radius: 0,
        maxRadius: 200,
        life: 1
    });

    // More particles for bigger explosion
    for(let i = 0; i < 50; i++) {
        const angle = (Math.PI * 2 * i) / 50 + Math.random() * 0.2;
        const speed = 3 + Math.random() * 6;
        game.particles.push({
            x: x + 30,
            y: y + 30,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - Math.random() * 3,
            size: 5 + Math.random() * 10,
            color: color,
            life: 1,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.4
        });
    }

    // Add some sparks
    for(let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 8;
        game.particles.push({
            x: x + 30,
            y: y + 30,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - Math.random() * 4,
            size: 2 + Math.random() * 4,
            color: ['#ffff00', '#ffa500', '#ff0000', '#ffffff'][Math.floor(Math.random() * 4)],
            life: 1,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.6
        });
    }
}

// Update and draw particles
function updateParticles() {
    for(let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.life -= 0.015;
        p.rotation += p.rotationSpeed;

        if(p.life <= 0) {
            game.particles.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
        ctx.restore();
    }
}

// Update and draw shockwaves
function updateShockwaves() {
    for(let i = game.shockwaves.length - 1; i >= 0; i--) {
        const wave = game.shockwaves[i];

        wave.radius += 8;
        wave.life -= 0.03;

        if(wave.life <= 0 || wave.radius > wave.maxRadius) {
            game.shockwaves.splice(i, 1);
            continue;
        }

        // Draw multiple wave rings for 3D effect
        for(let j = 0; j < 3; j++) {
            const offset = j * 10;
            const alpha = wave.life * (1 - j * 0.3);
            const currentRadius = wave.radius - offset;

            if(currentRadius > 0) {
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3 - j;
                ctx.beginPath();
                ctx.arc(wave.x, wave.y, currentRadius, 0, Math.PI * 2);
                ctx.stroke();

                // Inner glow
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 2 - j;
                ctx.beginPath();
                ctx.arc(wave.x, wave.y, currentRadius - 2, 0, Math.PI * 2);
                ctx.stroke();

                ctx.restore();
            }
        }
    }
}

// Show stage announcement
function showStageAnnouncement(stageNum) {
    game.stageAnnouncement = {
        stage: stageNum,
        startTime: Date.now(),
        duration: 2000
    };

    // Generate problem immediately to show buttons
    generateProblem();

    // Clear announcement after 2 seconds
    setTimeout(() => {
        game.stageAnnouncement = null;
    }, 2000);
}

// Generate math problem
function generateProblem() {
    let num1, num2, num3, correctAnswer, operator, questionFormat;
    let attempts = 0;
    const maxAttempts = 50;

    // Generate problem that hasn't been used in last 3
    do {
        attempts++;

        // Stage 1: Addition with result 0-10
        if(game.stage === 1) {
            num1 = Math.floor(Math.random() * 11); // 0-10
            num2 = Math.floor(Math.random() * (11 - num1)); // 0 to (10-num1)
            operator = '+';
            correctAnswer = num1 + num2;
            questionFormat = 'standard';
        }
        // Stage 2: Subtraction with operands max 10, result 0-10
        else if(game.stage === 2) {
            num1 = Math.floor(Math.random() * 11); // 0-10
            num2 = Math.floor(Math.random() * (num1 + 1)); // 0 to num1
            operator = '-';
            correctAnswer = num1 - num2;
            questionFormat = 'standard';
        }
        // Stage 3: Addition with result 0-20
        else if(game.stage === 3) {
            num1 = Math.floor(Math.random() * 21); // 0-20
            num2 = Math.floor(Math.random() * (21 - num1)); // 0 to (20-num1)
            operator = '+';
            correctAnswer = num1 + num2;
            questionFormat = 'standard';
        }
        // Stage 4: Subtraction without crossing tens (e.g., 15-4, not 11-2)
        else if(game.stage === 4) {
            num1 = Math.floor(Math.random() * 21); // 0-20
            const unitsDigit = num1 % 10;
            num2 = Math.floor(Math.random() * (unitsDigit + 1)); // 0 to units digit
            operator = '-';
            correctAnswer = num1 - num2;
            questionFormat = 'standard';
        }
        // Stage 5: Addition 0-10, question mark on first or second position
        else if(game.stage === 5) {
            correctAnswer = Math.floor(Math.random() * 11); // 0-10
            const questionPos = Math.random() < 0.5 ? 'first' : 'second';
            if(questionPos === 'first') {
                num2 = Math.floor(Math.random() * (11 - correctAnswer)); // 0 to (10-result)
                num1 = correctAnswer - num2;
                questionFormat = 'missingFirst';
            } else {
                num1 = Math.floor(Math.random() * (11 - correctAnswer)); // 0 to (10-result)
                num2 = correctAnswer - num1;
                questionFormat = 'missingSecond';
            }
            operator = '+';
        }
        // Stage 6: Subtraction 0-10, question mark on first or second position
        else if(game.stage === 6) {
            const questionPos = Math.random() < 0.5 ? 'first' : 'second';
            if(questionPos === 'first') {
                // ? - num2 = result → num1 = result + num2
                correctAnswer = Math.floor(Math.random() * 11); // result 0-10
                num2 = Math.floor(Math.random() * (11 - correctAnswer)); // 0 to (10-result)
                num1 = correctAnswer + num2;
                questionFormat = 'missingFirst';
            } else {
                // num1 - ? = result → num2 = num1 - result
                num1 = Math.floor(Math.random() * 11); // 0-10
                correctAnswer = Math.floor(Math.random() * (num1 + 1)); // 0 to num1
                num2 = num1 - correctAnswer;
                questionFormat = 'missingSecond';
            }
            operator = '-';
        }
        // Stage 7: Addition of 3 numbers, result 0-10
        else if(game.stage === 7) {
            correctAnswer = Math.floor(Math.random() * 11); // 0-10
            num1 = Math.floor(Math.random() * (correctAnswer + 1));
            const remaining = correctAnswer - num1;
            num2 = Math.floor(Math.random() * (remaining + 1));
            num3 = correctAnswer - num1 - num2;
            operator = '+';
            questionFormat = 'triple';
        }
        // Stage 8+: Addition of 3 numbers, result 0-20
        else {
            correctAnswer = Math.floor(Math.random() * 21); // 0-20
            num1 = Math.floor(Math.random() * (correctAnswer + 1));
            const remaining = correctAnswer - num1;
            num2 = Math.floor(Math.random() * (remaining + 1));
            num3 = correctAnswer - num1 - num2;
            operator = '+';
            questionFormat = 'triple';
        }

        // Check if this problem was used recently AND if operands were used recently
        const problemKey = questionFormat === 'triple'
            ? `${num1}${operator}${num2}${operator}${num3}`
            : `${num1}${operator}${num2}${questionFormat}`;
        const operandsUsedRecently = questionFormat === 'triple'
            ? (game.recentOperands.includes(num1) || game.recentOperands.includes(num2) || game.recentOperands.includes(num3))
            : (game.recentOperands.includes(num1) || game.recentOperands.includes(num2));

        if((!game.recentProblems.includes(problemKey) && !operandsUsedRecently) || attempts >= maxAttempts) {
            // Add to recent problems
            game.recentProblems.push(problemKey);
            if(game.recentProblems.length > 3) {
                game.recentProblems.shift();
            }

            // Add operands to recent list
            if(questionFormat === 'triple') {
                game.recentOperands.push(num1, num2, num3);
                if(game.recentOperands.length > 9) {
                    game.recentOperands.shift();
                    game.recentOperands.shift();
                    game.recentOperands.shift();
                }
            } else {
                game.recentOperands.push(num1, num2);
                if(game.recentOperands.length > 6) {
                    game.recentOperands.shift();
                    game.recentOperands.shift();
                }
            }
            break;
        }
    } while(attempts < maxAttempts);

    // Generate wrong answers
    const answers = [correctAnswer];
    const maxAnswer = (game.stage <= 2 || game.stage === 5 || game.stage === 6 || game.stage === 7) ? 10 : 20;

    while(answers.length < 5) {
        const wrong = correctAnswer + Math.floor(Math.random() * 11) - 5;
        if(wrong >= 0 && wrong <= maxAnswer && !answers.includes(wrong)) {
            answers.push(wrong);
        }
    }

    // Shuffle answers
    answers.sort(() => Math.random() - 0.5);

    game.currentQuestion = {
        num1,
        num2,
        num3,
        operator,
        correctAnswer,
        answers,
        questionFormat
    };

    game.startTime = Date.now();

    // Update UI based on question format
    const operatorSymbol = operator === '+' ? '+' : '-';
    let questionText;

    if(questionFormat === 'missingFirst') {
        questionText = `? ${operatorSymbol} ${num2} = ${correctAnswer}`;
    } else if(questionFormat === 'missingSecond') {
        questionText = `${num1} ${operatorSymbol} ? = ${correctAnswer}`;
    } else if(questionFormat === 'triple') {
        questionText = `${num1} ${operatorSymbol} ${num2} ${operatorSymbol} ${num3} = ?`;
    } else {
        questionText = `${num1} ${operatorSymbol} ${num2} = ?`;
    }

    document.getElementById('question').textContent = questionText;
    const container = document.getElementById('answersContainer');
    container.innerHTML = '';

    answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'answerBtn';
        btn.textContent = answer;
        btn.onclick = () => checkAnswer(answer);
        container.appendChild(btn);
    });
}

// Check answer
function checkAnswer(answer) {
    if(game.isGameOver || game.explosion) return;

    const timeTaken = (Date.now() - game.startTime) / 1000;

    if(answer === game.currentQuestion.correctAnswer) {
        // Correct answer
        game.correct++;
        const speedBonus = Math.max(0, Math.floor((10 - timeTaken)));

        // Store score to add after explosion
        game.pendingScore = 10 + speedBonus;

        // Cast spell
        castSpell();

        // Disable buttons during animation
        const buttons = document.querySelectorAll('.answerBtn');
        buttons.forEach(btn => btn.disabled = true);
    } else {
        // Wrong answer - monster speeds up and spell misses
        game.monsterSpeed += 0.5;
        castSpell(true); // Cast spell with miss = true
    }

    updateScore();
}

// Cast spell effect
function castSpell(isMiss = false) {
    let targetX, targetY;

    if(isMiss) {
        // Wrong answer - spell misses with dramatic angle
        const baseTargetX = game.isBossFight ? game.bossX + 100 : game.monsterX + 30;
        const baseTargetY = 200;

        // Random offset: strongly up or down to ensure miss
        const offsetX = (Math.random() - 0.5) * 200; // ±100px horizontally
        const offsetY = Math.random() < 0.5 ? -(150 + Math.random() * 100) : (150 + Math.random() * 100); // ±150-250px vertically

        targetX = baseTargetX + offsetX;
        targetY = baseTargetY + offsetY;
    }

    game.spellEffect = {
        x: 140,
        y: 150,
        alpha: 1,
        color: '#ffd700',
        hasHit: false,
        isMiss: isMiss,
        missTargetX: targetX,
        missTargetY: targetY
    };

    const spellInterval = setInterval(() => {
        if(!game.spellEffect) {
            clearInterval(spellInterval);
            return;
        }

        // Update target dynamically
        if(game.spellEffect.isMiss) {
            // Miss - go to random offset position
            targetX = game.spellEffect.missTargetX;
            targetY = game.spellEffect.missTargetY;
        } else {
            // Hit - track monster/boss
            targetX = game.isBossFight ? game.bossX + 100 : game.monsterX + 30;
            targetY = 200;
        }

        game.spellEffect.x += (targetX - game.spellEffect.x) * 0.2;
        game.spellEffect.y += (targetY - game.spellEffect.y) * 0.2;

        // Check if spell hit target
        if(Math.abs(game.spellEffect.x - targetX) < 10 && Math.abs(game.spellEffect.y - targetY) < 10) {
            if(!game.spellEffect.hasHit) {
                game.spellEffect.hasHit = true;

                // If miss, just disappear without hitting
                if(game.spellEffect.isMiss) {
                    game.spellEffect = null;
                    clearInterval(spellInterval);
                    return;
                }

                if(game.isBossFight) {
                    // Boss hit
                    game.bossHealth--;
                    game.bossHitFlash = 1;

                    if(game.bossHealth <= 0) {
                        // Boss defeated - start epic death animation
                        game.bossDeathAnim = {
                            startTime: Date.now(),
                            phase: 'blink', // blink -> inflate -> explode
                            scale: 1
                        };

                        // Epic death sequence
                        setTimeout(() => {
                            // Phase 1: Rapid blinking (500ms)
                            game.bossDeathAnim.phase = 'inflate';
                        }, 500);

                        setTimeout(() => {
                            // Phase 2: Inflation complete, massive explosion (1200ms total)
                            game.bossDeathAnim.phase = 'explode';

                            // Create wave distortion effect
                            for(let i = 0; i < 5; i++) {
                                game.waveDistortion.push({
                                    x: game.bossX + 100,
                                    y: 200,
                                    radius: 0,
                                    maxRadius: 400,
                                    strength: 30 - i * 5,
                                    life: 1,
                                    speed: 15 - i * 2
                                });
                            }

                            // Multiple explosions in sequence
                            for(let i = 0; i < 8; i++) {
                                setTimeout(() => {
                                    const angle = (i / 8) * Math.PI * 2;
                                    const distance = 50 + Math.random() * 50;
                                    const x = game.bossX + 100 + Math.cos(angle) * distance;
                                    const y = 200 + Math.sin(angle) * distance;
                                    createExplosion(x, y, ['#ff0000', '#ff4500', '#ff8c00', '#ffd700', '#ffffff'][Math.floor(Math.random() * 5)]);
                                }, i * 100);
                            }

                            // Screen flash
                            game.screenFlash = 1;
                            game.screenShake = 50;

                            // Central massive explosion
                            setTimeout(() => {
                                for(let j = 0; j < 3; j++) {
                                    createExplosion(game.bossX + 100, 200, '#ffffff');
                                }
                            }, 400);

                        }, 1200);

                        // Boss defeated - advance stage
                        setTimeout(() => {
                            game.bossDeathAnim = null;
                            game.isBossFight = false;
                            game.bossHealth = 5;
                            game.stage++;
                            game.questionsInStage = 0;

                            // Add pending score after boss explosion
                            if(game.pendingScore > 0) {
                                game.score += game.pendingScore;
                                game.pendingScore = 0;
                                updateScore();
                            }

                            // Switch day/night cycle when stage changes
                            game.isDay = !game.isDay;
                            game.celestialProgress = 0;

                            game.monsterX = canvas.width;
                            game.monsterSpeed = 1; // Reset speed to default
                            game.bossX = 800;
                            game.currentMonster = monsters[Math.floor(Math.random() * monsters.length)];

                            // Show stage announcement, then generate problem
                            showStageAnnouncement(game.stage);

                            // Re-enable buttons
                            const buttons = document.querySelectorAll('.answerBtn');
                            buttons.forEach(btn => btn.disabled = false);
                        }, 3000);
                    } else {
                        // Boss still alive - small hit effect
                        createExplosion(game.bossX + 100, 200, '#ffff00');
                        game.screenShake = 10;

                        // Add pending score after boss hit
                        if(game.pendingScore > 0) {
                            game.score += game.pendingScore;
                            game.pendingScore = 0;
                            updateScore();
                        }

                        generateProblem();

                        // Re-enable buttons
                        const buttons = document.querySelectorAll('.answerBtn');
                        buttons.forEach(btn => btn.disabled = false);
                    }
                } else {
                    // Start inflation animation when spell hits normal monster
                    game.explosion = {
                        startTime: Date.now(),
                        duration: 600,
                        x: game.monsterX,
                        y: 180
                    };
                }
            }
            game.spellEffect = null;
            clearInterval(spellInterval);
        }
    }, 30);
}

// Update score display
function updateScore() {
    document.getElementById('score').textContent = game.score;
    document.getElementById('correct').textContent = game.correct;
}

// Game over
function gameOver() {
    // Start witch death animation
    game.witchDeathAnim = {
        startTime: Date.now(),
        phase: 'inflate',
        scale: 1
    };

    // Inflate witch, then explode
    setTimeout(() => {
        game.witchDeathAnim.phase = 'explode';

        // Witch explosion - offset 120px right and 120px down from original position
        // Original: (45, 75), New: (165, 195)
        createExplosion(165, 195, '#ffd700');

        setTimeout(() => {
            createExplosion(165, 195, '#ffffff');
        }, 100);

        // Show game over after explosion
        setTimeout(() => {
            game.isGameOver = true;
            game.witchDeathAnim = null;

            const speedBonus = Math.floor(game.correct * 5);

            document.getElementById('finalScore').textContent = game.score + speedBonus;
            document.getElementById('finalCorrect').textContent = game.correct;
            document.getElementById('speedBonus').textContent = speedBonus;
            document.getElementById('finalStage').textContent = game.stage;
            document.getElementById('gameOverOverlay').style.display = 'block';
            document.getElementById('gameOver').style.display = 'block';
        }, 500);
    }, 800);
}

// Restart game
document.getElementById('restartBtn').onclick = function() {
    game.score = 0;
    game.correct = 0;
    game.monsterX = canvas.width;
    game.monsterSpeed = 1;
    game.isGameOver = false;
    game.spellEffect = null;
    game.explosion = null;
    game.particles = [];
    game.monsterScale = 1;
    game.shockwaves = [];
    game.screenShake = 0;
    game.parallax.mountains = 0;
    game.parallax.trees = 0;
    game.parallax.bushes = 0;
    game.celestialProgress = 0;
    game.isDay = true;
    game.stage = 1;
    game.questionsInStage = 0;
    game.isBossFight = false;
    game.bossHealth = 5;
    game.bossAnimFrame = 0;
    game.bossX = 800;
    game.bossHitFlash = 0;
    game.bossDeathAnim = null;
    game.screenFlash = 0;
    game.waveDistortion = [];
    game.stageAnnouncement = null;
    game.recentProblems = [];
    game.recentOperands = [];
    initBats();
    initSeagulls();

    document.getElementById('gameOverOverlay').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    updateScore();

    game.currentMonster = monsters[Math.floor(Math.random() * monsters.length)];
    showStageAnnouncement(1);
};

// Draw parallax background
function drawBackground() {
    // Stage-specific color palettes
    let colors;

    if(game.stage === 2) {
        // Lava/Nether theme (Minecraft-inspired)
        colors = {
            skyTop: '#8B0000',        // Dark red
            skyBottom: '#4A0000',     // Very dark red
            mountains: '#5C0000',     // Dark crimson
            trees: '#8B2500',         // Red-orange pillars
            bushes: '#A0250F',        // Bright lava cracks
            ground: '#2B0000',        // Almost black red
            grass: '#FF4500',         // Bright orange-red (lava glow)
            lavaGlow: true
        };
    } else {
        // Default palettes (day/night)
        colors = game.isDay ? {
            skyTop: '#87ceeb',
            skyBottom: '#b0d4f1',
            mountains: '#6b8e9f',
            trees: '#4a7c59',
            bushes: '#5a9b4a',
            ground: '#7cb342',
            grass: '#9ccc65'
        } : {
            skyTop: '#1a1a4e',
            skyBottom: '#2a3d66',
            mountains: '#1a2a4a',
            trees: '#2a4a5a',
            bushes: '#3a5d5a',
            ground: '#2a4d2a',
            grass: '#3a5d3a'
        };
    }

    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 350);
    gradient.addColorStop(0, colors.skyTop);
    gradient.addColorStop(1, colors.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 350);

    // Draw twinkling stars (only at night)
    if(!game.isDay) {
        stars.forEach(star => {
            star.brightness += star.twinkleSpeed;
            if(star.brightness > 1) star.brightness = 0;

            const alpha = Math.abs(Math.sin(star.brightness * Math.PI));
            ctx.globalAlpha = alpha * 0.8;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(star.x, star.y, star.size, star.size);

            // Star sparkle effect
            if(alpha > 0.7) {
                ctx.fillRect(star.x - 1, star.y, 1, star.size);
                ctx.fillRect(star.x + star.size, star.y, 1, star.size);
                ctx.fillRect(star.x, star.y - 1, star.size, 1);
                ctx.fillRect(star.x, star.y + star.size, star.size, 1);
            }
        });
        ctx.globalAlpha = 1;

        // Shooting stars / meteors
        if(!game.isGameOver) {
            // Randomly spawn shooting stars (1% chance per frame)
            if(Math.random() < 0.01) {
                game.shootingStars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * 100, // Top part of sky
                    vx: -3 - Math.random() * 2, // Moving left
                    vy: 2 + Math.random() * 1.5, // Moving down
                    life: 1,
                    trail: []
                });
            }
        }

        // Update and draw shooting stars
        for(let i = game.shootingStars.length - 1; i >= 0; i--) {
            const star = game.shootingStars[i];

            // Update position
            star.x += star.vx;
            star.y += star.vy;
            star.life -= 0.015;

            // Add current position to trail
            star.trail.push({ x: star.x, y: star.y });
            if(star.trail.length > 15) {
                star.trail.shift();
            }

            // Remove if off screen or life depleted
            if(star.life <= 0 || star.y > 300 || star.x < -50) {
                game.shootingStars.splice(i, 1);
                continue;
            }

            // Draw trail (glowing tail)
            for(let j = 0; j < star.trail.length; j++) {
                const trailPoint = star.trail[j];
                const trailAlpha = (j / star.trail.length) * star.life;
                const trailSize = (j / star.trail.length) * 3 + 1;

                ctx.globalAlpha = trailAlpha * 0.8;

                // Bright core
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(trailPoint.x, trailPoint.y, trailSize, trailSize);

                // Orange glow
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(trailPoint.x - 1, trailPoint.y - 1, trailSize + 2, trailSize + 2);

                // Red outer glow
                if(j > star.trail.length * 0.7) {
                    ctx.fillStyle = '#ff6600';
                    ctx.fillRect(trailPoint.x - 2, trailPoint.y - 2, trailSize + 4, trailSize + 4);
                }
            }

            // Draw meteor head
            ctx.globalAlpha = star.life;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(star.x - 1, star.y - 1, 4, 4);

            // Bright glow around meteor
            ctx.fillStyle = '#ffffaa';
            ctx.globalAlpha = star.life * 0.6;
            ctx.fillRect(star.x - 2, star.y - 2, 6, 6);

            ctx.globalAlpha = 1;
        }
    }

    // Update and draw sun/moon on elliptical path
    if(!game.isGameOver) {
        game.celestialProgress += 0.001;
        if(game.celestialProgress > 1) game.celestialProgress = 0;
    }

    // Elliptical path: x goes from RIGHT to LEFT (canvas.width to 0)
    const celestialX = canvas.width - (game.celestialProgress * canvas.width);
    const ellipseA = canvas.width / 2;
    const ellipseB = 120; // Increased for more vertical movement
    const centerX = canvas.width / 2;
    const centerY = 120; // Lowered center for better visibility

    // Calculate y position on ellipse with smoother curve
    const relativeX = celestialX - centerX;
    const normalizedX = relativeX / ellipseA;

    // Use a smoother curve (power of 1.5 instead of 2 for less time at apex)
    const yOffset = Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(normalizedX), 1.5))) * ellipseB;
    const celestialY = centerY - yOffset;

    if(game.isDay) {
        // Draw sun
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 25, 0, Math.PI * 2);
        ctx.fill();

        // Sun rays
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        for(let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + Date.now() / 1000;
            const x1 = celestialX + Math.cos(angle) * 30;
            const y1 = celestialY + Math.sin(angle) * 30;
            const x2 = celestialX + Math.cos(angle) * 40;
            const y2 = celestialY + Math.sin(angle) * 40;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // Sun glow
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    } else {
        // Draw moon
        ctx.fillStyle = '#f0f0a0';
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 20, 0, Math.PI * 2);
        ctx.fill();

        // Moon craters
        ctx.fillStyle = '#d0d080';
        ctx.beginPath();
        ctx.arc(celestialX - 5, celestialY - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(celestialX + 6, celestialY + 4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(celestialX + 2, celestialY + 8, 2, 0, Math.PI * 2);
        ctx.fill();

        // Moon glow
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ffff80';
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Update and draw seagulls (only during day)
    if(game.isDay) {
        game.seagulls.forEach(seagull => {
            if(!game.isGameOver) {
                seagull.x += seagull.speed;
                seagull.wingPhase += 0.15;

                // Reset seagull when it goes off screen
                if(seagull.x > canvas.width + 40) {
                    seagull.x = -40;
                    seagull.y = 30 + Math.random() * 120;
                }
            }

            const wingAngle = Math.sin(seagull.wingPhase) * 0.8;
            const bobbing = Math.sin(seagull.wingPhase * 0.5) * seagull.amplitude * 0.1;

            // Seagull body - white
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(seagull.x, seagull.y + bobbing, 10, 4);

            // Seagull wings - V shape
            ctx.save();
            ctx.translate(seagull.x + 5, seagull.y + 2 + bobbing);

            // Left wing
            ctx.rotate(wingAngle);
            ctx.fillRect(-8, -1, 8, 3);
            ctx.rotate(-wingAngle);

            // Right wing
            ctx.rotate(-wingAngle);
            ctx.fillRect(0, -1, 8, 3);

            ctx.restore();

            // Seagull head
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(seagull.x + 8, seagull.y - 1 + bobbing, 3, 3);

            // Beak - yellow
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(seagull.x + 11, seagull.y + bobbing, 2, 2);
        });
    }

    // Update and draw bats (only at night)
    if(!game.isDay) {
        game.bats.forEach(bat => {
            if(!game.isGameOver) {
                bat.x += bat.speed;
                bat.wingPhase += 0.2;

                // Reset bat when it goes off screen
                if(bat.x > canvas.width + 30) {
                    bat.x = -30;
                    bat.y = 50 + Math.random() * 150;
                }
            }

            const wingAngle = Math.sin(bat.wingPhase) * 0.5;
            const bobbing = Math.sin(bat.wingPhase * 0.5) * bat.amplitude * 0.1;

            // Bat body
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(bat.x, bat.y + bobbing, 8, 6);

            // Bat wings
            ctx.save();
            ctx.translate(bat.x + 4, bat.y + 3 + bobbing);

            // Left wing
            ctx.rotate(wingAngle);
            ctx.fillRect(-12, -2, 10, 4);
            ctx.rotate(-wingAngle);

            // Right wing
            ctx.rotate(-wingAngle);
            ctx.fillRect(2, -2, 10, 4);

            ctx.restore();

            // Bat ears
            ctx.fillRect(bat.x + 1, bat.y - 2 + bobbing, 2, 3);
            ctx.fillRect(bat.x + 5, bat.y - 2 + bobbing, 2, 3);
        });
    }

    // Update parallax positions (moving right to simulate wizard moving forward)
    if(!game.isGameOver) {
        game.parallax.mountains += 0.2;
        game.parallax.trees += 0.5;
        game.parallax.bushes += 1.0;
    }

    // Layer 1: Distant mountains/structures (slowest)
    const mountainOffset = game.parallax.mountains % 800;

    if(game.stage === 2) {
        // Lava stage: Dark netherrack cliffs
        ctx.fillStyle = colors.mountains;
        for(let x = -800; x < canvas.width + 800; x += 200) {
            const baseX = x - mountainOffset;
            // Jagged cliff 1
            ctx.beginPath();
            ctx.moveTo(baseX, 280);
            ctx.lineTo(baseX + 60, 160);
            ctx.lineTo(baseX + 80, 180);
            ctx.lineTo(baseX + 100, 170);
            ctx.lineTo(baseX + 160, 280);
            ctx.fill();

            // Cliff 2
            ctx.beginPath();
            ctx.moveTo(baseX + 100, 280);
            ctx.lineTo(baseX + 150, 190);
            ctx.lineTo(baseX + 170, 200);
            ctx.lineTo(baseX + 200, 185);
            ctx.lineTo(baseX + 240, 280);
            ctx.fill();
        }
    } else {
        // Default: Mountains
        ctx.fillStyle = colors.mountains;
        for(let x = -800; x < canvas.width + 800; x += 200) {
            const baseX = x - mountainOffset;
            // Mountain 1
            ctx.beginPath();
            ctx.moveTo(baseX, 280);
            ctx.lineTo(baseX + 80, 180);
            ctx.lineTo(baseX + 160, 280);
            ctx.fill();

            // Mountain 2
            ctx.beginPath();
            ctx.moveTo(baseX + 100, 280);
            ctx.lineTo(baseX + 170, 200);
            ctx.lineTo(baseX + 240, 280);
            ctx.fill();
        }
    }

    // Layer 2: Trees/Pillars (medium speed)
    const treeOffset = game.parallax.trees % 600;

    if(game.stage === 2) {
        // Lava stage: Basalt pillars with lava drips
        const time = Date.now() / 1000;

        for(let x = -600; x < canvas.width + 600; x += 100) {
            const baseX = x - treeOffset;

            // Basalt pillar
            ctx.fillStyle = colors.trees;
            ctx.fillRect(baseX + 38, 250, 20, 80);
            ctx.fillRect(baseX + 36, 248, 24, 4);
            ctx.fillRect(baseX + 34, 246, 28, 4);

            // Lava drips (animated)
            const dripPhase = (time * 2 + x * 0.01) % 1;
            const dripY = 250 + dripPhase * 60;

            if(dripY < 310) {
                ctx.fillStyle = '#FF6600';
                ctx.fillRect(baseX + 45, dripY, 4, 8);
                ctx.fillStyle = '#FF4500';
                ctx.fillRect(baseX + 46, dripY + 6, 2, 4);
            }
        }
    } else {
        // Default: Trees
        ctx.fillStyle = colors.trees;
        for(let x = -600; x < canvas.width + 600; x += 100) {
            const baseX = x - treeOffset;
            // Tree trunk
            ctx.fillRect(baseX + 40, 280, 15, 50);
            // Tree foliage
            ctx.beginPath();
            ctx.moveTo(baseX + 30, 280);
            ctx.lineTo(baseX + 47, 250);
            ctx.lineTo(baseX + 65, 280);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(baseX + 32, 270);
            ctx.lineTo(baseX + 47, 240);
            ctx.lineTo(baseX + 62, 270);
            ctx.fill();
        }
    }

    // Layer 3: Bushes/Lava cracks (fastest)
    const bushOffset = game.parallax.bushes % 400;

    if(game.stage === 2) {
        // Lava stage: Glowing lava cracks
        const time = Date.now() / 1000;

        for(let x = -400; x < canvas.width + 400; x += 80) {
            const baseX = x - bushOffset;
            const glow = Math.sin(time * 3 + x * 0.1) * 0.3 + 0.7;

            // Lava crack
            ctx.fillStyle = colors.bushes;
            ctx.globalAlpha = glow;
            ctx.fillRect(baseX + 10, 325, 30, 8);
            ctx.fillRect(baseX + 15, 318, 20, 7);
            ctx.fillRect(baseX + 20, 310, 10, 8);

            // Bright core
            ctx.fillStyle = '#FFAA00';
            ctx.fillRect(baseX + 18, 327, 14, 4);

            ctx.globalAlpha = 1;
        }
    } else {
        // Default: Bushes
        ctx.fillStyle = colors.bushes;
        for(let x = -400; x < canvas.width + 400; x += 80) {
            const baseX = x - bushOffset;
            // Bush
            ctx.fillRect(baseX + 10, 320, 30, 20);
            ctx.fillRect(baseX + 5, 330, 40, 15);

            // Small bush
            ctx.fillRect(baseX + 50, 330, 20, 15);
        }
    }

    // Ground
    ctx.fillStyle = colors.ground;
    ctx.fillRect(0, 345, canvas.width, 55);

    // Draw stage indicators (10 circles)
    const stageY = 375;
    const startX = (canvas.width - (10 * 30)) / 2;

    for(let i = 1; i <= 10; i++) {
        const circleX = startX + (i - 1) * 30 + 15;

        // Circle background
        ctx.fillStyle = i === game.stage ? '#ffd700' : '#555';
        ctx.beginPath();
        ctx.arc(circleX, stageY, 12, 0, Math.PI * 2);
        ctx.fill();

        // Circle border
        ctx.strokeStyle = i === game.stage ? '#ffeb3b' : '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Stage number
        ctx.fillStyle = i === game.stage ? '#000' : '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i, circleX, stageY);

        // Glow for current stage
        if(i === game.stage) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(circleX, stageY, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    // Grass
    ctx.fillStyle = colors.grass;
    const grassOffset = game.parallax.bushes % 20;
    for(let i = -20; i < canvas.width + 20; i += 20) {
        const baseX = i - grassOffset;
        ctx.fillRect(baseX, 345, 3, 8);
        ctx.fillRect(baseX + 7, 347, 3, 6);
        ctx.fillRect(baseX + 14, 346, 3, 7);
    }
}

// Main game loop
function gameLoop() {
    // Apply screen shake
    ctx.save();
    if(game.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * game.screenShake;
        const shakeY = (Math.random() - 0.5) * game.screenShake;
        ctx.translate(shakeX, shakeY);
        game.screenShake *= 0.9;
        if(game.screenShake < 0.5) game.screenShake = 0;
    }

    // Clear canvas
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background
    drawBackground();

    // Draw shockwaves (behind everything)
    updateShockwaves();

    // Draw wizard
    drawWizard();

    // Draw and move monster or boss
    if(!game.isGameOver) {
        if(game.isBossFight) {
            // Boss moves slowly and continuously towards witch
            if(!game.bossDeathAnim) {
                game.bossX -= 0.5;
            }

            const currentBoss = bosses[game.stage - 1];
            drawBoss(currentBoss, game.bossX, 100, 1);

            // Check if boss reached witch (boss is 200px wide, witch at x=50)
            if(game.bossX < 250 && !game.bossDeathAnim && !game.witchDeathAnim) {
                gameOver();
            }
        } else {
            // Normal monster behavior - always move
            game.monsterX -= game.monsterSpeed;

            // Handle inflation animation
            if(game.explosion) {
                const elapsed = Date.now() - game.explosion.startTime;
                const progress = elapsed / game.explosion.duration;

                if(progress < 1) {
                    // Inflate gradually
                    game.monsterScale = 1 + progress * 1.2;
                } else {
                    // Fully inflated - explode!
                    createExplosion(game.monsterX, 180, game.currentMonster.color);
                    game.explosion = null;
                    game.monsterScale = 1;
                    game.monsterX = canvas.width;
                    game.monsterSpeed = 1; // Reset speed to default
                    game.currentMonster = monsters[Math.floor(Math.random() * monsters.length)];

                    // Add pending score after explosion
                    if(game.pendingScore > 0) {
                        game.score += game.pendingScore;
                        game.pendingScore = 0;
                        updateScore();
                    }

                    // Progress stage system (4 questions + 1 boss per stage)
                    game.questionsInStage++;
                    if(game.questionsInStage >= 4) {
                        // Start boss fight
                        game.isBossFight = true;
                        game.bossHealth = 5;
                        game.questionsInStage = 0;
                        game.bossX = 800;
                    }

                    generateProblem();

                    // Re-enable buttons
                    const buttons = document.querySelectorAll('.answerBtn');
                    buttons.forEach(btn => btn.disabled = false);
                }
            }

            if(game.currentMonster) {
                // Monster bobbing animation like witch
                const monsterBobbing = Math.sin(Date.now() / 300) * 4;
                const monsterY = 180 + monsterBobbing;

                // Draw pulsing red aura around monster (only if not inflating)
                if(!game.explosion) {
                    const time = Date.now() / 1000;
                    const pulse = Math.sin(time * 3) * 0.5 + 0.5; // 0-1
                    const auraSize = 15 + pulse * 10;

                    // Multiple aura layers for 3D effect
                    for(let i = 0; i < 4; i++) {
                    const layerOffset = i * 8;
                    const layerPulse = Math.sin(time * 3 + i * 0.5) * 0.5 + 0.5;
                    const alpha = (0.3 - i * 0.06) * layerPulse;

                    ctx.save();
                    ctx.globalAlpha = alpha;

                    // Create radial gradient for glow
                    const gradient = ctx.createRadialGradient(
                        game.monsterX + 40, monsterY + 40,
                        40 * game.monsterScale,
                        game.monsterX + 40, monsterY + 40,
                        (40 + auraSize + layerOffset) * game.monsterScale
                    );
                    gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
                    gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0.6)');
                    gradient.addColorStop(0.8, 'rgba(255, 100, 0, 0.4)');
                    gradient.addColorStop(1, 'rgba(255, 200, 0, 0)');

                    ctx.fillStyle = gradient;
                    ctx.fillRect(
                        game.monsterX - auraSize - layerOffset,
                        monsterY - auraSize - layerOffset,
                        (80 + (auraSize + layerOffset) * 2) * game.monsterScale,
                        (80 + (auraSize + layerOffset) * 2) * game.monsterScale
                    );

                    ctx.restore();
                    }
                }

                drawMonster(game.currentMonster, game.monsterX, monsterY, game.monsterScale);
            }

            // Check if monster reached witch (monster is 80px wide, witch at x=50)
            if(game.monsterX < 130 && !game.explosion && !game.witchDeathAnim) {
                gameOver();
            }
        }
    }

    // Draw particles
    updateParticles();

    // Draw spell effect
    if(game.spellEffect) {
        ctx.fillStyle = game.spellEffect.color;
        ctx.globalAlpha = game.spellEffect.alpha;
        ctx.beginPath();
        ctx.arc(game.spellEffect.x, game.spellEffect.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Particles
        for(let i = 0; i < 5; i++) {
            const angle = (Date.now() / 100 + i * Math.PI * 2 / 5);
            const px = game.spellEffect.x + Math.cos(angle) * 15;
            const py = game.spellEffect.y + Math.sin(angle) * 15;
            ctx.fillRect(px, py, 3, 3);
        }

        ctx.globalAlpha = 1;
    }

    // Draw wave distortion effects
    for(let i = game.waveDistortion.length - 1; i >= 0; i--) {
        const wave = game.waveDistortion[i];
        wave.radius += wave.speed;
        wave.life -= 0.02;

        if(wave.life <= 0 || wave.radius > wave.maxRadius) {
            game.waveDistortion.splice(i, 1);
            continue;
        }

        // Draw distortion rings with varying thickness
        for(let j = 0; j < 3; j++) {
            const offset = j * 15;
            const currentRadius = wave.radius - offset;

            if(currentRadius > 0) {
                ctx.save();
                ctx.globalAlpha = wave.life * (1 - j * 0.3);

                // Outer white ring
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 5 - j;
                ctx.beginPath();
                ctx.arc(wave.x, wave.y, currentRadius, 0, Math.PI * 2);
                ctx.stroke();

                // Inner colored ring (with safety check for gradient radii)
                const innerRadius = Math.max(0, currentRadius - 5);
                const outerRadius = Math.max(innerRadius + 0.1, currentRadius);
                const gradient = ctx.createRadialGradient(wave.x, wave.y, innerRadius, wave.x, wave.y, outerRadius);
                gradient.addColorStop(0, '#ff0000');
                gradient.addColorStop(0.5, '#ff8c00');
                gradient.addColorStop(1, '#ffd700');
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 3 - j;
                ctx.beginPath();
                ctx.arc(wave.x, wave.y, Math.max(0, currentRadius - 3), 0, Math.PI * 2);
                ctx.stroke();

                ctx.restore();
            }
        }
    }

    // Screen flash effect
    if(game.screenFlash > 0) {
        ctx.globalAlpha = game.screenFlash * 0.7;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        game.screenFlash -= 0.05;
        if(game.screenFlash < 0) game.screenFlash = 0;
    }

    // Stage announcement (overlay on top of game)
    if(game.stageAnnouncement) {
        const elapsed = Date.now() - game.stageAnnouncement.startTime;
        const progress = elapsed / game.stageAnnouncement.duration;

        // Only render if not fully faded out
        if(progress < 1) {
            // Fade in/out effect
            let alpha;
            if(progress < 0.2) {
                alpha = progress / 0.2; // Fade in
            } else if(progress > 0.8) {
                alpha = (1 - progress) / 0.2; // Fade out
            } else {
                alpha = 1; // Full opacity
            }

            ctx.globalAlpha = alpha;

            // Stage text with dark background box
            const stageText = `Stage ${game.stageAnnouncement.stage}`;
            const stageName = stageNames[game.stageAnnouncement.stage - 1] || 'Unknown';

            // Background box for text
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(canvas.width / 2 - 250, canvas.height / 2 - 60, 500, 120);

            // Border
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 4;
            ctx.strokeRect(canvas.width / 2 - 250, canvas.height / 2 - 60, 500, 120);

            // Stage text
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 48px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Glow effect
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 20;
            ctx.fillText(stageText, canvas.width / 2, canvas.height / 2 - 20);

            // Stage name
            ctx.shadowBlur = 15;
            ctx.font = 'bold 28px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(stageName, canvas.width / 2, canvas.height / 2 + 25);

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }
    }

    ctx.restore();

    requestAnimationFrame(gameLoop);
}

// Initialize game
initBats();
initSeagulls();
game.currentMonster = monsters[Math.floor(Math.random() * monsters.length)];
showStageAnnouncement(1);
gameLoop();