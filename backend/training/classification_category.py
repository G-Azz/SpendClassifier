import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import FeatureUnion
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.svm import SVC
import joblib
import os

# Setup
BASE_DIR = os.path.dirname(__file__)
data_path = os.path.join(BASE_DIR, "training_classifciation_category_dataset.xlsx")
output_path = os.path.join(BASE_DIR, "svc_results.txt")

# Load dataset
df = pd.read_excel(data_path)
assert "description" in df.columns, "Missing 'description' column"
assert "category" in df.columns, "Missing 'category' column"

X = df["description"].astype(str)
y = df["category"].astype(str)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# TF-IDF Vectorization with custom stop words
custom_stop_words = list(ENGLISH_STOP_WORDS.union({'bought','paid','bill','rented','purchased','ordered','got','refund'}))
# Combine char and word TF-IDF features
char_vectorizer = TfidfVectorizer(analyzer='char_wb', ngram_range=(3, 5))
word_vectorizer = TfidfVectorizer( ngram_range=(1, 2), stop_words=custom_stop_words)

vectorizer = FeatureUnion([
    ("char", char_vectorizer),
    ("word", word_vectorizer)
])


X_train_vect = vectorizer.fit_transform(X_train)
X_test_vect = vectorizer.transform(X_test)

# SVC — customize parameters as needed
model = SVC(C=10,probability=True, kernel='linear', gamma='scale', class_weight=None)


model.fit(X_train_vect, y_train)
preds = model.predict(X_test_vect)
acc = accuracy_score(y_test, preds)

# Evaluation reporting
report_lines = []
report_lines.append(f"\n{'='*60}\nModel: SVC")
report_lines.append(f"Params: C=1, kernel='linear', gamma='scale', class_weight=None")
report_lines.append(f"Accuracy: {acc:.4f}")
report_lines.append("Classification Report:\n" + classification_report(y_test, preds))
report_lines.append("Confusion Matrix:\n" + str(confusion_matrix(y_test, preds)))

# Save model and vectorizer
joblib.dump(model, os.path.join(BASE_DIR, "transaction_model.pkl"))
joblib.dump(vectorizer, os.path.join(BASE_DIR, "vectorizer.pkl"))

# Save results
with open(output_path, "w", encoding="utf-8") as f:
    f.write("\n".join(report_lines))
    f.write(f"\n\n✅ SVC Model accuracy: {acc:.4f}\n")

print("✅ SVC training and evaluation complete.")
print(f"📄 Evaluation results saved to: {output_path}")
print(f"🏆 Accuracy: {acc:.4f}")
