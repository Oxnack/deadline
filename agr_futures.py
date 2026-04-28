"""
aggregate_features.py
Агрегирует transactions до уровня пользователя и объединяет с users и labels.
Запуск: python aggregate_features.py
"""

import pandas as pd
import numpy as np

# ========== ЗАГРУЗКА ==========
users = pd.read_csv("data/users.csv")
txns = pd.read_csv("data/transactions.csv")
labels = pd.read_csv("data/user_labels.csv")

# ========== АГРЕГАЦИЯ TRANSACTIONS ==========

# День недели: 5=суббота, 6=воскресенье
txns["is_weekend"] = (txns["day_offset"] % 7 >= 5).astype(int)

# Вечер: 17–22
txns["is_evening"] = ((txns["hour"] >= 17) & (txns["hour"] <= 22)).astype(int)

# One-hot доля по merchant_type
merchant_dummies = pd.get_dummies(txns["merchant_type"], prefix="merchant")
txns_dummy = pd.concat([txns, merchant_dummies], axis=1)

# Агрегация
agg = txns_dummy.groupby("user_id").agg(
    txn_count=("transaction_id", "count"),
    avg_ticket=("amount_rub", "mean"),
    total_spend=("amount_rub", "sum"),
    std_ticket=("amount_rub", "std"),
    weekend_share=("is_weekend", "mean"),
    evening_share=("is_evening", "mean"),
    delivery_share=("delivery_flag", "mean"),
    merchant_0_share=("merchant_0", "mean"),
    merchant_1_share=("merchant_1", "mean"),
    merchant_2_share=("merchant_2", "mean"),
    merchant_3_share=("merchant_3", "mean"),
    days_active=("day_offset", "nunique"),
    hour_mode=("hour", lambda x: x.mode().iloc[0] if not x.mode().empty else 12),
    first_day=("day_offset", "min"),
    last_day=("day_offset", "max"),
).reset_index()

# Период активности в днях
agg["active_period_days"] = agg["last_day"] - agg["first_day"]

# Частота: транзакций в неделю
agg["txn_per_week"] = agg["txn_count"] / (agg["active_period_days"] / 7 + 1)

# Заполняем NaN (если 1 транзакция — std=0)
agg["std_ticket"] = agg["std_ticket"].fillna(0)

# ========== ОБЪЕДИНЕНИЕ С USERS И LABELS ==========
df = users.merge(agg, on="user_id", how="inner")
df = df.merge(labels, on="user_id", how="inner")

# ========== X и Y ==========
feature_cols = [
    "age", "gender", "city_id", "income_rub", "family_code",
    "txn_count", "avg_ticket", "total_spend", "std_ticket",
    "weekend_share", "evening_share", "delivery_share",
    "merchant_0_share", "merchant_1_share", "merchant_2_share", "merchant_3_share",
    "days_active", "hour_mode", "txn_per_week"
]

X = df[feature_cols].copy()
y_segment = df["segment"].values
y_return = df["will_return"].values

# ========== СОХРАНЕНИЕ ==========
df.to_csv("data/features_merged.csv", index=False)
print(f"Готово: features_merged.csv — {len(df)} строк, {len(feature_cols)} фичей")
print(f"X shape: {X.shape}")
print(f"Распределение segment: {dict(zip(*np.unique(y_segment, return_counts=True)))}")
print(f"will_return=1: {y_return.sum()} из {len(y_return)}")