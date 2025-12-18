'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Calendar, 
  Brain, 
  Sparkles, 
  ArrowRight,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Subtle texture overlay */}
      <div className="fixed inset-0 bg-noise pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-parchment-200/50">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ink-900 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-parchment-50" />
            </div>
            <span className="font-display text-xl text-ink-900">StudySync</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/demo" 
              className="text-ink-600 hover:text-ink-900 transition-colors"
            >
              Try Demo
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard" className="btn-primary">
                Dashboard
              </Link>
            ) : (
              <Link href="/dashboard" className="btn-primary">
                Get Started
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-parchment-100 rounded-full text-sm text-ink-600 mb-6">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>AI-powered study tools</span>
          </div>
          
          <h1 className="font-display text-5xl md:text-6xl text-ink-900 leading-tight mb-6 text-balance">
            Turn messy notes into{' '}
            <span className="text-accent">exam-ready</span>{' '}
            study materials
          </h1>
          
          <p className="text-xl text-ink-600 leading-relaxed mb-10 max-w-2xl">
            Upload your lecture notes and let AI transform them into organized summaries, 
            flashcards, and calendar events. Study smarter, not harder.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link href="/demo" className="btn-primary text-lg px-8 py-3">
              See how it works
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link href="/dashboard" className="btn-secondary text-lg px-8 py-3">
              Start for free
            </Link>
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute right-0 top-20 w-96 h-96 opacity-20 pointer-events-none hidden lg:block">
          <div className="w-full h-full border-2 border-ink-300 rounded-full" />
          <div className="absolute inset-8 border-2 border-ink-300 rounded-full" />
          <div className="absolute inset-16 border-2 border-ink-300 rounded-full" />
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 bg-white border-y border-parchment-200">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl text-ink-900 mb-4">
              Everything you need to ace your exams
            </h2>
            <p className="text-ink-600 text-lg max-w-2xl mx-auto">
              From raw notes to organized study materials in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Brain className="w-6 h-6" />}
              title="Smart Summaries"
              description="AI analyzes your notes to extract key concepts, identify knowledge gaps, and create structured summaries."
            />
            <FeatureCard 
              icon={<FileText className="w-6 h-6" />}
              title="Auto Flashcards"
              description="Automatically generate flashcards with spaced repetition to optimize your memorization and recall."
            />
            <FeatureCard 
              icon={<Calendar className="w-6 h-6" />}
              title="Calendar Sync"
              description="Extract exam dates and deadlines from your notes and sync them directly to Google Calendar."
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl text-ink-900 mb-4">
            How it works
          </h2>
          <p className="text-ink-600 text-lg">
            Three simple steps to transform your study routine
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          <StepCard 
            number="01"
            title="Upload your notes"
            description="Drop in PDFs, text files, or paste your notes directly. We handle messy handwriting and lecture transcripts."
          />
          <StepCard 
            number="02"
            title="AI processes everything"
            description="Our AI reads your notes, identifies key concepts, generates study materials, and extracts important dates."
          />
          <StepCard 
            number="03"
            title="Study and succeed"
            description="Review flashcards, quiz yourself with practice questions, and stay on top of deadlines with calendar integration."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 bg-ink-900 text-parchment-50">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-4">
            Ready to study smarter?
          </h2>
          <p className="text-parchment-300 text-lg mb-8 max-w-xl mx-auto">
            Join students who are using AI to transform their notes into better grades.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/demo" className="btn-secondary">
              Try the demo
            </Link>
            <Link href="/dashboard" className="bg-accent hover:bg-accent-dark text-white px-6 py-2.5 rounded-lg transition-colors inline-flex items-center">
              Get started free
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-parchment-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-ink-900 rounded flex items-center justify-center">
                <BookOpen className="w-3 h-3 text-parchment-50" />
              </div>
              <span className="font-display text-ink-900">StudySync</span>
            </div>
            <p className="text-ink-500 text-sm">
              Open source on GitHub
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="group p-8 rounded-2xl bg-parchment-50 border border-parchment-200 hover:border-parchment-300 hover:shadow-paper transition-all duration-300">
      <div className="w-12 h-12 bg-ink-900 rounded-xl flex items-center justify-center text-parchment-50 mb-5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-display text-xl text-ink-900 mb-3">{title}</h3>
      <p className="text-ink-600 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ 
  number, 
  title, 
  description 
}: { 
  number: string; 
  title: string; 
  description: string;
}) {
  return (
    <div className="relative">
      <div className="font-mono text-6xl text-parchment-300 mb-4">{number}</div>
      <h3 className="font-display text-xl text-ink-900 mb-3">{title}</h3>
      <p className="text-ink-600 leading-relaxed">{description}</p>
    </div>
  );
}
