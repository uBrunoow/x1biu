FROM python:3.12-bookworm

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gcc libpq-dev libffi-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip && pip install uv

# Instala dependências antes de copiar o código (cache de camadas)
COPY backend/pyproject.toml ./
RUN uv pip compile pyproject.toml -o requirements.txt && \
    uv pip sync --system --no-cache requirements.txt

COPY backend/ .

EXPOSE 8000

CMD ["uvicorn", "config.asgi:application", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
