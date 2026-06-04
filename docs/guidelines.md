---
title: Guidelines
tags:
  - guidelines
  - convenções
  - backend
  - frontend
aliases:
  - Convenções
  - Padrões de Código
---

# Guidelines

> Convenções de desenvolvimento do projeto — Django + DRF.

Veja implementações reais: [[backend/entidades]] · [[backend/services]] · [[backend/api]] · [[backend/crons]] · [[frontend/manifesto]] · [[frontend/componentes]] · [[frontend/estado]]

---

# Back-end

## adapters.py

Adapters transformam dados de **uma origem específica** em um **formato de saída padronizado**. São usados quando há múltiplas fontes de entrada (OFX, Open Finance, Excel) que precisam produzir a mesma estrutura de dados para persistência.

**Regras:**

- Organizados por domínio, não por model
- Nome deve deixar explícito a origem e o destino
- Nunca usar `dict` genérico sem tipagem — sempre deixar explícito o que entra e o que sai
- Responsabilidade única: transformar e normalizar dados; **nunca** conter regras de negócio
- Não depender de `request`, sessão ou contexto global
- Facilmente testável de forma isolada

```python
class ConciliationsAdapters:
    @staticmethod
    def adapt_ofx_transactions(ofx_transactions, bank_account):
        adapted_transactions = []


    @staticmethod
    def adapt_open_finance_transactions(open_finance_transactions, bank_account):
        adapted_transactions = []

```

---

## admin.py

O admin expõe os models no painel Django Admin. Todo model **obrigatoriamente** deve ter uma classe Admin registrada.

**Regras:**

- Nome da classe: `[MODEL]Admin`
- Sempre definir `list_display` priorizando `id`, `status`, datas e valores monetários
- Sempre implementar `search_fields` e `list_filter`
- Actions destinadas a operações em massa — devem ser idempotentes, seguras e logáveis
- Preferir soft-delete no admin quando o projeto suportar
- Campos gerados automaticamente devem ser `readonly_fields`
- Logs e históricos: somente leitura
- Nunca expor ações destrutivas sem confirmação
- **Nunca** conter lógica crítica de negócio — delegar para `services.py`

```python
@admin.register(Transaction)
class TransactionAdmin(BaseAdmin, SimpleHistoryAdmin):
    list_display = (
        "id",
        "status",
        "transaction_date",
        "realized_date",
        "expiration_date",
        "description",
        "to_receive",
        "to_pay",
        "entry_flow",
    )
    list_filter = (
        "transaction_date",
        "realized_date",
        "expiration_date",
        "plan",
        "person",
    )
    date_hierarchy = "created_at"
    autocomplete_fields = (
        "plan",
        "person",
        "project",
        "bank_account",
        "unit",
        "scheduled_transaction",
        "imported_transaction",
    )
    search_fields = (
        "description",
        "plan__name",
        "person__name",
        "project__name",
        "bank_account__name",
        "unit__name",
        "scheduled_transaction__description",
        "imported_transaction__description",
    )
```

---

## choices.py

Centraliza todas as choices usadas nos models e na codebase. Um único lugar de referência para evitar duplicação e inconsistência.

**Regras:**

- Todas as choices do projeto ficam aqui — sem duplicar em outros arquivos
- Usar `models.TextChoices` ou `models.IntegerChoices`
- Nome da classe: `[CONTEXTO]Choices`

```python
class TransactionStatusChoices(models.TextChoices):
    PAID = "PAID", "Pago"
    RECEIVED = "RECEIVED", "Recebido"
    OPEN = "OPEN", "Aberto"
    CANCELLED = "CANCELLED", "Cancelado"
```

---

## consumers.py

Consumers processam conexões WebSocket — definem o que acontece quando uma conexão é estabelecida, quando dados chegam e quando a conexão é encerrada.

**Regras:**

- Usar `AsyncWebsocketConsumer` para conexões assíncronas
- Agrupar consumers relacionados em uma classe container (ex: `TransactionsConsumers`)
- Sempre fazer `group_add` no `connect` e `group_discard` no `disconnect`
- Processar dados recebidos e emitir eventos de volta via `channel_layer`

