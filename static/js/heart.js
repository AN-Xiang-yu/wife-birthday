/**
 * 结尾页 · 生日庆祝效果
 * 包含：跳动粒子爱心、双层生日蛋糕（26根蜡烛）、气球动画、发射式烟花
 */

// ============================================================
// 配置（所有可调参数都在这里）
// ============================================================
const Config = {
    heart: {
        particleCount: 1200,
        scale: 6,
        beatSpeed: 0.03,
        beatRange: 0.12,
        colors: ['#ff69b4', '#ff1493', '#ff6b9d', '#ffb6c1', '#ff85a2', '#e75480', '#ffc0cb'] // 统一使用粉红色
    },
    balloon: {
        count: 26,
        colors: [
            '#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da',
            '#fcbad3', '#a8d8ea', '#ffa07a', '#98d8c8', '#f7dc6f', '#bb8fce',
            '#85c1e2', '#f8b500', '#ff91a4', '#00d2ff', '#ff7eb9', '#79d70f',
            '#ffd700', '#ff69b4', '#00ced1', '#ff8c00', '#9370db', '#40e0d0',
            '#ff1493', '#7fffd4'
        ]
    },
    firework: {
        launchInterval: 800,
        particleCount: 150,
        trailLength: 8,
        colors: [
            '#ff0000', '#ff4500', '#ffd700', '#ffff00', '#00ff00', '#00ffff',
            '#00bfff', '#0000ff', '#8a2be2', '#ff00ff', '#ff69b4', '#ffffff',
            '#ff1493', '#7fffd4', '#ff8c00', '#9370db', '#40e0d0', '#ffa07a',
            '#98d8c8', '#f7dc6f', '#bb8fce', '#85c1e2', '#f8b500', '#ff91a4',
            '#79d70f', '#00d2ff'
        ]
    },
    cake: {
        candleCount: 26,
        scale: 1.2,
        baseWidth: 200,
        flameFlickerSpeed: 0.15,
        candleColors: [
            '#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da',
            '#fcbad3', '#a8d8ea', '#ffa07a', '#98d8c8', '#f7dc6f', '#bb8fce',
            '#85c1e2', '#f8b500', '#ff91a4', '#00d2ff', '#ff7eb9', '#79d70f',
            '#ffd700', '#ff69b4', '#00ced1', '#ff8c00', '#9370db', '#40e0d0',
            '#ff1493', '#7fffd4'
        ]
    }
};

// ============================================================
// 全局状态
// ============================================================
let canvas, ctx;
let heartParticles = [];
let balloons = [];
let fireworks = [];
let animationId = null;
let isRunning = false;
let beatPhase = 0;
let flameTime = 0;
let cakeSprinkles = [];
let cakeChocolateDrips = [];
let cakeInitialized = false;

// ============================================================
// 爱心相关
// ============================================================
function isInsideHeart(x, y, scale) {
    const nx = x / (scale * 10);
    const ny = -y / (scale * 10);
    return Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny < 0;
}

function randomPointInHeart(scale) {
    const s = scale * 10;
    let x, y, attempts = 0;
    do {
        x = (Math.random() - 0.5) * s * 2.5;
        y = (Math.random() - 0.5) * s * 2.5;
        attempts++;
    } while (!isInsideHeart(x, y, scale) && attempts < 100);
    return { x, y };
}

function initHeartParticles() {
    heartParticles = [];
    for (let i = 0; i < Config.heart.particleCount; i++) {
        const pos = randomPointInHeart(Config.heart.scale);
        heartParticles.push({
            x: pos.x,
            y: pos.y,
            originX: pos.x,
            originY: pos.y,
            size: Math.random() * 2.5 + 0.5,
            color: Config.heart.colors[Math.floor(Math.random() * Config.heart.colors.length)],
            alpha: Math.random() * 0.5 + 0.5,
            alphaSpeed: Math.random() * 0.02 + 0.01,
            alphaDirection: 1,
            wanderAngle: Math.random() * Math.PI * 2,
            wanderSpeed: Math.random() * 0.5 + 0.1,
            wanderRadius: Math.random() * 15 + 5
        });
    }
}

