from django.contrib.auth import get_user_model
from rest_framework.generics import CreateAPIView, ListAPIView
from rest_framework.permissions import AllowAny

from .serializers import RankingSerializer, UserRegistrationSerializer

User = get_user_model()


class UserRegistrationView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]


class RankingView(ListAPIView):
    serializer_class = RankingSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return (
            User.objects
            .exclude(nickname="")
            .filter(wins__gt=0)
            .order_by("-wins", "losses")
        )
