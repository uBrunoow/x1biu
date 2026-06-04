# ruff: noqa: F403, F405
from .base import *
from .base import env

DEBUG = True

ALLOWED_HOSTS = ["*"]
CORS_ALLOW_ALL_ORIGINS = True

MEDIA_URL = "http://localhost:8000/media/"

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Axes desabilitado em desenvolvimento
AXES_ENABLED = False

