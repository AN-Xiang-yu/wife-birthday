/**
 * 开场页 · 对话交互逻辑
 * 
 * 类聊天界面，用户最多输入3次
 * 情绪：好奇 → 参与
 */

// ============================================================
// 状态
// ============================================================
const IntroState = {
    attemptCount: 0,
    maxAttempts: 3,
    isProcessing: false,
    isReturnMode: false,  // 是否是返回模式
    returnMessageIndex: 0  // 返回模式下的消息索引
};

// 返回模式下显示的新消息
const ReturnMessages = [
    { delay: 500, text: "你又回来了..." },
    { delay: 1500, text: "是不是还想再看一遍我们的故事？" },
    { delay: 3000, text: "那就让我再陪你走一遍吧" },
    { delay: 5000, text: "这一次，你可以慢慢看" },
    { delay: 7000, text: "每一个瞬间，都值得被记住", action: "showContinueButton" }
];

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
 */
function addMessage(text, type = 'system', animate = true) {
    const avatar = type === 'system' ? '💭' : '💬';
    
    const messageEl = App.createElement('div', {
        className: `message ${type}`
    }, [
        App.createElement('span', { className: 'avatar' }, avatar),
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
    const indicator = App.createElement('div', {
        className: 'message system'
    }, [
        App.createElement('span', { className: 'avatar' }, '💭'),
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
    IntroState.isReturnMode = true;
    IntroState.returnMessageIndex = 0;
    
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
            addMessage(msg.text, 'system');
            
            // 检查是否有特殊动作
            if (msg.action === 'showContinueButton') {
                showReturnContinueButton();
            }
        }, msg.delay);
    });
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
 * 重置为返回模式（从结尾页返回时调用）
 */
function resetForReturnMode() {
    // 不清空聊天记录，保留之前的对话
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
        
        // 显示系统回复
        addMessage(response.response, 'system');
        
        // 更新尝试次数
        IntroState.attemptCount++;
        
        // 更新提示
        if (response.hint && !response.should_proceed) {
            attemptHint.textContent = response.hint;
        }
        
        // 检查是否应该进入下一页
        if (response.should_proceed) {
            // 延迟后进入时间线页
            await App.delay(2000);
            App.navigateTo('timeline');
        } else {
            // 检查是否达到最大尝试次数
            if (IntroState.attemptCount >= IntroState.maxAttempts) {
                await App.delay(1500);
                // 显示最终引导消息
                addMessage('好啦，让我带你走进我们的故事...', 'system');
                await App.delay(2000);
                App.navigateTo('timeline');
            }
        }
        
    } catch (error) {
        // 移除打字指示器
        typingIndicator.remove();
        
        // 显示温柔的错误提示（不是"错误"）
        attemptHint.textContent = '让我想想...';
        console.error('对话处理失败:', error);
    }
    
    IntroState.isProcessing = false;
    chatSend.disabled = false;
    chatInput.focus();
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
            chatInput?.focus();
        }
    }
});

// ============================================================
// 初始化
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // 初始延迟显示第一条提示
    setTimeout(() => {
        if (!IntroState.isReturnMode && attemptHint) {
            attemptHint.textContent = '想想今天是什么日子？';
        }
    }, 2000);
});

// 导出给全局使用
window.IntroModule = {
    resetForReturnMode,
    enterReturnMode
};
