/**
 * 结尾页 · 粒子跳动爱心效果
 * 
 * 粒子在爱心形状内游走，整体有呼吸般的上下起伏
 */

// ============================================================
// 配置
// ============================================================
const HeartConfig = {
    particleCount: 1500, // 粒子数量
    heartScale: 8, // 爱心大小
    beatSpeed: 0.02, // 心跳速度
    beatRange: 0.1, // 心跳幅度
    particleSpeed: 0.5, // 粒子游走速度
    colors: [ // 粒子颜色（蓝色调）
        '#00bfff', // 深天蓝
        '#1e90ff', // 道奇蓝
        '#4169e1', // 皇家蓝
        '#6495ed', // 矢车菊蓝
        '#87ceeb', // 天蓝
        '#00ced1', // 暗青色
        '#5f9ea0', // 军校蓝
    ]
};

// ============================================================
// 状态
// ============================================================
let canvas, ctx;
let particles = [];
let heartPoints = [];
let beatPhase = 0;
let animationId = null;
let isRunning = false;

// ============================================================
// 爱心数学函数
// ============================================================

/**
 * 爱心曲线参数方程
 * @param {number} t - 参数 (0 到 2π)
 * @param {number} scale - 缩放比例
 * @returns {{x: number, y: number}}
 */
function heartFunction(t, scale = 1) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return {
        x: x * scale,
        y: y * scale
    };
}

/**
 * 生成爱心轮廓上的点
 */
function generateHeartPoints() {
    heartPoints = [];
    const steps = 100;
    for (let i = 0; i < steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        heartPoints.push(heartFunction(t, HeartConfig.heartScale));
    }
}

/**
 * 检查点是否在爱心内部
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function isInsideHeart(x, y) {
    const scale = HeartConfig.heartScale * 10;
    const nx = x / scale;
    const ny = -y / scale;
    const value = Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny;
    return value < 0;
}

/**
 * 在爱心内部生成随机点
 * @returns {{x: number, y: number}}
 */
function randomPointInHeart() {
    const scale = HeartConfig.heartScale * 10;
    let x, y;
    let attempts = 0;

    do {
        x = (Math.random() - 0.5) * scale * 2.5;
        y = (Math.random() - 0.5) * scale * 2.5;
        attempts++;
    } while (!isInsideHeart(x, y) && attempts < 100);

    return { x, y };
}

// ============================================================
// 粒子类
// ============================================================

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        const pos = randomPointInHeart();
        this.x = pos.x;
        this.y = pos.y;
        this.originX = this.x;
        this.originY = this.y;

        // 随机颜色
        this.color = HeartConfig.colors[Math.floor(Math.random() * HeartConfig.colors.length)];

        // 粒子大小
        this.size = Math.random() * 2 + 0.5;

        // 游走参数
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderSpeed = Math.random() * HeartConfig.particleSpeed + 0.1;
        this.wanderRadius = Math.random() * 20 + 5;

        // 闪烁
        this.alpha = Math.random() * 0.5 + 0.5;
        this.alphaSpeed = Math.random() * 0.02 + 0.01;
        this.alphaDirection = 1;
    }

    update(beatScale, centerX, centerY) {
        // 游走
        this.wanderAngle += this.wanderSpeed * 0.05;
        const wanderX = Math.cos(this.wanderAngle) * this.wanderRadius * 0.1;
        const wanderY = Math.sin(this.wanderAngle) * this.wanderRadius * 0.1;

        // 计算当前位置
        let newX = this.originX + wanderX;
        let newY = this.originY + wanderY;

        // 如果游走出爱心，则回弹
        if (!isInsideHeart(newX, newY)) {
            this.wanderAngle += Math.PI;
            newX = this.originX;
            newY = this.originY;
        }

        this.x = newX;
        this.y = newY;

        // 闪烁效果
        this.alpha += this.alphaSpeed * this.alphaDirection;
        if (this.alpha >= 1) {
            this.alpha = 1;
            this.alphaDirection = -1;
        } else if (this.alpha <= 0.3) {
            this.alpha = 0.3;
            this.alphaDirection = 1;
        }
    }

    draw(ctx, beatScale, centerX, centerY) {
        // 应用心跳缩放
        const drawX = centerX + this.x * beatScale;
        const drawY = centerY + this.y * beatScale;

        ctx.beginPath();
        ctx.arc(drawX, drawY, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// ============================================================
// 动画控制
// ============================================================

/**
 * 初始化画布
 */
function initCanvas() {
    canvas = document.getElementById('heart-canvas');
    if (!canvas) return false;

    ctx = canvas.getContext('2d');
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);
    return true;
}

/**
 * 调整画布大小
 */
function resizeCanvas() {
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

/**
 * 初始化粒子
 */
function initParticles() {
    generateHeartPoints();
    particles = [];

    for (let i = 0; i < HeartConfig.particleCount; i++) {
        particles.push(new Particle());
    }
}

/**
 * 动画循环
 */
function animate() {
    if (!isRunning) return;

    // 清除画布（透明背景）
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2; // 爱心在页面正中间

    // 心跳效果
    beatPhase += HeartConfig.beatSpeed;
    const beatScale = 1 + Math.sin(beatPhase) * HeartConfig.beatRange;

    // 更新和绘制粒子
    particles.forEach(particle => {
        particle.update(beatScale, centerX, centerY);
        particle.draw(ctx, beatScale, centerX, centerY);
    });

    animationId = requestAnimationFrame(animate);
}

/**
 * 开始动画
 */
function startHeartAnimation() {
    if (isRunning) return;

    if (!canvas && !initCanvas()) return;

    initParticles();
    isRunning = true;

    animate();
}

/**
 * 停止动画
 */
function stopHeartAnimation() {
    isRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

// ============================================================
// 事件监听
// ============================================================

// 页面进入时启动动画
document.addEventListener('pageEnter', (e) => {
    if (e.detail.pageName === 'ending') {
        startHeartAnimation();
    } else {
        stopHeartAnimation();
    }
});

// 页面加载完成后，如果当前就是结尾页则启动
document.addEventListener('DOMContentLoaded', () => {
    const endingPage = document.getElementById('page-ending');
    if (endingPage && endingPage.classList.contains('active')) {
        startHeartAnimation();
    }
});

// 导出
window.HeartAnimation = {
    start: startHeartAnimation,
    stop: stopHeartAnimation
};