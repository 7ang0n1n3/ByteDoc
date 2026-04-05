.PHONY: up down build logs ps restart clean dev install

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

ps:
	docker compose ps

restart:
	docker compose restart

clean:
	docker compose down -v

dev:
	npm run dev

install:
	npm install
