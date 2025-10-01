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
    lastOperationType: null
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
            for(let i = 0; i < config.count; i++) {
                const prevBlob = prevLayer.blobs[i];
                if(prevBlob) {
                    blobs.push({
                        x: prevBlob.x,
                        y: Math.max(newRange[0], Math.min(newRange[1], prevBlob.y)),
                        width: prevBlob.width,
                        height: prevBlob.height,
                        wobble: prevBlob.wobble,
                        offset: prevBlob.offset
                    });
                } else {
                    blobs.push({
                        x: Math.random() * canvas.width,
                        y: newRange[0] + Math.random() * newSpan,
                        width: 40 + Math.random() * 60,
                        height: 14 + Math.random() * 8,
                        wobble: Math.random() * Math.PI * 2,
                        offset: Math.random() * 30
                    });
                }
            }
        } else {
            for(let i = 0; i < config.count; i++) {
                blobs.push({
                    x: Math.random() * canvas.width,
                    y: newRange[0] + Math.random() * newSpan,
                    width: 40 + Math.random() * 60,
                    height: 14 + Math.random() * 8,
                    wobble: Math.random() * Math.PI * 2,
                    offset: Math.random() * 30
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
    game.cloudLayers.forEach(layer => {
        layer.primaryColor = palette.cloudLight || layer.primaryColor;
        layer.secondaryColor = palette.cloudDark || layer.secondaryColor;
        layer.blobs.forEach(blob => {
            if(!game.isGameOver) {
                blob.x += layer.speed;
                blob.wobble += 0.01 * layer.variance;
            }

            if(blob.x > canvas.width + 80) {
                blob.x = -60 - Math.random() * 40;
            }

            const wobbleY = Math.sin(blob.wobble) * 6 * layer.variance;
            drawCloudBlob(style, layer.primaryColor, layer.secondaryColor, blob.x, blob.y + wobbleY, blob.width, blob.height, blob.wobble, layer.variance);
        });
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

function drawMountainLayer(themeName, palette, offset) {
    const spacing = 200;
    for(let x = -800; x < canvas.width + 800; x += spacing) {
        const baseX = x - offset;
        if(themeName === 'volcano' || themeName === 'molten') {
            ctx.fillStyle = palette.mountains;
            ctx.beginPath();
            ctx.moveTo(baseX, 280);
            ctx.lineTo(baseX + 60, 160);
            ctx.lineTo(baseX + 90, 200);
            ctx.lineTo(baseX + 120, 150);
            ctx.lineTo(baseX + 180, 280);
            ctx.fill();

            ctx.fillStyle = palette.mountainHighlight;
            ctx.beginPath();
            ctx.moveTo(baseX + 60, 160);
            ctx.lineTo(baseX + 90, 200);
            ctx.lineTo(baseX + 105, 210);
            ctx.lineTo(baseX + 90, 170);
            ctx.fill();

            ctx.fillStyle = palette.mountainShadow;
            ctx.beginPath();
            ctx.moveTo(baseX + 120, 150);
            ctx.lineTo(baseX + 150, 210);
            ctx.lineTo(baseX + 180, 280);
            ctx.fill();
        } else if(themeName === 'dragon') {
            ctx.fillStyle = palette.mountains;
            ctx.beginPath();
            ctx.moveTo(baseX, 280);
            ctx.lineTo(baseX + 40, 190);
            ctx.lineTo(baseX + 90, 210);
            ctx.lineTo(baseX + 120, 140);
            ctx.lineTo(baseX + 180, 200);
            ctx.lineTo(baseX + 220, 140);
            ctx.lineTo(baseX + 260, 280);
            ctx.fill();

            ctx.fillStyle = palette.mountainHighlight;
            ctx.beginPath();
            ctx.moveTo(baseX + 90, 210);
            ctx.lineTo(baseX + 120, 140);
            ctx.lineTo(baseX + 150, 180);
            ctx.fill();

            ctx.fillStyle = palette.mountainShadow;
            ctx.beginPath();
            ctx.moveTo(baseX + 180, 200);
            ctx.lineTo(baseX + 220, 140);
            ctx.lineTo(baseX + 240, 220);
            ctx.fill();
        } else if(themeName === 'tundra' || themeName === 'crystal') {
            ctx.fillStyle = palette.mountains;
            ctx.beginPath();
            ctx.moveTo(baseX, 280);
            ctx.lineTo(baseX + 70, 150);
            ctx.lineTo(baseX + 120, 180);
            ctx.lineTo(baseX + 160, 120);
            ctx.lineTo(baseX + 220, 280);
            ctx.fill();

            ctx.fillStyle = palette.mountainHighlight;
            ctx.beginPath();
            ctx.moveTo(baseX + 70, 150);
            ctx.lineTo(baseX + 120, 180);
            ctx.lineTo(baseX + 130, 170);
            ctx.lineTo(baseX + 100, 140);
            ctx.fill();

            ctx.fillStyle = palette.mountainShadow;
            ctx.beginPath();
            ctx.moveTo(baseX + 160, 120);
            ctx.lineTo(baseX + 200, 180);
            ctx.lineTo(baseX + 220, 280);
            ctx.fill();
        } else if(themeName === 'shadow' || themeName === 'storm') {
            ctx.fillStyle = palette.mountains;
            ctx.beginPath();
            ctx.moveTo(baseX, 280);
            ctx.lineTo(baseX + 50, 180);
            ctx.lineTo(baseX + 80, 220);
            ctx.lineTo(baseX + 130, 160);
            ctx.lineTo(baseX + 170, 210);
            ctx.lineTo(baseX + 210, 150);
            ctx.lineTo(baseX + 250, 280);
            ctx.fill();

            ctx.fillStyle = palette.mountainHighlight;
            ctx.beginPath();
            ctx.moveTo(baseX + 80, 220);
            ctx.lineTo(baseX + 130, 160);
            ctx.lineTo(baseX + 145, 200);
            ctx.fill();

            ctx.fillStyle = palette.mountainShadow;
            ctx.beginPath();
            ctx.moveTo(baseX + 170, 210);
            ctx.lineTo(baseX + 210, 150);
            ctx.lineTo(baseX + 230, 220);
            ctx.fill();
        } else {
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
}

function drawMidgroundLayer(themeName, palette, offset) {
    for(let x = -600; x < canvas.width + 600; x += 100) {
        const baseX = x - offset;
        if(themeName === 'volcano' || themeName === 'molten' || themeName === 'dragon') {
            ctx.fillStyle = palette.trees;
            ctx.fillRect(baseX + 36, 250, 24, 82);
            ctx.fillRect(baseX + 32, 240, 32, 12);

            ctx.fillStyle = palette.mountainHighlight;
            ctx.fillRect(baseX + 40, 242, 6, 40);

            const nightStrength = game.timeState ? game.timeState.nightStrength : (game.isDay ? 0 : 1);
            if(nightStrength > 0.05) {
                const glow = (Math.sin(Date.now() / 200 + x * 0.02) * 0.2 + 0.8) * nightStrength;
                ctx.globalAlpha = glow;
                ctx.fillStyle = '#ff8a3b';
                ctx.fillRect(baseX + 44, 280, 6, 30);
                ctx.globalAlpha = 1;
            }
        } else if(themeName === 'tundra' || themeName === 'crystal') {
            ctx.fillStyle = palette.trees;
            ctx.fillRect(baseX + 42, 260, 12, 70);
            ctx.fillRect(baseX + 38, 250, 20, 14);
            ctx.fillRect(baseX + 36, 240, 24, 12);

            ctx.fillStyle = palette.treeShadow;
            ctx.fillRect(baseX + 46, 270, 4, 60);
        } else if(themeName === 'shadow' || themeName === 'storm') {
            ctx.fillStyle = palette.trees;
            ctx.fillRect(baseX + 38, 260, 14, 70);
            ctx.fillRect(baseX + 32, 250, 26, 16);
            ctx.fillRect(baseX + 28, 240, 32, 14);

            ctx.fillStyle = palette.treeShadow;
            ctx.fillRect(baseX + 42, 268, 8, 62);
        } else if(themeName === 'necropolis') {
            ctx.fillStyle = palette.trees;
            ctx.fillRect(baseX + 36, 270, 20, 60);
            ctx.fillRect(baseX + 30, 260, 32, 18);

            ctx.fillStyle = palette.treeShadow;
            ctx.fillRect(baseX + 44, 278, 6, 52);
        } else {
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
    }
    ctx.globalAlpha = 1;
}

function drawForegroundLayer(themeName, palette, offset) {
    for(let x = -400; x < canvas.width + 400; x += 80) {
        const baseX = x - offset;
        if(themeName === 'volcano' || themeName === 'molten' || themeName === 'dragon') {
            const time = Date.now() / 300 + x * 0.02;
            const glow = Math.sin(time) * 0.3 + 0.7;
            ctx.globalAlpha = glow;
            ctx.fillStyle = palette.bushes;
            ctx.fillRect(baseX + 10, 325, 30, 10);
            ctx.fillRect(baseX + 18, 315, 16, 10);

            ctx.fillStyle = '#ffb347';
            ctx.fillRect(baseX + 18, 327, 14, 4);
            ctx.globalAlpha = 1;
        } else if(themeName === 'tundra' || themeName === 'crystal') {
            ctx.fillStyle = palette.bushes;
            ctx.fillRect(baseX + 12, 320, 28, 20);
            ctx.fillRect(baseX + 6, 330, 36, 12);

            ctx.fillStyle = palette.bushShadow;
            ctx.fillRect(baseX + 18, 332, 12, 16);
        } else if(themeName === 'shadow' || themeName === 'storm') {
            ctx.fillStyle = palette.bushes;
            ctx.fillRect(baseX + 8, 320, 34, 18);
            ctx.fillRect(baseX + 2, 330, 44, 16);

            ctx.fillStyle = palette.bushShadow;
            ctx.fillRect(baseX + 16, 334, 16, 12);
        } else if(themeName === 'necropolis') {
            ctx.fillStyle = palette.bushes;
            ctx.fillRect(baseX + 12, 320, 32, 16);
            ctx.fillRect(baseX + 6, 330, 36, 14);

            ctx.fillStyle = palette.bushShadow;
            ctx.fillRect(baseX + 20, 332, 12, 12);
        } else {
            ctx.fillStyle = palette.bushes;
            ctx.fillRect(baseX + 10, 320, 30, 20);
            ctx.fillRect(baseX + 5, 330, 40, 15);

            ctx.fillStyle = palette.bushShadow;
            ctx.fillRect(baseX + 18, 332, 12, 12);
        }
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
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
let audioUnlocked = false;
let audioUnlocking = false;
const audioUnlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown'];

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

    audioUnlocking = true;
    ensureAudioContext().then(() => {
        if(audioUnlocked) {
            audioUnlocking = false;
            removeAudioUnlockListeners();
            return;
        }

        const buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        if(typeof source.start === 'function') {
            source.start(0);
        } else if(typeof source.noteOn === 'function') {
            source.noteOn(0);
        }

        audioUnlocked = true;
        audioUnlocking = false;
        removeAudioUnlockListeners();
    }).catch(() => {
        audioUnlocking = false;
    });
}

audioUnlockEvents.forEach(evt => {
    window.addEventListener(evt, unlockAudioContext, { passive: true });
});

async function ensureAudioContext() {
    if(audioContext.state === 'suspended') {
        try {
            await audioContext.resume();
        } catch(err) {
            // Ignore resume errors - the next user interaction should succeed
        }
    }
}

async function playSqueak() {
    await ensureAudioContext();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

    const baseGain = isMobile ? 0.55 : 0.35;
    gainNode.gain.setValueAtTime(baseGain, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.06, baseGain * 0.18), audioContext.currentTime + 0.18);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
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
    const windWave = Math.sin(Date.now() / 200);

    if(game.isGameOver && !game.witchDeathAnim) {
        return;
    }

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

    // Broomstick handle
    ctx.fillStyle = '#7a4a1a';
    ctx.fillRect(x - 10, y + 34 + bounce, 70, 5);
    ctx.fillStyle = '#5f3610';
    ctx.fillRect(x + 40, y + 33 + bounce, 20, 7);

    // Broom binding and bristles
    const sway = Math.sin(Date.now() / 160) * 2;
    ctx.fillStyle = '#c48a3a';
    ctx.fillRect(x - 8, y + 32 + bounce, 6, 10);
    ctx.fillStyle = '#e0a647';
    for(let i = 0; i < 5; i++) {
        const offset = sway + i * 3;
        ctx.fillRect(x - 20 + offset, y + 30 + bounce + i, 10, 3);
        ctx.fillRect(x - 20 + offset, y + 36 + bounce + i, 12, 3);
    }

    // Legs tucked along the broom
    ctx.fillStyle = '#28122b';
    ctx.fillRect(x + 20, y + 36 + bounce, 10, 6);
    ctx.fillRect(x + 30, y + 36 + bounce, 12, 6);
    ctx.fillRect(x + 42, y + 38 + bounce, 8, 4);

    // Dress billowing back
    const dressWave = Math.sin(Date.now() / 190) * 3;
    const dressTrail = Math.sin(Date.now() / 210 + 0.4) * 4;
    ctx.fillStyle = '#5b1a6d';
    ctx.fillRect(x + 18, y + 14 + bounce, 18, 18);
    ctx.fillRect(x + 14 + dressWave, y + 20 + bounce, 12, 16);
    ctx.fillRect(x + 10 + dressTrail, y + 24 + bounce, 10, 12);
    ctx.fillStyle = '#732386';
    ctx.fillRect(x + 20, y + 18 + bounce, 14, 12);
    ctx.fillRect(x + 12 + dressWave, y + 28 + bounce, 12, 8);

    // Torso leaning forward
    ctx.fillStyle = '#ffd6bc';
    ctx.fillRect(x + 26, y + 12 + bounce, 8, 12);

    // Arms gripping the broomstick
    ctx.fillRect(x + 18, y + 18 + bounce, 5, 6);
    ctx.fillRect(x + 32, y + 18 + bounce, 5, 6);
    ctx.fillRect(x + 21, y + 22 + bounce, 6, 4);
    ctx.fillRect(x + 33, y + 22 + bounce, 6, 4);

    // Hands wrapped around handle
    ctx.fillRect(x + 16, y + 24 + bounce, 4, 4);
    ctx.fillRect(x + 36, y + 24 + bounce, 4, 4);

    // Head looking forward
    ctx.fillStyle = '#ffd6bc';
    ctx.fillRect(x + 24, y - 6 + bounce, 12, 14);
    ctx.fillRect(x + 32, y - 2 + bounce, 2, 8);

    // Eye and features facing forward
    ctx.fillStyle = '#201020';
    ctx.fillRect(x + 32, y + 0 + bounce, 2, 2);
    ctx.fillRect(x + 28, y + 3 + bounce, 3, 1);

    // Long black hair streaming behind
    const hairFlow = Math.sin(Date.now() / 140) * 4;
    const hairRipple = Math.sin(Date.now() / 160 + 0.5) * 5;
    ctx.fillStyle = '#0b0b15';
    ctx.fillRect(x + 14 + hairFlow, y - 4 + bounce, 10, 12);
    ctx.fillRect(x + 6 + hairRipple, y - 2 + bounce, 12, 10);
    ctx.fillRect(x + 2 + hairRipple, y + 2 + bounce, 12, 8);
    ctx.fillRect(x - 2 + hairFlow, y + 4 + bounce, 10, 6);

    // Additional hair strands for motion
    ctx.fillRect(x + 8 + hairRipple, y - 6 + bounce, 6, 6);
    ctx.fillRect(x + 0 + hairFlow, y - 2 + bounce, 6, 8);

    // Wind-swept dress highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x + 18, y + 20 + bounce, 6, 10);
    ctx.fillRect(x + 12 + dressTrail, y + 26 + bounce, 4, 8);

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

function buildQuestionForStage(stage) {
    switch(stage) {
        case 1: {
            const a = randInt(0, 10);
            const b = randInt(0, 10 - a);
            const sum = a + b;
            return {
                questionText: `${a} + ${b} = ?`,
                correctAnswer: sum,
                operands: [a, b],
                answerRangeMax: 10,
                key: `1|${a}|${b}`
            };
        }
        case 2: {
            const a = randInt(0, 10);
            const b = randInt(0, a);
            const diff = a - b;
            return {
                questionText: `${a} - ${b} = ?`,
                correctAnswer: diff,
                operands: [a, b],
                answerRangeMax: 10,
                key: `2|${a}|${b}`
            };
        }
        case 3: {
            const a = randInt(0, 10);
            const missing = randInt(0, 10 - a);
            const b = missing + a;
            return {
                questionText: `? + ${a} = ${b}`,
                correctAnswer: missing,
                operands: [a, b],
                answerRangeMax: 10,
                key: `3|${a}|${b}`
            };
        }
        case 4: {
            const a = randInt(0, 10);
            const missing = randInt(0, a);
            const b = a - missing;
            return {
                questionText: `${a} - ? = ${b}`,
                correctAnswer: missing,
                operands: [a, b],
                answerRangeMax: 10,
                key: `4|${a}|${b}`
            };
        }
        case 5: {
            const a = randInt(0, 20);
            const b = randInt(0, 20 - a);
            const sum = a + b;
            return {
                questionText: `${a} + ${b} = ?`,
                correctAnswer: sum,
                operands: [a, b],
                answerRangeMax: 20,
                key: `5|${a}|${b}`
            };
        }
        case 6: {
            const a = randInt(0, 20);
            const b = randInt(0, a);
            const diff = a - b;
            return {
                questionText: `${a} - ${b} = ?`,
                correctAnswer: diff,
                operands: [a, b],
                answerRangeMax: 20,
                key: `6|${a}|${b}`
            };
        }
        case 7: {
            const maxTotal = 10;
            const a = randInt(0, maxTotal);
            const remainingAfterA = maxTotal - a;
            const b = randInt(0, remainingAfterA);
            const c = randInt(0, maxTotal - a - b);
            const sum = a + b + c;
            return {
                questionText: `${a} + ${b} + ${c} = ?`,
                correctAnswer: sum,
                operands: [a, b, c],
                answerRangeMax: 10,
                key: `7|${a}|${b}|${c}`
            };
        }
        case 8: {
            const maxTotal = 20;
            const a = randInt(0, maxTotal);
            const remainingAfterA = maxTotal - a;
            const b = randInt(0, remainingAfterA);
            const c = randInt(0, maxTotal - a - b);
            const sum = a + b + c;
            return {
                questionText: `${a} + ${b} + ${c} = ?`,
                correctAnswer: sum,
                operands: [a, b, c],
                answerRangeMax: 20,
                key: `8|${a}|${b}|${c}`
            };
        }
        case 9: {
            const a = randInt(0, 30);
            const b = randInt(0, 30 - a);
            const sum = a + b;
            return {
                questionText: `${a} + ${b} = ?`,
                correctAnswer: sum,
                operands: [a, b],
                answerRangeMax: 30,
                key: `9|${a}|${b}`
            };
        }
        case 10:
        default: {
            const a = randInt(0, 30);
            const b = randInt(0, a);
            const diff = a - b;
            return {
                questionText: `${a} - ${b} = ?`,
                correctAnswer: diff,
                operands: [a, b],
                answerRangeMax: 30,
                key: `10|${a}|${b}`
            };
        }
    }
}

function determineOperationType(stage, questionData) {
    const operands = questionData.operands || [];

    if((stage === 1 || stage === 5 || stage === 9) && operands.length >= 2) {
        if(operands[0] === operands[1]) {
            return 'double-add';
        }
        return null;
    }

    if((stage === 2 || stage === 6 || stage === 10) && operands.length >= 2) {
        if(operands[0] === operands[1]) {
            return 'double-sub';
        }
        return null;
    }

    if((stage === 7 || stage === 8) && operands.length === 3) {
        if(operands[0] === operands[1] && operands[1] === operands[2]) {
            return 'triple-add';
        }
        return null;
    }

    return null;
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
        questionData = buildQuestionForStage(game.stage);

        const operandsUsedRecently = game.recentOperands.some(previous =>
            previous.some(value => questionData.operands.includes(value))
        );

        const operationType = determineOperationType(game.stage, questionData);
        const answerRepeats = questionData.correctAnswer === game.lastCorrectAnswer;
        const operationRepeats = operationType && operationType === game.lastOperationType;
        const problemRepeated = game.recentProblems.includes(questionData.key);

        if(problemRepeated || operandsUsedRecently || answerRepeats || operationRepeats) {
            if(attempts >= maxAttempts) {
                selectedOperationType = operationType || null;
                shouldRecordProblem = true;
                break;
            }
            continue;
        }
        selectedOperationType = operationType || null;
        shouldRecordProblem = true;
        break;
    } while(attempts < maxAttempts);

    if(shouldRecordProblem) {
        game.recentProblems.push(questionData.key);
        if(game.recentProblems.length > 3) {
            game.recentProblems.shift();
        }

        game.recentOperands.push([...questionData.operands]);
        if(game.recentOperands.length > 3) {
            game.recentOperands.shift();
        }
    }

    const answersSet = new Set([questionData.correctAnswer]);
    while(answersSet.size < 5) {
        const wrong = randInt(0, questionData.answerRangeMax);
        if(!answersSet.has(wrong)) {
            answersSet.add(wrong);
        }
    }

    const answers = Array.from(answersSet);
    shuffleArray(answers);

    game.currentQuestion = {
        questionText: questionData.questionText,
        correctAnswer: questionData.correctAnswer,
        answers
    };

    game.lastCorrectAnswer = questionData.correctAnswer;
    game.lastOperationType = selectedOperationType;

    game.startTime = Date.now();

    document.getElementById('question').textContent = questionData.questionText;
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
        originX: 140,
        originY: 150,
        alpha: 1,
        color: '#ffd700',
        hasHit: false,
        isMiss: isMiss,
        missTargetX: targetX,
        missTargetY: targetY,
        phase: 'charge',
        startTime: Date.now(),
        chargeDuration: 200,
        chargeProgress: 0,
        radius: 2,
        maxRadius: 14,
        trail: []
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
            targetX = game.isBossFight ? game.bossX + 100 : game.monsterX + 30;
            targetY = 200;
        }

        const previousX = effect.x;
        const previousY = effect.y;

        effect.x += (targetX - effect.x) * 0.2;
        effect.y += (targetY - effect.y) * 0.2;

        const dx = effect.x - previousX;
        const dy = effect.y - previousY;
        if(dx !== 0 || dy !== 0) {
            effect.directionAngle = Math.atan2(dy, dx);
        }

        effect.radius += (effect.maxRadius - effect.radius) * 0.25;
        effect.trail.unshift({
            x: effect.x,
            y: effect.y,
            radius: effect.radius,
            alpha: 0.6
        });
        if(effect.trail.length > 6) {
            effect.trail.pop();
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

                            // Refresh environment to match the new stage theme
                            refreshEnvironment(game.timeState || computeDayNightState(), { regenerateClouds: true });

                            game.monsterX = canvas.width;
                            game.monsterSpeed = 1; // Reset speed to default
                            game.bossX = 800;
                            game.currentMonster = monsters[Math.floor(Math.random() * monsters.length)];

                            // Show stage announcement, then generate problem
                            showStageAnnouncement(game.stage);

                            // Re-enable buttons
                            clearAnswerLock();
                            setAnswerButtonsDisabled(false);
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
                        clearAnswerLock();
                        setAnswerButtonsDisabled(false);
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
    clearAnswerLock();
    setAnswerButtonsDisabled(true, { locked: true });

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
    initBats();
    initSeagulls();
    refreshEnvironment(game.timeState, { regenerateClouds: true });

    document.getElementById('gameOverOverlay').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    updateScore();

    game.currentMonster = monsters[Math.floor(Math.random() * monsters.length)];
    showStageAnnouncement(1);
};

// Draw parallax background
function drawBackground() {
    if(!game.isGameOver) {
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

    const stageY = 375;
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
                    clearAnswerLock();
                    setAnswerButtonsDisabled(false);
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
        const effect = game.spellEffect;
        const now = Date.now();

        if(effect.phase === 'charge') {
            const progress = effect.chargeProgress !== undefined
                ? effect.chargeProgress
                : clamp01((now - effect.startTime) / effect.chargeDuration);
            const collapse = Math.pow(Math.max(0, 1 - progress), 0.85);
            const baseRadius = 45;

            // Soft ambient glow that tightens as energy concentrates
            const glowRadius = baseRadius * collapse + 18;
            const glowGradient = ctx.createRadialGradient(
                effect.originX,
                effect.originY,
                glowRadius * 0.25,
                effect.originX,
                effect.originY,
                glowRadius
            );
            glowGradient.addColorStop(0, 'rgba(255, 255, 240, 0.75)');
            glowGradient.addColorStop(0.4, 'rgba(255, 220, 120, 0.55)');
            glowGradient.addColorStop(1, 'rgba(255, 160, 0, 0.05)');

            ctx.save();
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(effect.originX, effect.originY, glowRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Elliptical swirl for a subtle 3D feel
            ctx.save();
            ctx.translate(effect.originX, effect.originY);
            const wobble = Math.sin(now / 220) * 0.2;
            ctx.rotate(wobble);
            const squash = 0.55 + Math.sin(now / 260) * 0.1;
            ctx.scale(1.3, squash);

            for(let i = 0; i < 3; i++) {
                const offsetProgress = (progress * 1.5 + i * 0.25) % 1;
                const ringRadius = Math.max(6, (baseRadius - i * 10) * collapse + 8);
                const ringAlpha = clamp01(0.65 - offsetProgress * 0.5);

                ctx.globalAlpha = ringAlpha;
                ctx.lineWidth = 6 - i * 1.8;
                ctx.strokeStyle = `rgba(255, ${200 - i * 30}, ${80 + i * 20}, ${0.7 - i * 0.15})`;
                ctx.beginPath();
                ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();

            // Sparking motes spiralling inward
            for(let i = 0; i < 6; i++) {
                const spin = now / 90 + i * (Math.PI * 2 / 6);
                const orbit = (baseRadius * 0.6) * collapse + 6;
                const px = effect.originX + Math.cos(spin) * orbit;
                const py = effect.originY + Math.sin(spin) * orbit * 0.55;
                ctx.globalAlpha = 0.6 - progress * 0.3;
                ctx.fillStyle = '#fff8dc';
                ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
            }

            // Intensifying core that collapses into the launch point
            const coreRadius = Math.max(2, 10 * collapse);
            const coreGradient = ctx.createRadialGradient(
                effect.originX,
                effect.originY,
                0,
                effect.originX,
                effect.originY,
                coreRadius * 2
            );
            coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            coreGradient.addColorStop(0.6, 'rgba(255, 240, 180, 0.85)');
            coreGradient.addColorStop(1, 'rgba(255, 200, 80, 0.3)');

            ctx.globalAlpha = 1;
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(effect.originX, effect.originY, coreRadius * 1.2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const radius = effect.radius || 10;

            // Trailing bloom
            if(effect.trail && effect.trail.length) {
                for(let i = 0; i < effect.trail.length; i++) {
                    const segment = effect.trail[i];
                    const fade = 1 - i / effect.trail.length;
                    ctx.globalAlpha = (segment.alpha || 0.4) * fade * 0.6;
                    const tailGradient = ctx.createRadialGradient(
                        segment.x,
                        segment.y,
                        0,
                        segment.x,
                        segment.y,
                        (segment.radius || radius) * 1.6
                    );
                    tailGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                    tailGradient.addColorStop(0.6, 'rgba(255, 210, 120, 0.25)');
                    tailGradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
                    ctx.fillStyle = tailGradient;
                    ctx.beginPath();
                    ctx.arc(segment.x, segment.y, (segment.radius || radius) * 1.1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Main projectile orb that grows mid-flight
            const projectileGradient = ctx.createRadialGradient(
                effect.x,
                effect.y,
                0,
                effect.x,
                effect.y,
                radius * 2.2
            );
            projectileGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            projectileGradient.addColorStop(0.2, 'rgba(255, 250, 210, 0.9)');
            projectileGradient.addColorStop(0.6, 'rgba(255, 200, 80, 0.8)');
            projectileGradient.addColorStop(1, 'rgba(255, 120, 0, 0)');

            ctx.globalAlpha = effect.alpha;
            ctx.fillStyle = projectileGradient;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
            ctx.fill();

            // Leading highlight that stretches in the travel direction
            if(typeof effect.directionAngle === 'number') {
                ctx.save();
                ctx.translate(effect.x, effect.y);
                ctx.rotate(effect.directionAngle);
                const highlightGradient = ctx.createLinearGradient(0, 0, radius * 1.8, 0);
                highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = highlightGradient;
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.ellipse(radius * 0.4, 0, radius * 1.1, radius * 0.45, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Sparkling embers around the projectile
            for(let i = 0; i < 6; i++) {
                const angle = now / 80 + i * (Math.PI * 2 / 6);
                const distance = radius * 1.4;
                const px = effect.x + Math.cos(angle) * distance;
                const py = effect.y + Math.sin(angle) * distance;
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#fff4c2';
                ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
            }
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
game.timeState = computeDayNightState();
refreshEnvironment(game.timeState, { regenerateClouds: true });
game.currentMonster = monsters[Math.floor(Math.random() * monsters.length)];
showStageAnnouncement(1);
gameLoop();
