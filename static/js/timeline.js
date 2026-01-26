/**
 * 时间线页 · 滚动触发逻辑
 * 
 * 滚动时依次显示时间线事件
 * 情绪：回忆
 */

// ============================================================
// 状态
// ============================================================
const TimelineState = {
    events: [],
    isLoaded: false,
    observer: null
};

// ============================================================
// DOM 元素
// ============================================================
const timelineEvents = document.getElementById('timeline-events');
const scrollHint = document.querySelector('#page-timeline .scroll-hint');
const timelineAudio = document.getElementById('timeline-music');
const timelineMusicPages = new Set([
    'timeline',
    'moments',
    'letter',
    'secret',
    'playful',
    'ending'
]);
let timelineFadeRequestId = null;

// ============================================================
// 音乐控制
// ============================================================

function clearTimelineFade() {
    if (timelineFadeRequestId) {
        cancelAnimationFrame(timelineFadeRequestId);
        timelineFadeRequestId = null;
    }
}

function playTimelineMusic() {
    if (!timelineAudio) return;
    clearTimelineFade();
    timelineAudio.currentTime = 0;
    timelineAudio.play().catch((error) => {
        console.warn('时间线音乐自动播放被阻止:', error);
    });
}

function fadeOutTimelineMusic(duration = 1500) {
    if (!timelineAudio) return;
    if (timelineAudio.paused) {
        timelineAudio.currentTime = 0;
        timelineAudio.volume = 1;
        return;
    }

    clearTimelineFade();
    const startVolume = timelineAudio.volume;
    const startTime = performance.now();

    const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        timelineAudio.volume = startVolume * (1 - progress);

        if (progress < 1) {
            timelineFadeRequestId = requestAnimationFrame(step);
            return;
        }

        timelineAudio.pause();
        timelineAudio.currentTime = 0;
        timelineAudio.volume = startVolume;
        timelineFadeRequestId = null;
    };

    timelineFadeRequestId = requestAnimationFrame(step);
}

// ============================================================
// 时间线渲染
// ============================================================

/**
 * 加载时间线数据
 */
async function loadTimelineData() {
    try {
        const response = await App.getRequest('/api/timeline');
        TimelineState.events = response.events || [];
        renderTimeline();
        TimelineState.isLoaded = true;
    } catch (error) {
        console.error('加载时间线失败:', error);
        // 使用备用数据或显示错误
    }
}

/**
 * 渲染时间线
 */
function renderTimeline() {
    if (!timelineEvents) return;

    timelineEvents.innerHTML = '';

    TimelineState.events.forEach((event, index) => {
        const eventEl = createTimelineEvent(event, index);
        timelineEvents.appendChild(eventEl);
    });

    // 初始化滚动观察器
    initScrollObserver();
}

/**
 * 创建单个时间线事件元素
 * @param {Object} event - 事件数据
 * @param {number} index - 事件索引
 * @returns {HTMLElement}
 */
function createTimelineEvent(event, index) {
    const cardChildren = [
        App.createElement('span', { className: 'event-date' }, event.date),
        App.createElement('h3', { className: 'event-title' }, event.title),
        App.createElement('p', { className: 'event-description' }, event.description)
    ];

    // 添加图片（如果有）
    if (event.image) {
        const img = App.createElement('img', {
            className: 'event-image clickable',
            src: `/static/${event.image}`,
            alt: event.title,
            onClick: () => openImagePreview(`/static/${event.image}`, event.title)
        });
        cardChildren.push(img);
    }

    // 添加情感备注（如果有）
    if (event.emotion_note) {
        cardChildren.push(
            App.createElement('p', { className: 'event-emotion' }, event.emotion_note)
        );
    }

    const card = App.createElement('div', { className: 'event-card' }, cardChildren);

    const eventEl = App.createElement('div', {
        className: `timeline-event ${event.is_highlighted ? 'highlighted' : ''}`,
        'data-index': index
    }, card);

    return eventEl;
}

// ============================================================
// 图片预览
// ============================================================

/**
 * 打开图片预览灯箱
 * @param {string} imageSrc - 图片路径
 * @param {string} title - 图片标题
 */
