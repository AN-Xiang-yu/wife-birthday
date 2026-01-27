/**
 * 彩蛋页 · 密码解锁 & 选择式问题逻辑
 * 
 * 密码页：建立私密感
 * 选择页：情绪回落，轻松结束
 * 情绪：私密感 → 轻松
 */

// ============================================================
// 密码页状态
// ============================================================
const SecretState = {
    isUnlocked: false,
    attempts: 0
};

// ============================================================
// 选择页状态
// ============================================================
const PlayfulState = {
    questions: [],
    currentQuestion: 0,
    isLoaded: false,
    isAnswered: false
};

// ============================================================
// 密码页标题打字效果
// ============================================================
let secretTitleTimer = null;
let secretSubtitleTimer = null;
let passwordHintTimer = null;
const secretTitleTypingInterval = window.AppConfig?.SECRET_TITLE_TYPING_INTERVAL_MS || 120;
const secretHintTypingInterval = window.AppConfig?.SECRET_HINT_TYPING_INTERVAL_MS || 90;

// ============================================================
// DOM 元素 - 密码页
// ============================================================
const secretTitle = document.querySelector('#secret-lock h2');
const secretSubtitle = document.querySelector('#secret-lock > p');

// ============================================================
// DOM 元素 - 密码页
// ============================================================
const secretLock = document.getElementById('secret-lock');
const secretUnlocked = document.getElementById('secret-unlocked');
const passwordInput = document.getElementById('password-input');
const passwordSubmit = document.getElementById('password-submit');
const passwordHint = document.getElementById('password-hint');
const secretContent = document.getElementById('secret-content');
const secretProceed = document.getElementById('secret-proceed');

// ============================================================
// DOM 元素 - 选择页
// ============================================================
const questionText = document.getElementById('question-text');
const optionsGroup = document.getElementById('options-group');
const playfulResponse = document.getElementById('playful-response');
const playfulProceed = document.getElementById('playful-proceed');

// ============================================================
// 密码页标题打字效果
// ============================================================
function prepareTypingText(element) {
    if (!element) return null;

    const fullText = element.dataset.fullText || element.textContent.trim();
    element.dataset.fullText = fullText;
    element.textContent = '';
    return fullText;
}

function typeText(element, text, currentTimer, interval, withCursor = false, onComplete) {
    if (!element) return null;

    if (withCursor) {
        element.classList.add('typing');
    }

    let index = 0;
    if (currentTimer) {
        clearInterval(currentTimer);
    }

    const timerId = setInterval(() => {
        index += 1;
        element.textContent = text.slice(0, index);
        if (index >= text.length) {
            clearInterval(timerId);
            if (withCursor) {
                element.classList.remove('typing');
            }
            if (onComplete) {
                onComplete();
            }
        }
    }, interval);

    return timerId;
}

function startSecretTitleTyping() {
    const titleText = prepareTypingText(secretTitle);
    const subtitleText = prepareTypingText(secretSubtitle);

    if (titleText) {
        secretTitleTimer = typeText(
            secretTitle,
            titleText,
            secretTitleTimer,
            secretTitleTypingInterval,
            true,
            () => {
                if (subtitleText) {
                    secretSubtitleTimer = typeText(
                        secretSubtitle,
                        subtitleText,
                        secretSubtitleTimer,
                        secretTitleTypingInterval
                    );
                }
            }
        );
        return;
    }

    if (subtitleText) {
        secretSubtitleTimer = typeText(
            secretSubtitle,
            subtitleText,
            secretSubtitleTimer,
            secretTitleTypingInterval
        );
    }
}

prepareTypingText(secretTitle);
prepareTypingText(secretSubtitle);

// ============================================================
// 密码验证逻辑
// ============================================================

/**
 * 验证密码
 */
