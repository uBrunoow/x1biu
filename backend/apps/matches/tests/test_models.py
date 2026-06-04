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
