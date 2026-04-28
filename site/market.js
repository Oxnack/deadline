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