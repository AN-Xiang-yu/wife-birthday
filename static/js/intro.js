/**
 * 开场页 · 对话交互逻辑
 * 
 * 类聊天界面，用户最多输入3次
 * 情绪：好奇 → 参与
 */

// ============================================================
// 配置常量（从后端 config.py 注入）
// ============================================================
const FINAL_MESSAGE = window.AppConfig?.FINAL_MESSAGE;

// ============================================================
// 状态
// ============================================================
const IntroState = {
    attemptCount: 0,
    maxAttempts: window.AppConfig?.MAX_ATTEMPTS || 3,
    isProcessing: false,
    isReturnMode: false, // 是否是返回模式
    returnMessageIndex: 0, // 返回模式下的消息索引
    isLetterTransitioning: false,
    originalMessagesCount: 0, // 保存原始聊天记录的消息数量
    hasReturnedBefore: false // 是否已经重返过
};

const randomBetween = (min, max) => Math.random() * (max - min) + min;

// 返回模式下显示的新消息
const ReturnMessages = [
    { delay: 500, text: "你又回来了..." },
    { delay: 1500, text: "是不是还想再看一遍我们的故事？" },
    { delay: 3000, text: "那就让我再陪你走一遍吧" },
    { delay: 5000, text: "这一次，你可以慢慢看" },
    { delay: 7000, text: "每一个瞬间，都值得被记住", action: "showContinueButton" }
];

// 初始进入页面的消息（每次进入页面都重新播放）
const InitialMessages = [
    { delay: 500, text: "嘿，亲爱的，你终于来啦" },
    { delay: 1500, text: "我等你很久了 ~" },
    {
        delay: 2500,
        text: "知道今天是什么日子吗？"
    }
];

// 进入故事的信封卡片
const LetterInvite = {
    text: "先点开它，我们再继续。",
    action: "showLetterInvite"
};

// ============================================================
// DOM 元素
// ============================================================
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const attemptHint = document.getElementById('attempt-hint');

// ============================================================
// 消息相关函数
// ============================================================

/**
 * 添加消息到聊天区域
 * @param {string} text - 消息内容
 * @param {string} type - 消息类型：'system' 或 'user'
 * @param {boolean} animate - 是否使用动画
 * @param {boolean} isReturnMessage - 是否是重返消息（需要标记）
 */
function addMessage(text, type = 'system', animate = true, isReturnMessage = false) {
    const avatarPath = type === 'system' ? '/static/images/photos/chat/相宇.jpg' : '/static/images/photos/chat/千禧.jpg';
    const avatarImg = App.createElement('img', {
        src: avatarPath,
        alt: type === 'system' ? '相宇' : '千禧'
    });

    const messageEl = App.createElement('div', {
        className: `message ${type}${isReturnMessage ? ' return-message' : ''}`
    }, [
        App.createElement('span', { className: 'avatar' }, [avatarImg]),
        App.createElement('div', { className: 'bubble' }, text)
    ]);

    if (animate) {
        messageEl.style.opacity = '0';
        messageEl.style.transform = 'translateY(10px)';
    }

    chatMessages.appendChild(messageEl);

    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 触发动画
    if (animate) {
        requestAnimationFrame(() => {
            messageEl.style.transition = 'all 0.4s ease';
            messageEl.style.opacity = '1';
            messageEl.style.transform = 'translateY(0)';
        });
    }
}

/**
 * 显示打字中指示器
 * @returns {HTMLElement} - 指示器元素（用于后续移除）
 */
function showTypingIndicator() {
    const avatarImg = App.createElement('img', {
        src: '/static/images/photos/chat/相宇.jpg',
        alt: '相宇'
    });

    const indicator = App.createElement('div', {
        className: 'message system'
    }, [
        App.createElement('span', { className: 'avatar' }, [avatarImg]),
        App.createElement('div', {
            className: 'bubble typing-indicator'
        }, [
            App.createElement('span'),
            App.createElement('span'),
            App.createElement('span')
        ])
    ]);

    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return indicator;
}

// ============================================================
// 返回模式
// ============================================================

/**
 * 进入返回模式
 */
function enterReturnMode() {
    // isReturnMode 标志已在 resetForReturnMode 中设置
    IntroState.returnMessageIndex = 0;

    // 如果之前已经重返过，清除上次重返的消息
    if (IntroState.hasReturnedBefore) {
        const returnMessages = chatMessages.querySelectorAll('.return-message');
        returnMessages.forEach(msg => msg.remove());

        // 清除继续按钮容器
        const continueContainer = chatMessages.querySelector('.return-continue-container');
        if (continueContainer) {
            continueContainer.remove();
        }
    } else {
        // 第一次重返，保存当前消息数量
        IntroState.originalMessagesCount = chatMessages.children.length;
        IntroState.hasReturnedBefore = true;
    }

    // 隐藏输入区域
    const inputArea = document.querySelector('.chat-input-area');
    if (inputArea) {
        inputArea.style.display = 'none';
    }

    // 隐藏提示
    if (attemptHint) {
        attemptHint.style.display = 'none';
    }

    // 开始播放返回消息
    playReturnMessages();
}

