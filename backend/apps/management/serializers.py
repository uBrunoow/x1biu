from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "nickname", "password"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class RankingSerializer(serializers.ModelSerializer):
    winrate = serializers.FloatField(read_only=True)
    streak = serializers.SerializerMethodField()

    def get_streak(self, obj) -> int:
        from apps.matches.models import MatchParticipant

        results = list(
            MatchParticipant.objects.filter(
                player=obj,
                result__in=[MatchParticipant.WIN, MatchParticipant.LOSS],
            )
            .order_by("-match__finished_at")
            .values_list("result", flat=True)[:20]
        )

        streak = 0
        for r in results:
            if streak == 0:
                streak = 1 if r == MatchParticipant.WIN else -1
            elif streak > 0 and r == MatchParticipant.WIN:
                streak += 1
            elif streak < 0 and r == MatchParticipant.LOSS:
                streak -= 1
            else:
                break
        return streak

    class Meta:
        model = User
        fields = ["nickname", "wins", "losses", "winrate", "streak"]
