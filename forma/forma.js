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

    const STORAGE_KEY = 'myBudgetPlan';

    // Получить общий доход
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
        
        // Визуальное предупреждение при превышении 100%
        if (usedPercent > 100) {
            progressBar.classList.add('danger');
            statusBadge.classList.add('overlimit');
            statusBadge.textContent = `⚠️ Перерасход: ${usedPercent}%`;
        } else {
            progressBar.classList.remove('danger');
            statusBadge.classList.remove('overlimit');
            statusBadge.textContent = `Использовано: ${usedPercent}%`;
        }

        const remainingPercent = 100 - usedPercent;
        const remainingMoney = (totalIncome * remainingPercent) / 100;
        finalSavings.textContent = remainingMoney.toLocaleString('ru-RU') + ' ₽';
        finalPercentText.textContent = remainingPercent >= 0 
            ? `Свободно: ${remainingPercent}%` 
            : `Перерасход: ${Math.abs(remainingPercent)}%`;
    }

    // 2. АВТОСОХРАНЕНИЕ СУММ (ПОСТОЯННОЕ)
    function autoSavePlan() {
        const totalIncome = getTotalIncome();
        const planData = {
            incomes: {},
            amounts: {},
            lastSaved: new Date().toISOString()
        };

        incomeInputs.forEach(input => {
            planData.incomes[input.id] = input.value;
        });

        percentInputs.forEach(input => {
            const percent = Number(input.value) || 0;
            const amountInRubles = (totalIncome * percent) / 100;
            const key = input.dataset.res;
            planData.amounts[key] = amountInRubles;
        });

        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(planData));
    }

    // 3. СОХРАНЕНИЕ С УВЕДОМЛЕНИЕМ (при клике на кнопку)
    function savePlan() {
        autoSavePlan();
        
        const originalText = saveBtn.textContent;
        saveBtn.textContent = "✅ Суммы сохранены";
        saveBtn.style.background = "#4CAF50";
        saveBtn.style.color = "white";
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = ""; 
            saveBtn.style.color = "";
        }, 2000);
    }

    // 4. ЗАГРУЗКА И ОБРАТНЫЙ РАСЧЕТ ПРИспользованоОЦЕНТОВ
    function loadPlan() {
        const savedData = sessionStorage.getItem(STORAGE_KEY);
        if (!savedData) {
            updateCalculations();
            return;
        }

        try {
            const planData = JSON.parse(savedData);

            incomeInputs.forEach(input => {
                if (planData.incomes[input.id] !== undefined) {
                    input.value = planData.incomes[input.id];
                }
            });

            const totalIncome = getTotalIncome();

            percentInputs.forEach(input => {
                const key = input.dataset.res;
                const savedAmount = planData.amounts[key];

                if (savedAmount !== undefined && totalIncome > 0) {
                    const calculatedPercent = (savedAmount / totalIncome) * 100;
                    input.value = Math.round(calculatedPercent);
                }
            });
        } catch (e) {
            console.log('Ошибка загрузки данных:', e);
        }

        updateCalculations();
    }

    // Слушатели событий - автосохранение при любом изменении
    [...incomeInputs, ...percentInputs].forEach(input => {
        input.addEventListener('input', () => {
            updateCalculations();
            autoSavePlan(); // Автосохранение при каждом изменении
        });
    });

    // Валидация процентов - не позволяет превышать 100%
    percentInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            let totalPercent = 0;
            percentInputs.forEach(inp => {
                totalPercent += Number(inp.value) || 0;
            });

            // Если превышено 100%, откатываем значение
            if (totalPercent > 100) {
                const maxAllowed = 100 - (totalPercent - Number(e.target.value));
                e.target.value = Math.max(0, maxAllowed);
                updateCalculations();
                autoSavePlan();
            }
        });
    });

    saveBtn.addEventListener('click', savePlan);

    // Загрузка при загрузке страницы
    loadPlan();
});