```python
import json

from channels.exceptions import StopConsumer
from channels.generic.websocket import AsyncWebsocketConsumer


class TransactionsConsumers:
    class DREUpdateConsumer(AsyncWebsocketConsumer):
        async def connect(self):
            self.client_id = self.scope["url_route"]["kwargs"]["client_id"]
            self.year = self.scope["url_route"]["kwargs"]["year"]
            self.unit = self.scope["url_route"]["kwargs"]["unit"]

            unit_key = "all" if self.unit == "all" else self.unit
            self.group_name = f"dre_updates_{self.client_id}_{self.year}_{unit_key}"

            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()

        async def disconnect(self, close_code):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            raise StopConsumer()

        async def dre_update_complete(self, event):
            await self.send(
                text_data=json.dumps(
                    {
                        "message": "DRE update complete",
                        "client_id": event["client_id"],
                        "year": event["year"],
                        "unit": event.get("unit"),
                        "data": event.get("data"),
                        "type": "dre_updated",
                    }
                )
            )
```

---

## filters.py

Criado quando `filterset_fields` não é suficiente — por exemplo, filtros por intervalo (min/max), múltiplos campos simultâneos ou lógica de filtragem customizada.

**Regras:**

- Usar apenas quando `filterset_fields` não atende
- Nome da classe: `[MODEL]Filter`
- Sempre definir `class Meta` com `model` e `fields`
- Métodos de filtro custom devem ter nomes descritivos prefixados por `filter_by_`

```python
class TransactionFilter(django_filters.FilterSet):
    client = django_filters.CharFilter(
        field_name="unit__client__id", lookup_expr="exact"
    )
    year = django_filters.BaseInFilter(method="filter_by_year")
    month = django_filters.BaseInFilter(method="filter_by_month")
    day = django_filters.BaseInFilter(method="filter_by_day")

    def filter_by_value(self, queryset, name, value):
        from django.db.models import Q

        if value:
            return queryset.filter(Q(to_receive=value) | Q(to_pay=value))
        return queryset

    def filter_by_year(self, queryset, name, value):
        from django.db.models import Q

        if not value:
            return queryset
        return queryset.filter(
            Q(transaction_date__year__in=value) | Q(realized_date__year__in=value)
        )

    def filter_by_month(self, queryset, name, value):
        from django.db.models import Q

        if not value:
            return queryset
        return queryset.filter(
            Q(transaction_date__month__in=value) | Q(realized_date__month__in=value)
        )

    def filter_by_day(self, queryset, name, value):
        from django.db.models import Q

        if not value:
            return queryset
        return queryset.filter(
            Q(transaction_date__day__in=value) | Q(realized_date__day__in=value)
        )

    class Meta:
        model = Transaction
        fields = [
            "client",
            "month",
            "year",
            "day",
            "transaction_date",
            "plan",
            "plan_isnull",
            "project",
            "status",
            "start_date",
            "end_date",
            "entry_flow",
            "outflow",
            "value",
        ]
```

---

## helpers.py

Funções auxiliares reutilizáveis que não carregam regra de negócio — cálculos simples, formatações, utilitários.

**Regras:**

- Nome da classe: `[CONTEXTO]Helper` (ex: `TransactionHelper`, `BaseHelpers`)
- Todos os métodos como `@staticmethod`
- Sem acesso a `request`, sessão ou estado global
- Sem regra de negócio — apenas operações auxiliares puras

```python
class TransactionHelper:
    @staticmethod
    def percentage_change(current_queryset, last_month_queryset, field=None):
        current_total = BaseHelpers.sum(current_queryset, field)
        last_month_total = BaseHelpers.sum(last_month_queryset, field)

        if last_month_total == 0:
            return "N/A"
        return ((current_total - last_month_total) / last_month_total) * 100
```

---

## managers.py

Managers customizam o `QuerySet` padrão do model — usados principalmente em projetos com **soft-delete**, onde registros inativos não aparecem por padrão mas precisam ser acessíveis em contextos específicos.

**Regras:**

- Usar apenas quando o comportamento padrão do `objects` não atende
- Caso mais comum: soft-delete (filtrar `is_active=True` por padrão)
- Expor métodos nomeados para acessar registros alternativos (ex: `.inactive()`, `.all_transactions()`)