function updateHeartParticles() {
    heartParticles.forEach(p => {
        p.wanderAngle += p.wanderSpeed * 0.05;
        let newX = p.originX + Math.cos(p.wanderAngle) * p.wanderRadius * 0.1;
        let newY = p.originY + Math.sin(p.wanderAngle) * p.wanderRadius * 0.1;
        if (!isInsideHeart(newX, newY, Config.heart.scale)) {
            p.wanderAngle += Math.PI;
            newX = p.originX;
            newY = p.originY;
        }
        p.x = newX;
        p.y = newY;
        p.alpha += p.alphaSpeed * p.alphaDirection;
        if (p.alpha >= 1) {
            p.alpha = 1;
            p.alphaDirection = -1;
        } else if (p.alpha <= 0.3) {
            p.alpha = 0.3;
            p.alphaDirection = 1;
        }
    });
}

function drawHeart(centerX, centerY) {
    beatPhase += Config.heart.beatSpeed;
    const beatScale = 1 + Math.sin(beatPhase) * Config.heart.beatRange;
    heartParticles.forEach(p => {
        ctx.beginPath();
        ctx.arc(centerX + p.x * beatScale, centerY + p.y * beatScale, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// ============================================================
// 气球相关
// ============================================================
class Balloon {
    constructor(index, total, wave, waveDelay) {
        this.x = (canvas.width / (total + 1)) * (index + 1);
        // 让气球有更多层次：分成3-4层，每层高度不同
        const layer = index % 4; // 分成4层
        const baseY = 20 + layer * 35; // 每层间隔35像素
        this.targetY = baseY + Math.random() * 15; // 每层内也有小的随机变化
        this.y = canvas.height + 50; // 从屏幕底部开始
        this.width = 35 + Math.random() * 15;
        this.height = this.width * 1.2;
        this.color = Config.balloon.colors[index % Config.balloon.colors.length]; // 使用对应索引的颜色
        this.swayOffset = Math.random() * Math.PI * 2;
        this.swaySpeed = 0.02 + Math.random() * 0.01;
        this.riseSpeed = 1.5 + Math.random() * 0.8;
        this.startDelay = waveDelay; // 该波次的延迟时间（毫秒）
        this.startTime = Date.now(); // 记录创建时间
        this.hasStarted = false; // 是否已经开始上升
    }
    update() {
        // 检查是否到了开始上升的时间
        if (!this.hasStarted) {
            if (Date.now() - this.startTime >= this.startDelay) {
                this.hasStarted = true;
            } else {
                return; // 还没到时间，不更新
            }
        }

        if (this.y > this.targetY) {
            this.y -= this.riseSpeed;
        }
        this.swayOffset += this.swaySpeed;
    }
    draw() {
        const swayX = Math.sin(this.swayOffset) * 8;
        const x = this.x + swayX,
            y = this.y;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, y + this.height);
        ctx.quadraticCurveTo(x + swayX * 0.5, y + this.height + 40, x - swayX * 0.3, y + this.height + 70);
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(x, y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x - this.width * 0.15, y - this.height * 0.2, this.width * 0.15, this.height * 0.15, -0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x - 5, y + this.height / 2 - 2);
        ctx.lineTo(x + 5, y + this.height / 2 - 2);
        ctx.lineTo(x, y + this.height / 2 + 8);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

function initBalloons() {
    balloons = [];
    const totalBalloons = Config.balloon.count;

    // 生成从中间向两边扩展的索引顺序
    const centerIndex = Math.floor(totalBalloons / 2);
    const balloonOrder = [centerIndex];

    // 交替添加左右两边的索引
    for (let offset = 1; offset < totalBalloons; offset++) {
        if (centerIndex + offset < totalBalloons) {
            balloonOrder.push(centerIndex + offset);
        }
        if (centerIndex - offset >= 0) {
            balloonOrder.push(centerIndex - offset);
        }
    }

    // 按新顺序创建气球，分波次上升
    let currentWaveIndex = 0;
    for (let i = 0; i < balloonOrder.length; i++) {
        const balloonIndex = balloonOrder[i];

        // 每5个气球为一波，或者到达数组末尾时也算一波
        if (i > 0 && i % 5 === 0) {
            currentWaveIndex++;
        }

        const waveDelay = currentWaveIndex * 800; // 每波间隔800毫秒
        balloons.push(new Balloon(balloonIndex, totalBalloons, currentWaveIndex, waveDelay));
    }
}

// ============================================================
// 烟花相关（发射式）
// ============================================================
class FireworkParticle {
    constructor(x, y, color, angle, speed, gravity, size, decay) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.gravity = gravity;
        this.alpha = 1;
        this.decay = decay || (0.012 + Math.random() * 0.008);
        this.size = size || (Math.random() * 3 + 1);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.trail = [];
        this.maxTrail = Config.firework.trailLength;
    }
    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) this.trail.shift();
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }
    draw() {
        this.trail.forEach((pos, i) => {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, this.size * (i / this.trail.length) * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = (i / this.trail.length) * this.alpha * 0.5;
            ctx.fill();
        });
        if (this.alpha > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.alpha;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
            ctx.globalAlpha = this.alpha * 0.3;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

class Firework {
    constructor(startX) {
        this.x = startX;
        this.y = canvas.height + 10;
        this.targetY = canvas.height * (0.15 + Math.random() * 0.25);
        this.speed = 12 + Math.random() * 4;
        this.angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.3;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.trail = [];
        this.maxTrail = 15;
        this.exploded = false;
        this.particles = [];
        this.color = Config.firework.colors[Math.floor(Math.random() * Config.firework.colors.length)];
    }
    update() {
        if (!this.exploded) {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > this.maxTrail) this.trail.shift();
            this.vy += 0.15;
            this.x += this.vx;
            this.y += this.vy;
            if (this.y <= this.targetY || this.vy >= 0) this.explode();
        } else {
            this.particles.forEach(p => p.update());
            this.particles = this.particles.filter(p => p.alpha > 0);
        }
    }
    explode() {
        this.exploded = true;
        const colors = [];
        for (let i = 0; i < 3; i++) colors.push(Config.firework.colors[Math.floor(Math.random() * Config.firework.colors.length)]);
        for (let i = 0; i < Config.firework.particleCount; i++) {
            const angle = (Math.PI * 2 / Config.firework.particleCount) * i + Math.random() * 0.3;
            const speed = 2 + Math.random() * 6;
            this.particles.push(new FireworkParticle(this.x, this.y, colors[Math.floor(Math.random() * colors.length)], angle, speed, 0.06));
        }
        for (let i = 0; i < 30; i++) {
            this.particles.push(new FireworkParticle(this.x, this.y, '#ffffff', Math.random() * Math.PI * 2, 1 + Math.random() * 3, 0.04, 1, 0.025));
        }
    }
    draw() {
        if (!this.exploded) {
            ctx.beginPath();
            if (this.trail.length > 0) ctx.moveTo(this.trail[0].x, this.trail[0].y);
            this.trail.forEach(pos => ctx.lineTo(pos.x, pos.y));
            ctx.lineTo(this.x, this.y);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.8;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 1;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.5;
            ctx.fill();
            ctx.globalAlpha = 1;
        } else {
            this.particles.forEach(p => p.draw());
        }
    }
    isDead() { return this.exploded && this.particles.length === 0; }
}

let lastFireworkTime = 0;

function initFireworks() {
    fireworks = [];
    lastFireworkTime = Date.now();
}

function maybeSpawnFirework() {
    if (Date.now() - lastFireworkTime > Config.firework.launchInterval) {
        const side = Math.random() > 0.5 ? 0.1 : 0.9;
        fireworks.push(new Firework(canvas.width * (side + (Math.random() - 0.5) * 0.15)));
        lastFireworkTime = Date.now();
    }
}

// ============================================================
// 蛋糕绘制（双层，自适应）
// ============================================================
function initCakeDecorations() {
    if (cakeInitialized) return;
    cakeSprinkles = [];
    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#aa96da', '#fcbad3'];
    for (let i = 0; i < 40; i++) cakeSprinkles.push({ layer: 1, xOffset: -0.4 + Math.random() * 0.8, yOffset: Math.random(), color: colors[Math.floor(Math.random() * colors.length)], size: 2 + Math.random() * 1.5 });
    for (let i = 0; i < 30; i++) cakeSprinkles.push({ layer: 2, xOffset: -0.35 + Math.random() * 0.7, yOffset: Math.random(), color: colors[Math.floor(Math.random() * colors.length)], size: 2 + Math.random() * 1.5 });
    cakeChocolateDrips = [];
    for (let i = 0; i < 14; i++) cakeChocolateDrips.push({ angle: (i / 14) * Math.PI * 2, height: 18 + Math.random() * 25, width: 6 + Math.random() * 2 });
    cakeInitialized = true;
}

function getCakeScale() {
    const base = Config.cake.scale;
    if (canvas.width < 500) return base * 0.6;
    if (canvas.width < 768) return base * 0.8;
    if (canvas.width < 1200) return base * 1;
    return base * 1.2;
}

function drawCake(centerX, baseY) {
    const scale = getCakeScale();
    const w1 = Config.cake.baseWidth * scale,
        w2 = w1 * 0.7;
    const h1 = 55 * scale,
        h2 = 45 * scale,
        plateW = w1 + 50 * scale;
    initCakeDecorations();
    ctx.save();

    // 盘子
    ctx.beginPath();
    ctx.ellipse(centerX, baseY + 12 * scale, plateW / 2 + 8, 16 * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX, baseY, plateW / 2, 22 * scale, 0, 0, Math.PI * 2);
    const pg = ctx.createRadialGradient(centerX - 20, baseY - 10, 0, centerX, baseY, plateW / 2);
    pg.addColorStop(0, '#fff');
    pg.addColorStop(0.6, '#fafafa');
    pg.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = pg;
    ctx.fill();

    // 第一层
    const y1 = baseY - 15 * scale;
    ctx.fillStyle = '#f8c8dc';
    ctx.beginPath();
    ctx.ellipse(centerX, y1, w1 / 2, 18 * scale, 0, 0, Math.PI, true);
    ctx.fill();
    ctx.fillRect(centerX - w1 / 2, y1 - h1, w1, h1);
    ctx.beginPath();
    ctx.ellipse(centerX, y1 - h1, w1 / 2, 18 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    cakeSprinkles.filter(s => s.layer === 1).forEach(s => {
        ctx.beginPath();
        ctx.arc(centerX + s.xOffset * w1, y1 - h1 + 5 * scale + s.yOffset * (h1 - 10 * scale), s.size * scale, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
    });

    // 第二层
    const y2 = y1 - h1 - 5 * scale;
    ctx.fillStyle = '#ffb6c1';
    ctx.fillRect(centerX - w2 / 2, y2 - h2, w2, h2);
    ctx.beginPath();
    ctx.ellipse(centerX, y2, w2 / 2, 14 * scale, 0, 0, Math.PI, true);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX, y2 - h2, w2 / 2, 14 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6B3E26';
    ctx.beginPath();
    ctx.ellipse(centerX, y2 - h2, w2 / 2 - 5 * scale, 10 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    cakeChocolateDrips.forEach(d => {
        ctx.beginPath();
        ctx.ellipse(centerX + Math.cos(d.angle) * (w2 / 2 - 8 * scale), y2 - h2 + d.height * scale / 2, d.width * scale, d.height * scale / 2, 0, 0, Math.PI * 2);
        ctx.fill();
    });
    cakeSprinkles.filter(s => s.layer === 2).forEach(s => {
        ctx.beginPath();
        ctx.arc(centerX + s.xOffset * w2, y2 - h2 + 8 * scale + s.yOffset * (h2 - 16 * scale), s.size * scale, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
    });

    // 蜡烛 - 分布在两层
    const cc = Config.cake.candleCount;
    const ccols = Config.cake.candleColors;

    // 第一层蜡烛（底层）- 放置一半蜡烛
    const layer1Count = Math.floor(cc / 2); // 13根
    const cs1 = (w1 - 60 * scale) / (layer1Count - 1);
    const cby1 = y1 - h1 - 10 * scale;
    for (let i = 0; i < layer1Count; i++) {
        const cx = centerX - w1 / 2 + 30 * scale + i * cs1;
        const ch = (22 + (i % 3) * 4) * scale;
        const cw = 5 * scale;
        ctx.fillStyle = ccols[i];
        ctx.fillRect(cx - cw / 2, cby1 - ch, cw, ch);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.moveTo(cx - scale, cby1 - ch);
        ctx.lineTo(cx - scale, cby1);
        ctx.stroke();
        drawFlame(cx, cby1 - ch - 10 * scale, scale);
    }

    // 第二层蜡烛（顶层）- 放置另一半蜡烛
    const layer2Count = cc - layer1Count; // 13根
    const cs2 = (w2 - 40 * scale) / (layer2Count - 1);
    const cby2 = y2 - h2 - 10 * scale;
    for (let i = 0; i < layer2Count; i++) {
        const cx = centerX - w2 / 2 + 20 * scale + i * cs2;
        const ch = (25 + (i % 3) * 5) * scale;
        const cw = 5 * scale;
        ctx.fillStyle = ccols[layer1Count + i];
        ctx.fillRect(cx - cw / 2, cby2 - ch, cw, ch);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.moveTo(cx - scale, cby2 - ch);
        ctx.lineTo(cx - scale, cby2);
        ctx.stroke();
        drawFlame(cx, cby2 - ch - 10 * scale, scale);
    }

    ctx.restore();
}

function drawFlame(x, y, scale) {
    const f = Math.sin(flameTime + x * 0.1) * 2;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x + f * 0.3, y, 5 * scale, 12 * scale + f * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffa500';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + f * 0.2, y + 2 * scale, 3 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffff00';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y + 3 * scale, 1.5 * scale, 4 * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
}

// ============================================================
// 动画控制
// ============================================================
function initCanvas() {
    canvas = document.getElementById('heart-canvas');
    if (!canvas) return false;
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return true;
}

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (isRunning) {
        initBalloons();
        initFireworks();
        cakeInitialized = false;
    }
}

function animate() {
    if (!isRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    flameTime += Config.cake.flameFlickerSpeed;

    balloons.forEach(b => {
        b.update();
        b.draw();
    });

    const cakeBaseY = canvas.height * 0.72;
    drawCake(canvas.width / 2, cakeBaseY);

    // 爱心位置：在"亲爱的"和蛋糕之间的正中间
    // "亲爱的"大约在顶部25%位置，蛋糕顶部大约在50%位置
    const textBottomY = canvas.height * 0.25; // "亲爱的"底部
    const cakeTopY = canvas.height * 0.50; // 蛋糕顶部（估算）
    const heartY = (textBottomY + cakeTopY) / 2; // 中间位置
    updateHeartParticles();
    drawHeart(canvas.width / 2, heartY);

    maybeSpawnFirework();
    fireworks.forEach(f => {
        f.update();
        f.draw();
    });
    fireworks = fireworks.filter(f => !f.isDead());

    animationId = requestAnimationFrame(animate);
}

function startAnimation() {
    if (isRunning) return;
    if (!canvas && !initCanvas()) return;
    cakeInitialized = false;
    initHeartParticles();
    initBalloons();
    initFireworks();
    isRunning = true;
    beatPhase = 0;
    flameTime = 0;
    animate();
}

function stopAnimation() {
    isRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

document.addEventListener('pageEnter', e => {
    if (e.detail.pageName === 'ending') startAnimation();
    else stopAnimation();
});

document.addEventListener('DOMContentLoaded', () => {
    const p = document.getElementById('page-ending');
    if (p && p.classList.contains('active')) startAnimation();
});

window.HeartAnimation = { start: startAnimation, stop: stopAnimation };