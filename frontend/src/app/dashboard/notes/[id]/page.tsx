'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  FileText,
  Brain,
  Calendar,
  HelpCircle,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { NoteDetail } from '@/types';

export default function NoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, anthropicKey } = useAuth();
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'flashcards' | 'questions' | 'events'>('summary');
  const [isReprocessing, setIsReprocessing] = useState(false);

  useEffect(() => {
    if (token && params.id) {
      loadNote();
    }
  }, [token, params.id]);

  // Poll for updates if processing
  useEffect(() => {
    if (note?.status === 'processing') {
      const interval = setInterval(loadNote, 3000);
      return () => clearInterval(interval);
    }
  }, [note?.status]);

  const loadNote = async () => {
    try {
      const data = await api.getNote(token!, params.id as string);
      setNote(data);
    } catch (error) {
      console.error('Failed to load note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReprocess = async () => {
    if (!anthropicKey) return;
    
    setIsReprocessing(true);
    try {
      await api.reprocessNote(token!, anthropicKey, params.id as string);
      await loadNote();
    } catch (error) {
      console.error('Failed to reprocess:', error);
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await api.deleteNote(token!, params.id as string);
      router.push('/dashboard/notes');
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleSyncEvents = async (eventIds: string[]) => {
    try {
      await api.syncEvents(token!, eventIds, true);
      await loadNote();
    } catch (error) {
      console.error('Failed to sync events:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-parchment-200 rounded mb-4" />
          <div className="h-4 w-32 bg-parchment-200 rounded mb-8" />
          <div className="h-64 bg-parchment-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <h2 className="text-xl text-ink-900">Note not found</h2>
          <Link href="/dashboard/notes" className="text-accent hover:underline mt-2 inline-block">
            Back to notes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/dashboard/notes" 
          className="inline-flex items-center gap-2 text-ink-500 hover:text-ink-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to notes
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl text-ink-900 mb-2">{note.title}</h1>
            <div className="flex items-center gap-3">
              <StatusBadge status={note.status} />
              <span className="text-sm text-ink-500">
                Uploaded {new Date(note.uploaded_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {note.status === 'failed' && (
              <button
                onClick={handleReprocess}
                disabled={isReprocessing || !anthropicKey}
                className="btn-secondary"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isReprocessing ? 'animate-spin' : ''}`} />
                Reprocess
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-2 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Processing State */}
      {note.status === 'processing' && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
          <div>
            <p className="text-amber-800 font-medium">Processing your notes...</p>
            <p className="text-amber-700 text-sm">This usually takes 30-60 seconds</p>
          </div>
        </div>
      )}

      {/* Failed State */}
      {note.status === 'failed' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-red-800 font-medium">Processing failed</p>
            <p className="text-red-700 text-sm">{note.error_message || 'An error occurred while processing'}</p>
          </div>
        </div>
      )}

      {/* Content */}
      {note.status === 'completed' && (
        <div className="bg-white rounded-2xl shadow-paper border border-parchment-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-parchment-200">
            <TabButton 
              active={activeTab === 'summary'} 
              onClick={() => setActiveTab('summary')}
              icon={<FileText className="w-4 h-4" />}
              label="Summary"
            />
            <TabButton 
              active={activeTab === 'flashcards'} 
              onClick={() => setActiveTab('flashcards')}
              icon={<Brain className="w-4 h-4" />}
              label={`Flashcards (${note.flashcards.length})`}
            />
            <TabButton 
              active={activeTab === 'questions'} 
              onClick={() => setActiveTab('questions')}
              icon={<HelpCircle className="w-4 h-4" />}
              label={`Questions (${note.study_questions.length})`}
            />
            <TabButton 
              active={activeTab === 'events'} 
              onClick={() => setActiveTab('events')}
              icon={<Calendar className="w-4 h-4" />}
              label={`Events (${note.extracted_events.length})`}
            />
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'summary' && (
              <div className="animate-fade-in">
                <div className="prose-study mb-8">
                  {note.processed_summary?.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
                
                {note.key_concepts && note.key_concepts.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-display text-lg text-ink-900 mb-3">Key Concepts</h3>
                    <div className="flex flex-wrap gap-2">
                      {note.key_concepts.map((concept, i) => (
                        <span 
                          key={i}
                          className="px-3 py-1.5 bg-sage/10 text-sage-dark rounded-full text-sm"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {note.knowledge_gaps && note.knowledge_gaps.length > 0 && (
                  <div>
                    <h3 className="font-display text-lg text-ink-900 mb-3">Areas to Review</h3>
                    <ul className="space-y-2">
                      {note.knowledge_gaps.map((gap, i) => (
                        <li key={i} className="flex items-start gap-2 text-ink-700">
                          <AlertCircle className="w-4 h-4 text-amber-500 mt-1 flex-shrink-0" />
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'flashcards' && (
              <div className="animate-fade-in">
                {note.flashcards.length > 0 ? (
                  <div className="space-y-4">
                    {note.flashcards.map((fc, i) => (
                      <FlashcardPreview key={fc.id} flashcard={fc} index={i} />
                    ))}
                    <Link 
                      href="/dashboard/flashcards" 
                      className="btn-primary inline-flex mt-4"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Study All Flashcards
                    </Link>
                  </div>
                ) : (
                  <p className="text-ink-500">No flashcards generated</p>
                )}
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="animate-fade-in space-y-6">
                {note.study_questions.length > 0 ? (
                  note.study_questions.map((q, i) => (
                    <QuestionCard key={q.id} question={q} index={i} />
                  ))
                ) : (
                  <p className="text-ink-500">No study questions generated</p>
                )}
              </div>
            )}

            {activeTab === 'events' && (
              <div className="animate-fade-in">
                {note.extracted_events.length > 0 ? (
                  <div className="space-y-4">
                    {note.extracted_events.map(event => (
                      <EventCard 
                        key={event.id} 
                        event={event}
                        onSync={() => handleSyncEvents([event.id])}
                      />
                    ))}
                    {note.extracted_events.some(e => !e.synced_to_calendar) && (
                      <button
                        onClick={() => handleSyncEvents(
                          note.extracted_events.filter(e => !e.synced_to_calendar).map(e => e.id)
                        )}
                        className="btn-primary mt-4"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Sync All to Calendar
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-ink-500">No events found in notes</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    completed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', label: 'Completed' },
    processing: { icon: Loader2, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Processing', animate: true },
    failed: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Failed' },
    pending: { icon: Clock, color: 'text-ink-400', bg: 'bg-parchment-100', label: 'Pending' }
  };

  const cfg = config[status as keyof typeof config] || config.pending;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm ${cfg.bg} ${cfg.color}`}>
      <Icon className={`w-3.5 h-3.5 ${cfg.animate ? 'animate-spin' : ''}`} />
      {cfg.label}
    </span>
  );
}

function TabButton({ 
  active, 
  onClick, 
  icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active 
          ? 'border-accent text-accent' 
          : 'border-transparent text-ink-500 hover:text-ink-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function FlashcardPreview({ flashcard, index }: { flashcard: any; index: number }) {
  const [showAnswer, setShowAnswer] = useState(false);
  
  return (
    <div className="border border-parchment-200 rounded-xl overflow-hidden">
      <div className="p-4 bg-parchment-50">
        <div className="flex items-start justify-between">
          <p className="font-medium text-ink-900">{flashcard.front}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            flashcard.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
            flashcard.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {flashcard.difficulty}
          </span>
        </div>
      </div>
      {showAnswer ? (
        <div className="p-4 border-t border-parchment-200">
          <p className="text-ink-700">{flashcard.back}</p>
        </div>
      ) : (
        <button
          onClick={() => setShowAnswer(true)}
          className="w-full p-3 text-sm text-accent hover:bg-accent/5 transition-colors border-t border-parchment-200"
        >
          Show answer
        </button>
      )}
    </div>
  );
}

function QuestionCard({ question, index }: { question: any; index: number }) {
  const [showAnswer, setShowAnswer] = useState(false);
  
  return (
    <div className="border border-parchment-200 rounded-xl overflow-hidden">
      <div className="p-4 bg-parchment-50">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 bg-ink-900 text-parchment-50 rounded-full flex items-center justify-center text-sm font-medium">
            {index + 1}
          </span>
          <div>
            <span className="text-xs text-ink-400 uppercase tracking-wider">
              {question.question_type}
            </span>
            <p className="text-ink-900 mt-1">{question.question}</p>
          </div>
        </div>
      </div>
      
      {showAnswer ? (
        <div className="p-4 border-t border-parchment-200 bg-white">
          <p className="text-sm text-ink-400 mb-2">Suggested Answer:</p>
          <p className="text-ink-700">{question.suggested_answer}</p>
        </div>
      ) : (
        <button
          onClick={() => setShowAnswer(true)}
          className="w-full p-3 text-sm text-accent hover:bg-accent/5 transition-colors border-t border-parchment-200"
        >
          Show answer
        </button>
      )}
    </div>
  );
}

function EventCard({ event, onSync }: { event: any; onSync: () => void }) {
  const date = new Date(event.event_date);
  
  return (
    <div className="flex items-center gap-4 p-4 bg-parchment-50 rounded-xl border border-parchment-200">
      <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex flex-col items-center justify-center border border-parchment-200">
        <span className="text-xs text-ink-400 uppercase">
          {date.toLocaleDateString('en-US', { month: 'short' })}
        </span>
        <span className="text-lg font-bold text-ink-900">
          {date.getDate()}
        </span>
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-ink-900">{event.title}</h4>
        <div className="flex items-center gap-3 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            event.event_type === 'exam' ? 'bg-red-100 text-red-700' :
            event.event_type === 'quiz' ? 'bg-orange-100 text-orange-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {event.event_type}
          </span>
          <span className="text-sm text-ink-500">
            {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>
      </div>
      {event.synced_to_calendar ? (
        <div className="flex items-center gap-1.5 text-green-600 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          Synced
        </div>
      ) : (
        <button
          onClick={onSync}
          className="btn-secondary text-sm py-1.5"
        >
          <Calendar className="w-4 h-4 mr-1.5" />
          Sync
        </button>
      )}
    </div>
  );
}
