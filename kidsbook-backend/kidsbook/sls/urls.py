from django.urls import path

from kidsbook.sls import views

urlpatterns = [
    # User logging from SLS platform
    path("login/", views.login)
]
