# SpendSense

**Transaction text in, spending category out.**  
A compact, production-ready classifier that labels bank transaction descriptions into budgeting categories (e.g., Food, Transport, Utilities).

> This repo is focused on the ML core. A lightweight Django REST API serves predictions; a minimal frontend consumes them for expense grouping and charts.

---

## ✨ What it does

- Takes raw transaction **descriptions** (e.g., “UBER *EATS 10-31”)
- Converts them to features with **TF–IDF** (word/character n‑grams)
- Predicts a single **category** with a linear classifier
- Serves predictions via **`POST /api/classify/`**

## 🧠 Model at a glance

- **Features**: `TfidfVectorizer` (English stopwords, word & char n‑grams)
- **Algorithms** tried: Logistic Regression, Linear SVM
- **Artifacts**: `Budji-AI-finance-companion-main/backend/training/transaction_model.pkl`, `Budji-AI-finance-companion-main/backend/training/vectorizer.pkl`
- **Evaluation**: sklearn classification report + confusion matrix

- **Model evaluated**: `svc`
- **Accuracy**: N/A
- **Macro F1**: 0.97
- **Weighted F1**: 0.97

### Per‑class scores

|Class|Precision|Recall|F1|Support|
|---|---|---|---|---|
|Entertainment|0.970|0.940|0.950|33|
|Food|1.000|1.000|1.000|48|
|Other|0.970|0.970|0.970|37|
|Transport|0.970|0.970|0.970|38|
|Utilities|0.960|0.980|0.970|44|
|macro avg|0.970|0.970|0.970|200|
|weighted avg|0.980|0.970|0.970|200|

> Scores are parsed from saved reports in `Budji-AI-finance-companion-main/backend/training` (e.g., `svc_results.txt`). Regenerate by retraining.

---

## 📦 Data

- Expected training file: `Budji-AI-finance-companion-main/backend/training/training_classifciation_category_dataset.xlsx`
- Columns:
  - `description` — free‑text vendor/transaction memo
  - `category` — one of the target budget categories
- Typical label set: `Food`, `Transport`, `Utilities`, `Entertainment`, `Other` (customize as needed)

---

## 🏗️ Training pipeline

1. **Load** labeled data from the Excel sheet
2. **Split** with **Stratified** train/validation (or K‑fold CV)
3. **Vectorize**: TF–IDF (word 1–2grams + char 3–5grams recommended)
4. **Train & tune**:
   - Logistic Regression (`C` on a log grid)
   - LinearSVC (`C` sweep; hinge vs squared_hinge)
5. **Evaluate**: classification report (per‑class), macro/weighted F1, accuracy
6. **Persist**: best `transaction_model.pkl` and `vectorizer.pkl`
7. **Version** (recommended): save `metrics.json` and a timestamped model card

### Re‑train locally

```bash
cd backend
python training/classification_category.py   # adjust if you use the improved script
```

Artifacts and reports will be written to `Budji-AI-finance-companion-main/backend/training/`.

---

## 🚀 Serving (Backend)

- **Framework**: Django + Django REST Framework
- **Endpoint**: `POST /api/classify/`
- **Body**:
  ```json
  {"transactions": [{"description": "Paid for Disney+"}, {"description": "Uber trip"}]}
  ```
- **Response**:
  ```json
  {"predictions": [{"predicted_category": "Entertainment"}, {"predicted_category": "Transport"}]}
  ```

**Notes**
- Models and vectorizer are loaded once on startup for low latency
- Prefer `--force-with-lease` when pushing model updates (Git safety)

---

## 🖥️ Frontend (brief)

- Minimal UI to upload / paste transactions and visualize group totals
- Consumes `/api/classify/` and renders category breakdowns (charts/tables)
- Shows confidence (optional, if you use calibrated probabilities)

---

## 🔧 Configuration

- Python ≥ 3.10, `scikit-learn`, `pandas`, `joblib`
- Environment variables (if any) for API host/port, CORS, etc.
- Dockerfile/compose (optional) for one‑shot dev setup

---

## 📈 Roadmap (ML)

- Stratified **K‑fold CV** + confidence intervals
- **Calibrated** probabilities (for UI confidence bars)
- **Drift** checks on recent, time‑split data
- Label **expansion** (more granular categories)
- Hard‑negative set (e.g., “Uber Eats” ambiguity)

---

## ⚠️ Limitations

- Pure text model; no numeric context (amount/date)
- Vendor variants & typos partially mitigated via char n‑grams
- Category schemas vary by user/region—relabel as needed

---

## 📝 License & attribution

MIT (or your preferred license).  
Based on a classic, transparent NLP pipeline (TF–IDF + linear model) for speed, simplicity, and strong baselines.
