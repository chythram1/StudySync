from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# Enums
class NoteStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class EventType(str, Enum):
    exam = "exam"
    assignment = "assignment"
    quiz = "quiz"
    project = "project"
    study_session = "study_session"
    lecture = "lecture"


class QuestionType(str, Enum):
    recall = "recall"
    conceptual = "conceptual"
    application = "application"


class Difficulty(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    picture: Optional[str] = None


class UserCreate(UserBase):
    google_id: str


class UserResponse(UserBase):
    id: str
    created_at: datetime
    has_calendar_access: bool = False
    
    class Config:
        from_attributes = True


class UserWithToken(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = "bearer"


# Course schemas
class CourseBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#6366f1"


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


class CourseResponse(CourseBase):
    id: str
    user_id: str
    created_at: datetime
    notes_count: int = 0
    
    class Config:
        from_attributes = True


# Flashcard schemas
class FlashcardBase(BaseModel):
    front: str
    back: str
    difficulty: Difficulty = Difficulty.medium


class FlashcardCreate(FlashcardBase):
    pass


class FlashcardResponse(FlashcardBase):
    id: str
    note_id: str
    times_reviewed: int = 0
    times_correct: int = 0
    last_reviewed: Optional[datetime] = None
    next_review: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class FlashcardReview(BaseModel):
    difficulty: Difficulty


# Study question schemas
class StudyQuestionBase(BaseModel):
    question: str
    suggested_answer: Optional[str] = None
    question_type: QuestionType = QuestionType.conceptual


class StudyQuestionResponse(StudyQuestionBase):
    id: str
    note_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Event schemas
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: EventType
    event_date: datetime


class EventCreate(EventBase):
    course_id: Optional[str] = None


class ExtractedEventCreate(EventBase):
    confidence: float = 1.0


class EventResponse(EventBase):
    id: str
    user_id: str
    course_id: Optional[str] = None
    source_note_id: Optional[str] = None
    google_event_id: Optional[str] = None
    synced_to_calendar: bool = False
    confidence: float = 1.0
    created_at: datetime
    
    class Config:
        from_attributes = True


class EventSyncRequest(BaseModel):
    event_ids: List[str]
    create_study_sessions: bool = False


# Note schemas
class NoteBase(BaseModel):
    title: str
    course_id: Optional[str] = None


class NoteCreate(NoteBase):
    content: str


class NoteResponse(NoteBase):
    id: str
    user_id: str
    original_filename: Optional[str] = None
    status: NoteStatus
    error_message: Optional[str] = None
    uploaded_at: datetime
    processed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class NoteDetailResponse(NoteResponse):
    original_content: Optional[str] = None
    processed_summary: Optional[str] = None
    key_concepts: Optional[List[str]] = None
    knowledge_gaps: Optional[List[str]] = None
    flashcards: List[FlashcardResponse] = []
    study_questions: List[StudyQuestionResponse] = []
    extracted_events: List[EventResponse] = []


# Processing schemas (for LangChain outputs)
class ProcessedNote(BaseModel):
    summary: str
    key_concepts: List[str]
    gaps_or_unclear: List[str]


class GeneratedFlashcard(BaseModel):
    front: str
    back: str
    difficulty: str = "medium"


class GeneratedQuestion(BaseModel):
    question: str
    suggested_answer: str
    question_type: str


class ExtractedEvent(BaseModel):
    title: str
    event_type: str
    date: datetime
    confidence: float


class NoteProcessingResult(BaseModel):
    processed_note: ProcessedNote
    flashcards: List[GeneratedFlashcard]
    study_questions: List[GeneratedQuestion]
    extracted_events: List[ExtractedEvent]


# Auth schemas
class GoogleAuthRequest(BaseModel):
    code: str
    redirect_uri: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# API Key validation
class ApiKeyValidation(BaseModel):
    valid: bool
    error: Optional[str] = None


# Demo data
class DemoNoteResponse(BaseModel):
    id: str
    title: str
    course_name: str
    summary: str
    key_concepts: List[str]
    flashcards_count: int
    questions_count: int
    events_count: int
