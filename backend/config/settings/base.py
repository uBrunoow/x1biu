import os
from datetime import timedelta
from pathlib import Path

import environ
from django.core.management.utils import get_random_secret_key
from django.utils.translation import gettext_lazy as _

# -----------------------------------------
# General
# -----------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DJANGO_DEBUG=(bool, True),
    DJANGO_CORS_ALLOWED_ORIGINS=(list, []),
    DJANGO_CSRF_TRUSTED_ORIGINS=(list, []),
    DJANGO_SECRET_KEY=(str, get_random_secret_key()),
    DJANGO_DB_ENGINE=(str, "django.db.backends.postgresql"),
    DJANGO_DB_NAME=(str, "app"),
    DJANGO_DB_USER=(str, "app"),
    DJANGO_DB_PASSWORD=(str, ""),
    DJANGO_DB_HOST=(str, "localhost"),
    DJANGO_DB_PORT=(str, "5432"),
    REDIS_URL=(str, "redis://127.0.0.1:6379/1"),
    CELERY_BROKER_URL=(str, "redis://127.0.0.1:6379/0"),
    CELERY_TIMEZONE=(str, "America/Sao_Paulo"),
    DJANGO_DEFAULT_FILE_STORAGE=(str, "django.core.files.storage.FileSystemStorage"),
    DJANGO_STATICFILES_STORAGE=(
        str,
        "whitenoise.storage.CompressedManifestStaticFilesStorage",
    ),
    DJANGO_AWS_ACCESS_KEY_ID=(str, ""),
    DJANGO_AWS_SECRET_ACCESS_KEY=(str, ""),
    DJANGO_AWS_STORAGE_BUCKET_NAME=(str, ""),
    DJANGO_AWS_S3_SIGNATURE_NAME=(str, ""),
    DJANGO_AWS_S3_REGION_NAME=(str, ""),
)

env_file = BASE_DIR.parent / ".env"
if env_file.exists():
    environ.Env.read_env(str(env_file))

SECRET_KEY = env("DJANGO_SECRET_KEY")

# -----------------------------------------
# Logging
# -----------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {"format": "{levelname} {message}", "style": "{"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
    },
    "root": {"handlers": ["console"], "level": env("LOG_LEVEL", default="INFO")},
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": env("DJANGO_LOG_LEVEL", default="INFO"),
            "propagate": False,
        },
    },
}

ROOT_URLCONF = "config.urls"
ASGI_APPLICATION = "config.asgi.application"
WSGI_APPLICATION = "config.wsgi.application"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# -----------------------------------------
# Domains
# -----------------------------------------
CORS_ALLOWED_ORIGINS = env("DJANGO_CORS_ALLOWED_ORIGINS")
CSRF_TRUSTED_ORIGINS = env("DJANGO_CSRF_TRUSTED_ORIGINS")
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=[])

# -----------------------------------------
# Apps
# -----------------------------------------
INSTALLED_APPS = [
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    "unfold.contrib.inlines",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "django_extensions",
    "django_filters",
    "django_rest_passwordreset",
    "storages",
    "channels",
    "corsheaders",
    "simple_history",
    "drf_spectacular",
    "django_celery_beat",
    "axes",
    "cuser",
    "apps",
    "apps.management",
    "apps.songs",
    "apps.matches",
]

# -----------------------------------------
# Middleware
# -----------------------------------------
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "simple_history.middleware.HistoryRequestMiddleware",
    "axes.middleware.AxesMiddleware",
]

# -----------------------------------------
# Templates
# -----------------------------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# -----------------------------------------
# Databases
# -----------------------------------------
DATABASES = {
    "default": {
        "ENGINE": env("DJANGO_DB_ENGINE"),
        "NAME": env("DJANGO_DB_NAME"),
        "USER": env("DJANGO_DB_USER"),
        "PASSWORD": env("DJANGO_DB_PASSWORD"),
        "HOST": env("DJANGO_DB_HOST"),
        "PORT": env("DJANGO_DB_PORT"),
    }
}

