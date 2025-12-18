from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from app.database import get_db, User, Course, Note, Flashcard, StudyQuestion, Event
from app.schemas import (
    NoteCreate, NoteResponse, NoteDetailResponse, 
    FlashcardResponse, StudyQuestionResponse, EventResponse,
    ApiKeyValidation
)
from app.auth import get_current_user, require_anthropic_key
from app.services.note_processor import NoteProcessor, extract_text_from_file, validate_api_key

router = APIRouter(prefix="/api/notes", tags=["notes"])


@router.post("/validate-key", response_model=ApiKeyValidation)
async def validate_anthropic_key(api_key: str = Depends(require_anthropic_key)):
    """Validate an Anthropic API key."""
    
    valid, error = await validate_api_key(api_key)
    return ApiKeyValidation(valid=valid, error=error)


@router.get("", response_model=List[NoteResponse])
async def get_notes(
    course_id: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all notes for the current user."""
    
    query = db.query(Note).filter(Note.user_id == user.id)
    
    if course_id:
        query = query.filter(Note.course_id == course_id)
    
    notes = query.order_by(Note.uploaded_at.desc()).all()
    
    return [NoteResponse(
        id=note.id,
        user_id=note.user_id,
        title=note.title,
        course_id=note.course_id,
        original_filename=note.original_filename,
        status=note.status,
        error_message=note.error_message,
        uploaded_at=note.uploaded_at,
        processed_at=note.processed_at
    ) for note in notes]


@router.post("/upload", response_model=NoteResponse)
async def upload_note(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    course_id: Optional[str] = Form(None),
    api_key: str = Depends(require_anthropic_key),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a note file and process it."""
    
    # Validate course if provided
    if course_id:
        course = db.query(Course).filter(
            Course.id == course_id,
            Course.user_id == user.id
        ).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
    
    # Read and extract text from file
    try:
        file_content = await file.read()
        text_content = extract_text_from_file(file_content, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    
    if not text_content.strip():
        raise HTTPException(status_code=400, detail="No text content found in file")
    
    # Create note record
    note = Note(
        user_id=user.id,
        course_id=course_id,
        title=title or file.filename or "Untitled Note",
        original_filename=file.filename,
        original_content=text_content,
        status="processing"
    )
    
    db.add(note)
    db.commit()
    db.refresh(note)
    
    # Process note in background
    background_tasks.add_task(
        process_note_task,
        note_id=note.id,
        content=text_content,
        course_name=course.name if course_id else None,
        api_key=api_key
    )
    
    return NoteResponse(
        id=note.id,
        user_id=note.user_id,
        title=note.title,
        course_id=note.course_id,
        original_filename=note.original_filename,
        status=note.status,
        error_message=note.error_message,
        uploaded_at=note.uploaded_at,
        processed_at=note.processed_at
    )


@router.post("/text", response_model=NoteResponse)
async def create_note_from_text(
    background_tasks: BackgroundTasks,
    note_data: NoteCreate,
    api_key: str = Depends(require_anthropic_key),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a note from raw text."""
    
    course_name = None
    if note_data.course_id:
        course = db.query(Course).filter(
            Course.id == note_data.course_id,
            Course.user_id == user.id
        ).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        course_name = course.name
    
    # Create note record
    note = Note(
        user_id=user.id,
        course_id=note_data.course_id,
        title=note_data.title,
        original_content=note_data.content,
        status="processing"
    )
    
    db.add(note)
    db.commit()
    db.refresh(note)
    
    # Process note in background
    background_tasks.add_task(
        process_note_task,
        note_id=note.id,
        content=note_data.content,
        course_name=course_name,
        api_key=api_key
    )
    
    return NoteResponse(
        id=note.id,
        user_id=note.user_id,
        title=note.title,
        course_id=note.course_id,
        original_filename=note.original_filename,
        status=note.status,
        error_message=note.error_message,
        uploaded_at=note.uploaded_at,
        processed_at=note.processed_at
    )


async def process_note_task(
    note_id: str,
    content: str,
    course_name: Optional[str],
    api_key: str
):
    """Background task to process a note."""
    
    from app.database import SessionLocal
    
    db = SessionLocal()
    
    try:
        note = db.query(Note).filter(Note.id == note_id).first()
        if not note:
            return
        
        # Process with LangChain
        processor = NoteProcessor(api_key=api_key)
        result = await processor.process_note(content, course_name)
        
        # Update note with results
        note.processed_summary = result["processed_note"]["summary"]
        note.key_concepts = json.dumps(result["processed_note"]["key_concepts"])
        note.knowledge_gaps = json.dumps(result["processed_note"]["gaps_or_unclear"])
        
        # Create flashcards
        for fc in result["flashcards"]:
            flashcard = Flashcard(
                note_id=note.id,
                front=fc["front"],
                back=fc["back"],
                difficulty=fc.get("difficulty", "medium")
            )
            db.add(flashcard)
        
        # Create study questions
        for sq in result["study_questions"]:
            question = StudyQuestion(
                note_id=note.id,
                question=sq["question"],
                suggested_answer=sq["suggested_answer"],
                question_type=sq.get("question_type", "conceptual")
            )
            db.add(question)
        
        # Create extracted events
        for ev in result["extracted_events"]:
            try:
                event_date = datetime.fromisoformat(ev["date"].replace("Z", "+00:00"))
                event = Event(
                    user_id=note.user_id,
                    course_id=note.course_id,
                    source_note_id=note.id,
                    title=ev["title"],
                    event_type=ev["event_type"],
                    event_date=event_date,
                    confidence=ev.get("confidence", 1.0)
                )
                db.add(event)
            except (ValueError, KeyError):
                continue
        
        note.status = "completed"
        note.processed_at = datetime.utcnow()
        
        db.commit()
        
    except Exception as e:
        note = db.query(Note).filter(Note.id == note_id).first()
        if note:
            note.status = "failed"
            note.error_message = str(e)[:500]
            db.commit()
    finally:
        db.close()


@router.get("/{note_id}", response_model=NoteDetailResponse)
async def get_note(
    note_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific note with all details."""
    
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == user.id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Parse JSON fields
    key_concepts = json.loads(note.key_concepts) if note.key_concepts else []
    knowledge_gaps = json.loads(note.knowledge_gaps) if note.knowledge_gaps else []
    
    # Get related data
    flashcards = [FlashcardResponse(
        id=fc.id,
        note_id=fc.note_id,
        front=fc.front,
        back=fc.back,
        difficulty=fc.difficulty,
        times_reviewed=fc.times_reviewed,
        times_correct=fc.times_correct,
        last_reviewed=fc.last_reviewed,
        next_review=fc.next_review,
        created_at=fc.created_at
    ) for fc in note.flashcards]
    
    study_questions = [StudyQuestionResponse(
        id=sq.id,
        note_id=sq.note_id,
        question=sq.question,
        suggested_answer=sq.suggested_answer,
        question_type=sq.question_type,
        created_at=sq.created_at
    ) for sq in note.study_questions]
    
    extracted_events = [EventResponse(
        id=ev.id,
        user_id=ev.user_id,
        course_id=ev.course_id,
        source_note_id=ev.source_note_id,
        title=ev.title,
        event_type=ev.event_type,
        event_date=ev.event_date,
        google_event_id=ev.google_event_id,
        synced_to_calendar=ev.synced_to_calendar,
        confidence=ev.confidence,
        created_at=ev.created_at
    ) for ev in note.extracted_events]
    
    return NoteDetailResponse(
        id=note.id,
        user_id=note.user_id,
        title=note.title,
        course_id=note.course_id,
        original_filename=note.original_filename,
        original_content=note.original_content,
        processed_summary=note.processed_summary,
        key_concepts=key_concepts,
        knowledge_gaps=knowledge_gaps,
        status=note.status,
        error_message=note.error_message,
        uploaded_at=note.uploaded_at,
        processed_at=note.processed_at,
        flashcards=flashcards,
        study_questions=study_questions,
        extracted_events=extracted_events
    )


@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a note."""
    
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == user.id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(note)
    db.commit()
    
    return {"message": "Note deleted successfully"}


@router.post("/{note_id}/reprocess", response_model=NoteResponse)
async def reprocess_note(
    note_id: str,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(require_anthropic_key),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reprocess a note that failed or needs updating."""
    
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == user.id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if not note.original_content:
        raise HTTPException(status_code=400, detail="No content to reprocess")
    
    # Clear existing generated content
    db.query(Flashcard).filter(Flashcard.note_id == note.id).delete()
    db.query(StudyQuestion).filter(StudyQuestion.note_id == note.id).delete()
    db.query(Event).filter(Event.source_note_id == note.id).delete()
    
    note.status = "processing"
    note.error_message = None
    note.processed_summary = None
    note.key_concepts = None
    note.knowledge_gaps = None
    
    db.commit()
    db.refresh(note)
    
    # Get course name
    course_name = None
    if note.course_id:
        course = db.query(Course).filter(Course.id == note.course_id).first()
        if course:
            course_name = course.name
    
    # Reprocess
    background_tasks.add_task(
        process_note_task,
        note_id=note.id,
        content=note.original_content,
        course_name=course_name,
        api_key=api_key
    )
    
    return NoteResponse(
        id=note.id,
        user_id=note.user_id,
        title=note.title,
        course_id=note.course_id,
        original_filename=note.original_filename,
        status=note.status,
        error_message=note.error_message,
        uploaded_at=note.uploaded_at,
        processed_at=note.processed_at
    )
