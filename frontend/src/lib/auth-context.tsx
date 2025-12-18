'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  anthropicKey: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasApiKey: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setAnthropicKey: (key: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'studysync_token';
const USER_KEY = 'studysync_user';
const API_KEY_KEY = 'studysync_anthropic_key';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [anthropicKey, setAnthropicKeyState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved state on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    const savedApiKey = localStorage.getItem(API_KEY_KEY);

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        // Invalid saved data, clear it
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }

    if (savedApiKey) {
      setAnthropicKeyState(savedApiKey);
    }

    setIsLoading(false);
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const setAnthropicKey = useCallback((key: string | null) => {
    setAnthropicKeyState(key);
    if (key) {
      localStorage.setItem(API_KEY_KEY, key);
    } else {
      localStorage.removeItem(API_KEY_KEY);
    }
  }, []);

  const value: AuthContextType = {
    user,
    token,
    anthropicKey,
    isLoading,
    isAuthenticated: !!token && !!user,
    hasApiKey: !!anthropicKey,
    login,
    logout,
    setAnthropicKey,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
