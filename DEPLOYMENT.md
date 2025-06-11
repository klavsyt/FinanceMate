# Production Deployment Guide (FinanceMate)

## 1. Подготовка окружения
- Настройте .env.prod на сервере (не коммитьте секреты в git!)
- Проверьте, что в .env.prod есть корректные значения:
  - DATABASE_URL, SYNC_DATABASE_URL
  - REDIS_URL
  - SECRET_KEY (обязательно!)
  - SENTRY_DSN (по желанию)
  - CORS_ORIGINS (через запятую, например: https://yourdomain.com)
  - ENV=production
  - SQLALCHEMY_ECHO=False

## 2. Запуск production-стека
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 3. HTTPS и nginx
- Сертификаты Let's Encrypt должны быть в ./certs
- nginx.conf настроен на работу с HTTPS и проксирует на app:8000

## 4. Безопасность
- CORS ограничен только нужными доменами
- docs_url и redoc_url отключены в production
- DEBUG/print-логи удалены
- Все секреты только из переменных окружения
- .env, .env.prod, certs/ не коммитятся (см. .gitignore)

## 5. CI/CD (рекомендации)
- Используйте GitHub Actions или другой CI для автотестов и деплоя
- Не храните секреты в репозитории, используйте secrets в CI/CD

## 6. Мониторинг и алерты
- Prometheus и Grafana включены, инструкции по настройке — в README.md

## 7. Тесты
- Тестовые файлы и переменные не используются в production
- Для тестов используйте отдельный .env.test и базу данных

---

# DEPLOYMENT (PRIVATE)

Инструкции по деплою доступны только владельцу проекта.

> TODO: Заполнить приватно для себя.

**Вопросы и предложения — через issues или pull requests!**
