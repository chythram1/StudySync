from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db, User, Course, Note
from app.schemas import CourseCreate, CourseUpdate, CourseResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("", response_model=List[CourseResponse])
async def get_courses(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all courses for the current user."""
    
    courses = db.query(Course).filter(Course.user_id == user.id).all()
    
    # Add notes count
    result = []
    for course in courses:
        notes_count = db.query(Note).filter(Note.course_id == course.id).count()
        result.append(CourseResponse(
            id=course.id,
            user_id=course.user_id,
            name=course.name,
            description=course.description,
            color=course.color,
            created_at=course.created_at,
            notes_count=notes_count
        ))
    
    return result


@router.post("", response_model=CourseResponse)
async def create_course(
    course_data: CourseCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new course."""
    
    course = Course(
        user_id=user.id,
        name=course_data.name,
        description=course_data.description,
        color=course_data.color
    )
    
    db.add(course)
    db.commit()
    db.refresh(course)
    
    return CourseResponse(
        id=course.id,
        user_id=course.user_id,
        name=course.name,
        description=course.description,
        color=course.color,
        created_at=course.created_at,
        notes_count=0
    )


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific course."""
    
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.user_id == user.id
    ).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    notes_count = db.query(Note).filter(Note.course_id == course.id).count()
    
    return CourseResponse(
        id=course.id,
        user_id=course.user_id,
        name=course.name,
        description=course.description,
        color=course.color,
        created_at=course.created_at,
        notes_count=notes_count
    )


@router.patch("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    course_data: CourseUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a course."""
    
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.user_id == user.id
    ).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if course_data.name is not None:
        course.name = course_data.name
    if course_data.description is not None:
        course.description = course_data.description
    if course_data.color is not None:
        course.color = course_data.color
    
    db.commit()
    db.refresh(course)
    
    notes_count = db.query(Note).filter(Note.course_id == course.id).count()
    
    return CourseResponse(
        id=course.id,
        user_id=course.user_id,
        name=course.name,
        description=course.description,
        color=course.color,
        created_at=course.created_at,
        notes_count=notes_count
    )


@router.delete("/{course_id}")
async def delete_course(
    course_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a course and all associated notes."""
    
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.user_id == user.id
    ).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    db.delete(course)
    db.commit()
    
    return {"message": "Course deleted successfully"}
