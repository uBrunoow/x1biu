---
title: Song Upload com Extração Automática de Pitch
tags:
  - spec
  - songs
  - celery
  - audio
---

# Song Upload com Extração Automática de Pitch

## Contexto

O modelo `Song` atual possui `audio_url` (URLField obrigatório) e `pitch_reference` (JSON preenchido manualmente). Sem songs no banco, o `MatchmakingService` retorna `None` e as partidas nunca são criadas. O objetivo é permitir upload de MP3 via Django admin com extração automática de pitch via librosa.

## Model — `apps/songs/models.py`

Campos novos/alterados em `Song`:

| Campo | Antes | Depois |
|---|---|---|
| `audio_url` | `URLField()` obrigatório | `URLField(blank=True)` opcional |
| `audio_file` | não existe | `FileField(upload_to='songs/', blank=True, null=True)` |
| `processing_status` | não existe | `CharField(choices, default='pending')` |

Choices de `processing_status`: `pending`, `processing`, `ready`, `error`.

`pitch_reference` e `duration_ms` continuam no model — preenchidos pela task após extração.

`is_active` continua controlado, mas a task o seta `True` quando a extração termina com sucesso.

## Celery Task — `apps/songs/tasks.py`

Task: `extract_song_pitch(song_id: int)`

Fluxo:
1. Carrega `Song` do banco, seta `processing_status='processing'`, salva
2. `y, sr = librosa.load(song.audio_file.path, sr=None, mono=True)`
3. `hop = int(sr * 0.05)` — janelas de 50ms (mesmo intervalo do `frameRef` no frontend)
4. `f0, voiced, _ = librosa.pyin(y, fmin=80, fmax=2000, sr=sr, hop_length=hop)`
5. `pitch_reference = [{"frame": i, "hz": float(f0[i])} for i in range(len(f0)) if voiced[i] and not np.isnan(f0[i])]`
6. `duration_ms = int(len(y) / sr * 1000)`
7. `audio_url = song.audio_file.url`
8. Salva `pitch_reference`, `duration_ms`, `audio_url`, `processing_status='ready'`, `is_active=True`
9. Em exceção: seta `processing_status='error'`, salva, re-raise

Frames sem pitch detectado (silêncio, nota inaudível) são omitidos — o `ScoringService` retorna 0 para frames ausentes, o que é o comportamento correto.

## Admin — `apps/songs/admin.py`

- `save_model()` detecta se `audio_file` mudou (comparando com instância original) → dispara `extract_song_pitch.delay(song.id)`
- `list_display` adiciona `processing_status`
- `readonly_fields` expõe `processing_status`, `audio_url`, `pitch_reference`, `duration_ms` (preenchidos automaticamente)
- `audio_url` editável apenas se `audio_file` não estiver presente

## Dependências

Adicionar ao `backend/pyproject.toml`:
- `librosa` — extração de pitch
- `soundfile` — backend de leitura de MP3/WAV para librosa

## Migration

Nova migration em `apps/songs/migrations/` alterando:
- `audio_url`: remove `blank=False` → `blank=True`
- Adiciona `audio_file` (FileField)
- Adiciona `processing_status` (CharField com default `'pending'`)

## File Map

```
backend/
  apps/songs/
    models.py          — adiciona audio_file, processing_status; audio_url vira blank=True
    tasks.py           — novo arquivo com extract_song_pitch
    admin.py           — save_model override + list_display
    migrations/
      0002_song_audio_file_processing_status.py  — nova migration
  pyproject.toml       — adiciona librosa, soundfile
```

## Critérios de Aceite

- Upload de MP3 no Django admin cria Song com `processing_status='pending'`
- Após task completar: `processing_status='ready'`, `is_active=True`, `audio_url` populado, `pitch_reference` com dados reais
- Matchmaking funciona: `Song.objects.filter(is_active=True)` retorna a song e uma partida é criada
- Em caso de erro na extração: `processing_status='error'`, `is_active` permanece `False`
