'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Home, 
  FileText, 
  Brain, 
  Calendar,
  Settings,
  LogOut,
  Key,
  X,
  CheckCircle2,
  AlertCircle,
  User
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, token, isAuthenticated, isLoading, anthropicKey, setAnthropicKey, logout } = useAuth();
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Show login page
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment-50">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 bg-parchment-300 rounded-lg" />
          <div className="h-6 w-32 bg-parchment-300 rounded" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Notes', href: '/dashboard/notes', icon: FileText },
    { name: 'Flashcards', href: '/dashboard/flashcards', icon: Brain },
    { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-parchment-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-parchment-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-parchment-200">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ink-900 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-parchment-50" />
            </div>
            <span className="font-display text-xl text-ink-900">StudySync</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-ink-900 text-parchment-50' 
                        : 'text-ink-600 hover:bg-parchment-100 hover:text-ink-900'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* API Key Status */}
        <div className="p-4 border-t border-parchment-200">
          <button
            onClick={() => setShowApiKeyModal(true)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              anthropicKey 
                ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Key className="w-5 h-5" />
            <span className="text-sm font-medium">
              {anthropicKey ? 'API Key Connected' : 'Add API Key'}
            </span>
          </button>
        </div>

        {/* User */}
        <div className="p-4 border-t border-parchment-200">
          <div className="flex items-center gap-3">
            {user?.picture ? (
              <img src={user.picture} alt="" className="w-9 h-9 rounded-full" />
            ) : (
              <div className="w-9 h-9 bg-parchment-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-ink-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-900 truncate">{user?.name}</p>
              <p className="text-xs text-ink-500 truncate">{user?.email}</p>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-ink-400 hover:text-ink-600 hover:bg-parchment-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <ApiKeyModal 
          currentKey={anthropicKey}
          onSave={(key) => {
            setAnthropicKey(key);
            setShowApiKeyModal(false);
          }}
          onClose={() => setShowApiKeyModal(false)}
        />
      )}
    </div>
  );
}

function LoginPage() {
  const { login } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code) {
      handleOAuthCallback(code);
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    setIsLoggingIn(true);
    setError(null);
    
    try {
      const result = await api.handleGoogleCallback(code, window.location.origin + '/dashboard');
      login(result.access_token, result.user);
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const { url } = await api.getGoogleAuthUrl(true);
      // Update redirect URI
      const authUrl = new URL(url);
      authUrl.searchParams.set('redirect_uri', window.location.origin + '/dashboard');
      window.location.href = authUrl.toString();
    } catch (err) {
      setError((err as Error).message);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-ink-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-parchment-50" />
          </div>
          <h1 className="font-display text-2xl text-ink-900 mb-2">Welcome to StudySync</h1>
          <p className="text-ink-600">Sign in to start organizing your notes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-paper border border-parchment-200 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-ink-200 rounded-lg hover:bg-parchment-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLoggingIn ? 'Signing in...' : 'Continue with Google'}
          </button>

          <p className="mt-6 text-xs text-center text-ink-500">
            By signing in, you'll also grant access to Google Calendar for syncing your study events.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-ink-500">
          <Link href="/demo" className="text-accent hover:underline">
            Try the demo
          </Link>
          {' '}before signing up
        </p>
      </div>
    </div>
  );
}

function ApiKeyModal({ 
  currentKey, 
  onSave, 
  onClose 
}: { 
  currentKey: string | null;
  onSave: (key: string | null) => void;
  onClose: () => void;
}) {
  const [key, setKey] = useState(currentKey || '');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string } | null>(null);

  const handleValidate = async () => {
    if (!key.trim()) return;
    
    setIsValidating(true);
    try {
      const result = await api.validateApiKey(key);
      setValidationResult(result);
    } catch (err) {
      setValidationResult({ valid: false, error: (err as Error).message });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = () => {
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  const handleRemove = () => {
    onSave(null);
  };

  return (
    <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-paper-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-parchment-200">
          <h2 className="font-display text-xl text-ink-900">OpenAI API Key</h2>
          <button 
            onClick={onClose}
            className="p-2 text-ink-400 hover:text-ink-600 hover:bg-parchment-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-ink-600 text-sm mb-4">
            Your API key is stored locally in your browser and sent directly to OpenAI. 
            We never store it on our servers.
          </p>

          <div className="space-y-4">
            <div>
              <label className="label">API Key</label>
              <input
                type="password"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setValidationResult(null);
                }}
                placeholder="sk-ant-..."
                className="input font-mono text-sm"
              />
            </div>

            {validationResult && (
              <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                validationResult.valid 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                {validationResult.valid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    API key is valid!
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    {validationResult.error || 'Invalid API key'}
                  </>
                )}
              </div>
            )}

            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:underline inline-flex items-center gap-1"
            >
              Get your API key from OpenAI →
            </a>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-parchment-200 bg-parchment-50 rounded-b-2xl">
          {currentKey && (
            <button
              onClick={handleRemove}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove key
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={handleValidate}
              disabled={!key.trim() || isValidating}
              className="btn-secondary text-sm"
            >
              {isValidating ? 'Validating...' : 'Validate'}
            </button>
            <button
              onClick={handleSave}
              disabled={!key.trim()}
              className="btn-primary text-sm"
            >
              Save Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
