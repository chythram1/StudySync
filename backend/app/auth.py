from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db, User

security = HTTPBearer(auto_error=False)


def create_access_token(user_id: str, email: str) -> str:
    """Create a JWT access token."""
    
    expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)
    
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def verify_token(token: str) -> dict:
    """Verify and decode a JWT token."""
    
    try:
        payload = jwt.decode(
            token, 
            settings.jwt_secret, 
            algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user."""
    
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = verify_token(credentials.credentials)
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get the current user if authenticated, otherwise None."""
    
    if not credentials:
        return None
    
    try:
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
        
        if not user_id:
            return None
        
        return db.query(User).filter(User.id == user_id).first()
    except HTTPException:
        return None


def get_anthropic_key(
    x_anthropic_key: Optional[str] = Header(None, alias="X-Anthropic-Key")
) -> Optional[str]:
    """Extract Anthropic API key from request header."""
    return x_anthropic_key


def require_anthropic_key(
    x_anthropic_key: Optional[str] = Header(None, alias="X-Anthropic-Key")
) -> str:
    """Require API key in request header."""
    
    if not x_anthropic_key:
        raise HTTPException(
            status_code=400, 
            detail="API key required. Add X-Anthropic-Key header."
        )
    
    # Accept both OpenAI (sk-) and Anthropic (sk-ant-) keys
    if not x_anthropic_key.startswith("sk-"):
        raise HTTPException(
            status_code=400,
            detail="Invalid API key format. Key should start with 'sk-'"
        )
    
    return x_anthropic_key