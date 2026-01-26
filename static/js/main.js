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

            // 触发页面进入事件（用于音乐淡出等逻辑）
            const event = new CustomEvent('pageEnter', {
                detail: { pageName: 'intro' }
            });
            document.dispatchEvent(event);
            
            // 触发返回模式
            if (window.IntroModule && window.IntroModule.resetForReturnMode) {
                window.IntroModule.resetForReturnMode();
            }
            
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
    
    // 确保初始页面正确显示
    const introPage = document.getElementById('page-intro');
    if (introPage) {
        introPage.classList.add('active');
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