async function verifyPassword() {
    const password = passwordInput.value.trim();
    
    if (!password) {
        showPasswordHint('输入点什么吧...');
        return;
    }
    
    try {
        const response = await App.postRequest('/api/verify-password', {
            password: password
        });
        
        if (response.success) {
            // 解锁成功
            unlockSecret(response.secret_content);
        } else {
            // 显示温柔提示
            SecretState.attempts++;
            showPasswordHint(response.hint, true);
            
            // 清空输入
            passwordInput.value = '';
            passwordInput.focus();
        }
    } catch (error) {
        console.error('密码验证失败:', error);
        showPasswordHint('让我想想...');
    }
}

/**
 * 显示密码提示
 * @param {string} hint - 提示内容
 * @param {boolean} shake - 是否显示抖动动画
 */
function showPasswordHint(hint, shake = false) {
    if (!passwordHint) return;

    passwordHint.textContent = '';
    passwordHintTimer = typeText(
        passwordHint,
        hint,
        passwordHintTimer,
        secretHintTypingInterval
    );

    if (shake) {
        passwordHint.classList.add('shake');
        setTimeout(() => {
            passwordHint.classList.remove('shake');
        }, 500);
    }
}

/**
 * 解锁秘密内容
 * @param {string} content - 解锁的内容
 */
function unlockSecret(content) {
    SecretState.isUnlocked = true;
    
    // 隐藏锁定界面
    secretLock.classList.add('hidden');
    
    // 显示解锁内容
    secretContent.textContent = content;
    secretUnlocked.classList.remove('hidden');
}

// ============================================================
// 选择式问题逻辑
// ============================================================

/**
 * 加载选择题数据
 */
async function loadPlayfulData() {
    try {
        const response = await App.getRequest('/api/content/playful');
        PlayfulState.questions = response.questions || [];
        renderQuestion();
        PlayfulState.isLoaded = true;
    } catch (error) {
        console.error('加载选择题失败:', error);
    }
}

/**
 * 渲染当前问题
 */
function renderQuestion() {
    if (!questionText || !optionsGroup) return;
    
    const question = PlayfulState.questions[PlayfulState.currentQuestion];
    if (!question) return;
    
    // 显示问题
    questionText.textContent = question.question;
    
    // 清空并渲染选项
    optionsGroup.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionBtn = App.createElement('button', {
            className: 'option-btn',
            'data-index': index,
            onClick: () => selectOption(option, index)
        }, option.text);
        
        optionsGroup.appendChild(optionBtn);
    });
}

/**
 * 选择选项
 * @param {Object} option - 选项数据
 * @param {number} index - 选项索引
 */
function selectOption(option, index) {
    if (PlayfulState.isAnswered) return;
    
    PlayfulState.isAnswered = true;
    
    // 高亮选中的选项
    const buttons = optionsGroup.querySelectorAll('.option-btn');
    buttons.forEach((btn, i) => {
        if (i === index) {
            btn.classList.add('selected');
        } else {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        }
    });
    
    // 显示回应
    setTimeout(() => {
        const responseText = playfulResponse.querySelector('.response-text');
        if (responseText) {
            responseText.textContent = option.response;
        }
        playfulResponse.classList.remove('hidden');
    }, 800);
}

// ============================================================
// 事件绑定 - 密码页
// ============================================================

// 密码提交按钮
passwordSubmit?.addEventListener('click', verifyPassword);

// 回车提交密码
passwordInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        verifyPassword();
    }
});

// 密码页继续按钮
secretProceed?.addEventListener('click', () => {
    App.navigateTo('playful');
});

// ============================================================
// 事件绑定 - 选择页
// ============================================================

// 页面进入时加载数据
document.addEventListener('pageEnter', (e) => {
    if (e.detail.pageName === 'secret') {
        startSecretTitleTyping();
        passwordInput?.focus();
    }
    
    if (e.detail.pageName === 'playful' && !PlayfulState.isLoaded) {
        loadPlayfulData();
    }
});

// 选择页继续按钮
playfulProceed?.addEventListener('click', () => {
    App.navigateTo('ending');
});

// ============================================================
// 结尾页 · 返回首页按钮
// ============================================================

const restartBtn = document.getElementById('restart-btn');

restartBtn?.addEventListener('click', () => {
    App.restartFromEnding();
});
