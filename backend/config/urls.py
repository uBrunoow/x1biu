from django.conf import settings
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView,
)
from drf_spectacular.views import SpectacularAPIView
from scalar import urlpatterns_scalar
from apps.management.urls import register_urlpatterns

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    *urlpatterns_scalar,
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", TokenBlacklistView.as_view(), name="token_blacklist"),
    path("auth/", include(register_urlpatterns)),
    path("queue/", include("apps.matches.urls_queue")),
    path("matches/", include("apps.matches.urls_matches")),
    path("ranking/", include("apps.management.urls")),
    path("songs/", include("apps.songs.urls")),
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]
