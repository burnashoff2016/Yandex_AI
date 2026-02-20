# Генератор маркетингового контента | Marketing Content Generator

---

# 🇷🇺 Русская версия

## Описание проекта

**Генератор маркетингового контента** — это AI-платформа для автоматизированного создания профессионального контента для социальных сетей и рекламных платформ. Приложение использует большие языковые модели (LLM) для генерации качественных текстов, адаптированных под разные каналы коммуникации.

### Для чего нужен этот проект?

- **Маркетологи** — быстрое создание контента для разных площадок
- **SMM-специалисты** — генерация постов с учётом специфики каждой соцсети
- **Предприниматели** — экономия времени на написании рекламных текстов
- **Контент-менеджеры** — планирование контента на недели вперёд

### Что умеет приложение?

| Функция | Описание |
|---------|----------|
| 🎯 **Генерация контента** | Создание постов для Telegram, VK, Email, Яндекс.Директ, Яндекс.Дзен |
| 🎨 **Brand Voice** | Настройка стиля и тона коммуникации для каждого канала |
| ✨ **AI-улучшения** | Сокращение текста, добавление эмодзи, изменение тона, CTA-кнопки |
| 📤 **Экспорт** | Скачивание в CSV, PDF, DOCX форматах |
| 📅 **Календарь** | Планирование и визуализация публикаций |
| 📚 **Серия постов** | Генерация 2-7 связанных постов на одну тему |
| 📋 **Контент-план** | Создание плана публикаций на 7-30 дней |
| 👥 **Анализ аудитории** | Исследование целевой аудитории продукта |
| #️⃣ **Хештеги** | Генерация продающих хештегов |

### Технологический стек

**Backend:**
- FastAPI (Python 3.11+)
- PostgreSQL + SQLAlchemy
- OpenAI / OpenRouter API
- JWT авторизация

**Frontend:**
- React 18 + TypeScript
- Ant Design 5
- Vite

---

## Установка и запуск

### Вариант 1: Docker (рекомендуется)

**Требования:**
- Docker
- Docker Compose

**Запуск одной командой:**

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd yandex_AI

# Создайте .env файл с вашим API ключом
cp .env.example .env
# Отредактируйте .env и добавьте OPENROUTER_API_KEY

# Запустите
docker-compose up -d --build
```

**Готово!** Приложение доступно по адресу: http://localhost

**Тестовые аккаунты (создаются автоматически):**
| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | admin@example.com | admin123 |
| Пользователь | test@test.com | test123 |

---

### Вариант 2: Локальная установка без Docker

**Требования:**
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

#### 1. База данных

```bash
# Создайте базу данных
sudo -u postgres psql -c "CREATE DATABASE marketing_db;"
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE marketing_db TO postgres;"

# Или через createdb
createdb marketing_db
```

#### 2. Backend

```bash
cd backend

# Создайте виртуальное окружение
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или: venv\Scripts\activate  # Windows

# Установите зависимости
pip install -r requirements.txt

# Скопируйте .env
cp ../.env.example .env
# Отредактируйте .env с вашими настройками

# Инициализируйте базу данных
python -m migrations.init_db

# Создайте администратора
python -m migrations.create_admin admin@example.com admin123

# Создайте тестового пользователя
python -m migrations.create_admin test@test.com test123

# Запустите сервер
uvicorn app.main:app --reload --port 8000
```

#### 3. Frontend

```bash
# В другом терминале
cd frontend

# Установите зависимости
npm install

# Запустите dev-сервер
npm run dev
```

**Доступ:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API документация: http://localhost:8000/docs

---

### Конфигурация

Создайте файл `.env` в корневой директории:

```env
# Обязательно
SECRET_KEY=your-super-secret-key-change-in-production

# API ключи (минимум один)
OPENROUTER_API_KEY=your-openrouter-api-key
OPENAI_API_KEY=your-openai-api-key

