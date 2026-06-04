import logging
import math

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import F
from django.utils import timezone

from apps.matches.models import Match, MatchParticipant, QueueEntry
from apps.songs.models import Song

logger = logging.getLogger(__name__)


class ScoringService:
    def __init__(self, song: Song):
        self._ref = {item["frame"]: item["hz"] for item in song.pitch_reference}

    def score_frame(self, player_hz: float, frame_index: int) -> int:
        ref_hz = self._ref.get(frame_index)
        if not ref_hz or player_hz <= 0:
            return 0
        # Normaliza para a mesma oitava mais próxima antes de calcular cents
        # (assobio em 588 Hz deve pontuar para referência em 147 Hz — mesma nota, 2 oitavas acima)
        ratio = player_hz / ref_hz
        while ratio >= 2.0:
            ratio /= 2.0
        while ratio < 0.5:
            ratio *= 2.0
        cents = abs(1200 * math.log2(ratio))
        if cents >= 150:
            return 0
        return round(100 - cents * 100 / 150)


class MatchmakingService:
    def run(self) -> Match | None:
        entries = list(QueueEntry.objects.select_related("player").order_by("joined_at")[:2])
        if len(entries) < 2:
            return None

        song = Song.objects.filter(is_active=True).order_by("?").first()
        if not song:
            logger.warning("MatchmakingService: nenhuma song ativa — verifique processing_status=ready e is_active=True")
            return None

        match = Match.objects.create(song=song)
        for entry in entries:
            MatchParticipant.objects.create(match=match, player=entry.player)

        entry_ids = [e.id for e in entries]
        player_ids = [e.player.id for e in entries]
        QueueEntry.objects.filter(id__in=entry_ids).delete()

        nicknames = [e.player.nickname for e in entries]
        logger.info(
            "MatchmakingService: partida #%d criada — %s vs %s — song '%s'",
            match.id, nicknames[0], nicknames[1], song.title,
        )

        channel_layer = get_channel_layer()
        for player_id in player_ids:
            logger.debug("MatchmakingService: notificando user_%d via channel layer", player_id)
            async_to_sync(channel_layer.group_send)(
                f"user_{player_id}",
                {"type": "match.found", "match_id": match.id},
            )

        return match


class MatchService:
    @staticmethod
    def start(match: Match) -> None:
        match.status = Match.PLAYING
        match.started_at = timezone.now()
        match.save(update_fields=["status", "started_at"])

        # Monta array compacto de pitch por frame: índice = frame, valor = hz (0 = sem pitch)
        raw_ref = match.song.pitch_reference
        if raw_ref:
            max_frame = max(p["frame"] for p in raw_ref)
            pitch_ref: list[float] = [0.0] * (max_frame + 1)
            for p in raw_ref:
                pitch_ref[p["frame"]] = p["hz"]
        else:
            pitch_ref = []

        players = {
            str(p.player_id): p.player.nickname
            for p in match.participants.select_related("player").all()
        }

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"match_{match.id}",
            {
                "type": "match.start",
                "song_url": match.song.audio_url,
                "song_title": match.song.title,
                "song_artist": match.song.artist,
                "duration_ms": match.song.duration_ms,
                "pitch_ref": pitch_ref,
                "players": players,
            },
        )

    @staticmethod
    def finalize(match: Match) -> None:
        participants = list(match.participants.select_related("player").all())
        if len(participants) != 2:
            return

        p1, p2 = participants

        if p1.score == p2.score:
            MatchParticipant.objects.filter(match=match).update(result=MatchParticipant.DRAW)
            winner_player = None
        elif p1.score > p2.score:
            winner, loser = p1, p2
            winner.result = MatchParticipant.WIN
            loser.result = MatchParticipant.LOSS
            winner.save(update_fields=["result"])
            loser.save(update_fields=["result"])
            winner.player.wins = F("wins") + 1
            loser.player.losses = F("losses") + 1
            winner.player.save(update_fields=["wins"])
            loser.player.save(update_fields=["losses"])
            winner_player = winner.player
        else:
            winner, loser = p2, p1
            winner.result = MatchParticipant.WIN
            loser.result = MatchParticipant.LOSS
            winner.save(update_fields=["result"])
            loser.save(update_fields=["result"])
            winner.player.wins = F("wins") + 1
            loser.player.losses = F("losses") + 1
            winner.player.save(update_fields=["wins"])
            loser.player.save(update_fields=["losses"])
            winner_player = winner.player

        match.winner = winner_player
        match.status = Match.FINISHED
        match.finished_at = timezone.now()
        match.save(update_fields=["winner", "status", "finished_at"])

        scores = {str(p.player_id): p.score for p in participants}
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"match_{match.id}",
            {
                "type": "match.end",
                "scores": scores,
                "winner_id": str(winner_player.id) if winner_player else None,
            },
        )

    @staticmethod
    def forfeit(match: Match, loser_id: int) -> None:
        participants = list(match.participants.select_related("player").all())
        if len(participants) != 2:
            match.status = Match.CANCELLED
            match.save(update_fields=["status"])
            return

        loser = next((p for p in participants if p.player_id == loser_id), None)
        winner = next((p for p in participants if p.player_id != loser_id), None)

        if loser and winner:
            loser.result = MatchParticipant.LOSS
            winner.result = MatchParticipant.WIN
            loser.save(update_fields=["result"])
            winner.save(update_fields=["result"])
            winner.player.wins = F("wins") + 1
            loser.player.losses = F("losses") + 1
            winner.player.save(update_fields=["wins"])
            loser.player.save(update_fields=["losses"])

        match.winner = winner.player if winner else None
        match.status = Match.FINISHED
        match.finished_at = timezone.now()
        match.save(update_fields=["winner", "status", "finished_at"])

        scores = {str(p.player_id): p.score for p in participants}
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"match_{match.id}",
            {
                "type": "match.end",
                "scores": scores,
                "winner_id": str(winner.player.id) if winner else None,
            },
        )

    @staticmethod
    def cancel(match: Match) -> None:
        match.status = Match.CANCELLED
        match.save(update_fields=["status"])
