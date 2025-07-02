import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'auto';

interface AppearanceSettings {
  theme: Theme;
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  compactMode: boolean;
  showAnimations: boolean;
  language: string;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  appearance: AppearanceSettings;
  setAppearance: (settings: Partial<AppearanceSettings>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored;
    }
    return 'light';
  });
  const [appearance, setAppearanceState] = useState<AppearanceSettings>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('appearanceSettings');
      if (stored) return { ...JSON.parse(stored) };
    }
    return {
      theme: 'light',
      primaryColor: '#003366',
      fontSize: 'medium',
      compactMode: false,
      showAnimations: true,
      language: 'en',
    };
  });

  useEffect(() => {
    if (theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      document.documentElement.classList.toggle('dark', mq.matches);
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('appearanceSettings', JSON.stringify(appearance));
    // Optionally, apply font size, compact mode, etc. globally here
    document.documentElement.style.setProperty('--app-font-size',
      appearance.fontSize === 'small' ? '14px' : appearance.fontSize === 'large' ? '18px' : appearance.fontSize === 'extra-large' ? '20px' : '16px');
    document.documentElement.style.setProperty('--app-primary-color', appearance.primaryColor);
    document.documentElement.classList.toggle('compact', !!appearance.compactMode);
  }, [appearance]);


  const setTheme = (t: Theme) => {
    setThemeState(t);
    setAppearanceState(prev => ({ ...prev, theme: t }));
  };

  const setAppearance = (settings: Partial<AppearanceSettings>) => {
    setAppearanceState(prev => ({ ...prev, ...settings }));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, appearance, setAppearance }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