```python
class TransactionManager(models.Manager):
    def get_queryset(self, is_active=True):
        return super().get_queryset().filter(is_active=is_active)

    def inactive(self):
        return super().get_queryset().filter(is_active=False)

    def all_transactions(self):
        return super().get_queryset()
```

---

## models.py

Models definem as entidades e o esquema do banco de dados. São a fonte de verdade dos dados da aplicação. Ver implementações reais em [[backend/entidades]].

**Regras:**

- Sempre herdar de `BaseModel` (de `utils.models`) — traz `id`, `created_at`, `updated_at`, `created_by`, `updated_by`
- Sempre incluir `ExportModelOperationsMixin` para observabilidade no Prometheus
- Sempre incluir `HistoricalRecords()` para auditoria de alterações
- Sempre terminar a lista de atributos com `,` para que o linter mantenha um campo por linha
- Obrigatório: `class Meta` com `verbose_name`, `verbose_name_plural` e `ordering`
- Obrigatório: `__str__` com retorno legível (ex: `f"{self.first_name} {self.last_name} <{self.email}>"`)
- Adicionar `constraints` e `indexes` no `Meta` quando necessário
- Métodos do model devem retornar valores derivados — sem lógica de negócio complexa
- Usar `@property` para atributos computados e `@staticmethod` para utilitários sem `self`

```python
class ClientMember(ExportModelOperationsMixin("clientmember"), BaseModel):
    """Representa a associação entre um User e um Client com um role específico."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="client_memberships",
        help_text=_("Usuário membro"),
        verbose_name=_("Usuário"),
    )
    client = models.ForeignKey(
        "Client",
        on_delete=models.CASCADE,
        related_name="members",
        help_text=_("Cliente/Empresa"),
        verbose_name=_("Cliente/Empresa"),
    )
    role = models.CharField(
        max_length=20,
        choices=ClientMemberRoleChoices.choices,
        default=ClientMemberRoleChoices.MEMBER,
        help_text=_("Papel do membro na empresa"),
        verbose_name=_("Papel"),
    )
    is_active = models.BooleanField(
        default=True,
        help_text=_("Membro ativo"),
        verbose_name=_("Ativo"),
    )
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="sent_memberships",
        null=True,
        blank=True,
        help_text=_("Usuário que convidou"),
        verbose_name=_("Convidado por"),
    )
    joined_at = models.DateTimeField(
        auto_now_add=True,
        help_text=_("Data de entrada"),
        verbose_name=_("Entrou em"),
    )
    history = HistoricalRecords()

    class Meta:
        verbose_name = _("Membro do Cliente")
        verbose_name_plural = _("Membros do Cliente")
        unique_together = ("user", "client",)
        indexes = [
            models.Index(fields=["user", "client"]),
            models.Index(fields=["client", "role"]),
        ]

    def __str__(self):
        return f"{self.user} - {self.client} ({self.get_role_display()})"

    @property
    def is_owner(self):
        return self.role == ClientMemberRoleChoices.OWNER

    @property
    def is_admin(self):
        return self.role in [
            ClientMemberRoleChoices.OWNER,
            ClientMemberRoleChoices.ADMIN,
        ]

    @property
    def can_manage_members(self):
        return self.role in [
            ClientMemberRoleChoices.OWNER,
            ClientMemberRoleChoices.ADMIN,
        ]

    @property
    def can_edit_data(self):
        return self.role in [
            ClientMemberRoleChoices.OWNER,
            ClientMemberRoleChoices.ADMIN,
            ClientMemberRoleChoices.MEMBER,
        ]
```

---

## routing.py

Equivalente ao `urls.py`, mas exclusivo para rotas WebSocket. Mapeia URLs para consumers.

**Regras:**

- Usar `re_path` para padrões com grupos nomeados
- Importar consumers do mesmo app
- Expor `websocket_urlpatterns` (nome padrão esperado pelo Django Channels)

```python
from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(
        r"ws/dre/(?P<client_id>[^/]+)/(?P<year>\d+)/(?P<unit>\d+|all)/$",
        consumers.TransactionsConsumers.DREUpdateConsumer.as_asgi(),
    ),
]
```

---

## serializers.py

Serializers controlam a entrada e saída de dados da API — equivalentes a DTOs. Definem quais campos são expostos e como são validados.

