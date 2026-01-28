/**
 * 信件页 · 分段展示逻辑
 * 
 * 分段呈现信件内容，自动渐显并可点击跳过
 * 情绪：共鸣（情绪高峰）
 */

// ============================================================
// 状态
// ============================================================
const LetterState = {
    paragraphs: [],
    currentParagraph: 0,
    isLoaded: false,
    isComplete: false,
    isTyping: false,
    skipRequested: false,
    runId: 0
};

// ============================================================
// DOM 元素
// ============================================================
const letterContent = document.getElementById('letter-content');
const letterNextBtn = document.getElementById('letter-next');
const letterPage = document.getElementById('page-letter');

// ============================================================
// 信件渲染
// ============================================================

/**
 * 加载信件数据
 */
async function loadLetterData() {
    try {
        const response = await App.getRequest('/api/content/letter');
        LetterState.paragraphs = response.paragraphs || [];
        initLetter();
        LetterState.isLoaded = true;
    } catch (error) {
        console.error('加载信件失败:', error);
    }
}

/**
 * 初始化信件
 */
function initLetter() {
    if (!letterContent) return;

    applyLetterConfig();
    resetLetterState();
    createParagraphElements();
    startAutoReveal();
}

function applyLetterConfig() {
    if (!letterPage) return;

    const redSize = window.AppConfig?.LETTER_RED_TEXT_SIZE;
    const blackSize = window.AppConfig?.LETTER_BLACK_TEXT_SIZE;

    if (redSize) {
        letterPage.style.setProperty('--letter-red-size', redSize);
    }

    if (blackSize) {
        letterPage.style.setProperty('--letter-black-size', blackSize);
    }
}

function resetLetterState() {
    LetterState.currentParagraph = 0;
    LetterState.isComplete = false;
    LetterState.isTyping = false;
    LetterState.skipRequested = false;
    LetterState.runId += 1;
    letterContent.innerHTML = '';

    if (letterNextBtn) {
        letterNextBtn.textContent = '继续阅读';
    }
}

function createParagraphElements() {
    LetterState.paragraphs.forEach((para, index) => {
        const labelEl = App.createElement('span', {
            className: 'letter-paragraph-label',
            'data-full-text': para.section
        }, '');

        const textEl = App.createElement('p', {
            className: 'letter-paragraph-text',
            'data-full-text': para.content
        }, '');

        const paraEl = App.createElement('div', {
            className: 'letter-paragraph',
            'data-index': index
        }, [labelEl, textEl]);

        letterContent.appendChild(paraEl);
    });
}

/**
 * 渐进显示内容
 */
async function startAutoReveal() {
    const runId = LetterState.runId;
    const typingInterval = Number(window.AppConfig?.LETTER_TYPING_INTERVAL_MS ?? 55);
    const paragraphDelay = Number(window.AppConfig?.LETTER_PARAGRAPH_DELAY_MS ?? 600);

    LetterState.isTyping = true;

    for (let i = 0; i < LetterState.paragraphs.length; i++) {
        if (shouldAbortTyping(runId)) return;
        LetterState.currentParagraph = i;
        await revealParagraph(i, typingInterval, runId);
        if (shouldAbortTyping(runId)) return;
        await App.delay(paragraphDelay);
    }

    if (shouldAbortTyping(runId)) return;
    completeLetter();
}

function shouldAbortTyping(runId) {
    return LetterState.skipRequested || runId !== LetterState.runId;
}

async function revealParagraph(index, typingInterval, runId) {
    const paraEl = letterContent.querySelector(
        `.letter-paragraph[data-index="${index}"]`
    );

    if (!paraEl) return;

    const labelEl = paraEl.querySelector('.letter-paragraph-label');
    const textEl = paraEl.querySelector('.letter-paragraph-text');

    paraEl.classList.add('visible');
    paraEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (labelEl) {
        await typeText(labelEl, labelEl.dataset.fullText || '', typingInterval, runId);
    }

    if (textEl) {
        await typeText(textEl, textEl.dataset.fullText || '', typingInterval, runId);
    }
}

async function typeText(element, text, typingInterval, runId) {
    element.textContent = '';

    for (let i = 0; i < text.length; i++) {
        if (shouldAbortTyping(runId)) {
            element.textContent = text;
            return;
        }
        element.textContent += text.charAt(i);
        await App.delay(typingInterval);
    }
}

/**
 * 信件阅读完成
 */
function completeLetter() {
    LetterState.isComplete = true;
    LetterState.isTyping = false;
    
    // 显示信件完成状态
    const letterPaper = document.querySelector('.letter-paper');
    letterPaper?.classList.add('letter-complete');

    if (letterNextBtn) {
        letterNextBtn.textContent = '进入下一页';
    }
}

function revealAllText() {
    LetterState.skipRequested = true;
    LetterState.runId += 1;

    const paragraphs = letterContent.querySelectorAll('.letter-paragraph');
    paragraphs.forEach((paraEl) => {
        paraEl.classList.add('visible');
        const labelEl = paraEl.querySelector('.letter-paragraph-label');
        const textEl = paraEl.querySelector('.letter-paragraph-text');

        if (labelEl) {
            labelEl.textContent = labelEl.dataset.fullText || '';
        }

        if (textEl) {
            textEl.textContent = textEl.dataset.fullText || '';
        }
    });

    completeLetter();
}

// ============================================================
// 事件绑定
// ============================================================

// 页面进入时加载数据
document.addEventListener('pageEnter', (e) => {
    if (e.detail.pageName !== 'letter') return;

    if (!LetterState.isLoaded) {
        loadLetterData();
        return;
    }

    initLetter();
});

function handleLetterAdvance() {
    if (!LetterState.isComplete) {
        revealAllText();
        return;
    }

    App.navigateTo('secret');
}

letterNextBtn?.addEventListener('click', handleLetterAdvance);
letterContent?.addEventListener('click', handleLetterAdvance);
