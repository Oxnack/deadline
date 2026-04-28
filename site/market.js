const API_BASE = 'https://api.ddln.oxnack.com';

let cart = [];

// 1. РАБОТА С ТЕХНИЧЕСКИМ ОКНОМ И API
document.getElementById('save-tech-data').addEventListener('click', async () => {
    const userData = {
        age: document.getElementById('user-age').value,
        gender: document.getElementById('user-gender').value,
        pref_score: document.getElementById('user-pref-score').value
    };

    try {
        // Показываем лоадер (опционально)
        document.getElementById('tech-modal').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';

        // Шаг 1: Получаем категорию и средние значения
        const categoryRes = await fetch(`${API_BASE}/predict_category`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const categoryData = await categoryRes.json();
        
        renderStats(categoryData.averages); // Отображаем средние значения

        // Шаг 2: Получаем ленту рекомендаций
        const feedRes = await fetch(`${API_BASE}/get_recommendations?category=${categoryData.category_id}`);
        const products = await feedRes.json();
        
        renderRecommendations(products);

    } catch (error) {
        console.error("Ошибка API:", error);
        alert("Не удалось загрузить данные с сервера.");
    }
});

// 2. ОТОБРАЖЕНИЕ СРЕДНИХ ЗНАЧЕНИЙ
function renderStats(stats) {
    const container = document.getElementById('category-stats');
    // Предполагаем что stats это объект {avg_price: 250, avg_weight: "500г"}
    container.innerHTML = `
        <div class="stat-item">Средний чек: <b>${stats.avg_price} ₽</b></div>
        <div class="stat-item">Частый вес: <b>${stats.avg_weight}</b></div>
        <div class="stat-item">Категория: <b>${stats.name}</b></div>
    `;
}

// 3. ОТОБРАЖЕНИЕ ТОВАРОВ
function renderRecommendations(items) {
    const container = document.getElementById('recommendations');
    container.innerHTML = items.map(item => `
        <div class="product-card">
            <div class="img-wrapper">
                <img src="images/${item.img || 'default.jpg'}">
            </div>
            <div class="price">${item.price} ₽</div>
            <div class="title">${item.title}</div>
            <div class="card-footer">
                <div class="weight">${item.weight}</div>
                <div class="add-btn" onclick="addToCart(${item.id}, '${item.title}', ${item.price})">+</div>
            </div>
        </div>
    `).join('');
}

// 4. ЛОГИКА КОРЗИНЫ
window.addToCart = function(id, title, price) {
    cart.push({id, title, price});
    updateCartWidget();
};

function updateCartWidget() {
    const widget = document.getElementById('cart-widget');
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total');

    if (cart.length > 0) {
        widget.style.display = 'flex';
        countEl.innerText = cart.length;
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        totalEl.innerText = `${total} ₽`;
    } else {
        widget.style.display = 'none';
    }
}