**Regras:**

- Serializers relacionados a models: herdar de `serializers.ModelSerializer`
- Todo model deve ter **no mínimo 3 serializers**:
  - `[MODEL]Serializer` — GET / retrieve (dados completos com relações expandidas)
  - `[MODEL]FlatSerializer` — listagem compacta para filtros e dropdowns (`id` + campos essenciais)
  - `[MODEL]RegisterSerializer` — POST / PATCH / PUT (campos aceitos na escrita)
- Usar `SerializerMethodField` para relações expandidas no serializer de GET
- Fazer imports de serializers de outros apps **dentro dos métodos** para evitar importação circular

```python
class TransactionSerializer(serializers.ModelSerializer):
    plan = serializers.SerializerMethodField()
    person = serializers.SerializerMethodField()
    project = serializers.SerializerMethodField()
    bank_account = serializers.SerializerMethodField()
    unit = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = "__all__"

    def get_plan(self, obj) -> Optional[str]:
        from plans.serializers import PlanSubCategoryFlatSerializer
        return PlanSubCategoryFlatSerializer(obj.plan).data

    def get_person(self, obj) -> Optional[str]:
        from management.serializers import PersonFlatSerializer
        return PersonFlatSerializer(obj.person).data

    def get_project(self, obj) -> Optional[str]:
        from transactions.serializers import ProjectFlatSerializer
        return ProjectFlatSerializer(obj.project).data

    def get_bank_account(self, obj) -> Optional[str]:
        from transactions.serializers import BankAccountFlatSerializer
        return BankAccountFlatSerializer(obj.bank_account).data

    def get_unit(self, obj) -> Optional[str]:
        from management.serializers import UnitFlatSerializer
        return UnitFlatSerializer(obj.unit).data


class TransactionFlatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ["id", "transaction_date", "description", "to_receive", "to_pay", "unit"]


class TransactionRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = "__all__"
```

---

## services.py

Services contêm **toda** a regra de negócio da aplicação. São chamados pelas viewsets e por qualquer outro ponto que precise processar dados com lógica complexa. Ver implementações reais em [[backend/services]].

**Regras:**

- Nome da classe: `[CONTEXTO]Service` ou `[CONTEXTO]Services`
- Sempre definir `__init__` recebendo os parâmetros base usados por todos os métodos
- Pode chamar helpers, métodos de model e outros services
- **Nunca** acessar `request` diretamente — os dados chegam via parâmetros
- A viewset **sempre** deve delegar para o service; nunca processar dados na própria view

```python
class TransactionService:
    def __init__(self, queryset):
        self.queryset = queryset

    def get_revenues(self):
        return self.queryset.filter(
            plan__plan_category__plan_group__dre_group_type=DreGroupType.REVENUE
        )

    def get_net_revenue(self):
        return self.queryset.filter(
            plan__plan_category__plan_group__dre_group_type=DreGroupType.REVENUE_DEDUCTIONS,
            plan__name__icontains="3.2",
        )
```

---

## signals.py

Signals executam lógica quando eventos acontecem em um model (ex: `post_save`, `pre_delete`).

**Regras:**

- Usar para reações a eventos de model (não para regra de negócio primária)
- Se a lógica for simples e usada em um só lugar: processar direto no signal
- Se a lógica for complexa ou reutilizada: delegar para `services.py` ou métodos do model
- Sempre usar importações locais dentro da função para evitar importações circulares
- Proteger contra recursão com `update_fields` ou flags de controle quando necessário

```python
@receiver(post_save, sender="transactions.BankAccountBalanceHistory")
def recalculate_balances_on_history_change(sender, instance, created, **kwargs):
    from .models import BankAccountBalanceHistory

    # Evita recursão: só recalcula quando não há update_fields definido
    if kwargs.get("update_fields") is None and instance.bank_account:
        BankAccountBalanceHistory.recalculate_all_for_account(instance.bank_account)
```

---

## tasks.py

Tasks são processos assíncronos executados pelo Celery em segundo plano. Funcionam como um service chamado de forma assíncrona. Ver implementações reais em [[backend/crons]].

**Regras:**

