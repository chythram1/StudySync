from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.database import get_db, User, Note, Flashcard
from app.schemas import FlashcardResponse, FlashcardReview, Difficulty
from app.auth import get_current_user

router = APIRouter(prefix="/api/flashcards", tags=["flashcards"])


@router.get("", response_model=List[FlashcardResponse])
async def get_all_flashcards(
    course_id: str = None,
    due_only: bool = False,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all flashcards for the current user."""
    
    query = db.query(Flashcard).join(Note).filter(Note.user_id == user.id)
    
    if course_id:
        query = query.filter(Note.course_id == course_id)
    
    if due_only:
        now = datetime.utcnow()
        query = query.filter(
            (Flashcard.next_review == None) | (Flashcard.next_review <= now)
        )
    
    flashcards = query.all()
    
    return [FlashcardResponse(
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
    ) for fc in flashcards]


@router.get("/note/{note_id}", response_model=List[FlashcardResponse])
async def get_note_flashcards(
    note_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get flashcards for a specific note."""
    
    # Verify note belongs to user
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == user.id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    flashcards = db.query(Flashcard).filter(Flashcard.note_id == note_id).all()
    
    return [FlashcardResponse(
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
    ) for fc in flashcards]


@router.post("/{flashcard_id}/review", response_model=FlashcardResponse)
async def review_flashcard(
    flashcard_id: str,
    review: FlashcardReview,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record a flashcard review and update spaced repetition schedule."""
    
    flashcard = db.query(Flashcard).join(Note).filter(
        Flashcard.id == flashcard_id,
        Note.user_id == user.id
    ).first()
    
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")
    
    # Update review stats
    flashcard.times_reviewed += 1
    flashcard.last_reviewed = datetime.utcnow()
    
    # Simple spaced repetition algorithm
    # Based on difficulty rating, schedule next review
    if review.difficulty == Difficulty.easy:
        flashcard.times_correct += 1
        days_until_next = min(30, (flashcard.times_correct + 1) * 3)
    elif review.difficulty == Difficulty.medium:
        flashcard.times_correct += 1
        days_until_next = min(14, (flashcard.times_correct + 1) * 1)
    else:  # hard
        days_until_next = 1  # Review again tomorrow
    
    flashcard.next_review = datetime.utcnow() + timedelta(days=days_until_next)
    flashcard.difficulty = review.difficulty.value
    
    db.commit()
    db.refresh(flashcard)
    
    return FlashcardResponse(
        id=flashcard.id,
        note_id=flashcard.note_id,
        front=flashcard.front,
        back=flashcard.back,
        difficulty=flashcard.difficulty,
        times_reviewed=flashcard.times_reviewed,
        times_correct=flashcard.times_correct,
        last_reviewed=flashcard.last_reviewed,
        next_review=flashcard.next_review,
        created_at=flashcard.created_at
    )


@router.get("/stats")
async def get_flashcard_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get flashcard statistics for the user."""
    
    flashcards = db.query(Flashcard).join(Note).filter(Note.user_id == user.id).all()
    
    total = len(flashcards)
    reviewed = sum(1 for fc in flashcards if fc.times_reviewed > 0)
    
    now = datetime.utcnow()
    due_now = sum(1 for fc in flashcards if fc.next_review is None or fc.next_review <= now)
    
    total_reviews = sum(fc.times_reviewed for fc in flashcards)
    total_correct = sum(fc.times_correct for fc in flashcards)
    accuracy = (total_correct / total_reviews * 100) if total_reviews > 0 else 0
    
    return {
        "total_flashcards": total,
        "reviewed_at_least_once": reviewed,
        "due_for_review": due_now,
        "total_reviews": total_reviews,
        "accuracy_percentage": round(accuracy, 1)
    }
