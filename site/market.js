// Имитация API
const MockAPI = {
    getUserCategory: (pref) => {
        const categories = {
            'healthy': 'Полезный завтрак',
            'fastfood': 'Быстрый перекус',
            'dairy': 'Молочная ферма'
        };
        return new Promise(res => setTimeout(() => res(categories[pref]), 500));
    },
    getProducts: (category) => {
        const products = [
            { id: 1, title: 'Бананы', price: '184,8 ₽', weight: '1,1 кг', img: 'bananas.jpg' },
            { id: 2, title: 'Пицца мини', price: '359 ₽', weight: '220 г', img: 'pizza.jpg' },
            { id: 3, title: 'Чиабатта с курицей', price: '288 ₽', weight: '205 г', img: 'sandwich.jpg' },
            { id: 4, title: 'Сливки 10%', price: '157 ₽', weight: '450 г', img: 'milk.jpg' }
        ];
        return new Promise(res => setTimeout(() => res(products), 800));
    }
};

document.getElementById('save-tech-data').addEventListener('click', async () => {
    const pref = document.getElementById('user-pref').value;
    
    // Скрываем модалку, показываем приложение
    document.getElementById('tech-modal').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';

    // Загружаем данные по "API"
    const categoryName = await MockAPI.getUserCategory(pref);
    document.getElementById('category-title').innerText = categoryName;

    const products = await MockAPI.getProducts(categoryName);
    renderProducts('category-products', products);
    renderProducts('recommendations', products.reverse()); // Для вида перевернем
});

function renderProducts(containerId, items) {
    const container = document.getElementById(containerId);
    container.innerHTML = items.map(item => `
        <div class="product-card">
            <div class="img-wrapper">
                <img src="images/${item.img}" alt="${item.title}">
            </div>
            <div class="price">${item.price}</div>
            <div class="title">${item.title}</div>
            <div class="card-footer">
                <div class="weight">${item.weight}</div>
                <div class="add-btn">+</div>
            </div>
        </div>
    `).join('');
}

// ==================== СИСТЕМА БАЛАНСА НА ЕДУ ====================

let budgetStorageKey = null;

// Получаем данные из sessionStorage
function getBudgetData() {
    if (budgetStorageKey) {
        const data = sessionStorage.getItem(budgetStorageKey);
        if (data) return JSON.parse(data);
    }

    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const valueStr = sessionStorage.getItem(key);
        if (!valueStr) continue;

        try {
            const parsed = JSON.parse(valueStr);
            if (parsed?.amounts && parsed.amounts["res-food"] !== undefined) {
                budgetStorageKey = key;        // запоминаем ключ
                return parsed;
            }
        } catch (e) {}
    }
    return { amounts: { "res-food": 30000 } }; // значение по умолчанию
}

// Сохраняем данные обратно
function saveBudgetData(data) {
    if (!budgetStorageKey) return false;
    sessionStorage.setItem(budgetStorageKey, JSON.stringify(data));
    return true;
}

// Обновляем цифру на странице
function updateBalanceUI() {
    const el = document.getElementById("food-balance");
    if (!el) return;

    const data = getBudgetData();
    const balance = parseInt(data.amounts?.["res-food"]) || 0;

    el.textContent = balance.toLocaleString('ru-RU') + ' ₽';

    // Меняем цвет при низком балансе
    el.style.color = balance < 500 ? '#FF3B30' : '#34C759';
}

// Основная функция: вычитаем деньги при добавлении в корзину
function addToCart(price, productName = '') {
    if (!price || isNaN(price)) return;

    const data = getBudgetData();
    const currentBalance = parseInt(data.amounts?.["res-food"]) || 0;
    const newBalance = currentBalance - Math.round(price);

    data.amounts["res-food"] = newBalance;

    saveBudgetData(data);
    updateBalanceUI();

    console.log(`✅ ${productName || 'Товар'} добавлен в корзину. Списано: ${Math.round(price)} ₽. Остаток: ${newBalance} ₽`);
}

// Инициализация
document.addEventListener("DOMContentLoaded", () => {
    updateBalanceUI();

    // === АВТОМАТИЧЕСКАЯ ОБРАБОТКА КНОПОК "+" ===
    // Подстраивай селекторы под свою верстку
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button, .plus-btn, .add-to-cart');
        if (!btn) return;

        // Пытаемся достать цену
        let price = parseFloat(btn.dataset.price);

        if (!price) {
            const card = btn.closest('.product-card, .product-item, div[onclick]');
            if (card) {
                const priceEl = card.querySelector('.price, .product-price, .cost');
                if (priceEl) {
                    price = parseFloat(priceEl.textContent.replace(/[^0-9.,]/g, '').replace(',', '.'));
                }
            }
        }

        if (price > 0) {
            const name = btn.closest('.product-card, .product-item')?.querySelector('h3, .name, .title')?.textContent?.trim() || '';
            addToCart(price, name);
        }
    });

    console.log('✅ Система баланса на еду с вычитанием при добавлении в корзину готова');
});