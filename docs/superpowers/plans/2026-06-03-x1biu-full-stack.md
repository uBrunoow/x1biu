---
title: x1biu Full-Stack Implementation Plan
tags:
  - plano
  - backend
  - frontend
  - websocket
  - matchmaking
---

# x1biu Full-Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o app completo de batalha 1v1 de assobios — backend Django com WebSocket + Celery, e frontend Next.js com detecção de pitch via ml5.js.

**Architecture:** Backend Django ASGI com Django Channels para WebSocket. Celery Beat dispara [[backend/crons#process_matchmaking|process_matchmaking]] a cada 5s para parear jogadores da [[backend/entidades#QueueEntry|fila]]. Frontend Next.js com ml5.js capturando [[glossario#pitch|pitch]] do microfone e enviando ao servidor em tempo real via WebSocket.

**Tech Stack:**

- Backend: Django 5.2, DRF, Django Channels 4, Celery 5.6, PostgreSQL, Redis, SimpleJWT, django-username-email, django-celery-beat
- Frontend: Next.js 16.1.6, React 19, TypeScript, Tailwind 4, shadcn/ui (base-ui), ml5.js, TanStack React Query 5, Axios, Zod, Kubb 4.37.9

---

## Contexto crítico

### JWT WebSocket Auth

`AuthMiddlewareStack` do Channels usa session/cookies, incompatível com JWT. Usamos middleware customizado que lê token do query param: `ws://localhost:8000/ws/queue/?token=<jwt>`.

### Match start trigger

Quando ambos os jogadores conectam em `ws/match/{id}/`, o servidor inicia a [[backend/entidades#Match|Match]]. Rastreamos o contador via Django cache (Redis): chave `match_{id}_connected`, incrementada no connect, decrementada no disconnect.

### Fórmula de pontuação

Ver [[backend/services#ScoringService|ScoringService]]:

```
cents = |1200 * log2(player_hz / reference_hz)|
pontos_por_frame = max(0, round(100 - cents))   # 0 se cents >= 100
```

### Estrutura de apps Django

```
backend/apps/
├── management/   # User (AbstractCUser + nickname + wins/losses)
├── songs/        # Song (áudio + pitch_reference JSON)
└── matches/      # QueueEntry, Match, MatchParticipant + services + consumers
```

---

## Task 1: Backend — Dependências e BaseModel

**Files:**
- Modify: `backend/pyproject.toml`
- Create: `backend/config/utils/__init__.py`
- Create: `backend/config/utils/models.py`
- Modify: `backend/config/settings/base.py`

- [ ] **Step 1.1: Adicionar pacotes faltando ao pyproject.toml**

```toml
# backend/pyproject.toml — adicionar em dependencies:
    "django-username-email>=2.5.5",
    "django-celery-beat>=2.7.0",
    "uvicorn>=0.34.0",
```

O bloco `dependencies` completo fica:

```toml
[project]
name = "backend"
version = "0.1.0"
description = "Add your description here"
requires-python = ">=3.13"
dependencies = [
    "celery>=5.6.2",
    "channels-redis>=4.3.0",
    "channels[daphne]>=4.3.2",
    "django>=5.2.1",
    "django-axes>=8.3.1",
    "django-celery-beat>=2.7.0",
    "django-cors-headers>=4.9.0",
    "django-environ>=0.13.0",
    "django-extensions>=4.1",
    "django-filter>=25.2",
    "django-redis>=6.0.0",
    "django-rest-passwordreset>=1.5.0",
    "django-simple-history>=3.11.0",
    "django-storages>=1.14.6",
    "django-unfold>=0.40.0",
    "django-username-email>=2.5.5",
    "djangorestframework>=3.16.1",
    "djangorestframework-simplejwt>=5.5.1",
    "drf-spectacular>=0.29.0",
    "pre-commit>=4.5.1",
    "psycopg[binary]>=3.3.3",
    "redis>=7.2.0",
    "uvicorn>=0.34.0",
    "whitenoise>=6.11.0",
]
```

- [ ] **Step 1.2: Instalar dependências**

```bash
cd backend && uv sync
```

Expected: resolve e instalar sem erros. Deve aparecer `django-username-email`, `django-celery-beat`, `uvicorn` na saída.

- [ ] **Step 1.3: Criar config/utils/__init__.py e models.py**

```python
# backend/config/utils/__init__.py
```

```python
# backend/config/utils/models.py
from django.db import models


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
```

- [ ] **Step 1.4: Atualizar INSTALLED_APPS e AUTH_USER_MODEL em base.py**

Localizar o bloco `INSTALLED_APPS` em `backend/config/settings/base.py` e substituir:

```python
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
```

Substituir `AUTH_USER_MODEL = "auth.User"` por:

```python
AUTH_USER_MODEL = "management.User"
```

Adicionar `CELERY_BEAT_SCHEDULE` no final do arquivo (substituir o dict vazio):

```python
from datetime import timedelta

CELERY_BEAT_SCHEDULE = {
    "process_matchmaking": {
        "task": "apps.matches.tasks.process_matchmaking",
        "schedule": timedelta(seconds=5),
    },
}
```

- [ ] **Step 1.5: Adicionar auth urls e spectacular ao config/urls.py**

```python
# backend/config/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView,
)
from drf_spectacular.views import SpectacularAPIView
from scalar import urlpatterns_scalar

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    *urlpatterns_scalar,
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", TokenBlacklistView.as_view(), name="token_blacklist"),
    path("queue/", include("apps.matches.urls_queue")),
    path("matches/", include("apps.matches.urls_matches")),
    path("ranking/", include("apps.management.urls")),
    path("songs/", include("apps.songs.urls")),
]
```

- [ ] **Step 1.6: Commit**

```bash
cd /home/bruno/www/universe/x1biu
git add backend/pyproject.toml backend/config/utils/ backend/config/settings/base.py backend/config/urls.py
git commit -m "feat: add BaseModel, update settings for management app, add celery-beat + uvicorn deps"
```

---

## Task 2: apps/management — [[backend/entidades#User (Player)|User model]]

**Files:**

- Create: `backend/apps/management/__init__.py`
- Create: `backend/apps/management/apps.py`
- Create: `backend/apps/management/models.py`
- Create: `backend/apps/management/admin.py`
- Create: `backend/apps/management/serializers.py`
- Create: `backend/apps/management/views.py`
- Create: `backend/apps/management/urls.py`
- Create: `backend/apps/management/tests/__init__.py`
- Create: `backend/apps/management/tests/test_models.py`
- Create: `backend/apps/management/tests/test_api.py`

- [ ] **Step 2.1: Criar estrutura do app management**

```bash
mkdir -p backend/apps/management/tests
touch backend/apps/management/__init__.py
touch backend/apps/management/tests/__init__.py
```

- [ ] **Step 2.2: Criar apps.py**

```python
# backend/apps/management/apps.py
from django.apps import AppConfig


class ManagementConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.management"
```

- [ ] **Step 2.3: Escrever testes para o User model (TDD)**

```python
# backend/apps/management/tests/test_models.py
import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
class TestUserModel:
    def test_create_user_with_email(self):
        user = User.objects.create_user(
            email="player@test.com",
            password="pass123",
            nickname="player1",
        )
        assert user.email == "player@test.com"
        assert user.nickname == "player1"
        assert user.wins == 0
        assert user.losses == 0

    def test_winrate_no_games(self):
        user = User(wins=0, losses=0)
        assert user.winrate == 0

    def test_winrate_with_games(self):
        user = User(wins=3, losses=1)
        assert user.winrate == pytest.approx(0.75)

    def test_winrate_all_wins(self):
        user = User(wins=5, losses=0)
        assert user.winrate == 1.0

    def test_nickname_unique(self):
        User.objects.create_user(email="a@test.com", password="pass", nickname="batman")
        with pytest.raises(Exception):
            User.objects.create_user(email="b@test.com", password="pass", nickname="batman")
```

- [ ] **Step 2.4: Rodar testes para verificar que falham**

```bash
cd backend && uv run pytest apps/management/tests/test_models.py -v
```

Expected: ImportError ou erro de modelo não encontrado.

- [ ] **Step 2.5: Criar models.py**

```python
# backend/apps/management/models.py
from cuser.models import AbstractCUser
from django.db import models


class User(AbstractCUser):
    nickname = models.CharField(max_length=50, unique=True)
    wins = models.PositiveIntegerField(default=0)
    losses = models.PositiveIntegerField(default=0)

    class Meta(AbstractCUser.Meta):
        swappable = "AUTH_USER_MODEL"

    @property
    def winrate(self) -> float:
        total = self.wins + self.losses
        return self.wins / total if total > 0 else 0
```

- [ ] **Step 2.6: Criar admin.py**

```python
# backend/apps/management/admin.py
from django.contrib.auth.admin import UserAdmin
from unfold.admin import ModelAdmin
from .models import User


class CustomUserAdmin(ModelAdmin, UserAdmin):
    model = User
    list_display = ["email", "nickname", "wins", "losses", "is_staff"]
    fieldsets = UserAdmin.fieldsets + (
        ("Jogo", {"fields": ("nickname", "wins", "losses")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Jogo", {"fields": ("nickname",)}),
    )


from django.contrib import admin
admin.site.register(User, CustomUserAdmin)
```

- [ ] **Step 2.7: Criar serializers.py**

```python
# backend/apps/management/serializers.py
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "nickname", "password"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class RankingSerializer(serializers.ModelSerializer):
    winrate = serializers.FloatField(read_only=True)

    class Meta:
        model = User
        fields = ["nickname", "wins", "losses", "winrate"]
```

- [ ] **Step 2.8: Criar views.py**

```python
# backend/apps/management/views.py
from django.contrib.auth import get_user_model
from rest_framework.generics import CreateAPIView, ListAPIView
from rest_framework.permissions import AllowAny

from .serializers import RankingSerializer, UserRegistrationSerializer

User = get_user_model()


class UserRegistrationView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]


class RankingView(ListAPIView):
    serializer_class = RankingSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return User.objects.order_by("-wins", "-losses").all()
```

- [ ] **Step 2.9: Criar urls.py**

```python
# backend/apps/management/urls.py
from django.urls import path
from .views import RankingView, UserRegistrationView

urlpatterns = [
    path("", RankingView.as_view(), name="ranking"),
]

# Para incluir em auth/:
register_urlpatterns = [
    path("register/", UserRegistrationView.as_view(), name="register"),
]
```

Adicionar a rota de registro ao `backend/config/urls.py` — substituir a linha de auth:

```python
# backend/config/urls.py  (adicionar após auth/logout/)
from apps.management.urls import register_urlpatterns
...
    path("auth/", include(register_urlpatterns)),
```

Arquivo completo:

```python
# backend/config/urls.py
from django.contrib import admin
from django.urls import path, include
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
]
```

- [ ] **Step 2.10: Criar migration inicial e rodar testes**

```bash
cd backend && uv run python manage.py makemigrations management
uv run pytest apps/management/tests/test_models.py -v
```

Expected: 5 testes passando.

- [ ] **Step 2.11: Escrever testes de API**

```python
# backend/apps/management/tests/test_api.py
import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def client():
    return APIClient()


@pytest.mark.django_db
class TestRegistration:
    def test_register_user(self, client):
        response = client.post(
            "/auth/register/",
            {"email": "new@test.com", "nickname": "newplayer", "password": "pass12345"},
            format="json",
        )
        assert response.status_code == 201
        assert User.objects.filter(email="new@test.com").exists()

    def test_register_duplicate_nickname(self, client):
        User.objects.create_user(email="a@t.com", password="pass", nickname="taken")
        response = client.post(
            "/auth/register/",
            {"email": "b@t.com", "nickname": "taken", "password": "pass12345"},
            format="json",
        )
        assert response.status_code == 400

    def test_register_short_password(self, client):
        response = client.post(
            "/auth/register/",
            {"email": "c@t.com", "nickname": "nick", "password": "short"},
            format="json",
        )
        assert response.status_code == 400


@pytest.mark.django_db
class TestRanking:
    def test_ranking_public(self, client):
        User.objects.create_user(email="a@t.com", password="pass", nickname="alpha", wins=5, losses=1)
        User.objects.create_user(email="b@t.com", password="pass", nickname="beta", wins=3, losses=2)
        response = client.get("/ranking/")
        assert response.status_code == 200
        data = response.json()
        assert data[0]["nickname"] == "alpha"
        assert data[0]["wins"] == 5
        assert "winrate" in data[0]
```

- [ ] **Step 2.12: Rodar todos os testes de management**

```bash
cd backend && uv run pytest apps/management/ -v
```

Expected: todos passando.

- [ ] **Step 2.13: Commit**

```bash
cd /home/bruno/www/universe/x1biu
git add backend/apps/management/ backend/config/urls.py
git commit -m "feat: add management app with User model, registration, and ranking API"
```

---

## Task 3: apps/songs — [[backend/entidades#Song|Catálogo de músicas]]

**Files:**

- Create: `backend/apps/songs/__init__.py`
- Create: `backend/apps/songs/apps.py`
- Create: `backend/apps/songs/models.py`
- Create: `backend/apps/songs/admin.py`
- Create: `backend/apps/songs/serializers.py`
- Create: `backend/apps/songs/views.py`
- Create: `backend/apps/songs/urls.py`
- Create: `backend/apps/songs/tests/__init__.py`
- Create: `backend/apps/songs/tests/test_models.py`
- Create: `backend/apps/songs/tests/test_api.py`

- [ ] **Step 3.1: Criar estrutura**

```bash
mkdir -p backend/apps/songs/tests
touch backend/apps/songs/__init__.py backend/apps/songs/tests/__init__.py
```

- [ ] **Step 3.2: Criar apps.py**

```python
# backend/apps/songs/apps.py
from django.apps import AppConfig


class SongsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.songs"
```

- [ ] **Step 3.3: Escrever testes (TDD)**

```python
# backend/apps/songs/tests/test_models.py
import pytest
from apps.songs.models import Song


@pytest.mark.django_db
class TestSongModel:
    def test_create_song(self):
        song = Song.objects.create(
            title="Ode to Joy",
            artist="Beethoven",
            audio_url="https://example.com/audio.mp3",
            duration_ms=60000,
            pitch_reference=[{"frame": 0, "hz": 440.0}, {"frame": 1, "hz": 493.88}],
            is_active=True,
        )
        assert song.title == "Ode to Joy"
        assert song.duration_ms == 60000
        assert len(song.pitch_reference) == 2

    def test_inactive_songs_excluded(self):
        Song.objects.create(
            title="Active",
            artist="A",
            audio_url="https://example.com/a.mp3",
            duration_ms=1000,
            pitch_reference=[],
            is_active=True,
        )
        Song.objects.create(
            title="Inactive",
            artist="B",
            audio_url="https://example.com/b.mp3",
            duration_ms=1000,
            pitch_reference=[],
            is_active=False,
        )
        active = Song.objects.filter(is_active=True)
        assert active.count() == 1
        assert active.first().title == "Active"
```

- [ ] **Step 3.4: Criar models.py**

```python
# backend/apps/songs/models.py
from django.db import models
from config.utils.models import BaseModel


class Song(BaseModel):
    title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    audio_url = models.URLField()
    duration_ms = models.PositiveIntegerField()
    pitch_reference = models.JSONField()
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return f"{self.artist} — {self.title}"
```

- [ ] **Step 3.5: Criar admin.py**

```python
# backend/apps/songs/admin.py
from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Song


@admin.register(Song)
class SongAdmin(ModelAdmin):
    list_display = ["title", "artist", "duration_ms", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["title", "artist"]
```

- [ ] **Step 3.6: Criar serializers.py**

```python
# backend/apps/songs/serializers.py
from rest_framework import serializers
from .models import Song


class SongListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Song
        fields = ["id", "title", "artist", "duration_ms", "is_active"]


class SongDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Song
        fields = ["id", "title", "artist", "audio_url", "duration_ms", "pitch_reference", "is_active"]
```

- [ ] **Step 3.7: Criar views.py**

```python
# backend/apps/songs/views.py
from rest_framework.permissions import AllowAny
from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Song
from .serializers import SongDetailSerializer, SongListSerializer


class SongViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Song.objects.filter(is_active=True)

    def get_serializer_class(self):
        if self.action == "list":
            return SongListSerializer
        return SongDetailSerializer
```

- [ ] **Step 3.8: Criar urls.py**

```python
# backend/apps/songs/urls.py
from rest_framework.routers import DefaultRouter
from .views import SongViewSet

router = DefaultRouter()
router.register("", SongViewSet, basename="song")

urlpatterns = router.urls
```

- [ ] **Step 3.9: Escrever testes de API**

```python
# backend/apps/songs/tests/test_api.py
import pytest
from rest_framework.test import APIClient
from apps.songs.models import Song


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def song(db):
    return Song.objects.create(
        title="Test Song",
        artist="Test Artist",
        audio_url="https://example.com/audio.mp3",
        duration_ms=30000,
        pitch_reference=[{"frame": i, "hz": 440.0} for i in range(10)],
        is_active=True,
    )


@pytest.mark.django_db
class TestSongAPI:
    def test_list_songs_public(self, client, song):
        response = client.get("/songs/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    def test_list_hides_pitch_reference(self, client, song):
        response = client.get("/songs/")
        data = response.json()
        assert "pitch_reference" not in data[0]

    def test_retrieve_includes_pitch_reference(self, client, song):
        response = client.get(f"/songs/{song.id}/")
        assert response.status_code == 200
        data = response.json()
        assert "pitch_reference" in data
        assert len(data["pitch_reference"]) == 10

    def test_inactive_not_listed(self, client):
        Song.objects.create(
            title="Hidden",
            artist="X",
            audio_url="https://example.com/x.mp3",
            duration_ms=1000,
            pitch_reference=[],
            is_active=False,
        )
        response = client.get("/songs/")
        data = response.json()
        assert not any(s["title"] == "Hidden" for s in data)
```

- [ ] **Step 3.10: Makemigrations, migrar e rodar testes**

```bash
cd backend && uv run python manage.py makemigrations songs
uv run pytest apps/songs/ -v
```

Expected: todos passando.

- [ ] **Step 3.11: Commit**

```bash
cd /home/bruno/www/universe/x1biu
git add backend/apps/songs/
git commit -m "feat: add songs app with Song model and read-only API"
```

---

## Task 4: apps/matches — [[backend/entidades#Match|Models]]

**Files:**

- Create: `backend/apps/matches/__init__.py`
- Create: `backend/apps/matches/apps.py`
- Create: `backend/apps/matches/models.py`
- Create: `backend/apps/matches/tests/__init__.py`
- Create: `backend/apps/matches/tests/test_models.py`

- [ ] **Step 4.1: Criar estrutura**

```bash
mkdir -p backend/apps/matches/tests
touch backend/apps/matches/__init__.py backend/apps/matches/tests/__init__.py
```

- [ ] **Step 4.2: Criar apps.py**

```python
# backend/apps/matches/apps.py
from django.apps import AppConfig


class MatchesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.matches"
```

- [ ] **Step 4.3: Escrever testes para models (TDD)**

```python
# backend/apps/matches/tests/test_models.py
import pytest
from django.contrib.auth import get_user_model
from apps.matches.models import Match, MatchParticipant, QueueEntry
from apps.songs.models import Song

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(email="p@t.com", password="pass", nickname="player")


@pytest.fixture
def user2(db):
    return User.objects.create_user(email="p2@t.com", password="pass", nickname="player2")


@pytest.fixture
def song(db):
    return Song.objects.create(
        title="Song", artist="A", audio_url="https://x.com/a.mp3",
        duration_ms=30000, pitch_reference=[], is_active=True,
    )


@pytest.mark.django_db
class TestQueueEntry:
    def test_create_entry(self, user):
        entry = QueueEntry.objects.create(player=user)
        assert entry.player == user
        assert entry.joined_at is not None

    def test_one_entry_per_player(self, user):
        QueueEntry.objects.create(player=user)
        with pytest.raises(Exception):
            QueueEntry.objects.create(player=user)


@pytest.mark.django_db
class TestMatch:
    def test_default_status_waiting(self, song):
        match = Match.objects.create(song=song)
        assert match.status == Match.WAITING

    def test_participants_relationship(self, user, user2, song):
        match = Match.objects.create(song=song)
        MatchParticipant.objects.create(match=match, player=user)
        MatchParticipant.objects.create(match=match, player=user2)
        assert match.participants.count() == 2


@pytest.mark.django_db
class TestMatchParticipant:
    def test_default_score_zero(self, user, song):
        match = Match.objects.create(song=song)
        participant = MatchParticipant.objects.create(match=match, player=user)
        assert participant.score == 0
        assert participant.result == MatchParticipant.PENDING

    def test_unique_together(self, user, song):
        match = Match.objects.create(song=song)
        MatchParticipant.objects.create(match=match, player=user)
        with pytest.raises(Exception):
            MatchParticipant.objects.create(match=match, player=user)
```

- [ ] **Step 4.4: Criar models.py**

```python
# backend/apps/matches/models.py
from django.conf import settings
from django.db import models

from config.utils.models import BaseModel


class QueueEntry(BaseModel):
    player = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="queue_entry",
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Queue: {self.player}"


class Match(BaseModel):
    WAITING = "waiting"
    PLAYING = "playing"
    FINISHED = "finished"
    CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (WAITING, "Waiting"),
        (PLAYING, "Playing"),
        (FINISHED, "Finished"),
        (CANCELLED, "Cancelled"),
    ]

    song = models.ForeignKey("songs.Song", on_delete=models.PROTECT, related_name="matches")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=WAITING)
    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="won_matches",
    )
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"Match #{self.id} ({self.status})"


class MatchParticipant(BaseModel):
    WIN = "win"
    LOSS = "loss"
    DRAW = "draw"
    PENDING = "pending"
    RESULT_CHOICES = [
        (WIN, "Win"),
        (LOSS, "Loss"),
        (DRAW, "Draw"),
        (PENDING, "Pending"),
    ]

    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="participants")
    player = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="participations"
    )
    score = models.PositiveIntegerField(default=0)
    result = models.CharField(max_length=10, choices=RESULT_CHOICES, default=PENDING)

    class Meta:
        unique_together = [("match", "player")]

    def __str__(self) -> str:
        return f"{self.player} in {self.match}"
```

- [ ] **Step 4.5: Makemigrations e rodar testes**

```bash
cd backend && uv run python manage.py makemigrations matches
uv run pytest apps/matches/tests/test_models.py -v
```

Expected: todos passando.

- [ ] **Step 4.6: Commit**

```bash
cd /home/bruno/www/universe/x1biu
git add backend/apps/matches/
git commit -m "feat: add matches app with QueueEntry, Match, MatchParticipant models"
```

---

## Task 5: apps/matches — [[backend/services#MatchmakingService|Services]]

Implementa [[backend/services#MatchmakingService|MatchmakingService]], [[backend/services#ScoringService|ScoringService]] e [[backend/services#MatchService|MatchService]].

**Files:**

- Create: `backend/apps/matches/services.py`
- Create: `backend/apps/matches/tests/test_services.py`

- [ ] **Step 5.1: Escrever testes de services (TDD)**

```python
# backend/apps/matches/tests/test_services.py
import math
import pytest
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from apps.matches.models import Match, MatchParticipant, QueueEntry
from apps.matches.services import MatchmakingService, MatchService, ScoringService
from apps.songs.models import Song

User = get_user_model()


@pytest.fixture
def song(db):
    return Song.objects.create(
        title="Song", artist="A", audio_url="https://x.com/a.mp3",
        duration_ms=30000,
        pitch_reference=[{"frame": 0, "hz": 440.0}, {"frame": 1, "hz": 493.88}],
        is_active=True,
    )


@pytest.fixture
def user1(db):
    return User.objects.create_user(email="u1@t.com", password="pass", nickname="u1")


@pytest.fixture
def user2(db):
    return User.objects.create_user(email="u2@t.com", password="pass", nickname="u2")


@pytest.mark.django_db
class TestScoringService:
    def test_perfect_pitch(self, song):
        svc = ScoringService(song=song)
        score = svc.score_frame(player_hz=440.0, frame_index=0)
        assert score == 100

    def test_100_cents_off_scores_zero(self, song):
        svc = ScoringService(song=song)
        off_hz = 440.0 * (2 ** (100 / 1200))
        score = svc.score_frame(player_hz=off_hz, frame_index=0)
        assert score == 0

    def test_50_cents_off_scores_50(self, song):
        svc = ScoringService(song=song)
        off_hz = 440.0 * (2 ** (50 / 1200))
        score = svc.score_frame(player_hz=off_hz, frame_index=0)
        assert score == 50

    def test_missing_frame_scores_zero(self, song):
        svc = ScoringService(song=song)
        score = svc.score_frame(player_hz=440.0, frame_index=999)
        assert score == 0

    def test_zero_hz_scores_zero(self, song):
        svc = ScoringService(song=song)
        score = svc.score_frame(player_hz=0, frame_index=0)
        assert score == 0


@pytest.mark.django_db
class TestMatchmakingService:
    @patch("apps.matches.services.get_channel_layer")
    @patch("apps.matches.services.async_to_sync")
    def test_run_creates_match_with_two_players(self, mock_async, mock_layer, user1, user2, song):
        mock_async.return_value = MagicMock()
        QueueEntry.objects.create(player=user1)
        QueueEntry.objects.create(player=user2)

        svc = MatchmakingService()
        match = svc.run()

        assert match is not None
        assert match.status == Match.WAITING
        assert match.participants.count() == 2
        assert QueueEntry.objects.count() == 0

    def test_run_returns_none_with_one_player(self, user1):
        QueueEntry.objects.create(player=user1)
        svc = MatchmakingService()
        match = svc.run()
        assert match is None

    def test_run_returns_none_with_no_active_song(self, user1, user2, song):
        song.is_active = False
        song.save()
        QueueEntry.objects.create(player=user1)
        QueueEntry.objects.create(player=user2)
        svc = MatchmakingService()
        match = svc.run()
        assert match is None


@pytest.mark.django_db
class TestMatchService:
    @patch("apps.matches.services.get_channel_layer")
    @patch("apps.matches.services.async_to_sync")
    def test_start_changes_status_to_playing(self, mock_async, mock_layer, song):
        mock_async.return_value = MagicMock()
        match = Match.objects.create(song=song)
        MatchService.start(match)
        match.refresh_from_db()
        assert match.status == Match.PLAYING
        assert match.started_at is not None

    @patch("apps.matches.services.get_channel_layer")
    @patch("apps.matches.services.async_to_sync")
    def test_finalize_sets_winner(self, mock_async, mock_layer, song, user1, user2):
        mock_async.return_value = MagicMock()
        match = Match.objects.create(song=song, status=Match.PLAYING)
        p1 = MatchParticipant.objects.create(match=match, player=user1, score=800)
        p2 = MatchParticipant.objects.create(match=match, player=user2, score=500)

        MatchService.finalize(match)
        match.refresh_from_db()
        user1.refresh_from_db()
        user2.refresh_from_db()

        assert match.status == Match.FINISHED
        assert match.winner == user1
        assert user1.wins == 1
        assert user2.losses == 1

    def test_cancel_changes_status(self, song):
        match = Match.objects.create(song=song, status=Match.PLAYING)
        MatchService.cancel(match)
        match.refresh_from_db()
        assert match.status == Match.CANCELLED
```

- [ ] **Step 5.2: Rodar testes para confirmar que falham**

```bash
cd backend && uv run pytest apps/matches/tests/test_services.py -v
```

Expected: ImportError (services.py não existe ainda).

- [ ] **Step 5.3: Criar services.py**

```python
# backend/apps/matches/services.py
import math

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import F
from django.utils import timezone

from apps.matches.models import Match, MatchParticipant, QueueEntry
from apps.songs.models import Song


class ScoringService:
    def __init__(self, song: Song):
        self._ref = {item["frame"]: item["hz"] for item in song.pitch_reference}

    def score_frame(self, player_hz: float, frame_index: int) -> int:
        ref_hz = self._ref.get(frame_index)
        if not ref_hz or player_hz <= 0:
            return 0
        cents = abs(1200 * math.log2(player_hz / ref_hz))
        if cents >= 100:
            return 0
        return round(100 - cents)


class MatchmakingService:
    def run(self) -> Match | None:
        entries = list(QueueEntry.objects.select_related("player").order_by("joined_at")[:2])
        if len(entries) < 2:
            return None

        song = Song.objects.filter(is_active=True).order_by("?").first()
        if not song:
            return None

        match = Match.objects.create(song=song)
        for entry in entries:
            MatchParticipant.objects.create(match=match, player=entry.player)

        entry_ids = [e.id for e in entries]
        player_ids = [e.player.id for e in entries]
        QueueEntry.objects.filter(id__in=entry_ids).delete()

        channel_layer = get_channel_layer()
        for player_id in player_ids:
            async_to_sync(channel_layer.group_send)(
                f"user_{player_id}",
                {"type": "match.found", "match_id": match.id},
            )

        return match


class MatchService:
    @staticmethod
    def start(match: Match) -> None:
        match.status = Match.PLAYING
        match.started_at = timezone.now()
        match.save(update_fields=["status", "started_at"])

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"match_{match.id}",
            {
                "type": "match.start",
                "song_url": match.song.audio_url,
                "duration_ms": match.song.duration_ms,
            },
        )

    @staticmethod
    def finalize(match: Match) -> None:
        participants = list(match.participants.select_related("player").all())
        if len(participants) != 2:
            return

        p1, p2 = participants

        if p1.score == p2.score:
            MatchParticipant.objects.filter(match=match).update(result=MatchParticipant.DRAW)
            winner_player = None
        elif p1.score > p2.score:
            winner, loser = p1, p2
            winner.result = MatchParticipant.WIN
            loser.result = MatchParticipant.LOSS
            winner.save(update_fields=["result"])
            loser.save(update_fields=["result"])
            winner.player.wins = F("wins") + 1
            loser.player.losses = F("losses") + 1
            winner.player.save(update_fields=["wins"])
            loser.player.save(update_fields=["losses"])
            winner_player = winner.player
        else:
            winner, loser = p2, p1
            winner.result = MatchParticipant.WIN
            loser.result = MatchParticipant.LOSS
            winner.save(update_fields=["result"])
            loser.save(update_fields=["result"])
            winner.player.wins = F("wins") + 1
            loser.player.losses = F("losses") + 1
            winner.player.save(update_fields=["wins"])
            loser.player.save(update_fields=["losses"])
            winner_player = winner.player

        match.winner = winner_player
        match.status = Match.FINISHED
        match.finished_at = timezone.now()
        match.save(update_fields=["winner", "status", "finished_at"])

        scores = {str(p.player_id): p.score for p in participants}
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"match_{match.id}",
            {
                "type": "match.end",
                "scores": scores,
                "winner_id": str(winner_player.id) if winner_player else None,
            },
        )

    @staticmethod
    def cancel(match: Match) -> None:
        match.status = Match.CANCELLED
        match.save(update_fields=["status"])
```

- [ ] **Step 5.4: Rodar testes**

```bash
cd backend && uv run pytest apps/matches/tests/test_services.py -v
```

Expected: todos passando.

- [ ] **Step 5.5: Commit**

```bash
cd /home/bruno/www/universe/x1biu
git add backend/apps/matches/services.py backend/apps/matches/tests/test_services.py
git commit -m "feat: add MatchmakingService, ScoringService, MatchService"
```

---

## Task 6: apps/matches — REST API

Implementa [[backend/api#QueueView|QueueView]], [[backend/api#MatchViewSet|MatchViewSet]] e [[backend/api#RankingView|RankingView]].

**Files:**

- Create: `backend/apps/matches/serializers.py`
- Create: `backend/apps/matches/views.py`
- Create: `backend/apps/matches/urls_queue.py`
- Create: `backend/apps/matches/urls_matches.py`
- Create: `backend/apps/matches/tests/test_api.py`

- [ ] **Step 6.1: Escrever testes de API (TDD)**

```python
# backend/apps/matches/tests/test_api.py
import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.matches.models import Match, MatchParticipant, QueueEntry
from apps.songs.models import Song

User = get_user_model()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(email="p@t.com", password="pass", nickname="player")


@pytest.fixture
def user2(db):
    return User.objects.create_user(email="p2@t.com", password="pass", nickname="player2")


@pytest.fixture
def song(db):
    return Song.objects.create(
        title="S", artist="A", audio_url="https://x.com/a.mp3",
        duration_ms=10000, pitch_reference=[], is_active=True,
    )


@pytest.mark.django_db
class TestQueueJoin:
    def test_join_requires_auth(self, client):
        response = client.post("/queue/join/")
        assert response.status_code == 401

    def test_join_creates_entry(self, client, user):
        client.force_authenticate(user=user)
        response = client.post("/queue/join/")
        assert response.status_code == 201
        assert QueueEntry.objects.filter(player=user).exists()

    def test_join_duplicate_returns_400(self, client, user):
        client.force_authenticate(user=user)
        client.post("/queue/join/")
        response = client.post("/queue/join/")
        assert response.status_code == 400

    def test_leave_removes_entry(self, client, user):
        client.force_authenticate(user=user)
        QueueEntry.objects.create(player=user)
        response = client.delete("/queue/leave/")
        assert response.status_code == 204
        assert not QueueEntry.objects.filter(player=user).exists()

    def test_leave_when_not_in_queue_returns_404(self, client, user):
        client.force_authenticate(user=user)
        response = client.delete("/queue/leave/")
        assert response.status_code == 404


@pytest.mark.django_db
class TestMatchViewSet:
    def test_list_requires_auth(self, client):
        response = client.get("/matches/")
        assert response.status_code == 401

    def test_list_returns_player_matches(self, client, user, user2, song):
        client.force_authenticate(user=user)
        match = Match.objects.create(song=song)
        MatchParticipant.objects.create(match=match, player=user)
        MatchParticipant.objects.create(match=match, player=user2)
        response = client.get("/matches/")
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_retrieve_includes_participants(self, client, user, user2, song):
        client.force_authenticate(user=user)
        match = Match.objects.create(song=song)
        MatchParticipant.objects.create(match=match, player=user)
        MatchParticipant.objects.create(match=match, player=user2)
        response = client.get(f"/matches/{match.id}/")
        assert response.status_code == 200
        data = response.json()
        assert "participants" in data
```

- [ ] **Step 6.2: Criar serializers.py**

```python
# backend/apps/matches/serializers.py
from rest_framework import serializers
from .models import Match, MatchParticipant


class MatchParticipantSerializer(serializers.ModelSerializer):
    nickname = serializers.CharField(source="player.nickname", read_only=True)

    class Meta:
        model = MatchParticipant
        fields = ["id", "nickname", "score", "result"]


class MatchListSerializer(serializers.ModelSerializer):
    song_title = serializers.CharField(source="song.title", read_only=True)

    class Meta:
        model = Match
        fields = ["id", "song_title", "status", "started_at", "finished_at"]


class MatchDetailSerializer(serializers.ModelSerializer):
    participants = MatchParticipantSerializer(many=True, read_only=True)
    song_title = serializers.CharField(source="song.title", read_only=True)

    class Meta:
        model = Match
        fields = ["id", "song_title", "status", "winner", "started_at", "finished_at", "participants"]
```

- [ ] **Step 6.3: Criar views.py**

```python
# backend/apps/matches/views.py
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Match, QueueEntry
from .serializers import MatchDetailSerializer, MatchListSerializer


class QueueView(APIView):
    def post(self, request):
        if QueueEntry.objects.filter(player=request.user).exists():
            return Response({"detail": "Você já está na fila"}, status=status.HTTP_400_BAD_REQUEST)

        active = Match.objects.filter(
            participants__player=request.user, status__in=[Match.WAITING, Match.PLAYING]
        ).exists()
        if active:
            return Response({"detail": "Você já está em uma partida ativa"}, status=status.HTTP_400_BAD_REQUEST)

        entry = QueueEntry.objects.create(player=request.user)
        position = QueueEntry.objects.filter(joined_at__lte=entry.joined_at).count()
        return Response({"status": "queued", "position": position}, status=status.HTTP_201_CREATED)

    def delete(self, request):
        entry = get_object_or_404(QueueEntry, player=request.user)
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MatchViewSet(ReadOnlyModelViewSet):
    filterset_fields = ["status"]

    def get_queryset(self):
        return Match.objects.filter(participants__player=self.request.user).distinct()

    def get_serializer_class(self):
        if self.action == "retrieve":
            return MatchDetailSerializer
        return MatchListSerializer
```

- [ ] **Step 6.4: Criar urls_queue.py e urls_matches.py**

```python
# backend/apps/matches/urls_queue.py
from django.urls import path
from .views import QueueView

urlpatterns = [
    path("join/", QueueView.as_view(), name="queue-join"),
    path("leave/", QueueView.as_view(), name="queue-leave"),
]
```

```python
# backend/apps/matches/urls_matches.py
from rest_framework.routers import DefaultRouter
from .views import MatchViewSet

router = DefaultRouter()
router.register("", MatchViewSet, basename="match")

urlpatterns = router.urls
```

- [ ] **Step 6.5: Rodar testes de API**

```bash
cd backend && uv run pytest apps/matches/tests/test_api.py -v
```

Expected: todos passando.

- [ ] **Step 6.6: Commit**

```bash
cd /home/bruno/www/universe/x1biu
git add backend/apps/matches/serializers.py backend/apps/matches/views.py backend/apps/matches/urls_queue.py backend/apps/matches/urls_matches.py backend/apps/matches/tests/test_api.py
git commit -m "feat: add matches REST API — queue join/leave, match list/detail"
```

---

## Task 7: Celery task — [[backend/crons#process_matchmaking|process_matchmaking]]

**Files:**

- Create: `backend/apps/matches/tasks.py`
- Create: `backend/apps/matches/tests/test_tasks.py`

- [ ] **Step 7.1: Escrever testes (TDD)**

```python
# backend/apps/matches/tests/test_tasks.py
import pytest
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from apps.matches.models import Match, QueueEntry
from apps.songs.models import Song

User = get_user_model()


@pytest.fixture
def song(db):
    return Song.objects.create(
        title="S", artist="A", audio_url="https://x.com/a.mp3",
        duration_ms=10000, pitch_reference=[], is_active=True,
    )


@pytest.mark.django_db
class TestProcessMatchmaking:
    @patch("apps.matches.services.get_channel_layer")
    @patch("apps.matches.services.async_to_sync")
    def test_creates_match_for_two_players(self, mock_async, mock_layer, song):
        mock_async.return_value = MagicMock()
        users = [
            User.objects.create_user(email=f"u{i}@t.com", password="pass", nickname=f"u{i}")
            for i in range(2)
        ]
        for u in users:
            QueueEntry.objects.create(player=u)

        from apps.matches.tasks import process_matchmaking
        process_matchmaking()

        assert Match.objects.count() == 1
        assert QueueEntry.objects.count() == 0

    @patch("apps.matches.services.get_channel_layer")
    @patch("apps.matches.services.async_to_sync")
    def test_processes_multiple_pairs(self, mock_async, mock_layer, song):
        mock_async.return_value = MagicMock()
        users = [
            User.objects.create_user(email=f"u{i}@t.com", password="pass", nickname=f"u{i}")
            for i in range(4)
        ]
        for u in users:
            QueueEntry.objects.create(player=u)

        from apps.matches.tasks import process_matchmaking
        process_matchmaking()

        assert Match.objects.count() == 2
        assert QueueEntry.objects.count() == 0
```

- [ ] **Step 7.2: Criar tasks.py**

```python
# backend/apps/matches/tasks.py
from celery import shared_task

from .models import QueueEntry
from .services import MatchmakingService


@shared_task(name="apps.matches.tasks.process_matchmaking")
def process_matchmaking():
    while QueueEntry.objects.count() >= 2:
        match = MatchmakingService().run()
        if match is None:
            break
```

- [ ] **Step 7.3: Rodar testes**

```bash
cd backend && uv run pytest apps/matches/tests/test_tasks.py -v
```

Expected: todos passando.

- [ ] **Step 7.4: Commit**

```bash
cd /home/bruno/www/universe/x1biu
git add backend/apps/matches/tasks.py backend/apps/matches/tests/test_tasks.py
git commit -m "feat: add process_matchmaking Celery task"
```

---

## Task 8: WebSocket — Consumers e ASGI routing

Implementa o [[backend/fluxos#Fluxo de Batalha (WebSocket)|Fluxo de Batalha]] via Django Channels. Ver [[backend/fluxos#Fluxo de Matchmaking|Fluxo de Matchmaking]] para contexto.

**Files:**

- Create: `backend/config/middleware.py`
- Create: `backend/config/routing.py`
- Modify: `backend/config/asgi.py`
- Create: `backend/apps/matches/consumers.py`
- Create: `backend/apps/matches/tests/test_consumers.py`

- [ ] **Step 8.1: Criar JWT WebSocket middleware**

```python
# backend/config/middleware.py
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def _get_user(token_str: str):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        token = AccessToken(token_str)
        return User.objects.get(id=token["user_id"])
    except Exception:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token_list = params.get("token", [])
        if token_list:
            scope["user"] = await _get_user(token_list[0])
        else:
            scope["user"] = AnonymousUser()
        return await super().__call__(scope, receive, send)
```

- [ ] **Step 8.2: Criar consumers.py**

```python
# backend/apps/matches/consumers.py
import json

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.cache import cache


class QueueConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        if user.is_anonymous:
            await self.close(code=4001)
            return
        self.group_name = f"user_{user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def match_found(self, event):
        await self.send(text_data=json.dumps({
            "type": "match_found",
            "match_id": event["match_id"],
        }))


class MatchConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        if user.is_anonymous:
            await self.close(code=4001)
            return

        self.match_id = self.scope["url_route"]["kwargs"]["match_id"]
        self.user_id = user.id
        self.group_name = f"match_{self.match_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        count = await self._increment_connected()
        if count >= 2:
            await self._start_match()

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            await self._maybe_cancel_match()

    async def receive(self, text_data: str):
        data = json.loads(text_data)
        if data.get("type") == "pitch_frame":
            await self._handle_pitch_frame(data)

    async def _handle_pitch_frame(self, data: dict):
        hz = float(data.get("hz", 0))
        frame = int(data.get("frame", 0))
        await sync_to_async(self._score_and_update)(hz, frame)

    def _score_and_update(self, hz: float, frame: int):
        from django.db.models import F
        from apps.matches.models import Match, MatchParticipant
        from apps.matches.services import ScoringService

        try:
            match = Match.objects.select_related("song").get(
                id=self.match_id, status=Match.PLAYING
            )
        except Match.DoesNotExist:
            return

        points = ScoringService(song=match.song).score_frame(hz, frame)
        if points > 0:
            MatchParticipant.objects.filter(
                match=match, player_id=self.user_id
            ).update(score=F("score") + points)

    async def _increment_connected(self) -> int:
        key = f"match_{self.match_id}_connected"
        count = await sync_to_async(cache.get)(key) or 0
        count += 1
        await sync_to_async(cache.set)(key, count, timeout=3600)
        return count

    async def _start_match(self):
        from apps.matches.models import Match
        from apps.matches.services import MatchService

        try:
            match = await sync_to_async(
                Match.objects.select_related("song").get
            )(id=self.match_id, status=Match.WAITING)
            await sync_to_async(MatchService.start)(match)
        except Match.DoesNotExist:
            pass

    async def _maybe_cancel_match(self):
        from apps.matches.models import Match
        from apps.matches.services import MatchService

        try:
            match = await sync_to_async(Match.objects.get)(
                id=self.match_id, status=Match.PLAYING
            )
            await sync_to_async(MatchService.cancel)(match)
        except Match.DoesNotExist:
            pass

    # Channel layer event handlers
    async def match_start(self, event):
        await self.send(text_data=json.dumps({
            "type": "match_start",
            "song_url": event["song_url"],
            "duration_ms": event["duration_ms"],
        }))

    async def match_end(self, event):
        await self.send(text_data=json.dumps({
            "type": "match_end",
            "scores": event["scores"],
            "winner_id": event["winner_id"],
        }))
```

**Nota sobre o tipo dos eventos:** O Django Channels mapeia `type` no event dict substituindo `.` por `_`. Portanto `{"type": "match.start"}` chama o método `match_start(event)`, e `{"type": "match.found"}` chama `match_found(event)`.

- [ ] **Step 8.3: Criar config/routing.py**

```python
# backend/config/routing.py
from django.urls import re_path

from apps.matches.consumers import MatchConsumer, QueueConsumer

websocket_urlpatterns = [
    re_path(r"^ws/queue/$", QueueConsumer.as_asgi()),
    re_path(r"^ws/match/(?P<match_id>\d+)/$", MatchConsumer.as_asgi()),
]
```

- [ ] **Step 8.4: Atualizar config/asgi.py**

```python
# backend/config/asgi.py
import os

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

django_asgi_app = get_asgi_application()

from config.middleware import JWTAuthMiddleware
from config.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(
        URLRouter(websocket_urlpatterns)
    ),
})
```

**Nota:** `django_asgi_app` precisa ser inicializado antes dos imports dos consumers (que carregam models Django).

- [ ] **Step 8.5: Escrever testes do consumer**

```python
# backend/apps/matches/tests/test_consumers.py
import json
import pytest
from channels.testing import WebsocketCommunicator
from channels.layers import get_channel_layer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from apps.songs.models import Song

User = get_user_model()


def get_jwt_token(user) -> str:
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)


@pytest.fixture
def user(db):
    return User.objects.create_user(email="p@t.com", password="pass", nickname="player")


@pytest.fixture
def song(db):
    return Song.objects.create(
        title="S", artist="A", audio_url="https://x.com/a.mp3",
        duration_ms=10000,
        pitch_reference=[{"frame": 0, "hz": 440.0}],
        is_active=True,
    )


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio
async def test_queue_consumer_receives_match_found(user):
    from config.asgi import application
    token = await __import__("asgiref.sync", fromlist=["sync_to_async"]).sync_to_async(get_jwt_token)(user)
    communicator = WebsocketCommunicator(application, f"/ws/queue/?token={token}")

    connected, _ = await communicator.connect()
    assert connected

    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        f"user_{user.id}",
        {"type": "match.found", "match_id": 42},
    )

    response = await communicator.receive_json_from()
    assert response["type"] == "match_found"
    assert response["match_id"] == 42

    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
@pytest.mark.asyncio
async def test_queue_consumer_rejects_no_token():
    from config.asgi import application
    communicator = WebsocketCommunicator(application, "/ws/queue/")
    connected, code = await communicator.connect()
    # anonymous user gets rejected with close code 4001
    if connected:
        msg = await communicator.receive_output()
        assert msg["type"] == "websocket.close"
    else:
        assert code == 4001
    await communicator.disconnect()
```

**Nota:** Para rodar testes assíncronos com pytest-asyncio, adicione ao `pytest.ini`:

```ini
asyncio_mode = auto
```

E ao `pyproject.toml` dev deps:

```toml
    "pytest-asyncio>=1.0.0",
```

- [ ] **Step 8.6: Adicionar pytest-asyncio e atualizar pytest.ini**

Adicionar ao `backend/pyproject.toml` em `[dependency-groups] dev`:
```toml
    "pytest-asyncio>=1.0.0",
```

Adicionar ao `backend/pytest.ini`:
```ini
asyncio_mode = auto
```

```bash
cd backend && uv sync
```

- [ ] **Step 8.7: Rodar testes dos consumers**

```bash
cd backend && uv run pytest apps/matches/tests/test_consumers.py -v
```

Expected: todos passando (pode precisar de um Redis disponível para channel layer em tests — se não tiver, mockar a channel layer ou usar `InMemoryChannelLayer`).

Para testes sem Redis, adicionar em `backend/config/settings/dev.py`:
```python
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    }
}
```

- [ ] **Step 8.8: Commit**

```bash
cd /home/bruno/www/universe/x1biu
git add backend/config/middleware.py backend/config/routing.py backend/config/asgi.py backend/apps/matches/consumers.py backend/apps/matches/tests/test_consumers.py backend/pyproject.toml backend/pytest.ini
git commit -m "feat: add WebSocket consumers (QueueConsumer, MatchConsumer), JWT middleware, ASGI routing"
```

---

## Task 9: Backend — Migrar e testar tudo

**Files:** apenas execução

- [ ] **Step 9.1: Rodar todas as migrações**

```bash
cd backend && uv run python manage.py migrate
```

Expected: todas as migrações aplicadas sem erro.

- [ ] **Step 9.2: Rodar suite completa**

```bash
cd backend && uv run pytest . -v --tb=short
```

Expected: todos os testes passando.

- [ ] **Step 9.3: Testar servidor localmente**

Garantir que Docker está rodando:
```bash
cd /home/bruno/www/universe/x1biu && make rundb
```

Iniciar servidor:
```bash
make backend
```

Expected: `Application startup complete.` — servidor rodando em `http://localhost:8000`.

- [ ] **Step 9.4: Verificar docs API**

Abrir `http://localhost:8000/scalar/` no browser e confirmar que os endpoints aparecem.

- [ ] **Step 9.5: Commit**

```bash
cd /home/bruno/www/universe/x1biu
git add .
git commit -m "chore: backend complete — all migrations and tests passing"
```

---

## Task 10: Frontend — package.json e estrutura src/

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/src/app/globals.css`
- Create: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/page.tsx`
- Create: `frontend/src/lib/utils.ts`
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/auth.ts`
- Create: `frontend/src/lib/ws.ts`

- [ ] **Step 10.1: Criar package.json**

```json
{
  "name": "x1biu",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome check --write --unsafe src/",
    "format": "biome format --write src/",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "api:gen": "kubb generate",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "qa": "pnpm lint && pnpm typecheck && pnpm test && pnpm build"
  },
  "dependencies": {
    "next": "16.1.6",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "@tanstack/react-query": "^5.101.0",
    "axios": "^1.17.0",
    "zod": "^3.25.0",
    "jwt-decode": "^4.0.0",
    "sonner": "^2.0.0",
    "lucide-react": "^0.475.0",
    "@base-ui-components/react": "^1.0.0",
    "ml5": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "@biomejs/biome": "2.2.0",
    "@kubb/cli": "^4.37.9",
    "@kubb/core": "^4.37.9",
    "@kubb/plugin-client": "^4.37.9",
    "@kubb/plugin-oas": "^4.37.9",
    "@kubb/plugin-react-query": "^4.37.9",
    "@kubb/swagger-ts": "^4.37.9",
    "@playwright/test": "^1.60.0",
    "@storybook/addon-vitest": "^10.4.2",
    "@storybook/nextjs-vite": "^10.4.2",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.2.16",
    "@types/react-dom": "^19.2.3",
    "storybook": "^10.4.2",
    "tailwindcss": "^4.3.0",
    "typescript": "^5.9.3",
    "vitest": "^4.1.8"
  }
}
```

- [ ] **Step 10.2: Instalar dependências**

```bash
cd frontend && pnpm install
```

Expected: instalação sem erros. Se houver conflito de versões com o pnpm store existente, pnpm irá baixar automaticamente. Aguardar conclusão.

- [ ] **Step 10.3: Criar estrutura de pastas src/**

```bash
mkdir -p frontend/src/app
mkdir -p frontend/src/components/ui
mkdir -p frontend/src/lib
mkdir -p frontend/src/hooks
```

- [ ] **Step 10.4: Criar globals.css**

```css
/* frontend/src/app/globals.css */
@import "tailwindcss";

:root {
  --background: #0a0a0a;
  --foreground: #ededed;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: system-ui, -apple-system, sans-serif;
}
```

- [ ] **Step 10.5: Criar layout.tsx**

```tsx
// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "x1biu — Batalha de Assobios",
  description: "App de batalha 1v1 de assobios com ranking global",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 10.6: Criar src/lib/utils.ts**

```typescript
// frontend/src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 10.7: Criar src/lib/api.ts**

```typescript
// frontend/src/lib/api.ts
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

- [ ] **Step 10.8: Criar src/lib/auth.ts**

```typescript
// frontend/src/lib/auth.ts
import { jwtDecode } from "jwt-decode";
import { api } from "./api";

interface JWTPayload {
  user_id: number;
  email: string;
  exp: number;
}

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function getUser(): JWTPayload | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    return jwtDecode<JWTPayload>(token);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const user = getUser();
  if (!user) return false;
  return user.exp * 1000 > Date.now();
}

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login/", { email, password });
  setTokens(data.access, data.refresh);
  return data;
}

export async function register(email: string, password: string, nickname: string) {
  const { data } = await api.post("/auth/register/", { email, password, nickname });
  return data;
}

export async function logout() {
  const refresh = localStorage.getItem("refresh_token");
  if (refresh) {
    await api.post("/auth/logout/", { refresh }).catch(() => {});
  }
  clearTokens();
}
```

- [ ] **Step 10.9: Criar src/lib/ws.ts**

```typescript
// frontend/src/lib/ws.ts
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export function createWebSocket(path: string, token: string): WebSocket {
  return new WebSocket(`${WS_BASE}${path}?token=${token}`);
}
```

- [ ] **Step 10.10: Verificar typecheck**

```bash
cd frontend && pnpm typecheck
```

Expected: sem erros de tipo.

- [ ] **Step 10.11: Commit**

```bash
cd /home/bruno/www/universe/x1biu
git add frontend/
git commit -m "feat: frontend setup — package.json, src structure, api/auth/ws libs"
```

---

## Task 11: Frontend — Páginas de autenticação

**Files:**
- Create: `frontend/src/app/(auth)/login/page.tsx`
- Create: `frontend/src/app/(auth)/register/page.tsx`
- Create: `frontend/src/components/ui/button.tsx`
- Create: `frontend/src/components/ui/input.tsx`

- [ ] **Step 11.1: Criar componente Button**

```tsx
// frontend/src/components/ui/button.tsx
import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:opacity-50",
          {
            "bg-white text-black hover:bg-white/90": variant === "default",
            "border border-white/20 text-white hover:bg-white/10": variant === "outline",
            "text-white hover:bg-white/10": variant === "ghost",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-base": size === "md",
            "h-12 px-6 text-lg": size === "lg",
          },
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
```

- [ ] **Step 11.2: Criar componente Input**

```tsx
// frontend/src/components/ui/input.tsx
import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
```

- [ ] **Step 11.3: Criar página de login**

```tsx
// frontend/src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch {
      toast.error("Email ou senha inválidos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">x1biu</h1>
          <p className="mt-2 text-white/60">Batalha de Assobios</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <p className="text-center text-sm text-white/60">
          Sem conta?{" "}
          <Link href="/register" className="text-white underline">
            Cadastrar
          </Link>
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 11.4: Criar página de registro**

```tsx
// frontend/src/app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { register, login } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, nickname);
      await login(email, password);
      router.push("/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { nickname?: string[]; email?: string[] } } })
          .response?.data?.nickname?.[0] ??
        (err as { response?: { data?: { email?: string[] } } })
          .response?.data?.email?.[0] ??
        "Erro ao criar conta";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">x1biu</h1>
          <p className="mt-2 text-white/60">Criar conta</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            placeholder="Nickname (exibido no ranking)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Senha (mín. 8 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
        <p className="text-center text-sm text-white/60">
          Já tem conta?{" "}
          <Link href="/login" className="text-white underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 11.5: Adicionar Sonner Toaster ao layout.tsx**

```tsx
// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "x1biu — Batalha de Assobios",
  description: "App de batalha 1v1 de assobios com ranking global",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}
```

- [ ] **Step 11.6: Commit**

```bash
cd /home/bruno/www/universe/x1biu
git add frontend/src/
git commit -m "feat: auth pages (login/register) with JWT flow"
```

---

## Task 12: Frontend — [[frontend/paginas#/|Home]] e [[frontend/paginas#/queue|Queue]] pages

**Files:**

- Create: `frontend/src/app/page.tsx`
- Create: `frontend/src/app/queue/page.tsx`
- Create: `frontend/src/hooks/useAuth.ts`

- [ ] **Step 12.1: Criar hook useAuth**

```typescript
// frontend/src/hooks/useAuth.ts
"use client";

import { useEffect, useState } from "react";
import { getUser, isAuthenticated, logout } from "@/lib/auth";

interface AuthUser {
  user_id: number;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getUser() as AuthUser);
    }
    setLoading(false);
  }, []);

  async function signOut() {
    await logout();
    setUser(null);
    window.location.href = "/login";
  }

  return { user, loading, signOut };
}
```

- [ ] **Step 12.2: Criar página Home**

```tsx
// frontend/src/app/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function HomePage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  async function handlePlay() {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      await api.post("/queue/join/");
      router.push("/queue");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        .response?.data?.detail;
      toast.error(detail ?? "Erro ao entrar na fila");
    }
  }

  if (loading) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold tracking-tight">x1biu</h1>
        <p className="mt-3 text-xl text-white/60">Batalha 1v1 de assobios</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <Button size="lg" onClick={handlePlay} className="px-12 py-6 text-xl">
          🎵 Buscar Partida
        </Button>
        <Link href="/ranking">
          <Button variant="ghost" size="md">
            Ver Ranking
          </Button>
        </Link>
      </div>

      {user ? (
        <div className="flex items-center gap-4 text-sm text-white/60">
          <span>Logado como {user.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sair
          </Button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="outline" size="sm">
              Entrar
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="ghost" size="sm">
              Cadastrar
            </Button>
          </Link>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 12.3: Criar página Queue**

```tsx
// frontend/src/app/queue/page.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { createWebSocket } from "@/lib/ws";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function QueuePage() {
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const ws = createWebSocket("/ws/queue/", token);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "match_found") {
        ws.close();
        router.push(`/match/${data.match_id}`);
      }
    };

    ws.onerror = () => {
      toast.error("Conexão perdida. Tente novamente.");
      router.push("/");
    };

    return () => {
      ws.close();
    };
  }, [router]);

  async function handleLeave() {
    wsRef.current?.close();
    try {
      await api.delete("/queue/leave/");
    } catch {
      // ignore if already left
    }
    router.push("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <div className="text-center space-y-4">
        <div className="text-6xl animate-pulse">🎵</div>
        <h2 className="text-2xl font-semibold">Procurando adversário...</h2>
        <p className="text-white/60">Aguarde enquanto encontramos um oponente para você</p>
      </div>
      <Button variant="outline" onClick={handleLeave}>
        Cancelar
      </Button>
    </main>
  );
}
```

- [ ] **Step 12.4: Commit**

```bash
cd /home/bruno/www/universe/x1biu
git add frontend/src/app/page.tsx frontend/src/app/queue/ frontend/src/hooks/
git commit -m "feat: home and queue pages with WebSocket match_found listener"
```

---

## Task 13: Frontend — [[frontend/paginas#/match/[id]|Match battle page]] (WebSocket + ml5.js)

Implementa o [[fluxos#Batalha e Pontuação em Tempo Real|fluxo de batalha]] no browser. Ver [[frontend/estado|estado]] para hooks.

**Files:**

- Create: `frontend/src/app/match/[id]/page.tsx`
- Create: `frontend/src/hooks/usePitchDetection.ts`
- Create: `frontend/src/hooks/useMatchWebSocket.ts`

- [ ] **Step 13.1: Criar hook de pitch detection com ml5.js**

```typescript
// frontend/src/hooks/usePitchDetection.ts
"use client";

import { useCallback, useRef, useState } from "react";

interface PitchDetectionHook {
  hz: number | null;
  isListening: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

export function usePitchDetection(): PitchDetectionHook {
  const [hz, setHz] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const ml5Ref = useRef<unknown>(null);
  const pitchDetectorRef = useRef<unknown>(null);

  const stop = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
    }
    if (audioContextRef.current) audioContextRef.current.close();
    setIsListening(false);
    setHz(null);
  }, []);

  const start = useCallback(async () => {
    // lazy load ml5 (browser-only)
    if (!ml5Ref.current) {
      const ml5 = await import("ml5");
      ml5Ref.current = ml5;
    }
    const ml5 = ml5Ref.current as {
      pitchDetection: (model: string, ctx: AudioContext, stream: MediaStream, cb: () => void) => unknown & {
        getPitch: (cb: (err: unknown, freq: number | null) => void) => void;
      };
    };

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    pitchDetectorRef.current = await new Promise((resolve) => {
      const detector = ml5.pitchDetection(
        "https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models@master/models/pitch-detection/crepe/",
        audioContext,
        stream,
        () => resolve(detector),
      );
    });

    setIsListening(true);

    function detectPitch() {
      (pitchDetectorRef.current as { getPitch: (cb: (err: unknown, freq: number | null) => void) => void }).getPitch(
        (_err: unknown, freq: number | null) => {
          if (freq) setHz(freq);
        },
      );
      animFrameRef.current = requestAnimationFrame(detectPitch);
    }
    detectPitch();
  }, []);

  return { hz, isListening, start, stop };
}
```

- [ ] **Step 13.2: Criar hook do WebSocket de partida**

```typescript
// frontend/src/hooks/useMatchWebSocket.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAccessToken } from "@/lib/auth";
import { createWebSocket } from "@/lib/ws";

interface MatchState {
  status: "connecting" | "waiting" | "playing" | "finished";
  songUrl: string | null;
  durationMs: number | null;
  myScore: number;
  opponentScore: number;
  winnerId: string | null;
}

interface UseMatchWebSocketReturn extends MatchState {
  sendPitchFrame: (hz: number, frame: number) => void;
}

export function useMatchWebSocket(matchId: string): UseMatchWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<MatchState>({
    status: "connecting",
    songUrl: null,
    durationMs: null,
    myScore: 0,
    opponentScore: 0,
    winnerId: null,
  });
  const myUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    // Extract user_id from JWT
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      myUserIdRef.current = String(payload.user_id);
    } catch {}

    const ws = createWebSocket(`/ws/match/${matchId}/`, token);
    wsRef.current = ws;

    ws.onopen = () => setState((s) => ({ ...s, status: "waiting" }));

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "match_start") {
        setState((s) => ({
          ...s,
          status: "playing",
          songUrl: data.song_url,
          durationMs: data.duration_ms,
        }));
      }

      if (data.type === "match_end") {
        const myId = myUserIdRef.current;
        const scores: Record<string, number> = data.scores;
        setState((s) => ({
          ...s,
          status: "finished",
          myScore: myId ? (scores[myId] ?? 0) : 0,
          opponentScore: myId
            ? Object.entries(scores).find(([k]) => k !== myId)?.[1] ?? 0
            : 0,
          winnerId: data.winner_id,
        }));
      }
    };

    return () => ws.close();
  }, [matchId]);

  const sendPitchFrame = useCallback((hz: number, frame: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "pitch_frame", hz, frame }));
    }
  }, []);

  return { ...state, sendPitchFrame };
}
```

- [ ] **Step 13.3: Criar página de batalha**

```tsx
// frontend/src/app/match/[id]/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePitchDetection } from "@/hooks/usePitchDetection";
import { useMatchWebSocket } from "@/hooks/useMatchWebSocket";
import { Button } from "@/components/ui/button";

