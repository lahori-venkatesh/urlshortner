import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, ThemeColors } from '../types';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const lightColors: ThemeColors = {
  background: 'bg-gray-50',
  foreground: 'text-gray-900',
  card: 'bg-white',
  cardForeground: 'text-gray-900',
  primary: 'bg-primary-600',
  primaryForeground: 'text-white',
  secondary: 'bg-gray-100',
  secondaryForeground: 'text-gray-900',
  muted: 'bg-gray-100',
  mutedForeground: 'text-gray-500',
  accent: 'bg-primary-100',
  accentForeground: 'text-primary-900',
  destructive: 'bg-error-600',
  destructiveForeground: 'text-white',
  border: 'border-gray-200',
  input: 'bg-white border-gray-300',
  ring: 'ring-primary-500',
};

const darkColors: ThemeColors = {
  background: 'bg-gray-900',
  foreground: 'text-gray-100',
  card: 'bg-gray-800',
  cardForeground: 'text-gray-100',
  primary: 'bg-primary-500',
  primaryForeground: 'text-white',
  secondary: 'bg-gray-700',
  secondaryForeground: 'text-gray-100',
  muted: 'bg-gray-800',
  mutedForeground: 'text-gray-400',
  accent: 'bg-primary-900',
  accentForeground: 'text-primary-100',
  destructive: 'bg-error-500',
  destructiveForeground: 'text-white',
  border: 'border-gray-700',
  input: 'bg-gray-700 border-gray-600',
  ring: 'ring-primary-400',
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('admin-theme');
    return (stored as Theme) || 'system';
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('admin-theme', theme);
  }, [theme]);

  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  const isDark = effectiveTheme === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const colors = isDark ? darkColors : lightColors;

  const value: ThemeContextType = {
    theme,
    setTheme,
    colors,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};