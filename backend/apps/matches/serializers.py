from rest_framework import serializers
from .models import Match, MatchParticipant


class MatchParticipantSerializer(serializers.ModelSerializer):
    nickname = serializers.CharField(source="player.nickname", read_only=True)
    player_id = serializers.IntegerField(source="player.id", read_only=True)

    class Meta:
        model = MatchParticipant
        fields = ["id", "player_id", "nickname", "score", "result"]


class MatchParticipantDetailSerializer(serializers.ModelSerializer):
    nickname = serializers.CharField(source="player.nickname", read_only=True)
    player_id = serializers.IntegerField(source="player.id", read_only=True)

    class Meta:
        model = MatchParticipant
        fields = ["id", "player_id", "nickname", "score", "result", "pitch_data"]


class MatchListSerializer(serializers.ModelSerializer):
    song_title = serializers.CharField(source="song.title", read_only=True)
    song_artist = serializers.CharField(source="song.artist", read_only=True)
    participants = MatchParticipantSerializer(many=True, read_only=True)

    class Meta:
        model = Match
        fields = ["id", "song_title", "song_artist", "status", "started_at", "finished_at", "participants"]


class MatchDetailSerializer(serializers.ModelSerializer):
    participants = MatchParticipantDetailSerializer(many=True, read_only=True)
    song_title = serializers.CharField(source="song.title", read_only=True)
    song_artist = serializers.CharField(source="song.artist", read_only=True)
    duration_ms = serializers.IntegerField(source="song.duration_ms", read_only=True)
    pitch_reference = serializers.JSONField(source="song.pitch_reference", read_only=True)

    class Meta:
        model = Match
        fields = [
            "id", "song_title", "song_artist", "duration_ms",
            "status", "winner", "started_at", "finished_at",
            "participants", "pitch_reference",
        ]
