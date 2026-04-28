document.addEventListener('DOMContentLoaded', () => {
    initBudgetSection();
    // renderPillowProgress();
});

// Логика раскрывающегося бюджета
function initBudgetSection() {
    const budgetContent = document.getElementById('budget-content');
    
    // Сразу отображаем контент (без скрытия)
    budgetContent.classList.add('open');
    renderBudgetContent();
    
    // Кнопка toggle теперь только для сворачивания/разворачивания
    const toggleBtn = document.getElementById('budget-toggle-btn');
    const toggleIcon = toggleBtn.querySelector('.toggle-icon');
    let isOpen = true;
    
    toggleBtn.addEventListener('click', () => {
        isOpen = !isOpen;
        if (isOpen) {
            budgetContent.classList.add('open');
            toggleIcon.classList.add('active');
            renderBudgetContent(); // Обновляем при открытии
        } else {
            budgetContent.classList.remove('open');
            toggleIcon.classList.remove('active');
        }
    });
}

// Вынесите renderBudgetContent в отдельную функцию
function renderBudgetContent() {
    const budgetContent = document.getElementById('budget-content');
    if (!budgetContent) return;
    
    const savedData = sessionStorage.getItem('myBudgetPlan');
    
    if (!savedData) {
        budgetContent.innerHTML = `
            <div class="budget-empty">
                <div class="budget-empty-icon">📝</div>
                <h3>Бюджет не настроен</h3>
                <p>Спланируйте доходы и расходы</p>
                <button class="budget-empty-btn" onclick="window.location.href='../forma/forma.html'">
                    Создать бюджет
                </button>
            </div>
        `;
    } else {
        const planData = JSON.parse(savedData);
        let totalIncome = 0;
        Object.values(planData.incomes).forEach(val => totalIncome += Number(val) || 0);
        
        let totalExpenses = 0;
        Object.values(planData.amounts).forEach(val => totalExpenses += Number(val) || 0);
        
        const savings = totalIncome - totalExpenses;
        const savingsPercent = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;
        
        budgetContent.innerHTML = `
            <div class="budget-categories-grid">
                ${renderCategoryBlocks(planData.amounts)}
            </div>
            
            <div class="budget-summary">
                <div class="budget-summary-title">📊 Итого</div>
                <div class="budget-row">
                    <span class="budget-label">Доход</span>
                    <span class="budget-value income">${totalIncome.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div class="budget-row">
                    <span class="budget-label">Расходы</span>
                    <span class="budget-value expense">${totalExpenses.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div class="budget-row">
                    <span class="budget-label">Остаток (${savingsPercent}%)</span>
                    <span class="budget-value savings">${savings.toLocaleString('ru-RU')} ₽</span>
                </div>
            </div>
            
            <button class="budget-edit-btn" onclick="window.location.href='../forma/forma.html'">
                ✏️ Редактировать бюджет
            </button>
        `;
    }
}

function renderCategoryBlocks(amounts) {
    const categoryNames = {
        'res-food': '🛒 Продукты',
        'res-transport': '🚗 Транспорт',
        'res-home': '🏠 Жилье',
        'res-fun': '🎬 Развлечения',
        'res-pillow': '🛡️ Фин. подушка'
    };
    
    let html = '';
    for (const [key, value] of Object.entries(amounts)) {
        const name = categoryNames[key] || '📦 Другое';
        const amount = Number(value) || 0;
        if (amount > 0) {
            if (name == "🛒 Продукты"){
                html += `<a href="../site/market.html">
                <div class="budget-category-block" >
                    <span class="budget-cat-block-name">${name}</span>
                    <span class="budget-cat-block-amount">${amount.toLocaleString('ru-RU')} ₽</span>
                </div></a>
            `;
            }
            else{
                html += `<a href="../site/pageDeployment.html">
                <div class="budget-category-block" >
                    <span class="budget-cat-block-name">${name}</span>
                    <span class="budget-cat-block-amount">${amount.toLocaleString('ru-RU')} ₽</span>
                </div></a>
            `;
            }
        }
    }
    return html;
}

// Отображение прогресса подушки отдельно (карточка над бюджетом)
function renderPillowProgress() {
    let container = document.getElementById('pillow-progress-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'pillow-progress-container';
        const budgetSection = document.querySelector('.budget-section');
        if(budgetSection) {
            budgetSection.parentNode.insertBefore(container, budgetSection);
        }
    }

    const savedData = sessionStorage.getItem('myBudgetPlan');
    if (!savedData) {
        container.innerHTML = '';
        return;
    }
    
    const planData = JSON.parse(savedData);
    const pillowAmount = planData.amounts['res-pillow'];
    
    if (!pillowAmount || Number(pillowAmount) === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = `
        <div class="pillow-summary-card">
            <div class="pillow-summary-header">
                <span class="pillow-summary-title">🛡️ Финансовая подушка</span>
                <span class="pillow-summary-badge">Накоплено</span>
            </div>
            <div style="font-size: 24px; font-weight: 700;">${Number(pillowAmount).toLocaleString('ru-RU')} ₽</div>
            <div style="font-size: 13px; opacity: 0.9; margin-top: 5px;">Отложено от дохода в этом месяце</div>
        </div>
    `;
}