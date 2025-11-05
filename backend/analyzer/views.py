from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import os
import joblib
from collections import Counter

# Load model and vectorizer once
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model = joblib.load(os.path.join(BASE_DIR, "training", "transaction_model.pkl"))
vectorizer = joblib.load(os.path.join(BASE_DIR, "training", "vectorizer.pkl"))

# Classify a whole description
def classify_by_token_scoring(description):
    # Vectorize the entire description instead of individual tokens
    X = vectorizer.transform([description.lower()])
    
    # Predict the category for the full description
    prediction = model.predict(X)[0]  # Get the predicted category for the full description
    
    return prediction

# Django API View
class TransactionClassifier(APIView):
    def post(self, request):
        transactions = request.data.get("transactions", [])
        
        if not transactions:
            return Response({"error": "No transactions provided."}, status=status.HTTP_400_BAD_REQUEST)

        for t in transactions:
            desc = t.get("description", "")
            t["predicted_category"] = classify_by_token_scoring(desc)  # Classify the full description

        return Response({"classified": transactions}, status=status.HTTP_200_OK)