Тестовый ключ от Openrouter = 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 (Будет действовать месяц)

# Настройки LLM
LLM_PROVIDER=openrouter
LLM_MODEL=openai/gpt-4o-mini
LLM_BASE_URL=https://openrouter.ai/api/v1

# База данных (для локальной установки)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/marketing_db

# Тестовый режим (без API ключей)
MOCK_MODE=false
```

#### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `SECRET_KEY` | Секретный ключ для JWT | Обязательно |
| `OPENROUTER_API_KEY` | Ключ OpenRouter API | - |
| `OPENAI_API_KEY` | Ключ OpenAI API | - |
| `LLM_PROVIDER` | Провайдер: openai/openrouter | openrouter |
| `LLM_MODEL` | Модель для генерации | openai/gpt-4o-mini |
| `LLM_BASE_URL` | URL API провайдера | https://openrouter.ai/api/v1 |
| `DATABASE_URL` | Строка подключения к БД | postgresql+asyncpg://... |
| `MOCK_MODE` | Режим без API (для тестов) | false |

---

## Структура проекта

```
yandex_AI/
├── backend/
│   ├── app/
│   │   ├── api/               # API эндпоинты
│   │   │   ├── endpoints.py   # Основные маршруты
│   │   │   ├── stream.py      # SSE стриминг
│   │   │   └── calendar.py    # Календарь
│   │   ├── services/          # Бизнес-логика
│   │   │   ├── generator.py   # Генерация контента
│   │   │   ├── improver.py    # AI-улучшения
│   │   │   ├── series.py      # Серии постов
│   │   │   ├── content_plan.py# Контент-план
│   │   │   ├── audience.py    # Анализ аудитории
│   │   │   ├── hashtags.py    # Хештеги
│   │   │   └── auth.py        # Авторизация
│   │   ├── models/            # Модели SQLAlchemy
│   │   ├── schemas/           # Pydantic схемы
│   │   └── core/              # Конфигурация
│   ├── migrations/            # Скрипты миграций
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/             # Страницы
│   │   │   ├── GeneratorPage.tsx
│   │   │   ├── CalendarPage.tsx
│   │   │   ├── SeriesPage.tsx
│   │   │   ├── ContentPlanPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── AdminPage.tsx
│   │   ├── components/        # Компоненты
│   │   ├── hooks/             # React хуки
│   │   └── services/          # API клиент
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## API Эндпоинты

### Авторизация
- `POST /api/auth/register` — Регистрация
- `POST /api/auth/login` — Вход
- `GET /api/auth/me` — Текущий пользователь

### Генерация контента
- `POST /api/generate` — Генерация контента
- `POST /api/generate/stream` — Потоковая генерация (SSE)
- `POST /api/improve` — Улучшение контента
- `POST /api/hashtags` — Генерация хештегов

### Планирование
- `POST /api/series` — Серия постов
- `POST /api/content-plan` — Контент-план
- `POST /api/audience` — Анализ аудитории

### Календарь
- `GET /api/calendar` — Список постов
- `POST /api/calendar` — Создать пост
- `PUT /api/calendar/{id}` — Обновить пост
- `DELETE /api/calendar/{id}` — Удалить пост

### Настройки
- `GET /api/settings/brand-voice` — Получить Brand Voice
- `PUT /api/settings/brand-voice` — Обновить Brand Voice

---

## Тестовый режим

Для запуска без API ключей установите в `.env`:

```env
MOCK_MODE=true
```

В этом режиме приложение будет возвращать заглушки вместо реальной генерации.

---

## Разработка

### Backend

```bash
cd backend
source venv/bin/activate

# Запуск с автоперезагрузкой
uvicorn app.main:app --reload

# Тесты
pytest
```

### Frontend

```bash
cd frontend

# Разработка
npm run dev

# Сборка
npm run build

# Превью сборки
npm run preview
```

---

