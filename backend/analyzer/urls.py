from django.urls import path
from .views import TransactionClassifier

urlpatterns = [
    path('classify/', TransactionClassifier.as_view(), name='classify'),
]
