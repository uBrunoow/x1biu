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
