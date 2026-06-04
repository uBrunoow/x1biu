import logging

from celery import shared_task

from .models import QueueEntry
from .services import MatchmakingService

logger = logging.getLogger(__name__)


@shared_task(name="apps.matches.tasks.process_matchmaking")
def process_matchmaking():
    count = QueueEntry.objects.count()
    if count > 0:
        logger.info("process_matchmaking: %d jogador(es) na fila", count)
    while QueueEntry.objects.count() >= 2:
        match = MatchmakingService().run()
        if match is None:
            logger.warning("process_matchmaking: nenhuma song ativa encontrada")
            break
        logger.info("process_matchmaking: partida #%d criada", match.id)
