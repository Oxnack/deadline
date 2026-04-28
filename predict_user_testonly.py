"""
predict_user.py
Пример: python predict_user.py
Загружает обученные модели и предсказывает сегмент + возврат
для одного тестового пользователя.
"""

import pandas as pd
import numpy as np
import joblib

# ========== ЗАГРУЗКА МОДЕЛЕЙ ==========
model_segment = joblib.load("models/segment_classifier.lgb")
model_return = joblib.load("models/return_classifier.lgb")

SEGMENTS = ["family", "budget", "gourmet_solo", "busy_pro", "traditional"]

# ========== ТЕСТОВЫЙ ПОЛЬЗОВАТЕЛЬ ==========
# Вход: сырые данные о пользователе и агрегаты его транзакций
test_user = pd.DataFrame([{
    "age": 32,
    "gender": 0,
    "city_id": 0,
    "income_rub": 95000,
    "family_code": 2,
    "txn_count": 18,
    "avg_ticket": 1700,
    "total_spend": 30600,
    "std_ticket": 600,
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
}])

# ========== ПРЕДСКАЗАНИЕ ==========
seg_probs = model_segment.predict_proba(test_user)[0]
seg_idx = np.argmax(seg_probs)
ret_prob = model_return.predict_proba(test_user)[:, 1][0]

# ========== ВЫВОД ==========
print("=" * 40)
print(f"Сегмент: {SEGMENTS[seg_idx]} (уверенность {seg_probs[seg_idx]:.2%})")
for name, prob in zip(SEGMENTS, seg_probs):
    print(f"  {name:15s}: {prob:.2%}")
print(f"\nВероятность возврата: {ret_prob:.2%}")
print("=" * 40)