from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from typing import List, Optional
from datetime import datetime
import json
import fitz  # PyMuPDF
import re


class NoteProcessor:
    """Process notes using LangChain and OpenI."""
    
    def __init__(self, api_key: str):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini", 
            api_key=api_key,
            max_tokens=4096
        )
    
    async def process_note(
        self, 
        content: str, 
        course_name: Optional[str] = None
    ) -> dict:
        """Process a note and generate all study materials."""
        
        processed_note = await self._summarize(content, course_name)
        flashcards = await self._generate_flashcards(content, processed_note.get("key_concepts", []))
        questions = await self._generate_questions(content, processed_note.get("key_concepts", []))
        events = await self._extract_events(content)
        
        return {
            "processed_note": processed_note,
            "flashcards": flashcards,
            "study_questions": questions,
            "extracted_events": events
        }
    
    def _parse_json_response(self, text: str) -> dict:
        """Extract JSON from LLM response."""
        text = text.strip()
        
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        
        text = text.strip()
        
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r'\{[\s\S]*\}', text)
            if match:
                try:
                    return json.loads(match.group())
                except json.JSONDecodeError:
                    pass
            return {}
    
    async def _summarize(self, content: str, course_name: Optional[str] = None) -> dict:
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a study assistant. Analyze the notes and respond with JSON containing: \"summary\" (2-4 paragraph summary), \"key_concepts\" (array of strings), and \"gaps_or_unclear\" (array of areas needing more study). Respond ONLY with valid JSON, no other text."),
            ("human", "Course: {course_name}\n\nNotes:\n{content}")
        ])
        
        chain = prompt | self.llm
        result = await chain.ainvoke({
            "content": content[:15000],
            "course_name": course_name or "Not specified"
        })
        
        return self._parse_json_response(result.content)
    
    async def _generate_flashcards(self, content: str, key_concepts: List[str]) -> List[dict]:
        prompt = ChatPromptTemplate.from_messages([
            ("system", "Create 5-10 flashcards from the notes. Respond with JSON containing a \"flashcards\" array. Each flashcard has \"front\" (question), \"back\" (answer), and \"difficulty\" (easy, medium, or hard). Respond ONLY with valid JSON, no other text."),
            ("human", "Key concepts: {concepts}\n\nNotes:\n{content}")
        ])
        
        chain = prompt | self.llm
        result = await chain.ainvoke({
            "content": content[:12000],
            "concepts": ", ".join(key_concepts[:10]) if key_concepts else "main topics"
        })
        
        parsed = self._parse_json_response(result.content)
        return parsed.get("flashcards", [])
    
    async def _generate_questions(self, content: str, key_concepts: List[str]) -> List[dict]:
        prompt = ChatPromptTemplate.from_messages([
            ("system", "Create 3-5 study questions from the notes. Respond with JSON containing a \"questions\" array. Each question has \"question\", \"suggested_answer\", and \"question_type\" (recall, conceptual, or application). Respond ONLY with valid JSON, no other text."),
            ("human", "Key concepts: {concepts}\n\nNotes:\n{content}")
        ])
        
        chain = prompt | self.llm
        result = await chain.ainvoke({
            "content": content[:12000],
            "concepts": ", ".join(key_concepts[:10]) if key_concepts else "main topics"
        })
        
        parsed = self._parse_json_response(result.content)
        return parsed.get("questions", [])
    
    async def _extract_events(self, content: str) -> List[dict]:
        current_date = datetime.now().strftime("%Y-%m-%d")
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", "Extract dates and deadlines from notes. Today is {current_date}. Respond with JSON containing an \"events\" array. Each event has \"title\", \"event_type\" (exam, assignment, quiz, project, or lecture), \"date\" (ISO format YYYY-MM-DDTHH:MM:SS), and \"confidence\" (0.0 to 1.0). If no dates found, respond with empty events array. Respond ONLY with valid JSON, no other text."),
            ("human", "{content}")
        ])
        
        chain = prompt | self.llm
        result = await chain.ainvoke({
            "content": content[:10000],
            "current_date": current_date
        })
        
        parsed = self._parse_json_response(result.content)
        events = parsed.get("events", [])
        
        valid_events = []
        for event in events:
            try:
                date_str = event.get("date", "")
                if date_str:
                    datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    valid_events.append(event)
            except (ValueError, TypeError):
                continue
        
        return valid_events


def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text


def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    filename_lower = filename.lower()
    
    if filename_lower.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif filename_lower.endswith((".txt", ".md", ".markdown")):
        return file_bytes.decode("utf-8", errors="ignore")
    elif filename_lower.endswith((".html", ".htm")):
        text = file_bytes.decode("utf-8", errors="ignore")
        text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    else:
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            raise ValueError(f"Unsupported file type: {filename}")


async def validate_api_key(api_key: str) -> tuple[bool, Optional[str]]:
    try:
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=api_key,
            max_tokens=10
        )
        await llm.ainvoke("Hi")
        return True, None
    except Exception as e:
        error_str = str(e).lower()
        if "invalid" in error_str or "auth" in error_str:
            return False, "Invalid API key"
        elif "rate" in error_str:
            return False, "Rate limit exceeded"
        else:
            return False, f"API error: {str(e)[:100]}"