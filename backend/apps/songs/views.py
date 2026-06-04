from rest_framework.permissions import AllowAny
from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Song
from .serializers import SongDetailSerializer, SongListSerializer


class SongViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Song.objects.filter(is_active=True)

    def get_serializer_class(self):
        if self.action == "list":
            return SongListSerializer
        return SongDetailSerializer