function openImagePreview(imageSrc, title) {
    // 检查是否已存在灯箱
    let lightbox = document.getElementById('image-lightbox');

    if (!lightbox) {
        // 创建灯箱容器
        lightbox = App.createElement('div', {
            id: 'image-lightbox',
            className: 'image-lightbox',
            onClick: closeImagePreview
        }, [
            App.createElement('div', {
                className: 'lightbox-content',
                onClick: (e) => e.stopPropagation() // 防止点击图片时关闭
            }, [
                App.createElement('img', {
                    className: 'lightbox-image',
                    src: imageSrc,
                    alt: title
                }),
                App.createElement('div', { className: 'lightbox-title' }, title),
                App.createElement('button', {
                    className: 'lightbox-close',
                    onClick: closeImagePreview
                }, '×')
            ])
        ]);

        document.body.appendChild(lightbox);
    } else {
        // 更新现有灯箱
        const img = lightbox.querySelector('.lightbox-image');
        const titleEl = lightbox.querySelector('.lightbox-title');
        img.src = imageSrc;
        img.alt = title;
        titleEl.textContent = title;
    }

    // 淡入显示
    requestAnimationFrame(() => {
        lightbox.classList.add('active');
    });

    // 禁止背景滚动
    document.body.style.overflow = 'hidden';
}

/**
 * 关闭图片预览灯箱
 */
function closeImagePreview() {
    const lightbox = document.getElementById('image-lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        setTimeout(() => {
            lightbox.remove();
        }, 300);
    }

    // 恢复背景滚动
    document.body.style.overflow = '';
}

// 监听ESC键关闭灯箱
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeImagePreview();
    }
});

// ============================================================
// 滚动触发
// ============================================================

/**
 * 初始化滚动观察器
 */
function initScrollObserver() {
    // 清除旧的观察器
    if (TimelineState.observer) {
        TimelineState.observer.disconnect();
    }

    const options = {
        root: null,
        rootMargin: '-10% 0px -10% 0px',
        threshold: 0.3
    };

    TimelineState.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // 检查是否是最后一个事件
                const index = parseInt(entry.target.dataset.index);
                if (index === TimelineState.events.length - 1) {
                    // 最后一个事件可见后，添加继续按钮
                    showContinueButton();
                }
            }
        });
    }, options);

    // 观察所有时间线事件
    document.querySelectorAll('.timeline-event').forEach(event => {
        TimelineState.observer.observe(event);
    });
}

/**
 * 显示继续按钮
 */
function showContinueButton() {
    // 隐藏滚动提示
    if (scrollHint) {
        scrollHint.classList.add('hidden');
    }

    // 检查是否已存在继续按钮
    if (document.querySelector('#page-timeline .proceed-btn')) return;

    const btn = App.createElement('button', {
        className: 'proceed-btn',
        onClick: () => App.navigateTo('moments')
    }, '继续我们的故事');

    // 添加到时间线容器末尾
    const container = document.querySelector('#page-timeline .timeline-container');
    container.appendChild(btn);

    // 淡入动画
    btn.style.opacity = '0';
    requestAnimationFrame(() => {
        btn.style.transition = 'opacity 0.5s ease';
        btn.style.opacity = '1';
    });
}

/**
 * 处理滚动隐藏提示
 */
function handleScroll() {
    const page = document.getElementById('page-timeline');
    if (!page.classList.contains('active')) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > 100 && scrollHint) {
        scrollHint.style.opacity = '0';
    }
}

// ============================================================
// 事件绑定
// ============================================================

// 页面进入时加载数据
document.addEventListener('pageEnter', (e) => {
    const pageName = e.detail.pageName;
    if (pageName === 'timeline' && !TimelineState.isLoaded) {
        loadTimelineData();
    }

    if (timelineMusicPages.has(pageName)) {
        if (timelineAudio?.paused) {
            playTimelineMusic();
        }
        return;
    }

    fadeOutTimelineMusic();
});

// 滚动监听
window.addEventListener('scroll', handleScroll, { passive: true });

// ============================================================
// 初始化
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // 如果初始页面就是时间线，立即加载
    const activeTimelinePage = document.getElementById('page-timeline');
    if (activeTimelinePage?.classList.contains('active')) {
        loadTimelineData();
        playTimelineMusic();
    }
});
