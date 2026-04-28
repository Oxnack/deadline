"""
api_main.py
FastAPI сервис рекомендаций Супермаркетов Т-Банка.
Запуск: uvicorn api_main:app --host 0.0.0.0 --port 7067 --reload
"""

from fastapi import FastAPI, Query
from pydantic import BaseModel
import pandas as pd
import numpy as np
import joblib
import os
from typing import Optional

app = FastAPI(title="Супермаркеты Т-Банка API", version="1.0")

# ========== ЗАГРУЗКА МОДЕЛЕЙ ==========
model_segment = joblib.load("models/segment_classifier.lgb")
model_return = joblib.load("models/return_classifier.lgb")

SEGMENTS = ["family", "budget", "gourmet_solo", "busy_pro", "traditional"]

# ========== ЗАГРУЗКА / СОЗДАНИЕ CARDS ==========
CARDS_PATH = "data/cards.csv"

if not os.path.exists(CARDS_PATH):
    os.makedirs("data", exist_ok=True)
    test_cards = pd.DataFrame({
        "card_id": range(1, 21),
        "category": [
            "family","family","family","family",
            "budget","budget","budget","budget",
            "gourmet_solo","gourmet_solo","gourmet_solo","gourmet_solo",
            "busy_pro","busy_pro","busy_pro","busy_pro",
            "traditional","traditional","traditional","traditional"
        ],
        "name": [
            "Набор выходного дня", "Пельмени Сибирские 2кг", "Сок Rich 1л", "Пюре ФрутоНяня",
            "Макароны Щедрая Душа", "Чай Принцесса Нури", "Тушёнка ГОСТ", "Хлеб Нарезной",
            "Сыр Пармезан кусок", "Прошутто нарезка", "Авокадо Хасс 2шт", "Оливки Каламата",
            "Готовый обед ChefBox", "Роллы Филадельфия сет", "Суп Том Ям набор", "Кофе навынос стакан",
            "Молоко Простоквашино", "Сметана Домик в дер.", "Крупа Гречневая", "Печенье Юбилейное"
        ],
        "price": [
            2490, 580, 220, 180,
            65, 120, 190, 45,
            890, 750, 320, 420,
            490, 1200, 380, 250,
            110, 95, 85, 130
        ],
        "image": [
            "family_weekend.jpg", "pelmeni.jpg", "juice_rich.jpg", "puree_fruto.jpg",
            "macaroni.jpg", "tea_princess.jpg", "tushonka.jpg", "bread.jpg",
            "parmesan.jpg", "prosciutto.jpg", "avocado.jpg", "olives.jpg",
            "chefbox.jpg", "philadelphia.jpg", "tomyam.jpg", "coffee_to_go.jpg",
            "milk_prostokvashino.jpg", "smetana.jpg", "buckwheat.jpg", "cookies.jpg"
        ]
    })
    test_cards.to_csv(CARDS_PATH, index=False)

cards_df = pd.read_csv(CARDS_PATH)

# ========== МОДЕЛИ ЗАПРОСОВ ==========
class UserFeatures(BaseModel):
    age: int
    gender: int
    city_id: int
    income_rub: int
    family_code: int
    txn_count: int
    avg_ticket: float
    total_spend: float
    std_ticket: float
    weekend_share: float
    evening_share: float
    delivery_share: float
    merchant_0_share: float
    merchant_1_share: float
    merchant_2_share: float
    merchant_3_share: float
    days_active: int
    hour_mode: int
    txn_per_week: float

    class Config:
        json_schema_extra = {
            "example": {
                "age": 32,
                "gender": 0,
                "city_id": 0,
                "income_rub": 95000,
                "family_code": 2,
                "txn_count": 18,
                "avg_ticket": 1700.0,
                "total_spend": 30600.0,
                "std_ticket": 600.0,
                "weekend_share": 0.55,
                "evening_share": 0.45,
                "delivery_share": 0.22,
                "merchant_0_share": 0.15,
                "merchant_1_share": 0.40,
                "merchant_2_share": 0.30,
                "merchant_3_share": 0.15,
                "days_active": 12,
                "hour_mode": 18,
                "txn_per_week": 2.1
            }
        }

