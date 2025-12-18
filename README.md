# 📚 TempoLearn

**AI-powered study assistant that transforms lecture notes into exam-ready study materials.**

## ✨ Features

- **📄 Smart Note Processing**: Upload PDFs or text files and let AI extract key concepts
- **🃏 Auto-Generated Flashcards**: Spaced repetition system for optimal memorization  
- **📅 Calendar Integration**: Automatically extract dates and sync to Google Calendar
- **💡 Study Questions**: Generate practice questions with suggested answers
- **🎯 Knowledge Gap Detection**: Identify areas that need more study
- **🔑 BYOK (Bring Your Own Key)**: Use your own Open AI Key

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Framer Motion** - Smooth animations

### Backend
- **FastAPI** - High-performance Python API
- **LangChain** - AI orchestration framework
- **Chat GPT (Open AI)** - Advanced language model
- **SQLAlchemy** - Database ORM
- **Google Calendar API** - Calendar integration

### Database
- **SQLite** (development) / **PostgreSQL** (production)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Python 3.10+
- Google Cloud Console account (for OAuth)
- Open API key

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/tempolearn.git
cd tempolearn
```

### 2. Set up the backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: 

# Install dependencies
pip install -r requirements.txt

# Copy environment file and configure
cp .env.example .env
# Edit .env with your credentials

# Run the server
uvicorn app.main:app --reload
```

### 3. Set up the frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Edit .env.local with your settings

# Run the development server
npm run dev
```

### 4. Open the app

Visit [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the **Google Calendar API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env` files

### Environment Variables

#### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Database connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL |
| `JWT_SECRET` | Secret key for JWT tokens |
| `FRONTEND_URL` | Frontend URL for CORS |

#### Frontend (`.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |

## 📁 Project Structure

```
tempolearn/
├── backend/
│   ├── app/
│   │   ├── routers/          # API endpoints
│   │   │   ├── auth.py       # Authentication
│   │   │   ├── notes.py      # Note management
│   │   │   ├── flashcards.py # Flashcard reviews
│   │   │   ├── events.py     # Calendar events
│   │   │   ├── courses.py    # Course management
│   │   │   └── demo.py       # Demo data
│   │   ├── services/         # Business logic
│   │   │   ├── note_processor.py   # LangChain AI processing
│   │   │   └── calendar_service.py # Google Calendar
│   │   ├── database.py       # SQLAlchemy models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── auth.py           # Auth utilities
│   │   ├── config.py         # Settings
│   │   └── main.py           # FastAPI app
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Landing page
│   │   │   ├── demo/             # Demo pages
│   │   │   └── dashboard/        # Authenticated pages
│   │   │       ├── page.tsx      # Dashboard
│   │   │       ├── notes/        # Notes management
│   │   │       └── flashcards/   # Flashcard review
│   │   ├── lib/
│   │   │   ├── api.ts            # API client
│   │   │   └── auth-context.tsx  # Auth state
│   │   └── types/
│   │       └── index.ts          # TypeScript types
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

## 🎯 How It Works

### 1. Upload Notes
Users upload PDF or text files containing lecture notes, or paste text directly.

### 2. AI Processing
LangChain orchestrates multiple Open AI API calls to:
- Generate a structured summary
- Extract key concepts
- Identify knowledge gaps
- Create flashcards with difficulty ratings
- Generate practice questions
- Extract dates and deadlines

### 3. Review & Study
- Study flashcards with spaced repetition
- Answer practice questions
- Track progress and accuracy

### 4. Calendar Sync
- Review AI-extracted events
- Sync to Google Calendar with one click
- Optionally create study sessions before exams

## 🔑 BYOK (Bring Your Own Key)

This project uses a BYOK model:

1. Users provide their own Open API key
2. Key is stored in browser localStorage (never on server)
3. Key is sent with each request via `X-OpenAI-Key` header
4. **You pay only for your own API usage**

To get an Open AI API key:
1. Visit [https://platform.openai.com/api-keys]
2. Sign up or log in
3. Generate an API key
4. Add it in the StudySync sidebar

## 🚢 Deployment

### Vercel (Frontend)

```bash
cd frontend
vercel
```

### Railway (Backend)

1. Create new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Add environment variables
4. Deploy

### Docker

```bash
# Build and run with Docker Compose
docker-compose up --build
```

Contributions are welcome! Please feel free to submit a Pull Request.