export default function MatchPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const matchId = params.id;

  const { status, songUrl, durationMs, myScore, opponentScore, winnerId, sendPitchFrame } =
    useMatchWebSocket(matchId);

  const { hz, isListening, start: startMic, stop: stopMic } = usePitchDetection();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const frameRef = useRef(0);
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start music and mic when match begins
  useEffect(() => {
    if (status === "playing" && songUrl) {
      const audio = new Audio(songUrl);
      audioRef.current = audio;
      audio.play();
      startMic();

      // send pitch frame every 50ms
      frameRef.current = 0;
      frameTimerRef.current = setInterval(() => {
        frameRef.current += 1;
      }, 50);

      const totalMs = durationMs ?? 60000;
      setTimeout(() => {
        audio.pause();
        stopMic();
        if (frameTimerRef.current) clearInterval(frameTimerRef.current);
      }, totalMs);
    }
    return () => {
      audioRef.current?.pause();
      stopMic();
      if (frameTimerRef.current) clearInterval(frameTimerRef.current);
    };
  }, [status, songUrl, durationMs, startMic, stopMic]);

  // Send pitch to server every 50ms while playing
  useEffect(() => {
    if (status !== "playing" || !isListening) return;
    const interval = setInterval(() => {
      if (hz && hz > 0) {
        sendPitchFrame(hz, frameRef.current);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [status, isListening, hz, sendPitchFrame]);

  // Redirect to results when match ends
  useEffect(() => {
    if (status === "finished") {
      router.push(`/match/${matchId}/result`);
    }
  }, [status, matchId, router]);

  if (status === "connecting" || status === "waiting") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-5xl animate-pulse">🎵</div>
          <p className="text-white/60">
            {status === "connecting" ? "Conectando..." : "Aguardando adversário..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <h2 className="text-2xl font-bold">Batalha em andamento</h2>

      <div className="grid grid-cols-2 gap-8 text-center">
        <div className="space-y-2">
          <p className="text-white/60">Você</p>
          <p className="text-5xl font-bold">{myScore}</p>
          {hz && (
            <p className="text-sm text-green-400">{hz.toFixed(1)} Hz</p>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-white/60">Adversário</p>
          <p className="text-5xl font-bold">{opponentScore}</p>
        </div>
      </div>

      {isListening && (
        <div className="flex items-center gap-2 text-green-400">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm">Microfone ativo</span>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 13.4: Commit**

```bash
cd /home/bruno/www/universe/x1biu
git add frontend/src/app/match/ frontend/src/hooks/usePitchDetection.ts frontend/src/hooks/useMatchWebSocket.ts
git commit -m "feat: match battle page with WebSocket pitch streaming and ml5.js pitch detection"
```

---

## Task 14: Frontend — [[frontend/paginas#/match/[id]/result|Resultado]] e [[frontend/paginas#/ranking|Ranking]]

Implementa o [[fluxos#Resultado e Atualização de Ranking|fluxo de resultado e ranking]].

**Files:**

- Create: `frontend/src/app/match/[id]/result/page.tsx`
- Create: `frontend/src/app/ranking/page.tsx`

- [ ] **Step 14.1: Criar página de resultado**

A página de resultado usa Client Component para acessar o token JWT do localStorage e autenticar a chamada à API.

```tsx
// frontend/src/app/match/[id]/result/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Participant {
  id: number;
  nickname: string;
  score: number;
  result: "win" | "loss" | "draw" | "pending";
}

interface Match {
  id: number;
  song_title: string;
  status: string;
  winner: number | null;
  participants: Participant[];
}

export default function MatchResultPage() {
  const params = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Match>(`/matches/${params.id}/`)
      .then((res) => setMatch(res.data))
      .catch(() => setMatch(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-5xl animate-pulse">🏆</div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-white/60">Partida não encontrada</p>
      </main>
    );
  }

  const winner = match.participants.find((p) => p.result === "win");
  const isDraw = match.participants.every((p) => p.result === "draw");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <div className="text-center space-y-2">
        <div className="text-5xl">{isDraw ? "🤝" : "🏆"}</div>
        <h2 className="text-3xl font-bold">
          {isDraw ? "Empate!" : `${winner?.nickname ?? "Jogador"} venceu!`}
        </h2>
        <p className="text-white/60">{match.song_title}</p>
      </div>

      <div className="grid grid-cols-2 gap-8 text-center">
        {match.participants.map((p) => (
          <div key={p.id} className="space-y-1">
            <p className="font-medium">{p.nickname}</p>
            <p className="text-4xl font-bold">{p.score}</p>
            <p
              className={
                p.result === "win"
                  ? "text-green-400"
                  : p.result === "loss"
                    ? "text-red-400"
                    : "text-white/60"
              }
            >
              {p.result === "win" ? "Vitória" : p.result === "loss" ? "Derrota" : "Empate"}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link href="/">
          <Button>Voltar ao Lobby</Button>
        </Link>
        <Link href="/ranking">
          <Button variant="outline">Ver Ranking</Button>
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 14.2: Criar página de ranking**

```tsx
// frontend/src/app/ranking/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Player {
  nickname: string;
  wins: number;
  losses: number;
  winrate: number;
}

async function getRanking(): Promise<Player[]> {
  const baseUrl = process.env.API_URL ?? "http://localhost:8000";
  try {
    const res = await fetch(`${baseUrl}/ranking/`, { next: { revalidate: 30 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function RankingPage() {
  const players = await getRanking();

  return (
    <main className="flex min-h-screen flex-col items-center p-8 gap-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Ranking Global</h1>
          <Link href="/">
            <Button variant="outline" size="sm">
              Voltar
            </Button>
          </Link>
        </div>

        {players.length === 0 ? (
          <p className="text-center text-white/60 py-12">Nenhum jogador ainda.</p>
        ) : (
          <div className="space-y-2">
            {players.map((player, index) => (
              <div
                key={player.nickname}
                className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <span className="w-8 text-center font-bold text-white/60">
                  #{index + 1}
                </span>
                <span className="flex-1 font-medium">{player.nickname}</span>
                <span className="text-green-400">{player.wins}V</span>
                <span className="text-red-400">{player.losses}D</span>
                <span className="text-white/60 text-sm">
                  {(player.winrate * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 14.3: Adicionar NEXT_PUBLIC_API_URL ao .env.example**

Adicionar ao `.env.example` no raiz do projeto:
```bash
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
API_URL=http://localhost:8000
```

- [ ] **Step 14.4: Fazer build de verificação**

```bash
cd frontend && pnpm build
```

Expected: build completo sem erros de tipo. Warnings de lint são aceitáveis.

- [ ] **Step 14.5: Commit**

```bash
cd /home/bruno/www/universe/x1biu
git add frontend/src/app/match/[id]/result/ frontend/src/app/ranking/ .env.example
git commit -m "feat: result and ranking pages"
```

---

## Task 15: Verificação final e smoke test

**Files:** apenas execução

- [ ] **Step 15.1: Rodar suite completa do backend**

```bash
cd backend && uv run pytest . -v --tb=short
```

Expected: todos os testes passando.

- [ ] **Step 15.2: Subir infra Docker**

```bash
cd /home/bruno/www/universe/x1biu && make rundb
```

Expected: postgres, redis e outros serviços rodando.

- [ ] **Step 15.3: Rodar migrações**

```bash
make migrate
```

Expected: `Applying ... OK` para todas as apps.

- [ ] **Step 15.4: Criar superuser e music de teste**

```bash
make createsuperuser
```

No Django shell, criar uma song de teste:
```bash
cd backend && uv run python manage.py shell -c "
from apps.songs.models import Song
Song.objects.create(
    title='Parabéns pra Você',
    artist='Tradicional',
    audio_url='https://example.com/parabens.mp3',
    duration_ms=30000,
    pitch_reference=[{'frame': i, 'hz': 440.0} for i in range(600)],
    is_active=True,
)
print('Song criada')
"
```

- [ ] **Step 15.5: Iniciar backend**

```bash
cd /home/bruno/www/universe/x1biu && make backend
```

Expected: `Application startup complete.` na porta 8000.

- [ ] **Step 15.6: Iniciar frontend**

Em outro terminal:
```bash
cd /home/bruno/www/universe/x1biu && make frontend
```

Expected: `Local: http://localhost:3000`

- [ ] **Step 15.7: Smoke test manual**

1. Abrir `http://localhost:3000` — deve aparecer a tela do lobby
2. Clicar em "Cadastrar" e criar duas contas em abas diferentes
3. Em ambas as abas, clicar em "Buscar Partida"
4. Aguardar até 10s para o Celery Beat disparar o matchmaking
5. Ambas as abas devem redirecionar para `/match/{id}`
6. A partida começa quando os dois conectam

- [ ] **Step 15.8: Commit final**

```bash
cd /home/bruno/www/universe/x1biu
git add -A
git commit -m "feat: x1biu complete — full-stack whistle battle app"
```

---

## Notas de Implementação

### Ordem crítica das tasks
1. Tasks 1-3 devem ser feitas em ordem (deps → management → songs)
2. Task 4 (matches models) requer songs e management
3. Task 8 (WebSocket) requer tasks 4-7
4. Tasks 10-14 (frontend) podem ser feitas em paralelo com tasks 1-8 após o Task 10

### Cuidados com WebSocket em testes
- Em dev, o Channels usa `InMemoryChannelLayer` (configurado em `dev.py`)
- Em produção, usar `RedisChannelLayer` (já configurado em `base.py`)
- Testes de consumers precisam de `@pytest.mark.django_db(transaction=True)`

### ml5.js e SSR
- ml5.js deve ser importado com `import("ml5")` (dynamic import) para evitar erros de SSR no Next.js
- O `usePitchDetection` hook só funciona no browser (usa `navigator.mediaDevices`)

### Formato de eventos WebSocket (Channels)
- O Channels converte `type` nos events substituindo `.` por `_` para determinar o método handler
- `{"type": "match.start"}` → chama `match_start(event)`
- `{"type": "match.found"}` → chama `match_found(event)`
