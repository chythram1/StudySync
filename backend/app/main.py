from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db
from app.routers import auth, courses, notes, flashcards, events, demo


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="TempoLearn API",
    description="AI-powered study assistant",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - MUST be before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://tempolearn.vercel.app",
        "http://tempolearn.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(notes.router)
app.include_router(flashcards.router)
app.include_router(events.router)
app.include_router(demo.router)


@app.get("/")
async def root():
    return {
        "name": "TempoLearn API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}