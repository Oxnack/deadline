
# ReadmeTables.md

## Структура тестовых данных MVP «Супермаркеты»

Все таблицы в числовом формате. Ниже описание каждого столбца и кодировки.

---

## 1. users.csv — профили пользователей

50 строк.

| Столбец | Тип | Описание | Кодировка |
|---|---|---|---|
| user_id | int | Уникальный ID | 1–50 |
| age | int | Возраст, лет | 18–75 |
| gender | int | Пол | 0 = женский, 1 = мужской |
| city_id | int | Город | 0 = Москва, 1 = СПб, 2 = Казань, 3 = Новосибирск, 4 = Екатеринбург |
| income_rub | int | Среднемесячный доход | 20000–350000 |
| family_code | int | Семейное положение | 0 = один, 1 = пара, 2 = семья с детьми, 3 = с родителями |

---

## 2. transactions.csv — банковские транзакции

~600 строк.

| Столбец | Тип | Описание | Кодировка |
|---|---|---|---|
| transaction_id | int | Уникальный ID транзакции | 1–N |
| user_id | int | FK → users.user_id | 1–50 |
| day_offset | int | Дней от старта (01.10.2025) | 0–210 |
| hour | int | Час совершения покупки | 0–23 |
| amount_rub | float | Сумма в рублях | ~200–5000 |
| merchant_type | int | Тип магазина | 0 = эконом, 1 = средний, 2 = премиум, 3 = онлайн |
| delivery_flag | int | Онлайн-доставка или офлайн | 0 = офлайн, 1 = онлайн-доставка |

---

## 3. user_labels.csv — таргеты для обучения

50 строк.

| Столбец | Тип | Описание | Кодировка |
|---|---|---|---|
| user_id | int | FK → users.user_id | 1–50 |
| segment | int | Пользовательский сегмент | 0 = family, 1 = budget, 2 = gourmet_solo, 3 = busy_pro, 4 = traditional |
| will_return | int | Совершил повторный заказ | 0 = не вернулся, 1 = вернулся |

---

## Связи между таблицами

```
users.user_id ────< transactions.user_id
users.user_id ────< user_labels.user_id
```


## 4. features_merged.csv — агрегированные фичи + таргеты

50 строк. Создаётся скриптом `aggregate_features.py`.

| Столбец | Тип | Описание | Источник |
|---|---|---|---|
| user_id | int | FK → users.user_id | users |
| age | int | Возраст | users |
| gender | int | Пол (0=ж, 1=м) | users |
| city_id | int | Город (0–4) | users |
| income_rub | int | Доход | users |
| family_code | int | Семейное положение (0–3) | users |
| txn_count | int | Число транзакций | agg transactions |
| avg_ticket | float | Средний чек, руб | agg transactions |
| total_spend | float | Общие траты, руб | agg transactions |
| std_ticket | float | Разброс чека (0 если 1 транзакция) | agg transactions |
| weekend_share | float | Доля транзакций в выходные (0–1) | agg transactions |
| evening_share | float | Доля транзакций вечером 17–22 (0–1) | agg transactions |
| delivery_share | float | Доля онлайн-доставок (0–1) | agg transactions |
| merchant_0_share | float | Доля эконом-магазинов | agg transactions |
| merchant_1_share | float | Доля средних магазинов | agg transactions |
| merchant_2_share | float | Доля премиум-магазинов | agg transactions |
| merchant_3_share | float | Доля онлайн-магазинов | agg transactions |
| days_active | int | Число уникальных дней с транзакциями | agg transactions |
| hour_mode | int | Самый частый час покупок (0–23) | agg transactions |
| txn_per_week | float | Среднее число транзакций в неделю | agg transactions |
| segment | int | Таргет: сегмент (0–4) | user_labels |
| will_return | int | Таргет: возврат (0/1) | user_labels |

## Как использовать

1. Агрегировать transactions до уровня пользователя (средний чек, доля merchant_type, доля delivery_flag, доля выходных по day_offset % 7, мода часа).
2. Соединить агрегаты с users по user_id → получить X.
3. Соединить с user_labels по user_id → получить Y (segment для классификации, will_return для бинарки).
4. Обучить LightGBM.
