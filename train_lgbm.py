"""
train_lgbm.py
Обучает две LightGBM-модели:
1. Классификатор сегментов (multiclass)
2. Классификатор возврата (binary)
Сохраняет модели и выводит метрики.
Запуск: python train_lgbm.py
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report
import lightgbm as lgb
import joblib
import os

# ========== ЗАГРУЗКА ==========
df = pd.read_csv("data/features_merged.csv")

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

# ========== СПЛИТ ==========
X_train, X_test, y_seg_train, y_seg_test, y_ret_train, y_ret_test = train_test_split(
    X, y_segment, y_return, test_size=0.25, random_state=42, stratify=y_segment
)

print(f"Train: {len(X_train)}, Test: {len(X_test)}")
print(f"Segment distr in test: {dict(zip(*np.unique(y_seg_test, return_counts=True)))}")
print(f"Return=1 in test: {y_ret_test.sum()} / {len(y_ret_test)}")

os.makedirs("models", exist_ok=True)

# ========== МОДЕЛЬ 1: СЕГМЕНТЫ ==========
print("\n" + "="*50)
print("Модель 1: Классификация сегментов")
print("="*50)

model_segment = lgb.LGBMClassifier(
    objective="multiclass",
    num_class=5,
    metric="multi_logloss",
    num_leaves=15,
    learning_rate=0.05,
    n_estimators=200,
    min_data_in_leaf=5,
    verbose=-1,
    random_state=42
)

model_segment.fit(
    X_train, y_seg_train,
    eval_set=[(X_test, y_seg_test)],
    eval_metric="multi_logloss"
)

y_seg_pred = model_segment.predict(X_test)
y_seg_proba = model_segment.predict_proba(X_test)

acc_seg = accuracy_score(y_seg_test, y_seg_pred)
print(f"Accuracy: {acc_seg:.3f}")
print("\nClassification report:")
print(classification_report(y_seg_test, y_seg_pred, target_names=["family","budget","gourmet_solo","busy_pro","traditional"]))

joblib.dump(model_segment, "models/segment_classifier.lgb")
print("Сохранено: models/segment_classifier.lgb")

# ========== МОДЕЛЬ 2: ВОЗВРАТ ==========
print("\n" + "="*50)
print("Модель 2: Предсказание возврата (will_return)")
print("="*50)

# Веса для баланса классов
scale_pos_weight = (y_ret_train == 0).sum() / (y_ret_train == 1).sum()

model_return = lgb.LGBMClassifier(
    objective="binary",
    metric="auc",
    num_leaves=15,
    learning_rate=0.05,
    n_estimators=200,
    min_data_in_leaf=5,
    scale_pos_weight=scale_pos_weight,
    verbose=-1,
    random_state=42
)

model_return.fit(
    X_train, y_ret_train,
    eval_set=[(X_test, y_ret_test)],
    eval_metric="auc"
)

y_ret_pred = model_return.predict(X_test)
y_ret_proba = model_return.predict_proba(X_test)[:, 1]

acc_ret = accuracy_score(y_ret_test, y_ret_pred)
auc_ret = roc_auc_score(y_ret_test, y_ret_proba)

print(f"Accuracy: {acc_ret:.3f}")
print(f"ROC-AUC:  {auc_ret:.3f}")
print("\nClassification report:")
print(classification_report(y_ret_test, y_ret_pred, target_names=["не вернётся", "вернётся"]))

joblib.dump(model_return, "models/return_classifier.lgb")
print("Сохранено: models/return_classifier.lgb")

# ========== ВАЖНОСТЬ ФИЧЕЙ ==========
print("\n" + "="*50)
print("Топ-10 фичей для модели СЕГМЕНТОВ:")
importance_seg = pd.DataFrame({
    "feature": feature_cols,
    "importance": model_segment.feature_importances_
}).sort_values("importance", ascending=False)
print(importance_seg.head(10).to_string(index=False))

print("\nТоп-10 фичей для модели ВОЗВРАТА:")
importance_ret = pd.DataFrame({
    "feature": feature_cols,
    "importance": model_return.feature_importances_
}).sort_values("importance", ascending=False)
print(importance_ret.head(10).to_string(index=False))

# ========== ПРИМЕР ИНФЕРЕНСА ==========
print("\n" + "="*50)
print("Пример predict_proba для одного пользователя из теста:")
sample = X_test.iloc[[0]]
seg_probs = model_segment.predict_proba(sample)[0]
ret_prob = model_return.predict_proba(sample)[:, 1][0]

seg_names = ["family", "budget", "gourmet_solo", "busy_pro", "traditional"]
print(f"  Сегменты: {dict(zip(seg_names, seg_probs.round(3)))}")
print(f"  Главный сегмент: {seg_names[np.argmax(seg_probs)]}")
print(f"  Вероятность возврата: {ret_prob:.3f}")

print("\nГОТОВО.")