- Usar `@shared_task` com configurações explícitas (ex: `queue`)
- Podem chamar helpers e services — mesma lógica de delegação das viewsets
- Manter o corpo da task enxuto; delegar processamento para services

```python
@shared_task(queue="build_cashflows")
def create_cashflows_task(client_id, user_id):
    ...
```

---

## urls.py

Define as rotas HTTP do app usando `DefaultRouter` do DRF.

**Regras:**

- Sempre usar `routers.DefaultRouter()`
- Registrar viewsets com `router.register(r"rota", ViewSet, basename="basename")`
- Sempre incluir `basename` no registro
- Expor `urlpatterns` com `include(router.urls)` no final do arquivo

```python
from django.urls import include, path
from rest_framework import routers

from transactions import views as api

router = routers.DefaultRouter()
router.register(r"transaction", api.TransactionViewSet, basename="transaction")

urlpatterns = [
    path("", include(router.urls)),
]
```

---

## views.py

Viewsets recebem a requisição, validam parâmetros e delegam para `services.py`. **Nunca processam dados diretamente.** Ver implementações reais em [[backend/api]].

### Estrutura base (`ModelViewSet`)

Use `viewsets.ModelViewSet` quando a view lida com um único model. Use `APIView` para views que manipulam múltiplos models.

Ordem padrão dos atributos de classe:

```python
class TransactionViewSet(OrderingMixin, PaginationMixin, viewsets.ModelViewSet):
    # 1. queryset base
    queryset = models.Transaction.objects.all()
    # 2. serializer padrão
    serializer_class = serializers.TransactionSerializer
    # 3. backends de filtro
    filter_backends = [DjangoFilterBackend, SearchFilter]
    # 4. throttle
    throttle_classes = [AnonRateThrottle, UserRateThrottle]
    # 5a. filterset complexo
    filterset_class = filters.TransactionFilter
    # 5b. filterset simples (alternativa ao filterset_class)
    # filterset_fields = {"client": ["exact"], "is_active": ["exact"]}
    # 6. campos de busca
    search_fields = ["description", "person__name", "project__name"]
```

### Serializer por action

Quando a escrita e a leitura precisam de serializers diferentes:

```python
def get_serializer_class(self):
    if self.action in ["list", "retrieve"]:
        return serializers.TransactionSerializer
    elif self.action in ["update", "partial_update"]:
        return serializers.TransactionUpdateSerializer
    return serializers.TransactionRegisterSerializer
```

### Actions customizadas

Toda nova action deve usar `@extend_schema` (para documentação Scalar/Swagger) e `@action`. Sempre incluir `throttle_classes` na action.

```python
@extend_schema(
    description="Retorna todas as transações em formato flat",
    responses={200: serializers.TransactionFlatSerializer(many=True)},
)
@action(
    detail=False,
    methods=["get"],
    throttle_classes=[UserRateThrottle, AnonRateThrottle],
)
def flat(self, request):
    queryset = self.filter_queryset(self.get_queryset())
    serializer = serializers.TransactionFlatSerializer(queryset, many=True)
    return Response(serializer.data)
```

### Validação de parâmetros (`RequestHelpers`)

Para actions que exigem parâmetros obrigatórios, usar `RequestHelpers.validate_request_params`:

```python
params = RequestHelpers.validate_request_params(
    request=request,
    required_params=["year", "month", "client"],
    int_params=["year", "month"],
    str_params=["client"],
)

if isinstance(params, Response):
    return params

year = params["year"]
month = params["month"]
client_id = params["client"]
```

### Exemplo completo de ViewSet

