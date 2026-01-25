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
    isComplete: false
};

// ============================================================
// DOM 元素
// ============================================================
const letterContent = document.getElementById('letter-content');
const letterNextBtn = document.getElementById('letter-next');

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
    
    // 创建所有段落元素（但不显示）
    LetterState.paragraphs.forEach((para, index) => {
        const paraEl = App.createElement('div', {
            className: 'letter-paragraph',
            'data-index': index
        }, [
            App.createElement('span', { className: 'letter-paragraph-label' }, para.section),
            App.createElement('p', { className: 'letter-paragraph-text' }, para.content)
        ]);
        
        letterContent.appendChild(paraEl);
    });
    
    // 显示第一段
    showNextParagraph();
}

/**
 * 显示下一段
 */
async function showNextParagraph() {
    if (LetterState.currentParagraph >= LetterState.paragraphs.length) {
        completeLetter();
        return;
    }
    
    const paraEl = letterContent.querySelector(
        `.letter-paragraph[data-index="${LetterState.currentParagraph}"]`
    );
    
    if (paraEl) {
        // 显示段落
        await App.delay(300);
        paraEl.classList.add('visible');
        
        // 滚动到视图
        paraEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        LetterState.currentParagraph++;
        
        // 更新按钮文字
        if (LetterState.currentParagraph >= LetterState.paragraphs.length) {
            letterNextBtn.textContent = '继续';
        }
    }
}

/**
 * 信件阅读完成
 */
function completeLetter() {
    LetterState.isComplete = true;
    
    // 隐藏继续按钮
    letterNextBtn.classList.add('hidden');
    
    // 显示信件完成状态
    const letterPaper = document.querySelector('.letter-paper');
    letterPaper?.classList.add('letter-complete');
    
    // 延迟后添加前往下一页的按钮
    setTimeout(() => {
        const proceedBtn = App.createElement('button', {
            className: 'proceed-btn',
            onClick: () => App.navigateTo('secret')
        }, '继续我们的秘密');
        
        const container = document.querySelector('.letter-container');
        container.appendChild(proceedBtn);
        
        proceedBtn.style.opacity = '0';
        requestAnimationFrame(() => {
            proceedBtn.style.transition = 'opacity 0.5s ease';
            proceedBtn.style.opacity = '1';
        });
    }, 1000);
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
        showNextParagraph();
    }
});
