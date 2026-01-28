'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'simple-light' | 'simple-dark' | 'alpine-light' | 'alpine-dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleDayNight: () => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'nrt-theme';

// Valid themes
const VALID_THEMES: Theme[] = ['simple-light', 'simple-dark', 'alpine-light', 'alpine-dark'];

const DEFAULT_THEME: Theme = 'simple-dark';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    if (savedTheme && VALID_THEMES.includes(savedTheme)) {
      setThemeState(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Default to simple-dark for development
      document.documentElement.setAttribute('data-theme', DEFAULT_THEME);
    }
    setMounted(true);
  }, []);

  // Update document when theme changes
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Toggle between day (light) and night (dark) modes
  // Uses Simple theme for day/night toggle
  const toggleDayNight = () => {
    const newTheme = theme === 'simple-light' || theme === 'alpine-light'
      ? 'simple-dark'
      : 'simple-light';
    setTheme(newTheme);
  };

  const isDarkMode = theme === 'simple-dark' || theme === 'alpine-dark';

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleDayNight, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Available themes for UI selection
export const AVAILABLE_THEMES: { id: Theme; name: string; description: string }[] = [
  { id: 'simple-light', name: 'Day Mode', description: 'Clean white background, maximum readability' },
  { id: 'simple-dark', name: 'Night Mode', description: 'Dark background for low-light environments' },
  { id: 'alpine-light', name: 'Alpine Light', description: 'Soft blue-grey tones inspired by mountain peaks' },
  { id: 'alpine-dark', name: 'Alpine Dark', description: 'Dark alpine theme for low-light environments' },
];
