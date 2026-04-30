import { createInertiaApp } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import './echo';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

import { PushNotifications } from '@capacitor/push-notifications';
import AppLoader from './Components/AppLoader';
import GlobalLoading from './Components/GlobalLoading';

import AdminLayout from './Layouts/AdminLayout';
import AnimatedLayout from './Layouts/AnimatedLayout';
import ResidentLayout from './Layouts/ResidentLayout';
import SecurityLayout from './Layouts/SecurityLayout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const ResidentLayoutWrapper = (page: React.ReactNode) => (
    <ResidentLayout>
        <AnimatedLayout>{page}</AnimatedLayout>
    </ResidentLayout>
);

const AdminLayoutWrapper = (page: React.ReactNode) => (
    <AdminLayout>
        <AnimatedLayout>{page}</AnimatedLayout>
    </AdminLayout>
);

const SecurityLayoutWrapper = (page: React.ReactNode) => (
    <SecurityLayout>
        <AnimatedLayout>{page}</AnimatedLayout>
    </SecurityLayout>
);

const DefaultLayoutWrapper = (page: React.ReactNode) => <AnimatedLayout>{page}</AnimatedLayout>;

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: async (name) => {
        const page = await resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx'));
        const pageModule = page as any;

        // Automatically apply layouts if not explicitly set
        if (pageModule.default.layout === undefined) {
            if (name.startsWith('Resident/')) {
                pageModule.default.layout = ResidentLayoutWrapper;
            } else if (name.startsWith('Admin/')) {
                pageModule.default.layout = AdminLayoutWrapper;
            } else if (name.startsWith('Security/')) {
                pageModule.default.layout = SecurityLayoutWrapper;
            } else {
                pageModule.default.layout = DefaultLayoutWrapper;
            }
        }

        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        function AppWrapper() {
            const [isBooting, setIsBooting] = useState(true);
            const [isExiting, setIsExiting] = useState(false);

            useEffect(() => {
                const unregister = router.on('finish', () => {
                    // Small delay to ensure React has painted the first frame
                    setTimeout(() => {
                        setIsExiting(true);
                        // Hide native splash once our custom loader is fully visible underneath
                        if (Capacitor.isNativePlatform()) {
                            SplashScreen.hide().catch(() => {});
                        }
                        // Remove the loader from DOM after its fade-out animation
                        setTimeout(() => setIsBooting(false), 600);
                    }, 400);
                    unregister();
                });

                // Safety timeout: Never leave the user stranded on the splash
                const timer = setTimeout(() => {
                    setIsExiting(true);
                    if (Capacitor.isNativePlatform()) {
                        SplashScreen.hide().catch(() => {});
                    }
                    setTimeout(() => setIsBooting(false), 600);
                }, 8000);

                return () => {
                    unregister();
                    clearTimeout(timer);
                };
            }, []);

            return (
                <>
                    <App {...props} />
                    {isBooting && <AppLoader isExiting={isExiting} />}
                    <GlobalLoading />
                </>
            );
        }

        root.render(<AppWrapper />);

        // Handle Capacitor specific logic
        if (Capacitor.isNativePlatform()) {
            (async () => {
                try {
                    await StatusBar.setStyle({ style: Style.Default });
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

                    // First-load splash screen dismissal is now handled in AppWrapper
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
