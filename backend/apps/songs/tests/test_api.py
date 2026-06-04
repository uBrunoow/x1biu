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
