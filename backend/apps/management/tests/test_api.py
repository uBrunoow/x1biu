import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def client():
    return APIClient()


@pytest.mark.django_db
class TestRegistration:
    def test_register_user(self, client):
        response = client.post(
            "/auth/register/",
            {"email": "new@test.com", "nickname": "newplayer", "password": "pass12345"},
            format="json",
        )
        assert response.status_code == 201
        assert User.objects.filter(email="new@test.com").exists()

    def test_register_duplicate_nickname(self, client):
        User.objects.create_user(email="a@t.com", password="pass", nickname="taken")
        response = client.post(
            "/auth/register/",
            {"email": "b@t.com", "nickname": "taken", "password": "pass12345"},
            format="json",
        )
        assert response.status_code == 400

    def test_register_short_password(self, client):
        response = client.post(
            "/auth/register/",
            {"email": "c@t.com", "nickname": "nick", "password": "short"},
            format="json",
        )
        assert response.status_code == 400


@pytest.mark.django_db
class TestRanking:
    def test_ranking_public(self, client):
        User.objects.create_user(email="a@t.com", password="pass", nickname="alpha", wins=5, losses=1)
        User.objects.create_user(email="b@t.com", password="pass", nickname="beta", wins=3, losses=2)
        response = client.get("/ranking/")
        assert response.status_code == 200
        data = response.json()
        assert data[0]["nickname"] == "alpha"
        assert data[0]["wins"] == 5
        assert "winrate" in data[0]
