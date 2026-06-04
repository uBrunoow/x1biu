import logging

import numpy as np
import librosa
from celery import shared_task
from .models import Song

logger = logging.getLogger(__name__)


@shared_task(name="apps.songs.tasks.extract_song_pitch")
def extract_song_pitch(song_id: int) -> None:
    song = Song.objects.get(id=song_id)
    logger.info("extract_song_pitch: iniciando extração — song #%d '%s'", song_id, song.title)
    song.processing_status = Song.PROCESSING
    song.save(update_fields=["processing_status"])

    try:
        y, sr = librosa.load(song.audio_file.path, sr=None, mono=True)
        hop_length = int(sr * 0.05)  # 50ms por frame (mesmo intervalo do frontend)
        logger.info("extract_song_pitch: áudio carregado — sr=%d, duração=%.1fs", sr, len(y) / sr)

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
        logger.info(
            "extract_song_pitch: song #%d pronta — %d frames com pitch, %dms",
            song_id, len(pitch_reference), song.duration_ms,
        )
    except Exception:
        song.processing_status = Song.ERROR
        song.save(update_fields=["processing_status"])
        logger.exception("extract_song_pitch: falha na extração da song #%d", song_id)
        raise
