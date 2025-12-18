'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Upload, 
  FileText, 
  Plus,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  RefreshCw,
  X,
  File,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Note, Course } from '@/types';

export default function NotesPage() {
  const searchParams = useSearchParams();
  const showNewModal = searchParams.get('new') === 'true';
  
  const { token, anthropicKey } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(showNewModal);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  useEffect(() => {
    if (showNewModal) {
      setShowUploadModal(true);
    }
  }, [showNewModal]);

  const loadData = async () => {
    try {
      const [notesData, coursesData] = await Promise.all([
        api.getNotes(token!),
        api.getCourses(token!)
      ]);
      setNotes(notesData);
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await api.deleteNote(token!, noteId);
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const filteredNotes = notes.filter(note => {
    if (selectedCourse && note.course_id !== selectedCourse) return false;
    if (searchQuery && !note.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink-900 mb-2">Notes</h1>
          <p className="text-ink-600">Upload and manage your lecture notes</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          disabled={!anthropicKey}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Notes
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Courses</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.name}</option>
          ))}
        </select>
      </div>

      {/* Notes Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-40 bg-parchment-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => (
            <NoteCard 
              key={note.id} 
              note={note}
              courseName={courses.find(c => c.id === note.course_id)?.name}
              onDelete={() => handleDelete(note.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-parchment-200 p-12 text-center">
          <div className="w-16 h-16 bg-parchment-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-ink-400" />
          </div>
          <h3 className="font-display text-xl text-ink-900 mb-2">No notes found</h3>
          <p className="text-ink-500 mb-6">
            {searchQuery || selectedCourse 
              ? 'Try adjusting your filters'
              : 'Upload your first note to get started'}
          </p>
          {!searchQuery && !selectedCourse && (
            <button
              onClick={() => setShowUploadModal(true)}
              disabled={!anthropicKey}
              className="btn-primary"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Notes
            </button>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          courses={courses}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function NoteCard({ 
  note, 
  courseName,
  onDelete 
}: { 
  note: Note; 
  courseName?: string;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const statusConfig = {
    completed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
    processing: { icon: Loader2, color: 'text-amber-600', bg: 'bg-amber-100', animate: true },
    failed: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
    pending: { icon: FileText, color: 'text-ink-400', bg: 'bg-parchment-100' }
  };

  const config = statusConfig[note.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="bg-white rounded-xl border border-parchment-200 hover:shadow-paper transition-shadow overflow-hidden group">
      <Link href={`/dashboard/notes/${note.id}`} className="block p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bg}`}>
            <StatusIcon className={`w-5 h-5 ${config.color} ${config.animate ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-ink-900 truncate">{note.title}</h3>
            {courseName && (
              <p className="text-sm text-ink-500 truncate">{courseName}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-400">
            {new Date(note.uploaded_at).toLocaleDateString()}
          </p>
          <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
            {note.status}
          </span>
        </div>
      </Link>
      
      <div className="px-5 py-3 border-t border-parchment-100 flex items-center justify-end">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-ink-400 hover:text-ink-600 hover:bg-parchment-100 rounded transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)} 
              />
              <div className="absolute right-0 bottom-full mb-1 bg-white rounded-lg shadow-paper-lg border border-parchment-200 py-1 z-20 min-w-[120px]">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadModal({ 
  courses, 
  onClose, 
  onSuccess 
}: { 
  courses: Course[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { token, anthropicKey } = useAuth();
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [courseId, setCourseId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      if (!title) {
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [title]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async () => {
    if (!anthropicKey) {
      setError('Please add your Anthropic API key first');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      if (mode === 'file' && file) {
        await api.uploadNote(token!, anthropicKey, file, title || undefined, courseId || undefined);
      } else if (mode === 'text' && content) {
        await api.createNoteFromText(token!, anthropicKey, {
          title: title || 'Untitled Note',
          content,
          course_id: courseId || undefined
        });
      }
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const canSubmit = mode === 'file' ? !!file : !!content.trim();

  return (
    <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-paper-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-parchment-200">
          <h2 className="font-display text-xl text-ink-900">Upload Notes</h2>
          <button 
            onClick={onClose}
            className="p-2 text-ink-400 hover:text-ink-600 hover:bg-parchment-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Mode Toggle */}
          <div className="flex rounded-lg bg-parchment-100 p-1 mb-6">
            <button
              onClick={() => setMode('file')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'file' 
                  ? 'bg-white text-ink-900 shadow-sm' 
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setMode('text')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'text' 
                  ? 'bg-white text-ink-900 shadow-sm' 
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              Paste Text
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="label">Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Lecture 5 - Cell Biology"
                className="input"
              />
            </div>

            {/* Course */}
            <div>
              <label className="label">Course (optional)</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="input"
              >
                <option value="">No course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </div>

            {/* File Upload or Text Input */}
            {mode === 'file' ? (
              <div>
                <label className="label">File</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    isDragging 
                      ? 'border-accent bg-accent/5' 
                      : 'border-parchment-300 hover:border-parchment-400'
                  }`}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <File className="w-8 h-8 text-accent" />
                      <div className="text-left">
                        <p className="font-medium text-ink-900">{file.name}</p>
                        <p className="text-sm text-ink-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => setFile(null)}
                        className="p-1 text-ink-400 hover:text-ink-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-ink-400 mx-auto mb-3" />
                      <p className="text-ink-600 mb-2">
                        Drag and drop your file here, or{' '}
                        <label className="text-accent cursor-pointer hover:underline">
                          browse
                          <input
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.txt,.md"
                            className="hidden"
                          />
                        </label>
                      </p>
                      <p className="text-sm text-ink-400">
                        Supports PDF, TXT, and Markdown files
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="label">Notes Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your notes here..."
                  rows={10}
                  className="input font-mono text-sm resize-none"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-parchment-200 bg-parchment-50">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isUploading}
            className="btn-primary"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload & Process
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
