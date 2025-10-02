/**
 * MATH WIZARD - Educational Math Game
 *
 * Key Features:
 * - 10 progressive stages with different math problem types
 * - Stage 1: a + b = ? with values 0-10
 * - Stage 2: a - b = ? with values 0-10
 * - Stage 3: ? + a = b with values 0-10
 * - Stage 4: a - ? = b with values 0-10
 * - Stage 5: a + b = ? with values 0-20
 * - Stage 6: a - b = ? with values 0-20
 * - Stage 7: a + b + c = ? with values 0-10
 * - Stage 8: a + b + c = ? with values 0-20
 * - Stage 9: a + b = ? with values 0-30
 * - Stage 10: a - b = ? with values 0-30
 *
 * Important Rules:
 * - No operand repeats in the next 3 problems
 * - Wrong answer: spell misses, monster speeds up by 0.5
 * - Speed resets to 1.0 with each new monster/boss
 * - Score is added AFTER explosion completes
 * - Red aura around monsters (hidden during inflation)
 */

const VERSION_INFO = (() => {
    const declared = '3.3.21';
    let fromQuery = null;

    try {
        const script = document.currentScript || Array.from(document.querySelectorAll('script[src]')).find(s => s.src.includes('game.js'));

        if(script) {
            const src = script.getAttribute('src') || script.src || '';
            const match = src.match(/[?&]v=([^&]+)/);
            if(match && match[1]) {
                fromQuery = decodeURIComponent(match[1]);
            }
        }
    } catch(err) {
        // Ignore parsing issues and keep fallback value
    }

    const effective = fromQuery || declared;
    const mismatch = fromQuery !== null && fromQuery !== declared;

    return {
        declared,
        fromQuery,
        effective,
        mismatch
    };
})();

const GAME_VERSION = VERSION_INFO.effective;

// Ladicí přepínač umožňující zpomalit smyčku hry pro testování animací
let debugSlow = false;
const DEBUG_SLOW_FPS = 10;
let lastDebugFrameTime = 0;

// Ladicí přepínač pro zobrazení všech bossů najednou
let debugBoss = false;

// Ladicí přepínač pro zobrazení FPS v pravém horním rohu
let debugFPS = false;
let fpsFrameTimes = [];
let currentFPS = 0;

if(typeof window !== 'undefined') {
    if(Object.prototype.hasOwnProperty.call(window, 'debugSlow')) {
        debugSlow = Boolean(window.debugSlow);
    }

    Object.defineProperty(window, 'debugSlow', {
        configurable: true,
        get() {
            return debugSlow;
        },
        set(value) {
            debugSlow = Boolean(value);
            lastDebugFrameTime = 0;
        }
    });

    window.debugSlow = debugSlow;

    if(Object.prototype.hasOwnProperty.call(window, 'debugBoss')) {
        debugBoss = Boolean(window.debugBoss);
    }

    Object.defineProperty(window, 'debugBoss', {
        configurable: true,
        get() {
            return debugBoss;
        },
        set(value) {
            debugBoss = Boolean(value);
        }
    });

    window.debugBoss = debugBoss;

    if(Object.prototype.hasOwnProperty.call(window, 'debugFPS')) {
        debugFPS = Boolean(window.debugFPS);
    }

    Object.defineProperty(window, 'debugFPS', {
        configurable: true,
        get() {
            return debugFPS;
        },
        set(value) {
            debugFPS = Boolean(value);
        }
    });

    window.debugFPS = debugFPS;
}

const WITCH_HEAD_X = 90;
const WITCH_HEAD_Y = 140;
const WITCH_SHIELD_OFFSET_X = 35;
const WITCH_SHIELD_OFFSET_Y = 40;
// Chest-level aim point for fireballs and shield origin: (100, 150)
const WITCH_SHIELD_CENTER_X = WITCH_HEAD_X + WITCH_SHIELD_OFFSET_X;
const WITCH_SHIELD_CENTER_Y = WITCH_HEAD_Y + WITCH_SHIELD_OFFSET_Y;
const MONSTER_SPELL_TARGET_Y = 220; // Witch fireball aim point
const BOSS_SPELL_TARGET_X_OFFSET = 90; // Boss impact point
const BOSS_EXPLOSION_CENTER_X_OFFSET = BOSS_SPELL_TARGET_X_OFFSET - 35;
const FIREBALL_MIN_INTERVAL = 2000;
const FIREBALL_MAX_INTERVAL = 10000;
const FIREBALL_SHIELD_RADIUS = 50;

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
    recentOperands: [], // Track operand sets for the last 3 problems
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
    seagulls: [],
    cloudLayers: [],
    lastCloudSpawnTime: 0,
    fireflies: [],
    pollenMotes: [],
    timeState: {
        phase: 0,
        blend: 1,
        sunAlpha: 1,
        moonAlpha: 0
    },
    answerLockTimer: null,
    answerLockUntil: 0,
    wrongAttemptCount: 0,
    lastCorrectAnswer: null,
    lastOperationType: null,
    fireballs: [],
    nextFireballTime: null,
    witchShield: null,
    monsterVisualY: 180,
    selectedGrade: null,
    isPausedForModal: true,
    monsterHitFlash: 0
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

const GRADE_STORAGE_KEY = 'mathwizard.grade';
const GRADE_SLIDER_MIN = 0;
const GRADE_SLIDER_MAX = 13;

function getGradeLabel(value) {
    const numeric = typeof value === 'number' ? value : parseInt(value, 10);

    if(Number.isNaN(numeric)) {
        return 'Předškolní';
    }

    const normalized = Math.min(Math.max(numeric, GRADE_SLIDER_MIN), GRADE_SLIDER_MAX);

    if(normalized <= 0) {
        return 'Předškolní';
    }

    if(normalized <= 9) {
        return `${normalized}. ročník ZŠ`;
    }

    const highSchoolYear = normalized - 9;
    return `${highSchoolYear}. ročník SŠ`;
}

