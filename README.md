# Social MVP

Полноценный MVP русскоязычной социальной сети на React + TypeScript + Vite, Node.js + Express + TypeScript, PostgreSQL, Prisma и JWT.

## Возможности

- Регистрация, вход и JWT-защита REST API.
- Профиль пользователя, редактирование профиля и placeholder-аватар через DiceBear initials.
- Создание постов, общая лента, лайки и комментарии.
- Подписки на пользователей, страница пользователя и поиск людей.
- Уведомления о лайках, комментариях и подписках.
- Простая админ-панель со статистикой и списком пользователей.
- Mock/demo mode на frontend: если backend недоступен, интерфейс переключается на демо-данные.
- Rate limit, Helmet, CORS, централизованная обработка ошибок и Zod-валидация на backend.
- Адаптивный современный UI для телефона и ПК.

## Структура

```text
apps/frontend  React/Vite клиент
apps/backend   Express/Prisma REST API
apps/backend/prisma/schema.prisma  модели User, Profile, Post, Comment, Like, Follow, Notification
```

## Быстрый старт

```bash
npm install
npm run build --workspace frontend
npm run build --workspace backend
docker compose up --build
```

Docker Compose поднимает PostgreSQL, применяет Prisma migrations, запускает seed и стартует backend/frontend.

Демо-аккаунты после seed:

- `admin@demo.local` / `password123` — администратор.
- `anna@demo.local` / `password123` — пользователь.
- `ivan@demo.local` / `password123` — пользователь.

## API

Базовый URL: `http://localhost:4000/api`.

### Auth

- `POST /auth/register` — `{ email, username, password, name }`.
- `POST /auth/login` — `{ email, password }`.
- `GET /auth/me` — текущий пользователь, нужен `Authorization: Bearer <token>`.

### Users

- `GET /users/search?q=` — поиск пользователей.
- `GET /users/:username` — публичная страница пользователя.
- `PUT /users/me/profile` — редактирование `{ name, bio, city, website }`.
- `POST /users/:username/follow` — подписаться.
- `DELETE /users/:username/follow` — отписаться.

### Posts

- `GET /posts` — лента.
- `POST /posts` — создать пост `{ content }`.
- `POST /posts/:id/like` — переключить лайк.
- `POST /posts/:id/comments` — добавить комментарий `{ content }`.
- `GET /posts/user/:username` — посты пользователя.

### Notifications

- `GET /notifications` — список уведомлений.
- `POST /notifications/read` — отметить прочитанными.

### Admin

- `GET /admin/stats` — метрики платформы.
- `GET /admin/users` — последние пользователи.

## Тестирование и качество

Скрипты добавлены в оба workspace:

```bash
npm test --workspace backend
npm test --workspace frontend
npm run coverage --workspace backend
npm run coverage --workspace frontend
npm run test:load --workspace backend
npm run test:load --workspace frontend
npm run test:mutation --workspace backend
npm run test:mutation --workspace frontend
```

Покрытие измеряется встроенным V8 coverage в `node --experimental-test-coverage`. В проекте есть:

- unit-тесты для критичных pure utilities;
- интеграционный health-check backend без внешних зависимостей;
- smoke-нагрузочные проверки для backend health endpoint и frontend utility loop;
- smoke mutation guards, фиксирующие критичные инварианты: JWT header, человекочитаемый demo fallback, URL-encoding аватаров и запрет утечки `passwordHash`.

## Environment

Backend:

- `DATABASE_URL` — PostgreSQL DSN.
- `JWT_SECRET` — секрет JWT.
- `PORT` — порт API, по умолчанию `4000`.
- `CORS_ORIGIN` — список origins через запятую.

Frontend:

- `VITE_API_URL` — URL backend API, по умолчанию `http://localhost:4000/api`.

## Patch notes

### 0.1.0

- Перепрофилирован проект из case arena в Social MVP.
- Добавлены Prisma-модели социальной сети и SQL migration.
- Реализованы REST endpoints для auth, users, posts, notifications и admin.
- Собран русский адаптивный React UI с demo fallback.
- Добавлена документация, seed-данные, unit/integration/load/mutation smoke checks и coverage scripts.
