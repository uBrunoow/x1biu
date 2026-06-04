.PHONY: help install backend runserver deps test migrate makemigrations makemigrations-merge createsuperuser lint format frontend rundb stopdb restartdb qa api

install:
	cd backend && uv sync
	cd frontend && pnpm install

backend:
	cd backend && uv run daphne -b 0.0.0.0 -p 8000 config.asgi:application

runserver:
	cd backend && uv run python manage.py runserver 0.0.0.0:8000

deps:
	cd backend && uv sync

migrate:
	cd backend && uv run python manage.py migrate

makemigrations:
	cd backend && uv run python manage.py makemigrations

makemigrations-merge:
	cd backend && uv run python manage.py makemigrations --merge

createsuperuser:
	cd backend && uv run python manage.py createsuperuser

test:
	cd backend && uv run pytest . -v --tb=short

frontend:
	cd frontend && pnpm dev

rundb:
	sudo docker compose --env-file .env -f docker/docker-compose.dev.yml up -d --build

stopdb:
	sudo docker compose --env-file .env -f docker/docker-compose.dev.yml down

restartdb:
	sudo docker compose --env-file .env -f docker/docker-compose.dev.yml restart

api:
	cd backend && uv run python manage.py spectacular --file schema.yml
	cd frontend && pnpm run api:gen

qa:
	$(MAKE) test
	cd frontend && pnpm run qa

lint:
	cd backend && uv run pre-commit install && uv run pre-commit run -a -v
	cd frontend && pnpm run lint

format:
	cd backend && uv run ruff format .
	cd frontend && pnpm run format

