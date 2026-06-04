import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
class TestUserModel:
    def test_create_user_with_email(self):
        user = User.objects.create_user(
            email="player@test.com",
            password="pass123",
            nickname="player1",
        )
        assert user.email == "player@test.com"
        assert user.nickname == "player1"
        assert user.wins == 0
        assert user.losses == 0

    def test_winrate_no_games(self):
        user = User(wins=0, losses=0)
        assert user.winrate == 0

    def test_winrate_with_games(self):
        user = User(wins=3, losses=1)
        assert user.winrate == pytest.approx(0.75)

    def test_winrate_all_wins(self):
        user = User(wins=5, losses=0)
        assert user.winrate == 1.0

    def test_nickname_unique(self):
        User.objects.create_user(email="a@test.com", password="pass", nickname="batman")
        with pytest.raises(Exception):
            User.objects.create_user(email="b@test.com", password="pass", nickname="batman")
