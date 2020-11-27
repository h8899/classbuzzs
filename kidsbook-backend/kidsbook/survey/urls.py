from django.urls import path
from kidsbook.survey import views

urlpatterns = [
    # Get all surveys of user or create a new survey
    path('', views.survey),

    # Update or Delete survey
    path('<uuid:survey_id>/', views.survey_update),

    # Get or Update survey's answer
    path('<uuid:survey_id>/user/<uuid:user_id>/', views.survey_answer),

    # Get / Delete all answers of a survey
    path('<uuid:survey_id>/answers/', views.get_delete_survey_answers)
]
