import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import './echo';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);

        // Handle Capacitor specific logic
        if (Capacitor.isNativePlatform()) {
            try {
                // Set StatusBar style
                StatusBar.setStyle({ style: Style.Light });

                // Handle Android back button
                CapacitorApp.addListener('backButton', ({ canGoBack }) => {
                    if (!canGoBack) {
                        CapacitorApp.exitApp();
                    } else {
                        window.history.back();
                    }
                });

                // Dismiss splash screen after app is mounted
                setTimeout(() => {
                    SplashScreen.hide().catch(() => {});
                }, 500);

                // Global Safety Timeout: Ensure splash screen hides even if Inertia loop hangs
                setTimeout(() => {
                    SplashScreen.hide().catch(() => {});
                }, 4000);
            } catch (err) {
                console.warn('Native bridge initialization failed:', err);
                // Even on failure, try to hide splash
                setTimeout(() => {
                    SplashScreen.hide().catch(() => {});
                }, 1000);
            }
        }
    },
    progress: {
        color: '#4B5563',
    },
});
