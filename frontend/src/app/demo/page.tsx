'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  ArrowLeft, 
  FileText, 
  Brain,
  Calendar,
  ChevronRight,
  Lightbulb,
  HelpCircle,
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { api } from '@/lib/api';
import { DemoNote } from '@/types';

export default function DemoPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<DemoNote | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'flashcards' | 'questions' | 'events'>('summary');
  const [isLoading, setIsLoading] = useState(true);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    loadDemoNotes();
  }, []);

  const loadDemoNotes = async () => {
    try {
      const data = await api.getDemoNotes();
      setNotes(data);
    } catch (error) {
      console.error('Failed to load demo notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNoteDetail = async (noteId: string) => {
    try {
      const data = await api.getDemoNote(noteId);
      setSelectedNote(data);
      setActiveTab('summary');
      setFlashcardIndex(0);
      setShowAnswer(false);
    } catch (error) {
      console.error('Failed to load note:', error);
    }
  };

  return (
    <div className="min-h-screen bg-parchment-50">
      {/* Header */}
      <header className="border-b border-parchment-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-ink-500 hover:text-ink-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-ink-900 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-parchment-50" />
              </div>
              <span className="font-display text-xl text-ink-900">StudySync</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <span className="px-2 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
              Demo Mode
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Demo Banner */}
        <div className="mb-8 p-4 bg-gradient-to-r from-accent/5 to-sage/5 rounded-xl border border-accent/20">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-accent mt-0.5" />
            <div>
              <p className="text-ink-800 font-medium">Interactive Demo</p>
              <p className="text-ink-600 text-sm mt-1">
                Explore pre-processed notes to see how StudySync transforms your study materials.
                To process your own notes,{' '}
                <Link href="/dashboard" className="text-accent hover:underline">
                  sign up and add your API key
                </Link>.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Note List */}
          <div className="lg:col-span-1">
            <h2 className="font-display text-lg text-ink-900 mb-4">Sample Notes</h2>
            <div className="space-y-3">
              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-parchment-200 rounded-xl" />
                  ))}
                </div>
              ) : (
                notes.map(note => (
                  <button
                    key={note.id}
                    onClick={() => loadNoteDetail(note.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      selectedNote?.id === note.id 
                        ? 'bg-white border-accent shadow-paper' 
                        : 'bg-white/50 border-parchment-200 hover:bg-white hover:shadow-paper'
                    }`}
                  >
                    <h3 className="font-medium text-ink-900 mb-1 line-clamp-1">{note.title}</h3>
                    <p className="text-sm text-ink-500 mb-3">{note.course_name}</p>
                    <div className="flex gap-3 text-xs text-ink-400">
                      <span>{note.flashcards_count} cards</span>
                      <span>{note.questions_count} questions</span>
                      <span>{note.events_count} events</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Note Detail */}
          <div className="lg:col-span-2">
            {selectedNote ? (
              <div className="bg-white rounded-2xl shadow-paper border border-parchment-200 overflow-hidden">
                {/* Note Header */}
                <div className="p-6 border-b border-parchment-200">
                  <p className="text-sm text-accent font-medium mb-2">{selectedNote.course_name}</p>
                  <h1 className="font-display text-2xl text-ink-900">{selectedNote.title}</h1>
                </div>

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
                    onClick={() => { setActiveTab('flashcards'); setFlashcardIndex(0); setShowAnswer(false); }}
                    icon={<Brain className="w-4 h-4" />}
                    label={`Flashcards (${selectedNote.flashcards.length})`}
                  />
                  <TabButton 
                    active={activeTab === 'questions'} 
                    onClick={() => setActiveTab('questions')}
                    icon={<HelpCircle className="w-4 h-4" />}
                    label={`Questions (${selectedNote.questions.length})`}
                  />
                  <TabButton 
                    active={activeTab === 'events'} 
                    onClick={() => setActiveTab('events')}
                    icon={<Calendar className="w-4 h-4" />}
                    label={`Events (${selectedNote.events.length})`}
                  />
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'summary' && (
                    <div className="animate-fade-in">
                      <div className="prose-study mb-8">
                        {selectedNote.summary.split('\n\n').map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                      </div>
                      
                      <div>
                        <h3 className="font-display text-lg text-ink-900 mb-3">Key Concepts</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedNote.key_concepts.map((concept, i) => (
                            <span 
                              key={i}
                              className="px-3 py-1.5 bg-sage/10 text-sage-dark rounded-full text-sm"
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'flashcards' && selectedNote.flashcards.length > 0 && (
                    <div className="animate-fade-in">
                      <FlashcardViewer 
                        flashcards={selectedNote.flashcards}
                        currentIndex={flashcardIndex}
                        showAnswer={showAnswer}
                        onNext={() => {
                          setFlashcardIndex(i => (i + 1) % selectedNote.flashcards.length);
                          setShowAnswer(false);
                        }}
                        onPrev={() => {
                          setFlashcardIndex(i => i === 0 ? selectedNote.flashcards.length - 1 : i - 1);
                          setShowAnswer(false);
                        }}
                        onFlip={() => setShowAnswer(!showAnswer)}
                      />
                    </div>
                  )}

                  {activeTab === 'questions' && (
                    <div className="animate-fade-in space-y-6">
                      {selectedNote.questions.map((q, i) => (
                        <QuestionCard key={q.id} question={q} index={i} />
                      ))}
                    </div>
                  )}

                  {activeTab === 'events' && (
                    <div className="animate-fade-in space-y-4">
                      {selectedNote.events.map(event => (
                        <EventCard key={event.id} event={event} />
                      ))}
                      <p className="text-sm text-ink-500 mt-4">
                        💡 In the full app, these events sync directly to your Google Calendar
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-paper border border-parchment-200 p-12 text-center">
                <div className="w-16 h-16 bg-parchment-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-ink-400" />
                </div>
                <h3 className="font-display text-xl text-ink-900 mb-2">Select a note to explore</h3>
                <p className="text-ink-500">
                  Click on any of the sample notes to see how StudySync processes them
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-ink-600 mb-4">Ready to process your own notes?</p>
          <Link href="/dashboard" className="btn-primary inline-flex items-center">
            Get started
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
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

function FlashcardViewer({ 
  flashcards, 
  currentIndex, 
  showAnswer,
  onNext, 
  onPrev,
  onFlip
}: { 
  flashcards: any[]; 
  currentIndex: number;
  showAnswer: boolean;
  onNext: () => void;
  onPrev: () => void;
  onFlip: () => void;
}) {
  const card = flashcards[currentIndex];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-ink-500">
          Card {currentIndex + 1} of {flashcards.length}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          card.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
          card.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {card.difficulty}
        </span>
      </div>

      <div 
        onClick={onFlip}
        className="min-h-[200px] bg-gradient-to-br from-parchment-50 to-parchment-100 rounded-xl p-8 flex items-center justify-center cursor-pointer hover:shadow-paper-lg transition-shadow border border-parchment-200"
      >
        <div className="text-center">
          {showAnswer ? (
            <>
              <p className="text-xs text-ink-400 uppercase tracking-wider mb-2">Answer</p>
              <p className="text-lg text-ink-800">{card.back}</p>
            </>
          ) : (
            <>
              <p className="text-xs text-ink-400 uppercase tracking-wider mb-2">Question</p>
              <p className="text-lg text-ink-900 font-medium">{card.front}</p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          onClick={onPrev}
          className="p-2 text-ink-500 hover:text-ink-900 hover:bg-parchment-100 rounded-lg transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={onFlip}
          className="px-4 py-2 bg-parchment-100 text-ink-700 rounded-lg hover:bg-parchment-200 transition-colors flex items-center gap-2"
        >
          {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showAnswer ? 'Hide answer' : 'Show answer'}
        </button>
        <button
          onClick={onNext}
          className="px-4 py-2 bg-ink-900 text-parchment-50 rounded-lg hover:bg-ink-800 transition-colors"
        >
          Next card
        </button>
      </div>
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

function EventCard({ event }: { event: any }) {
  const date = new Date(event.date);
  
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
      <Calendar className="w-5 h-5 text-ink-400" />
    </div>
  );
}
