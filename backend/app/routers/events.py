from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db, User, Event, Course
from app.schemas import EventCreate, EventResponse, EventSyncRequest
from app.services.calendar_service import CalendarService
from app.auth import get_current_user

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("", response_model=List[EventResponse])
async def get_events(
    course_id: str = None,
    synced_only: bool = False,
    upcoming_only: bool = False,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all events for the current user."""
    
    query = db.query(Event).filter(Event.user_id == user.id)
    
    if course_id:
        query = query.filter(Event.course_id == course_id)
    
    if synced_only:
        query = query.filter(Event.synced_to_calendar == True)
    
    if upcoming_only:
        query = query.filter(Event.event_date >= datetime.utcnow())
    
    events = query.order_by(Event.event_date.asc()).all()
    
    return [EventResponse(
        id=ev.id,
        user_id=ev.user_id,
        course_id=ev.course_id,
        source_note_id=ev.source_note_id,
        title=ev.title,
        description=ev.description,
        event_type=ev.event_type,
        event_date=ev.event_date,
        google_event_id=ev.google_event_id,
        synced_to_calendar=ev.synced_to_calendar,
        confidence=ev.confidence,
        created_at=ev.created_at
    ) for ev in events]


@router.post("", response_model=EventResponse)
async def create_event(
    event_data: EventCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a manual event."""
    
    if event_data.course_id:
        course = db.query(Course).filter(
            Course.id == event_data.course_id,
            Course.user_id == user.id
        ).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
    
    event = Event(
        user_id=user.id,
        course_id=event_data.course_id,
        title=event_data.title,
        description=event_data.description,
        event_type=event_data.event_type,
        event_date=event_data.event_date,
        confidence=1.0  # Manual events have full confidence
    )
    
    db.add(event)
    db.commit()
    db.refresh(event)
    
    return EventResponse(
        id=event.id,
        user_id=event.user_id,
        course_id=event.course_id,
        source_note_id=event.source_note_id,
        title=event.title,
        description=event.description,
        event_type=event.event_type,
        event_date=event.event_date,
        google_event_id=event.google_event_id,
        synced_to_calendar=event.synced_to_calendar,
        confidence=event.confidence,
        created_at=event.created_at
    )


@router.post("/sync", response_model=List[EventResponse])
async def sync_events_to_calendar(
    sync_request: EventSyncRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sync selected events to Google Calendar."""
    
    if not user.google_refresh_token:
        raise HTTPException(
            status_code=400, 
            detail="Calendar access not authorized. Please re-authenticate with Google."
        )
    
    calendar = CalendarService(user.google_refresh_token)
    synced_events = []
    
    for event_id in sync_request.event_ids:
        event = db.query(Event).filter(
            Event.id == event_id,
            Event.user_id == user.id
        ).first()
        
        if not event:
            continue
        
        if event.synced_to_calendar and event.google_event_id:
            # Already synced, skip
            synced_events.append(event)
            continue
        
        try:
            # Create Google Calendar event
            google_event_id = await calendar.create_event(
                title=event.title,
                start_time=event.event_date,
                description=event.description,
                event_type=event.event_type
            )
            
            event.google_event_id = google_event_id
            event.synced_to_calendar = True
            
            # Create study sessions if requested
            if sync_request.create_study_sessions and event.event_type in ["exam", "quiz"]:
                await calendar.create_study_sessions(
                    exam_title=event.title,
                    exam_date=event.event_date
                )
            
            synced_events.append(event)
            
        except Exception as e:
            # Log error but continue with other events
            print(f"Failed to sync event {event_id}: {e}")
    
    db.commit()
    
    return [EventResponse(
        id=ev.id,
        user_id=ev.user_id,
        course_id=ev.course_id,
        source_note_id=ev.source_note_id,
        title=ev.title,
        description=ev.description,
        event_type=ev.event_type,
        event_date=ev.event_date,
        google_event_id=ev.google_event_id,
        synced_to_calendar=ev.synced_to_calendar,
        confidence=ev.confidence,
        created_at=ev.created_at
    ) for ev in synced_events]


@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    remove_from_calendar: bool = False,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an event."""
    
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.user_id == user.id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Remove from Google Calendar if requested
    if remove_from_calendar and event.google_event_id and user.google_refresh_token:
        try:
            calendar = CalendarService(user.google_refresh_token)
            await calendar.delete_event(event.google_event_id)
        except Exception:
            pass  # Continue even if calendar deletion fails
    
    db.delete(event)
    db.commit()
    
    return {"message": "Event deleted successfully"}


@router.get("/upcoming")
async def get_upcoming_events(
    days: int = 7,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get upcoming events within specified days."""
    
    from datetime import timedelta
    
    now = datetime.utcnow()
    end_date = now + timedelta(days=days)
    
    events = db.query(Event).filter(
        Event.user_id == user.id,
        Event.event_date >= now,
        Event.event_date <= end_date
    ).order_by(Event.event_date.asc()).all()
    
    return {
        "period_start": now.isoformat(),
        "period_end": end_date.isoformat(),
        "events": [EventResponse(
            id=ev.id,
            user_id=ev.user_id,
            course_id=ev.course_id,
            source_note_id=ev.source_note_id,
            title=ev.title,
            description=ev.description,
            event_type=ev.event_type,
            event_date=ev.event_date,
            google_event_id=ev.google_event_id,
            synced_to_calendar=ev.synced_to_calendar,
            confidence=ev.confidence,
            created_at=ev.created_at
        ) for ev in events]
    }
