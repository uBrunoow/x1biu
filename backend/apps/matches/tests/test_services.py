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

    def test_150_cents_off_scores_zero(self, song):
        svc = ScoringService(song=song)
        off_hz = 440.0 * (2 ** (150 / 1200))
        score = svc.score_frame(player_hz=off_hz, frame_index=0)
        assert score == 0

    def test_75_cents_off_scores_50(self, song):
        svc = ScoringService(song=song)
        off_hz = 440.0 * (2 ** (75 / 1200))
        score = svc.score_frame(player_hz=off_hz, frame_index=0)
        assert score == 50

    def test_octave_up_scores_perfect(self, song):
        svc = ScoringService(song=song)
        score = svc.score_frame(player_hz=880.0, frame_index=0)  # 440 Hz uma oitava acima
        assert score == 100

    def test_two_octaves_up_scores_perfect(self, song):
        svc = ScoringService(song=song)
        score = svc.score_frame(player_hz=1760.0, frame_index=0)  # 440 Hz duas oitavas acima
        assert score == 100

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
