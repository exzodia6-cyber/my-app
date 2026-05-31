# CaseForge Arena

MVP веб-приложения для виртуального открытия кейсов в стиле CS2: React + TypeScript + Vite, Tailwind CSS, Node.js + Express, PostgreSQL, Prisma и JWT.

> Проект использует только собственные placeholder-изображения. Все монеты и предметы виртуальные: нет вывода денег, Steam-трейдов или ассетов Valve.

## Возможности

- Регистрация, вход, JWT-авторизация, профиль и баланс.
- Главная страница с hero-блоком, популярными кейсами, последними действиями и режимами Cases / Upgrade / Contract.
- Кейсы с backend-расчётом выпадений, шансами и рулеткой на frontend.
- Инвентарь с поиском, фильтром по редкости и продажей предметов за виртуальные монеты.
- Upgrade: шанс считается на backend по формуле `sourcePrice / targetPrice * 0.9`, максимум 75%.
- Contract: ровно 10 предметов меняются на один предмет близкой или немного большей стоимости.
- Admin REST API для управления предметами, кейсами, шансами и пополнением баланса.
- Seed: 5 кейсов, 48 предметов, тестовый пользователь и админ.

## Быстрый запуск через Docker Compose

```bash
cp apps/backend/.env.example apps/backend/.env
npm install
docker compose up --build
```

Приложение будет доступно по адресам:

- Frontend: http://localhost:5173
- Backend healthcheck: http://localhost:4000/health
- API: http://localhost:4000/api

## Локальный запуск без контейнеров приложения

1. Поднять PostgreSQL:

```bash
docker compose up postgres -d
```

2. Установить зависимости и подготовить базу:

```bash
npm install
cp apps/backend/.env.example apps/backend/.env
npm run db:migrate
npm run db:seed
```

3. Запустить backend и frontend:

```bash
npm run dev
```

## Тестовые аккаунты

- Игрок: `player@example.com` / `password123`
- Админ: `admin@example.com` / `password123`

## Полезные команды

```bash
npm run typecheck
npm run build
npm run db:migrate
npm run db:seed
```

## REST API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/cases`
- `GET /api/cases/:id`
- `POST /api/cases/:id/open`
- `GET /api/inventory`
- `POST /api/inventory/:itemId/sell`
- `POST /api/upgrade`
- `POST /api/contract`
- `GET /api/history`
- `POST /api/admin/items`, `PUT /api/admin/items/:id`
- `POST /api/admin/cases`, `PUT /api/admin/cases/:id`
- `PUT /api/admin/cases/:caseId/items/:itemId`
- `POST /api/admin/users/:id/topup`