/**
 * 播放返回模式的消息序列
 */
function playReturnMessages() {
    ReturnMessages.forEach((msg, index) => {
        setTimeout(() => {
            addMessage(msg.text, 'system', true, true); // 标记为重返消息

            // 检查是否有特殊动作
            if (msg.action === 'showContinueButton') {
                showReturnContinueButton();
            }
        }, msg.delay);
    });
}

/**
 * 播放最终引导消息序列
 * @param {Array} messages - 消息数组
 */
async function playFinalMessages(messages) {
    const messagesArray = Array.isArray(messages) ? messages : FINAL_MESSAGES;

    // 禁用输入区域
    disableInput('请听我说完哦 ~');

    for (const msg of messagesArray) {
        await App.delay(msg.delay);

        // 显示打字指示器
        const typingIndicator = showTypingIndicator();
        await App.delay(800);

        // 移除打字指示器并显示消息
        typingIndicator.remove();
        addMessage(msg.text, 'system');
    }

    // 最终消息播放完成后，保持禁用状态（因为接下来会显示信封卡片）
}

/**
 * 播放首次进入页面的消息
 */
async function playInitialMessages() {
    if (!chatMessages) return;

    // 如果是返回模式，不清空消息，也不播放初始消息
    if (IntroState.isReturnMode) return;

    chatMessages.innerHTML = '';

    // 禁用输入区域，直到初始消息播放完成
    disableInput('请听我说完哦 ~');

    for (const msg of InitialMessages) {
        await App.delay(msg.delay);

        // 显示打字指示器
        const typingIndicator = showTypingIndicator();
        await App.delay(800);

        // 移除打字指示器并显示消息
        typingIndicator.remove();
        addMessage(msg.text, 'system');
    }

    // 所有消息显示完成后，启用输入
    await App.delay(500);
    enableInput();

    // 显示提示
    if (attemptHint) {
        attemptHint.textContent = '想想今天是什么日子？';
    }

    // 不在初始时显示信封，等用户互动结束后再显示
}

/**
 * 显示返回模式的继续按钮
 */
function showReturnContinueButton() {
    setTimeout(() => {
        const btnContainer = App.createElement('div', {
            className: 'return-continue-container',
            style: {
                textAlign: 'center',
                marginTop: '20px',
                opacity: '0',
                transition: 'opacity 0.5s ease'
            }
        });

        const btn = App.createElement('button', {
            className: 'proceed-btn',
            onClick: () => App.navigateTo('timeline'),
            style: {
                marginTop: '0'
            }
        }, '再次走进我们的故事');

        btnContainer.appendChild(btn);
        chatMessages.appendChild(btnContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // 淡入
        requestAnimationFrame(() => {
            btnContainer.style.opacity = '1';
        });
    }, 500);
}

/**
 * 显示信封邀请卡片
 */
function showLetterInviteCard() {
    if (!chatMessages || IntroState.isReturnMode) return;
    if (chatMessages.querySelector('.letter-invite-container')) return;

    const card = App.createElement('button', {
        className: 'letter-invite',
        onClick: () => playLetterTransition()
    }, [
        App.createElement('div', { className: 'letter-invite__image' }),
        App.createElement('div', { className: 'letter-invite__text' }, [
            App.createElement('p', { className: 'letter-invite__title' }, '一封写给你的信'),
            App.createElement('p', { className: 'letter-invite__hint' }, '轻轻点开，故事就开始了')
        ])
    ]);

    const container = App.createElement('div', {
        className: 'letter-invite-container'
    }, card);

    chatMessages.appendChild(container);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 禁用输入区域并隐藏提示
    disableInput('故事已经开始...');
    if (attemptHint) {
        attemptHint.style.display = 'none';
    }
}

/**
 * 播放信封打开过场动画
 */
function playLetterTransition() {
    if (IntroState.isLetterTransitioning) return;
    IntroState.isLetterTransitioning = true;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReducedMotion) {
        App.navigateTo('timeline');
        IntroState.isLetterTransitioning = false;
        return;
    }

    const overlay = App.createElement('div', {
        className: 'letter-transition-overlay',
        'aria-hidden': 'true'
    });

    const envelope = App.createElement('div', {
        className: 'letter-transition-envelope'
    }, [
        App.createElement('div', { className: 'letter-transition-letter' }, [
            App.createElement('div', { className: 'letter-transition-letter-title' }, 'Lover')
        ]),
        App.createElement('div', { className: 'letter-transition-back' }),
        App.createElement('div', { className: 'letter-transition-pocket' }),
        App.createElement('div', { className: 'letter-transition-flap' }),
        App.createElement('div', { className: 'letter-transition-heart' })
    ]);

    const bloomContainer = App.createElement('div', {
        className: 'letter-transition-blooms',
        'aria-hidden': 'true'
    });

    const bloomIcons = ['🌸', '🌹', '💮', '🌷', '🌺'];
    const bloomCount = 26;
    for (let i = 0; i < bloomCount; i += 1) {
        const bloom = App.createElement('span', {
            className: 'letter-transition-bloom',
            style: {
                '--x': `${randomBetween(-140, 140)}px`,
                '--y': `${randomBetween(-180, -50)}px`,
                '--fall': `${randomBetween(60, 140)}px`,
                '--delay': `${randomBetween(0, 0.35)}s`,
                '--duration': `${randomBetween(1.1, 1.8)}s`,
                '--size': `${randomBetween(18, 30)}px`
            }
        }, bloomIcons[i % bloomIcons.length]);

        bloomContainer.appendChild(bloom);
    }

    envelope.appendChild(bloomContainer);
    overlay.appendChild(envelope);
    document.body.appendChild(overlay);

    const navigateDelay = 1050;
    const fadeOutDelay = 1100;
    const cleanupDelay = 1500;

    setTimeout(() => {
        App.navigateTo('timeline');
    }, navigateDelay);

    setTimeout(() => {
        overlay.classList.add('letter-transition-overlay--fade-out');
    }, fadeOutDelay);

    setTimeout(() => {
        overlay.remove();
        IntroState.isLetterTransitioning = false;
    }, cleanupDelay);
}

