/**
 * 故事放大页 · 卡片翻转逻辑
 *
 * 叠放式卡片，点击置顶后再翻转
 * 情绪：回忆深化
 */

// ============================================================
// 状态
// ============================================================
const MomentsState = {
    cards: [],
    cardElements: new Map(),
    order: [],
    isLoaded: false
};

// ============================================================
// DOM 元素
// ============================================================
const momentsContainer = document.getElementById('moments-container');
const momentsProceed = document.getElementById('moments-proceed');

// ============================================================
// 瞬间卡片渲染
// ============================================================

/**
 * 加载瞬间数据
 */
async function loadMomentsData() {
    try {
        const response = await App.getRequest('/api/content/moments');
        MomentsState.cards = response.cards || [];
        renderMoments();
        MomentsState.isLoaded = true;
    } catch (error) {
        console.error('加载瞬间数据失败:', error);
    }
}

/**
 * 渲染所有瞬间卡片
 */
function renderMoments() {
    if (!momentsContainer) return;

    momentsContainer.innerHTML = '';
    MomentsState.cardElements.clear();
    MomentsState.order = MomentsState.cards.map((_, index) => index);

    MomentsState.cards.forEach((card, index) => {
        const cardEl = createMomentCard(card, index);
        momentsContainer.appendChild(cardEl);
        MomentsState.cardElements.set(index, cardEl);

        // 延迟动画
        setTimeout(() => {
            cardEl.classList.add('fade-in');
        }, index * 200);
    });

    updateCardPositions();
}

/**
 * 创建单个瞬间卡片
 * @param {Object} card - 卡片数据
 * @param {number} index - 卡片索引
 * @returns {HTMLElement}
 */
function createMomentCard(card, index) {
    // 正面内容
    const frontContent = [
        card.image ?
        App.createElement('img', {
            className: 'moment-front-image',
            src: `/static/${card.image}`,
            alt: card.surface.title
        }) :
        App.createElement('div', { className: 'moment-front-image' }),
        App.createElement('div', { className: 'moment-front-content' }, [
            App.createElement('h3', { className: 'moment-front-title' }, card.surface.title),
            App.createElement('p', { className: 'moment-front-brief' }, card.surface.brief)
        ]),
        App.createElement('span', { className: 'moment-flip-hint' }, '点击置顶')
    ];

    // 背面内容
    const backContent = [
        App.createElement('div', { className: 'moment-back-section moment-what-happened' }, [
            App.createElement('span', { className: 'moment-back-label' }, '发生了什么'),
            App.createElement('p', { className: 'moment-back-text' }, card.deep.what_happened)
        ]),
        App.createElement('div', { className: 'moment-back-section moment-what-felt' }, [
            App.createElement('span', { className: 'moment-back-label' }, '我的感受'),
            App.createElement('p', { className: 'moment-back-text' }, card.deep.what_i_felt)
        ]),
        App.createElement('span', { className: 'moment-back-hint' }, '再次点击翻回')
    ];

    const front = App.createElement('div', { className: 'moment-front' }, frontContent);
    const back = App.createElement('div', { className: 'moment-back' }, backContent);
    const inner = App.createElement('div', { className: 'moment-card-inner' }, [front, back]);

    const cardEl = App.createElement('div', {
        className: 'moment-card',
        'data-index': index,
        onClick: () => handleCardClick(cardEl)
    }, inner);

    return cardEl;
}

/**
 * 处理卡片点击
 * @param {HTMLElement} cardEl - 卡片元素
 */
function handleCardClick(cardEl) {
    const clickedIndex = Number(cardEl.dataset.index);
    const frontIndex = MomentsState.order[0];

    if (clickedIndex === frontIndex) {
        toggleCard(cardEl);
        return;
    }

    bringCardToFront(clickedIndex);
}

/**
 * 将卡片置顶，并把原本最前的卡片放到最后
 * @param {number} clickedIndex - 被点击的卡片索引
 */
