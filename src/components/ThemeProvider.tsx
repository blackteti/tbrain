"use client";

import { useEffect } from 'react';
import { useThemeStore } from '../store';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = useThemeStore(s => s.theme);

    useEffect(() => {
        document.body.classList.remove('theme-dark', 'theme-light');
        document.body.classList.add(`theme-${theme}`);
    }, [theme]);

    return <>{children}</>;
}
