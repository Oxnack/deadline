// Функция для проверки и отображения бюджета
function initBudgetSection() {
    const toggleBtn = document.getElementById('budget-toggle-btn');
    const budgetContent = document.getElementById('budget-content');
    const toggleIcon = toggleBtn.querySelector('.toggle-icon');
    
    let isOpen = false;
    
    // Обработчик клика на заголовок
    toggleBtn.addEventListener('click', () => {
        isOpen = !isOpen;
        
        if (isOpen) {
            budgetContent.classList.add('open');
            toggleIcon.classList.add('active');
            renderBudgetContent(); // Обновляем контент при открытии
        } else {
            budgetContent.classList.remove('open');
            toggleIcon.classList.remove('active');
        }
    });
    
    // Функция рендеринга контента
    function renderBudgetContent() {
        const savedData = sessionStorage.getItem('myBudgetPlan');
        
        if (!savedData) {
            // Нет данных - показываем пустое состояние
            budgetContent.innerHTML = `
                <div class="budget-empty">
                    <div class="budget-empty-icon">📝</div>
                    <h3>Бюджет не настроен</h3>
                    <p>Спланируйте доходы и расходы, чтобы контролировать финансы</p>
                    <button class="budget-empty-btn" onclick="window.location.href='../forma/forma.html'">
                        Создать бюджет
                    </button>
                </div>
            `;
        } else {
            // Есть данные - показываем сводку
            const planData = JSON.parse(savedData);
            
            // Считаем totals
            let totalIncome = 0;
            Object.values(planData.incomes).forEach(val => {
                totalIncome += Number(val) || 0;
            });
            
            let totalExpenses = 0;
            Object.values(planData.amounts).forEach(val => {
                totalExpenses += Number(val) || 0;
            });
            
            const savings = totalIncome - totalExpenses;
            const savingsPercent = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;
            
            budgetContent.innerHTML = `
                <div class="budget-summary">
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
                    
                    <div class="budget-categories">
                        <div class="budget-label" style="margin-bottom: 10px;">По категориям:</div>
                        ${renderCategories(planData.amounts)}
                    </div>
                    
                    <button class="budget-edit-btn" onclick="window.location.href='../forma/forma.html'">
                        ✏️ Редактировать бюджет
                    </button>
                </div>
            `;
        }
    }
    
    // Helper для рендеринга категорий
    function renderCategories(amounts) {
        const categoryNames = {
            'res-food': '🛒 Продукты',
            'res-transport': '🚗 Транспорт',
            'res-home': '🏠 Жилье',
            'res-fun': '🎬 Развлечения'
        };
        
        let html = '';
        for (const [key, value] of Object.entries(amounts)) {
            const name = categoryNames[key] || '📦 Другое';
            const amount = Number(value) || 0;
            if (amount > 0) {
                html += `
                    <div class="budget-cat-item">
                        <span class="budget-cat-name">${name}</span>
                        <span class="budget-value">${amount.toLocaleString('ru-RU')} ₽</span>
                    </div>
                `;
            }
        }
        return html;
    }
    
    // Инициализация при загрузке
    renderBudgetContent();
}

// Вызываем функцию когда DOM готов
document.addEventListener('DOMContentLoaded', () => {
    // ... ваш существующий код ...
    
    // Добавляем инициализацию бюджетной секции
    if (document.getElementById('budget-toggle-btn')) {
        initBudgetSection();
    }
});