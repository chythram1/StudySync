export interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  created_at: string;
  has_calendar_access: boolean;
}

export interface Course {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  notes_count: number;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  course_id: string | null;
  original_filename: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  uploaded_at: string;
  processed_at: string | null;
}

export interface NoteDetail extends Note {
  original_content: string | null;
  processed_summary: string | null;
  key_concepts: string[] | null;
  knowledge_gaps: string[] | null;
  flashcards: Flashcard[];
  study_questions: StudyQuestion[];
  extracted_events: Event[];
}

export interface Flashcard {
  id: string;
  note_id: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  times_reviewed: number;
  times_correct: number;
  last_reviewed: string | null;
  next_review: string | null;
  created_at: string;
}

export interface StudyQuestion {
  id: string;
  note_id: string;
  question: string;
  suggested_answer: string | null;
  question_type: 'recall' | 'conceptual' | 'application';
  created_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  course_id: string | null;
  source_note_id: string | null;
  title: string;
  description: string | null;
  event_type: 'exam' | 'assignment' | 'quiz' | 'project' | 'study_session' | 'lecture';
  event_date: string;
  google_event_id: string | null;
  synced_to_calendar: boolean;
  confidence: number;
  created_at: string;
}

export interface DemoNote {
  id: string;
  title: string;
  course_name: string;
  summary: string;
  key_concepts: string[];
  flashcards: {
    id: string;
    front: string;
    back: string;
    difficulty: string;
  }[];
  questions: {
    id: string;
    question: string;
    suggested_answer: string;
    question_type: string;
  }[];
  events: {
    id: string;
    title: string;
    event_type: string;
    date: string;
    confidence: number;
  }[];
}

export interface ApiError {
  detail: string;
}

export interface FlashcardStats {
  total_flashcards: number;
  reviewed_at_least_once: number;
  due_for_review: number;
  total_reviews: number;
  accuracy_percentage: number;
}
