# CaseForge Arena

MVP веб-приложения для виртуального открытия кейсов в стиле CS2: React + TypeScript + Vite, Tailwind CSS, Node.js + Express, PostgreSQL, Prisma и JWT.

> Проект использует только собственные placeholder-изображения. Все монеты и предметы виртуальные: нет вывода денег, Steam-трейдов или ассетов Valve.

## Возможности

- Регистрация, вход, JWT-авторизация, профиль и баланс.
- Главная страница в формате компактной витрины: короткий hero-блок, плотная сетка популярных кейсов, live-колонка «Сейчас выигрывают», режимы и топ-дропы.
- Страница `/cases` как основной каталог: категории «Популярные», «Новые», «Дорогие», «Дешёвые», 4–5 карточек в ряд на широких экранах и fallback на demo-кейсы при пустом API.
- Кейсы с backend-расчётом выпадений, шансами и рулеткой на frontend.
- Инвентарь с поиском, фильтром по редкости и продажей предметов за виртуальные монеты.
- Upgrade: шанс считается на backend по формуле `sourcePrice / targetPrice * 0.9`, максимум 75%.
- Contract: ровно 10 предметов меняются на один предмет близкой или немного большей стоимости.
- Admin REST API для управления предметами, кейсами, шансами и пополнением баланса.
- Seed: 5 кейсов, 48 предметов, тестовый пользователь и админ.

## Устройство каталога кейсов

- Демо-данные frontend содержат 12 кейсов: «Кейс Дракон», «Кейс Пламя», «Кейс Самурай», «Кейс Император», «Кейс Фантом», «Кейс Ниндзя», «Кейс Шторм», «Кейс Легенда», «Кейс Кобра», «Кейс Титан», «Кейс Кибер», «Кейс Неон».
- Каждая карточка показывает название, количество предметов, цену, собственную SVG-обложку, короткое описание, rarity-индикаторы и кнопку «Открыть».
- Левая колонка «Сейчас выигрывают» использует `/api/history`, а если данных нет — mock-дропы с оружием, скином, редкостью и мини-изображением.
- Все визуальные обложки генерируются локально через SVG-placeholder и не копируют чужие арты, бренды или оформление.

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
npm run build --workspace apps/frontend
```

## Тестирование и покрытие

На текущий момент в репозитории нет настроенных unit-, integration-, load- или mutation-тестов: в `package.json` frontend/backend отсутствуют test/coverage/mutation scripts, а конфигурации Vitest/Jest/Playwright/Stryker не добавлены. Минимальная обязательная проверка frontend после изменений — production build:

```bash
npm run build --workspace apps/frontend
```

Рекомендуемый следующий шаг для покрытия: добавить Vitest + React Testing Library для компонентов каталога, Playwright для smoke/e2e сценариев открытия каталога и StrykerJS для mutation-тестирования бизнес-функций фильтрации/форматирования.

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

## Патчноуты

### 2026-05-31 — каталог кейсов

- Главная переделана из лендинга в компактную витрину с быстрым доступом к кейсам.
- Добавлена левая колонка live-дропов «Сейчас выигрывают».
- Страница `/cases` стала основным каталогом с категориями и плотной сеткой карточек.
- Расширены mock-данные кейсов и предметов, чтобы пустой backend не оставлял витрину без контента.
- Сохранён тёмный неоновый стиль с glow-эффектами, градиентными рамками и hover-анимациями.
