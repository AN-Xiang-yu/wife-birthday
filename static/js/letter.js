/**
 * 信件页 · 分段展示逻辑
 * 
 * 分段呈现信件内容，需要交互才能看下一段
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
    typingTimer: null,
    typingResolve: null,
    autoAdvanceTimer: null,
    skipRequested: false
};

// ============================================================
// DOM 元素
// ============================================================
const letterContent = document.getElementById('letter-content');
const letterNextBtn = document.getElementById('letter-next');

const LetterConfig = {
    typingInterval: window.AppConfig?.LETTER_TYPING_INTERVAL_MS ?? 45,
    paragraphDelay: window.AppConfig?.LETTER_PARAGRAPH_DELAY_MS ?? 600
};

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
    
    letterContent.innerHTML = '';
    LetterState.currentParagraph = 0;
    LetterState.isComplete = false;
    LetterState.isTyping = false;
    LetterState.skipRequested = false;
    clearLetterTimers();
    updateLetterButton();
    
    // 创建所有段落元素（但不显示）
    LetterState.paragraphs.forEach((para, index) => {
        const paraEl = App.createElement('div', {
            className: 'letter-paragraph',
            'data-index': index
        }, [
            App.createElement('span', {
                className: 'letter-paragraph-label',
                'data-full-text': para.section || ''
            }, ''),
            App.createElement('p', {
                className: 'letter-paragraph-text',
                'data-full-text': para.content || ''
            }, '')
        ]);
        
        letterContent.appendChild(paraEl);
    });
    
    // 显示第一段
    showNextParagraph();
}

function clearLetterTimers() {
    if (LetterState.typingTimer) {
        clearInterval(LetterState.typingTimer);
        LetterState.typingTimer = null;
    }
    if (LetterState.typingResolve) {
        LetterState.typingResolve();
        LetterState.typingResolve = null;
    }
    if (LetterState.autoAdvanceTimer) {
        clearTimeout(LetterState.autoAdvanceTimer);
        LetterState.autoAdvanceTimer = null;
    }
}

function updateLetterButton() {
    if (!letterNextBtn) return;
    letterNextBtn.textContent = LetterState.isComplete ? '进入下一页' : '全部显示';
}

function typeText(element, fullText, interval) {
    return new Promise((resolve) => {
        if (!element) {
            resolve();
            return;
        }

        if (!fullText) {
            element.textContent = '';
            resolve();
            return;
        }

        let index = 0;
        element.textContent = '';

        LetterState.typingResolve = resolve;
        LetterState.typingTimer = setInterval(() => {
            if (LetterState.skipRequested) {
                clearInterval(LetterState.typingTimer);
                LetterState.typingTimer = null;
                LetterState.typingResolve = null;
                resolve();
                return;
            }

            element.textContent += fullText[index];
            index += 1;

            if (index >= fullText.length) {
                clearInterval(LetterState.typingTimer);
                LetterState.typingTimer = null;
                LetterState.typingResolve = null;
                resolve();
            }
        }, interval);
    });
}

/**
 * 显示下一段
 */
async function showNextParagraph() {
    if (LetterState.isTyping || LetterState.skipRequested) {
        return;
    }

    if (LetterState.currentParagraph >= LetterState.paragraphs.length) {
        completeLetter();
        return;
    }
    
    const paraEl = letterContent.querySelector(
        `.letter-paragraph[data-index="${LetterState.currentParagraph}"]`
    );
    
    if (paraEl) {
        LetterState.isTyping = true;
        paraEl.classList.add('visible');

        const labelEl = paraEl.querySelector('.letter-paragraph-label');
        const textEl = paraEl.querySelector('.letter-paragraph-text');
        const labelText = labelEl?.dataset.fullText || '';
        const contentText = textEl?.dataset.fullText || '';

        await App.delay(300);
        await typeText(labelEl, labelText, LetterConfig.typingInterval);
        await typeText(textEl, contentText, LetterConfig.typingInterval);

        paraEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

        LetterState.currentParagraph += 1;
        LetterState.isTyping = false;

        if (LetterState.currentParagraph >= LetterState.paragraphs.length) {
            completeLetter();
        } else {
            LetterState.autoAdvanceTimer = setTimeout(() => {
                showNextParagraph();
            }, LetterConfig.paragraphDelay);
        }
    }
}

function revealAllParagraphs() {
    LetterState.skipRequested = true;
    LetterState.isTyping = false;
    clearLetterTimers();

    const paragraphs = letterContent?.querySelectorAll('.letter-paragraph') || [];
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

    LetterState.currentParagraph = LetterState.paragraphs.length;
    completeLetter();
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

    updateLetterButton();
}

// ============================================================
// 事件绑定
// ============================================================

// 页面进入时加载数据
document.addEventListener('pageEnter', (e) => {
    if (e.detail.pageName === 'letter' && !LetterState.isLoaded) {
        loadLetterData();
    }
});

// 继续阅读按钮
letterNextBtn?.addEventListener('click', () => {
    if (!LetterState.isComplete) {
        revealAllParagraphs();
        return;
    }
    App.navigateTo('secret');
});
