import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { router } from '@inertiajs/react';
import '../css/app.css';
import './echo';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

import { PushNotifications } from '@capacitor/push-notifications';

// Pre-hide splash screen logic or other initializations

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: async (name) => {
        const page = await resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx'));
        const pageModule = page as any;
        const AnimatedLayout = (await import('./Layouts/AnimatedLayout')).default;
        
        // Automatically apply layouts if not explicitly set
        if (pageModule.default.layout === undefined) {
            if (name.startsWith('Resident/')) {
                const ResidentLayout = (await import('./Layouts/ResidentLayout')).default;
                pageModule.default.layout = (page: React.ReactNode) => (
                    <AnimatedLayout>
                        <ResidentLayout>{page}</ResidentLayout>
                    </AnimatedLayout>
                );
            } else if (name.startsWith('Admin/')) {
                const AdminLayout = (await import('./Layouts/AdminLayout')).default;
                pageModule.default.layout = (page: React.ReactNode) => (
                    <AnimatedLayout>
                        <AdminLayout>{page}</AdminLayout>
                    </AnimatedLayout>
                );
            } else {
                // For non-dashboard pages, still allow animation
                pageModule.default.layout = (page: React.ReactNode) => (
                    <AnimatedLayout>{page}</AnimatedLayout>
                );
            }
        }
        
        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);

        // Handle Capacitor specific logic
        if (Capacitor.isNativePlatform()) {
            (async () => {
                try {
                    // Set StatusBar style and overlay
                    await StatusBar.setStyle({ style: Style.Light });
                    await StatusBar.setOverlaysWebView({ overlay: true });

                    // Handle Android back button
                    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
                        if (!canGoBack) {
                            CapacitorApp.exitApp();
                        } else {
                            window.history.back();
                        }
                    });

                    // Handle Universal Links / Deep Links (The "Snap" Handshake)
                    CapacitorApp.addListener('appUrlOpen', ({ url }) => {
                        try {
                            // Extract path from various URL formats (The "Smart Router")
                            let path = '';
                            if (url.startsWith('kontrol://')) {
                                // For custom scheme: kontrol://path/to/page
                                path = url.replace('kontrol:/', '');
                                if (!path.startsWith('/')) {
                                    path = '/' + path;
                                }
                            } else if (url.includes('://')) {
                                // For universal links: https://domain/path/to/page
                                const urlObj = new URL(url);
                                path = urlObj.pathname + urlObj.search;
                            }

                            if (path) {
                                console.info('Deep Link Detected, Navigating to:', path);
                                router.visit(path, {
                                    onFinish: () => {
                                        // Hide splash ONLY after the deep link page has loaded
                                        setTimeout(() => {
                                            SplashScreen.hide().catch(() => {});
                                        }, 300);
                                    },
                                });
                            }
                        } catch (err) {
                            console.error('Deep link routing failed:', err);
                            SplashScreen.hide().catch(() => {});
                        }
                    });

                    // Dismiss splash screen (Standard Load Fallback)
                    setTimeout(() => {
                        SplashScreen.hide().catch(() => {});
                    }, 1000);

                    // Global Safety Timeout: Ensure splash screen hides even if Inertia loop hangs
                    setTimeout(() => {
                        // SplashScreen.hide().catch(() => {});
                    }, 4000);
                } catch (err) {
                    console.warn('Native bridge initialization failed:', err);
                    // Even on failure, try to hide splash
                    setTimeout(() => {
                        // SplashScreen.hide().catch(() => {});
                    }, 1000);
                }
            })();
        }
    },
    progress: {
        color: '#4B5563',
    },
});
