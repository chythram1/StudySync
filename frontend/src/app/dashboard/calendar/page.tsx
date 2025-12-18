'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Event } from '@/types';

export default function CalendarPage() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (token) {
      loadEvents();
    }
  }, [token]);

  const loadEvents = async () => {
    try {
      const data = await api.getEvents(token!, false);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEventSelection = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const selectAllUnsynced = () => {
    const unsynced = events.filter(e => !e.synced_to_calendar).map(e => e.id);
    setSelectedEvents(new Set(unsynced));
  };

  const syncSelectedEvents = async (createStudySessions: boolean = false) => {
    if (selectedEvents.size === 0) return;
    
    setIsSyncing(true);
    setSyncMessage(null);
    
    try {
      await api.syncEvents(token!, Array.from(selectedEvents), createStudySessions);
      setSyncMessage({ type: 'success', text: `Successfully synced ${selectedEvents.size} event(s) to Google Calendar!` });
      setSelectedEvents(new Set());
      loadEvents();
    } catch (error) {
      setSyncMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setIsSyncing(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const upcomingEvents = events
    .filter(e => new Date(e.event_date) >= new Date())
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 10);

  const eventTypeColors: Record<string, string> = {
    exam: 'bg-red-100 text-red-700 border-red-200',
    quiz: 'bg-orange-100 text-orange-700 border-orange-200',
    assignment: 'bg-blue-100 text-blue-700 border-blue-200',
    project: 'bg-purple-100 text-purple-700 border-purple-200',
    study_session: 'bg-green-100 text-green-700 border-green-200',
    lecture: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink-900 mb-2">Calendar</h1>
        <p className="text-ink-600">Manage your study events and sync to Google Calendar</p>
      </div>

      {syncMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
          syncMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {syncMessage.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {syncMessage.text}
        </div>
      )}

      {user && !user.has_calendar_access && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium">Calendar Access Required</p>
            <p className="text-amber-700 text-sm mt-1">
              Sign out and sign in again to grant Google Calendar access for syncing events.
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-parchment-200 overflow-hidden">
          <div className="p-4 border-b border-parchment-200 flex items-center justify-between">
            <button onClick={prevMonth} className="p-2 hover:bg-parchment-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-ink-600" />
            </button>
            <h2 className="font-display text-lg text-ink-900">{monthName}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-parchment-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-ink-600" />
            </button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-ink-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 bg-parchment-50 rounded-lg" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const dayEvents = getEventsForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={day}
                    className={`h-24 p-1 rounded-lg border transition-colors ${
                      isToday 
                        ? 'border-accent bg-accent/5' 
                        : 'border-parchment-200 hover:border-parchment-300'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-accent' : 'text-ink-600'}`}>
                      {day}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs px-1 py-0.5 rounded truncate ${eventTypeColors[event.event_type] || 'bg-gray-100 text-gray-700'}`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-ink-400 px-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-parchment-200 overflow-hidden">
          <div className="p-4 border-b border-parchment-200">
            <h2 className="font-display text-lg text-ink-900">Upcoming Events</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-ink-400" />
            </div>
          ) : upcomingEvents.length > 0 ? (
            <>
              <div className="divide-y divide-parchment-100 max-h-96 overflow-y-auto">
                {upcomingEvents.map(event => {
                  const date = new Date(event.event_date);
                  const isSelected = selectedEvents.has(event.id);

                  return (
                    <div
                      key={event.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected ? 'bg-accent/10' : 'hover:bg-parchment-50'
                      }`}
                      onClick={() => !event.synced_to_calendar && toggleEventSelection(event.id)}
                    >
                      <div className="flex items-start gap-3">
                        {!event.synced_to_calendar ? (
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                            isSelected ? 'border-accent bg-accent' : 'border-ink-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded bg-green-100 flex items-center justify-center mt-0.5">
                            <Check className="w-3 h-3 text-green-600" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-ink-900 truncate">{event.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${eventTypeColors[event.event_type] || 'bg-gray-100'}`}>
                              {event.event_type}
                            </span>
                            <span className="text-xs text-ink-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          {event.source_note_id && (
                            <Link
                              href={`/dashboard/notes/${event.source_note_id}`}
                              className="text-xs text-accent hover:underline flex items-center gap-1 mt-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FileText className="w-3 h-3" />
                              View source note
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-parchment-200 bg-parchment-50 space-y-3">
                <button
                  onClick={selectAllUnsynced}
                  className="text-sm text-accent hover:underline"
                >
                  Select all unsynced
                </button>

                <button
                  onClick={() => syncSelectedEvents(false)}
                  disabled={selectedEvents.size === 0 || isSyncing || !user?.has_calendar_access}
                  className="w-full btn-primary text-sm flex items-center justify-center gap-2"
                >
                  {isSyncing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CalendarIcon className="w-4 h-4" />
                  )}
                  Sync to Google Calendar ({selectedEvents.size})
                </button>

                <button
                  onClick={() => syncSelectedEvents(true)}
                  disabled={selectedEvents.size === 0 || isSyncing || !user?.has_calendar_access}
                  className="w-full btn-secondary text-sm"
                >
                  Sync + Create Study Sessions
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <CalendarIcon className="w-12 h-12 text-ink-300 mx-auto mb-3" />
              <p className="text-ink-600 mb-2">No upcoming events</p>
              <p className="text-sm text-ink-500">
                Upload notes with dates to see events here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}