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
