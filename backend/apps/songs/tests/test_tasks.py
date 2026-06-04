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
