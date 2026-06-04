from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Match, QueueEntry
from .serializers import MatchDetailSerializer, MatchListSerializer


class MatchPagination(PageNumberPagination):
    page_size = 10


class QueueView(APIView):
    def get(self, request):
        in_queue = QueueEntry.objects.filter(player=request.user).exists()
        return Response({"in_queue": in_queue})

    def post(self, request):
        if QueueEntry.objects.filter(player=request.user).exists():
            return Response({"detail": "Você já está na fila"}, status=status.HTTP_400_BAD_REQUEST)

        active = Match.objects.filter(
            participants__player=request.user, status__in=[Match.WAITING, Match.PLAYING]
        ).exists()
        if active:
            return Response({"detail": "Você já está em uma partida ativa"}, status=status.HTTP_400_BAD_REQUEST)

        entry = QueueEntry.objects.create(player=request.user)
        position = QueueEntry.objects.filter(joined_at__lte=entry.joined_at).count()
        return Response({"status": "queued", "position": position}, status=status.HTTP_201_CREATED)

    def delete(self, request):
        entry = get_object_or_404(QueueEntry, player=request.user)
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MatchViewSet(ReadOnlyModelViewSet):
    filterset_fields = ["status"]
    pagination_class = MatchPagination

    def get_queryset(self):
        return (
            Match.objects
            .filter(participants__player=self.request.user)
            .distinct()
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return MatchDetailSerializer
        return MatchListSerializer
