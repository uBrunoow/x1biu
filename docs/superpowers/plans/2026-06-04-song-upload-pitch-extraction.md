# Song Upload com Extração Automática de Pitch — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir upload de MP3 no Django admin com extração automática de pitch via librosa, populando `pitch_reference`, `duration_ms` e `audio_url` assincronamente via Celery.

**Architecture:** Adiciona `audio_file` (FileField) e `processing_status` ao model `Song`; `audio_url` torna-se opcional. Uma Celery task `extract_song_pitch` carrega o MP3 com librosa, extrai F0 com pyin (hop de 50ms), e atualiza o model com `is_active=True` ao concluir. O admin detecta novo arquivo no `save_model()` e dispara a task.

**Tech Stack:** Django 5, Celery 5, librosa, soundfile, pytest-django, pytest-mock

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `apps/songs/models.py` | Modificar | Adiciona `audio_file`, `processing_status`; torna `audio_url` opcional |
| `apps/songs/tasks.py` | Criar | Task `extract_song_pitch` |
| `apps/songs/admin.py` | Modificar | `save_model` + `list_display` |
| `apps/songs/tests/test_tasks.py` | Criar | Testes da task |
| `apps/songs/tests/test_models.py` | Modificar | Atualizar fixtures para `audio_url` opcional |
| `apps/songs/migrations/0002_*.py` | Criar | Migration dos novos campos |
| `pyproject.toml` | Modificar | Adiciona `librosa`, `soundfile` |

---

## Task 1: Dependências

**Files:**
- Modify: `backend/pyproject.toml`

- [ ] **Adicionar librosa e soundfile ao pyproject.toml**

Em `backend/pyproject.toml`, adicionar ao array `dependencies`:
```toml
dependencies = [
    ...
    "librosa>=0.10.0",
    "soundfile>=0.12.1",
]
```

- [ ] **Instalar as dependências**

```bash
cd backend && uv sync
```

Esperado: resolve e instala librosa + soundfile sem erros. librosa traz numpy, scipy como dependências transitivas.

- [ ] **Verificar instalação**

```bash
uv run python -c "import librosa, soundfile; print('ok')"
```

Esperado: `ok`

- [ ] **Commit**

```bash
git add pyproject.toml uv.lock
git commit -m "feat: add librosa and soundfile dependencies"
```

---

## Task 2: Model — novos campos + migration

**Files:**
- Modify: `apps/songs/models.py`
- Create: `apps/songs/migrations/0002_song_audio_file_processing_status.py` (gerado pelo Django)

- [ ] **Atualizar o model Song**

Substituir o conteúdo de `backend/apps/songs/models.py`:

```python
from django.db import models
from config.utils.models import BaseModel


class Song(BaseModel):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    ERROR = "error"

    STATUS_CHOICES = [
        (PENDING, "Pendente"),
        (PROCESSING, "Processando"),
        (READY, "Pronto"),
        (ERROR, "Erro"),
    ]

    title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    audio_file = models.FileField(upload_to="songs/", blank=True, null=True)
    audio_url = models.URLField(blank=True)
    duration_ms = models.PositiveIntegerField(default=0)
    pitch_reference = models.JSONField(default=list)
    processing_status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=PENDING
    )
    is_active = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"{self.artist} — {self.title}"
```

Mudanças:
- `audio_url`: `URLField()` → `URLField(blank=True)`
- `audio_file`: novo FileField
- `processing_status`: novo CharField
- `duration_ms`: adiciona `default=0`
- `pitch_reference`: adiciona `default=list`
- `is_active`: muda default para `False` (a task ativa)

- [ ] **Gerar a migration**

```bash
cd backend && uv run python manage.py makemigrations songs
```

Esperado: cria `apps/songs/migrations/0002_song_audio_file_processing_status.py`

- [ ] **Aplicar a migration**

```bash
uv run python manage.py migrate
```

Esperado: `OK` sem erros.

- [ ] **Commit**

```bash
git add apps/songs/models.py apps/songs/migrations/
git commit -m "feat: add audio_file and processing_status to Song model"
```

---

## Task 3: Celery task de extração

