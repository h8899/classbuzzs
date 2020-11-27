from django.conf.urls import include
from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns

urlpatterns = [
    path('user/', include('kidsbook.user.urls')),
    path('group/', include('kidsbook.group.urls')),
    path('batch/', include('kidsbook.batch.urls')),
    path('users/', include('kidsbook.users.urls')),
    path('survey/', include('kidsbook.survey.urls')),
    path('surveys/', include('kidsbook.surveys.urls')),
    path('game/', include('kidsbook.game.urls')),
    path('scene/', include('kidsbook.game_scene.urls')),
    path('sls/', include('kidsbook.sls.urls')),
    path('', include('kidsbook.post.urls')),
    path('', include('kidsbook.notification.urls')),
]

urlpatterns = format_suffix_patterns(urlpatterns)