```python
class TransactionViewSet(OrderingMixin, PaginationMixin, viewsets.ModelViewSet):
    queryset = models.Transaction.objects.all()
    serializer_class = serializers.TransactionSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    throttle_classes = [AnonRateThrottle, UserRateThrottle]
    filterset_class = filters.TransactionFilter
    search_fields = ["description", "person__name", "project__name"]

    def get_queryset(self):
        queryset = super().get_queryset()
        if getattr(self, "action", None) in {"list", "retrieve", "flat"}:
            return queryset.select_related(
                "plan", "person", "project", "bank_account", "unit"
            )
        return queryset

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return serializers.TransactionSerializer
        elif self.action in ["update", "partial_update"]:
            return serializers.TransactionUpdateSerializer
        return serializers.TransactionRegisterSerializer

    @extend_schema(
        description="Retorna todas as transações em formato flat",
        responses={200: serializers.TransactionFlatSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], throttle_classes=[UserRateThrottle, AnonRateThrottle])
    def flat(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = serializers.TransactionFlatSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], throttle_classes=[UserRateThrottle, AnonRateThrottle])
    def summary(self, request):
        params = RequestHelpers.validate_request_params(
            request=request,
            required_params=["year", "month", "client"],
            int_params=["year", "month"],
            str_params=["client"],
        )

        if isinstance(params, Response):
            return params

        year = params["year"]
        month = params["month"]
        client_id = params["client"]

        bank_accounts_queryset = models.BankAccount.objects.filter(client__id=client_id)
        queryset = self.filter_queryset(self.get_queryset())

        previous_month_date = date(year, month, 1) - relativedelta(months=1)
        last_month_queryset = models.Transaction.objects.filter(
            transaction_date__year=previous_month_date.year,
            transaction_date__month=previous_month_date.month,
            unit__client__id=client_id,
        )

        return Response(
            services.TransactionServices(
                queryset, last_month_queryset, bank_accounts_queryset
            ).build_summary()
        )
```

# Front-end

> Convenções de desenvolvimento — Next.js + TypeScript + Tailwind + shadcn/ui. Ver estado atual em [[frontend/manifesto]] · [[frontend/componentes]] · [[frontend/estado]].

---

### Estrutura de pastas

```json
src/
├── app/
│   ├── (private)/          # Páginas autenticadas (dashboards, configurações)
│   ├── (public)/           # Páginas públicas (login, cadastro, forgot-password)
│   ├── favicon.ico
│   ├── layout.tsx          # Root layout
│   └── providers.tsx       # Providers globais (QueryClient, AuthContext, Theme)
├── components/             # Componentes GLOBAIS — usados em mais de uma página
├── contexts/               # React Contexts (AuthContext, etc.)
├── generated/              # Arquivos auto-gerados pelo Kubb — nunca editar manualmente
├── hooks/                  # Custom hooks globais
├── layout/                 # Componentes de layout (Sidebar, Header, Footer, Nav)
├── lib/                    # Utilitários, formatadores, configuração de clientes
├── stories/                # Storybook stories globais
├── styles/                 # CSS global, variáveis, temas
├── test/                   # Testes E2E com Playwright — exclusivamente E2E
└── types/
    └── interfaces/         # Tipagens globais do sistema
```

**Regras:**

- `(private)` e `(public)` são route groups do Next.js — usam layout e middleware diferentes
- Componentes usados em apenas **uma página** ficam dentro de `app/.../components/` — não na pasta global
- `generated/` é exclusiva do Kubb — nunca criar ou editar arquivos manualmente aqui
- `layout/` é exclusiva para elementos estruturais da interface (Sidebar, Header, Footer)
- `test/` contém apenas testes E2E; testes unitários ficam junto ao componente (`index.test.tsx`)

---

### Naming conventions

| Artefato | Convenção | Exemplo |
|---|---|---|
| Componente / página | PascalCase | `TransactionTable`, `DashboardPage` |
| Arquivo de componente | Pasta PascalCase + index | `TransactionTable/index.tsx` |
| Hook customizado | `use` + PascalCase | `useTransactions`, `useAuthContext` |
| Context | PascalCase + `Context` | `AuthContext`, `ThemeContext` |
| Variáveis e funções | camelCase | `isLoading`, `fetchTransactions` |
| Constantes globais | UPPER_SNAKE_CASE | `API_BASE_URL`, `DEFAULT_PAGE_SIZE` |
| Schemas Zod | camelCase + `Schema` | `transactionSchema`, `loginSchema` |
| Types / Interfaces | PascalCase | `Transaction`, `UserProfile` |

---

### Server vs Client components

No Next.js App Router, componentes são **Server Components por padrão**. Prefira manter assim.

**Regras:**

