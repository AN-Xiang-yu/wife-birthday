/**
 * 生日纪念网站 · 主逻辑
 * 
 * 负责页面切换、全局状态管理、进度指示器
 * 情绪节奏：好奇 → 参与 → 回忆 → 共鸣 → 轻松 → 落点
 */

// ============================================================
// 全局状态
// ============================================================
const AppState = {
    currentPage: 0,
    pages: [
        'intro',
        'timeline',
        'moments',
        'letter',
        'secret',
        'playful',
        'ending'
    ],
    isTransitioning: false
};

// ============================================================
// 配置样式注入（字体大小）
// ============================================================

function applyConfigStyles() {
    const config = window.AppConfig || {};
    const root = document.documentElement;

    const setRemVar = (name, value) => {
        if (value === undefined || value === null) return;
        const parsed = typeof value === 'number' ? value : parseFloat(value);
        if (Number.isNaN(parsed)) return;
        root.style.setProperty(name, `${parsed}rem`);
    };

    setRemVar('--intro-text-size', config.INTRO_TEXT_SIZE_REM);
    setRemVar('--timeline-text-size', config.TIMELINE_TEXT_SIZE_REM);
    setRemVar('--letter-text-size', config.LETTER_TEXT_SIZE_REM);
    setRemVar('--letter-label-size', config.LETTER_LABEL_SIZE_REM);
}

applyConfigStyles();

// ============================================================
// 点击特效（除开场页）
// ============================================================

const GlobalClickEffects = {
    isInitialized: false,
    symbols: [
        { symbol: '💗', className: 'heart' },
        { symbol: '🌹', className: 'rose' },
        { symbol: '🌹', className: 'rose rose-red' },
        { symbol: '🌹', className: 'rose rose-yellow' },
        { symbol: '🌹', className: 'rose rose-white' },
        { symbol: '🌹', className: 'rose rose-black' },
        { symbol: '🌹', className: 'rose rose-blue' },
        { symbol: '🌹', className: 'rose rose-peach' },
        { symbol: '🌹', className: 'rose rose-gold' },
        { symbol: '🌹', className: 'rose rose-purple' },
        { symbol: '💐', className: 'bouquet' }
    ]
};

function shouldSkipGlobalClickEffect() {
    const currentName = AppState.pages[AppState.currentPage];
    return currentName === 'intro' || currentName === 'timeline';
}

function createGlobalClickBurst(x, y) {
    const burstCount = 4;
    const container = document.body;

    for (let i = 0; i < burstCount; i += 1) {
        const config = GlobalClickEffects.symbols[Math.floor(Math.random() * GlobalClickEffects.symbols.length)];
        const item = document.createElement('span');
        item.className = `global-click-effect ${config.className}`;
        item.textContent = config.symbol;

        const size = 16 + Math.random() * 12;
        const shift = (Math.random() * 2 - 1) * 50;
        const rotation = (Math.random() * 2 - 1) * 30;

        item.style.left = `${x}px`;
        item.style.top = `${y}px`;
        item.style.fontSize = `${size}px`;
        item.style.setProperty('--click-shift', `${shift}px`);
        item.style.setProperty('--click-rotate', `${rotation}deg`);

        container.appendChild(item);

        item.addEventListener('animationend', () => {
            item.remove();
        });
    }
}

function initGlobalClickEffects() {
    if (GlobalClickEffects.isInitialized) return;

    document.addEventListener('click', (event) => {
        if (shouldSkipGlobalClickEffect()) return;
        createGlobalClickBurst(event.clientX, event.clientY);
    }, { passive: true });

    GlobalClickEffects.isInitialized = true;
}

// ============================================================
// 全局花雨效果（多页面共享）
// ============================================================

const GlobalRainEffect = {
    isInitialized: false,
    rainLayer: null,
    rainInterval: null,
    currentPage: null,
    symbols: [
        { symbol: '💗', className: 'heart' },
        { symbol: '🌹', className: 'rose' }
    ],
    // 需要显示花雨的页面（除了 intro 和 ending）
    enabledPages: ['timeline', 'moments', 'letter', 'secret', 'playful']
};

function initGlobalRainEffect() {
    if (GlobalRainEffect.isInitialized) return;

    // 创建全局花雨容器
    GlobalRainEffect.rainLayer = App.createElement('div', {
        className: 'global-rain-layer',
        'aria-hidden': 'true'
    });
    document.body.appendChild(GlobalRainEffect.rainLayer);

    GlobalRainEffect.isInitialized = true;
}

function shouldShowRain(pageName) {
    return GlobalRainEffect.enabledPages.includes(pageName);
}

