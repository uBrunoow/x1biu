# ruff: noqa: F403, F405
from corsheaders.defaults import default_headers

from .base import *

DEBUG = True

ALLOWED_HOSTS = ["*"]
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_HEADERS = list(default_headers) + ["ngrok-skip-browser-warning"]
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8000",
    "https://*.ngrok.io",
    "https://*.ngrok.dev",
    "https://*.ngrok-free.app",
    "https://*.ngrok-free.dev",
]
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

MEDIA_URL = "http://localhost:8000/media/"

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Axes desabilitado em desenvolvimento
AXES_ENABLED = False
