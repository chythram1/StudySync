from google.oauth2.credentials import Credentials
from google.oauth2 import id_token
from google.auth.transport import requests
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from datetime import datetime, timedelta
from typing import Optional, List
import httpx

from app.config import settings


class GoogleAuthService:
    """Handle Google OAuth authentication."""
    
    @staticmethod
    async def exchange_code(code: str, redirect_uri: Optional[str] = None) -> dict:
        """Exchange authorization code for tokens."""
        
        token_url = "https://oauth2.googleapis.com/token"
        
        data = {
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": redirect_uri or settings.google_redirect_uri,
            "grant_type": "authorization_code"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)
            response.raise_for_status()
            return response.json()
    
    @staticmethod
    async def get_user_info(access_token: str) -> dict:
        """Get user info from Google."""
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            response.raise_for_status()
            return response.json()
    
    @staticmethod
    async def refresh_access_token(refresh_token: str) -> dict:
        """Refresh an expired access token."""
        
        token_url = "https://oauth2.googleapis.com/token"
        
        data = {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)
            response.raise_for_status()
            return response.json()


class CalendarService:
    """Handle Google Calendar operations."""
    
    def __init__(self, refresh_token: str):
        self.refresh_token = refresh_token
        self._service = None
    
    async def _get_service(self):
        """Get an authenticated Calendar service."""
        if self._service is None:
            # Refresh the access token
            tokens = await GoogleAuthService.refresh_access_token(self.refresh_token)
            
            creds = Credentials(
                token=tokens["access_token"],
                refresh_token=self.refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=settings.google_client_id,
                client_secret=settings.google_client_secret
            )
            
            self._service = build("calendar", "v3", credentials=creds)
        
        return self._service
    
    async def create_event(
        self,
        title: str,
        start_time: datetime,
        description: Optional[str] = None,
        event_type: str = "exam",
        duration_hours: int = 1,
        color_id: Optional[str] = None,
        add_reminders: bool = True
    ) -> str:
        """Create a calendar event and return the Google event ID."""
        
        service = await self._get_service()
        
        # Map event types to default durations
        duration_map = {
            "exam": 2,
            "quiz": 1,
            "assignment": 1,
            "project": 1,
            "study_session": 2,
            "lecture": 1
        }
        duration = duration_map.get(event_type, duration_hours)
        
        end_time = start_time + timedelta(hours=duration)
        
        event = {
            "summary": title,
            "description": description or f"Event type: {event_type}",
            "start": {
                "dateTime": start_time.isoformat(),
                "timeZone": "America/New_York",  # TODO: Make configurable
            },
            "end": {
                "dateTime": end_time.isoformat(),
                "timeZone": "America/New_York",
            },
        }
        
        if add_reminders:
            event["reminders"] = {
                "useDefault": False,
                "overrides": [
                    {"method": "popup", "minutes": 1440},  # 1 day before
                    {"method": "popup", "minutes": 60},    # 1 hour before
                ]
            }
        
        if color_id:
            event["colorId"] = color_id
        
        try:
            result = service.events().insert(
                calendarId="primary",
                body=event
            ).execute()
            
            return result["id"]
        except HttpError as e:
            raise Exception(f"Failed to create calendar event: {e}")
    
    async def create_study_sessions(
        self,
        exam_title: str,
        exam_date: datetime,
        sessions_count: int = 3,
        study_hour: int = 18  # 6 PM default
    ) -> List[str]:
        """Create spaced study sessions leading up to an exam."""
        
        event_ids = []
        
        # Days before exam for each session
        days_before = [7, 3, 1][:sessions_count]
        
        for i, days in enumerate(days_before):
            session_date = exam_date - timedelta(days=days)
            session_date = session_date.replace(hour=study_hour, minute=0, second=0, microsecond=0)
            
            # Don't create sessions in the past
            if session_date > datetime.now():
                event_id = await self.create_event(
                    title=f"📚 Study: {exam_title} (Session {i + 1}/{sessions_count})",
                    start_time=session_date,
                    description=f"Study session {i + 1} of {sessions_count} for {exam_title}",
                    event_type="study_session",
                    add_reminders=True
                )
                event_ids.append(event_id)
        
        return event_ids
    
    async def delete_event(self, event_id: str) -> bool:
        """Delete a calendar event."""
        
        service = await self._get_service()
        
        try:
            service.events().delete(
                calendarId="primary",
                eventId=event_id
            ).execute()
            return True
        except HttpError:
            return False
    
    async def get_upcoming_events(self, max_results: int = 10) -> List[dict]:
        """Get upcoming calendar events."""
        
        service = await self._get_service()
        
        now = datetime.utcnow().isoformat() + "Z"
        
        try:
            events_result = service.events().list(
                calendarId="primary",
                timeMin=now,
                maxResults=max_results,
                singleEvents=True,
                orderBy="startTime"
            ).execute()
            
            return events_result.get("items", [])
        except HttpError as e:
            raise Exception(f"Failed to fetch calendar events: {e}")


def get_google_auth_url(
    redirect_uri: Optional[str] = None,
    include_calendar_scope: bool = True
) -> str:
    """Generate Google OAuth URL."""
    
    base_url = "https://accounts.google.com/o/oauth2/v2/auth"
    
    scopes = [
        "openid",
        "email",
        "profile"
    ]
    
    if include_calendar_scope:
        scopes.append("https://www.googleapis.com/auth/calendar.events")
    
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": redirect_uri or settings.google_redirect_uri,
        "response_type": "code",
        "scope": " ".join(scopes),
        "access_type": "offline",
        "prompt": "consent"
    }
    
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{base_url}?{query}"
