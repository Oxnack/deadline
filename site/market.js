const API_BASE = 'https://api.ddln.oxnack.com';
let currentCart = [];

// Словарь категорий с описанием
const categoryDescriptions = {
    'gourmet_solo': 'богатый(ая) одиночка',
    'family': 'семейный',
    'budget': 'бюджетный (бедный)',
    'busy_pro': 'занятой богатый, еда в дорогу',
    'traditional': 'обычный'
};


// Получить баланс из sessionStorage
function getBalance() {
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const data = sessionStorage.getItem(key);
        if (data && data.includes('"res-food"')) {
            try {
                const parsed = JSON.parse(data);
                return parseInt(parsed.amounts["res-food"]) || 30000;
            } catch(e) {}
        }
    }
    return 30000; // значение по умолчанию
}

// Сохранить баланс
function setBalance(newBalance) {
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const data = sessionStorage.getItem(key);
        if (data && data.includes('"res-food"')) {
            try {
                const parsed = JSON.parse(data);
                parsed.amounts["res-food"] = newBalance;
                sessionStorage.setItem(key, JSON.stringify(parsed));
                break;
            } catch(e) {}
        }
    }
}

// Обновить отображение баланса
function updateBalanceDisplay() {
    const balanceEl = document.getElementById('food-balance');
    if (balanceEl) {
        const balance = getBalance();
        balanceEl.textContent = balance.toLocaleString('ru-RU') + ' ₽';
        balanceEl.style.color = balance < 500 ? '#FF3B30' : '#34C759';
    }
}


document.getElementById('predict-btn').addEventListener('click', async () => {
    // Собираем все 19 признаков (для примера берем часть из инпутов, остальные дефолт)
    const features = {
        age: parseInt(document.getElementById('age').value),
        gender: 0,
        city_id: 0,
        income_rub: parseInt(document.getElementById('income_rub').value),
        family_code: 2,
        txn_count: parseInt(document.getElementById('txn_count').value),
        avg_ticket: parseFloat(document.getElementById('avg_ticket').value),
        total_spend: 30600.0,
        std_ticket: 600.0,
        weekend_share: parseFloat(document.getElementById('weekend_share').value),
        evening_share: 0.45,
        delivery_share: parseFloat(document.getElementById('delivery_share').value),
        merchant_0_share: 0.15,
        merchant_1_share: 0.40,
        merchant_2_share: 0.30,
        merchant_3_share: 0.15,
        days_active: 12,
        hour_mode: 18,
        txn_per_week: 2.1
    };

    try {
        // 1. Предсказание категории
        const predRes = await fetch(`${API_BASE}/api/v1/predict/category`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(features)
        });
        const predData = await predRes.json();
        const segment = predData.user_segment;

        // Переключаем экран
        document.getElementById('tech-modal').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        const segmentDesc = categoryDescriptions[segment] || segment;
        document.getElementById('segment-name').innerText = `Ваша категория (по всем транзакциям, в том числе оффлайн покупки, любые действия): ${segmentDesc}`;
        document.getElementById('confidence-val').innerText = `${(predData.confidence * 100).toFixed(0)}% совпадение`;

        // 2. Получаем статистику сегмента
        const statsRes = await fetch(`${API_BASE}/api/v1/segment/stats?category=${segment}`);
        const statsData = await statsRes.json();
        renderStats(statsData.stats);

        // 3. Получаем товары
        const prodRes = await fetch(`${API_BASE}/api/v1/products?category=${segment}`);
        const prodData = await prodRes.json();
        renderProducts(prodData.products);

    } catch (e) {
        alert("Ошибка связи с API");
        console.error(e);
    }
});

