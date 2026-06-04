from django.urls import path
from .views import RankingView, UserRegistrationView

urlpatterns = [
    path("", RankingView.as_view(), name="ranking"),
]

register_urlpatterns = [
    path("register/", UserRegistrationView.as_view(), name="register"),
]
