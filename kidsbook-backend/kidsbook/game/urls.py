from django.urls import path
from kidsbook.game import views

urlpatterns = [
    # Get all games created by user or Create a new game
    path('', views.game_main),
    # Get or Update or Delete a game
    path('<uuid:game_id>/', views.game_update),
    # Get or Update or Delete game's answer
    path('<uuid:game_id>/user/<uuid:user_id>/', views.game_answer),
    # Get / Delete all answers of a game
    path('<uuid:game_id>/answers/', views.get_delete_game_answers)
]
