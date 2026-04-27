"""
generate_tables.py
Создаёт CSV-таблицы для MVP рекомендательной системы Супермаркетов Т-Банка.
Запуск: python generate_tables.py
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

# ========== КОНФИГУРАЦИЯ ==========
N_USERS = 500
SEED = 42
OUTPUT_DIR = "data"
START_DATE = datetime(2025, 10, 1)
END_DATE = datetime(2026, 4, 27)

np.random.seed(SEED)

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

def random_dates(start, end, n):
    """Генерирует n случайных дат между start и end."""
    delta = (end - start).days
    return [start + timedelta(days=np.random.randint(0, delta)) for _ in range(n)]

def random_choice_weighted(choices, weights, n):
    return np.random.choice(choices, size=n, p=weights)

# ========== 1. USERS ==========
print("Создаю users.csv...")

user_ids = [f"user_{i:05d}" for i in range(N_USERS)]

ages = np.random.normal(34, 10, N_USERS).astype(int)
ages = np.clip(ages, 18, 75)

genders = random_choice_weighted(["M", "F"], [0.48, 0.52], N_USERS)

cities = random_choice_weighted(
    ["Москва", "СПб", "Казань", "Новосибирск", "Екатеринбург"],
    [0.40, 0.20, 0.15, 0.13, 0.12],
    N_USERS
)

income = np.random.lognormal(mean=10.8, sigma=0.6, size=N_USERS).astype(int)
income = np.clip(income, 20000, 350000)

family_status = random_choice_weighted(
    ["один", "пара", "семья_с_детьми", "с_родителями"],
    [0.30, 0.28, 0.32, 0.10],
    N_USERS
)

users = pd.DataFrame({
    "user_id": user_ids,
    "age": ages,
    "gender": genders,
    "city": cities,
    "income_rub": income,
    "family_status": family_status,
    "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
})

users.to_csv(f"{OUTPUT_DIR}/users.csv", index=False)
print(f"  -> {len(users)} строк")

# ========== 2. TRANSACTIONS ==========
print("Создаю transactions.csv...")

merchants_pool = {
    "эконом": ["Чижик", "Светофор", "Магнит"],
    "средний": ["Пятёрочка", "Перекрёсток", "Лента", "Дикси"],
    "премиум": ["Азбука вкуса", "ВкусВилл", "Глобус Гурмэ", "Мясновъ"],
    "онлайн": ["Самокат", "Яндекс.Лавка", "СберМаркет", "Ozon Fresh"]
}

transactions = []
for user_id in user_ids:
    user = users[users["user_id"] == user_id].iloc[0]
    n_txns = np.random.poisson(lam=22 + user["age"] * 0.15)
    n_txns = max(5, n_txns)

    # Сегмент пользователя по доходу
    if user["income_rub"] > 120000:
        segment = "премиум"
        weights = [0.10, 0.35, 0.40, 0.15]
    elif user["income_rub"] > 60000:
        segment = "средний"
        weights = [0.25, 0.45, 0.15, 0.15]
    else:
        segment = "эконом"
        weights = [0.50, 0.30, 0.05, 0.15]

    merchant_types = random_choice_weighted(
        list(merchants_pool.keys()), weights, n_txns
    )

    dates = sorted(random_dates(START_DATE, END_DATE, n_txns))

    for d, mtype in zip(dates, merchant_types):
        merchant = np.random.choice(merchants_pool[mtype])
        amount = abs(np.random.normal(
            loc=400 if mtype == "эконом" else 900 if mtype == "средний" else 1800,
            scale=200 if mtype == "эконом" else 400 if mtype == "средний" else 700
        ))
        transactions.append({
            "transaction_id": f"txn_{len(transactions):07d}",
            "user_id": user_id,
            "timestamp": d.strftime("%Y-%m-%d %H:%M:%S"),
            "amount_rub": round(amount, 2),
            "merchant_name": merchant,
            "merchant_type": mtype,
            "city": user["city"]
        })

txns_df = pd.DataFrame(transactions)
txns_df.to_csv(f"{OUTPUT_DIR}/transactions.csv", index=False)
print(f"  -> {len(txns_df)} строк")

# ========== 3. APP EVENTS ==========
print("Создаю app_events.csv...")

event_types = [
    "app_opened", "category_viewed", "search_query", "product_clicked",
    "cart_updated", "order_started", "order_completed", "order_cancelled",
    "push_received", "push_clicked"
]

# Вероятности событий для разных типов юзеров
base_probs = [0.30, 0.18, 0.05, 0.15, 0.10, 0.06, 0.08, 0.02, 0.04, 0.02]

app_events = []
for user_id in user_ids:
    user = users[users["user_id"] == user_id].iloc[0]
    n_events = np.random.poisson(lam=35)
    n_events = max(3, n_events)

    dates = sorted(random_dates(START_DATE, END_DATE, n_events))

    for d in dates:
        ev_type = np.random.choice(event_types, p=base_probs)
        session_id = f"sess_{user_id}_{d.strftime('%Y%m%d%H%M%S')}"
        app_events.append({
            "event_id": f"evt_{len(app_events):08d}",
            "user_id": user_id,
            "session_id": session_id,
            "timestamp": d.strftime("%Y-%m-%d %H:%M:%S"),
            "event_type": ev_type,
            "source": np.random.choice(["push", "organic", "email"], p=[0.15, 0.75, 0.10])
        })

events_df = pd.DataFrame(app_events)
events_df.to_csv(f"{OUTPUT_DIR}/app_events.csv", index=False)
print(f"  -> {len(events_df)} строк")

# ========== 4. ORDERS ==========
print("Создаю orders.csv...")

# Берём только completed события
completed_events = events_df[events_df["event_type"] == "order_completed"].copy()

orders = []
for _, ev in completed_events.iterrows():
    user = users[users["user_id"] == ev["user_id"]].iloc[0]
    if user["income_rub"] > 120000:
        amount = abs(np.random.normal(2800, 900))
    elif user["income_rub"] > 60000:
        amount = abs(np.random.normal(1600, 500))
    else:
        amount = abs(np.random.normal(900, 300))

    orders.append({
        "order_id": f"ord_{len(orders):06d}",
        "user_id": ev["user_id"],
        "event_id": ev["event_id"],
        "timestamp": ev["timestamp"],
        "amount_rub": round(amount, 2),
        "is_first_order": 0,
        "delivery_minutes": np.random.choice([25, 35, 45, 60, 90], p=[0.30, 0.35, 0.20, 0.10, 0.05])
    })

orders_df = pd.DataFrame(orders)

# Помечаем первый заказ для каждого юзера
first_order_idx = orders_df.groupby("user_id")["timestamp"].idxmin()
orders_df.loc[first_order_idx, "is_first_order"] = 1

orders_df.to_csv(f"{OUTPUT_DIR}/orders.csv", index=False)
print(f"  -> {len(orders_df)} строк")

# ========== 5. USER EMBEDDINGS (пустой шаблон) ==========
print("Создаю user_embeddings.csv...")

embeddings = pd.DataFrame({
    "user_id": user_ids,
    "segment": [""] * N_USERS,
    "family_score": [0.0] * N_USERS,
    "budget_score": [0.0] * N_USERS,
    "gourmet_score": [0.0] * N_USERS,
    "busy_score": [0.0] * N_USERS,
    "traditional_score": [0.0] * N_USERS,
    "churn_risk": [0.0] * N_USERS,
    "predicted_ltv": [0.0] * N_USERS,
    "updated_at": [""] * N_USERS
})

embeddings.to_csv(f"{OUTPUT_DIR}/user_embeddings.csv", index=False)
print(f"  -> {len(embeddings)} строк")

# ========== ИТОГИ ==========
print("\n" + "="*50)
print("ГОТОВО! Созданы таблицы в папке data/:")
for f in os.listdir(OUTPUT_DIR):
    size = os.path.getsize(f"{OUTPUT_DIR}/{f}")
    print(f"  {f} ({size:,} байт)")
print("="*50)