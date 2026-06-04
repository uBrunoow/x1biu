from django.urls import path
from .views import QueueView

urlpatterns = [
    path("join/", QueueView.as_view(), name="queue-join"),
    path("leave/", QueueView.as_view(), name="queue-leave"),
]