# -----------------------------------------
# Caches
# -----------------------------------------
CACHES = {"default": env.cache("REDIS_URL", default="redis://127.0.0.1:6379/1")}
CACHES["default"]["BACKEND"] = "django_redis.cache.RedisCache"
CACHES["default"]["OPTIONS"] = {
    "CLIENT_CLASS": "django_redis.client.DefaultClient",
}

# -----------------------------------------
# Channels
# -----------------------------------------
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.pubsub.RedisPubSubChannelLayer",
        "CONFIG": {
            "hosts": [env("REDIS_URL", default="redis://127.0.0.1:6379/1")],
        },
    },
}

# -----------------------------------------
# Authentication
# -----------------------------------------
AUTH_USER_MODEL = "management.User"

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

DJANGO_REST_MULTITOKENAUTH_RESET_TOKEN_EXPIRY_TIME = 24
DJANGO_REST_PASSWORDRESET_TOKEN_CONFIG = {
    "CLASS": "django_rest_passwordreset.tokens.RandomStringTokenGenerator",
    "OPTIONS": {"min_length": 20, "max_length": 30},
}

# -----------------------------------------
# Brute Force Protection (Axes)
# -----------------------------------------
AUTHENTICATION_BACKENDS = [
    "axes.backends.AxesBackend",
    "django.contrib.auth.backends.ModelBackend",
]
AXES_FAILURE_LIMIT = env.int("AXES_FAILURE_LIMIT", default=5)
AXES_COOLOFF_TIME = timedelta(hours=1)
AXES_RESET_ON_SUCCESS = True
AXES_LOCKOUT_WAIT_RESPONSE = True

# -----------------------------------------
# Rest Framework
# -----------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/minute",
        "user": "1000/minute",
    },
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# -----------------------------------------
# Swagger
# -----------------------------------------
SPECTACULAR_SETTINGS = {
    "TITLE": "API",
    "DESCRIPTION": "Documentação da API",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# -----------------------------------------
# JWT
# -----------------------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=7),
}

# -----------------------------------------
# Static
# -----------------------------------------
STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
MEDIA_ROOT = BASE_DIR / "media"
MEDIA_URL = "/media/"

# -----------------------------------------
# AWS
# -----------------------------------------
AWS_ACCESS_KEY_ID = env("DJANGO_AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = env("DJANGO_AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = env("DJANGO_AWS_STORAGE_BUCKET_NAME")
AWS_S3_SIGNATURE_NAME = env("DJANGO_AWS_S3_SIGNATURE_NAME")
AWS_S3_REGION_NAME = env("DJANGO_AWS_S3_REGION_NAME")
AWS_S3_FILE_OVERWRITE = env.bool("DJANGO_AWS_S3_FILE_OVERWRITE", default=False)
AWS_DEFAULT_ACL = None
AWS_S3_VERIFY = env.bool("DJANGO_AWS_S3_VERIFY", default=False)
AWS_S3_CONNECTION_TIMEOUT = 60
AWS_S3_READ_TIMEOUT = 120

# -----------------------------------------
# Storages
# -----------------------------------------
STORAGES = {
    "default": {"BACKEND": env("DJANGO_DEFAULT_FILE_STORAGE")},
    "staticfiles": {"BACKEND": env("DJANGO_STATICFILES_STORAGE")},
}

# -----------------------------------------
# Localization
# -----------------------------------------
LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

LANGUAGES = (
    ("en", _("English")),
    ("es", _("Spanish")),
    ("pt-br", _("Portuguese")),
)

# -----------------------------------------
# Celery Worker
# -----------------------------------------
CELERY_BROKER_URL = env("CELERY_BROKER_URL")
CELERY_TIMEZONE = env("CELERY_TIMEZONE")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"

# -----------------------------------------
# Celery Beat
# -----------------------------------------
CELERY_BEAT_SCHEDULE = {
    "process_matchmaking": {
        "task": "apps.matches.tasks.process_matchmaking",
        "schedule": timedelta(seconds=5),
    },
}
