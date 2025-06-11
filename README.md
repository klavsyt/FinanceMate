# FinanceMate

Open Source финансовый ассистент: бюджеты, транзакции, категории, отчёты, уведомления.

## Возможности
- FastAPI backend (Docker, PostgreSQL, Alembic, Celery, Redis, Sentry, Prometheus)
- JS frontend (адаптивный, PWA, toast-уведомления, offline)
- Rate limiting, healthcheck, мониторинг, HTTPS, CI/CD-ready

## Быстрый старт (локально)
Для ознакомления с проектом вы можете запустить его локально с помощью Docker:

```bash
git clone https://github.com/yourusername/FinanceMate.git
cd FinanceMate
cp .env.example .env  # заполните своими значениями
sudo docker compose up -d --build
```

> Production/деплой на сервер не поддерживается публично. Используйте проект только для ознакомления и локального тестирования.

## Лицензия
MIT