/**
 * 禁用输入区域
 * @param {string} message - 禁用时显示的占位符文本
 */
function disableInput(message = '故事已经开始...') {
    if (chatInput) {
        chatInput.disabled = true;
        chatInput.placeholder = message;
    }
    if (chatSend) {
        chatSend.disabled = true;
    }
}

/**
 * 启用输入区域
 */
function enableInput() {
    if (IntroState.isReturnMode) return; // 返回模式下不启用输入

    if (chatInput) {
        chatInput.disabled = false;
        chatInput.placeholder = '宝宝到你啦 ~ ';
    }
    if (chatSend) {
        chatSend.disabled = false;
    }
}

/**
 * 重置为返回模式（从结尾页返回时调用）
 */
function resetForReturnMode() {
    // 先设置返回模式标志，防止pageEnter事件重新播放初始消息
    IntroState.isReturnMode = true;

    // 然后进入返回模式，播放返回消息
    enterReturnMode();
}

// ============================================================
// 交互处理
// ============================================================

/**
 * 处理用户输入
 */
async function handleUserInput() {
    // 返回模式下不允许输入
    if (IntroState.isReturnMode) return;

    const userInput = chatInput.value.trim();

    if (!userInput || IntroState.isProcessing) return;

    IntroState.isProcessing = true;
    chatSend.disabled = true;

    // 显示用户消息
    addMessage(userInput, 'user');
    chatInput.value = '';

    // 显示打字指示器
    await App.delay(500);
    const typingIndicator = showTypingIndicator();

    try {
        // 发送请求到后端
        const response = await App.postRequest('/api/chat', {
            user_input: userInput,
            attempt_count: IntroState.attemptCount
        });

        // 移除打字指示器
        await App.delay(1000);
        typingIndicator.remove();

        const isFinalMessage = Boolean(response.is_final);

        // 如果是最终消息，逐条显示
        if (isFinalMessage) {
            await playFinalMessages(response.response);
            await App.delay(1200);
            showLetterInviteCard();
        } else {
            // 显示普通系统回复
            addMessage(response.response, 'system');

            // 更新尝试次数
            IntroState.attemptCount++;

            // 更新提示
            if (response.hint) {
                attemptHint.textContent = response.hint;
            }

            // 系统消息显示完成后，重新启用输入
            IntroState.isProcessing = false;
            chatSend.disabled = false;
            chatInput.focus();
        }

    } catch (error) {
        // 移除打字指示器
        typingIndicator.remove();

        // 显示温柔的错误提示（不是"错误"）
        attemptHint.textContent = '让我想想...';
        console.error('对话处理失败:', error);

        // 错误时也要重新启用输入
        IntroState.isProcessing = false;
        chatSend.disabled = false;
        chatInput.focus();
    }
}

// ============================================================
// 事件绑定
// ============================================================

// 发送按钮点击
chatSend?.addEventListener('click', handleUserInput);

// 回车发送
chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserInput();
    }
});

// 页面进入时聚焦输入框
document.addEventListener('pageEnter', (e) => {
    if (e.detail.pageName === 'intro') {
        if (!IntroState.isReturnMode) {
            playInitialMessages();
            chatInput?.focus();
        }
    }
});

// ============================================================
// 初始化
// ============================================================

// 初始化已由 pageEnter 事件处理，无需在 DOMContentLoaded 中重复调用

// 导出给全局使用
window.IntroModule = {
    resetForReturnMode,
    enterReturnMode
};