from django.conf import settings
from django.db import models

from config.utils.models import BaseModel


class QueueEntry(BaseModel):
    player = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="queue_entry",
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Queue: {self.player}"


class Match(BaseModel):
    WAITING = "waiting"
    PLAYING = "playing"
    FINISHED = "finished"
    CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (WAITING, "Waiting"),
        (PLAYING, "Playing"),
        (FINISHED, "Finished"),
        (CANCELLED, "Cancelled"),
    ]

    song = models.ForeignKey("songs.Song", on_delete=models.PROTECT, related_name="matches")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=WAITING)
    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="won_matches",
    )
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"Match #{self.id} ({self.status})"


class MatchParticipant(BaseModel):
    WIN = "win"
    LOSS = "loss"
    DRAW = "draw"
    PENDING = "pending"
    RESULT_CHOICES = [
        (WIN, "Win"),
        (LOSS, "Loss"),
        (DRAW, "Draw"),
        (PENDING, "Pending"),
    ]

    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="participants")
    player = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="participations"
    )
    score = models.PositiveIntegerField(default=0)
    result = models.CharField(max_length=10, choices=RESULT_CHOICES, default=PENDING)
    pitch_data = models.JSONField(default=list)

    class Meta:
        unique_together = [("match", "player")]

    def __str__(self) -> str:
        return f"{self.player} in {self.match}"
