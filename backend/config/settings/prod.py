# ruff: noqa: F403, F405
from .base import *
from .base import BASE_DIR, STORAGES, env, os

DEBUG = False

# -----------------------------------------
# Security Hardening
# -----------------------------------------
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=[])

SECURE_SSL_REDIRECT            = env.bool("SECURE_SSL_REDIRECT",   default=True)
SESSION_COOKIE_SECURE          = env.bool("SESSION_COOKIE_SECURE",  default=True)
CSRF_COOKIE_SECURE             = env.bool("CSRF_COOKIE_SECURE",     default=True)
SECURE_HSTS_SECONDS            = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD            = True
SECURE_PROXY_SSL_HEADER        = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_REFERRER_POLICY         = "same-origin"
SECURE_BROWSER_XSS_FILTER      = True
SECURE_CONTENT_TYPE_NOSNIFF    = True

# Static files — Whitenoise com compressão e cache
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STORAGES["staticfiles"]["BACKEND"] = (
    "whitenoise.storage.CompressedManifestStaticFilesStorage"
)
