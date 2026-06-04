import json
import logging

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.cache import cache

logger = logging.getLogger(__name__)


class QueueConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        if user.is_anonymous:
            logger.warning("QueueConsumer: conexão rejeitada — usuário anônimo")
            await self.close(code=4001)
            return
        self.group_name = f"user_{user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.info("QueueConsumer: user %d (%s) conectado", user.id, user.nickname)

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        user = self.scope.get("user")
        if user and not user.is_anonymous:
            logger.info("QueueConsumer: user %d desconectado (code=%s)", user.id, code)
            from .models import QueueEntry
            await sync_to_async(QueueEntry.objects.filter(player=user).delete)()

    async def match_found(self, event):
        logger.info("QueueConsumer: enviando match_found para user — partida #%d", event["match_id"])
        await self.send(text_data=json.dumps({
            "type": "match_found",
            "match_id": event["match_id"],
        }))


class MatchConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self._pitch_buffer: list[dict] = []
        user = self.scope["user"]
        if user.is_anonymous:
            logger.warning("MatchConsumer: conexão rejeitada — usuário anônimo")
            await self.close(code=4001)
            return

        self.match_id = self.scope["url_route"]["kwargs"]["match_id"]
        self.user_id = user.id
        self.group_name = f"match_{self.match_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.info("MatchConsumer: user %d conectado à partida #%s", user.id, self.match_id)

        count = await self._increment_connected()
        logger.info("MatchConsumer: partida #%s — %d/2 jogador(es) conectado(s)", self.match_id, count)
        if count >= 2:
            logger.info("MatchConsumer: partida #%s — iniciando", self.match_id)
            await self._start_match()

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            logger.info("MatchConsumer: user %d desconectou da partida #%s (code=%s)", self.user_id, self.match_id, code)
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            await sync_to_async(self._flush_pitch_buffer)()
            await self._maybe_cancel_match()

    async def receive(self, text_data: str):
        data = json.loads(text_data)
        if data.get("type") == "pitch_frame":
            await self._handle_pitch_frame(data)
        elif data.get("type") == "song_ended":
            await self._handle_song_ended()

    async def _handle_pitch_frame(self, data: dict):
        hz = float(data.get("hz", 0))
        frame = int(data.get("frame", 0))
        if hz > 0:
            self._pitch_buffer.append({"frame": frame, "hz": round(hz, 1)})
        await self.channel_layer.group_send(
            f"match_{self.match_id}",
            {
                "type": "pitch.update",
                "player_id": self.user_id,
                "hz": hz,
            },
        )
        new_score = await sync_to_async(self._score_and_update)(hz, frame)
        if new_score is not None:
            await self.channel_layer.group_send(
                f"match_{self.match_id}",
                {
                    "type": "score.update",
                    "player_id": self.user_id,
                    "score": new_score,
                },
            )

    def _flush_pitch_buffer(self):
        from apps.matches.models import MatchParticipant
        if not hasattr(self, "_pitch_buffer") or not self._pitch_buffer:
            return
        MatchParticipant.objects.filter(
            match_id=self.match_id, player_id=self.user_id
        ).update(pitch_data=self._pitch_buffer)

    async def _handle_song_ended(self):
        from apps.matches.models import Match
        from apps.matches.services import MatchService

        await sync_to_async(self._flush_pitch_buffer)()
        try:
            match = await sync_to_async(Match.objects.get)(
                id=self.match_id, status=Match.PLAYING
            )
            await sync_to_async(MatchService.finalize)(match)
            logger.info("MatchConsumer: partida #%s finalizada por song_ended", self.match_id)
        except Match.DoesNotExist:
            pass  # outro jogador já finalizou

    def _score_and_update(self, hz: float, frame: int):
        from django.db.models import F
        from apps.matches.models import Match, MatchParticipant
        from apps.matches.services import ScoringService

        try:
            match = Match.objects.select_related("song").get(
                id=self.match_id, status=Match.PLAYING
            )
        except Match.DoesNotExist:
            logger.warning("_score_and_update: partida #%s não está PLAYING", self.match_id)
            return

        points = ScoringService(song=match.song).score_frame(hz, frame)
        logger.info(
            "score: user=%d frame=%d hz=%.1f → %d pts",
            self.user_id, frame, hz, points,
        )
        if points > 0:
            MatchParticipant.objects.filter(
                match=match, player_id=self.user_id
            ).update(score=F("score") + points)
            updated = MatchParticipant.objects.get(match=match, player_id=self.user_id)
            return updated.score
        return None

    async def _increment_connected(self) -> int:
        key = f"match_{self.match_id}_connected"
        # Atomic increment via Redis INCR para evitar race condition em connects simultâneos
        await sync_to_async(cache.add)(key, 0, timeout=3600)
        return await sync_to_async(cache.incr)(key)

    async def _start_match(self):
        from apps.matches.models import Match
        from apps.matches.services import MatchService

        try:
            match = await sync_to_async(
                Match.objects.select_related("song").get
            )(id=self.match_id, status=Match.WAITING)
            await sync_to_async(MatchService.start)(match)
            logger.info("MatchConsumer: partida #%s iniciada — song '%s'", self.match_id, match.song.title)
        except Match.DoesNotExist:
            logger.warning("MatchConsumer: partida #%s não encontrada ou já iniciada", self.match_id)

    async def _maybe_cancel_match(self):
        from apps.matches.models import Match
        from apps.matches.services import MatchService

        try:
            match = await sync_to_async(Match.objects.get)(
                id=self.match_id, status=Match.PLAYING
            )
            await sync_to_async(MatchService.forfeit)(match, self.user_id)
            logger.warning("MatchConsumer: partida #%s — user %d desistiu", self.match_id, self.user_id)
        except Match.DoesNotExist:
            pass

    async def match_start(self, event):
        await self.send(text_data=json.dumps({
            "type": "match_start",
            "song_url": event["song_url"],
            "song_title": event.get("song_title", ""),
            "song_artist": event.get("song_artist", ""),
            "duration_ms": event["duration_ms"],
            "pitch_ref": event.get("pitch_ref", []),
            "players": event.get("players", {}),
        }))

    async def pitch_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "pitch_update",
            "player_id": str(event["player_id"]),
            "hz": event["hz"],
        }))

    async def score_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "score_update",
            "player_id": str(event["player_id"]),
            "score": event["score"],
        }))

    async def match_end(self, event):
        await self.send(text_data=json.dumps({
            "type": "match_end",
            "scores": event["scores"],
            "winner_id": event["winner_id"],
        }))
