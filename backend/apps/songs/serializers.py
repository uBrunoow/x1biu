from rest_framework import serializers
from .models import Song


class SongListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Song
        fields = ["id", "title", "artist", "duration_ms", "is_active"]


class SongDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Song
        fields = ["id", "title", "artist", "audio_url", "duration_ms", "pitch_reference", "is_active"]