- Criar `page.tsx` como Server Component sempre que possível
- Usar `"use client"` apenas quando necessário: hooks de estado (`useState`, `useEffect`), eventos do browser
- Nunca usar `"use client"` desnecessariamente — impede otimizações do Next.js
- Isolar a parte interativa em um componente filho `"use client"` ao invés de converter a página inteira
- `layout.tsx` deve ser sempre Server Component para exportar `metadata`

```tsx
// page.tsx — Server Component
import { TransactionTable } from "./components/TransactionTable";

export default async function TransactionsPage() {
  const data = await fetchTransactions();
  return <TransactionTable initialData={data} />;
}
```

```tsx
// components/TransactionTable/index.tsx — Client Component
"use client";

import { useState } from "react";

export function TransactionTable({ initialData }: TransactionTableProps) {
  const [selected, setSelected] = useState<string[]>([]);
  // ...
}
```

---

### layout.tsx

Toda página deve ter seu próprio `layout.tsx` para declarar os metadados (`title`, `description`). A separação existe porque `page.tsx` frequentemente precisa ser Client Component, mas `metadata` só pode ser exportado de Server Components.

**Regras:**

- Criar `layout.tsx` junto de toda `page.tsx` nova
- `layout.tsx` deve ser **sempre** Server Component
- `metadata` obrigatório: `title` e `description` no mínimo
- Padrão de título: `"[Nome da Tela] | [Nome do Produto]"`

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Alva Tasks",
  description: "Visão geral das transações e indicadores financeiros.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

---

### Componentes

**Regras:**

- Componentes **globais** (usados em 2+ páginas) ficam em `src/components/`
- Componentes **específicos de uma página** ficam em `app/.../components/`
- Estrutura obrigatória por componente:

```
ComponentName/
├── index.tsx           # Implementação principal
├── index.stories.tsx   # Story do Storybook
├── index.test.tsx      # Testes unitários
└── index.types.ts      # Tipagens (quando necessário separar)
```

- Usar **named export** no `index.tsx` — não default export
- Props sempre tipadas com interface própria
- Páginas de criação (`/create`) devem ter uma pasta `schema/` com o schema Zod do formulário

```tsx
// components/TransactionTable/index.tsx
import type { TransactionTableProps } from "./index.types";

export function TransactionTable({ data, onSelect }: TransactionTableProps) {
  return (
    // ...
  );
}
```

```ts
// components/TransactionTable/index.types.ts
import type { Transaction } from "@/types/interfaces";

export interface TransactionTableProps {
  data: Transaction[];
  onSelect?: (id: string) => void;
}
```

---

### Hooks

Custom hooks encapsulam lógica de estado e side effects reutilizáveis.

**Regras:**

- Nome: `use` + PascalCase descritivo (ex: `useTransactions`, `useSelectedRows`)
- Hooks globais (usados em 2+ lugares) ficam em `src/hooks/`
- Hooks específicos de um componente ficam dentro da pasta do componente
- Nunca retornar JSX — hooks retornam dados e funções
- Sempre tipar o retorno explicitamente

```tsx
// hooks/useTransactions.ts
import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "@/generated/transactions/getTransactions";

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => getTransactions(filters),
  });
}
```

---

### Contexts

Contexts distribuem estado global entre componentes sem prop drilling.

**Regras:**

- Criar um Context por domínio de estado (ex: `AuthContext`, `ThemeContext`)
- Sempre exportar um hook de acesso (`useAuth`, `useTheme`) — nunca usar `useContext` diretamente nos componentes
- Registrar todos os providers em `src/app/providers.tsx`
- `AuthContext` é **obrigatório** em todos os projetos — deve expor usuário atual, status de autenticação e funções de login/logout

```tsx
// contexts/AuthContext.tsx
"use client";

import { createContext, useContext, useState } from "react";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, logout: () => setUser(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
```

```tsx
// app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
```

---

### Formulários (Zod + react-hook-form)

Todos os formulários usam **react-hook-form** + **Zod** + componentes `Form` do shadcn/ui.

**Regras:**

- Schema Zod fica em `schema/[nome]Schema.ts` dentro da pasta da página ou componente
- Sempre usar `zodResolver` do `@hookform/resolvers/zod`
- Usar os componentes `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` do shadcn/ui
- Nunca validar formulários manualmente — tudo via Zod

