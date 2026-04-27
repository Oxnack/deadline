// В начале script.js для формы
document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '../main/main.html';
        });
    }
    // ... остальной код
});

document.addEventListener('DOMContentLoaded', () => {
    const incomeInputs = document.querySelectorAll('.js-income');
    const percentInputs = document.querySelectorAll('.js-percent');
    const totalIncomeDisplay = document.getElementById('total-income-val');
    const statusBadge = document.getElementById('status-badge');
    const progressBar = document.getElementById('main-progress-bar');
    const finalSavings = document.getElementById('final-savings');
    const finalPercentText = document.getElementById('final-percent-text');

    function updateCalculations() {
        // 1. Считаем общий доход
        let totalIncome = 0;
        incomeInputs.forEach(input => {
            totalIncome += Number(input.value) || 0;
        });
        totalIncomeDisplay.textContent = totalIncome.toLocaleString('ru-RU');

        // 2. Считаем распределение по категориям
        let usedPercent = 0;
        
        percentInputs.forEach(input => {
            const percent = Number(input.value) || 0;
            usedPercent += percent;

            // Вычисляем сумму для конкретной категории
            const categoryAmount = (totalIncome * percent) / 100;
            const resultId = input.dataset.res;
            document.getElementById(resultId).textContent = 
                categoryAmount.toLocaleString('ru-RU') + ' ₽';
        });

        // 3. Обновляем статус-бар и бейдж
        statusBadge.textContent = `Использовано: ${usedPercent}%`;
        
        // Визуализация прогресса
        const displayPercent = Math.min(usedPercent, 100);
        progressBar.style.width = displayPercent + '%';

        if (usedPercent > 100) {
            statusBadge.classList.add('overlimit');
            progressBar.classList.add('danger');
        } else {
            statusBadge.classList.remove('overlimit');
            progressBar.classList.remove('danger');
        }

        // 4. Итоговый остаток (инвестиции)
        const remainingPercent = 100 - usedPercent;
        const remainingMoney = (totalIncome * remainingPercent) / 100;

        finalSavings.textContent = remainingMoney.toLocaleString('ru-RU') + ' ₽';
        finalPercentText.textContent = remainingPercent >= 0 
            ? `Свободно: ${remainingPercent}% от дохода`
            : `Перерасход: ${Math.abs(remainingPercent)}%`;
        
        if(remainingPercent < 0) {
            finalSavings.style.color = '#d32f2f';
        } else {
            finalSavings.style.color = '#2e7d32';
        }
    }

    // Слушаем ввод на всех полях
    [...incomeInputs, ...percentInputs].forEach(input => {
        input.addEventListener('input', updateCalculations);
    });

    // Инициализация при загрузке
    updateCalculations();
}); 

document.addEventListener('DOMContentLoaded', () => {
    const incomeInputs = document.querySelectorAll('.js-income');
    const percentInputs = document.querySelectorAll('.js-percent');
    const saveBtn = document.querySelector('.main-btn');
    
    // Элементы UI
    const totalIncomeDisplay = document.getElementById('total-income-val');
    const statusBadge = document.getElementById('status-badge');
    const progressBar = document.getElementById('main-progress-bar');
    const finalSavings = document.getElementById('final-savings');
    const finalPercentText = document.getElementById('final-percent-text');

    // Функция для получения общего дохода (нужна и при сохранении, и при загрузке)
    function getTotalIncome() {
        let total = 0;
        incomeInputs.forEach(input => {
            total += Number(input.value) || 0;
        });
        return total;
    }

    // 1. РАСЧЕТ И ОБНОВЛЕНИЕ UI
    function updateCalculations() {
        const totalIncome = getTotalIncome();
        totalIncomeDisplay.textContent = totalIncome.toLocaleString('ru-RU');

        let usedPercent = 0;
        percentInputs.forEach(input => {
            const percent = Number(input.value) || 0;
            usedPercent += percent;

            const categoryAmount = (totalIncome * percent) / 100;
            const resultId = input.dataset.res;
            document.getElementById(resultId).textContent = 
                categoryAmount.toLocaleString('ru-RU') + ' ₽';
        });

        const displayPercent = Math.min(usedPercent, 100);
        progressBar.style.width = displayPercent + '%';
        statusBadge.textContent = `Использовано: ${usedPercent}%`;

        const remainingPercent = 100 - usedPercent;
        const remainingMoney = (totalIncome * remainingPercent) / 100;
        finalSavings.textContent = remainingMoney.toLocaleString('ru-RU') + ' ₽';
        finalPercentText.textContent = remainingPercent >= 0 
            ? `Свободно: ${remainingPercent}%` 
            : `Перерасход: ${Math.abs(remainingPercent)}%`;
    }

    // 2. СОХРАНЕНИЕ СУММ (РУБЛЕЙ)
    function savePlan() {
        const totalIncome = getTotalIncome();
        const planData = {
            incomes: {},
            amounts: {} // Сохраняем именно суммы в рублях
        };

        incomeInputs.forEach(input => {
            planData.incomes[input.id] = input.value;
        });

        percentInputs.forEach(input => {
            const percent = Number(input.value) || 0;
            const amountInRubles = (totalIncome * percent) / 100; // Считаем сумму
            const key = input.dataset.res;
            planData.amounts[key] = amountInRubles; // Сохраняем рубли
        });

        sessionStorage.setItem('myBudgetPlan', JSON.stringify(planData));
        
        // Фидбек кнопки
        const originalText = saveBtn.textContent;
        saveBtn.textContent = "✅ Суммы сохранены";
        saveBtn.style.background = "#4CAF50";
        saveBtn.style.color = "white";
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = ""; saveBtn.style.color = "";
        }, 2000);
    }

    // 3. ЗАГРУЗКА И ОБРАТНЫЙ РАСЧЕТ ПРОЦЕНТОВ
    function loadPlan() {
        const savedData = sessionStorage.getItem('myBudgetPlan');
        if (!savedData) {
            updateCalculations();
            return;
        }

        const planData = JSON.parse(savedData);

        // Сначала восстанавливаем доходы, чтобы знать базу для расчета %
        incomeInputs.forEach(input => {
            if (planData.incomes[input.id] !== undefined) {
                input.value = planData.incomes[input.id];
            }
        });

        const totalIncome = getTotalIncome();

        // Восстанавливаем проценты на основе сохраненных сумм
        percentInputs.forEach(input => {
            const key = input.dataset.res;
            const savedAmount = planData.amounts[key];

            if (savedAmount !== undefined && totalIncome > 0) {
                // Обратная формула: (Сумма / Доход) * 100 = Процент
                const calculatedPercent = (savedAmount / totalIncome) * 100;
                input.value = Math.round(calculatedPercent); // Округляем до целого
            }
        });

        updateCalculations();
    }

    // Слушатели событий
    [...incomeInputs, ...percentInputs].forEach(input => {
        input.addEventListener('input', updateCalculations);
    });

    saveBtn.addEventListener('click', savePlan);

    loadPlan();
});

