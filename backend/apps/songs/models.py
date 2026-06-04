from django.db import models
from config.utils.models import BaseModel


class Song(BaseModel):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    ERROR = "error"

    STATUS_CHOICES = [
        (PENDING, "Pendente"),
        (PROCESSING, "Processando"),
        (READY, "Pronto"),
        (ERROR, "Erro"),
    ]

    title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    audio_file = models.FileField(upload_to="songs/", blank=True, null=True)
    audio_url = models.URLField(blank=True)
    duration_ms = models.PositiveIntegerField(default=0)
    pitch_reference = models.JSONField(default=list)
    processing_status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=PENDING
    )
    is_active = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"{self.artist} — {self.title}"