**Files:**
- Create: `apps/songs/tasks.py`
- Create: `apps/songs/tests/test_tasks.py`

- [ ] **Escrever o teste primeiro**

Criar `backend/apps/songs/tests/test_tasks.py`:

```python
import numpy as np
import pytest
from unittest.mock import patch
from apps.songs.models import Song


@pytest.mark.django_db
class TestExtractSongPitch:
    @patch("apps.songs.tasks.librosa.pyin")
    @patch("apps.songs.tasks.librosa.load")
    def test_extraction_populates_fields(self, mock_load, mock_pyin, db):
        sr = 22050
        duration_s = 2
        y = np.zeros(sr * duration_s, dtype=np.float32)
        mock_load.return_value = (y, sr)

        n_frames = 40  # duration_s / 0.05s por frame = 2 / 0.05 = 40
        f0 = np.full(n_frames, 440.0)
        voiced = np.ones(n_frames, dtype=bool)
        mock_pyin.return_value = (f0, voiced, np.ones(n_frames))

        song = Song.objects.create(title="T", artist="A")
        # Setar nome do arquivo diretamente no banco sem criar arquivo real
        Song.objects.filter(id=song.id).update(audio_file="songs/test.mp3")

        from apps.songs.tasks import extract_song_pitch

        with (
            patch("django.core.files.storage.FileSystemStorage.path", return_value="/fake/test.mp3"),
            patch("django.core.files.storage.FileSystemStorage.url", return_value="http://localhost/media/songs/test.mp3"),
        ):
            extract_song_pitch(song.id)

        song.refresh_from_db()
        assert song.processing_status == Song.READY
        assert song.is_active is True
        assert song.duration_ms == duration_s * 1000
        assert len(song.pitch_reference) == n_frames
        assert song.pitch_reference[0] == {"frame": 0, "hz": 440.0}
        assert song.audio_url == "http://localhost/media/songs/test.mp3"

    @patch("apps.songs.tasks.librosa.load")
    def test_extraction_sets_error_on_failure(self, mock_load, db):
        mock_load.side_effect = Exception("audio error")

        song = Song.objects.create(title="T", artist="A")
        Song.objects.filter(id=song.id).update(audio_file="songs/test.mp3")

        from apps.songs.tasks import extract_song_pitch

        with (
            patch("django.core.files.storage.FileSystemStorage.path", return_value="/fake/test.mp3"),
            pytest.raises(Exception, match="audio error"),
        ):
            extract_song_pitch(song.id)

        song.refresh_from_db()
        assert song.processing_status == Song.ERROR
        assert song.is_active is False
```

- [ ] **Rodar o teste para verificar que falha**

```bash
cd backend && uv run pytest apps/songs/tests/test_tasks.py -v
```

Esperado: `ImportError` ou `ModuleNotFoundError` — tasks.py não existe ainda.

- [ ] **Criar apps/songs/tasks.py**

```python
import numpy as np
import librosa
from celery import shared_task
from .models import Song


@shared_task(name="apps.songs.tasks.extract_song_pitch")
def extract_song_pitch(song_id: int) -> None:
    song = Song.objects.get(id=song_id)
    song.processing_status = Song.PROCESSING
    song.save(update_fields=["processing_status"])

    try:
        hop_length = None  # calculado após carregar sr
        y, sr = librosa.load(song.audio_file.path, sr=None, mono=True)
        hop_length = int(sr * 0.05)  # 50ms por frame

        f0, voiced, _ = librosa.pyin(
            y, fmin=80, fmax=2000, sr=sr, hop_length=hop_length
        )

        pitch_reference = [
            {"frame": i, "hz": float(f0[i])}
            for i in range(len(f0))
            if voiced[i] and not np.isnan(f0[i])
        ]

        song.pitch_reference = pitch_reference
        song.duration_ms = int(len(y) / sr * 1000)
        song.audio_url = song.audio_file.url
        song.processing_status = Song.READY
        song.is_active = True
        song.save(update_fields=[
            "pitch_reference", "duration_ms", "audio_url",
            "processing_status", "is_active",
        ])
    except Exception:
        song.processing_status = Song.ERROR
        song.save(update_fields=["processing_status"])
        raise
```

