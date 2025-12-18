from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Float, Boolean, create_engine
from sqlalchemy.orm import relationship, declarative_base, sessionmaker
from sqlalchemy.sql import func
from datetime import datetime
import uuid

from app.config import settings

Base = declarative_base()


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255))
    picture = Column(Text)
    google_id = Column(String(255), unique=True)
    google_refresh_token = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    courses = relationship("Course", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="user", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    color = Column(String(7), default="#6366f1")  # Hex color for calendar
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="courses")
    notes = relationship("Note", back_populates="course", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="course")


class Note(Base):
    __tablename__ = "notes"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    original_filename = Column(String(255))
    original_content = Column(Text)
    processed_summary = Column(Text)
    key_concepts = Column(Text)  # JSON array stored as text
    knowledge_gaps = Column(Text)  # JSON array stored as text
    status = Column(String(50), default="pending")  # pending, processing, completed, failed
    error_message = Column(Text)
    uploaded_at = Column(DateTime, default=func.now())
    processed_at = Column(DateTime)
    
    # Relationships
    user = relationship("User", back_populates="notes")
    course = relationship("Course", back_populates="notes")
    flashcards = relationship("Flashcard", back_populates="note", cascade="all, delete-orphan")
    study_questions = relationship("StudyQuestion", back_populates="note", cascade="all, delete-orphan")
    extracted_events = relationship("Event", back_populates="source_note")


class Flashcard(Base):
    __tablename__ = "flashcards"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    note_id = Column(String(36), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    difficulty = Column(String(20), default="medium")
    times_reviewed = Column(Integer, default=0)
    times_correct = Column(Integer, default=0)
    last_reviewed = Column(DateTime)
    next_review = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    note = relationship("Note", back_populates="flashcards")


class StudyQuestion(Base):
    __tablename__ = "study_questions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    note_id = Column(String(36), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    suggested_answer = Column(Text)
    question_type = Column(String(50))  # recall, conceptual, application
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    note = relationship("Note", back_populates="study_questions")


class Event(Base):
    __tablename__ = "events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(String(36), ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    source_note_id = Column(String(36), ForeignKey("notes.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    event_type = Column(String(50))  # exam, assignment, quiz, project, study_session
    event_date = Column(DateTime, nullable=False)
    google_event_id = Column(String(255))
    synced_to_calendar = Column(Boolean, default=False)
    confidence = Column(Float, default=1.0)  # For AI-extracted events
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="events")
    course = relationship("Course", back_populates="events")
    source_note = relationship("Note", back_populates="extracted_events")


# Database setup
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
