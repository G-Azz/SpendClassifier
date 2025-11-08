# SpendClassifier – Transaction Category Classifier

**Transaction text in, spending category out.**  
A compact, production-ready classifier that labels bank transaction descriptions into budgeting categories (e.g., Food, Transport, Utilities).

> This repo is focused on the ML core. A lightweight Django REST API serves predictions; a minimal frontend consumes them for expense grouping and charts.

---

## 🧠 Model summary

### Model: SVC

- **Algorithm**: Support Vector Classifier (Linear kernel)
- **Params**: `C=1`, `kernel='linear'`, `gamma='scale'`, `class_weight=None`
- **Accuracy**: **0.9750**

#### Classification report

```text
               precision    recall  f1-score   support

Entertainment       0.97      0.94      0.95        33
         Food       1.00      1.00      1.00        48
        Other       0.97      0.97      0.97        37
    Transport       0.97      0.97      0.97        38
    Utilities       0.96      0.98      0.97        44

     accuracy                           0.97       200
    macro avg       0.97      0.97      0.97       200
 weighted avg       0.98      0.97      0.97       200
```

#### Confusion matrix

```text
[[31  0  0  1  1]
 [ 0 48  0  0  0]
 [ 1  0 36  0  0]
 [ 0  0  0 37  1]
 [ 0  0  1  0 43]]
```

✅ **SVC model accuracy**: `0.9750`  
✅ **Macro F1**: `0.97`  
✅ **Weighted F1**: `0.97`

> Scores are parsed from saved reports in `Budji-AI-finance-companion-main/backend/training` (e.g., `svc_results.txt`). Regenerate by retraining.

---

## ✨ What it does

- Takes raw transaction **descriptions** (e.g., `"UBER *EATS 10-31"`)
- Converts them to features with **TF–IDF** (word and character n-grams)
- Predicts a single **category** with a linear classifier
- Serves predictions via **`POST /api/classify/`**

Typical categories:

- `Food`
- `Transport`
- `Utilities`
- `Entertainment`
- `Other`

---

## 🧠 Model at a glance

- **Features**: `TfidfVectorizer`
  - English stopwords
  - Word n-grams (e.g. 1–2)
  - Character n-grams (e.g. 3–5)
- **Algorithms tried**:
  - Logistic Regression
  - Linear SVM (LinearSVC)
- **Artifacts**:
  - `Budji-AI-finance-companion-main/backend/training/transaction_model.pkl`
  - `Budji-AI-finance-companion-main/backend/training/vectorizer.pkl`
- **Evaluation**:
  - sklearn classification report
  - Confusion matrix
  - Accuracy, macro F1, weighted F1

---

## 📦 Data

- Expected training file:  
  `Budji-AI-finance-companion-main/backend/training/training_classification_category_dataset.xlsx`

- Columns:
  - `description` — free-text vendor/transaction memo
  - `category` — one of the target budget categories

- Typical label set:
  - `Food`, `Transport`, `Utilities`, `Entertainment`, `Other`  
    (can be customized per use case)

---

## 🏗️ Training pipeline

1. **Load** labeled data from the Excel sheet.
2. **Split** into train/validation using **stratified** splitting (or K-fold CV).
3. **Vectorize** text using TF–IDF:
   - Word n-grams (e.g. 1–2)
   - Character n-grams (e.g. 3–5)
4. **Train & tune**:
   - Logistic Regression (`C` on a log grid)
   - LinearSVC (`C` sweep; `hinge` vs `squared_hinge`)
5. **Evaluate**:
   - Classification report (per-class metrics)
   - Accuracy, macro F1, weighted F1
   - Confusion matrix
6. **Persist**:
   - Best `transaction_model.pkl`
   - Corresponding `vectorizer.pkl`
7. **Version** (recommended):
   - Save `metrics.json`
   - Maintain a timestamped “model card” for each trained version

### Re-train locally

```bash
cd backend
python training/classification_category.py   # adjust if you use an improved script
```

Artifacts and reports will be written to:

- `Budji-AI-finance-companion-main/backend/training/`

---

## 🚀 Serving (Backend)

- **Framework**: Django + Django REST Framework
- **Main endpoint**: `POST /api/classify/`

### Request

```json
{
  "transactions": [
    {"description": "Paid for Disney+"},
    {"description": "Uber trip"}
  ]
}
```

### Response

```json
{
  "predictions": [
    {"predicted_category": "Entertainment"},
    {"predicted_category": "Transport"}
  ]
}
```

**Notes**

- The model and vectorizer are loaded once at app startup for low latency.
- When updating the model artifacts, use safe Git practices (e.g. `--force-with-lease` if you must force-push).

---

## 🖥️ Frontend (brief)

- Minimal UI to:
  - Upload / paste transaction descriptions
  - Call `/api/classify/`
  - Visualize per-category totals (charts/tables)
- Can optionally display:
  - Model confidence (if you expose calibrated probabilities)

---

## 🔧 Configuration

- **Runtime**:
  - Python ≥ 3.10
- **Core dependencies**:
  - `scikit-learn`
  - `pandas`
  - `joblib`
- **Optional**:
  - Environment variables for:
    - API host/port
    - CORS settings
  - Dockerfile / docker-compose for one-shot dev setup

---

## 📈 Roadmap (ML)

- Stratified **K-fold cross-validation** with confidence intervals
- **Calibrated** probabilities (for UI confidence bars)
- **Drift detection** on recent vs. historical data
- Label **expansion**:
  - More granular categories (e.g. Groceries vs. Restaurants)
- Hard-negative mining:
  - Ambiguous vendors (e.g. `"Uber Eats"` for Food vs. Transport)

---

## ⚠️ Limitations

- Pure text model:
  - Does **not** use amount, date, or other numeric/contextual fields.
- Vendor spelling variants and typos:
  - Partially handled via character n-grams, but not perfect.
- Category schema:
  - Budget categories vary by user/region; you may need to relabel or extend.