function hexToRgb(hex) {
    const normalized = hex.replace('#', '');
    const bigint = parseInt(normalized, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function rgbToHex({ r, g, b }) {
    const toComponent = value => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
    return `#${toComponent(r)}${toComponent(g)}${toComponent(b)}`;
}

function mixHexColors(a, b, t) {
    const colorA = hexToRgb(a);
    const colorB = hexToRgb(b);
    const mixComponent = key => colorA[key] + (colorB[key] - colorA[key]) * t;
    return rgbToHex({ r: mixComponent('r'), g: mixComponent('g'), b: mixComponent('b') });
}

function lightenHexColor(hex, amount) {
    return mixHexColors(hex, '#ffffff', amount);
}

function getModalBackgroundColor(value) {
    const normalized = Math.min(Math.max(value / (GRADE_SLIDER_MAX || 1), 0), 1);
    const blue = '#1a3f8a';
    const purple = '#5a2c91';
    const red = '#9c1f24';

    if(normalized <= 0.5) {
        const t = normalized / 0.5;
        return mixHexColors(blue, purple, t);
    }

    const t = (normalized - 0.5) / 0.5;
    return mixHexColors(purple, red, t);
}

function computeGradeGradientColors(value) {
    const baseColor = getModalBackgroundColor(value);
    const lightAccent = lightenHexColor(baseColor, 0.35);
    return { baseColor, lightAccent };
}

function updateAgeModalBackground(value) {
    if(!ageModal) {
        return;
    }

    const colors = computeGradeGradientColors(value);
    const { baseColor, lightAccent } = colors;
    ageModal.style.background = `linear-gradient(135deg, ${lightAccent} 0%, ${baseColor} 100%)`;
    updateQuestionPanelBackground(colors);
    updateGameOverBackground(colors);
}

function updateQuestionPanelBackground(colors) {
    const questionPanel = document.getElementById('questionPanel');
    if(!questionPanel || !colors) {
        return;
    }

    const { baseColor, lightAccent } = colors;
    questionPanel.style.background = `linear-gradient(135deg, ${lightAccent} 0%, ${baseColor} 100%)`;
    questionPanel.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.35)';
    questionPanel.style.border = '1px solid rgba(255, 255, 255, 0.12)';
}

function updateGameOverBackground(colors) {
    const finalDialog = document.getElementById('gameOver');
    if(!finalDialog || !colors) {
        return;
    }

    const { baseColor, lightAccent } = colors;
    finalDialog.style.background = `linear-gradient(135deg, ${lightAccent} 0%, ${baseColor} 100%)`;
    finalDialog.style.boxShadow = '0 18px 36px rgba(0, 0, 0, 0.45)';
    finalDialog.style.border = '1px solid rgba(255, 255, 255, 0.18)';
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
    for(let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

function setAnswerButtonsDisabled(disabled, options = {}) {
    const { locked = false } = options;
    const buttons = document.querySelectorAll('.answerBtn');
    buttons.forEach(btn => {
        btn.disabled = disabled;
        if(disabled && locked) {
            btn.classList.add('answerBtn--locked');
        } else if(!disabled || !locked) {
            btn.classList.remove('answerBtn--locked');
        }
    });
}

function clearAnswerLock() {
    if(game.answerLockTimer) {
        clearTimeout(game.answerLockTimer);
        game.answerLockTimer = null;
    }
    game.answerLockUntil = 0;
    document.querySelectorAll('.answerBtn--locked').forEach(btn => btn.classList.remove('answerBtn--locked'));
}

function lockAnswerButtons(duration) {
    clearAnswerLock();
    game.answerLockUntil = Date.now() + duration;
    setAnswerButtonsDisabled(true, { locked: true });

    game.answerLockTimer = setTimeout(() => {
        game.answerLockTimer = null;
        game.answerLockUntil = 0;

        if(!game.isGameOver && game.currentQuestion && !game.explosion && !game.witchDeathAnim) {
            setAnswerButtonsDisabled(false);
        }
    }, duration);
}

function computeDayNightState(progress = game.celestialProgress) {
    let phase = progress % 1;
    if(phase < 0) {
        phase += 1;
    }

    let sunAlpha = 0;
    let moonAlpha = 0;
    let sunTrack = 0;
    let moonTrack = 0;

    if(phase < 0.5) {
        const sunProgress = clamp01(phase / 0.5);
        sunAlpha = Math.sin(sunProgress * Math.PI);
        sunTrack = sunProgress;
    } else {
        const moonProgress = clamp01((phase - 0.5) / 0.5);
        moonAlpha = Math.sin(moonProgress * Math.PI);
        moonTrack = moonProgress;
    }

    sunAlpha = clamp01(sunAlpha);
    moonAlpha = clamp01(moonAlpha);

    const blend = clamp01(sunAlpha);
    const nightStrength = clamp01(Math.max(1 - blend, moonAlpha));

    return {
        phase,
        blend,
        sunAlpha,
        moonAlpha,
        sunTrack,
        moonTrack,
        dayStrength: blend,
        nightStrength,
        isDay: blend >= 0.5
    };
}

function parseColorString(color) {
    if(typeof color !== 'string') return null;
    const trimmed = color.trim();

    if(trimmed.startsWith('#')) {
        let hex = trimmed.slice(1);
        if(hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        if(hex.length !== 6) return null;
        const value = parseInt(hex, 16);
        if(Number.isNaN(value)) return null;
        return {
            r: (value >> 16) & 255,
            g: (value >> 8) & 255,
            b: value & 255,
            a: 1
        };
    }

    const rgbaMatch = trimmed.match(/^rgba?\(([^)]+)\)$/i);
    if(rgbaMatch) {
        const parts = rgbaMatch[1].split(',').map(part => part.trim());
        const r = parseFloat(parts[0]);
        const g = parseFloat(parts[1]);
        const b = parseFloat(parts[2]);
        const a = parts.length > 3 ? parseFloat(parts[3]) : 1;
        if([r, g, b, a].some(component => Number.isNaN(component))) return null;
        return {
            r: Math.max(0, Math.min(255, r)),
            g: Math.max(0, Math.min(255, g)),
            b: Math.max(0, Math.min(255, b)),
            a: clamp01(a)
        };
    }

    return null;
}

function formatColorComponents({ r, g, b, a }) {
    const red = Math.round(Math.max(0, Math.min(255, r)));
    const green = Math.round(Math.max(0, Math.min(255, g)));
    const blue = Math.round(Math.max(0, Math.min(255, b)));
    const alpha = a !== undefined ? clamp01(a) : 1;

    if(Math.abs(alpha - 1) < 0.01) {
        const toHex = value => value.toString(16).padStart(2, '0');
        return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
    }

    const formattedAlpha = Math.round(alpha * 100) / 100;
    return `rgba(${red}, ${green}, ${blue}, ${formattedAlpha})`;
}

function blendColorValues(dayValue, nightValue, blend) {
    const dayColor = parseColorString(dayValue);
    const nightColor = parseColorString(nightValue);

    if(dayColor && nightColor) {
        const weightNight = 1 - blend;
        return formatColorComponents({
            r: nightColor.r * weightNight + dayColor.r * blend,
            g: nightColor.g * weightNight + dayColor.g * blend,
            b: nightColor.b * weightNight + dayColor.b * blend,
            a: (nightColor.a ?? 1) * weightNight + (dayColor.a ?? 1) * blend
        });
    }

    if(dayColor) {
        return formatColorComponents(dayColor);
    }

    if(nightColor) {
        return formatColorComponents(nightColor);
    }

    if(dayValue === undefined) return nightValue;
    if(nightValue === undefined) return dayValue;

    return blend >= 0.5 ? dayValue : nightValue;
}

function blendPalettes(dayPalette, nightPalette, blend) {
    const result = {};
    const keys = new Set([
        ...Object.keys(nightPalette || {}),
        ...Object.keys(dayPalette || {})
    ]);

    keys.forEach(key => {
        const dayValue = dayPalette ? dayPalette[key] : undefined;
        const nightValue = nightPalette ? nightPalette[key] : undefined;

        if(typeof dayValue === 'string' && typeof nightValue === 'string') {
            result[key] = blendColorValues(dayValue, nightValue, blend);
            return;
        }

        if(typeof dayValue === 'number' && typeof nightValue === 'number') {
            result[key] = nightValue + (dayValue - nightValue) * blend;
            return;
        }

        result[key] = blend >= 0.5
            ? (dayValue !== undefined ? dayValue : nightValue)
            : (nightValue !== undefined ? nightValue : dayValue);
    });

    return result;
}

function getCurrentPalette(timeState = game.timeState || computeDayNightState()) {
    const themeName = stageThemeByStage[game.stage] || 'forest';
    const theme = stageThemes[themeName] || stageThemes.forest;
    const dayPalette = (theme.day || stageThemes.forest.day);
    const nightPalette = theme.night || stageThemes.forest.night || dayPalette;
    const blend = timeState ? timeState.blend : (game.isDay ? 1 : 0);
    const base = blendPalettes(dayPalette, nightPalette, blend);

    return { ...base, themeName, blend };
}

function initCloudLayers(options = {}) {
    const { timeState = game.timeState || computeDayNightState(), palette = getCurrentPalette(timeState), preserveBlobs = false } = options;
    const baseConfigs = [];

    const isBright = timeState.blend >= 0.5;
    const minCount = isBright ? 4 : 5;
    const maxCount = isBright ? 7 : 8;
    const primaryColor = palette.cloudLight || '#ffffff';
    const secondaryColor = palette.cloudDark || '#b0c4de';

    const layerPresets = {
        puffy: [
            { count: minCount, speed: 0.15, yRange: [40, 120], variance: 0.8 },
            { count: maxCount, speed: 0.35, yRange: [110, 190], variance: 1.1 }
        ],
        layered: [
            { count: minCount + 1, speed: 0.1, yRange: [60, 140], variance: 0.6 },
            { count: maxCount - 1, speed: 0.25, yRange: [140, 210], variance: 0.9 }
        ],
        ridges: [
            { count: maxCount, speed: 0.2, yRange: [70, 150], variance: 0.5 },
            { count: maxCount + 1, speed: 0.4, yRange: [150, 210], variance: 0.7 }
        ],
        plume: [
            { count: maxCount, speed: 0.22, yRange: [70, 150], variance: 1.2 },
            { count: maxCount + 1, speed: 0.4, yRange: [150, 210], variance: 1.4 }
        ],
        plumeNight: [
            { count: maxCount + 2, speed: 0.25, yRange: [60, 140], variance: 1.4 },
            { count: maxCount + 1, speed: 0.45, yRange: [140, 200], variance: 1.6 }
        ],
        aurora: [
            { count: maxCount + 1, speed: 0.08, yRange: [40, 120], variance: 0.5 },
            { count: maxCount + 2, speed: 0.18, yRange: [120, 180], variance: 0.7 }
        ],
        shard: [
            { count: maxCount, speed: 0.18, yRange: [60, 150], variance: 0.9 },
            { count: maxCount, speed: 0.32, yRange: [140, 210], variance: 1.3 }
        ],
        storm: [
            { count: maxCount + 2, speed: 0.2, yRange: [50, 120], variance: 0.7 },
            { count: maxCount + 3, speed: 0.38, yRange: [130, 200], variance: 1.0 }
        ],
        smoke: [
            { count: maxCount, speed: 0.3, yRange: [80, 160], variance: 1.2 },
            { count: maxCount + 1, speed: 0.5, yRange: [140, 220], variance: 1.5 }
        ],
        ash: [
            { count: maxCount + 1, speed: 0.28, yRange: [70, 150], variance: 1.2 },
            { count: maxCount + 2, speed: 0.48, yRange: [140, 220], variance: 1.6 }
        ],
        wispy: [
            { count: minCount + 2, speed: 0.12, yRange: [50, 140], variance: 0.6 },
            { count: maxCount + 1, speed: 0.26, yRange: [120, 200], variance: 0.8 }
        ]
    };

    const presetKey = palette.cloudStyle === 'ash' && !isBright ? 'plumeNight' : palette.cloudStyle || 'puffy';
    (layerPresets[presetKey] || layerPresets.puffy).forEach(config => baseConfigs.push(config));

    const previousLayers = preserveBlobs ? game.cloudLayers : null;

    game.cloudLayers = baseConfigs.map((config, index) => {
        const prevLayer = previousLayers && previousLayers[index];
        const newRange = config.yRange;
        const newSpan = Math.max(1, newRange[1] - newRange[0]);

        const blobs = [];
        if(prevLayer && Array.isArray(prevLayer.blobs)) {
            // Zachovat všechny existující mraky
            prevLayer.blobs.forEach(prevBlob => {
                const bw = prevBlob.baseWidth || prevBlob.width;
                const bh = prevBlob.baseHeight || prevBlob.height;
                blobs.push({
                    x: prevBlob.x,
                    y: Math.max(newRange[0], Math.min(newRange[1], prevBlob.y)),
                    width: bw,
                    height: bh,
                    wobble: prevBlob.wobble,
                    offset: prevBlob.offset,
                    verticalSpeed: prevBlob.verticalSpeed || (Math.random() - 0.5) * 0.05,
                    sizeSpeed: prevBlob.sizeSpeed || (Math.random() - 0.5) * 0.02,
                    baseWidth: bw,
                    baseHeight: bh,
                    sizePhase: prevBlob.sizePhase || Math.random() * Math.PI * 2
                });
            });
        } else {
            for(let i = 0; i < config.count; i++) {
                const w = 40 + Math.random() * 60;
                const h = 14 + Math.random() * 8;
                blobs.push({
                    x: (canvas.width / config.count) * i + Math.random() * (canvas.width / config.count) - 60,
                    y: newRange[0] + Math.random() * newSpan,
                    width: w,
                    height: h,
                    wobble: Math.random() * Math.PI * 2,
                    offset: Math.random() * 30,
                    verticalSpeed: (Math.random() - 0.5) * 0.05,
                    sizeSpeed: (Math.random() - 0.5) * 0.02,
                    baseWidth: w,
                    baseHeight: h,
                    sizePhase: Math.random() * Math.PI * 2
                });
            }
        }

        return {
            speed: config.speed,
            variance: config.variance,
            yRange: [newRange[0], newRange[1]],
            primaryColor,
            secondaryColor,
            blobs
        };
    });
}

function spawnNewClouds() {
    const now = Date.now();
    const timeSinceLastSpawn = now - game.lastCloudSpawnTime;

    // Spawn nový mrak náhodně každých 3-8 sekund
    if(timeSinceLastSpawn > 3000 + Math.random() * 5000) {
        game.lastCloudSpawnTime = now;

        // Náhodně vybrat vrstvu pro spawn
        if(game.cloudLayers.length > 0) {
            const layerIndex = Math.floor(Math.random() * game.cloudLayers.length);
            const layer = game.cloudLayers[layerIndex];
            const yRange = layer.yRange;
            const ySpan = yRange[1] - yRange[0];

            const w = 40 + Math.random() * 60;
            const h = 14 + Math.random() * 8;

            layer.blobs.push({
                x: -100 - Math.random() * 50,
                y: yRange[0] + Math.random() * ySpan,
                width: w,
                height: h,
                wobble: Math.random() * Math.PI * 2,
                offset: Math.random() * 30,
                verticalSpeed: (Math.random() - 0.5) * 0.05,
                sizeSpeed: (Math.random() - 0.5) * 0.02,
                baseWidth: w,
                baseHeight: h,
                sizePhase: Math.random() * Math.PI * 2
            });
        }
    }
}

function initAmbientParticles(options = {}) {
    const { timeState = game.timeState || computeDayNightState(), palette = getCurrentPalette(timeState) } = options;
    game.pollenMotes = [];
    game.fireflies = [];

    if(timeState.blend >= 0.5) {
        const particleColor = palette.pollenColor || '#ffe0a3';
        for(let i = 0; i < 35; i++) {
            game.pollenMotes.push({
                x: Math.random() * canvas.width,
                y: 200 + Math.random() * 160,
                size: 2 + Math.random() * 2,
                sway: Math.random() * Math.PI * 2,
                speed: 0.3 + Math.random() * 0.2,
                color: particleColor
            });
        }
    } else {
        const fireflyColor = palette.fireflyColor || '#aef7ff';
        for(let i = 0; i < 45; i++) {
            game.fireflies.push({
                x: Math.random() * canvas.width,
                y: 230 + Math.random() * 120,
                phase: Math.random() * Math.PI * 2,
                radius: 1 + Math.random() * 2,
                color: fireflyColor,
                drift: (Math.random() * 0.5 + 0.2) * (Math.random() > 0.5 ? 1 : -1)
            });
        }
    }
}

function refreshEnvironment(timeState = game.timeState || computeDayNightState(), options = {}) {
    const { regenerateClouds = false } = options;
    game.timeState = timeState;
    game.isDay = timeState.blend >= 0.5;

    const palette = getCurrentPalette(timeState);
    initCloudLayers({ timeState, palette, preserveBlobs: !regenerateClouds && game.cloudLayers.length > 0 });
    initAmbientParticles({ timeState, palette });
}

function drawCloudBlob(style, primary, secondary, x, y, width, height, wobble, variance) {
    const step = Math.max(3, Math.floor(width / 18));
    const pixelWidth = Math.max(6, Math.floor(width / step));
    const baseY = Math.floor(y);
    const baseX = Math.floor(x);
    const h = Math.floor(height);

    ctx.fillStyle = primary;
    ctx.fillRect(baseX, baseY, Math.floor(width), h);

    for(let i = 0; i < step; i++) {
        const localHeight = Math.max(6, Math.floor(h * (0.55 + Math.sin(wobble + i) * 0.15 * variance)));
        const offsetX = baseX + i * pixelWidth - 4;
        const topY = baseY - Math.floor(localHeight * 0.4);
        ctx.fillRect(offsetX, topY, pixelWidth + 8, localHeight);
    }

    ctx.fillStyle = secondary;
    ctx.fillRect(baseX + 4, baseY + h - 6, Math.floor(width) - 8, 6);

    if(style === 'aurora') {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = secondary;
        for(let i = 0; i < step; i++) {
            const barHeight = Math.floor(h * (0.6 + Math.sin(wobble * 1.6 + i) * 0.25));
            ctx.fillRect(baseX + i * pixelWidth, baseY - barHeight, pixelWidth - 2, barHeight);
        }
        ctx.globalAlpha = 1;
    } else if(style === 'shard') {
        ctx.fillStyle = secondary;
        for(let i = 0; i < step; i++) {
            const shardHeight = Math.floor(h * (0.5 + Math.sin(wobble + i * 0.5) * 0.2));
            ctx.fillRect(baseX + i * pixelWidth, baseY - shardHeight, pixelWidth - 3, shardHeight);
        }
    } else if(style === 'storm') {
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#ffffff';
        for(let i = 0; i < step; i += 2) {
            const boltHeight = Math.floor(h * (0.8 + Math.sin(wobble + i) * 0.2));
            ctx.fillRect(baseX + i * pixelWidth + 2, baseY - boltHeight, 2, boltHeight);
        }
        ctx.globalAlpha = 1;
    } else if(style === 'smoke' || style === 'ash' || style === 'plume') {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = secondary;
        for(let i = 0; i < step; i++) {
            const plumeHeight = Math.floor(h * (0.7 + Math.sin(wobble * 1.5 + i * 0.7) * 0.25));
            ctx.fillRect(baseX + i * pixelWidth + 2, baseY - plumeHeight, pixelWidth - 3, plumeHeight);
        }
        ctx.globalAlpha = 1;
    }
}

function drawCloudLayersOnCanvas(palette) {
    const style = palette.cloudStyle || 'puffy';

    // Spawn nové mraky
    spawnNewClouds();

    game.cloudLayers.forEach(layer => {
        layer.primaryColor = palette.cloudLight || layer.primaryColor;
        layer.secondaryColor = palette.cloudDark || layer.secondaryColor;

        // Update a vykreslení mraků
        layer.blobs.forEach(blob => {
            // Horizontální pohyb
            blob.x += layer.speed;
            blob.wobble += 0.01 * layer.variance;

            // Vertikální pohyb
            blob.y += blob.verticalSpeed;

            // Kontrola, zda mrak nezešel mimo yRange
            const [minY, maxY] = layer.yRange;
            if(blob.y < minY || blob.y > maxY) {
                blob.verticalSpeed *= -1; // Otočit směr
                blob.y = Math.max(minY, Math.min(maxY, blob.y));
            }

            // Změna velikosti
            blob.sizePhase += blob.sizeSpeed;
            const sizeModifier = 1 + Math.sin(blob.sizePhase) * 0.15;
            blob.width = blob.baseWidth * sizeModifier;
            blob.height = blob.baseHeight * sizeModifier;

            const wobbleY = Math.sin(blob.wobble) * 6 * layer.variance;
            drawCloudBlob(style, layer.primaryColor, layer.secondaryColor, blob.x, blob.y + wobbleY, blob.width, blob.height, blob.wobble, layer.variance);
        });

        // Odstranit mraky, které opustily obrazovku vpravo
        layer.blobs = layer.blobs.filter(blob => blob.x <= canvas.width + 80);
    });
    ctx.globalAlpha = 1;
}

function drawAmbientParticles() {
    const timeState = game.timeState || computeDayNightState();
    const dayStrength = Math.min(1, Math.max(0, timeState.dayStrength));
    const nightStrength = Math.min(1, Math.max(0, timeState.nightStrength));

    if(game.pollenMotes.length && dayStrength > 0) {
        game.pollenMotes.forEach(mote => {
            if(!game.isGameOver) {
                mote.x += mote.speed;
                mote.sway += 0.015;
                if(mote.x > canvas.width + 20) {
                    mote.x = -20;
                    mote.y = 220 + Math.random() * 140;
                }
            }

            const swayY = Math.sin(mote.sway) * 8;
            const alpha = 0.2 + (Math.sin(mote.sway * 2) * 0.15 + 0.15);
            ctx.globalAlpha = alpha * dayStrength;
            ctx.fillStyle = mote.color;
            ctx.fillRect(Math.floor(mote.x), Math.floor(mote.y + swayY), mote.size, mote.size);
        });
    }

    if(game.fireflies.length && nightStrength > 0) {
        game.fireflies.forEach(firefly => {
            if(!game.isGameOver) {
                firefly.phase += 0.08;
                firefly.x += firefly.drift;
                if(firefly.x < -10) firefly.x = canvas.width + 10;
                if(firefly.x > canvas.width + 10) firefly.x = -10;
            }

            const glow = (Math.sin(firefly.phase) + 1) / 2;
            const bob = Math.sin(firefly.phase * 0.6) * 6;
            const primaryAlpha = (0.3 + glow * 0.6) * nightStrength;
            const trailAlpha = (0.2 + glow * 0.3) * nightStrength;
            const size = Math.ceil(firefly.radius + glow * 2);

            if(primaryAlpha > 0) {
                ctx.globalAlpha = primaryAlpha;
                ctx.fillStyle = firefly.color;
                ctx.fillRect(Math.floor(firefly.x), Math.floor(firefly.y + bob), size, size);
            }

            if(trailAlpha > 0) {
                ctx.globalAlpha = trailAlpha;
                ctx.fillRect(Math.floor(firefly.x - 1), Math.floor(firefly.y + bob - 1), size + 2, size + 2);
            }
        });
    }
    ctx.globalAlpha = 1;
}

const parallaxDesigns = {
    mountain: {
        mountainSpacing: 220,
        midgroundSpacing: 120,
        foregroundSpacing: 90,
        drawMountains(baseX, palette, now) {
            ctx.fillStyle = palette.mountains;
            ctx.beginPath();
            ctx.moveTo(baseX - 20, 300);
            ctx.lineTo(baseX + 30, 210);
            ctx.lineTo(baseX + 80, 180);
            ctx.lineTo(baseX + 140, 210);
            ctx.lineTo(baseX + 190, 190);
            ctx.lineTo(baseX + 240, 300);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = palette.mountainHighlight;
            ctx.beginPath();
            ctx.moveTo(baseX + 50, 230);
            ctx.lineTo(baseX + 80, 180);
            ctx.lineTo(baseX + 105, 215);
            ctx.lineTo(baseX + 100, 300);
            ctx.lineTo(baseX + 60, 300);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = palette.mountainShadow;
            ctx.beginPath();
            ctx.moveTo(baseX + 135, 230);
            ctx.lineTo(baseX + 190, 190);
            ctx.lineTo(baseX + 220, 260);
            ctx.lineTo(baseX + 170, 300);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = palette.mountainHighlight;
            ctx.fillRect(baseX + 10, 240, 16, 70);
            ctx.fillRect(baseX + 150, 248, 14, 62);
            ctx.fillStyle = palette.mountainShadow;
            ctx.fillRect(baseX + 22, 240, 6, 70);
            ctx.fillRect(baseX + 160, 248, 5, 62);
        },
        drawMidground(baseX, palette, now) {
            ctx.fillStyle = palette.trees;
            ctx.fillRect(baseX + 30, 282, 18, 58);
            ctx.fillRect(baseX + 70, 268, 22, 72);
            ctx.fillRect(baseX + 110, 278, 16, 62);

            ctx.fillStyle = palette.treeShadow;
            ctx.fillRect(baseX + 40, 282, 6, 58);
            ctx.fillRect(baseX + 82, 268, 6, 72);
            ctx.fillRect(baseX + 120, 278, 5, 62);

            ctx.fillStyle = palette.mountainHighlight;
            ctx.fillRect(baseX + 28, 260, 80, 12);
        },
        drawForeground(baseX, palette, now) {
            ctx.fillStyle = palette.groundHighlight || palette.bushes;
            ctx.fillRect(baseX + 6, 330, 46, 12);
            ctx.fillRect(baseX + 16, 322, 26, 10);

            ctx.fillStyle = palette.bushShadow;
            ctx.fillRect(baseX + 20, 330, 18, 12);

            ctx.fillStyle = palette.mountainHighlight;
            ctx.fillRect(baseX + 40, 316, 6, 16);
        }
    },
    volcano: {
        mountainSpacing: 230,
        midgroundSpacing: 140,
        foregroundSpacing: 90,
        drawMountains(baseX, palette, now) {
            const lavaPulse = Math.sin(now / 350 + baseX * 0.01) * 0.35 + 0.65;

            ctx.fillStyle = palette.mountains;
            ctx.beginPath();
            ctx.moveTo(baseX - 30, 300);
            ctx.lineTo(baseX + 20, 220);
            ctx.lineTo(baseX + 60, 180);
            ctx.lineTo(baseX + 90, 210);
            ctx.lineTo(baseX + 120, 190);
            ctx.lineTo(baseX + 170, 240);
            ctx.lineTo(baseX + 210, 300);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = palette.mountainShadow;
            ctx.beginPath();
            ctx.moveTo(baseX + 110, 210);
            ctx.lineTo(baseX + 170, 240);
            ctx.lineTo(baseX + 200, 300);
            ctx.lineTo(baseX + 130, 300);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = palette.mountainHighlight;
            ctx.beginPath();
            ctx.moveTo(baseX + 40, 230);
            ctx.lineTo(baseX + 60, 180);
            ctx.lineTo(baseX + 85, 210);
            ctx.lineTo(baseX + 70, 300);
            ctx.closePath();
            ctx.fill();

            ctx.globalAlpha = 0.6 * lavaPulse;
            ctx.fillStyle = '#ff7a36';
            ctx.fillRect(baseX + 70, 210, 44, 16);
            ctx.fillRect(baseX + 82, 196, 20, 12);
            ctx.globalAlpha = 1;
        },
        drawMidground(baseX, palette, now) {
            const glow = Math.sin(now / 280 + baseX * 0.03) * 0.3 + 0.7;
            ctx.fillStyle = palette.trees;
            ctx.fillRect(baseX + 40, 268, 28, 82);
            ctx.fillRect(baseX + 32, 256, 36, 18);

            ctx.fillStyle = palette.mountainHighlight;
            ctx.fillRect(baseX + 46, 262, 10, 30);

            ctx.globalAlpha = glow;
            ctx.fillStyle = '#ff9f43';
            ctx.fillRect(baseX + 50, 286, 10, 40);
            ctx.fillRect(baseX + 38, 296, 6, 24);
            ctx.globalAlpha = 1;
        },
        drawForeground(baseX, palette, now) {
            const glow = Math.sin(now / 220 + baseX * 0.02) * 0.25 + 0.75;
            ctx.fillStyle = palette.bushes;
            ctx.fillRect(baseX + 12, 328, 36, 16);
            ctx.fillRect(baseX + 18, 316, 24, 12);

            ctx.globalAlpha = glow;
            ctx.fillStyle = '#ffb347';
            ctx.fillRect(baseX + 20, 324, 20, 6);
            ctx.fillRect(baseX + 30, 332, 12, 4);
            ctx.globalAlpha = 1;
        }
    },
    tundra: {
        mountainSpacing: 210,
        midgroundSpacing: 110,
        foregroundSpacing: 90,
        drawMountains(baseX, palette, now) {
            ctx.fillStyle = palette.mountains;
            ctx.beginPath();
            ctx.moveTo(baseX - 10, 300);
            ctx.lineTo(baseX + 50, 190);
            ctx.lineTo(baseX + 90, 200);
            ctx.lineTo(baseX + 130, 150);
            ctx.lineTo(baseX + 190, 300);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = palette.mountainHighlight;
            ctx.beginPath();
            ctx.moveTo(baseX + 40, 210);
            ctx.lineTo(baseX + 90, 200);
            ctx.lineTo(baseX + 100, 188);
            ctx.lineTo(baseX + 70, 170);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = palette.mountainShadow;
            ctx.beginPath();
            ctx.moveTo(baseX + 120, 190);
            ctx.lineTo(baseX + 150, 210);
            ctx.lineTo(baseX + 180, 300);
            ctx.lineTo(baseX + 130, 300);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = palette.mountainHighlight;
            ctx.fillRect(baseX + 118, 200, 12, 36);
            ctx.fillRect(baseX + 132, 190, 10, 24);
        },
        drawMidground(baseX, palette, now) {
            ctx.fillStyle = palette.trees;
            ctx.fillRect(baseX + 32, 272, 16, 70);
            ctx.fillRect(baseX + 54, 260, 18, 64);
            ctx.fillRect(baseX + 80, 268, 14, 60);

            ctx.fillStyle = palette.treeShadow;
            ctx.fillRect(baseX + 40, 276, 6, 66);
            ctx.fillRect(baseX + 60, 264, 5, 60);

            ctx.fillStyle = palette.mountainHighlight;
            ctx.globalAlpha = 0.7;
            ctx.fillRect(baseX + 28, 250, 70, 10);
            ctx.globalAlpha = 1;
        },
        drawForeground(baseX, palette, now) {
            ctx.fillStyle = palette.bushes;
            ctx.fillRect(baseX + 10, 324, 36, 18);
            ctx.fillRect(baseX + 4, 334, 46, 12);

            ctx.fillStyle = palette.bushShadow;
            ctx.fillRect(baseX + 18, 330, 18, 12);

            ctx.fillStyle = palette.grassHighlight || '#ffffff';
            ctx.globalAlpha = 0.6;
            ctx.fillRect(baseX + 30, 320, 12, 6);
            ctx.globalAlpha = 1;
        }
    },
    shadow: {
        mountainSpacing: 240,
        midgroundSpacing: 120,
        foregroundSpacing: 90,
        drawMountains(baseX, palette, now) {
            ctx.fillStyle = palette.mountains;
            ctx.beginPath();
            ctx.moveTo(baseX, 300);
            ctx.lineTo(baseX + 40, 190);
            ctx.lineTo(baseX + 70, 210);
            ctx.lineTo(baseX + 110, 170);
            ctx.lineTo(baseX + 150, 220);
            ctx.lineTo(baseX + 190, 160);
            ctx.lineTo(baseX + 230, 300);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = palette.mountainHighlight;
            ctx.beginPath();
            ctx.moveTo(baseX + 70, 210);
            ctx.lineTo(baseX + 110, 170);
            ctx.lineTo(baseX + 126, 210);
            ctx.lineTo(baseX + 106, 300);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = palette.mountainShadow;
            ctx.beginPath();
            ctx.moveTo(baseX + 150, 220);
            ctx.lineTo(baseX + 190, 160);
            ctx.lineTo(baseX + 210, 230);
            ctx.lineTo(baseX + 176, 300);
            ctx.closePath();
            ctx.fill();

            const wisp = (Math.sin(now / 260 + baseX * 0.015) + 1) / 2;
            ctx.globalAlpha = 0.4 + wisp * 0.4;
            ctx.fillStyle = '#caa6ff';
            ctx.fillRect(baseX + 80, 210, 12, 60);
            ctx.fillRect(baseX + 150, 200, 10, 70);
            ctx.globalAlpha = 1;
        },
        drawMidground(baseX, palette, now) {
            ctx.fillStyle = palette.trees;
            ctx.fillRect(baseX + 34, 276, 18, 68);
            ctx.fillRect(baseX + 68, 262, 22, 70);

            ctx.fillStyle = palette.treeShadow;
            ctx.fillRect(baseX + 42, 276, 8, 68);
            ctx.fillRect(baseX + 78, 262, 8, 70);

            const pulse = (Math.sin(now / 320 + baseX * 0.02) + 1) / 2;
            ctx.globalAlpha = 0.35 + pulse * 0.35;
            ctx.fillStyle = '#b98aff';
            ctx.fillRect(baseX + 50, 246, 12, 26);
            ctx.fillRect(baseX + 88, 236, 10, 24);
            ctx.globalAlpha = 1;
        },
        drawForeground(baseX, palette, now) {
            const shimmer = (Math.sin(now / 400 + baseX * 0.03) + 1) / 2;
            ctx.fillStyle = palette.bushes;
            ctx.fillRect(baseX + 8, 324, 34, 18);
            ctx.fillRect(baseX + 2, 334, 44, 14);

            ctx.fillStyle = palette.bushShadow;
            ctx.fillRect(baseX + 16, 332, 18, 12);

            ctx.globalAlpha = 0.4 + shimmer * 0.4;
            ctx.fillStyle = '#d9a6ff';
            ctx.fillRect(baseX + 26, 318, 8, 10);
            ctx.globalAlpha = 1;
        }
    },
    crystal: {
        mountainSpacing: 220,
        midgroundSpacing: 110,
        foregroundSpacing: 80,
        drawMountains(baseX, palette, now) {
            ctx.fillStyle = palette.mountains;
            ctx.fillRect(baseX + 20, 220, 24, 80);
            ctx.fillRect(baseX + 64, 200, 28, 100);
            ctx.fillRect(baseX + 112, 210, 24, 90);

            ctx.fillStyle = palette.mountainHighlight;
            ctx.fillRect(baseX + 68, 200, 12, 100);
            ctx.fillRect(baseX + 120, 210, 8, 90);

            ctx.fillStyle = palette.mountainShadow;
            ctx.fillRect(baseX + 44, 230, 10, 70);
            ctx.fillRect(baseX + 104, 220, 10, 80);

            ctx.fillStyle = palette.mountainHighlight;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(baseX + 90, 190, 14, 110);
            ctx.globalAlpha = 1;
        },
        drawMidground(baseX, palette, now) {
            const shimmer = (Math.sin(now / 300 + baseX * 0.025) + 1) / 2;
            ctx.fillStyle = palette.trees;
            ctx.fillRect(baseX + 24, 284, 18, 58);
            ctx.fillRect(baseX + 52, 270, 16, 70);
            ctx.fillRect(baseX + 80, 280, 14, 62);

            ctx.fillStyle = palette.treeShadow;
            ctx.fillRect(baseX + 30, 284, 6, 58);
            ctx.fillRect(baseX + 58, 270, 6, 70);

            ctx.globalAlpha = 0.35 + shimmer * 0.45;
            ctx.fillStyle = '#8bf4ff';
            ctx.fillRect(baseX + 38, 260, 10, 40);
            ctx.fillRect(baseX + 70, 254, 8, 32);
            ctx.globalAlpha = 1;
        },
        drawForeground(baseX, palette, now) {
            const glint = (Math.sin(now / 260 + baseX * 0.03) + 1) / 2;
            ctx.fillStyle = palette.bushes;
            ctx.fillRect(baseX + 6, 324, 30, 20);
            ctx.fillRect(baseX + 16, 316, 20, 12);

            ctx.fillStyle = palette.bushShadow;
            ctx.fillRect(baseX + 18, 328, 12, 14);

            ctx.globalAlpha = 0.4 + glint * 0.5;
            ctx.fillStyle = '#aef7ff';
            ctx.fillRect(baseX + 28, 318, 8, 12);
            ctx.globalAlpha = 1;
        }
    },
    storm: {
        mountainSpacing: 230,
        midgroundSpacing: 120,
        foregroundSpacing: 90,
        drawMountains(baseX, palette, now) {
            ctx.fillStyle = palette.mountains;
            ctx.beginPath();
            ctx.moveTo(baseX - 10, 300);
            ctx.lineTo(baseX + 40, 210);
            ctx.lineTo(baseX + 80, 230);
            ctx.lineTo(baseX + 120, 180);
            ctx.lineTo(baseX + 160, 230);
            ctx.lineTo(baseX + 210, 190);
            ctx.lineTo(baseX + 250, 300);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = palette.mountainHighlight;
            ctx.beginPath();
            ctx.moveTo(baseX + 80, 230);
            ctx.lineTo(baseX + 120, 180);
            ctx.lineTo(baseX + 140, 220);
            ctx.lineTo(baseX + 110, 300);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = palette.mountainShadow;
            ctx.beginPath();
            ctx.moveTo(baseX + 160, 230);
            ctx.lineTo(baseX + 210, 190);
            ctx.lineTo(baseX + 230, 250);
            ctx.lineTo(baseX + 180, 300);
            ctx.closePath();
            ctx.fill();

            const swirl = Math.sin(now / 200 + baseX * 0.015) * 10;
            ctx.strokeStyle = palette.cloudLight || '#ffffff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(baseX + 40, 220 + swirl * 0.1);
            ctx.bezierCurveTo(baseX + 80, 200 + swirl, baseX + 140, 210 - swirl, baseX + 190, 200);
            ctx.stroke();
            ctx.lineWidth = 1;
        },
        drawMidground(baseX, palette, now) {
            ctx.fillStyle = palette.trees;
            ctx.fillRect(baseX + 36, 274, 18, 70);
            ctx.fillRect(baseX + 70, 262, 20, 72);

            ctx.fillStyle = palette.treeShadow;
            ctx.fillRect(baseX + 44, 274, 8, 70);
            ctx.fillRect(baseX + 78, 262, 6, 72);

            const flash = Math.max(0, Math.sin(now / 180 + baseX * 0.05));
            ctx.globalAlpha = 0.3 + flash * 0.6;
            ctx.fillStyle = '#c5daff';
            ctx.fillRect(baseX + 54, 240, 6, 34);
            ctx.fillRect(baseX + 92, 236, 6, 30);
            ctx.globalAlpha = 1;
        },
        drawForeground(baseX, palette, now) {
            ctx.fillStyle = palette.bushes;
            ctx.fillRect(baseX + 10, 324, 36, 18);
            ctx.fillRect(baseX + 0, 334, 48, 12);

            ctx.fillStyle = palette.bushShadow;
            ctx.fillRect(baseX + 18, 330, 16, 12);

            const spark = Math.max(0, Math.sin(now / 120 + baseX * 0.04));
            ctx.globalAlpha = 0.4 + spark * 0.5;
            ctx.fillStyle = '#9fc9ff';
            ctx.fillRect(baseX + 28, 320, 8, 10);
            ctx.globalAlpha = 1;
        }
    },
    molten: {
        mountainSpacing: 230,
        midgroundSpacing: 140,
        foregroundSpacing: 90,
        drawMountains(baseX, palette, now) {
            const surge = Math.sin(now / 240 + baseX * 0.02) * 0.3 + 0.7;
            ctx.fillStyle = palette.mountains;
            ctx.beginPath();
            ctx.moveTo(baseX - 20, 300);
            ctx.lineTo(baseX + 20, 230);
            ctx.lineTo(baseX + 60, 200);
            ctx.lineTo(baseX + 90, 230);
            ctx.lineTo(baseX + 130, 210);
            ctx.lineTo(baseX + 170, 260);
            ctx.lineTo(baseX + 210, 300);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = palette.mountainShadow;
            ctx.beginPath();
            ctx.moveTo(baseX + 120, 220);
            ctx.lineTo(baseX + 170, 260);
            ctx.lineTo(baseX + 200, 300);
            ctx.lineTo(baseX + 140, 300);
            ctx.closePath();
            ctx.fill();

            ctx.globalAlpha = surge * 0.6;
            ctx.fillStyle = '#ff7a3c';
            ctx.fillRect(baseX + 70, 230, 36, 20);
            ctx.fillRect(baseX + 90, 220, 12, 12);
            ctx.globalAlpha = 1;
        },
        drawMidground(baseX, palette, now) {
            const glow = Math.sin(now / 220 + baseX * 0.03) * 0.3 + 0.7;
            ctx.fillStyle = palette.trees;
            ctx.fillRect(baseX + 34, 278, 26, 70);
            ctx.fillRect(baseX + 30, 268, 34, 16);

            ctx.fillStyle = palette.mountainHighlight;
            ctx.fillRect(baseX + 44, 272, 12, 28);

            ctx.globalAlpha = glow;
            ctx.fillStyle = '#ff9f43';
            ctx.fillRect(baseX + 48, 292, 10, 34);
            ctx.fillRect(baseX + 36, 302, 8, 20);
            ctx.globalAlpha = 1;
        },
        drawForeground(baseX, palette, now) {
            const flicker = Math.sin(now / 180 + baseX * 0.04) * 0.25 + 0.75;
            ctx.fillStyle = palette.bushes;
            ctx.fillRect(baseX + 14, 328, 36, 16);
            ctx.fillRect(baseX + 22, 318, 20, 12);

            ctx.globalAlpha = flicker;
            ctx.fillStyle = '#ffb347';
            ctx.fillRect(baseX + 26, 324, 16, 6);
            ctx.fillRect(baseX + 34, 332, 12, 4);
            ctx.globalAlpha = 1;
        }
    },
    necropolis: {
        mountainSpacing: 240,
        midgroundSpacing: 130,
        foregroundSpacing: 90,
        drawMountains(baseX, palette, now) {
            ctx.fillStyle = palette.mountains;
            ctx.beginPath();
            ctx.moveTo(baseX - 10, 300);
            ctx.lineTo(baseX + 30, 220);
            ctx.lineTo(baseX + 70, 240);
            ctx.lineTo(baseX + 110, 200);
            ctx.lineTo(baseX + 150, 240);
            ctx.lineTo(baseX + 190, 210);
            ctx.lineTo(baseX + 230, 300);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = palette.mountainShadow;
            ctx.beginPath();
            ctx.moveTo(baseX + 110, 200);
            ctx.lineTo(baseX + 150, 240);
            ctx.lineTo(baseX + 176, 300);
            ctx.lineTo(baseX + 120, 300);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = palette.mountainHighlight;
            ctx.beginPath();
            ctx.moveTo(baseX + 30, 220);
            ctx.lineTo(baseX + 70, 240);
            ctx.lineTo(baseX + 64, 300);
            ctx.lineTo(baseX + 24, 300);
            ctx.closePath();
            ctx.fill();

            const flicker = Math.sin(now / 320 + baseX * 0.02) * 0.3 + 0.7;
            ctx.globalAlpha = 0.4 + flicker * 0.4;
            ctx.fillStyle = '#9fffe2';
            ctx.fillRect(baseX + 98, 216, 12, 42);
            ctx.fillRect(baseX + 146, 226, 10, 34);
            ctx.globalAlpha = 1;
        },
        drawMidground(baseX, palette, now) {
            ctx.fillStyle = palette.trees;
            ctx.fillRect(baseX + 32, 282, 22, 62);
            ctx.fillRect(baseX + 70, 270, 20, 64);

            ctx.fillStyle = palette.treeShadow;
            ctx.fillRect(baseX + 40, 282, 10, 62);
            ctx.fillRect(baseX + 78, 270, 8, 64);

            ctx.fillStyle = palette.mountainHighlight;
            ctx.fillRect(baseX + 50, 258, 28, 14);
        },
        drawForeground(baseX, palette, now) {
            const glow = Math.sin(now / 260 + baseX * 0.03) * 0.25 + 0.75;
            ctx.fillStyle = palette.bushes;
            ctx.fillRect(baseX + 12, 324, 32, 18);
            ctx.fillRect(baseX + 4, 334, 44, 12);

            ctx.fillStyle = palette.bushShadow;
            ctx.fillRect(baseX + 22, 332, 14, 12);

            ctx.globalAlpha = glow;
            ctx.fillStyle = '#a3fff0';
            ctx.fillRect(baseX + 30, 320, 8, 10);
            ctx.globalAlpha = 1;
        }
    },
    dragon: {
        mountainSpacing: 260,
        midgroundSpacing: 140,
        foregroundSpacing: 90,
        drawMountains(baseX, palette, now) {
            ctx.fillStyle = palette.mountains;
            ctx.beginPath();
            ctx.moveTo(baseX - 20, 300);
            ctx.lineTo(baseX + 20, 210);
            ctx.lineTo(baseX + 70, 240);
            ctx.lineTo(baseX + 110, 170);
            ctx.lineTo(baseX + 150, 240);
            ctx.lineTo(baseX + 200, 200);
            ctx.lineTo(baseX + 240, 300);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = palette.mountainHighlight;
            ctx.beginPath();
            ctx.moveTo(baseX + 70, 240);
            ctx.lineTo(baseX + 110, 170);
            ctx.lineTo(baseX + 130, 220);
            ctx.lineTo(baseX + 96, 300);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = palette.mountainShadow;
            ctx.beginPath();
            ctx.moveTo(baseX + 150, 240);
            ctx.lineTo(baseX + 200, 200);
            ctx.lineTo(baseX + 224, 260);
            ctx.lineTo(baseX + 176, 300);
            ctx.closePath();
            ctx.fill();

            const ember = Math.sin(now / 240 + baseX * 0.025) * 0.3 + 0.7;
            ctx.globalAlpha = ember;
            ctx.fillStyle = '#ff9f6a';
            ctx.fillRect(baseX + 92, 218, 12, 36);
            ctx.fillRect(baseX + 148, 226, 10, 30);
            ctx.globalAlpha = 1;
        },
        drawMidground(baseX, palette, now) {
            ctx.fillStyle = palette.trees;
            ctx.fillRect(baseX + 38, 272, 24, 70);
            ctx.fillRect(baseX + 72, 262, 22, 72);

            ctx.fillStyle = palette.treeShadow;
            ctx.fillRect(baseX + 48, 272, 10, 70);
            ctx.fillRect(baseX + 82, 262, 8, 72);

            const glow = Math.sin(now / 200 + baseX * 0.03) * 0.3 + 0.7;
            ctx.globalAlpha = glow;
            ctx.fillStyle = '#ffb47a';
            ctx.fillRect(baseX + 60, 244, 12, 28);
            ctx.fillRect(baseX + 92, 238, 10, 24);
            ctx.globalAlpha = 1;
        },
        drawForeground(baseX, palette, now) {
            const glow = Math.sin(now / 180 + baseX * 0.04) * 0.25 + 0.75;
            ctx.fillStyle = palette.bushes;
            ctx.fillRect(baseX + 14, 326, 34, 18);
            ctx.fillRect(baseX + 8, 336, 44, 12);

            ctx.fillStyle = palette.bushShadow;
            ctx.fillRect(baseX + 24, 332, 16, 12);

            ctx.globalAlpha = glow;
            ctx.fillStyle = '#ffcb7d';
            ctx.fillRect(baseX + 32, 320, 10, 10);
            ctx.globalAlpha = 1;
        }
    }
};

function drawMountainLayer(themeName, palette, offset) {
    const design = parallaxDesigns[themeName];
    const now = Date.now();

    if(design && typeof design.drawMountains === 'function') {
        const spacing = design.mountainSpacing || 200;
        const padding = Math.max(800, spacing * 4);
        for(let x = -padding; x < canvas.width + padding; x += spacing) {
            const baseX = x - offset;
            design.drawMountains(baseX, palette, now);
        }
        ctx.globalAlpha = 1;
        return;
    }

    const spacing = 200;
    for(let x = -800; x < canvas.width + 800; x += spacing) {
        const baseX = x - offset;
        ctx.fillStyle = palette.mountains;
        ctx.beginPath();
        ctx.moveTo(baseX, 280);
        ctx.lineTo(baseX + 80, 180);
        ctx.lineTo(baseX + 160, 280);
        ctx.fill();

        ctx.fillStyle = palette.mountainHighlight;
        ctx.beginPath();
        ctx.moveTo(baseX + 40, 210);
        ctx.lineTo(baseX + 80, 180);
        ctx.lineTo(baseX + 90, 210);
        ctx.fill();

        ctx.fillStyle = palette.mountainShadow;
        ctx.beginPath();
        ctx.moveTo(baseX + 80, 180);
        ctx.lineTo(baseX + 120, 220);
        ctx.lineTo(baseX + 160, 280);
        ctx.fill();
    }
}

function drawMidgroundLayer(themeName, palette, offset) {
    const design = parallaxDesigns[themeName];
    const now = Date.now();

    if(design && typeof design.drawMidground === 'function') {
        const spacing = design.midgroundSpacing || 100;
        const padding = Math.max(600, spacing * 4);
        for(let x = -padding; x < canvas.width + padding; x += spacing) {
            const baseX = x - offset;
            design.drawMidground(baseX, palette, now);
        }
        ctx.globalAlpha = 1;
        return;
    }

    for(let x = -600; x < canvas.width + 600; x += 100) {
        const baseX = x - offset;
        ctx.fillStyle = palette.trees;
        ctx.fillRect(baseX + 40, 280, 15, 50);
        ctx.beginPath();
        ctx.moveTo(baseX + 30, 280);
        ctx.lineTo(baseX + 47, 250);
        ctx.lineTo(baseX + 65, 280);
        ctx.fill();

        ctx.fillStyle = palette.treeShadow;
        ctx.beginPath();
        ctx.moveTo(baseX + 32, 270);
        ctx.lineTo(baseX + 47, 240);
        ctx.lineTo(baseX + 56, 270);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawForegroundLayer(themeName, palette, offset) {
    const design = parallaxDesigns[themeName];
    const now = Date.now();

    if(design && typeof design.drawForeground === 'function') {
        const spacing = design.foregroundSpacing || 80;
        const padding = Math.max(400, spacing * 4);
        for(let x = -padding; x < canvas.width + padding; x += spacing) {
            const baseX = x - offset;
            design.drawForeground(baseX, palette, now);
        }
        ctx.globalAlpha = 1;
        return;
    }

    for(let x = -400; x < canvas.width + 400; x += 80) {
        const baseX = x - offset;
        ctx.fillStyle = palette.bushes;
        ctx.fillRect(baseX + 10, 320, 30, 20);
        ctx.fillRect(baseX + 5, 330, 40, 15);

        ctx.fillStyle = palette.bushShadow;
        ctx.fillRect(baseX + 18, 332, 12, 12);
    }
    ctx.globalAlpha = 1;
}

function drawForegroundAccents(themeName, palette, offset) {
    const accent = palette.accentType || 'flowers';
    for(let x = -120; x < canvas.width + 120; x += 60) {
        const baseX = x - offset;
        const groundY = 338;

        if(accent === 'flowers') {
            ctx.fillStyle = '#ffb3c1';
            ctx.fillRect(baseX + 10, groundY, 3, 3);
            ctx.fillRect(baseX + 14, groundY + 2, 2, 2);
            ctx.fillStyle = '#ffd166';
            ctx.fillRect(baseX + 18, groundY + 1, 2, 2);
        } else if(accent === 'mushrooms') {
            ctx.fillStyle = '#c77dff';
            ctx.fillRect(baseX + 12, groundY, 6, 3);
            ctx.fillStyle = '#ffe0ff';
            ctx.fillRect(baseX + 14, groundY - 4, 2, 4);
        } else if(accent === 'stone') {
            ctx.fillStyle = '#9099a1';
            ctx.fillRect(baseX + 8, groundY + 3, 10, 6);
            ctx.fillStyle = '#6f7780';
            ctx.fillRect(baseX + 10, groundY + 1, 6, 4);
        } else if(accent === 'runestone') {
            ctx.fillStyle = '#7e8fa1';
            ctx.fillRect(baseX + 8, groundY - 6, 10, 12);
            ctx.fillStyle = '#c5e4ff';
            ctx.fillRect(baseX + 11, groundY - 2, 4, 4);
        } else if(accent === 'smoke' || accent === 'embers' || accent === 'lava') {
            const pulse = Math.sin(Date.now() / 180 + x * 0.1) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#ff9a3c';
            ctx.fillRect(baseX + 14, groundY - 10, 4, 10);
            ctx.fillRect(baseX + 10, groundY - 6, 3, 6);
            ctx.fillStyle = '#ffd166';
            ctx.fillRect(baseX + 14, groundY - 4, 4, 4);
            ctx.globalAlpha = 1;
        } else if(accent === 'ice' || accent === 'aurora') {
            ctx.fillStyle = '#e1f7ff';
            ctx.fillRect(baseX + 12, groundY - 12, 6, 12);
            ctx.fillStyle = '#b0eaff';
            ctx.fillRect(baseX + 10, groundY - 6, 10, 6);
        } else if(accent === 'runes' || accent === 'wisp') {
            ctx.fillStyle = '#d9a6ff';
            ctx.fillRect(baseX + 12, groundY - 8, 4, 8);
            ctx.globalAlpha = 0.6;
            ctx.fillRect(baseX + 11, groundY - 10, 6, 2);
            ctx.globalAlpha = 1;
        } else if(accent === 'crystal') {
            ctx.fillStyle = '#89f0ff';
            ctx.fillRect(baseX + 12, groundY - 14, 4, 14);
            ctx.fillRect(baseX + 18, groundY - 10, 3, 10);
            ctx.fillStyle = '#c1f7ff';
            ctx.fillRect(baseX + 12, groundY - 6, 9, 3);
        } else if(accent === 'thunder' || accent === 'lightning') {
            ctx.fillStyle = '#9fc9ff';
            ctx.fillRect(baseX + 14, groundY - 12, 2, 12);
            ctx.fillRect(baseX + 16, groundY - 8, 2, 8);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(baseX + 12, groundY - 10, 2, 10);
        } else if(accent === 'tomb') {
            ctx.fillStyle = '#b0bab1';
            ctx.fillRect(baseX + 10, groundY - 12, 8, 12);
            ctx.fillStyle = '#dfe6dd';
            ctx.fillRect(baseX + 12, groundY - 8, 4, 4);
        } else if(accent === 'gravefire') {
            const flicker = Math.sin(Date.now() / 200 + x * 0.13) * 0.3 + 0.7;
            ctx.globalAlpha = flicker;
            ctx.fillStyle = '#6fffdc';
            ctx.fillRect(baseX + 12, groundY - 10, 4, 10);
            ctx.fillStyle = '#a3fff0';
            ctx.fillRect(baseX + 11, groundY - 6, 6, 4);
            ctx.globalAlpha = 1;
        } else if(accent === 'scales') {
            ctx.fillStyle = '#ff9f6a';
            ctx.fillRect(baseX + 10, groundY, 4, 4);
            ctx.fillRect(baseX + 16, groundY - 4, 4, 4);
            ctx.fillRect(baseX + 22, groundY, 4, 4);
        }
    }
    ctx.globalAlpha = 1;
}

// Create squeak sound effect using Web Audio API
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioContext = null;
const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
let audioUnlocked = false;
let audioUnlocking = false;
const audioUnlockEvents = ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown'];

function getAudioContext() {
    if(!AudioContextClass) {
        return null;
    }

    if(!audioContext) {
        audioContext = new AudioContextClass();
    }

    return audioContext;
}

function removeAudioUnlockListeners() {
    audioUnlockEvents.forEach(evt => window.removeEventListener(evt, unlockAudioContext));
}

function unlockAudioContext() {
    if(audioUnlocked || audioUnlocking) {
        if(audioUnlocked) {
            removeAudioUnlockListeners();
        }
        return;
    }

    const context = getAudioContext();
    if(!context) {
        audioUnlocked = true;
        removeAudioUnlockListeners();
        return;
    }

    audioUnlocking = true;

    try {
        if(context.state === 'suspended') {
            context.resume().catch(() => {});
        }

        const buffer = context.createBuffer(1, 1, context.sampleRate || 44100);
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);

        if(typeof source.start === 'function') {
            source.start(0);
        } else if(typeof source.noteOn === 'function') {
            source.noteOn(0);
        }

        audioUnlocked = true;
        audioUnlocking = false;
        removeAudioUnlockListeners();
    } catch(err) {
        audioUnlocking = false;
    }
}

audioUnlockEvents.forEach(evt => {
    window.addEventListener(evt, unlockAudioContext, { passive: true });
});

document.addEventListener('visibilitychange', () => {
    if(document.hidden) {
        return;
    }

    if(!audioUnlocked) {
        return;
    }

    const context = getAudioContext();
    if(context && context.state === 'suspended') {
        context.resume().catch(() => {});
    }
});

async function ensureAudioContext() {
    const context = getAudioContext();
    if(!context) {
        return null;
    }

    if(context.state === 'suspended') {
        try {
            await context.resume();
        } catch(err) {
            // Ignore resume errors - the next user interaction should succeed
        }
    }

    return context;
}

async function playSqueak() {
    const context = await ensureAudioContext();
    if(!context) {
        return;
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.setValueAtTime(800, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, context.currentTime + 0.1);

    const baseGain = isMobile ? 0.55 : 0.35;
    gainNode.gain.setValueAtTime(baseGain, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.06, baseGain * 0.18), context.currentTime + 0.18);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.2);
}

async function playShieldImpactSound() {
    const context = await ensureAudioContext();
    if(!context) {
        return;
    }

    const duration = 0.25;
    const bufferSize = Math.floor((context.sampleRate || 44100) * duration);
    const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate || 44100);
    const data = noiseBuffer.getChannelData(0);

    for(let i = 0; i < bufferSize; i++) {
        const decay = 1 - i / bufferSize;
        data[i] = (Math.random() * 2 - 1) * Math.pow(decay, 2);
    }

    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(900, context.currentTime);

    const gainNode = context.createGain();
    const baseGain = isMobile ? 0.5 : 0.35;
    gainNode.gain.setValueAtTime(baseGain, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(context.destination);

    noise.start(context.currentTime);
    noise.stop(context.currentTime + duration);
}

function randomFireballPalette() {
    const hue = Math.floor(Math.random() * 360);
    const accentHue = (hue + 40 + Math.random() * 80) % 360;

    return {
        core: `hsl(${hue}, 100%, 60%)`,
        trail: `hsla(${accentHue}, 100%, 55%, 0.9)`,
        ember: `hsla(${hue}, 100%, 72%, 0.55)`
    };
}

function scheduleNextFireball(now = Date.now()) {
    game.nextFireballTime = now + randInt(FIREBALL_MIN_INTERVAL, FIREBALL_MAX_INTERVAL);
}

function spawnMonsterFireball(originX, originY) {
    const palette = randomFireballPalette();

    game.fireballs.push({
        x: originX,
        y: originY,
        speed: 8 + Math.random() * 3,
        size: 6 + Math.random() * 3,
        palette,
        trail: [],
        createdAt: Date.now(),
        wobbleStrength: 0.15 + Math.random() * 0.15,
        wobblePhase: Math.random() * Math.PI * 2
    });
}

function maybeLaunchMonsterFireball(originX, originY) {
    if(game.isGameOver) {
        return;
    }

    const now = Date.now();

    if(game.nextFireballTime === null) {
        scheduleNextFireball(now);
        return;
    }

    if(now >= game.nextFireballTime) {
        const shotCount = 1 + Math.floor(Math.random() * 3);
        for(let i = 0; i < shotCount; i++) {
            setTimeout(() => {
                spawnMonsterFireball(originX, originY);
            }, i * 100);
        }
        scheduleNextFireball(now);
    }
}

function drawFireball(fireball) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    if(fireball.trail.length > 1) {
        const segmentCount = fireball.trail.length - 1;
        const headWidth = fireball.size * 1.8;
        const tailWidth = 1;
        ctx.lineCap = 'round';
        const widthRatioBase = segmentCount > 1 ? segmentCount - 1 : 1;

        for(let i = 0; i < segmentCount; i++) {
            const start = fireball.trail[i];
            const end = fireball.trail[i + 1];
            const ratio = segmentCount > 1 ? i / widthRatioBase : 1;
            const width = headWidth - (headWidth - tailWidth) * ratio;
            const alpha = clamp01(0.6 - ratio * 0.35);

            if(alpha <= 0) {
                continue;
            }

            const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
            gradient.addColorStop(0.4, fireball.palette.core);
            gradient.addColorStop(1, fireball.palette.trail);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = Math.max(tailWidth, width);
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
    }

    const trailLength = fireball.trail.length;
    const tailSteps = Math.max(1, trailLength - 1);

    for(let i = 0; i < trailLength; i++) {
        const segment = fireball.trail[i];
        if(segment.alpha <= 0) {
            continue;
        }

        const ratio = i / tailSteps;
        const alpha = clamp01(segment.alpha * (0.6 - ratio * 0.2));
        if(alpha <= 0) {
            continue;
        }

        ctx.globalAlpha = alpha;
        const baseRadius = segment.size * 1.9;
        const glowRadius = Math.max(1, baseRadius - (baseRadius - 1) * ratio);
        const gradient = ctx.createRadialGradient(segment.x, segment.y, 0, segment.x, segment.y, glowRadius);
        gradient.addColorStop(0, fireball.palette.core);
        gradient.addColorStop(0.6, fireball.palette.trail);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.globalAlpha = 1;
    const coreGradient = ctx.createRadialGradient(fireball.x, fireball.y, 0, fireball.x, fireball.y, fireball.size * 1.6);
    coreGradient.addColorStop(0, '#ffffff');
    coreGradient.addColorStop(0.4, fireball.palette.core);
    coreGradient.addColorStop(1, fireball.palette.ember);
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(fireball.x, fireball.y, fireball.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = fireball.palette.trail;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(fireball.x, fireball.y, fireball.size * 1.7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

function triggerWitchShield(fireball) {
    playShieldImpactSound();

    const palette = fireball.palette;
    game.witchShield = {
        startTime: Date.now(),
        duration: 650,
        palette,
        ringRotation: Math.random() * Math.PI * 2
    };

    for(let i = 0; i < 18; i++) {
        const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.25;
        const speed = 2 + Math.random() * 3;
        const particleRadius = FIREBALL_SHIELD_RADIUS + Math.random() * 10;
        game.particles.push({
            x: WITCH_SHIELD_CENTER_X + Math.cos(angle) * particleRadius,
            y: WITCH_SHIELD_CENTER_Y + Math.sin(angle) * particleRadius,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.3,
            size: 2 + Math.random() * 3,
            color: [palette.core, palette.trail, '#ffffff'][Math.floor(Math.random() * 3)],
            life: 0.9,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.4
        });
    }
}

function updateFireballs() {
    const targetX = WITCH_SHIELD_CENTER_X;
    const targetY = WITCH_SHIELD_CENTER_Y;

    for(let i = game.fireballs.length - 1; i >= 0; i--) {
        const fireball = game.fireballs[i];

        fireball.wobblePhase += fireball.wobbleStrength;
        const wobbleOffset = Math.sin(fireball.wobblePhase) * fireball.wobbleStrength;

        const dx = targetX - fireball.x;
        const dy = targetY - fireball.y;
        const angle = Math.atan2(dy, dx) + wobbleOffset * 0.4;
        const accel = Math.min(1.5, 0.9 + (Date.now() - fireball.createdAt) / 900);
        const stepX = Math.cos(angle) * fireball.speed * accel;
        const stepY = Math.sin(angle) * fireball.speed * accel;

        fireball.x += stepX;
        fireball.y += stepY;

        fireball.trail.unshift({
            x: fireball.x - stepX * 0.4,
            y: fireball.y - stepY * 0.4,
            alpha: 1,
            size: fireball.size * (0.7 + Math.random() * 0.5)
        });

        if(fireball.trail.length > 22) {
            fireball.trail.pop();
        }

        for(let t = fireball.trail.length - 1; t >= 0; t--) {
            const segment = fireball.trail[t];
            segment.alpha *= 0.8;
            segment.size *= 0.95;
            if(segment.alpha <= 0.05) {
                fireball.trail.splice(t, 1);
            }
        }

        const distance = Math.hypot(targetX - fireball.x, targetY - fireball.y);
        if(distance <= FIREBALL_SHIELD_RADIUS) {
            triggerWitchShield(fireball);
            game.fireballs.splice(i, 1);
            continue;
        }

        if(
            fireball.x < -120 ||
            fireball.x > canvas.width + 120 ||
            fireball.y < -120 ||
            fireball.y > canvas.height + 120
        ) {
            game.fireballs.splice(i, 1);
            continue;
        }

        drawFireball(fireball);
    }
}

function drawWitchShield() {
    const shield = game.witchShield;
    if(!shield) {
        return;
    }

    const now = Date.now();
    const elapsed = now - shield.startTime;
    const progress = elapsed / shield.duration;

    if(progress >= 1) {
        game.witchShield = null;
        return;
    }

    const fade = 1 - Math.pow(progress, 1.3);
    const oscillation = Math.sin(progress * Math.PI);
    const baseRadius = FIREBALL_SHIELD_RADIUS + 6;
    const currentRadius = baseRadius + oscillation * 20;

    ctx.save();
    ctx.translate(WITCH_SHIELD_CENTER_X, WITCH_SHIELD_CENTER_Y);
    ctx.globalCompositeOperation = 'lighter';

    const auraGradient = ctx.createRadialGradient(0, 0, baseRadius * 0.4, 0, 0, currentRadius + 30);
    auraGradient.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    auraGradient.addColorStop(0.5, shield.palette.core);
    auraGradient.addColorStop(0.8, shield.palette.trail);
    auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.globalAlpha = 0.55 * fade;
    ctx.fillStyle = auraGradient;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius + 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.9 * fade;
    const ringGradient = ctx.createLinearGradient(-currentRadius, 0, currentRadius, 0);
    ringGradient.addColorStop(0, shield.palette.trail);
    ringGradient.addColorStop(0.5, '#ffffff');
    ringGradient.addColorStop(1, shield.palette.core);
    ctx.strokeStyle = ringGradient;
    ctx.lineWidth = 4 + oscillation * 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    shield.ringRotation += 0.15;
    ctx.rotate(shield.ringRotation);
    ctx.globalAlpha = 0.75 * fade;
    for(let i = 0; i < 6; i++) {
        const armAngle = (Math.PI * 2 * i) / 6;
        const armLength = 18 + oscillation * 12;
        ctx.save();
        ctx.rotate(armAngle);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(currentRadius - armLength, -2, armLength, 4);
        ctx.restore();
    }
    ctx.restore();

    ctx.globalAlpha = 0.7 * fade;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 6 + oscillation * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Stage-specific monster definitions (5 per stage, cycling in order)
const stageMonsterSets = {
    1: [
        { name: 'Moss Slime', type: 'slime', color: '#4fb060', highlight: '#9cf77d', eyes: '#213b18', mouth: '#2d5521', outline: '#f5ffe6' },
        { name: 'Acorn Gremlin', type: 'goblin', color: '#7d4b2b', eyes: '#ffe067', outline: '#281305', weapon: '#b1783b', accent: '#f6d6a3', secondary: '#4a2d16' },
        { name: 'Bramble Bat', type: 'bat', color: '#2d3b1f', wingInner: '#6b8f3b', eyes: '#ffe066', outline: '#dfffae', fangs: '#f7f7f7' },
        { name: 'Thicket Spider', type: 'spider', color: '#3f2a18', eyes: '#ff9860', outline: '#f3d5b6', legColor: '#2b1a0d', abdomen: '#6d4a2f' },
        { name: 'Glimmer Wisp', type: 'ghost', color: '#c8ffe6', eyes: '#2f6b42', outline: '#17533a', highlight: 'rgba(255,255,255,0.45)', mouth: '#1f4d33' }
    ],
    2: [
        { name: 'Pebble Slime', type: 'slime', color: '#8fa0ad', highlight: '#d7e1e9', eyes: '#2b3f52', mouth: '#24344a', outline: '#162028' },
        { name: 'Frostwing Bat', type: 'bat', color: '#6b7d93', wingInner: '#b5c6d9', eyes: '#f0f6ff', outline: '#101823', fangs: '#e6efff' },
        { name: 'Granite Orc', type: 'orc', color: '#556068', eyes: '#f3f4f7', outline: '#0d141b', armor: '#8d969e', fists: '#4d565c' },
        { name: 'Ridge Skeleton', type: 'skeleton', color: '#e2e7ee', eyes: '#2f3b4d', outline: '#0a1119', ribs: '#c7d0da' },
        { name: 'Chasm Demon', type: 'demon', color: '#5d3a4f', eyes: '#ffd1f0', outline: '#13060f', horns: '#7b4a69', claws: '#2d1626' }
    ],
    3: [
        { name: 'Magma Slime', type: 'slime', color: '#ff5a2b', highlight: '#ffa36b', eyes: '#330a02', mouth: '#421103', outline: '#1b0400' },
        { name: 'Cinder Bat', type: 'bat', color: '#612620', wingInner: '#b1392a', eyes: '#ffe066', outline: '#1c0200', fangs: '#ffd6a5' },
        { name: 'Ashen Zombie', type: 'zombie', color: '#5e4039', eyes: '#ffd27f', outline: '#130706', clothes: '#3b1f1a', mouth: '#1b0502' },
        { name: 'Blister Spider', type: 'spider', color: '#7c2f23', eyes: '#ffe289', outline: '#2a0500', legColor: '#542018', abdomen: '#a63d2c' },
        { name: 'Lava Drake', type: 'dragon', color: '#7f1408', eyes: '#ffd064', outline: '#1b0301', spikes: '#ff7034', wings: '#a32a12', fire: '#ff8c37', fireCore: '#ffd24f' }
    ],
    4: [
        { name: 'Frostbite Slime', type: 'slime', color: '#6fd1ff', highlight: '#d6f5ff', eyes: '#0b2e4a', mouth: '#134260', outline: '#072333' },
        { name: 'Snowbound Skeleton', type: 'skeleton', color: '#f8fdff', eyes: '#3c5f7f', outline: '#0b2335', ribs: '#d4ebf8' },
        { name: 'Glacial Spider', type: 'spider', color: '#7fb2c9', eyes: '#f4ffff', outline: '#0b2433', legColor: '#5b8aa0', abdomen: '#9fd0e6' },
        { name: 'Polar Wisp', type: 'ghost', color: '#e8fbff', eyes: '#2c4e78', outline: '#0f2433', highlight: 'rgba(255,255,255,0.6)', mouth: '#1f3a57' },
        { name: 'Icebound Orc', type: 'orc', color: '#74a9b8', eyes: '#f9fdff', outline: '#0a1e2a', armor: '#b7d4de', fists: '#6798a6' }
    ],
    5: [
        { name: 'Umbra Slime', type: 'slime', color: '#1b1a3a', highlight: '#5a4c95', eyes: '#f5f3ff', mouth: '#9e92ff', outline: '#f5edff' },
        { name: 'Nightmare Bat', type: 'bat', color: '#2b1037', wingInner: '#5d2f85', eyes: '#ff6bf7', outline: '#f9e6ff', fangs: '#ffd8ff' },
        { name: 'Shadow Weaver', type: 'spider', color: '#1b0d29', eyes: '#ff5d83', outline: '#f1dcff', legColor: '#14061d', abdomen: '#341247' },
        { name: 'Void Walker', type: 'demon', color: '#321b45', eyes: '#9d7bff', outline: '#f0e5ff', horns: '#55306e', claws: '#140620' },
        { name: 'Gloom Zombie', type: 'zombie', color: '#2a223c', eyes: '#c1b5ff', outline: '#f0eaff', clothes: '#3c325a', mouth: '#f5f2ff' }
    ],
    6: [
        { name: 'Prism Slime', type: 'slime', color: '#5fd6ff', highlight: '#c4f4ff', eyes: '#11435f', mouth: '#1c5f7d', outline: '#062639' },
        { name: 'Crystal Bat', type: 'bat', color: '#3c7d9f', wingInner: '#8ed1ef', eyes: '#e8fcff', outline: '#052233', fangs: '#d5f7ff' },
        { name: 'Shard Sentinel', type: 'skeleton', color: '#dff3ff', eyes: '#2b6688', outline: '#041d2b', ribs: '#b8e3f8' },
        { name: 'Luminous Wisp', type: 'ghost', color: '#bdf8ff', eyes: '#1f6a8c', outline: '#053144', highlight: 'rgba(255,255,255,0.5)', mouth: '#124a5f' },
        { name: 'Facet Spider', type: 'spider', color: '#4a9bc4', eyes: '#f2ffff', outline: '#042836', legColor: '#32789b', abdomen: '#6ec3e5' }
    ],
    7: [
        { name: 'Thunder Slime', type: 'slime', color: '#4b64c9', highlight: '#8ea1ff', eyes: '#f5f8ff', mouth: '#ffe066', outline: '#0a1333' },
        { name: 'Gale Bat', type: 'bat', color: '#2e4a7c', wingInner: '#6f88c4', eyes: '#e1efff', outline: '#070f23', fangs: '#f9fbff' },
        { name: 'Storm Goblin', type: 'goblin', color: '#47608f', eyes: '#ffe14b', outline: '#060c1a', weapon: '#2d3e68', accent: '#93a9da', secondary: '#29375a' },
        { name: 'Static Skeleton', type: 'skeleton', color: '#d4dcf0', eyes: '#ffd147', outline: '#050914', ribs: '#b2bcdd' },
        { name: 'Tempest Demon', type: 'demon', color: '#3a2f74', eyes: '#ffd966', outline: '#05041b', horns: '#5b47a3', claws: '#130a33' }
    ],
    8: [
        { name: 'Ember Slime', type: 'slime', color: '#ff7a29', highlight: '#ffba78', eyes: '#3a1301', mouth: '#512103', outline: '#1c0600' },
        { name: 'Coal Goblin', type: 'goblin', color: '#4b2f28', eyes: '#ffcf6a', outline: '#f3dcc6', weapon: '#6a3b2f', accent: '#ffb05a', secondary: '#36201b' },
        { name: 'Forge Orc', type: 'orc', color: '#7a3a24', eyes: '#ffeaa6', outline: '#f4d3c2', armor: '#b1613e', fists: '#6a301a' },
        { name: 'Magma Spider', type: 'spider', color: '#8f2a18', eyes: '#ffdca3', outline: '#f9c6a5', legColor: '#661c0f', abdomen: '#bf3f26' },
        { name: 'Scorch Wisp', type: 'ghost', color: '#ffddb9', eyes: '#a33c00', outline: '#491600', highlight: 'rgba(255,206,149,0.6)', mouth: '#732400' }
    ],
    9: [
        { name: 'Grave Slime', type: 'slime', color: '#6a6c5e', highlight: '#a5a88f', eyes: '#1e1f1a', mouth: '#2c2d24', outline: '#f1f2e8' },
        { name: 'Rot Zombie', type: 'zombie', color: '#7a6f5f', eyes: '#f7e7c6', outline: '#f6f1e3', clothes: '#4d4236', mouth: '#261f16' },
        { name: 'Bone Collector', type: 'skeleton', color: '#ede5d3', eyes: '#392c1d', outline: '#f9f4ea', ribs: '#d0c4b0' },
        { name: 'Doom Bat', type: 'bat', color: '#3c2f3b', wingInner: '#705564', eyes: '#f6e4ff', outline: '#f5e5ff', fangs: '#fdeeff' },
        { name: 'Crypt Wisp', type: 'ghost', color: '#d8d3e2', eyes: '#3e314b', outline: '#f8f5ff', highlight: 'rgba(255,255,255,0.5)', mouth: '#2b2034' }
    ],
    10: [
        { name: 'Drake Whelp', type: 'dragon', color: '#a12d1f', eyes: '#ffe08a', outline: '#ffe2c6', spikes: '#ffb347', wings: '#c6552f', fire: '#ffb347', fireCore: '#fff2a8' },
        { name: 'Dragonfire Slime', type: 'slime', color: '#ff9242', highlight: '#ffd4a0', eyes: '#521b02', mouth: '#652402', outline: '#ffe5c9' },
        { name: 'Hoard Goblin', type: 'goblin', color: '#a17c2f', eyes: '#fff1a6', outline: '#fff5d1', weapon: '#c9a544', accent: '#ffe69a', secondary: '#6e531d' },
        { name: 'Scale Spider', type: 'spider', color: '#6b3e2c', eyes: '#ffe7a4', outline: '#ffe7cf', legColor: '#462517', abdomen: '#91502f' },
        { name: 'Ashen Wisp', type: 'ghost', color: '#f7dcd2', eyes: '#7a2f28', outline: '#ffe7dc', highlight: 'rgba(255,220,210,0.6)', mouth: '#6b1f18' }
    ]
};

const stageMonsterIndices = {};

function resetMonsterCycle(stageNumber = null) {
    if(stageNumber === null) {
        Object.keys(stageMonsterSets).forEach(stage => {
            stageMonsterIndices[stage] = 0;
        });
        return;
    }
    stageMonsterIndices[stageNumber] = 0;
}

function getStageMonsters(stageNumber) {
    return stageMonsterSets[stageNumber] || stageMonsterSets[1] || [];
}

function getNextMonsterForStage(stageNumber) {
    const pool = getStageMonsters(stageNumber);
    if(pool.length === 0) {
        return { name: 'Default Slime', type: 'slime', color: '#7bc96f', eyes: '#0d2f12', outline: '#f5ffe6' };
    }

    const index = stageMonsterIndices[stageNumber] || 0;
    const monsterDef = pool[index];
    stageMonsterIndices[stageNumber] = (index + 1) % pool.length;

    return { ...monsterDef };
}

resetMonsterCycle();

const MONSTER_CANVAS_SIZE = 80;
const monsterBufferCanvas = document.createElement('canvas');
monsterBufferCanvas.width = MONSTER_CANVAS_SIZE;
monsterBufferCanvas.height = MONSTER_CANVAS_SIZE;
const monsterBufferCtx = monsterBufferCanvas.getContext('2d');
monsterBufferCtx.imageSmoothingEnabled = false;

// Boss definitions
const bosses = [
    { name: 'Starověký strom', type: 'tree' },
    { name: 'Kamenný golem', type: 'golem' },
    { name: 'Ohnivý elementál', type: 'fire' },
    { name: 'Ledový obr', type: 'ice' },
    { name: 'Stínový démon', type: 'shadow' },
    { name: 'Křišťálový had', type: 'serpent' },
    { name: 'Hromový pták', type: 'bird' },
    { name: 'Lávová bestie', type: 'lava' },
    { name: 'Nekromant', type: 'necro' },
    { name: 'Temný drak', type: 'darkdragon' }
];

const stageThemeByStage = {
    1: 'forest',
    2: 'mountain',
    3: 'volcano',
    4: 'tundra',
    5: 'shadow',
    6: 'crystal',
    7: 'storm',
    8: 'molten',
    9: 'necropolis',
    10: 'dragon'
};

const stageThemes = {
    forest: {
        day: {
            skyTop: '#6ec1ff',
            skyBottom: '#cfe8ff',
            horizon: 'rgba(255, 255, 255, 0.4)',
            mountains: '#4b6b7a',
            mountainHighlight: '#7fa3b5',
            mountainShadow: '#2f4754',
            trees: '#2f6b3b',
            treeShadow: '#21492a',
            bushes: '#3f7e35',
            bushShadow: '#2c5724',
            ground: '#5c3b20',
            groundHighlight: '#7e5931',
            grass: '#4caf50',
            grassHighlight: '#84d66a',
            cloudLight: '#ffffff',
            cloudDark: '#d6eeff',
            accentType: 'flowers',
            pollenColor: '#ffe066',
            cloudStyle: 'puffy'
        },
        night: {
            skyTop: '#201442',
            skyBottom: '#1b2d4f',
            horizon: 'rgba(64, 115, 158, 0.35)',
            mountains: '#16243a',
            mountainHighlight: '#203a52',
            mountainShadow: '#0d1724',
            trees: '#1f3a28',
            treeShadow: '#0f2416',
            bushes: '#224330',
            bushShadow: '#14281b',
            ground: '#172417',
            groundHighlight: '#243627',
            grass: '#1f4b2b',
            grassHighlight: '#2f6b3b',
            cloudLight: '#5d6fa3',
            cloudDark: '#2a3558',
            accentType: 'mushrooms',
            fireflyColor: '#9fffe2',
            cloudStyle: 'wispy'
        }
    },
    mountain: {
        day: {
            skyTop: '#8fd1ff',
            skyBottom: '#d6f1ff',
            horizon: 'rgba(200, 234, 255, 0.6)',
            mountains: '#4d5f78',
            mountainHighlight: '#8aa3c1',
            mountainShadow: '#2d3949',
            trees: '#476465',
            treeShadow: '#2f4141',
            bushes: '#4f706b',
            bushShadow: '#36504d',
            ground: '#6b5f4a',
            groundHighlight: '#8f7a58',
            grass: '#6f9e6f',
            grassHighlight: '#95c792',
            cloudLight: '#ffffff',
            cloudDark: '#d6e1ff',
            accentType: 'stone',
            pollenColor: '#d0f4ff',
            cloudStyle: 'layered'
        },
        night: {
            skyTop: '#101820',
            skyBottom: '#1c2935',
            horizon: 'rgba(120, 160, 200, 0.25)',
            mountains: '#1c242e',
            mountainHighlight: '#2c3a4a',
            mountainShadow: '#0d1116',
            trees: '#273238',
            treeShadow: '#161c20',
            bushes: '#2c3c44',
            bushShadow: '#141c20',
            ground: '#1d2227',
            groundHighlight: '#2e3a42',
            grass: '#233235',
            grassHighlight: '#2f4447',
            cloudLight: '#566d82',
            cloudDark: '#243442',
            accentType: 'runestone',
            fireflyColor: '#78f7ff',
            cloudStyle: 'ridges'
        }
    },
    volcano: {
        day: {
            skyTop: '#f88b4f',
            skyBottom: '#f6d187',
            horizon: 'rgba(255, 171, 64, 0.35)',
            mountains: '#5a2c29',
            mountainHighlight: '#a44a3c',
            mountainShadow: '#381917',
            trees: '#6e3f28',
            treeShadow: '#3d2318',
            bushes: '#7e4e2a',
            bushShadow: '#4c2b18',
            ground: '#4c1e14',
            groundHighlight: '#783023',
            grass: '#c46a2b',
            grassHighlight: '#f08f3a',
            cloudLight: '#ffe1c4',
            cloudDark: '#f7a56a',
            accentType: 'smoke',
            pollenColor: '#ffbe76',
            cloudStyle: 'plume'
        },
        night: {
            skyTop: '#2d0d1b',
            skyBottom: '#4a1626',
            horizon: 'rgba(255, 94, 58, 0.25)',
            mountains: '#240a12',
            mountainHighlight: '#3d121d',
            mountainShadow: '#120408',
            trees: '#351613',
            treeShadow: '#1e0b0a',
            bushes: '#441912',
            bushShadow: '#240b07',
            ground: '#210806',
            groundHighlight: '#3d130d',
            grass: '#5c1e15',
            grassHighlight: '#8b3622',
            cloudLight: '#f06d3d',
            cloudDark: '#8f2b2c',
            accentType: 'embers',
            fireflyColor: '#ffbc5e',
            cloudStyle: 'ash'
        }
    },
    tundra: {
        day: {
            skyTop: '#a4e4ff',
            skyBottom: '#e1f5ff',
            horizon: 'rgba(255, 255, 255, 0.65)',
            mountains: '#6f90b9',
            mountainHighlight: '#c9e0ff',
            mountainShadow: '#3e5570',
            trees: '#9ad2f2',
            treeShadow: '#6ba3c4',
            bushes: '#b0e3ff',
            bushShadow: '#7fb3d1',
            ground: '#d0e9ff',
            groundHighlight: '#f5fbff',
            grass: '#c8f1ff',
            grassHighlight: '#ffffff',
            cloudLight: '#ffffff',
            cloudDark: '#cfe7ff',
            accentType: 'ice',
            pollenColor: '#ffffff',
            cloudStyle: 'aurora'
        },
        night: {
            skyTop: '#16244f',
            skyBottom: '#203767',
            horizon: 'rgba(120, 170, 255, 0.4)',
            mountains: '#1d335e',
            mountainHighlight: '#34548f',
            mountainShadow: '#0c162b',
            trees: '#264667',
            treeShadow: '#13263b',
            bushes: '#2c5679',
            bushShadow: '#142b3f',
            ground: '#1a2e47',
            groundHighlight: '#27456a',
            grass: '#23405f',
            grassHighlight: '#3b6fa1',
            cloudLight: '#7ab9ff',
            cloudDark: '#35548f',
            accentType: 'aurora',
            fireflyColor: '#8bc9ff',
            cloudStyle: 'aurora'
        }
    },
    shadow: {
        day: {
            skyTop: '#6c3fb2',
            skyBottom: '#b58df2',
            horizon: 'rgba(210, 170, 255, 0.4)',
            mountains: '#41235a',
            mountainHighlight: '#6e3b8f',
            mountainShadow: '#2a143c',
            trees: '#4b2c6b',
            treeShadow: '#2b1740',
            bushes: '#5a357e',
            bushShadow: '#371f52',
            ground: '#2f1a43',
            groundHighlight: '#472861',
            grass: '#7447a5',
            grassHighlight: '#9f68d9',
            cloudLight: '#d7b1ff',
            cloudDark: '#8c5cd9',
            accentType: 'runes',
            pollenColor: '#f8d8ff',
            cloudStyle: 'wispy'
        },
        night: {
            skyTop: '#1e0f33',
            skyBottom: '#2f184a',
            horizon: 'rgba(160, 110, 210, 0.35)',
            mountains: '#140824',
            mountainHighlight: '#27103f',
            mountainShadow: '#0a0313',
            trees: '#1d0f2f',
            treeShadow: '#0e061a',
            bushes: '#241338',
            bushShadow: '#12071f',
            ground: '#160c23',
            groundHighlight: '#261339',
            grass: '#271541',
            grassHighlight: '#3f1f64',
            cloudLight: '#5d3a8f',
            cloudDark: '#2a184f',
            accentType: 'wisp',
            fireflyColor: '#f7abff',
            cloudStyle: 'wispy'
        }
    },
    crystal: {
        day: {
            skyTop: '#75d6ff',
            skyBottom: '#d1faff',
            horizon: 'rgba(148, 255, 255, 0.55)',
            mountains: '#4c7d9e',
            mountainHighlight: '#8dd3ff',
            mountainShadow: '#2b4e66',
            trees: '#3f6b8a',
            treeShadow: '#26465a',
            bushes: '#4f88a8',
            bushShadow: '#2e5871',
            ground: '#3f5d72',
            groundHighlight: '#5c88a3',
            grass: '#4fd6ff',
            grassHighlight: '#96f6ff',
            cloudLight: '#c9f6ff',
            cloudDark: '#87d4f0',
            accentType: 'crystal',
            pollenColor: '#aef7ff',
            cloudStyle: 'shard'
        },
        night: {
            skyTop: '#101c40',
            skyBottom: '#1c2e5a',
            horizon: 'rgba(110, 210, 255, 0.4)',
            mountains: '#0f1f36',
            mountainHighlight: '#1f3a59',
            mountainShadow: '#060d18',
            trees: '#163045',
            treeShadow: '#081725',
            bushes: '#1c3f59',
            bushShadow: '#0b1f2f',
            ground: '#0f1a28',
            groundHighlight: '#1a2f42',
            grass: '#125a6c',
            grassHighlight: '#1f91a7',
            cloudLight: '#4cd0ff',
            cloudDark: '#217896',
            accentType: 'crystal',
            fireflyColor: '#7cf3ff',
            cloudStyle: 'shard'
        }
    },
    storm: {
        day: {
            skyTop: '#4a6fb3',
            skyBottom: '#9fbceb',
            horizon: 'rgba(255, 255, 255, 0.35)',
            mountains: '#384d78',
            mountainHighlight: '#708cc0',
            mountainShadow: '#232f4a',
            trees: '#3b5474',
            treeShadow: '#28394f',
            bushes: '#456788',
            bushShadow: '#304863',
            ground: '#334056',
            groundHighlight: '#4a5e7a',
            grass: '#5e7da5',
            grassHighlight: '#86a7cc',
            cloudLight: '#f0f5ff',
            cloudDark: '#7b8cb2',
            accentType: 'thunder',
            pollenColor: '#d2e3ff',
            cloudStyle: 'storm'
        },
        night: {
            skyTop: '#0b1426',
            skyBottom: '#16233a',
            horizon: 'rgba(120, 180, 255, 0.25)',
            mountains: '#111d33',
            mountainHighlight: '#1f3656',
            mountainShadow: '#050a12',
            trees: '#16253a',
            treeShadow: '#0a1320',
            bushes: '#1b2f44',
            bushShadow: '#0c1624',
            ground: '#101b2b',
            groundHighlight: '#1b2c42',
            grass: '#14283b',
            grassHighlight: '#1f3d59',
            cloudLight: '#4b6b9b',
            cloudDark: '#1e2f47',
            accentType: 'lightning',
            fireflyColor: '#9fc9ff',
            cloudStyle: 'storm'
        }
    },
    molten: {
        day: {
            skyTop: '#d4582f',
            skyBottom: '#f0a357',
            horizon: 'rgba(255, 148, 76, 0.4)',
            mountains: '#5a211a',
            mountainHighlight: '#a23d2b',
            mountainShadow: '#35120f',
            trees: '#732e1f',
            treeShadow: '#3f1610',
            bushes: '#933a21',
            bushShadow: '#561d11',
            ground: '#3f140d',
            groundHighlight: '#702317',
            grass: '#d85c28',
            grassHighlight: '#ff883d',
            cloudLight: '#ffd1a3',
            cloudDark: '#ff9352',
            accentType: 'lava',
            pollenColor: '#ffb169',
            cloudStyle: 'ash'
        },
        night: {
            skyTop: '#240403',
            skyBottom: '#4a0f09',
            horizon: 'rgba(255, 80, 0, 0.3)',
            mountains: '#2f0502',
            mountainHighlight: '#55130a',
            mountainShadow: '#160201',
            trees: '#3b0904',
            treeShadow: '#200402',
            bushes: '#4b0d06',
            bushShadow: '#260502',
            ground: '#1b0301',
            groundHighlight: '#320905',
            grass: '#7c1907',
            grassHighlight: '#b3260b',
            cloudLight: '#ff6b3b',
            cloudDark: '#8f1f1f',
            accentType: 'lava',
            fireflyColor: '#ffdd6f',
            cloudStyle: 'ash'
        }
    },
    necropolis: {
        day: {
            skyTop: '#a0b3bf',
            skyBottom: '#d7e1e7',
            horizon: 'rgba(200, 220, 220, 0.5)',
            mountains: '#6b7a80',
            mountainHighlight: '#9aaab1',
            mountainShadow: '#404a50',
            trees: '#7d8a79',
            treeShadow: '#495144',
            bushes: '#8c9b86',
            bushShadow: '#5b6655',
            ground: '#757d6b',
            groundHighlight: '#9aa38f',
            grass: '#8fad7b',
            grassHighlight: '#b7d39d',
            cloudLight: '#f5f9fb',
            cloudDark: '#c1ccd2',
            accentType: 'tomb',
            pollenColor: '#e5f4ff',
            cloudStyle: 'layered'
        },
        night: {
            skyTop: '#181b27',
            skyBottom: '#262b38',
            horizon: 'rgba(200, 220, 220, 0.2)',
            mountains: '#1d222c',
            mountainHighlight: '#2b3240',
            mountainShadow: '#0b0d13',
            trees: '#232a28',
            treeShadow: '#101412',
            bushes: '#28312d',
            bushShadow: '#111814',
            ground: '#1a2019',
            groundHighlight: '#2e362a',
            grass: '#263627',
            grassHighlight: '#374d37',
            cloudLight: '#48525e',
            cloudDark: '#202630',
            accentType: 'gravefire',
            fireflyColor: '#94f5d8',
            cloudStyle: 'layered'
        }
    },
    dragon: {
        day: {
            skyTop: '#f6b56b',
            skyBottom: '#ffe1a1',
            horizon: 'rgba(255, 200, 120, 0.45)',
            mountains: '#6f2f2f',
            mountainHighlight: '#b85a3a',
            mountainShadow: '#3c1414',
            trees: '#793b2b',
            treeShadow: '#451f16',
            bushes: '#8f4a34',
            bushShadow: '#53261a',
            ground: '#582620',
            groundHighlight: '#83382d',
            grass: '#c5633d',
            grassHighlight: '#f28a55',
            cloudLight: '#ffd8b2',
            cloudDark: '#f6975a',
            accentType: 'scales',
            pollenColor: '#ffcb7d',
            cloudStyle: 'smoke'
        },
        night: {
            skyTop: '#1a0303',
            skyBottom: '#360808',
            horizon: 'rgba(255, 80, 60, 0.35)',
            mountains: '#220404',
            mountainHighlight: '#3d0b0a',
            mountainShadow: '#100101',
            trees: '#2b0806',
            treeShadow: '#150302',
            bushes: '#360c08',
            bushShadow: '#1b0403',
            ground: '#1a0403',
            groundHighlight: '#330806',
            grass: '#680f0a',
            grassHighlight: '#9e1b14',
            cloudLight: '#ff5e3b',
            cloudDark: '#821c1c',
            accentType: 'embers',
            fireflyColor: '#ffb86b',
            cloudStyle: 'smoke'
        }
    }
};

// Draw pixel art witch on broomstick
function drawWizard() {
    const x = 50;
    const y = 80;
    const bounce = Math.sin(Date.now() / 300) * 3;

    if(game.isGameOver && !game.witchDeathAnim) {
        return;
    }

    // Death animation handling
    let scale = 1.2; // 20% větší
    if(game.witchDeathAnim) {
        const elapsed = Date.now() - game.witchDeathAnim.startTime;

        if(game.witchDeathAnim.phase === 'inflate') {
            const inflateProgress = Math.min(elapsed / 800, 1);
            scale = 1.2 + inflateProgress * 1.5;
        } else {
            // After explosion - hide witch completely
            return;
        }
    }

    ctx.save();
    ctx.translate(x + 25, y + 35);
    ctx.scale(scale, scale);
    ctx.translate(-25, -35);

    // Broomstick handle (horizontal)
    ctx.fillStyle = '#7a4a1a';
    ctx.fillRect(x - 5, y + 28 + bounce, 65, 4);
    ctx.fillStyle = '#5f3610';
    ctx.fillRect(x + 45, y + 27 + bounce, 15, 6);

    // Broom binding and bristles (pointing right)
    const sway = Math.sin(Date.now() / 150) * 2;
    ctx.fillStyle = '#c48a3a';
    ctx.fillRect(x - 3, y + 26 + bounce, 6, 8);
    ctx.fillStyle = '#e0a647';
    for(let i = 0; i < 5; i++) {
        const offset = sway + i * 2;
        ctx.fillRect(x - 18 + offset, y + 24 + bounce + i, 12, 2);
        ctx.fillRect(x - 18 + offset, y + 30 + bounce + i, 13, 2);
    }

    // Legs dangling down - each swinging independently
    const leftLegSwing = Math.sin(Date.now() / 320) * 3;
    const rightLegSwing = Math.sin(Date.now() / 280 + 1.5) * 3;
    ctx.fillStyle = '#28122b';
    // Left leg - bent at knee
    ctx.fillRect(x + 14, y + 32 + bounce, 6, 10);
    ctx.fillRect(x + 14 + leftLegSwing, y + 42 + bounce, 6, 8);
    ctx.fillRect(x + 13 + leftLegSwing, y + 49 + bounce, 8, 6);
    // Right leg - bent at knee
    ctx.fillRect(x + 24, y + 32 + bounce, 6, 10);
    ctx.fillRect(x + 24 + rightLegSwing, y + 42 + bounce, 6, 8);
    ctx.fillRect(x + 23 + rightLegSwing, y + 49 + bounce, 8, 6);

    // Dress flowing in wind
    const dressWave = Math.sin(Date.now() / 180) * 4;
    const dressFlow = Math.sin(Date.now() / 200 + 0.3) * 5;
    ctx.fillStyle = '#5b1a6d';
    // Main dress body
    ctx.fillRect(x + 12, y + 8 + bounce, 20, 24);
    // Dress flowing left in wind
    ctx.fillRect(x + 6 + dressWave, y + 12 + bounce, 16, 20);
    ctx.fillRect(x + 2 + dressFlow, y + 16 + bounce, 14, 16);
    ctx.fillStyle = '#732386';
    // Dress highlights
    ctx.fillRect(x + 16, y + 12 + bounce, 12, 16);
    ctx.fillRect(x + 8 + dressWave, y + 18 + bounce, 10, 12);

    // Torso leaning forward
    ctx.fillStyle = '#ffd6bc';
    ctx.fillRect(x + 22, y + 6 + bounce, 10, 14);

    // Light purple shirt
    ctx.fillStyle = '#c8a0e8';
    ctx.fillRect(x + 22, y + 8 + bounce, 10, 12);

    // Arms reaching forward (right)
    // Left arm
    ctx.fillRect(x + 18, y + 10 + bounce, 6, 6);
    ctx.fillRect(x + 22, y + 14 + bounce, 8, 5);
    // Right arm
    ctx.fillRect(x + 28, y + 10 + bounce, 6, 6);
    ctx.fillRect(x + 32, y + 14 + bounce, 8, 5);

    // Hands gripping broomstick forward
    ctx.fillRect(x + 28, y + 18 + bounce, 4, 5);
    ctx.fillRect(x + 38, y + 18 + bounce, 4, 5);

    // Head looking right, leaning forward
    ctx.fillStyle = '#ffd6bc';
    ctx.fillRect(x + 26, y - 6 + bounce, 12, 12);
    // Nose pointing right
    ctx.fillRect(x + 38, y - 2 + bounce, 2, 4);

    // Eye looking right
    ctx.fillStyle = '#201020';
    ctx.fillRect(x + 34, y - 2 + bounce, 3, 3);
    // Mouth
    ctx.fillRect(x + 32, y + 3 + bounce, 4, 1);

    // Long dark hair flowing left in wind
    const hairFlow1 = Math.sin(Date.now() / 130) * 6;
    const hairFlow2 = Math.sin(Date.now() / 150 + 0.4) * 7;
    const hairFlow3 = Math.sin(Date.now() / 170 + 0.8) * 8;
    ctx.fillStyle = '#0b0b15';
    // Hair layers flowing to the left
    ctx.fillRect(x + 22, y - 8 + bounce, 12, 10);
    ctx.fillRect(x + 16 + hairFlow1, y - 6 + bounce, 14, 12);
    ctx.fillRect(x + 12 + hairFlow2, y - 4 + bounce, 16, 14);
    ctx.fillRect(x + 8 + hairFlow3, y - 2 + bounce, 14, 16);
    ctx.fillRect(x + 4 + hairFlow2, y + 0 + bounce, 12, 18);
    // Additional flowing strands
    ctx.fillRect(x + 14 + hairFlow1, y - 10 + bounce, 8, 8);
    ctx.fillRect(x + 10 + hairFlow3, y - 8 + bounce, 10, 10);
    ctx.fillRect(x + 2 + hairFlow1, y + 2 + bounce, 10, 14);

    // Dress highlights in wind
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x + 18, y + 14 + bounce, 6, 10);
    ctx.fillRect(x + 8 + dressFlow, y + 20 + bounce, 4, 8);

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

const monsterRenderers = {
    slime(targetCtx, monster, frame) {
        const bodyColor = monster.color || '#00ff00';
        const highlight = monster.highlight || 'rgba(255, 255, 255, 0.3)';
        const eyeColor = monster.eyes || '#000000';
        const mouthColor = monster.mouth || '#000000';

        const slimeWidth = [50, 52, 48][frame];
        const slimeHeight = [35, 33, 37][frame];

        targetCtx.fillStyle = bodyColor;
        targetCtx.fillRect(15, 45 - slimeHeight, slimeWidth, slimeHeight);
        targetCtx.fillRect(10, 50 - slimeHeight + 10, 60, slimeHeight - 10);

        targetCtx.fillStyle = highlight;
        targetCtx.fillRect(25, 20, 8, 8);
        targetCtx.fillRect(30, 15, 5, 5);

        targetCtx.fillStyle = eyeColor;
        const eyeY = [25, 26, 24][frame];
        targetCtx.fillRect(25, eyeY, 6, 6);
        targetCtx.fillRect(45, eyeY, 6, 6);

        targetCtx.fillStyle = mouthColor;
        targetCtx.fillRect(32, 35, 12, 3);
    },
    ghost(targetCtx, monster, frame, bounce, scale) {
        const bodyColor = monster.color || '#ffffff';
        const eyeColor = monster.eyes || '#0000ff';
        const mouthColor = monster.mouth || '#000000';
        const highlight = monster.highlight;
        const ghostY = bounce / Math.max(scale, 1);

        targetCtx.fillStyle = bodyColor;
        targetCtx.fillRect(10, 5 + ghostY, 60, 45);
        targetCtx.fillRect(5, 15 + ghostY, 70, 35);

        const ghostTails = [
            [10, 45, 12, 12],
            [28, 45, 12, 12],
            [46, 45, 12, 12],
            [64, 45, 12, 12]
        ];
        const waveOffset = [0, -2, 0][frame];
        ghostTails.forEach(([tx, ty, tw, th]) => {
            targetCtx.fillRect(tx, ty + ghostY + waveOffset, tw, th);
        });

        if(highlight) {
            targetCtx.fillStyle = highlight;
            targetCtx.fillRect(18, 12 + ghostY, 12, 18);
            targetCtx.fillRect(48, 18 + ghostY, 10, 14);
        }

        targetCtx.fillStyle = eyeColor;
        const ghostEyeSize = [8, 10, 8][frame];
        targetCtx.fillRect(20, 20 + ghostY, ghostEyeSize, ghostEyeSize);
        targetCtx.fillRect(50, 20 + ghostY, ghostEyeSize, ghostEyeSize);

        targetCtx.fillStyle = mouthColor;
        targetCtx.fillRect(35, 35 + ghostY, 3, 8);
    },
    demon(targetCtx, monster, frame) {
        const bodyColor = monster.color || '#ff0000';
        const hornColor = monster.horns || bodyColor;
        const clawColor = monster.claws || '#000000';
        const eyeColor = monster.eyes || '#ffff00';
        const fangColor = monster.fangs || '#ffffff';

        targetCtx.fillStyle = bodyColor;
        targetCtx.fillRect(15, 15, 50, 40);

        const hornOffset = [0, -2, 0][frame];
        targetCtx.fillStyle = hornColor;
        targetCtx.fillRect(10, 10 + hornOffset, 8, 12);
        targetCtx.fillRect(62, 10 + hornOffset, 8, 12);
        targetCtx.fillRect(8, 8 + hornOffset, 6, 8);
        targetCtx.fillRect(66, 8 + hornOffset, 6, 8);

        targetCtx.fillStyle = bodyColor;
        targetCtx.fillRect(20, 50, 40, 30);

        const armSwing = [0, 3, 0][frame];
        targetCtx.fillRect(10, 55 + armSwing, 15, 20);
        targetCtx.fillRect(55, 55 - armSwing, 15, 20);

        targetCtx.fillStyle = clawColor;
        targetCtx.fillRect(10, 73 + armSwing, 4, 6);
        targetCtx.fillRect(18, 73 + armSwing, 4, 6);
        targetCtx.fillRect(58, 73 - armSwing, 4, 6);
        targetCtx.fillRect(66, 73 - armSwing, 4, 6);

        targetCtx.fillStyle = eyeColor;
        targetCtx.fillRect(25, 25, 8, 8);
        targetCtx.fillRect(47, 25, 8, 8);

        targetCtx.fillStyle = fangColor;
        targetCtx.fillRect(28, 38, 4, 8);
        targetCtx.fillRect(48, 38, 4, 8);
    },
    bat(targetCtx, monster, frame) {
        const bodyColor = monster.color || '#8b4513';
        const wingOuter = monster.wings || bodyColor;
        const wingInner = monster.wingInner || wingOuter;
        const eyeColor = monster.eyes || '#ff0000';
        const fangColor = monster.fangs || '#ffffff';

        targetCtx.fillStyle = bodyColor;
        targetCtx.fillRect(30, 25, 20, 18);
        targetCtx.fillRect(25, 18, 30, 15);

        targetCtx.fillRect(22, 12, 6, 8);
        targetCtx.fillRect(52, 12, 6, 8);
        targetCtx.fillRect(20, 10, 4, 6);
        targetCtx.fillRect(56, 10, 4, 6);

        const wingSpread = [
            { left: 15, right: 15, up: 5 },
            { left: 20, right: 20, up: 0 },
            { left: 15, right: 15, up: 5 }
        ][frame];

        targetCtx.fillStyle = wingOuter;
        targetCtx.fillRect(10, 25 + wingSpread.up, wingSpread.left, 25);
        targetCtx.fillRect(50, 25 + wingSpread.up, wingSpread.right, 25);

        targetCtx.fillStyle = wingInner;
        targetCtx.fillRect(5, 30 + wingSpread.up, wingSpread.left - 5, 20);
        targetCtx.fillRect(60, 30 + wingSpread.up, wingSpread.right - 5, 20);

        targetCtx.fillStyle = eyeColor;
        targetCtx.fillRect(30, 22, 5, 5);
        targetCtx.fillRect(45, 22, 5, 5);

        targetCtx.fillStyle = fangColor;
        targetCtx.fillRect(35, 30, 3, 5);
        targetCtx.fillRect(42, 30, 3, 5);
    },
    spider(targetCtx, monster, frame) {
        const bodyColor = monster.color || '#4b0082';
        const headColor = monster.head || bodyColor;
        const abdomenColor = monster.abdomen || bodyColor;
        const legColor = monster.legColor || '#2b1d42';
        const eyeColor = monster.eyes || '#00ff00';

        targetCtx.fillStyle = bodyColor;
        targetCtx.fillRect(25, 25, 30, 30);

        targetCtx.fillStyle = headColor;
        targetCtx.fillRect(20, 20, 20, 18);

        targetCtx.fillStyle = abdomenColor;
        targetCtx.fillRect(28, 50, 24, 20);

        const legPositions = [
            [0, -2, 0, 2, 0, -2, 0, 2],
            [2, 0, -2, 0, 2, 0, -2, 0],
            [0, 2, 0, -2, 0, 2, 0, -2]
        ][frame];

        targetCtx.fillStyle = legColor;
        for(let i = 0; i < 4; i++) {
            const legY = 28 + i * 8 + legPositions[i];
            targetCtx.fillRect(5, legY, 20, 4);
            targetCtx.fillRect(0, legY + 4, 10, 4);
        }
        for(let i = 0; i < 4; i++) {
            const legY = 28 + i * 8 + legPositions[i + 4];
            targetCtx.fillRect(55, legY, 20, 4);
            targetCtx.fillRect(70, legY + 4, 10, 4);
        }

        targetCtx.fillStyle = eyeColor;
        targetCtx.fillRect(23, 23, 4, 4);
        targetCtx.fillRect(30, 23, 4, 4);
        targetCtx.fillRect(26, 28, 3, 3);
        targetCtx.fillRect(33, 28, 3, 3);
    },
    zombie(targetCtx, monster, frame) {
        const bodyColor = monster.color || '#90ee90';
        const clothesColor = monster.clothes || '#4a4a4a';
        const eyeColor = monster.eyes || '#ff0000';
        const mouthColor = monster.mouth || '#000000';

        targetCtx.fillStyle = bodyColor;
        targetCtx.fillRect(25, 40, 30, 40);

        const headTilt = [0, 2, 0][frame];
        targetCtx.fillRect(22 + headTilt, 10, 36, 35);

        const armReach = [0, 3, 6][frame];
        targetCtx.fillRect(15, 45, 12, 25 + armReach);
        targetCtx.fillRect(53, 45, 12, 25 + armReach);

        targetCtx.fillRect(12, 68 + armReach, 15, 10);
        targetCtx.fillRect(53, 68 + armReach, 15, 10);

        targetCtx.fillStyle = clothesColor;
        targetCtx.fillRect(28, 50, 24, 15);
        targetCtx.fillRect(30, 66, 20, 8);

        targetCtx.fillStyle = eyeColor;
        targetCtx.fillRect(30 + headTilt, 20, 6, 6);
        targetCtx.fillRect(44 + headTilt, 20, 6, 6);

        targetCtx.fillStyle = mouthColor;
        targetCtx.fillRect(35 + headTilt, 32, 12, 8);
    },
    skeleton(targetCtx, monster, frame) {
        const boneColor = monster.color || '#f0f0f0';
        const ribColor = monster.ribs || '#d0d0d0';
        const eyeColor = monster.eyes || '#000000';
        const noseColor = monster.nose || '#000000';

        targetCtx.fillStyle = boneColor;
        targetCtx.fillRect(20, 10, 40, 35);

        const jawOpen = [0, 3, 0][frame];
        targetCtx.fillRect(25, 45 + jawOpen, 30, 10);

        targetCtx.fillRect(25, 50, 30, 30);

        targetCtx.fillStyle = ribColor;
        for(let i = 0; i < 4; i++) {
            targetCtx.fillRect(28, 55 + i * 6, 24, 3);
        }

        const armWave = [0, -4, 0][frame];
        targetCtx.fillStyle = boneColor;
        targetCtx.fillRect(12, 55 + armWave, 15, 25);
        targetCtx.fillRect(53, 55 - armWave, 15, 25);

        targetCtx.fillRect(10, 78 + armWave, 12, 8);
        targetCtx.fillRect(58, 78 - armWave, 12, 8);

        targetCtx.fillStyle = eyeColor;
        targetCtx.fillRect(28, 20, 8, 10);
        targetCtx.fillRect(44, 20, 8, 10);

        targetCtx.fillStyle = noseColor;
        targetCtx.fillRect(36, 32, 8, 6);
    },
    goblin(targetCtx, monster, frame) {
        const skinColor = monster.color || '#228b22';
        const weaponColor = monster.weapon || '#8b4513';
        const eyeColor = monster.eyes || '#ff0000';
        const teethColor = monster.teeth || '#ffffff';
        const tunicColor = monster.secondary;

        targetCtx.fillStyle = skinColor;
        targetCtx.fillRect(25, 35, 30, 35);
        targetCtx.fillRect(20, 10, 40, 30);

        const earFlap = [0, -2, 0][frame];
        targetCtx.fillRect(10, 15 + earFlap, 12, 18);
        targetCtx.fillRect(58, 15 + earFlap, 12, 18);

        const goblinArm = [0, 2, 0][frame];
        targetCtx.fillRect(15, 40, 12, 25);
        targetCtx.fillRect(53, 40, 12, 25);

        targetCtx.fillRect(27, 65, 10, 15);
        targetCtx.fillRect(43, 65, 10, 15);

        if(tunicColor) {
            targetCtx.fillStyle = tunicColor;
            targetCtx.fillRect(25, 50, 30, 12);
        }

        targetCtx.fillStyle = weaponColor;
        targetCtx.fillRect(10, 42 + goblinArm, 8, 20);
        targetCtx.fillRect(8, 40 + goblinArm, 12, 8);

        targetCtx.fillStyle = eyeColor;
        targetCtx.fillRect(28, 20, 7, 7);
        targetCtx.fillRect(45, 20, 7, 7);

        targetCtx.fillStyle = teethColor;
        targetCtx.fillRect(32, 32, 4, 6);
        targetCtx.fillRect(38, 32, 4, 6);
        targetCtx.fillRect(44, 32, 4, 6);
    },
    orc(targetCtx, monster, frame) {
        const skinColor = monster.color || '#556b2f';
        const tuskColor = monster.tusks || '#ffffff';
        const armorColor = monster.armor || '#4a4a4a';
        const eyeColor = monster.eyes || '#ffff00';
        const browColor = monster.brow || '#000000';
        const fistColor = monster.fists || skinColor;

        targetCtx.fillStyle = skinColor;
        targetCtx.fillRect(20, 40, 40, 40);
        targetCtx.fillRect(22, 10, 36, 35);

        targetCtx.fillStyle = tuskColor;
        const tuskSize = [8, 10, 8][frame];
        targetCtx.fillRect(25, 35, 6, tuskSize);
        targetCtx.fillRect(49, 35, 6, tuskSize);

        const muscleSize = [12, 15, 12][frame];
        targetCtx.fillStyle = skinColor;
        targetCtx.fillRect(10, 45, muscleSize, 30);
        targetCtx.fillRect(60, 45, muscleSize, 30);

        targetCtx.fillStyle = fistColor;
        targetCtx.fillRect(8, 72, 14, 12);
        targetCtx.fillRect(58, 72, 14, 12);

        targetCtx.fillStyle = armorColor;
        targetCtx.fillRect(12, 42, 16, 8);
        targetCtx.fillRect(52, 42, 16, 8);

        targetCtx.fillStyle = eyeColor;
        targetCtx.fillRect(28, 18, 8, 8);
        targetCtx.fillRect(44, 18, 8, 8);

        targetCtx.fillStyle = browColor;
        targetCtx.fillRect(26, 16, 12, 3);
        targetCtx.fillRect(42, 16, 12, 3);
    },
    dragon(targetCtx, monster, frame) {
        const bodyColor = monster.color || '#8b0000';
        const wingColor = monster.wings || bodyColor;
        const eyeColor = monster.eyes || '#ffa500';
        const spikeColor = monster.spikes || '#ff4500';
        const hornColor = monster.horns || bodyColor;
        const tailColor = monster.tail || bodyColor;
        const fireColor = monster.fire || '#ff6600';
        const fireCoreColor = monster.fireCore || '#ffaa00';
        const nostrilColor = monster.nostrils || '#000000';

        targetCtx.fillStyle = bodyColor;
        targetCtx.fillRect(25, 30, 40, 30);
        targetCtx.fillRect(15, 20, 30, 25);
        targetCtx.fillRect(5, 25, 15, 15);

        targetCtx.fillStyle = hornColor;
        targetCtx.fillRect(18, 10, 8, 12);
        targetCtx.fillRect(34, 10, 8, 12);
        targetCtx.fillRect(16, 6, 6, 8);
        targetCtx.fillRect(38, 6, 6, 8);

        const dragonWing = [
            { size: 20, angle: 0 },
            { size: 25, angle: -5 },
            { size: 20, angle: 0 }
        ][frame];

        targetCtx.fillStyle = wingColor;
        targetCtx.fillRect(15, 25 + dragonWing.angle, dragonWing.size, 30);
        targetCtx.fillRect(10, 30 + dragonWing.angle, dragonWing.size - 5, 25);
        targetCtx.fillRect(50, 25 + dragonWing.angle, dragonWing.size, 30);
        targetCtx.fillRect(55, 30 + dragonWing.angle, dragonWing.size - 5, 25);

        targetCtx.fillStyle = tailColor;
        targetCtx.fillRect(60, 40, 15, 10);
        targetCtx.fillRect(70, 38, 8, 14);

        targetCtx.fillStyle = spikeColor;
        for(let i = 0; i < 4; i++) {
            targetCtx.fillRect(28 + i * 8, 28, 5, 8);
        }

        targetCtx.fillStyle = eyeColor;
        targetCtx.fillRect(20, 28, 7, 7);
        targetCtx.fillRect(33, 28, 7, 7);

        targetCtx.fillStyle = nostrilColor;
        targetCtx.fillRect(8, 30, 4, 4);
        targetCtx.fillRect(8, 36, 4, 4);

        if(frame === 1) {
            targetCtx.fillStyle = fireColor;
            targetCtx.fillRect(0, 28, 8, 8);
            targetCtx.fillStyle = fireCoreColor;
            targetCtx.fillRect(-5, 30, 8, 4);
        }
    }
};

function drawMonster(monster, x, y, scale = 1) {
    if(!monster) {
        return;
    }

    game.monsterAnimFrame += 0.1;
    const frame = Math.floor(game.monsterAnimFrame) % 3;
    const bounce = Math.sin(Date.now() / 200) * 2;

    monsterBufferCtx.clearRect(0, 0, MONSTER_CANVAS_SIZE, MONSTER_CANVAS_SIZE);
    const renderer = monsterRenderers[monster.type] || (monster.name ? monsterRenderers[monster.name.toLowerCase()] : null);

    if(renderer) {
        renderer(monsterBufferCtx, monster, frame, bounce, scale);
    } else {
        const bodyColor = monster.color || '#ffffff';
        const eyeColor = monster.eyes || '#000000';
        monsterBufferCtx.fillStyle = bodyColor;
        monsterBufferCtx.fillRect(20, 20, 40, 40);
        monsterBufferCtx.fillStyle = eyeColor;
        monsterBufferCtx.fillRect(30, 30, 6, 6);
        monsterBufferCtx.fillRect(44, 30, 6, 6);
    }

    const previousSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    ctx.save();
    let previousGlobalAlpha = ctx.globalAlpha;
    if(game.monsterHitFlash > 0) {
        ctx.globalAlpha = 0.65 + Math.sin(game.monsterHitFlash * 25) * 0.35;
        game.monsterHitFlash -= 0.05;
        if(game.monsterHitFlash < 0) {
            game.monsterHitFlash = 0;
        }
    }
    ctx.translate(x + 40, y + 40);
    ctx.scale(scale, scale);
    ctx.translate(-40, -40);

    const outlineColor = monster.outline || '#000000';
    const outlineOffsets = [
        '0px 0px',
        '1px 0px',
        '-1px 0px',
        '0px 1px',
        '0px -1px',
        '1px 1px',
        '-1px 1px',
        '1px -1px',
        '-1px -1px'
    ];
    const outlineFilter = outlineOffsets
        .map(offset => `drop-shadow(${offset} 0px ${outlineColor})`)
        .join(' ');

    ctx.save();
    ctx.filter = outlineFilter;
    ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(monsterBufferCanvas, 0, 0);
    ctx.restore();

    ctx.drawImage(monsterBufferCanvas, 0, 0);
    ctx.restore();

    ctx.imageSmoothingEnabled = previousSmoothing;
    ctx.globalAlpha = previousGlobalAlpha;
}

// Draw boss
function drawBoss(boss, x, y, scale = 1) {
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
        case 'tree': {
            // Ancient Dark Tree - gnarled trunk with torn roots and swaying branches
            const treeX = 100;
            const treeY = 140;
            const anim = game.bossAnimFrame;
            const bodyRock = Math.sin(anim * 1.2) * 4;

            ctx.save();
            ctx.translate(treeX, treeY);
            ctx.scale(0.8, 0.8);

            // Torn dangling roots - thick and fractal-branching
            ctx.strokeStyle = '#2a1f14';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const mainRoots = [
                { x: -35, baseAngle: Math.PI / 2, phase: 0 },
                { x: -15, baseAngle: Math.PI / 2 + 0.2, phase: 1.2 },
                { x: 5, baseAngle: Math.PI / 2 - 0.15, phase: 0.6 },
                { x: 20, baseAngle: Math.PI / 2 + 0.15, phase: 1.8 },
                { x: 35, baseAngle: Math.PI / 2 - 0.1, phase: 0.3 }
            ];

            // Recursive root drawing function with gnarled, bent segments
            const drawRoot = (startX, startY, angle, length, thickness, depth, phase) => {
                if (depth <= 0 || length < 8) return;

                const sway = Math.sin(anim * 1.8 + phase) * (0.15 / (4 - depth));
                const swayX = Math.sin(anim * 1.5 + phase) * (12 / (4 - depth));

                // Draw bent root with multiple segments instead of straight line
                const segments = 3;
                ctx.lineWidth = thickness;
                ctx.beginPath();
                ctx.moveTo(startX, startY);

                let currentX = startX;
                let currentY = startY;
                let currentAngle = angle;

                for (let s = 0; s < segments; s++) {
                    // Add bending variation to each segment
                    const bendVariation = Math.sin(phase * 2 + s * 1.5) * 0.25 + sway;
                    currentAngle += bendVariation;

                    const segLength = length / segments;
                    const nextX = currentX + Math.cos(currentAngle) * segLength + (s === segments - 1 ? swayX : swayX * (s / segments));
                    const nextY = currentY + Math.sin(currentAngle) * segLength;

                    // Use quadratic curve for organic bend
                    const midX = (currentX + nextX) / 2 + Math.sin(phase + s) * 3;
                    const midY = (currentY + nextY) / 2;
                    ctx.quadraticCurveTo(midX, midY, nextX, nextY);

                    currentX = nextX;
                    currentY = nextY;
                }
                ctx.stroke();

                const endX = currentX;
                const endY = currentY;

                // Draw root tip knot
                if (depth === 1) {
                    ctx.fillStyle = '#1a140f';
                    ctx.beginPath();
                    ctx.arc(endX, endY, thickness * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Branch into smaller roots
                if (depth > 1) {
                    const numBranches = 2;
                    for (let b = 0; b < numBranches; b++) {
                        const branchAngle = currentAngle + (b === 0 ? -0.3 : 0.3) + Math.sin(anim + phase + b) * 0.2;
                        const branchLength = length * 0.65;
                        const branchThickness = thickness * 0.6;
                        drawRoot(endX, endY, branchAngle, branchLength, branchThickness, depth - 1, phase + b * 0.5);
                    }
                }
            };

            // Draw all main roots
            for (const root of mainRoots) {
                drawRoot(root.x, 50, root.baseAngle, 55, 12, 3, root.phase);
            }

            // Main dark trunk - rough, gnarled shape (extended)
            ctx.fillStyle = '#352a1f';
            ctx.beginPath();
            ctx.moveTo(-40, 50);
            ctx.lineTo(-45 + bodyRock * 0.2, 20);
            ctx.lineTo(-48 + bodyRock * 0.3, -20);
            ctx.lineTo(-45 + bodyRock * 0.4, -50);
            ctx.lineTo(-42 + bodyRock * 0.5, -80);
            ctx.lineTo(-30 + bodyRock * 0.7, -110);
            ctx.lineTo(0 + bodyRock, -120);
            ctx.lineTo(30 + bodyRock * 0.7, -110);
            ctx.lineTo(42 + bodyRock * 0.5, -80);
            ctx.lineTo(45 + bodyRock * 0.4, -50);
            ctx.lineTo(48 + bodyRock * 0.3, -20);
            ctx.lineTo(45 + bodyRock * 0.2, 20);
            ctx.lineTo(40, 50);
            ctx.closePath();
            ctx.fill();

            // Bark texture - dark cracks (extended along longer trunk)
            ctx.strokeStyle = '#1a140f';
            ctx.lineWidth = 3;
            for(let i = 0; i < 12; i++) {
                const crackY = -105 + i * 15;
                const crackSway = Math.sin(anim * 1.2 + i * 0.5) * 3;
                ctx.beginPath();
                ctx.moveTo(-35 + bodyRock * 0.6, crackY);
                ctx.lineTo(-20 + crackSway + bodyRock * 0.6, crackY + 10);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(35 + bodyRock * 0.6, crackY);
                ctx.lineTo(20 - crackSway + bodyRock * 0.6, crackY + 10);
                ctx.stroke();
            }

            // Twisted, gnarled branches - multiple segments for aged appearance
            const branches = [
                { startX: -42, startY: -90, baseAngle: -0.6, segments: 3, phase: 0 },
                { startX: -35, startY: -65, baseAngle: -0.5, segments: 3, phase: 0.8 },
                { startX: 42, startY: -90, baseAngle: 0.6, segments: 3, phase: 1.2 },
                { startX: 35, startY: -65, baseAngle: 0.5, segments: 3, phase: 1.9 },
                { startX: -20, startY: -105, baseAngle: -0.3, segments: 2, phase: 0.5 },
                { startX: 20, startY: -105, baseAngle: 0.3, segments: 2, phase: 1.5 }
            ];

            ctx.strokeStyle = '#2a1f14';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for(const branch of branches) {
                const rockX = bodyRock * 0.7;
                const rockY = bodyRock * 0.3;

                let currentX = branch.startX + rockX;
                let currentY = branch.startY + rockY;
                let currentAngle = branch.baseAngle;

                // Draw thick base segment (3x stronger)
                ctx.lineWidth = 42;
                ctx.beginPath();
                ctx.moveTo(currentX, currentY);

                // Multiple segments with varying angles
                for(let seg = 0; seg < branch.segments; seg++) {
                    const segmentWave = Math.sin(anim * 2.3 + branch.phase + seg * 0.5) * 0.25;
                    const angleVariation = (Math.sin(seg * 2.1) * 0.4) + segmentWave;
                    currentAngle += angleVariation;

                    const segLength = 25 - seg * 3;
                    const nextX = currentX + Math.cos(currentAngle) * segLength;
                    const nextY = currentY + Math.sin(currentAngle) * segLength;

                    ctx.lineTo(nextX, nextY);
                    currentX = nextX;
                    currentY = nextY;

                    // Taper the branch (3x stronger)
                    ctx.lineWidth = Math.max(12, 42 - seg * 12);
                }
                ctx.stroke();

                // Add smaller twigs at the end (also thicker)
                const numTwigs = 2;
                for(let t = 0; t < numTwigs; t++) {
                    const twigAngle = currentAngle + (t === 0 ? -0.4 : 0.4) + Math.sin(anim * 3 + branch.phase + t) * 0.3;
                    const twigLength = 12;

                    ctx.lineWidth = 9;
                    ctx.beginPath();
                    ctx.moveTo(currentX, currentY);
                    ctx.lineTo(
                        currentX + Math.cos(twigAngle) * twigLength,
                        currentY + Math.sin(twigAngle) * twigLength
                    );
                    ctx.stroke();
                }
            }

            // Glowing yellow eyes
            const eyeGlow = Math.sin(anim * 4) * 0.3 + 0.7;
            const pupilMove = Math.sin(anim * 2) * 3;
            const eyeY = -35;

            // Left eye
            ctx.fillStyle = `rgba(255, 220, 50, ${eyeGlow})`;
            ctx.beginPath();
            ctx.ellipse(-18 + bodyRock * 0.6, eyeY, 12, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            // Eye glow aura
            ctx.fillStyle = `rgba(255, 220, 50, ${eyeGlow * 0.3})`;
            ctx.beginPath();
            ctx.ellipse(-18 + bodyRock * 0.6, eyeY, 18, 20, 0, 0, Math.PI * 2);
            ctx.fill();

            // Right eye
            ctx.fillStyle = `rgba(255, 220, 50, ${eyeGlow})`;
            ctx.beginPath();
            ctx.ellipse(18 + bodyRock * 0.6, eyeY, 12, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            // Eye glow aura
            ctx.fillStyle = `rgba(255, 220, 50, ${eyeGlow * 0.3})`;
            ctx.beginPath();
            ctx.ellipse(18 + bodyRock * 0.6, eyeY, 18, 20, 0, 0, Math.PI * 2);
            ctx.fill();

            // Dark pupils
            ctx.fillStyle = '#1a0f00';
            ctx.beginPath();
            ctx.ellipse(-18 + bodyRock * 0.6 + pupilMove, eyeY, 5, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(18 + bodyRock * 0.6 + pupilMove, eyeY, 5, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Wood grain highlights
            ctx.fillStyle = 'rgba(75, 60, 45, 0.3)';
            for(let i = 0; i < 7; i++) {
                const grainY = -100 + i * 25;
                ctx.fillRect(-25 + bodyRock * 0.6, grainY, 50, 3);
            }

            ctx.restore();
            break;
        }

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

        case 'ice': {
            const bob = Math.sin(game.bossAnimFrame * 1.4) * 3;
            const shardSway = Math.sin(game.bossAnimFrame * 2) * 4;
            const baseColor = '#b6e4ff';
            const shadowColor = '#7fb5d6';
            const highlightColor = '#e0f6ff';

            const cubes = [
                { x: 40, y: 130, w: 60, h: 50 },
                { x: 100, y: 120, w: 60, h: 60 },
                { x: 60, y: 80, w: 55, h: 55 },
                { x: 110, y: 70, w: 45, h: 50 },
                { x: 70, y: 45, w: 40, h: 40 },
                { x: 115, y: 35, w: 36, h: 38 }
            ];

            for(let i = 0; i < cubes.length; i++) {
                const cube = cubes[i];
                const breathePhase = Math.sin(game.bossAnimFrame * 1.2 + i * 0.8) * 3;
                const xShift = Math.sin(game.bossAnimFrame * 1.5 + i * 1.2) * 2;
                const yShift = Math.sin(game.bossAnimFrame * 1.3 + i * 0.9) * 2;

                const xOffset = cube.x + xShift;
                const yOffset = cube.y + bob + yShift + breathePhase;

                ctx.fillStyle = baseColor;
                ctx.fillRect(xOffset, yOffset, cube.w, cube.h);

                ctx.fillStyle = highlightColor;
                ctx.fillRect(xOffset, yOffset, cube.w, 6);
                ctx.fillRect(xOffset, yOffset, 6, cube.h);

                ctx.fillStyle = shadowColor;
                ctx.fillRect(xOffset + cube.w - 6, yOffset, 6, cube.h);
                ctx.fillRect(xOffset, yOffset + cube.h - 6, cube.w, 6);
            }

            // Spojené hrany mezi kvádry pro 3D dojem (animované s kostkami)
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            const edge1Shift = Math.sin(game.bossAnimFrame * 1.5 + 1 * 1.2) * 2;
            const edge2Shift = Math.sin(game.bossAnimFrame * 1.5 + 2 * 1.2) * 2;
            ctx.fillRect(95 + edge1Shift, 120 + bob, 10, 55);
            ctx.fillRect(85 + edge2Shift, 95 + bob, 12, 40);

            // Rampouchy animované do stran
            const icicles = [
                { x: 55, baseY: 180, length: 25 },
                { x: 85, baseY: 185, length: 30 },
                { x: 125, baseY: 180, length: 28 },
                { x: 150, baseY: 170, length: 35 }
            ];

            ctx.fillStyle = '#dff2ff';
            for(let i = 0; i < icicles.length; i++) {
                const shard = icicles[i];
                const sway = Math.sin(game.bossAnimFrame * 2.2 + i) * 2 + shardSway;
                ctx.beginPath();
                ctx.moveTo(shard.x, shard.baseY + bob);
                ctx.lineTo(shard.x + sway, shard.baseY + bob + shard.length);
                ctx.lineTo(shard.x + 4, shard.baseY + bob);
                ctx.closePath();
                ctx.fill();
            }

            // Oči na horních kvádrech (animované s kostkami)
            const eyeGlint = Math.sin(game.bossAnimFrame * 4) * 0.4 + 0.6;
            const eye1XShift = Math.sin(game.bossAnimFrame * 1.5 + 2 * 1.2) * 2;
            const eye1YShift = Math.sin(game.bossAnimFrame * 1.3 + 2 * 0.9) * 2;
            const eye1Breathe = Math.sin(game.bossAnimFrame * 1.2 + 2 * 0.8) * 3;
            const eye2XShift = Math.sin(game.bossAnimFrame * 1.5 + 3 * 1.2) * 2;
            const eye2YShift = Math.sin(game.bossAnimFrame * 1.3 + 3 * 0.9) * 2;
            const eye2Breathe = Math.sin(game.bossAnimFrame * 1.2 + 3 * 0.8) * 3;

            ctx.fillStyle = '#0f1a2e';
            ctx.fillRect(80 + eye1XShift, 60 + bob + eye1YShift + eye1Breathe, 10, 10);
            ctx.fillRect(127 + eye2XShift, 52 + bob + eye2YShift + eye2Breathe, 10, 10);

            ctx.fillStyle = `rgba(202, 238, 255, ${0.7 + eyeGlint * 0.3})`;
            ctx.fillRect(82 + eye1XShift, 62 + bob + eye1YShift + eye1Breathe, 6, 6);
            ctx.fillRect(129 + eye2XShift, 54 + bob + eye2YShift + eye2Breathe, 6, 6);

            // Zmrzlá elementární koule uprostřed (animovaná s kostkami)
            const orbXShift = Math.sin(game.bossAnimFrame * 1.5 + 1.5 * 1.2) * 2;
            const orbYShift = Math.sin(game.bossAnimFrame * 1.3 + 1.5 * 0.9) * 2;
            const orbBreathe = Math.sin(game.bossAnimFrame * 1.2 + 1.5 * 0.8) * 3;
            const orbX = 105 + orbXShift;
            const orbY = 110 + bob + orbYShift + orbBreathe;
            const pulse = Math.sin(game.bossAnimFrame * 3) * 0.15 + 0.85;
            const orbRadius = 26;
            const gradient = ctx.createRadialGradient(orbX, orbY, 4, orbX, orbY, orbRadius);
            gradient.addColorStop(0, `rgba(255,255,255,${0.95 * pulse})`);
            gradient.addColorStop(0.5, `rgba(173,224,255,${0.7 * pulse})`);
            gradient.addColorStop(1, 'rgba(90,170,220,0.25)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(orbX, orbY, orbRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(orbX, orbY, orbRadius + 6 + Math.sin(game.bossAnimFrame * 2) * 2, 0, Math.PI * 2);
            ctx.stroke();
            break;
        }

        case 'fire':
        case 'lava': {
            if(boss.type === 'lava') {
                // Lava Beast - massive quadruped beast, NOT a dragon
                const beastX = 100;
                const beastY = 140 + breathe;
                const anim = game.bossAnimFrame;
                const breathPulse = Math.sin(anim * 1.8) * 8;
                const legSway = Math.sin(anim * 2.5);

                ctx.save();
                ctx.translate(beastX, beastY);
                ctx.scale(-1, 1);

                // Four massive legs
                const legs = [
                    { x: -40, phase: 0 },
                    { x: -15, phase: Math.PI },
                    { x: 15, phase: 0 },
                    { x: 40, phase: Math.PI }
                ];

                for(const leg of legs) {
                    const legMove = Math.sin(anim * 2 + leg.phase) * 5;

                    // Leg
                    ctx.fillStyle = '#8b1a00';
                    ctx.fillRect(leg.x - 6, 30 + legMove, 12, 50);
                    ctx.fillRect(leg.x - 8, 75 + legMove, 16, 15);

                    // Lava cracks on legs
                    ctx.fillStyle = '#ff4500';
                    ctx.globalAlpha = 0.7 + Math.sin(anim * 3 + leg.x) * 0.3;
                    ctx.fillRect(leg.x - 2, 40 + legMove, 4, 35);
                    ctx.globalAlpha = 1;
                }

                // Massive body - boulder-like, irregular shape
                ctx.fillStyle = '#5a0f00';
                ctx.beginPath();
                ctx.moveTo(-55, 30);
                ctx.lineTo(-60, 0);
                ctx.lineTo(-50, -25);
                ctx.lineTo(-30, -35);
                ctx.lineTo(0, -40 + breathPulse);
                ctx.lineTo(30, -35);
                ctx.lineTo(50, -25);
                ctx.lineTo(60, 0);
                ctx.lineTo(55, 30);
                ctx.closePath();
                ctx.fill();

                // Molten core cracks throughout body
                ctx.strokeStyle = '#ff6a00';
                ctx.lineWidth = 6;
                ctx.globalAlpha = 0.8 + Math.sin(anim * 4) * 0.2;
                ctx.beginPath();
                ctx.moveTo(-45, 25);
                ctx.lineTo(-35, -10);
                ctx.lineTo(-15, -25);
                ctx.lineTo(5, -30 + breathPulse);
                ctx.lineTo(25, -20);
                ctx.lineTo(40, -5);
                ctx.lineTo(50, 20);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(-50, 10);
                ctx.lineTo(-20, 15);
                ctx.lineTo(10, 10);
                ctx.lineTo(45, 15);
                ctx.stroke();
                ctx.globalAlpha = 1;

                // Glowing lava pools/spots
                const lavaSpots = [
                    { x: -35, y: -15, r: 12 },
                    { x: 0, y: -25 + breathPulse, r: 15 },
                    { x: 30, y: -10, r: 10 },
                    { x: -15, y: 5, r: 8 },
                    { x: 20, y: 10, r: 9 }
                ];

                for(const spot of lavaSpots) {
                    const spotGradient = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, spot.r);
                    const intensity = Math.sin(anim * 3 + spot.x) * 0.3 + 0.7;
                    spotGradient.addColorStop(0, `rgba(255, 255, 100, ${intensity})`);
                    spotGradient.addColorStop(0.4, `rgba(255, 100, 0, ${intensity * 0.8})`);
                    spotGradient.addColorStop(1, 'rgba(139, 26, 0, 0)');
                    ctx.fillStyle = spotGradient;
                    ctx.beginPath();
                    ctx.arc(spot.x, spot.y, spot.r, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Rocky spikes/horns on back
                ctx.fillStyle = '#3d0900';
                const spikes = [-40, -20, 0, 20, 40];
                for(let i = 0; i < spikes.length; i++) {
                    const spikeX = spikes[i];
                    const spikeHeight = 15 + Math.sin(anim * 1.5 + i) * 5;
                    ctx.beginPath();
                    ctx.moveTo(spikeX - 8, -35);
                    ctx.lineTo(spikeX, -35 - spikeHeight);
                    ctx.lineTo(spikeX + 8, -35);
                    ctx.closePath();
                    ctx.fill();

                    // Glowing tip
                    ctx.fillStyle = '#ff4500';
                    ctx.globalAlpha = 0.6 + Math.sin(anim * 4 + i) * 0.4;
                    ctx.beginPath();
                    ctx.arc(spikeX, -35 - spikeHeight, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                    ctx.fillStyle = '#3d0900';
                }

                // Massive head
                ctx.fillStyle = '#6b1500';
                ctx.beginPath();
                ctx.moveTo(55, -15);
                ctx.lineTo(90, -20);
                ctx.lineTo(105, -5);
                ctx.lineTo(100, 15);
                ctx.lineTo(80, 25);
                ctx.lineTo(60, 20);
                ctx.closePath();
                ctx.fill();

                // Jaw with lava dripping
                const jawOpen = Math.abs(Math.sin(anim * 1.5)) * 15;
                ctx.fillStyle = '#5a0f00';
                ctx.beginPath();
                ctx.moveTo(80, 25);
                ctx.lineTo(95, 25 + jawOpen);
                ctx.lineTo(105, 20 + jawOpen);
                ctx.lineTo(100, 15);
                ctx.closePath();
                ctx.fill();

                // Mouth interior (lava glow)
                ctx.fillStyle = '#ff6a00';
                ctx.globalAlpha = 0.8;
                ctx.fillRect(82, 25, 18, jawOpen);
                ctx.globalAlpha = 1;

                // Teeth
                ctx.fillStyle = '#2d1a00';
                for(let t = 0; t < 4; t++) {
                    ctx.fillRect(83 + t * 5, 25, 3, 8);
                    ctx.fillRect(85 + t * 5, 25 + jawOpen - 8, 3, 8);
                }

                // Eyes - glowing orange
                const eyeGlow = Math.sin(anim * 5) * 0.3 + 0.7;
                ctx.fillStyle = `rgba(255, 140, 0, ${eyeGlow})`;
                ctx.fillRect(70, -8, 12, 10);
                ctx.fillRect(88, -10, 12, 10);

                // Pupil
                ctx.fillStyle = '#330000';
                ctx.fillRect(73, -5, 6, 6);
                ctx.fillRect(91, -7, 6, 6);

                // Horn/tusk
                ctx.fillStyle = '#2d1a00';
                ctx.beginPath();
                ctx.moveTo(105, -5);
                ctx.lineTo(120, -15);
                ctx.lineTo(115, -8);
                ctx.closePath();
                ctx.fill();

                // Lava dripping from mouth
                ctx.fillStyle = '#ff4500';
                for(let d = 0; d < 3; d++) {
                    const dripY = 25 + jawOpen + ((anim * 4 + d * 1.5) % 2) * 25;
                    const dripX = 85 + d * 8;
                    if((anim * 4 + d * 1.5) % 2 < 1) {
                        ctx.globalAlpha = 1 - ((anim * 4 + d * 1.5) % 2) / 2;
                        ctx.fillRect(dripX, dripY - 10, 3, 15);
                        ctx.beginPath();
                        ctx.arc(dripX + 1.5, dripY + 5, 3, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalAlpha = 1;
                    }
                }

                // Heat distortion particles rising
                ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
                for(let h = 0; h < 15; h++) {
                    const heatY = -40 - ((anim * 3 + h * 10) % 100);
                    const heatX = -50 + h * 8 + Math.sin(anim * 2 + h) * 10;
                    const size = 4 + Math.sin(anim * 4 + h) * 3;
                    ctx.globalAlpha = 0.3 - (Math.abs(heatY + 40) / 100) * 0.3;
                    ctx.fillRect(heatX, heatY, size, size);
                }
                ctx.globalAlpha = 1;

                ctx.restore();
            } else {
                const isStageTwo = game.stage === 2;

                ctx.fillStyle = isStageTwo ? '#2B0000' : '#8b0000';
                ctx.fillRect(40, 60 + breathe, 120, 140);

                const crackGlow = Math.sin(game.bossAnimFrame * 4) * 0.5 + 0.5;
                ctx.fillStyle = '#FF4500';
                ctx.globalAlpha = 0.7 + crackGlow * 0.3;
                ctx.fillRect(60, 70 + breathe, 8, 120);
                ctx.fillRect(90, 80 + breathe, 6, 110);
                ctx.fillRect(120, 75 + breathe, 8, 115);
                ctx.fillRect(50, 100 + breathe, 100, 6);
                ctx.fillRect(55, 140 + breathe, 90, 8);
                ctx.globalAlpha = 1;

                ctx.fillStyle = '#FFAA00';
                ctx.fillRect(85, 110 + breathe, 30, 40);
                ctx.fillRect(75, 120 + breathe, 50, 20);

                const limbColor = isStageTwo ? '#3B0000' : '#8b0000';
                ctx.fillStyle = limbColor;
                ctx.fillRect(20, 90 + breathe + leftBranch, 25, 80);
                ctx.fillRect(155, 90 + breathe + rightBranch, 25, 80);

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

                ctx.fillStyle = limbColor;
                ctx.fillRect(60, 30 + breathe, 80, 40);

                ctx.fillStyle = '#FF4500';
                ctx.fillRect(50, 20 + breathe, 15, 25);
                ctx.fillRect(135, 20 + breathe, 15, 25);
                ctx.fillRect(45, 15 + breathe, 10, 15);
                ctx.fillRect(145, 15 + breathe, 10, 15);

                const eyeGlow = Math.sin(game.bossAnimFrame * 5) * 0.3 + 0.7;
                ctx.fillStyle = '#FFFF00';
                ctx.globalAlpha = eyeGlow;
                ctx.fillRect(75, 45 + breathe, 15, 15);
                ctx.fillRect(110, 45 + breathe, 15, 15);

                ctx.fillStyle = '#FF0000';
                ctx.fillRect(80, 50 + breathe, 5, 5);
                ctx.fillRect(115, 50 + breathe, 5, 5);
                ctx.globalAlpha = 1;

                ctx.fillStyle = '#FF6600';
                ctx.globalAlpha = 0.8;
                const mouthOpen = Math.abs(Math.sin(game.bossAnimFrame * 2)) * 15;
                ctx.fillRect(75, 60 + breathe, 50, 8);
                ctx.fillRect(80, 68 + breathe, 40, mouthOpen);
                ctx.globalAlpha = 1;

                for(let i = 0; i < 5; i++) {
                    const flamePhase = (game.bossAnimFrame * 3 + i * 0.7) % 1;
                    if(flamePhase < 0.6) {
                        const flameX = 50 + i * 25;
                        const flameHeight = (1 - flamePhase / 0.6) * 30;
                        const flameY = 60 + breathe - flameHeight;

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
            }
            break;
        }

        case 'shadow': {
            // Shadow Demon - completely redesigned as a multi-armed wraith
            const bodyX = 100;
            const bodyY = 140 + breathe;
            const anim = game.bossAnimFrame;
            const pulse = Math.sin(anim * 1.5) * 0.2 + 0.8;
            const armWave = Math.sin(anim * 2);

            ctx.save();
            ctx.translate(bodyX, bodyY);

            // Multiple shadow tendrils emanating from bottom
            ctx.fillStyle = 'rgba(20, 20, 20, 0.6)';
            for(let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const waveOffset = Math.sin(anim * 1.3 + i) * 15;
                ctx.beginPath();
                ctx.moveTo(0, 20);
                ctx.quadraticCurveTo(
                    Math.cos(angle) * 40,
                    40 + waveOffset,
                    Math.cos(angle) * 60,
                    90 + waveOffset
                );
                ctx.lineTo(Math.cos(angle) * 55, 95 + waveOffset);
                ctx.quadraticCurveTo(
                    Math.cos(angle) * 35,
                    45 + waveOffset,
                    0, 25
                );
                ctx.closePath();
                ctx.fill();
            }

            // Main torso - jagged, angular shape
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.moveTo(-25, 20);
            ctx.lineTo(-35, -10);
            ctx.lineTo(-20, -40);
            ctx.lineTo(0, -50);
            ctx.lineTo(20, -40);
            ctx.lineTo(35, -10);
            ctx.lineTo(25, 20);
            ctx.closePath();
            ctx.fill();

            // Inner core with pulsing dark energy
            const coreGradient = ctx.createRadialGradient(0, -15, 5, 0, -15, 30);
            coreGradient.addColorStop(0, `rgba(80, 80, 80, ${pulse})`);
            coreGradient.addColorStop(1, 'rgba(30, 30, 30, 0)');
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(0, -15, 30, 0, Math.PI * 2);
            ctx.fill();

            // Four demonic arms
            const arms = [
                { angle: -0.8, length: 70, side: -1 },
                { angle: -0.3, length: 65, side: -1 },
                { angle: 0.3, length: 65, side: 1 },
                { angle: 0.8, length: 70, side: 1 }
            ];

            ctx.strokeStyle = '#2d2d2d';
            ctx.lineWidth = 8;
            for(let i = 0; i < arms.length; i++) {
                const arm = arms[i];
                const wave = Math.sin(anim * 2 + i * 0.5) * 0.3;

                ctx.beginPath();
                ctx.moveTo(arm.side * 25, -20);
                const midX = arm.side * 50;
                const midY = -10 + Math.sin(anim * 1.8 + i) * 15;
                ctx.quadraticCurveTo(midX, midY,
                    arm.side * 80, 10 + Math.sin(anim * 2.2 + i) * 20);
                ctx.stroke();

                // Clawed hands
                ctx.fillStyle = '#3d3d3d';
                const handX = arm.side * 80;
                const handY = 10 + Math.sin(anim * 2.2 + i) * 20;
                for(let c = 0; c < 3; c++) {
                    ctx.beginPath();
                    ctx.moveTo(handX + arm.side * c * 5, handY);
                    ctx.lineTo(handX + arm.side * (c * 5 + 8), handY + 15);
                    ctx.lineTo(handX + arm.side * (c * 5 + 5), handY + 15);
                    ctx.lineTo(handX + arm.side * (c * 5 + 2), handY);
                    ctx.closePath();
                    ctx.fill();
                }
            }

            // Skull-like head
            ctx.fillStyle = '#2d2d2d';
            ctx.beginPath();
            ctx.ellipse(0, -60, 22, 25, 0, 0, Math.PI * 2);
            ctx.fill();

            // Demonic horns - curved upward
            ctx.fillStyle = '#0a0612';
            ctx.beginPath();
            ctx.moveTo(-18, -75);
            ctx.quadraticCurveTo(-35, -90, -30, -105);
            ctx.lineTo(-25, -103);
            ctx.quadraticCurveTo(-30, -88, -15, -73);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(18, -75);
            ctx.quadraticCurveTo(35, -90, 30, -105);
            ctx.lineTo(25, -103);
            ctx.quadraticCurveTo(30, -88, 15, -73);
            ctx.closePath();
            ctx.fill();

            // Glowing violet eyes
            const eyeGlow = Math.sin(anim * 4) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(180, 180, 180, ${eyeGlow})`;
            ctx.fillRect(-14, -65, 10, 12);
            ctx.fillRect(4, -65, 10, 12);

            // Eye glow aura
            ctx.fillStyle = `rgba(180, 180, 180, ${eyeGlow * 0.3})`;
            ctx.beginPath();
            ctx.arc(-9, -59, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(9, -59, 12, 0, Math.PI * 2);
            ctx.fill();

            // Jagged mouth
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.moveTo(-10, -45);
            for(let i = 0; i <= 5; i++) {
                const x = -10 + i * 4;
                const y = -45 + (i % 2 === 0 ? 0 : 5);
                ctx.lineTo(x, y);
            }
            ctx.lineTo(10, -45);
            ctx.lineTo(10, -42);
            ctx.lineTo(-10, -42);
            ctx.closePath();
            ctx.fill();

            // Floating shadow particles
            ctx.fillStyle = 'rgba(45, 45, 45, 0.7)';
            for(let i = 0; i < 12; i++) {
                const particleAngle = (anim * 0.8 + i * 0.5) % (Math.PI * 2);
                const radius = 70 + Math.sin(anim * 2 + i) * 10;
                const px = Math.cos(particleAngle) * radius;
                const py = -30 + Math.sin(particleAngle) * radius * 0.8;
                const pSize = 3 + Math.sin(anim * 3 + i) * 2;
                ctx.globalAlpha = 0.4 + Math.sin(anim * 2 + i) * 0.3;
                ctx.fillRect(px - pSize/2, py - pSize/2, pSize, pSize);
            }
            ctx.globalAlpha = 1;

            ctx.restore();
            break;
        }

        case 'serpent': {
            const segmentCount = 10;
            const wavePhase = game.bossAnimFrame * 1.8;
            const amplitude = 20 + Math.sin(game.bossAnimFrame * 1.1) * 6;
            const baseX = 30;
            const baseY = 150 + breathe;

            const spine = [];
            for(let i = 0; i < segmentCount; i++) {
                const t = i / (segmentCount - 1);
                const offsetX = t * 140;
                const wave = Math.sin(wavePhase + t * Math.PI * 1.5);
                const x = baseX + offsetX;
                const y = baseY + wave * amplitude;
                spine.push({ x, y, t });
            }

            // Energetická linka pod tělem
            ctx.save();
            ctx.strokeStyle = 'rgba(120, 235, 255, 0.28)';
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(spine[0].x, spine[0].y);
            for(let i = 1; i < spine.length; i++) {
                ctx.lineTo(spine[i].x, spine[i].y);
            }
            ctx.stroke();
            ctx.restore();

            // Krystalické segmenty
            for(let i = spine.length - 1; i >= 0; i--) {
                const { x, y, t } = spine[i];
                const size = 26 - t * 10;
                const tilt = Math.sin(wavePhase + t * Math.PI * 1.5 + i * 0.2) * 0.2;

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(tilt);

                const gradient = ctx.createLinearGradient(-size, -size, size, size);
                gradient.addColorStop(0, 'rgba(80, 220, 255, 0.9)');
                gradient.addColorStop(0.35, 'rgba(140, 245, 255, 0.95)');
                gradient.addColorStop(0.7, 'rgba(50, 170, 235, 0.85)');
                gradient.addColorStop(1, 'rgba(20, 90, 160, 0.9)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.lineTo(size * 0.75, 0);
                ctx.lineTo(0, size);
                ctx.lineTo(-size * 0.75, 0);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = 'rgba(200, 255, 255, 0.6)';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.moveTo(0, -size + 4);
                ctx.lineTo(size * 0.45, -2);
                ctx.lineTo(0, 6);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            }

            // Hlava
            const head = spine[0];
            ctx.save();
            ctx.translate(head.x, head.y);
            const headTilt = Math.sin(wavePhase) * 0.25;
            ctx.rotate(headTilt);

            const headLength = 36;
            const headGradient = ctx.createLinearGradient(-headLength, -headLength, headLength, headLength);
            headGradient.addColorStop(0, 'rgba(150, 255, 255, 0.95)');
            headGradient.addColorStop(0.4, 'rgba(90, 210, 255, 0.95)');
            headGradient.addColorStop(1, 'rgba(30, 110, 190, 0.9)');

            ctx.fillStyle = headGradient;
            ctx.beginPath();
            ctx.moveTo(0, -headLength * 0.9);
            ctx.lineTo(headLength * 0.9, -4);
            ctx.lineTo(0, headLength * 0.9);
            ctx.lineTo(-headLength * 0.75, -2);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(220, 255, 255, 0.7)';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Oči
            ctx.fillStyle = 'rgba(120, 200, 255, 0.95)';
            const eyeOffsetY = -10;
            ctx.beginPath();
            ctx.ellipse(8, eyeOffsetY, 4, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(18, eyeOffsetY - 4, 4, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#0b1f3f';
            ctx.beginPath();
            ctx.arc(8, eyeOffsetY, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(18, eyeOffsetY - 4, 2, 0, Math.PI * 2);
            ctx.fill();

            // Záře očí
            ctx.fillStyle = 'rgba(90, 220, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(8, eyeOffsetY, 6 + Math.sin(game.bossAnimFrame * 4) * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(18, eyeOffsetY - 4, 6 + Math.cos(game.bossAnimFrame * 4) * 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            // Chvost: pár třpytivých částic
            const tail = spine[spine.length - 1];
            ctx.save();
            ctx.globalAlpha = 0.6;
            for(let i = 0; i < 3; i++) {
                const sparklePhase = (wavePhase * 2 + i * 1.3) % (Math.PI * 2);
                const sparkleX = tail.x + Math.cos(sparklePhase) * 12;
                const sparkleY = tail.y + Math.sin(sparklePhase) * 12;
                ctx.fillStyle = 'rgba(170, 240, 255, 0.6)';
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, 3 + Math.sin(wavePhase + i) * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            break;
        }

        case 'bird': {
            const flap = Math.sin(game.bossAnimFrame * 3.2);
            const bodyY = 140 + breathe;
            const bodyX = 100;

            ctx.save();
            ctx.translate(bodyX, bodyY);
            ctx.scale(-1, 1);

            // Tělo a hlava
            const bodyGradient = ctx.createRadialGradient(0, -20, 10, 0, 0, 80);
            bodyGradient.addColorStop(0, '#3c4b6f');
            bodyGradient.addColorStop(0.6, '#253550');
            bodyGradient.addColorStop(1, '#121a29');
            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.ellipse(0, 20, 42, 65, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2c3d5c';
            ctx.beginPath();
            ctx.ellipse(0, -30, 26, 22, 0, 0, Math.PI * 2);
            ctx.fill();

            // Oči
            ctx.fillStyle = '#ffd93b';
            ctx.beginPath();
            ctx.ellipse(-10, -34, 5, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(10, -34, 5, 7, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#461f00';
            ctx.beginPath();
            ctx.arc(-10, -34, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(10, -34, 2, 0, Math.PI * 2);
            ctx.fill();

            // Zobák
            ctx.fillStyle = '#ffb347';
            ctx.beginPath();
            ctx.moveTo(0, -28);
            ctx.lineTo(20, -22 + flap * 2);
            ctx.lineTo(0, -14);
            ctx.closePath();
            ctx.fill();

            // Křídla
            ctx.save();
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = '#314666';
            for(const dir of [-1, 1]) {
                ctx.save();
                ctx.scale(dir, 1);
                ctx.rotate(flap * 0.35 + dir * 0.12);
                ctx.beginPath();
                ctx.moveTo(-10, -10);
                ctx.quadraticCurveTo(-110, -40, -140, 20);
                ctx.quadraticCurveTo(-90, 50, -20, 30);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
            ctx.restore();

            // Drápy
            ctx.fillStyle = '#ffb347';
            for(const offset of [-18, 18]) {
                ctx.beginPath();
                ctx.moveTo(offset, 70);
                ctx.lineTo(offset + 6, 90);
                ctx.lineTo(offset - 6, 90);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();

            // Blesky kolem ptáka
            const lightningAnchors = [
                { x: bodyX - 80, y: bodyY - 40 },
                { x: bodyX + 90, y: bodyY - 20 },
                { x: bodyX - 70, y: bodyY + 60 },
                { x: bodyX + 80, y: bodyY + 70 }
            ];

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for(let i = 0; i < lightningAnchors.length; i++) {
                const anchor = lightningAnchors[i];
                const targetX = bodyX + Math.sin(game.bossAnimFrame * 2 + i) * 20;
                const targetY = bodyY + Math.cos(game.bossAnimFrame * 1.8 + i) * 25 - 10;
                const segments = 5;

                ctx.lineWidth = 4;
                ctx.strokeStyle = 'rgba(255, 255, 140, 0.85)';
                ctx.beginPath();
                ctx.moveTo(anchor.x, anchor.y);
                for(let s = 1; s <= segments; s++) {
                    const t = s / segments;
                    const jitterX = (Math.random() - 0.5) * 14;
                    const jitterY = (Math.random() - 0.5) * 14;
                    const x = anchor.x + (targetX - anchor.x) * t + jitterX;
                    const y = anchor.y + (targetY - anchor.y) * t + jitterY;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();

                ctx.lineWidth = 2;
                ctx.strokeStyle = 'rgba(150, 220, 255, 0.8)';
                ctx.beginPath();
                ctx.moveTo(anchor.x, anchor.y);
                for(let s = 1; s <= segments; s++) {
                    const t = s / segments;
                    const jitterX = (Math.random() - 0.5) * 10;
                    const jitterY = (Math.random() - 0.5) * 10;
                    const x = anchor.x + (targetX - anchor.x) * t + jitterX;
                    const y = anchor.y + (targetY - anchor.y) * t + jitterY;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            ctx.restore();

            break;
        }

        case 'necro': {
            // Necromancer - Kingdom of Death boss
            const float = Math.sin(game.bossAnimFrame * 1.5) * 8;
            const cloakWave = Math.sin(game.bossAnimFrame * 2) * 6;
            const staffPulse = Math.sin(game.bossAnimFrame * 3) * 0.3 + 0.7;

            // Floating cloak base
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.moveTo(100, 80 + float);
            ctx.lineTo(60 + cloakWave, 200);
            ctx.lineTo(140 - cloakWave, 200);
            ctx.closePath();
            ctx.fill();

            // Inner cloak (purple)
            ctx.fillStyle = '#4a148c';
            ctx.beginPath();
            ctx.moveTo(100, 90 + float);
            ctx.lineTo(75 + cloakWave * 0.7, 190);
            ctx.lineTo(125 - cloakWave * 0.7, 190);
            ctx.closePath();
            ctx.fill();

            // Skeletal body
            ctx.fillStyle = '#d0d0d0';
            ctx.fillRect(85, 100 + float, 30, 40);

            // Ribs detail
            ctx.strokeStyle = '#a0a0a0';
            ctx.lineWidth = 2;
            for(let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(85, 110 + float + i * 8);
                ctx.lineTo(115, 110 + float + i * 8);
                ctx.stroke();
            }

            // Hood
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.moveTo(100, 60 + float);
            ctx.lineTo(70, 100 + float);
            ctx.lineTo(100, 95 + float);
            ctx.lineTo(130, 100 + float);
            ctx.closePath();
            ctx.fill();

            // Skull face
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(88, 75 + float, 24, 20);

            // Eye sockets (glowing green)
            ctx.fillStyle = '#00ff88';
            const eyeGlow = staffPulse;
            ctx.globalAlpha = eyeGlow;
            ctx.fillRect(92, 82 + float, 6, 8);
            ctx.fillRect(102, 82 + float, 6, 8);
            ctx.globalAlpha = 1;

            // Dark eye sockets
            ctx.fillStyle = '#000';
            ctx.fillRect(94, 84 + float, 4, 6);
            ctx.fillRect(104, 84 + float, 4, 6);

            // Necromancer staff
            ctx.strokeStyle = '#4a2511';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(120, 120 + float);
            ctx.lineTo(145, 180);
            ctx.stroke();

            // Skull on staff
            ctx.fillStyle = '#d0d0d0';
            ctx.fillRect(138, 165, 14, 12);
            ctx.fillStyle = '#00ff88';
            ctx.globalAlpha = staffPulse;
            ctx.fillRect(140, 169, 4, 4);
            ctx.fillRect(146, 169, 4, 4);
            ctx.globalAlpha = 1;

            // Orbiting skulls
            for(let i = 0; i < 3; i++) {
                const angle = game.bossAnimFrame * 1.2 + (i * Math.PI * 2 / 3);
                const orbitRadius = 60;
                const skullX = 100 + Math.cos(angle) * orbitRadius;
                const skullY = 130 + float + Math.sin(angle) * orbitRadius;

                ctx.fillStyle = '#8b4789';
                ctx.fillRect(skullX - 6, skullY - 6, 12, 12);
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(skullX - 4, skullY - 3, 3, 3);
                ctx.fillRect(skullX + 1, skullY - 3, 3, 3);
            }

            // Magical particles rising
            ctx.fillStyle = '#9b59b6';
            for(let i = 0; i < 8; i++) {
                const particleY = 200 - ((game.bossAnimFrame * 2 + i * 20) % 150);
                const particleX = 80 + i * 10 + Math.sin(game.bossAnimFrame + i) * 5;
                ctx.globalAlpha = 1 - (particleY / 200);
                ctx.fillRect(particleX, particleY, 4, 4);
            }
            ctx.globalAlpha = 1;

            break;
        }

        case 'darkdragon': {
            // Dark Dragon - Dragon's Lair boss (darkest colors)
            const dragonX = 100;
            const dragonY = 140 + breathe;
            const anim = game.bossAnimFrame;
            const wingFlap = Math.sin(anim * 2.5) * 0.4;
            const tailSwing = Math.sin(anim * 1.3);

            ctx.save();
            ctx.translate(dragonX, dragonY);

            // Serpentine tail with spikes (very dark purple-black)
            ctx.strokeStyle = '#1a0533';
            ctx.lineWidth = 18;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-25, 15);
            for(let i = 1; i <= 7; i++) {
                const t = i / 7;
                const x = -25 - t * 90;
                const y = 15 + Math.sin(anim * 1.3 + t * Math.PI * 2) * 25 + t * 30;
                ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Tail spikes (pure black)
            ctx.fillStyle = '#000000';
            for(let i = 1; i <= 6; i++) {
                const t = i / 7;
                const x = -25 - t * 90;
                const y = 15 + Math.sin(anim * 1.3 + t * Math.PI * 2) * 25 + t * 30;
                ctx.beginPath();
                ctx.moveTo(x, y - 12);
                ctx.lineTo(x + 5, y - 25);
                ctx.lineTo(x + 10, y - 12);
                ctx.closePath();
                ctx.fill();
            }

            // Main body (very dark gradient - almost black)
            const bodyGradient = ctx.createRadialGradient(0, -10, 10, 0, 30, 80);
            bodyGradient.addColorStop(0, '#2a0845');
            bodyGradient.addColorStop(0.5, '#150420');
            bodyGradient.addColorStop(1, '#000000');
            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.ellipse(0, 25, 50, 65, 0, 0, Math.PI * 2);
            ctx.fill();

            // Scale texture (very dark purple)
            ctx.fillStyle = 'rgba(42, 8, 69, 0.5)';
            for(let i = 0; i < 6; i++) {
                for(let j = 0; j < 4; j++) {
                    const scaleX = -30 + j * 15 + (i % 2) * 7;
                    const scaleY = 0 + i * 12 + Math.sin(anim + i) * 2;
                    ctx.beginPath();
                    ctx.arc(scaleX, scaleY, 6, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Wings (pitch black with subtle purple)
            ctx.fillStyle = '#0d0015';
            for(const dir of [-1, 1]) {
                ctx.save();
                ctx.scale(dir, 1);
                ctx.rotate(wingFlap + dir * 0.2);

                // Wing membrane
                ctx.beginPath();
                ctx.moveTo(-15, -15);
                ctx.quadraticCurveTo(-100, -80, -140, -20);
                ctx.quadraticCurveTo(-130, 30, -40, 25);
                ctx.closePath();
                ctx.fill();

                // Wing bones (pure black)
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-15, -15);
                ctx.lineTo(-80, -60);
                ctx.moveTo(-15, -15);
                ctx.lineTo(-100, -30);
                ctx.moveTo(-15, -15);
                ctx.lineTo(-90, 5);
                ctx.stroke();

                ctx.restore();
            }

            // Neck
            ctx.fillStyle = '#1a0533';
            ctx.beginPath();
            ctx.moveTo(-10, -20);
            ctx.lineTo(-5, -60);
            ctx.lineTo(15, -60);
            ctx.lineTo(10, -20);
            ctx.closePath();
            ctx.fill();

            // Head
            ctx.fillStyle = '#2a0845';
            ctx.beginPath();
            ctx.ellipse(0, -70, 28, 20, 0, 0, Math.PI * 2);
            ctx.fill();

            // Horns (pure black)
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.moveTo(-20, -75);
            ctx.lineTo(-28, -100);
            ctx.lineTo(-15, -78);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(20, -75);
            ctx.lineTo(28, -100);
            ctx.lineTo(15, -78);
            ctx.closePath();
            ctx.fill();

            // Snout
            ctx.fillStyle = '#1a0533';
            ctx.fillRect(-5, -65, 18, 12);
            ctx.fillRect(0, -58, 20, 8);

            // Nostrils (dark green poison smoke)
            const smokePhase = Math.sin(anim * 4);
            if(smokePhase > 0) {
                ctx.fillStyle = `rgba(15, 50, 20, ${smokePhase * 0.7})`;
                for(let i = 0; i < 4; i++) {
                    const smokeX = 15 + i * 8;
                    const smokeY = -60 - i * 10;
                    const size = 8 + i * 3;
                    ctx.beginPath();
                    ctx.arc(smokeX, smokeY, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Eyes (glowing deep purple)
            ctx.fillStyle = '#4a148c';
            ctx.fillRect(-18, -75, 8, 10);
            ctx.fillRect(10, -75, 8, 10);

            // Eye glow (darker purple glow)
            const eyeGlow = Math.sin(anim * 3) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(74, 20, 140, ${eyeGlow})`;
            ctx.fillRect(-16, -73, 4, 6);
            ctx.fillRect(12, -73, 4, 6);

            // Poison drips (dark green)
            ctx.fillStyle = '#0d2912';
            for(let i = 0; i < 3; i++) {
                const dripY = -50 + ((anim * 3 + i * 30) % 100);
                const dripX = 10 + i * 8;
                ctx.globalAlpha = 1 - (dripY / 100);
                ctx.fillRect(dripX, dripY, 3, 8);
            }
            ctx.globalAlpha = 1;

            ctx.restore();
            break;
        }

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
function getTotalStages() {
    if(typeof QuestionBank !== 'undefined' && QuestionBank && typeof QuestionBank.getStageCount === 'function') {
        const total = QuestionBank.getStageCount(game.selectedGrade);
        if(typeof total === 'number' && total > 0) {
            return total;
        }

        const fallback = QuestionBank.getStageCount(null);
        if(typeof fallback === 'number' && fallback > 0) {
            return fallback;
        }
    }
    return 1;
}

function getStageNameForDisplay(stageNumber) {
    if(typeof QuestionBank !== 'undefined' && QuestionBank && typeof QuestionBank.getStageName === 'function') {
        const preferred = QuestionBank.getStageName(game.selectedGrade, stageNumber);
        if(preferred) {
            return preferred;
        }
        const fallback = QuestionBank.getStageName(null, stageNumber);
        if(fallback) {
            return fallback;
        }
    }
    return `Kolo ${stageNumber}`;
}

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
    clearAnswerLock();
    game.wrongAttemptCount = 0;

    let attempts = 0;
    const maxAttempts = 50;
    let questionData = null;
    let selectedOperationType = null;
    let shouldRecordProblem = false;

    do {
        attempts++;
        questionData = QuestionBank.generateQuestion(game.selectedGrade, game.stage) ||
            QuestionBank.generateQuestion(null, game.stage);

        if(!questionData) {
            break;
        }

        const operands = Array.isArray(questionData.operands) ? questionData.operands : [];
        const operandsUsedRecently = operands.length > 0 && game.recentOperands.some(previous =>
            previous.some(value => operands.includes(value))
        );

        const operationType = questionData.operationType || null;
        const answerRepeats = questionData.correctAnswer === game.lastCorrectAnswer;
        const operationRepeats = operationType && operationType === game.lastOperationType;
        const problemKey = questionData.key || `${game.stage}|${questionData.questionText}|${questionData.correctAnswer}`;
        const problemRepeated = game.recentProblems.includes(problemKey);

        if(problemRepeated || operandsUsedRecently || answerRepeats || operationRepeats) {
            if(attempts >= maxAttempts) {
                selectedOperationType = operationType;
                questionData.key = problemKey;
                shouldRecordProblem = true;
                break;
            }
            continue;
        }
        questionData.key = problemKey;
        selectedOperationType = operationType;
        shouldRecordProblem = true;
        break;
    } while(attempts < maxAttempts);

    if(questionData && shouldRecordProblem) {
        game.recentProblems.push(questionData.key);
        if(game.recentProblems.length > 3) {
            game.recentProblems.shift();
        }

        if(Array.isArray(questionData.operands) && questionData.operands.length > 0) {
            game.recentOperands.push([...questionData.operands]);
            if(game.recentOperands.length > 3) {
                game.recentOperands.shift();
            }
        }
    }

    const safeQuestionData = questionData || {
        questionText: '0 + 0 = ?',
        correctAnswer: 0,
        answerRangeMax: 10
    };

    const answerRangeMax = typeof safeQuestionData.answerRangeMax === 'number'
        ? Math.max(1, safeQuestionData.answerRangeMax)
        : 30;

    const answersSet = new Set([safeQuestionData.correctAnswer]);
    while(answersSet.size < 6) {
        const wrong = randInt(0, answerRangeMax);
        if(!answersSet.has(wrong)) {
            answersSet.add(wrong);
        }
    }

    const answers = Array.from(answersSet);
    answers.sort((a, b) => a - b);

    game.currentQuestion = {
        questionText: safeQuestionData.questionText,
        correctAnswer: safeQuestionData.correctAnswer,
        answers
    };

    game.lastCorrectAnswer = safeQuestionData.correctAnswer;
    game.lastOperationType = selectedOperationType;

    game.startTime = Date.now();

    document.getElementById('question').textContent = safeQuestionData.questionText;
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

    if(game.answerLockUntil && Date.now() < game.answerLockUntil) {
        return;
    }

    const timeTaken = (Date.now() - game.startTime) / 1000;

    if(answer === game.currentQuestion.correctAnswer) {
        // Correct answer
        clearAnswerLock();
        game.wrongAttemptCount = 0;
        game.correct++;
        const speedBonus = Math.max(0, Math.floor((10 - timeTaken)));

        // Store score to add after explosion
        game.pendingScore = 10 + speedBonus;

        // Cast spell
        castSpell();

        // Disable buttons during animation
        setAnswerButtonsDisabled(true);
    } else {
        // Wrong answer - monster speeds up and spell misses
        game.monsterSpeed += 0.5;
        game.wrongAttemptCount++;

        const lockDuration = game.wrongAttemptCount === 1 ? 1500 : 2500;
        lockAnswerButtons(lockDuration);
        castSpell(true); // Cast spell with miss = true
    }

    updateScore();
}

// Cast spell effect
function castSpell(isMiss = false) {
    let initialTargetX;
    let initialTargetY;

    const baseTargetX = game.isBossFight ? game.bossX + BOSS_SPELL_TARGET_X_OFFSET : game.monsterX + 30;
    const baseTargetY = MONSTER_SPELL_TARGET_Y;

    let missTargetX = null;
    let missTargetY = null;

    if(isMiss) {
        // Wrong answer - spell misses with dramatic angle
        const offsetX = (Math.random() - 0.5) * 200; // ±100px horizontally
        const offsetY = Math.random() < 0.5 ? -(150 + Math.random() * 100) : (150 + Math.random() * 100); // ±150-250px vertically

        missTargetX = baseTargetX + offsetX;
        missTargetY = baseTargetY + offsetY;

        initialTargetX = missTargetX;
        initialTargetY = missTargetY;
    } else {
        initialTargetX = baseTargetX;
        initialTargetY = baseTargetY;
    }

    const originX = 140;
    const originY = 150;
    const estimatedDistance = Math.hypot(initialTargetX - originX, initialTargetY - originY) || 1;
    let targetX = initialTargetX;
    let targetY = initialTargetY;

    game.spellEffect = {
        x: 140,
        y: 150,
        originX,
        originY,
        alpha: 1,
        color: '#ffd700',
        hasHit: false,
        isMiss: isMiss,
        missTargetX,
        missTargetY,
        phase: 'charge',
        startTime: Date.now(),
        chargeDuration: 200,
        chargeProgress: 0,
        radius: 2,
        maxRadius: 14,
        trail: [],
        trailMaxLength: 12,
        renderX: originX,
        renderY: originY,
        prevRenderX: originX,
        prevRenderY: originY,
        renderAngle: 0,
        hue: 210 + Math.random() * 60,
        hueSpeed: 4 + Math.random() * 1.5,
        waveBase: isMiss ? 6 : 10,
        waveBoost: isMiss ? 4 : 14,
        wavePhase: Math.random() * Math.PI * 2,
        waveSpeed: 0.25 + Math.random() * 0.15,
        travelDistance: 0,
        estimatedDistance,
        exhaust: [],
        exhaustTimer: 0,
        sparkleTimer: 0,
        sparkles: []
    };

    const spellInterval = setInterval(() => {
        if(!game.spellEffect) {
            clearInterval(spellInterval);
            return;
        }

        const effect = game.spellEffect;
        const now = Date.now();

        if(effect.phase === 'charge') {
            const elapsed = now - effect.startTime;
            effect.chargeProgress = clamp01(elapsed / effect.chargeDuration);
            effect.hue = (effect.hue + effect.hueSpeed * 0.6) % 360;
            effect.wavePhase += effect.waveSpeed * 0.4;

            if(elapsed < effect.chargeDuration) {
                return;
            }

            // Transition to travel phase once the charge completes
            effect.phase = 'travel';
            effect.travelStart = now;
            effect.radius = 2;
            effect.maxRadius = effect.isMiss ? 12 : 16;
            effect.trail = [];
            effect.prevX = effect.originX;
            effect.prevY = effect.originY;
            effect.directionAngle = 0;
        }

        // Update target dynamically
        if(effect.isMiss) {
            // Miss - go to random offset position
            targetX = effect.missTargetX;
            targetY = effect.missTargetY;
        } else {
            // Hit - track monster/boss
            targetX = game.isBossFight ? game.bossX + BOSS_SPELL_TARGET_X_OFFSET : game.monsterX + 30;
            targetY = MONSTER_SPELL_TARGET_Y;
        }

        const previousX = effect.x;
        const previousY = effect.y;

        effect.x += (targetX - effect.x) * 0.2;
        effect.y += (targetY - effect.y) * 0.2;

        const dx = effect.x - previousX;
        const dy = effect.y - previousY;
        const moveDistance = Math.hypot(dx, dy);
        if(dx !== 0 || dy !== 0) {
            effect.directionAngle = Math.atan2(dy, dx);
        }

        effect.travelDistance += moveDistance;

        const toTargetX = targetX - effect.x;
        const toTargetY = targetY - effect.y;
        const distanceToTarget = Math.hypot(toTargetX, toTargetY);
        const normX = distanceToTarget ? toTargetX / distanceToTarget : Math.cos(effect.directionAngle || 0);
        const normY = distanceToTarget ? toTargetY / distanceToTarget : Math.sin(effect.directionAngle || 0);

        const previousRenderX = effect.renderX;
        const previousRenderY = effect.renderY;
        effect.renderX = effect.x;
        effect.renderY = effect.y;

        const renderDx = effect.renderX - previousRenderX;
        const renderDy = effect.renderY - previousRenderY;
        if(renderDx !== 0 || renderDy !== 0) {
            effect.renderAngle = Math.atan2(renderDy, renderDx);
        }
        effect.prevRenderX = effect.renderX;
        effect.prevRenderY = effect.renderY;

        effect.radius += (effect.maxRadius - effect.radius) * 0.22;
        effect.hue = (effect.hue + effect.hueSpeed) % 360;

        effect.trail.unshift({
            x: effect.renderX,
            y: effect.renderY,
            radius: effect.radius,
            alpha: 0.65,
            hue: effect.hue
        });
        if(effect.trail.length > effect.trailMaxLength) {
            effect.trail.pop();
        }

        effect.sparkleTimer += moveDistance;
        if(effect.sparkleTimer > 18) {
            effect.sparkleTimer = 0;
            effect.sparkles.push({
                x: effect.renderX + (Math.random() - 0.5) * 24,
                y: effect.renderY + (Math.random() - 0.5) * 24,
                life: 1,
                hue: (effect.hue + 40) % 360,
                size: effect.radius * (0.4 + Math.random() * 0.4)
            });
        }

        for(let i = effect.sparkles.length - 1; i >= 0; i--) {
            const sparkle = effect.sparkles[i];
            sparkle.life -= 0.08;
            sparkle.x += (Math.random() - 0.5) * 1.2;
            sparkle.y += (Math.random() - 0.5) * 1.2;
            if(sparkle.life <= 0) {
                effect.sparkles.splice(i, 1);
            }
        }

        effect.exhaustTimer += moveDistance;
        if(effect.exhaustTimer > 6) {
            effect.exhaustTimer = 0;
            const swirlAngle = (effect.renderAngle || effect.directionAngle || 0) + (Math.random() - 0.5) * 0.8;
            const speed = -2.2 - Math.random() * 1.4;
            effect.exhaust.unshift({
                x: effect.renderX,
                y: effect.renderY,
                vx: Math.cos(swirlAngle) * speed,
                vy: Math.sin(swirlAngle) * speed,
                radius: effect.radius * (1.2 + Math.random() * 0.4),
                life: 1,
                hue: effect.hue
            });
        }

        for(let i = effect.exhaust.length - 1; i >= 0; i--) {
            const puff = effect.exhaust[i];
            puff.x += puff.vx;
            puff.y += puff.vy;
            puff.vx *= 0.94;
            puff.vy *= 0.94;
            puff.radius *= 1.06;
            puff.life -= 0.07;
            puff.hue = (puff.hue + 1.5) % 360;
            if(puff.life <= 0.05) {
                effect.exhaust.splice(i, 1);
            }
        }

        // Check if spell hit target
        if(Math.abs(effect.x - targetX) < 10 && Math.abs(effect.y - targetY) < 10) {
            if(!effect.hasHit) {
                effect.hasHit = true;

                // If miss, just disappear without hitting
                if(effect.isMiss) {
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
                                    x: game.bossX + BOSS_EXPLOSION_CENTER_X_OFFSET,
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
                                    const x = game.bossX + BOSS_EXPLOSION_CENTER_X_OFFSET + Math.cos(angle) * distance;
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
                                    createExplosion(game.bossX + BOSS_EXPLOSION_CENTER_X_OFFSET, 200, '#ffffff');
                                }
                            }, 400);

                        }, 1200);

                        // Boss defeated - advance stage
                        setTimeout(() => {
                            game.bossDeathAnim = null;
                            game.isBossFight = false;
                            game.bossHealth = 5;

                            // Add pending score after boss explosion
                            if(game.pendingScore > 0) {
                                game.score += game.pendingScore;
                                game.pendingScore = 0;
                                updateScore();
                            }

                            const totalStages = getTotalStages();
                            const nextStage = game.stage + 1;
                            const completedGame = nextStage > totalStages;

                            game.stage = Math.min(nextStage, totalStages);
                            game.questionsInStage = 0;

                            if(completedGame) {
                                game.monsterX = canvas.width;
                                game.monsterSpeed = 1;
                                game.bossX = 800;
                                showVictoryScreen();
                                return;
                            }

                            // Refresh environment to match the new stage theme
                            refreshEnvironment(game.timeState || computeDayNightState(), { regenerateClouds: true });

                            game.monsterX = canvas.width;
                            game.monsterSpeed = 1; // Reset speed to default
                            game.bossX = 800;
                            resetMonsterCycle(game.stage);
                            game.currentMonster = getNextMonsterForStage(game.stage);
                            game.monsterHitFlash = 0;
                            game.nextFireballTime = null;

                            // Show stage announcement, then generate problem
                            showStageAnnouncement(game.stage);

                            // Re-enable buttons
                            clearAnswerLock();
                            setAnswerButtonsDisabled(false);
                        }, 3000);
                    } else {
                        // Boss still alive - small hit effect
                        createExplosion(game.bossX + BOSS_EXPLOSION_CENTER_X_OFFSET, 200, '#ffff00');
                        game.screenShake = 10;

                        // Add pending score after boss hit
                        if(game.pendingScore > 0) {
                            game.score += game.pendingScore;
                            game.pendingScore = 0;
                            updateScore();
                        }

                        generateProblem();

                        // Re-enable buttons
                        clearAnswerLock();
                        setAnswerButtonsDisabled(false);
                    }
                } else {
                    // Start inflation animation when spell hits normal monster
                    game.monsterHitFlash = 1;
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

function showFinalResults({ title = 'Konec hry', message = '' } = {}) {
    game.stageAnnouncement = null;
    game.isPausedForModal = true;
    const gradeValue = typeof game.selectedGrade === 'number' ? game.selectedGrade : GRADE_SLIDER_MIN;
    updateGameOverBackground(computeGradeGradientColors(gradeValue));

    const finalTitleEl = document.getElementById('finalTitle');
    if(finalTitleEl) {
        finalTitleEl.textContent = title;
    }

    const finalMessageEl = document.getElementById('finalMessage');
    if(finalMessageEl) {
        if(message) {
            finalMessageEl.textContent = message;
            finalMessageEl.style.display = 'block';
        } else {
            finalMessageEl.textContent = '';
            finalMessageEl.style.display = 'none';
        }
    }

    const speedBonus = Math.floor(game.correct * 5);
    const totalScore = game.score + speedBonus;

    document.getElementById('finalScore').textContent = totalScore;
    document.getElementById('finalCorrect').textContent = game.correct;
    document.getElementById('speedBonus').textContent = speedBonus;
    document.getElementById('finalStage').textContent = game.stage;
    const finalGradeEl = document.getElementById('finalGrade');
    if(finalGradeEl) {
        finalGradeEl.textContent = getGradeLabel(gradeValue);
    }

    document.getElementById('gameOverOverlay').style.display = 'block';
    document.getElementById('gameOver').style.display = 'block';
}

function showVictoryScreen() {
    clearAnswerLock();
    setAnswerButtonsDisabled(true, { locked: true });
    game.isGameOver = true;
    game.currentMonster = null;
    game.fireballs = [];
    game.nextFireballTime = null;
    game.witchShield = null;
    showFinalResults({
        title: 'Výhra!',
        message: 'Dokončil jsi všech 10 kol!'
    });
}

// Game over
function gameOver() {
    clearAnswerLock();
    setAnswerButtonsDisabled(true, { locked: true });

    game.fireballs = [];
    game.nextFireballTime = null;
    game.witchShield = null;

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
            showFinalResults();
        }, 500);
    }, 800);
}

function hideGameOverDialog() {
    if(gameOverOverlay) {
        gameOverOverlay.style.display = 'none';
    }
    if(gameOverDialog) {
        gameOverDialog.style.display = 'none';
    }
}

function resetGameStateForNewRun() {
    clearAnswerLock();
    game.wrongAttemptCount = 0;
    setAnswerButtonsDisabled(false);

    game.score = 0;
    game.correct = 0;
    game.monsterX = canvas.width;
    game.monsterSpeed = 1;
    game.isGameOver = false;
    game.spellEffect = null;
    game.explosion = null;
    game.particles = [];
    game.fireballs = [];
    game.monsterScale = 1;
    game.shockwaves = [];
    game.screenShake = 0;
    game.parallax.mountains = 0;
    game.parallax.trees = 0;
    game.parallax.bushes = 0;
    game.celestialProgress = 0;
    game.isDay = true;
    game.timeState = computeDayNightState();
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
    game.lastCorrectAnswer = null;
    game.lastOperationType = null;
    game.pendingScore = 0;
    game.nextFireballTime = null;
    game.witchShield = null;
    game.monsterVisualY = 180;
    game.witchDeathAnim = null;
    game.isPausedForModal = false;
    game.monsterHitFlash = 0;

    initBats();
    initSeagulls();
    refreshEnvironment(game.timeState, { regenerateClouds: true });

    updateScore();

    resetMonsterCycle();
    game.currentMonster = getNextMonsterForStage(game.stage);
    game.monsterHitFlash = 0;
    showStageAnnouncement(game.stage);
}

// Draw parallax background
function drawBackground() {
    if(!game.isGameOver && !game.isPausedForModal) {
        game.celestialProgress += 0.0005;
        if(game.celestialProgress > 1) game.celestialProgress = 0;
    }

    const previousIsDay = game.isDay;
    const timeState = computeDayNightState();
    game.timeState = timeState;

    if(previousIsDay !== timeState.isDay) {
        refreshEnvironment(timeState);
    } else {
        game.isDay = timeState.isDay;
    }

    const palette = getCurrentPalette(timeState);
    const themeName = palette.themeName;
    const dayStrength = timeState.dayStrength;
    const nightStrength = timeState.nightStrength;

    const gradient = ctx.createLinearGradient(0, 0, 0, 350);
    gradient.addColorStop(0, palette.skyTop || '#87ceeb');
    gradient.addColorStop(1, palette.skyBottom || '#b0d4f1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 350);

    if(palette.horizon) {
        const horizonGradient = ctx.createLinearGradient(0, 220, 0, 360);
        horizonGradient.addColorStop(0, palette.horizon);
        horizonGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = horizonGradient;
        ctx.fillRect(0, 200, canvas.width, 160);
    }

    stars.forEach(star => {
        star.brightness += star.twinkleSpeed;
        if(star.brightness > 1) star.brightness = 0;

        const alpha = Math.abs(Math.sin(star.brightness * Math.PI)) * nightStrength;
        if(alpha <= 0) return;

        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(star.x, star.y, star.size, star.size);

        if(alpha > 0.7 * nightStrength) {
            ctx.fillRect(star.x - 1, star.y, 1, star.size);
            ctx.fillRect(star.x + star.size, star.y, 1, star.size);
            ctx.fillRect(star.x, star.y - 1, star.size, 1);
            ctx.fillRect(star.x, star.y + star.size, star.size, 1);
        }
    });
    ctx.globalAlpha = 1;

    if(!game.isGameOver && Math.random() < 0.01 * nightStrength) {
        game.shootingStars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * 100,
            vx: -3 - Math.random() * 2,
            vy: 2 + Math.random() * 1.5,
            life: 1,
            trail: []
        });
    }

    for(let i = game.shootingStars.length - 1; i >= 0; i--) {
        const star = game.shootingStars[i];
        star.x += star.vx;
        star.y += star.vy;
        star.life -= 0.015;

        star.trail.push({ x: star.x, y: star.y });
        if(star.trail.length > 15) {
            star.trail.shift();
        }

        if(star.life <= 0 || star.y > 300 || star.x < -50) {
            game.shootingStars.splice(i, 1);
            continue;
        }

        for(let j = 0; j < star.trail.length; j++) {
            const trailPoint = star.trail[j];
            const trailAlpha = (j / star.trail.length) * star.life * nightStrength;
            const trailSize = (j / star.trail.length) * 3 + 1;

            if(trailAlpha <= 0) continue;

            ctx.globalAlpha = trailAlpha * 0.8;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(trailPoint.x, trailPoint.y, trailSize, trailSize);

            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(trailPoint.x - 1, trailPoint.y - 1, trailSize + 2, trailSize + 2);

            if(j > star.trail.length * 0.7) {
                ctx.fillStyle = '#ff6600';
                ctx.fillRect(trailPoint.x - 2, trailPoint.y - 2, trailSize + 4, trailSize + 4);
            }
        }

        const coreAlpha = star.life * nightStrength;
        if(coreAlpha > 0) {
            ctx.globalAlpha = coreAlpha;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(star.x - 1, star.y - 1, 4, 4);

            ctx.fillStyle = '#ffffaa';
            ctx.globalAlpha = coreAlpha * 0.6;
            ctx.fillRect(star.x - 2, star.y - 2, 6, 6);
        }

        ctx.globalAlpha = 1;
    }

    const ellipseA = canvas.width / 2;
    const ellipseB = 120;
    const centerX = canvas.width / 2;
    const centerY = 120;
    const computeCelestialY = positionX => {
        const relativeX = positionX - centerX;
        const normalizedX = relativeX / ellipseA;
        const yOffset = Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(normalizedX), 1.5))) * ellipseB;
        return centerY - yOffset;
    };

    if(timeState.sunAlpha > 0) {
        const sunTrack = clamp01(timeState.sunTrack || 0);
        const celestialX = canvas.width - sunTrack * canvas.width;
        const celestialY = computeCelestialY(celestialX);
        const sunCore = palette.sunCore || '#ffeb3b';
        const sunGlow = palette.sunGlow || '#ffd54f';
        ctx.save();
        ctx.globalAlpha = timeState.sunAlpha;
        ctx.fillStyle = sunCore;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = sunGlow;
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

        ctx.globalAlpha = Math.min(0.3, timeState.sunAlpha * 0.3 + 0.05);
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    if(timeState.moonAlpha > 0) {
        const moonTrack = clamp01(timeState.moonTrack || 0);
        const celestialX = canvas.width - moonTrack * canvas.width;
        const celestialY = computeCelestialY(celestialX);
        const moonCore = palette.moonCore || '#f0f0a0';
        const moonGlow = palette.moonGlow || '#ffff80';
        ctx.save();
        ctx.globalAlpha = timeState.moonAlpha;
        ctx.fillStyle = moonCore;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 20, 0, Math.PI * 2);
        ctx.fill();

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

        ctx.globalAlpha = Math.min(0.35, timeState.moonAlpha * 0.35 + 0.05);
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawCloudLayersOnCanvas(palette);

    game.seagulls.forEach(seagull => {
        if(!game.isGameOver) {
            seagull.x += seagull.speed;
            seagull.wingPhase += 0.15;
            if(seagull.x > canvas.width + 40) {
                seagull.x = -40;
                seagull.y = 30 + Math.random() * 120;
            }
        }
    });

    const seagullVisibility = Math.min(1, Math.max(0, dayStrength));
    if(seagullVisibility > 0.01) {
        ctx.save();
        ctx.globalAlpha = seagullVisibility;
        game.seagulls.forEach(seagull => {
            const wingAngle = Math.sin(seagull.wingPhase) * 0.8;
            const bobbing = Math.sin(seagull.wingPhase * 0.5) * seagull.amplitude * 0.1;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(seagull.x, seagull.y + bobbing, 10, 4);

            ctx.save();
            ctx.translate(seagull.x + 5, seagull.y + 2 + bobbing);
            ctx.rotate(wingAngle);
            ctx.fillRect(-8, -1, 8, 3);
            ctx.rotate(-wingAngle);
            ctx.rotate(-wingAngle);
            ctx.fillRect(0, -1, 8, 3);
            ctx.restore();

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(seagull.x + 8, seagull.y - 1 + bobbing, 3, 3);
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(seagull.x + 11, seagull.y + bobbing, 2, 2);
        });
        ctx.restore();
    }

    game.bats.forEach(bat => {
        if(!game.isGameOver) {
            bat.x += bat.speed;
            bat.wingPhase += 0.2;
            if(bat.x > canvas.width + 30) {
                bat.x = -30;
                bat.y = 50 + Math.random() * 150;
            }
        }
    });

    const batVisibility = Math.min(1, Math.max(0, nightStrength));
    if(batVisibility > 0.01) {
        ctx.save();
        ctx.globalAlpha = batVisibility;
        game.bats.forEach(bat => {
            const wingAngle = Math.sin(bat.wingPhase) * 0.5;
            const bobbing = Math.sin(bat.wingPhase * 0.5) * bat.amplitude * 0.1;

            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(bat.x, bat.y + bobbing, 8, 6);

            ctx.save();
            ctx.translate(bat.x + 4, bat.y + 3 + bobbing);
            ctx.rotate(wingAngle);
            ctx.fillRect(-12, -2, 10, 4);
            ctx.rotate(-wingAngle);
            ctx.rotate(-wingAngle);
            ctx.fillRect(2, -2, 10, 4);
            ctx.restore();

            ctx.fillRect(bat.x + 1, bat.y - 2 + bobbing, 2, 3);
            ctx.fillRect(bat.x + 5, bat.y - 2 + bobbing, 2, 3);
        });
        ctx.restore();
    }

    if(!game.isGameOver) {
        game.parallax.mountains += 0.2;
        game.parallax.trees += 0.5;
        game.parallax.bushes += 1.0;
    }

    const mountainOffset = game.parallax.mountains % 800;
    drawMountainLayer(themeName, palette, mountainOffset);

    const treeOffset = game.parallax.trees % 600;
    drawMidgroundLayer(themeName, palette, treeOffset);

    const bushOffset = game.parallax.bushes % 400;
    drawForegroundLayer(themeName, palette, bushOffset);

    const groundGradient = ctx.createLinearGradient(0, 320, 0, 360);
    groundGradient.addColorStop(0, palette.groundHighlight || palette.ground || '#7cb342');
    groundGradient.addColorStop(1, palette.ground || '#4a3d2a');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, 345, canvas.width, 55);

    drawForegroundAccents(themeName, palette, game.parallax.bushes % 120);

    const stageY = 377;
    const startX = (canvas.width - (10 * 30)) / 2;

    for(let i = 1; i <= 10; i++) {
        const circleX = startX + (i - 1) * 30 + 15;

        ctx.fillStyle = i === game.stage ? '#ffd700' : '#555';
        ctx.beginPath();
        ctx.arc(circleX, stageY, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = i === game.stage ? '#ffeb3b' : '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = i === game.stage ? '#000' : '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i, circleX, stageY);

        if(i === game.stage) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(circleX, stageY, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    const grassColor = palette.grass || '#3a5d3a';
    const grassHighlight = palette.grassHighlight || '#4f8a4a';
    const grassOffset = game.parallax.bushes % 20;
    for(let i = -20; i < canvas.width + 20; i += 20) {
        const baseX = i - grassOffset;
        ctx.fillStyle = grassColor;
        ctx.fillRect(baseX, 345, 3, 8);
        ctx.fillRect(baseX + 7, 347, 3, 6);
        ctx.fillRect(baseX + 14, 346, 3, 7);

        ctx.fillStyle = grassHighlight;
        ctx.fillRect(baseX, 344, 2, 3);
        ctx.fillRect(baseX + 7, 346, 2, 3);
        ctx.fillRect(baseX + 14, 345, 2, 3);
    }

    drawAmbientParticles();
}

// Main game loop
function gameLoop(timestamp) {
    const now = typeof timestamp === 'number' ? timestamp : (typeof performance !== 'undefined' ? performance.now() : Date.now());

    // Calculate FPS
    if(debugFPS) {
        fpsFrameTimes.push(now);
        // Keep only last 60 frame times
        if(fpsFrameTimes.length > 60) {
            fpsFrameTimes.shift();
        }
        // Calculate FPS from frame times
        if(fpsFrameTimes.length >= 2) {
            const totalTime = fpsFrameTimes[fpsFrameTimes.length - 1] - fpsFrameTimes[0];
            const frameCount = fpsFrameTimes.length - 1;
            currentFPS = Math.round((frameCount / totalTime) * 1000);
        }
    }

    if(debugSlow) {
        const frameInterval = 1000 / DEBUG_SLOW_FPS;
        if(now - lastDebugFrameTime < frameInterval) {
            requestAnimationFrame(gameLoop);
            return;
        }
        lastDebugFrameTime = now;
    } else if(lastDebugFrameTime !== 0) {
        lastDebugFrameTime = 0;
    }

    const paused = !!game.isPausedForModal;

    // Apply screen shake
    ctx.save();
    if(!paused && game.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * game.screenShake;
        const shakeY = (Math.random() - 0.5) * game.screenShake;
        ctx.translate(shakeX, shakeY);
        game.screenShake *= 0.9;
        if(game.screenShake < 0.5) game.screenShake = 0;
    } else {
        game.screenShake = 0;
    }

    // Clear canvas
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background
    drawBackground();

    if(!paused) {
        // Draw shockwaves (behind everything)
        updateShockwaves();

        // Draw wizard
        drawWizard();

        let shooterOrigin = null;

        // Draw and move monster or boss
        if(!game.isGameOver) {
            if(game.isBossFight) {
                // Boss moves slowly and continuously towards witch
                if(!game.bossDeathAnim) {
                    game.bossX -= 0.5;
                }

                // Update boss animation frame once per game frame
                game.bossAnimFrame += 0.05;

                const currentBoss = bosses[game.stage - 1];
                drawBoss(currentBoss, game.bossX, 100, 1);

                if(!game.bossDeathAnim && !game.witchDeathAnim) {
                    shooterOrigin = {
                        x: game.bossX + 110,
                        y: 220
                    };
                }

                // Check if boss reached witch (boss is 200px wide, witch at x=50)
                if(game.bossX < 150 && !game.bossDeathAnim && !game.witchDeathAnim) {
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
                        game.currentMonster = getNextMonsterForStage(game.stage);
                        game.monsterHitFlash = 0;
                        game.nextFireballTime = null;

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
                            game.nextFireballTime = null;
                        }

                        generateProblem();

                        // Re-enable buttons
                        clearAnswerLock();
                        setAnswerButtonsDisabled(false);
                    }
                }

                if(game.currentMonster) {
                    // Monster bobbing animation like witch
                    const monsterBobbing = Math.sin(Date.now() / 300) * 4;
                    const monsterY = 180 + monsterBobbing;
                    game.monsterVisualY = monsterY;

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

                    if(!game.explosion && !game.witchDeathAnim) {
                        shooterOrigin = {
                            x: game.monsterX + 40 * game.monsterScale,
                            y: monsterY + 40 * game.monsterScale
                        };
                    }
                }

                // Check if monster reached witch (monster is 80px wide, witch at x=50)
                if(game.monsterX < 130 && !game.explosion && !game.witchDeathAnim) {
                    gameOver();
                }
            }
        }

        if(shooterOrigin && !game.isGameOver) {
            maybeLaunchMonsterFireball(shooterOrigin.x, shooterOrigin.y);
        } else if(!shooterOrigin) {
            game.nextFireballTime = null;
        }

        updateFireballs();
        drawWitchShield();

        // Draw particles
        updateParticles();

        // Draw spell effect
        if(game.spellEffect) {
            const effect = game.spellEffect;
            const now = Date.now();

            if(effect.phase === 'charge') {
                const progress = effect.chargeProgress !== undefined
                    ? effect.chargeProgress
                    : clamp01((now - effect.startTime) / effect.chargeDuration);
                const collapse = Math.pow(Math.max(0, 1 - progress), 0.85);
                const baseRadius = 46;
                const baseHue = effect.hue;

                // Luminous breathing aura
                const glowRadius = baseRadius * collapse + 22;
                const glowGradient = ctx.createRadialGradient(
                    effect.originX,
                    effect.originY,
                    glowRadius * 0.2,
                    effect.originX,
                    effect.originY,
                    glowRadius
                );
                glowGradient.addColorStop(0, `hsla(${baseHue}, 100%, 88%, ${0.85 - progress * 0.25})`);
                glowGradient.addColorStop(0.45, `hsla(${(baseHue + 80) % 360}, 95%, 65%, ${0.55 - progress * 0.2})`);
                glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');

                ctx.save();
                ctx.globalAlpha = 1;
                ctx.fillStyle = glowGradient;
                ctx.beginPath();
                ctx.arc(effect.originX, effect.originY, glowRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Helical arc rings
                ctx.save();
                ctx.translate(effect.originX, effect.originY);
                const wobble = Math.sin(now / 220) * 0.25;
                ctx.rotate(wobble);
                const squash = 0.65 + Math.sin(now / 260) * 0.12;
                ctx.scale(1.35, squash);

                for(let i = 0; i < 4; i++) {
                    const offsetProgress = (progress * 1.8 + i * 0.22) % 1;
                    const ringRadius = Math.max(8, (baseRadius - i * 10) * collapse + 10);
                    const ringAlpha = clamp01(0.75 - offsetProgress * 0.55);
                    const ringHue = (baseHue + i * 45) % 360;

                    ctx.globalAlpha = ringAlpha;
                    ctx.lineWidth = 6 - i * 1.4;
                    ctx.strokeStyle = `hsla(${ringHue}, 100%, ${70 - i * 8}%, ${0.75 - i * 0.12})`;
                    ctx.beginPath();
                    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();

                // Spiralling motes collapsing inward
                for(let i = 0; i < 7; i++) {
                    const spin = now / 90 + i * (Math.PI * 2 / 7);
                    const orbit = (baseRadius * 0.55) * collapse + 6;
                    const px = effect.originX + Math.cos(spin) * orbit;
                    const py = effect.originY + Math.sin(spin) * orbit * 0.55;
                    const hue = (baseHue + i * 30) % 360;
                    ctx.globalAlpha = 0.7 - progress * 0.4;
                    ctx.fillStyle = `hsla(${hue}, 100%, 78%, ${0.8 - progress * 0.3})`;
                    ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
                }

                // Intensifying core that funnels the energy forward
                const coreRadius = Math.max(3, 12 * collapse);
                const coreGradient = ctx.createRadialGradient(
                    effect.originX,
                    effect.originY,
                    0,
                    effect.originX,
                    effect.originY,
                    coreRadius * 2.4
                );
                coreGradient.addColorStop(0, `hsla(${(baseHue + 20) % 360}, 100%, 92%, 1)`);
                coreGradient.addColorStop(0.5, `hsla(${(baseHue + 120) % 360}, 95%, 70%, ${0.85 - progress * 0.3})`);
                coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0.25)');

                ctx.globalAlpha = 1;
                ctx.fillStyle = coreGradient;
                ctx.beginPath();
                ctx.arc(effect.originX, effect.originY, coreRadius * 1.3, 0, Math.PI * 2);
                ctx.fill();
            } else {
                const radius = effect.radius || 10;

                // Exhaust plumes swirling behind the projectile
                if(effect.exhaust && effect.exhaust.length) {
                    for(let i = effect.exhaust.length - 1; i >= 0; i--) {
                        const puff = effect.exhaust[i];
                        const alpha = Math.max(0, puff.life);
                        if(alpha <= 0) continue;
                        const puffRadius = puff.radius;
                        const plumeGradient = ctx.createRadialGradient(
                            puff.x,
                            puff.y,
                            0,
                            puff.x,
                            puff.y,
                            puffRadius
                        );
                        plumeGradient.addColorStop(0, `hsla(${puff.hue}, 100%, 80%, ${0.45 * alpha})`);
                        plumeGradient.addColorStop(0.5, `hsla(${(puff.hue + 60) % 360}, 90%, 65%, ${0.3 * alpha})`);
                        plumeGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                        ctx.globalAlpha = 1;
                        ctx.fillStyle = plumeGradient;
                        ctx.beginPath();
                        ctx.arc(puff.x, puff.y, puffRadius, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                // Radiant trail ribbon
                if(effect.trail && effect.trail.length) {
                    for(let i = 0; i < effect.trail.length; i++) {
                        const segment = effect.trail[i];
                        const fade = 1 - i / effect.trail.length;
                        const segmentRadius = (segment.radius || radius) * (1.2 + fade * 1.25);
                        const tailGradient = ctx.createRadialGradient(
                            segment.x,
                            segment.y,
                            0,
                            segment.x,
                            segment.y,
                            segmentRadius
                        );
                        tailGradient.addColorStop(0, `hsla(${(segment.hue + 10) % 360}, 100%, 88%, ${0.6 * fade})`);
                        tailGradient.addColorStop(0.4, `hsla(${(segment.hue + 90) % 360}, 100%, 65%, ${0.45 * fade})`);
                        tailGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                        ctx.globalAlpha = 1;
                        ctx.fillStyle = tailGradient;
                        ctx.beginPath();
                        ctx.arc(segment.x, segment.y, segmentRadius, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    ctx.save();
                    ctx.globalAlpha = 0.36;
                    ctx.lineWidth = Math.max(6, radius * 0.55);
                    ctx.lineCap = 'round';
                    const tailGradient = ctx.createLinearGradient(
                        effect.renderX,
                        effect.renderY,
                        effect.trail[Math.min(effect.trail.length - 1, 6)].x,
                        effect.trail[Math.min(effect.trail.length - 1, 6)].y
                    );
                    tailGradient.addColorStop(0, `hsla(${effect.hue}, 100%, 78%, 0.9)`);
                    tailGradient.addColorStop(1, `hsla(${(effect.hue + 170) % 360}, 90%, 55%, 0)`);
                    ctx.strokeStyle = tailGradient;
                    ctx.beginPath();
                    ctx.moveTo(effect.renderX, effect.renderY);
                    const ribbonSegments = Math.min(effect.trail.length, 6);
                    for(let i = 1; i < ribbonSegments; i++) {
                        ctx.lineTo(effect.trail[i].x, effect.trail[i].y);
                    }
                    ctx.stroke();
                    ctx.restore();
                }

                // Sparkling mote field
                if(effect.sparkles && effect.sparkles.length) {
                    ctx.save();
                    for(const sparkle of effect.sparkles) {
                        const alpha = Math.max(0, sparkle.life);
                        if(alpha <= 0) continue;
                        const sparkleSize = sparkle.size || 4;
                        ctx.globalAlpha = 0.6 * alpha;
                        ctx.fillStyle = `hsla(${sparkle.hue}, 100%, 85%, ${0.9 * alpha})`;
                        ctx.beginPath();
                        ctx.arc(sparkle.x, sparkle.y, sparkleSize * 0.4, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.globalAlpha = 0.75 * alpha;
                        ctx.strokeStyle = `hsla(${(sparkle.hue + 40) % 360}, 100%, 70%, ${alpha})`;
                        ctx.lineWidth = 1.2;
                        ctx.beginPath();
                        ctx.moveTo(sparkle.x - sparkleSize, sparkle.y);
                        ctx.lineTo(sparkle.x + sparkleSize, sparkle.y);
                        ctx.moveTo(sparkle.x, sparkle.y - sparkleSize);
                        ctx.lineTo(sparkle.x, sparkle.y + sparkleSize);
                        ctx.stroke();
                    }
                    ctx.restore();
                }

                // Main projectile orb that grows mid-flight
                const projectileGradient = ctx.createRadialGradient(
                    effect.renderX,
                    effect.renderY,
                    0,
                    effect.renderX,
                    effect.renderY,
                    radius * 2.4
                );
                projectileGradient.addColorStop(0, `hsla(${effect.hue}, 100%, 90%, 1)`);
                projectileGradient.addColorStop(0.25, `hsla(${(effect.hue + 40) % 360}, 100%, 68%, 0.95)`);
                projectileGradient.addColorStop(0.65, `hsla(${(effect.hue + 130) % 360}, 90%, 60%, 0.8)`);
                projectileGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                ctx.globalAlpha = effect.alpha;
                ctx.fillStyle = projectileGradient;
                ctx.beginPath();
                ctx.arc(effect.renderX, effect.renderY, radius, 0, Math.PI * 2);
                ctx.fill();

                // Leading highlight that stretches in the travel direction
                if(typeof effect.directionAngle === 'number') {
                    ctx.save();
                    ctx.translate(effect.renderX, effect.renderY);
                    ctx.rotate(effect.renderAngle || effect.directionAngle);
                    const highlightGradient = ctx.createLinearGradient(0, 0, radius * 2.2, 0);
                    highlightGradient.addColorStop(0, `hsla(${(effect.hue + 20) % 360}, 100%, 92%, 0.95)`);
                    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    ctx.fillStyle = highlightGradient;
                    ctx.globalAlpha = 0.9;
                    ctx.beginPath();
                    ctx.ellipse(radius * 0.45, 0, radius * 1.2, radius * 0.5, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                // Orbiting embers around the projectile
                for(let i = 0; i < 7; i++) {
                    const angle = now / 80 + i * (Math.PI * 2 / 7);
                    const distance = radius * (1.8 + Math.sin(now / 240 + i) * 0.35);
                    const px = effect.renderX + Math.cos(angle) * distance;
                    const py = effect.renderY + Math.sin(angle) * distance;
                    ctx.globalAlpha = 0.55;
                    ctx.fillStyle = `hsla(${(effect.hue + i * 32) % 360}, 100%, 82%, 0.95)`;
                    ctx.beginPath();
                    ctx.arc(px, py, 2.2, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.globalAlpha = 1;
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
    } else {
        game.nextFireballTime = null;
    }

    // Stage announcement (overlay on top of game)
    if(game.stageAnnouncement) {
        const elapsed = Date.now() - game.stageAnnouncement.startTime;
        const progress = elapsed / game.stageAnnouncement.duration;

        // Only render if not fully faded out
        if(progress < 1) {
            // Fade in/out effect
            let alpha;
            if(progress < 0.15) {
                alpha = progress / 0.15; // Fade in
            } else if(progress > 0.85) {
                alpha = (1 - progress) / 0.15; // Fade out
            } else {
                alpha = 1;
            }

            const stageText = `Kolo ${game.stageAnnouncement.stage}`;
            const stageName = getStageNameForDisplay(game.stageAnnouncement.stage);

            const bannerMarginX = 32;
            const bannerY = 20;
            const bannerHeight = 68;
            const bannerWidth = canvas.width - bannerMarginX * 2;
            const centerX = canvas.width / 2;

            ctx.save();
            ctx.globalAlpha = alpha;

            // Subtle dark background strip
            ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            ctx.fillRect(bannerMarginX, bannerY, bannerWidth, bannerHeight);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Stage label
            ctx.font = '700 30px monospace';
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = 'rgba(255, 215, 0, 0.7)';
            ctx.shadowBlur = 12;
            ctx.fillText(stageText, centerX, bannerY + 24);

            // Stage name
            ctx.shadowBlur = 8;
            ctx.font = '600 22px monospace';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(stageName, centerX, bannerY + bannerHeight - 20);

            ctx.restore();
        }
    }

    // Debug mode: show all bosses at once
    if(debugBoss) {
        ctx.save();

        // Draw semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Update boss animation frame once per game frame
        game.bossAnimFrame += 0.05;

        // Draw all 10 bosses in a 5x2 grid
        const cols = 5;
        const rows = 2;
        const bossScale = 0.55;
        const cellWidth = canvas.width / cols;
        const cellHeight = canvas.height / rows;

        for(let i = 0; i < bosses.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = col * cellWidth + cellWidth / 2 - 100 * bossScale;
            const y = row * cellHeight + cellHeight / 2 - 100 * bossScale - 15;

            // Draw boss
            drawBoss(bosses[i], x, y, bossScale);

            // Draw label
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            const labelX = col * cellWidth + cellWidth / 2;
            const labelY = row * cellHeight + cellHeight - 15;
            ctx.fillText(bosses[i].name, labelX, labelY);
            ctx.shadowBlur = 0;
        }

        // Draw debug info
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('DEBUG BOSS MODE (window.debugBoss = false to disable)', 10, 20);

        ctx.restore();
    }

    // Debug mode: show FPS
    if(debugFPS) {
        ctx.save();
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'right';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 3;
        ctx.fillText(`FPS: ${currentFPS}`, canvas.width - 10, 20);
        ctx.restore();
    }

    ctx.restore();

    requestAnimationFrame(gameLoop);
}

const versionElement = document.getElementById('version');
if(versionElement) {
    if(VERSION_INFO.mismatch && VERSION_INFO.fromQuery) {
        const mismatchLabel = `JS ${VERSION_INFO.declared} / HTML ${VERSION_INFO.fromQuery}`;
        versionElement.textContent = `⚠️ ${mismatchLabel}`;
        versionElement.setAttribute('title', `Nesoulad verzí: ${mismatchLabel}`);
    } else {
        versionElement.textContent = GAME_VERSION;
        versionElement.removeAttribute('title');
    }
}

const gameOverOverlay = document.getElementById('gameOverOverlay');
const gameOverDialog = document.getElementById('gameOver');
const ageOverlay = document.getElementById('ageOverlay');
const ageModal = document.getElementById('ageModal');
const gradeSlider = document.getElementById('gradeSlider');
const gradeValueLabel = document.getElementById('gradeValue');
const startGameButton = document.getElementById('startGameBtn');
const restartButton = document.getElementById('restartBtn');

function initializeResponsiveScaling() {
    const viewport = document.getElementById('gameViewport');

    if(!viewport) {
        return;
    }

    const MIN_SCALE = 0.45;
    let pendingFrame = null;
    let isApplyingScale = false;

    const applyScale = () => {
        if(isApplyingScale) {
            return;
        }

        isApplyingScale = true;

        document.documentElement.style.setProperty('--height-scale', '1');
        void viewport.offsetHeight;

        const availableWidth = window.innerWidth;
        const availableHeight = window.innerHeight;

        let naturalWidth = viewport.scrollWidth;
        let naturalHeight = viewport.scrollHeight;

        if(!Number.isFinite(naturalWidth) || naturalWidth <= 0) {
            naturalWidth = availableWidth;
        }

        if(!Number.isFinite(naturalHeight) || naturalHeight <= 0) {
            naturalHeight = availableHeight;
        }

        let targetScale = Math.min(1,
            Math.max(0.0001, availableWidth / naturalWidth),
            Math.max(0.0001, availableHeight / naturalHeight)
        );

        if(!Number.isFinite(targetScale) || targetScale <= 0) {
            targetScale = 1;
        }

        targetScale = Math.max(MIN_SCALE, Math.min(1, targetScale));
        document.documentElement.style.setProperty('--height-scale', targetScale.toFixed(4));

        // Check if additional adjustment is needed after reflow
        const scaledWidth = viewport.scrollWidth;
        const scaledHeight = viewport.scrollHeight;

        const widthRatio = scaledWidth > 0 ? availableWidth / scaledWidth : 1;
        const heightRatio = scaledHeight > 0 ? availableHeight / scaledHeight : 1;
        const correctionFactor = Math.min(widthRatio, heightRatio);

        if(correctionFactor > 0 && correctionFactor < 0.999 && targetScale > MIN_SCALE) {
            const correctedScale = Math.max(MIN_SCALE, targetScale * correctionFactor);
            if(correctedScale < targetScale - 0.0001) {
                document.documentElement.style.setProperty('--height-scale', correctedScale.toFixed(4));
            }
        }

        requestAnimationFrame(() => {
            isApplyingScale = false;
        });
    };

    const scheduleScaleUpdate = () => {
        if(pendingFrame !== null) {
            cancelAnimationFrame(pendingFrame);
        }
        pendingFrame = requestAnimationFrame(() => {
            pendingFrame = null;
            applyScale();
        });
    };

    scheduleScaleUpdate();

    window.addEventListener('resize', scheduleScaleUpdate, { passive: true });
    window.addEventListener('orientationchange', scheduleScaleUpdate);

    if(typeof ResizeObserver === 'function') {
        const observer = new ResizeObserver(() => {
            if(!isApplyingScale) {
                scheduleScaleUpdate();
            }
        });
        observer.observe(viewport);
    }
}

function readStoredGrade() {
    try {
        const stored = localStorage.getItem(GRADE_STORAGE_KEY);
        const numeric = parseInt(stored, 10);
        if(!Number.isNaN(numeric) && numeric >= GRADE_SLIDER_MIN && numeric <= GRADE_SLIDER_MAX) {
            return numeric;
        }
    } catch(err) {
        // Ignore storage issues and fall back to default
    }
    return null;
}

function writeStoredGrade(value) {
    try {
        localStorage.setItem(GRADE_STORAGE_KEY, String(value));
    } catch(err) {
        // Ignore storage issues and continue without persistence
    }
}

function updateGradeLabel(value) {
    if(!gradeValueLabel) {
        return;
    }

    const normalized = Math.min(Math.max(typeof value === 'number' ? value : parseInt(value, 10) || GRADE_SLIDER_MIN, GRADE_SLIDER_MIN), GRADE_SLIDER_MAX);
    gradeValueLabel.textContent = getGradeLabel(normalized);
    updateAgeModalBackground(normalized);
}

function closeAgeModal() {
    if(ageOverlay) {
        ageOverlay.style.display = 'none';
    }
    if(ageModal) {
        ageModal.style.display = 'none';
    }
}

function openAgeModal() {
    const stored = typeof game.selectedGrade === 'number' && !Number.isNaN(game.selectedGrade)
        ? game.selectedGrade
        : readStoredGrade();
    const effective = typeof stored === 'number' && stored >= GRADE_SLIDER_MIN && stored <= GRADE_SLIDER_MAX
        ? stored
        : GRADE_SLIDER_MIN;

    game.isPausedForModal = true;

    if(gradeSlider) {
        gradeSlider.value = String(effective);
    }

    updateGradeLabel(effective);

    if(ageOverlay) {
        ageOverlay.style.display = 'block';
    }
    if(ageModal) {
        ageModal.style.display = 'block';
    }
}

function setupAgeSelectionUI() {
    if(gradeSlider) {
        gradeSlider.min = String(GRADE_SLIDER_MIN);
        gradeSlider.max = String(GRADE_SLIDER_MAX);
        gradeSlider.addEventListener('input', event => {
            updateGradeLabel(event.target.value);
        });
    }

    const storedGrade = readStoredGrade();
    const initialGrade = typeof storedGrade === 'number' ? storedGrade : GRADE_SLIDER_MIN;

    if(gradeSlider) {
        gradeSlider.value = String(initialGrade);
    }

    updateGradeLabel(initialGrade);
    game.selectedGrade = initialGrade;

    if(startGameButton) {
        startGameButton.addEventListener('click', () => {
            let sliderValue = gradeSlider ? parseInt(gradeSlider.value, 10) : initialGrade;
            if(Number.isNaN(sliderValue)) {
                sliderValue = initialGrade;
            }
            sliderValue = Math.min(Math.max(sliderValue, GRADE_SLIDER_MIN), GRADE_SLIDER_MAX);
            game.selectedGrade = sliderValue;
            writeStoredGrade(sliderValue);
            hideGameOverDialog();
            closeAgeModal();
            resetGameStateForNewRun();
        });
    }

    if(restartButton) {
        restartButton.onclick = () => {
            hideGameOverDialog();
            openAgeModal();
        };
    }
}

initializeResponsiveScaling();
setupAgeSelectionUI();

// Initialize game visuals
initBats();
initSeagulls();
game.timeState = computeDayNightState();
refreshEnvironment(game.timeState, { regenerateClouds: true });

gameLoop();
openAgeModal();
