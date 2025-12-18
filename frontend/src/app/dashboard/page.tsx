'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Upload, 
  FileText, 
  Brain, 
  Calendar,
  Plus,
  ChevronRight,
  Clock,
  TrendingUp,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Note, Event, FlashcardStats } from '@/types';

export default function DashboardPage() {
  const { token, anthropicKey } = useAuth();
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [flashcardStats, setFlashcardStats] = useState<FlashcardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token]);

  const loadDashboardData = async () => {
    try {
      const [notes, events, stats] = await Promise.all([
        api.getNotes(token!),
        api.getEvents(token!, true),
        api.getFlashcardStats(token!)
      ]);
      
      setRecentNotes(notes.slice(0, 5));
      setUpcomingEvents(events.slice(0, 5));
      setFlashcardStats(stats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink-900 mb-2">Dashboard</h1>
        <p className="text-ink-600">Welcome back! Here's your study overview.</p>
      </div>

      {/* API Key Warning */}
      {!anthropicKey && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium">API Key Required</p>
            <p className="text-amber-700 text-sm mt-1">
              Add your Anthropic API key to start processing notes. Click "Add API Key" in the sidebar.
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Link 
          href="/dashboard/notes?new=true"
          className="group p-6 bg-white rounded-xl border border-parchment-200 hover:border-accent hover:shadow-paper transition-all"
        >
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
            <Upload className="w-6 h-6 text-accent" />
          </div>
          <h3 className="font-display text-lg text-ink-900 mb-1">Upload Notes</h3>
          <p className="text-sm text-ink-500">Process new lecture notes with AI</p>
        </Link>

        <Link 
          href="/dashboard/flashcards"
          className="group p-6 bg-white rounded-xl border border-parchment-200 hover:border-sage hover:shadow-paper transition-all"
        >
          <div className="w-12 h-12 bg-sage/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-sage/20 transition-colors">
            <Brain className="w-6 h-6 text-sage" />
          </div>
          <h3 className="font-display text-lg text-ink-900 mb-1">Study Flashcards</h3>
          <p className="text-sm text-ink-500">
            {flashcardStats?.due_for_review || 0} cards due for review
          </p>
        </Link>

        <Link 
          href="/dashboard/calendar"
          className="group p-6 bg-white rounded-xl border border-parchment-200 hover:border-ink-400 hover:shadow-paper transition-all"
        >
          <div className="w-12 h-12 bg-ink-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-ink-200 transition-colors">
            <Calendar className="w-6 h-6 text-ink-600" />
          </div>
          <h3 className="font-display text-lg text-ink-900 mb-1">View Calendar</h3>
          <p className="text-sm text-ink-500">
            {upcomingEvents.length} upcoming events
          </p>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Notes */}
        <div className="bg-white rounded-xl border border-parchment-200 overflow-hidden">
          <div className="p-5 border-b border-parchment-200 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink-900">Recent Notes</h2>
            <Link href="/dashboard/notes" className="text-sm text-accent hover:underline flex items-center gap-1">
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="divide-y divide-parchment-100">
            {isLoading ? (
              <div className="p-5 animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-parchment-100 rounded" />
                ))}
              </div>
            ) : recentNotes.length > 0 ? (
              recentNotes.map(note => (
                <Link 
                  key={note.id} 
                  href={`/dashboard/notes/${note.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-parchment-50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    note.status === 'completed' ? 'bg-green-100' :
                    note.status === 'processing' ? 'bg-amber-100' :
                    note.status === 'failed' ? 'bg-red-100' :
                    'bg-parchment-100'
                  }`}>
                    <FileText className={`w-5 h-5 ${
                      note.status === 'completed' ? 'text-green-600' :
                      note.status === 'processing' ? 'text-amber-600' :
                      note.status === 'failed' ? 'text-red-600' :
                      'text-ink-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink-900 truncate">{note.title}</p>
                    <p className="text-sm text-ink-500">
                      {new Date(note.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={note.status} />
                </Link>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-parchment-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-ink-400" />
                </div>
                <p className="text-ink-600 mb-2">No notes yet</p>
                <Link href="/dashboard/notes?new=true" className="text-sm text-accent hover:underline">
                  Upload your first note
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl border border-parchment-200 overflow-hidden">
          <div className="p-5 border-b border-parchment-200 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink-900">Upcoming Events</h2>
            <Link href="/dashboard/calendar" className="text-sm text-accent hover:underline flex items-center gap-1">
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="divide-y divide-parchment-100">
            {isLoading ? (
              <div className="p-5 animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-parchment-100 rounded" />
                ))}
              </div>
            ) : upcomingEvents.length > 0 ? (
              upcomingEvents.map(event => {
                const date = new Date(event.event_date);
                const isToday = new Date().toDateString() === date.toDateString();
                const isTomorrow = new Date(Date.now() + 86400000).toDateString() === date.toDateString();
                
                return (
                  <div key={event.id} className="flex items-center gap-4 p-4">
                    <div className="w-12 h-12 bg-parchment-50 rounded-lg flex flex-col items-center justify-center border border-parchment-200">
                      <span className="text-xs text-ink-400 uppercase">
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-lg font-bold text-ink-900">
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-900 truncate">{event.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          event.event_type === 'exam' ? 'bg-red-100 text-red-700' :
                          event.event_type === 'quiz' ? 'bg-orange-100 text-orange-700' :
                          event.event_type === 'assignment' ? 'bg-blue-100 text-blue-700' :
                          'bg-parchment-100 text-ink-600'
                        }`}>
                          {event.event_type}
                        </span>
                        {isToday && (
                          <span className="text-xs text-red-600 font-medium">Today</span>
                        )}
                        {isTomorrow && (
                          <span className="text-xs text-amber-600 font-medium">Tomorrow</span>
                        )}
                      </div>
                    </div>
                    {event.synced_to_calendar && (
                      <Calendar className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-parchment-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-ink-400" />
                </div>
                <p className="text-ink-600 mb-2">No upcoming events</p>
                <p className="text-sm text-ink-500">
                  Events are extracted from your notes automatically
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {flashcardStats && flashcardStats.total_flashcards > 0 && (
        <div className="mt-8 bg-white rounded-xl border border-parchment-200 p-6">
          <h2 className="font-display text-lg text-ink-900 mb-4">Study Progress</h2>
          <div className="grid sm:grid-cols-4 gap-6">
            <StatCard 
              label="Total Flashcards" 
              value={flashcardStats.total_flashcards} 
              icon={<Brain className="w-5 h-5" />}
            />
            <StatCard 
              label="Due for Review" 
              value={flashcardStats.due_for_review}
              icon={<Clock className="w-5 h-5" />}
              highlight={flashcardStats.due_for_review > 0}
            />
            <StatCard 
              label="Total Reviews" 
              value={flashcardStats.total_reviews}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <StatCard 
              label="Accuracy" 
              value={`${flashcardStats.accuracy_percentage}%`}
              icon={<Sparkles className="w-5 h-5" />}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    completed: 'bg-green-100 text-green-700',
    processing: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
    pending: 'bg-parchment-100 text-ink-600'
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${styles[status as keyof typeof styles] || styles.pending}`}>
      {status}
    </span>
  );
}

function StatCard({ 
  label, 
  value, 
  icon,
  highlight = false
}: { 
  label: string; 
  value: number | string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl ${highlight ? 'bg-accent/10' : 'bg-parchment-50'}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
        highlight ? 'bg-accent/20 text-accent' : 'bg-parchment-200 text-ink-600'
      }`}>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${highlight ? 'text-accent' : 'text-ink-900'}`}>
        {value}
      </p>
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  );
}