```ts
// app/(private)/transactions/create/schema/transactionSchema.ts
import { z } from "zod";

export const transactionSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  amount: z.number().positive("Valor deve ser positivo"),
  transaction_date: z.string().min(1, "Data obrigatória"),
  bank_account_id: z.string().uuid("Conta inválida"),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
```

```tsx
// app/(private)/transactions/create/components/CreateForm/index.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { transactionSchema, type TransactionFormData } from "../../schema/transactionSchema";

export function CreateTransactionForm() {
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
  });

  function onSubmit(data: TransactionFormData) {
    // chamar mutation do Kubb
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

---

### Data fetching com Kubb

O Kubb gera automaticamente hooks e tipos a partir do schema OpenAPI do backend. Todo acesso à API deve usar o código gerado.

**Regras:**

- `src/generated/` é exclusiva do Kubb — nunca editar manualmente
- Regenerar após mudanças no backend: `pnpm kubb`
- Usar os hooks gerados com `@tanstack/react-query` para leitura e mutations para escrita
- Para mutações, sempre tratar `onSuccess` e `onError` com feedback ao usuário (toast, redirect)

```tsx
"use client";

import { useGetTransactions } from "@/generated/transactions/useGetTransactions";
import { useCreateTransaction } from "@/generated/transactions/useCreateTransaction";

export function TransactionsList() {
  const { data, isLoading } = useGetTransactions({ year: 2024, month: 1 });

  const { mutate: createTransaction } = useCreateTransaction({
    onSuccess: () => toast.success("Transação criada"),
    onError: () => toast.error("Erro ao criar transação"),
  });

  if (isLoading) return <Loader />;

  return (
    // ...
  );
}
```

---

### Types e Interfaces

**Regras:**

- Tipagens globais ficam em `src/types/interfaces/` — um arquivo por domínio (ex: `transaction.ts`, `user.ts`)
- Preferir `interface` para objetos que podem ser estendidos; `type` para unions e aliases
- Nunca usar `any` — usar `unknown` quando o tipo não é conhecido e fazer narrowing
- Tipos gerados pelo Kubb ficam em `generated/` — importar de lá, não duplicar

```ts
// types/interfaces/transaction.ts
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  transaction_date: string;
  status: TransactionStatus;
}

export type TransactionStatus =
  | "PAID"
  | "RECEIVED"
  | "OPEN"
  | "CANCELLED"
  | "DELAYED"
  | "REVERSED"
  | "PENDING";
```

---

### lib/

Funções utilitárias puras, formatadores e configurações de clientes externos.

**Regras:**

- Cada arquivo tem responsabilidade única
- Sem componentes React — apenas funções puras e configurações
- Exemplos comuns: `lib/utils.ts` (helper `cn` do shadcn), `lib/format.ts` (data/moeda), `lib/api.ts` (config base HTTP)

```ts
// lib/format.ts
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}
```

---

### Testes

**Testes unitários** ficam junto ao componente (`index.test.tsx`) — testam comportamento isolado.

**Testes E2E** ficam em `src/test/` — testam fluxos completos com Playwright.

**Regras unitários:**

- Usar Vitest + Testing Library
- Testar comportamento visível ao usuário — não detalhes de implementação
- Nomear descritivamente: `"deve exibir erro quando campo está vazio"`

**Regras E2E:**

- `src/test/` é exclusiva para Playwright
- Um arquivo por fluxo de negócio (ex: `transactions.spec.ts`, `auth.spec.ts`)
- Testar o caminho feliz e os principais casos de erro

```tsx
// components/CreateTransactionForm/index.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { CreateTransactionForm } from ".";

describe("CreateTransactionForm", () => {
  it("deve exibir erro quando descrição está vazia", async () => {
    render(<CreateTransactionForm />);
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));
    expect(await screen.findByText("Descrição obrigatória")).toBeInTheDocument();
  });
});
```

```ts
// test/transactions.spec.ts
import { test, expect } from "@playwright/test";

test("deve criar uma transação com sucesso", async ({ page }) => {
  await page.goto("/transactions/create");
  await page.fill('[name="description"]', "Pagamento fornecedor");
  await page.fill('[name="amount"]', "1500");
  await page.click('button[type="submit"]');
  await expect(page.getByText("Transação criada")).toBeVisible();
});
```
