'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Brain, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Trophy,
  Target,
  Clock
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Flashcard, FlashcardStats } from '@/types';

export default function FlashcardsPage() {
  const { token } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [stats, setStats] = useState<FlashcardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyMode, setStudyMode] = useState<'all' | 'due'>('due');
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, easy: 0, medium: 0, hard: 0 });

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, studyMode]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cardsData, statsData] = await Promise.all([
        api.getFlashcards(token!, undefined, studyMode === 'due'),
        api.getFlashcardStats(token!)
      ]);
      setFlashcards(cardsData);
      setStats(statsData);
      setCurrentIndex(0);
      setShowAnswer(false);
    } catch (error) {
      console.error('Failed to load flashcards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (difficulty: 'easy' | 'medium' | 'hard') => {
    const card = flashcards[currentIndex];
    if (!card) return;

    try {
      await api.reviewFlashcard(token!, card.id, difficulty);
      
      setSessionStats(prev => ({
        ...prev,
        reviewed: prev.reviewed + 1,
        [difficulty]: prev[difficulty] + 1
      }));

      // Move to next card
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(i => i + 1);
        setShowAnswer(false);
      } else {
        // End of deck
        setFlashcards([]);
      }
    } catch (error) {
      console.error('Failed to review flashcard:', error);
    }
  };

  const currentCard = flashcards[currentIndex];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink-900 mb-2">Flashcards</h1>
        <p className="text-ink-600">Review and strengthen your knowledge</p>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Brain />} value={stats.total_flashcards} label="Total Cards" />
          <StatCard icon={<Clock />} value={stats.due_for_review} label="Due Today" highlight />
          <StatCard icon={<Target />} value={stats.total_reviews} label="Reviews" />
          <StatCard icon={<Trophy />} value={`${stats.accuracy_percentage}%`} label="Accuracy" />
        </div>
      )}

      {/* Mode Toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className="flex rounded-lg bg-parchment-100 p-1">
          <button
            onClick={() => setStudyMode('due')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              studyMode === 'due' 
                ? 'bg-white text-ink-900 shadow-sm' 
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            Due for Review ({stats?.due_for_review || 0})
          </button>
          <button
            onClick={() => setStudyMode('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              studyMode === 'all' 
                ? 'bg-white text-ink-900 shadow-sm' 
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            All Cards ({stats?.total_flashcards || 0})
          </button>
        </div>
      </div>

      {/* Flashcard Area */}
      {isLoading ? (
        <div className="h-64 bg-parchment-100 rounded-2xl animate-pulse" />
      ) : flashcards.length > 0 && currentCard ? (
        <div className="animate-fade-in">
          {/* Progress */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-ink-500">
              Card {currentIndex + 1} of {flashcards.length}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full ${
              currentCard.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
              currentCard.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {currentCard.difficulty}
            </span>
          </div>

          {/* Card */}
          <div 
            onClick={() => setShowAnswer(!showAnswer)}
            className="min-h-[280px] bg-white rounded-2xl shadow-paper border border-parchment-200 p-8 flex flex-col items-center justify-center cursor-pointer hover:shadow-paper-lg transition-all"
          >
            {showAnswer ? (
              <div className="text-center animate-fade-in">
                <p className="text-xs text-ink-400 uppercase tracking-wider mb-3">Answer</p>
                <p className="text-xl text-ink-800 leading-relaxed">{currentCard.back}</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs text-ink-400 uppercase tracking-wider mb-3">Question</p>
                <p className="text-xl text-ink-900 font-medium leading-relaxed">{currentCard.front}</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-6 space-y-4">
            {!showAnswer ? (
              <button
                onClick={() => setShowAnswer(true)}
                className="w-full py-3 bg-parchment-100 text-ink-700 rounded-xl hover:bg-parchment-200 transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                Show Answer
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-sm text-ink-500">How well did you know this?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReview('hard')}
                    className="flex-1 py-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <ThumbsDown className="w-5 h-5" />
                    Hard
                  </button>
                  <button
                    onClick={() => handleReview('medium')}
                    className="flex-1 py-3 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Minus className="w-5 h-5" />
                    Medium
                  </button>
                  <button
                    onClick={() => handleReview('easy')}
                    className="flex-1 py-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <ThumbsUp className="w-5 h-5" />
                    Easy
                  </button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => { setCurrentIndex(i => Math.max(0, i - 1)); setShowAnswer(false); }}
                disabled={currentIndex === 0}
                className="p-2 text-ink-400 hover:text-ink-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => { setCurrentIndex(0); setShowAnswer(false); }}
                className="text-sm text-ink-500 hover:text-ink-700"
              >
                <RotateCcw className="w-4 h-4 inline mr-1" />
                Restart
              </button>
              <button
                onClick={() => { setCurrentIndex(i => Math.min(flashcards.length - 1, i + 1)); setShowAnswer(false); }}
                disabled={currentIndex === flashcards.length - 1}
                className="p-2 text-ink-400 hover:text-ink-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-paper border border-parchment-200 p-12 text-center">
          {sessionStats.reviewed > 0 ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-display text-2xl text-ink-900 mb-2">Great work!</h3>
              <p className="text-ink-600 mb-6">
                You reviewed {sessionStats.reviewed} cards this session
              </p>
              <div className="flex justify-center gap-6 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{sessionStats.easy}</p>
                  <p className="text-sm text-ink-500">Easy</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{sessionStats.medium}</p>
                  <p className="text-sm text-ink-500">Medium</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{sessionStats.hard}</p>
                  <p className="text-sm text-ink-500">Hard</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSessionStats({ reviewed: 0, easy: 0, medium: 0, hard: 0 });
                  loadData();
                }}
                className="btn-primary"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Study More
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-parchment-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-ink-400" />
              </div>
              <h3 className="font-display text-xl text-ink-900 mb-2">
                {studyMode === 'due' ? 'All caught up!' : 'No flashcards yet'}
              </h3>
              <p className="text-ink-600 mb-6">
                {studyMode === 'due' 
                  ? 'You have no cards due for review right now'
                  : 'Upload notes to generate flashcards'}
              </p>
              {studyMode === 'due' && stats && stats.total_flashcards > 0 && (
                <button
                  onClick={() => setStudyMode('all')}
                  className="btn-secondary"
                >
                  Study All Cards
                </button>
              )}
              {studyMode === 'all' && (
                <Link href="/dashboard/notes?new=true" className="btn-primary">
                  Upload Notes
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ 
  icon, 
  value, 
  label, 
  highlight = false 
}: { 
  icon: React.ReactNode; 
  value: number | string; 
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl ${highlight ? 'bg-accent/10' : 'bg-white border border-parchment-200'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
        highlight ? 'bg-accent/20 text-accent' : 'bg-parchment-100 text-ink-500'
      }`}>
        {icon}
      </div>
      <p className={`text-xl font-bold ${highlight ? 'text-accent' : 'text-ink-900'}`}>
        {value}
      </p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}
