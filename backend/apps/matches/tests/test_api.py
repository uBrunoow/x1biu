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
