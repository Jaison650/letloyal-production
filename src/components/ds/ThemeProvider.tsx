'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const ThemeCtx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'system',
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeCtx);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') setThemeState(stored);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    if (t === 'system') {
      localStorage.removeItem('theme');
      document.documentElement.removeAttribute('data-theme');
    } else {
      localStorage.setItem('theme', t);
      document.documentElement.setAttribute('data-theme', t);
    }
  }, []);

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
}