function bringCardToFront(clickedIndex) {
    const currentFront = MomentsState.order[0];
    if (clickedIndex === currentFront) return;
    const clickedPosition = MomentsState.order.indexOf(clickedIndex);
    if (clickedPosition === -1) return;

    MomentsState.order[0] = clickedIndex;
    MomentsState.order[clickedPosition] = currentFront;
    MomentsState.cardElements.forEach((cardEl) => cardEl.classList.remove('flipped'));
    updateCardPositions();
}

/**
 * 更新卡片位置和层级
 */
function updateCardPositions() {
    const viewportWidth = window.innerWidth;
    const isCompact = viewportWidth <= 480;
    const isTablet = viewportWidth <= 768 && !isCompact;
    const xStep = isCompact ? 40 : isTablet ? 70 : 90;
    const rowGap = isCompact ? 150 : isTablet ? 170 : 190;
    const angleStep = isCompact ? 20 : isTablet ? 20 : 20;
    const frontLift = isCompact ? -4 : -6;
    const totalCards = MomentsState.order.length;
    const rowCounts = [];
    let remaining = totalCards;

    while (remaining > 0) {
        if (remaining === 1 && rowCounts.length > 0) {
            rowCounts[rowCounts.length - 1] -= 1;
            rowCounts.push(2);
            remaining = 0;
            continue;
        }

        const count = Math.min(3, remaining);
        rowCounts.push(count);
        remaining -= count;
    }

    const rowIndexForGroup = (group) => {
        if (group === 0) return 0;
        const offset = Math.ceil(group / 2);
        return group % 2 === 1 ? -offset : offset;
    };

    const rowPositions = [];
    let positionPointer = 0;
    rowCounts.forEach((count, groupIndex) => {
        const rowIndex = rowIndexForGroup(groupIndex);
        for (let i = 0; i < count; i += 1) {
            rowPositions[positionPointer] = {
                rowIndex,
                count,
                indexInRow: i
            };
            positionPointer += 1;
        }
    });

    MomentsState.order.forEach((cardIndex, position) => {
        const cardEl = MomentsState.cardElements.get(cardIndex);
        if (!cardEl) return;

        const rowConfig = rowPositions[position] || { rowIndex: 0, count: 1, indexInRow: 0 };
        cardEl.dataset.position = String(position);
        cardEl.style.zIndex = String(MomentsState.order.length - position);
        cardEl.classList.toggle('is-front', position === 0);
        const { rowIndex, count, indexInRow } = rowConfig;
        let offsetX = 0;
        if (count === 2) {
            offsetX = indexInRow === 0 ? -xStep / 2 : xStep / 2;
        } else if (count === 3) {
            offsetX = (indexInRow - 1) * xStep;
        }
        const offsetY = (rowIndex * rowGap) + (position === 0 ? frontLift : 0);
        const rotate = Math.sign(offsetX) * angleStep;
        cardEl.style.setProperty('--card-offset-x', `${offsetX}px`);
        cardEl.style.setProperty('--card-offset-y', `${offsetY}px`);
        cardEl.style.setProperty('--card-rotate', `${rotate}deg`);

        const hint = cardEl.querySelector('.moment-flip-hint');
        if (hint) {
            hint.textContent = position === 0 ? '点击翻转' : '点击置顶';
        }
    });
}

/**
 * 翻转卡片
 * @param {HTMLElement} cardEl - 卡片元素
 */
function toggleCard(cardEl) {
    cardEl.classList.toggle('flipped');
}

// ============================================================
// 事件绑定
// ============================================================

// 页面进入时加载数据
document.addEventListener('pageEnter', (e) => {
    if (e.detail.pageName === 'moments' && !MomentsState.isLoaded) {
        loadMomentsData();
    }
});

// 继续按钮
momentsProceed?.addEventListener('click', () => {
    App.navigateTo('letter');
});

window.addEventListener('resize', () => {
    if (MomentsState.isLoaded) {
        updateCardPositions();
    }
});