function renderStats(stats) {
    const bar = document.getElementById('stats-bar');
    bar.innerHTML = `
        <div class="stat-card"><span class="stat-label">Средний чек</span><span class="stat-value">${stats.avg_ticket} ₽</span></div>
        <div class="stat-card"><span class="stat-label">Трат в месяц</span><span class="stat-value">${stats.avg_grocery_spend} ₽</span></div>
        <div class="stat-card"><span class="stat-label">Магазин</span><span class="stat-value">${stats.popular_merchant}</span></div>
        <div class="stat-card"><span class="stat-label">Доставка</span><span class="stat-value">${(stats.avg_delivery_share * 100).toFixed(0)}%</span></div>
    `;
}

function renderProducts(products) {
    const list = document.getElementById('product-list');
    list.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="images/${p.image}" class="p-img" onerror="this.src='images/default.jpg'">
            <div class="p-price">${p.price} ₽</div>
            <div class="p-name">${p.name}</div>
            <div class="quantity-controls" id="controls-${p.name.replace(/\s+/g, '-')}">
                <button class="qty-btn minus" onclick="changeQuantity('${p.name}', -1)">-</button>
                <span class="qty-display" id="qty-${p.name.replace(/\s+/g, '-')}">0</span>
                <button class="qty-btn plus" onclick="changeQuantity('${p.name}', 1)">+</button>
            </div>
            <button class="p-btn" onclick="addToCart('${p.name}', ${p.price})">Добавить</button>
        </div>
    `).join('');
}

function addToCart(name, price) {
    const currentBalance = getBalance();
    const newBalance = currentBalance - price;
    
    // Проверка на отрицательный баланс
    if (newBalance < 0) {
        alert('❌ Недостаточно средств!');
        return;
    }
    
    setBalance(newBalance);
    updateBalanceDisplay();
    
    // Найти товар в корзине
    let item = currentCart.find(i => i.name === name);
    if (item) {
        item.quantity += 1;
    } else {
        currentCart.push({ name, price, quantity: 1 });
    }
    
    updateCartDisplay();
    
    // Показать счетчик, скрыть кнопку
    const controls = document.getElementById(`controls-${name.replace(/\s+/g, '-')}`);
    const btn = controls.nextElementSibling;
    controls.style.display = 'flex';
    btn.style.display = 'none';
    
    updateQuantityDisplay(name);
}

function changeQuantity(name, delta) {
    let item = currentCart.find(i => i.name === name);
    if (!item) return;
    
    item.quantity += delta;
    
    if (item.quantity <= 0) {
        // Удалить из корзины
        currentCart = currentCart.filter(i => i.name !== name);
        // Скрыть счетчик, показать кнопку
        const controls = document.getElementById(`controls-${name.replace(/\s+/g, '-')}`);
        const btn = controls.nextElementSibling;
        controls.style.display = 'none';
        btn.style.display = 'block';

                // Обновить баланс
        const priceChange = delta * item.price;
        const currentBalance = getBalance();
        const newBalance = currentBalance - priceChange;
        
        if (newBalance < 0) {
            alert('❌ Недостаточно средств!');
            item.quantity -= delta; // Откат
            return;
        }
        
        setBalance(newBalance);
        updateBalanceDisplay();
    } else {
        // Обновить баланс
        const priceChange = delta * item.price;
        const currentBalance = getBalance();
        const newBalance = currentBalance - priceChange;
        
        if (newBalance < 0) {
            alert('❌ Недостаточно средств!');
            item.quantity -= delta; // Откат
            return;
        }
        
        setBalance(newBalance);
        updateBalanceDisplay();
    }
    
    updateCartDisplay();
    updateQuantityDisplay(name);
}

function updateQuantityDisplay(name) {
    const item = currentCart.find(i => i.name === name);
    const qty = item ? item.quantity : 0;
    document.getElementById(`qty-${name.replace(/\s+/g, '-')}`).textContent = qty;
}

function updateCartDisplay() {
    document.getElementById('cart-count').innerText = currentCart.reduce((sum, item) => sum + item.quantity, 0);
    const total = currentCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    document.getElementById('cart-total-price').innerText = `${total} ₽`;
}


updateBalanceDisplay();