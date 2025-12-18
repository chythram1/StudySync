from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db, User
from app.schemas import GoogleAuthRequest, UserResponse, UserWithToken
from app.services.calendar_service import GoogleAuthService, get_google_auth_url
from app.auth import create_access_token, get_current_user
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/google/url")
async def get_auth_url(include_calendar: bool = True):
    """Get the Google OAuth URL for sign in."""
    
    url = get_google_auth_url(include_calendar_scope=include_calendar)
    return {"url": url}


@router.post("/google/callback", response_model=UserWithToken)
async def google_callback(
    request: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback and create/login user."""
    
    try:
        # Exchange code for tokens
        tokens = await GoogleAuthService.exchange_code(
            request.code, 
            request.redirect_uri
        )
        
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token received")
        
        # Get user info from Google
        user_info = await GoogleAuthService.get_user_info(access_token)
        
        google_id = user_info.get("id")
        email = user_info.get("email")
        name = user_info.get("name")
        picture = user_info.get("picture")
        
        if not email:
            raise HTTPException(status_code=400, detail="No email received from Google")
        
        # Find or create user
        user = db.query(User).filter(User.google_id == google_id).first()
        
        if not user:
            # Check if user exists by email
            user = db.query(User).filter(User.email == email).first()
            
            if user:
                # Link Google account to existing user
                user.google_id = google_id
            else:
                # Create new user
                user = User(
                    email=email,
                    name=name,
                    picture=picture,
                    google_id=google_id
                )
                db.add(user)
        
        # Update refresh token if provided
        if refresh_token:
            user.google_refresh_token = refresh_token
        
        # Update user info
        user.name = name
        user.picture = picture
        
        db.commit()
        db.refresh(user)
        
        # Create JWT token
        jwt_token = create_access_token(user.id, user.email)
        
        return UserWithToken(
            user=UserResponse(
                id=user.id,
                email=user.email,
                name=user.name,
                picture=user.picture,
                created_at=user.created_at,
                has_calendar_access=bool(user.google_refresh_token)
            ),
            access_token=jwt_token
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Get the current user's info."""
    
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        picture=user.picture,
        created_at=user.created_at,
        has_calendar_access=bool(user.google_refresh_token)
    )


@router.post("/logout")
async def logout(user: User = Depends(get_current_user)):
    """Logout endpoint (client should discard token)."""
    
    return {"message": "Logged out successfully"}
