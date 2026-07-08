import { useCallback, useEffect, useState } from 'react';

export type PartnerTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function applyTheme(theme: PartnerTheme): void {
    const root = document.documentElement;

    if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        root.style.colorScheme = 'dark';
    } else {
        root.classList.add('light');
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
    }
}

/**
 * Partner portal theme (light/dark) with localStorage persistence.
 * Uses the same `theme` key as the rest of the app.
 */
export function usePartnerTheme() {
    const [theme, setThemeState] = useState<PartnerTheme>(() => {
        if (typeof window === 'undefined') {
            return 'light';
        }

        const stored = localStorage.getItem(STORAGE_KEY);

        return stored === 'dark' ? 'dark' : 'light';
    });

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const setTheme = useCallback((next: PartnerTheme) => {
        localStorage.setItem(STORAGE_KEY, next);
        setThemeState(next);
        applyTheme(next);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    }, [setTheme, theme]);

    return { theme, setTheme, toggleTheme };
}
