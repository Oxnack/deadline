const API_BASE = 'https://api.ddln.oxnack.com';
let currentCart = [];

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
        document.getElementById('segment-name').innerText = `Для вас: ${segment}`;
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
            <button class="p-btn" onclick="addToCart('${p.name}', ${p.price})">Добавить</button>
        </div>
    `).join('');
}

function addToCart(name, price) {
    currentCart.push({ name, price });
    document.getElementById('cart-count').innerText = currentCart.length;
    const total = currentCart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('cart-total-price').innerText = `${total} ₽`;
}