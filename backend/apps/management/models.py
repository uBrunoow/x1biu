from cuser.models import AbstractCUser
from django.db import models


class User(AbstractCUser):
    nickname = models.CharField(max_length=50, unique=True)
    wins = models.PositiveIntegerField(default=0)
    losses = models.PositiveIntegerField(default=0)

    class Meta(AbstractCUser.Meta):
        swappable = "AUTH_USER_MODEL"

    @property
    def winrate(self) -> float:
        total = self.wins + self.losses
        return self.wins / total if total > 0 else 0
