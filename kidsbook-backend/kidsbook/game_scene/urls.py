from django.urls import path
from kidsbook.game_scene import views

urlpatterns = [
    # Get scene with conditions
    path('', views.scene_main),
    # Get a game scene
    path('<uuid:scene_id>/', views.scene_get),
]
