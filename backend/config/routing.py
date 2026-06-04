from django.urls import re_path

from apps.matches.consumers import MatchConsumer, QueueConsumer

websocket_urlpatterns = [
    re_path(r"^ws/queue/$", QueueConsumer.as_asgi()),
    re_path(r"^ws/match/(?P<match_id>\d+)/$", MatchConsumer.as_asgi()),
]