# ========== ЭНДПОИНТ 1: КАТЕГОРИЯ ПОЛЬЗОВАТЕЛЯ ==========
@app.post("/api/v1/predict/category")
async def predict_category(features: UserFeatures):
    """Возвращает сегмент пользователя и вероятность возврата."""
    
    # Преобразуем в DataFrame
    X = pd.DataFrame([features.model_dump()])
    
    # Предсказания
    seg_probs = model_segment.predict_proba(X)[0]
    seg_idx = int(np.argmax(seg_probs))
    ret_prob = float(model_return.predict_proba(X)[:, 1][0])
    
    # Собираем ответ
    all_segments = []
    for name, prob in zip(SEGMENTS, seg_probs):
        all_segments.append({
            "segment_name": name,
            "probability": round(float(prob), 4)
        })
    
    return {
        "user_segment": SEGMENTS[seg_idx],
        "confidence": round(float(seg_probs[seg_idx]), 4),
        "return_probability": round(ret_prob, 4),
        "all_probabilities": all_segments
    }


# ========== ЭНДПОИНТ 2: КАРТОЧКИ ТОВАРОВ ==========
@app.get("/api/v1/products")
async def get_products(category: Optional[str] = Query(None, description="Сегмент: family, budget, gourmet_solo, busy_pro, traditional")):
    """
    Возвращает карточки товаров.
    Если category не указана — все товары.
    Если указана — фильтрует по категории.
    """
    
    if category is not None:
        if category not in SEGMENTS:
            return {
                "error": f"Неизвестная категория. Допустимые: {', '.join(SEGMENTS)}"
            }
        
        filtered = cards_df[cards_df["category"] == category]
    else:
        filtered = cards_df
    
    products = []
    for _, row in filtered.iterrows():
        products.append({
            "card_id": int(row["card_id"]),
            "name": row["name"],
            "price": int(row["price"]),
            "image": row["image"]
        })
    
    return {
        "category": category if category else "all",
        "total": len(products),
        "products": products
    }

# ========== ХАРДКОД СРЕДНИХ ЗНАЧЕНИЙ ПО СЕГМЕНТАМ ==========
SEGMENT_STATS = {
    "family": {
        "avg_grocery_spend": 18500,
        "avg_ticket": 2100,
        "avg_txn_per_month": 10,
        "avg_weekend_share": 0.60,
        "avg_delivery_share": 0.25,
        "popular_merchant": "Пятёрочка",
        "description": "Семьи с детьми — большая корзина, выходные, стабильность"
    },
    "budget": {
        "avg_grocery_spend": 7200,
        "avg_ticket": 550,
        "avg_txn_per_month": 14,
        "avg_weekend_share": 0.40,
        "avg_delivery_share": 0.10,
        "popular_merchant": "Чижик",
        "description": "Экономные — частые, но мелкие покупки, дискаунтеры"
    },
    "gourmet_solo": {
        "avg_grocery_spend": 15200,
        "avg_ticket": 2300,
        "avg_txn_per_month": 7,
        "avg_weekend_share": 0.45,
        "avg_delivery_share": 0.40,
        "popular_merchant": "Азбука вкуса",
        "description": "Гурманы-одиночки — премиум, доставка, новинки"
    },
    "busy_pro": {
        "avg_grocery_spend": 12500,
        "avg_ticket": 2800,
        "avg_txn_per_month": 5,
        "avg_weekend_share": 0.30,
        "avg_delivery_share": 0.55,
        "popular_merchant": "Самокат",
        "description": "Занятые профи — большие чеки, вечер, быстрая доставка"
    },
    "traditional": {
        "avg_grocery_spend": 9800,
        "avg_ticket": 870,
        "avg_txn_per_month": 12,
        "avg_weekend_share": 0.50,
        "avg_delivery_share": 0.05,
        "popular_merchant": "Магнит",
        "description": "Консерваторы — офлайн, привычные магазины, средний чек"
    }
}


# ========== ЭНДПОИНТ 3: СРЕДНИЕ ЗНАЧЕНИЯ ПО КАТЕГОРИИ ==========
@app.get("/api/v1/segment/stats")
async def get_segment_stats(category: str = Query(..., description="Сегмент: family, budget, gourmet_solo, busy_pro, traditional")):
    """
    Возвращает средние значения по сегменту (пока хардкод).
    """
    
    if category not in SEGMENT_STATS:
        return {
            "error": f"Неизвестная категория. Допустимые: {', '.join(SEGMENT_STATS.keys())}"
        }
    
    return {
        "segment": category,
        "stats": SEGMENT_STATS[category]
    }


# ========== КОРЕНЬ ==========
@app.get("/")
async def root():
    return {
        "service": "Супермаркеты Т-Банка API",
        "endpoints": {
            "POST /api/v1/predict/category": "Определить сегмент пользователя",
            "GET /api/v1/products": "Получить карточки товаров (?category=family)",
            "GET /api/v1/segment/stats": "Средние значения по сегменту (?category=family)",
        },
        "docs": "/docs"
    }