import { useState, useEffect, useCallback } from 'react';

type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'quarzizus-time-theme';

const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const setDarkTheme = useCallback(() => {
    setTheme('dark');
  }, []);

  const setLightTheme = useCallback(() => {
    setTheme('light');
  }, []);

  return {
    theme,
    toggleTheme,
    setDarkTheme,
    setLightTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };
};

export { useTheme };