from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Match, MatchParticipant, QueueEntry


class MatchParticipantInline(admin.TabularInline):
    model = MatchParticipant
    extra = 0
    readonly_fields = ["player", "score", "result"]


@admin.register(Match)
class MatchAdmin(ModelAdmin):
    list_display = ["id", "status", "song", "winner", "created_at"]
    list_filter = ["status"]
    readonly_fields = ["song", "winner", "started_at", "finished_at", "created_at"]
    inlines = [MatchParticipantInline]
    actions = ["cancelar_partidas"]

    @admin.action(description="Cancelar partidas selecionadas")
    def cancelar_partidas(self, request, queryset):
        canceladas = queryset.filter(status__in=[Match.WAITING, Match.PLAYING]).update(status=Match.CANCELLED)
        self.message_user(request, f"{canceladas} partida(s) cancelada(s).")


@admin.register(QueueEntry)
class QueueEntryAdmin(ModelAdmin):
    list_display = ["player", "joined_at"]
    actions = ["remover_da_fila"]

    @admin.action(description="Remover da fila")
    def remover_da_fila(self, request, queryset):
        count, _ = queryset.delete()
        self.message_user(request, f"{count} entrada(s) removida(s) da fila.")