# 🇬🇧 English Version

## Project Description

**Marketing Content Generator** is an AI-powered platform for automated creation of professional content for social media and advertising platforms. The application uses Large Language Models (LLM) to generate high-quality texts adapted for different communication channels.

### Who is this for?

- **Marketers** — quickly create content for different platforms
- **SMM Specialists** — generate posts considering each social network's specifics
- **Entrepreneurs** — save time on writing advertising texts
- **Content Managers** — plan content weeks in advance

### Features

| Feature | Description |
|---------|-------------|
| 🎯 **Content Generation** | Create posts for Telegram, VK, Email, Yandex Direct, Yandex Zen |
| 🎨 **Brand Voice** | Customize style and tone for each channel |
| ✨ **AI Improvements** | Shorten text, add emojis, change tone, CTA buttons |
| 📤 **Export** | Download in CSV, PDF, DOCX formats |
| 📅 **Calendar** | Plan and visualize publications |
| 📚 **Post Series** | Generate 2-7 related posts on one topic |
| 📋 **Content Plan** | Create publication plan for 7-30 days |
| 👥 **Audience Analysis** | Research target audience |
| #️⃣ **Hashtags** | Generate selling hashtags |

### Tech Stack

**Backend:**
- FastAPI (Python 3.11+)
- PostgreSQL + SQLAlchemy
- OpenAI / OpenRouter API
- JWT Authentication

**Frontend:**
- React 18 + TypeScript
- Ant Design 5
- Vite

---

## Installation

### Option 1: Docker (Recommended)

**Requirements:**
- Docker
- Docker Compose

**One-command deployment:**

```bash
# Clone repository
git clone <repository-url>
cd yandex_AI

# Create .env file with your API key
cp .env.example .env
# Edit .env and add OPENROUTER_API_KEY

# Run
docker-compose up -d --build
```

**Done!** Application available at: http://localhost

**Test accounts (created automatically):**
| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@example.com | admin123 |
| User | test@test.com | test123 |

---

### Option 2: Local Installation without Docker

**Requirements:**
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

#### 1. Database

```bash
# Create database
sudo -u postgres psql -c "CREATE DATABASE marketing_db;"
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE marketing_db TO postgres;"

# Or using createdb
createdb marketing_db
```

#### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Copy .env
cp ../.env.example .env
# Edit .env with your settings

# Initialize database
python -m migrations.init_db

# Create admin
python -m migrations.create_admin admin@example.com admin123

# Create test user
python -m migrations.create_admin test@test.com test123

# Start server
uvicorn app.main:app --reload --port 8000
```

#### 3. Frontend

```bash
# In another terminal
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

---

### Configuration

Create `.env` file in root directory:

```env
# Required
SECRET_KEY=your-super-secret-key-change-in-production

# API keys (at least one)
OPENROUTER_API_KEY=your-openrouter-api-key
OPENAI_API_KEY=your-openai-api-key

# LLM settings
LLM_PROVIDER=openrouter
LLM_MODEL=openai/gpt-4o-mini
LLM_BASE_URL=https://openrouter.ai/api/v1

# Database (for local installation)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/marketing_db

# Test mode (without API keys)
MOCK_MODE=false
```

#### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | JWT secret key | Required |
| `OPENROUTER_API_KEY` | OpenRouter API key | - |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `LLM_PROVIDER` | Provider: openai/openrouter | openrouter |
| `LLM_MODEL` | Model for generation | openai/gpt-4o-mini |
| `LLM_BASE_URL` | Provider API URL | https://openrouter.ai/api/v1 |
| `DATABASE_URL` | Database connection string | postgresql+asyncpg://... |
| `MOCK_MODE` | Mode without API (for testing) | false |

---

## Mock Mode

To run without API keys, set in `.env`:

```env
MOCK_MODE=true
```

In this mode, the application will return mock responses instead of real generation.

---

## License

MIT
