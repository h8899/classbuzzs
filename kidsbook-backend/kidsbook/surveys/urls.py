from django.urls import path
from kidsbook.surveys import views

urlpatterns = [
    # Get all surveys from all groups the user is in
    path('', views.surveys),
]