- [ ] **Rodar os testes**

```bash
cd backend && uv run pytest apps/songs/tests/test_tasks.py -v
```

Esperado: ambos os testes passam.

- [ ] **Commit**

```bash
git add apps/songs/tasks.py apps/songs/tests/test_tasks.py
git commit -m "feat: add extract_song_pitch celery task"
```

---

## Task 4: Admin com upload e disparo da task

**Files:**
- Modify: `apps/songs/admin.py`

- [ ] **Atualizar o admin**

Substituir o conteúdo de `backend/apps/songs/admin.py`:

```python
from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Song
from .tasks import extract_song_pitch


@admin.register(Song)
class SongAdmin(ModelAdmin):
    list_display = ["title", "artist", "duration_ms", "processing_status", "is_active"]
    list_filter = ["is_active", "processing_status"]
    search_fields = ["title", "artist"]
    readonly_fields = ["audio_url", "duration_ms", "pitch_reference", "processing_status"]

    def save_model(self, request, obj, form, change):
        new_file = "audio_file" in form.changed_data
        super().save_model(request, obj, form, change)
        if new_file and obj.audio_file:
            extract_song_pitch.delay(obj.id)
```

- [ ] **Verificar que o admin ainda importa sem erros**

```bash
cd backend && uv run python manage.py check
```

Esperado: `System check identified no issues (0 silenced).`

- [ ] **Commit**

```bash
git add apps/songs/admin.py
git commit -m "feat: trigger pitch extraction from Song admin on file upload"
```

---

## Task 5: Atualizar testes existentes

**Files:**
- Modify: `apps/songs/tests/test_models.py`

Os testes existentes criam Song com `audio_url` obrigatório. Agora o campo é opcional e `is_active` tem default `False`.

- [ ] **Rodar os testes existentes para ver o que quebra**

```bash
cd backend && uv run pytest apps/songs/tests/test_models.py -v
```

Esperado: `test_inactive_songs_excluded` pode falhar porque `is_active` agora é `False` por default.

- [ ] **Atualizar test_models.py**

Substituir o conteúdo de `backend/apps/songs/tests/test_models.py`:

```python
import pytest
from apps.songs.models import Song


@pytest.mark.django_db
class TestSongModel:
    def test_create_song_with_url(self):
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

    def test_default_status_is_pending(self):
        song = Song.objects.create(title="T", artist="A")
        assert song.processing_status == Song.PENDING
        assert song.is_active is False

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

- [ ] **Rodar todos os testes de songs**

```bash
cd backend && uv run pytest apps/songs/ -v
```

Esperado: todos passam.

- [ ] **Rodar a suite completa para checar regressões**

```bash
cd backend && uv run pytest . -v --tb=short
```

Esperado: todos os testes passam. Fixtures que criam Song com `is_active=True` em outros testes passam `is_active=True` explicitamente — verificar que `test_tasks.py` de matches ainda passa.

- [ ] **Commit**

```bash
git add apps/songs/tests/test_models.py
git commit -m "test: update Song model tests for optional audio_url and new defaults"
```

---

## Verificação final

- [ ] **Subir o backend (se não estiver rodando)**

```bash
make backend
```

- [ ] **Acessar o Django admin em http://localhost:8000/admin/songs/song/add/**

Verificar:
- Campo "Audio file" aparece para upload
- Campos `audio_url`, `duration_ms`, `pitch_reference`, `processing_status` são readonly
- Upload de um MP3 real salva a song e dispara a task

- [ ] **Verificar que o Celery processa a task**

No terminal do Celery worker, deve aparecer:
```
[INFO/MainProcess] Task apps.songs.tasks.extract_song_pitch[...] succeeded
```

- [ ] **Verificar o banco após extração**

```bash
cd backend && uv run python manage.py shell -c "
from apps.songs.models import Song
s = Song.objects.last()
print(s.processing_status, s.is_active, s.duration_ms, len(s.pitch_reference))
"
```

Esperado: `ready True <ms> <N frames>`

- [ ] **Testar o matchmaking**

Com dois usuários na fila e a song pronta, o Celery beat deve criar uma partida em até 5 segundos.