function startGlobalRain() {
    if (GlobalRainEffect.rainInterval) return;

    // 初始生成一些花雨
    seedGlobalRainItems();

    // 启动持续飘落
    const interval = window.AppConfig?.RAIN_SPAWN_INTERVAL || 650;
    GlobalRainEffect.rainInterval = setInterval(() => {
        pruneGlobalRainItems();
        GlobalRainEffect.rainLayer.appendChild(createGlobalRainItem());
    }, interval);
}

function stopGlobalRain() {
    if (!GlobalRainEffect.rainInterval) return;
    clearInterval(GlobalRainEffect.rainInterval);
    GlobalRainEffect.rainInterval = null;

    // 清空所有花雨
    if (GlobalRainEffect.rainLayer) {
        GlobalRainEffect.rainLayer.innerHTML = '';
    }
}

function seedGlobalRainItems() {
    if (!GlobalRainEffect.rainLayer) return;

    const totalItems = window.AppConfig?.RAIN_INITIAL_ITEMS || 36;
    GlobalRainEffect.rainLayer.innerHTML = '';

    for (let i = 0; i < totalItems; i++) {
        GlobalRainEffect.rainLayer.appendChild(createGlobalRainItem(true));
    }
}

function pruneGlobalRainItems() {
    if (!GlobalRainEffect.rainLayer) return;

    const maxItems = window.AppConfig?.RAIN_MAX_ITEMS || 120;
    const items = GlobalRainEffect.rainLayer.querySelectorAll('.global-rain-item');
    if (items.length <= maxItems) return;

    const overflow = items.length - maxItems;
    for (let i = 0; i < overflow; i++) {
        items[i].remove();
    }
}

function createGlobalRainItem(useDelay = false) {
    const config = GlobalRainEffect.symbols[Math.floor(Math.random() * GlobalRainEffect.symbols.length)];
    const item = document.createElement('span');
    item.className = `global-rain-item ${config.className}`;
    item.textContent = config.symbol;

    const left = Math.random() * 100;
    const duration = 6 + Math.random() * 6;
    const delay = useDelay ? Math.random() * 6 : 0;
    const size = 14 + Math.random() * 18;
    const opacity = 0.5 + Math.random() * 0.5;
    const drift = (Math.random() * 2 - 1) * 80;

    item.style.left = `${left}%`;
    item.style.fontSize = `${size}px`;
    item.style.opacity = `${opacity}`;
    item.style.setProperty('--fall-duration', `${duration}s`);
    item.style.setProperty('--fall-delay', `${delay}s`);
    item.style.setProperty('--fall-drift', `${drift}px`);

    item.addEventListener('animationend', () => {
        item.remove();
    });

    return item;
}

function updateGlobalRain(pageName) {
    if (!GlobalRainEffect.isInitialized) return;

    if (shouldShowRain(pageName)) {
        startGlobalRain();
    } else {
        stopGlobalRain();
    }

    GlobalRainEffect.currentPage = pageName;
}

// ============================================================
// 页面切换
// ============================================================

/**
 * 切换到指定页面
 * @param {string|number} target - 页面名称或索引
 */
function navigateTo(target) {
    if (AppState.isTransitioning) return;

    let targetIndex;

    if (typeof target === 'string') {
        targetIndex = AppState.pages.indexOf(target);
    } else {
        targetIndex = target;
    }

    if (targetIndex < 0 || targetIndex >= AppState.pages.length) {
        console.warn('无效的页面目标:', target);
        return;
    }

    if (targetIndex === AppState.currentPage) return;

    AppState.isTransitioning = true;

    const currentPageEl = document.getElementById(`page-${AppState.pages[AppState.currentPage]}`);
    const targetPageEl = document.getElementById(`page-${AppState.pages[targetIndex]}`);

    // 淡出当前页面
    currentPageEl.classList.add('fade-out');

    setTimeout(() => {
        currentPageEl.classList.remove('active', 'fade-out');

        // 淡入目标页面
        targetPageEl.classList.add('active', 'fade-in');

        setTimeout(() => {
            targetPageEl.classList.remove('fade-in');
            AppState.currentPage = targetIndex;
            AppState.isTransitioning = false;

            // 更新进度指示器
            updateProgressIndicator();

            // 更新全局花雨效果
            updateGlobalRain(AppState.pages[targetIndex]);

            // 触发页面进入事件
            const event = new CustomEvent('pageEnter', {
                detail: { pageName: AppState.pages[targetIndex] }
            });
            document.dispatchEvent(event);

        }, 500);
    }, 500);
}

/**
 * 前进到下一页
 */
function nextPage() {
    if (AppState.currentPage < AppState.pages.length - 1) {
        navigateTo(AppState.currentPage + 1);
    }
}

/**
 * 返回上一页
 */
function prevPage() {
    if (AppState.currentPage > 0) {
        navigateTo(AppState.currentPage - 1);
    }
}

/**
 * 返回首页（从结尾页返回，进入返回模式）
 */
