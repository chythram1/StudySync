const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  token?: string;
  anthropicKey?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { token, anthropicKey, ...fetchOptions } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (anthropicKey) {
      headers['X-Anthropic-Key'] = anthropicKey;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || `HTTP error ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async getGoogleAuthUrl(includeCalendar = true): Promise<{ url: string }> {
    return this.request(`/api/auth/google/url?include_calendar=${includeCalendar}`);
  }

  async handleGoogleCallback(code: string, redirectUri?: string): Promise<{
    user: any;
    access_token: string;
  }> {
    return this.request('/api/auth/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    });
  }

  async getMe(token: string): Promise<any> {
    return this.request('/api/auth/me', { token });
  }

  // Courses
  async getCourses(token: string): Promise<any[]> {
    return this.request('/api/courses', { token });
  }

  async createCourse(token: string, data: { name: string; description?: string; color?: string }): Promise<any> {
    return this.request('/api/courses', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  async deleteCourse(token: string, courseId: string): Promise<void> {
    return this.request(`/api/courses/${courseId}`, {
      method: 'DELETE',
      token,
    });
  }

  // Notes
  async getNotes(token: string, courseId?: string): Promise<any[]> {
    const params = courseId ? `?course_id=${courseId}` : '';
    return this.request(`/api/notes${params}`, { token });
  }

  async getNote(token: string, noteId: string): Promise<any> {
    return this.request(`/api/notes/${noteId}`, { token });
  }

  async uploadNote(
    token: string,
    anthropicKey: string,
    file: File,
    title?: string,
    courseId?: string
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (courseId) formData.append('course_id', courseId);

    const response = await fetch(`${this.baseUrl}/api/notes/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Anthropic-Key': anthropicKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail);
    }

    return response.json();
  }

  async createNoteFromText(
    token: string,
    anthropicKey: string,
    data: { title: string; content: string; course_id?: string }
  ): Promise<any> {
    return this.request('/api/notes/text', {
      method: 'POST',
      token,
      anthropicKey,
      body: JSON.stringify(data),
    });
  }

  async deleteNote(token: string, noteId: string): Promise<void> {
    return this.request(`/api/notes/${noteId}`, {
      method: 'DELETE',
      token,
    });
  }

  async reprocessNote(token: string, anthropicKey: string, noteId: string): Promise<any> {
    return this.request(`/api/notes/${noteId}/reprocess`, {
      method: 'POST',
      token,
      anthropicKey,
    });
  }

  // Flashcards
  async getFlashcards(token: string, courseId?: string, dueOnly = false): Promise<any[]> {
    const params = new URLSearchParams();
    if (courseId) params.append('course_id', courseId);
    if (dueOnly) params.append('due_only', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/flashcards${query}`, { token });
  }

  async reviewFlashcard(
    token: string,
    flashcardId: string,
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<any> {
    return this.request(`/api/flashcards/${flashcardId}/review`, {
      method: 'POST',
      token,
      body: JSON.stringify({ difficulty }),
    });
  }

  async getFlashcardStats(token: string): Promise<any> {
    return this.request('/api/flashcards/stats', { token });
  }

  // Events
  async getEvents(token: string, upcomingOnly = false): Promise<any[]> {
    const params = upcomingOnly ? '?upcoming_only=true' : '';
    return this.request(`/api/events${params}`, { token });
  }

  async syncEvents(
    token: string,
    eventIds: string[],
    createStudySessions = false
  ): Promise<any[]> {
    return this.request('/api/events/sync', {
      method: 'POST',
      token,
      body: JSON.stringify({
        event_ids: eventIds,
        create_study_sessions: createStudySessions,
      }),
    });
  }

  async deleteEvent(token: string, eventId: string, removeFromCalendar = false): Promise<void> {
    const params = removeFromCalendar ? '?remove_from_calendar=true' : '';
    return this.request(`/api/events/${eventId}${params}`, {
      method: 'DELETE',
      token,
    });
  }

    // Demo
  async getDemoNotes(): Promise<any[]> {
    const response = await this.request<{notes: any[]}>('/api/demo/notes');
    return response.notes;
  }

  async getDemoNote(noteId: string): Promise<any> {
    return this.request(`/api/demo/notes/${noteId}`);
  }

  async getDemoFlashcards(): Promise<any[]> {
    const response = await this.request<{flashcards: any[]}>('/api/demo/flashcards');
    return response.flashcards;
  }

  async getDemoEvents(): Promise<any[]> {
    return this.request('/api/demo/events');
  }

  // Validate API key
  async validateApiKey(anthropicKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      return await this.request('/api/notes/validate-key', {
        anthropicKey,
      });
    } catch (error) {
      return { valid: false, error: (error as Error).message };
    }
  }
}

export const api = new ApiClient(API_URL);
