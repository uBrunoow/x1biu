import json
import pytest
from channels.testing import WebsocketCommunicator
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from apps.songs.models import Song

User = get_user_model()


def get_jwt_token(user) -> str:
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)


@pytest.fixture
def user(db):
    return User.objects.create_user(email="p@t.com", password="pass", nickname="player")


@pytest.fixture
def song(db):
    return Song.objects.create(
        title="S", artist="A", audio_url="https://x.com/a.mp3",
        duration_ms=10000,
        pitch_reference=[{"frame": 0, "hz": 440.0}],
        is_active=True,
    )


@pytest.mark.django_db(transaction=True)
async def test_queue_consumer_receives_match_found(user):
    from config.asgi import application
    token = await sync_to_async(get_jwt_token)(user)
    communicator = WebsocketCommunicator(application, f"/ws/queue/?token={token}")

    connected, _ = await communicator.connect()
    assert connected

    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        f"user_{user.id}",
        {"type": "match.found", "match_id": 42},
    )

    response = await communicator.receive_json_from()
    assert response["type"] == "match_found"
    assert response["match_id"] == 42

    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_queue_consumer_rejects_no_token():
    from config.asgi import application
    communicator = WebsocketCommunicator(application, "/ws/queue/")
    connected, code = await communicator.connect()
    if connected:
        msg = await communicator.receive_output()
        assert msg["type"] == "websocket.close"
    else:
        assert code == 4001
    await communicator.disconnect()