function restartFromEnding() {
    if (AppState.isTransitioning) return;

    AppState.isTransitioning = true;

    const currentPageEl = document.getElementById(`page-${AppState.pages[AppState.currentPage]}`);
    const introPageEl = document.getElementById('page-intro');

    // 淡出当前页面
    currentPageEl.classList.add('fade-out');

    setTimeout(() => {
        currentPageEl.classList.remove('active', 'fade-out');

        // 淡入首页
        introPageEl.classList.add('active', 'fade-in');

        setTimeout(() => {
            introPageEl.classList.remove('fade-in');
            AppState.currentPage = 0;
            AppState.isTransitioning = false;

            // 更新进度指示器
            updateProgressIndicator();

            // 更新全局花雨效果
            updateGlobalRain('intro');

            // 触发返回模式（先设置，防止 pageEnter 重播初始消息）
            if (window.IntroModule && window.IntroModule.resetForReturnMode) {
                window.IntroModule.resetForReturnMode();
            }

            // 触发页面进入事件（用于音乐淡出等逻辑）
            const event = new CustomEvent('pageEnter', {
                detail: { pageName: 'intro' }
            });
            document.dispatchEvent(event);

        }, 500);
    }, 500);
}

// ============================================================
// 进度指示器
// ============================================================

/**
 * 更新进度指示器状态
 */
function updateProgressIndicator() {
    const dots = document.querySelectorAll('#progress-indicator .dot');

    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === AppState.currentPage);
    });
}

/**
 * 初始化进度指示器
 */
function initProgressIndicator() {
    const indicator = document.getElementById('progress-indicator');

    // 开场页不显示进度指示器
    document.addEventListener('pageEnter', (e) => {
        if (e.detail.pageName === 'intro') {
            indicator.classList.add('hidden');
        } else {
            indicator.classList.remove('hidden');
        }
    });

    updateProgressIndicator();
}

// ============================================================
// API 请求工具
// ============================================================

/**
 * 发送 POST 请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求数据
 * @returns {Promise<Object>} - 响应数据
 */
async function postRequest(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('请求失败:', error);
        throw error;
    }
}

/**
 * 发送 GET 请求
 * @param {string} url - 请求地址
 * @returns {Promise<Object>} - 响应数据
 */
async function getRequest(url) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('请求失败:', error);
        throw error;
    }
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 延迟执行
 * @param {number} ms - 毫秒数
 * @returns {Promise}
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 添加打字机效果
 * @param {HTMLElement} element - 目标元素
 * @param {string} text - 要显示的文字
 * @param {number} speed - 打字速度（毫秒/字）
 */
async function typeWriter(element, text, speed = 50) {
    element.textContent = '';

    for (let i = 0; i < text.length; i++) {
        element.textContent += text.charAt(i);
        await delay(speed);
    }
}

/**
 * 创建元素
 * @param {string} tag - 标签名
 * @param {Object} attrs - 属性对象
 * @param {string|HTMLElement|Array} children - 子元素
 * @returns {HTMLElement}
 */
function createElement(tag, attrs = {}, children = null) {
    const el = document.createElement(tag);

    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            el.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            el.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            el.setAttribute(key, value);
        }
    });

    if (children) {
        if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    el.appendChild(document.createTextNode(child));
                } else if (child instanceof HTMLElement) {
                    el.appendChild(child);
                }
            });
        } else if (typeof children === 'string') {
            el.textContent = children;
        } else if (children instanceof HTMLElement) {
            el.appendChild(children);
        }
    }

    return el;
}

// ============================================================
// 初始化
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎂 生日纪念网站已加载');

    // 初始化进度指示器
    initProgressIndicator();

    // 初始化全局点击特效
    initGlobalClickEffects();

    // 初始化全局花雨效果
    initGlobalRainEffect();

    // 确保初始页面正确显示
    const desiredStart = Number(window.AppConfig?.START_PAGE?? 1);
    const maxStartIndex = Math.min(3, AppState.pages.length - 1);
    const startIndex = Math.min(
        Math.max(Number.isFinite(desiredStart) ? desiredStart - 1 : 0, 0),
        maxStartIndex
    );

    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    const targetPageName = AppState.pages[startIndex];
    const targetPage = document.getElementById(`page-${targetPageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
        AppState.currentPage = startIndex;
        updateProgressIndicator();

        // 初始化花雨效果
        updateGlobalRain(targetPageName);

        const event = new CustomEvent('pageEnter', {
            detail: { pageName: targetPageName }
        });
        document.dispatchEvent(event);
    }
});

// 导出全局使用的函数
window.App = {
    navigateTo,
    nextPage,
    prevPage,
    restartFromEnding,
    postRequest,
    getRequest,
    delay,
    typeWriter,
    createElement,
    state: AppState
};
