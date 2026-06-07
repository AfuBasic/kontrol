import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import './echo';

import AppLoader from './Components/AppLoader';
import AppErrorBoundary from './Components/ErrorBoundary/AppErrorBoundary';
import RouteProgressBar from './Components/UI/RouteProgressBar';
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
            const [isBooting, setIsBooting] = useState(Capacitor.isNativePlatform());
            const [isExiting, setIsExiting] = useState(false);

            useEffect(() => {
                // 1. Hide the native splash screen quickly after mount so the custom loader is shown
                const hideNativeTimer = setTimeout(() => {
                    if (Capacitor.isNativePlatform()) {
                        SplashScreen.hide().catch(() => {});
                    }
                }, 100);

                // 2. Allow the custom loader to run its animations, then fade it out
                const fadeOutTimer = setTimeout(() => {
                    setIsExiting(true);
                }, 1800);

                // 3. Remove the custom loader from DOM after fade-out
                const cleanupTimer = setTimeout(() => {
                    setIsBooting(false);
                }, 2400);

                return () => {
                    clearTimeout(hideNativeTimer);
                    clearTimeout(fadeOutTimer);
                    clearTimeout(cleanupTimer);
                };
            }, []);

            return (
                <AppErrorBoundary>
                    {isBooting ? (
                        <AppLoader isExiting={isExiting} />
                    ) : (
                        <>
                            <App {...props} />
                            <RouteProgressBar />
                        </>
                    )}
                </AppErrorBoundary>
            );
        }

        root.render(<AppWrapper />);

        // Handle Capacitor specific logic
        if (Capacitor.isNativePlatform()) {
            // Set a cookie so that all browser document/page load requests include the native identifier
            document.cookie = 'is_native_app=true; path=/; max-age=31536000; SameSite=Lax; Secure';

            // Add global header to all Inertia visits
            router.on('before', (event) => {
                event.detail.visit.headers['X-Capacitor-App'] = 'true';
            });

            (async () => {
                try {
                    await StatusBar.show();
                    await StatusBar.setOverlaysWebView({ overlay: true });
                    if (Capacitor.getPlatform() === 'android') {
                        await StatusBar.setBackgroundColor({ color: '#00000000' });
                    }

                    // All layouts have a white top nav — always use dark icons so they're visible.
                    const applyStatusBarStyle = () => {
                        StatusBar.setStyle({ style: Style.Light }).catch(() => {});
                    };

                    // Apply on first load
                    applyStatusBarStyle();

                    // Re-apply after every Inertia navigation (page transitions can reset it)
                    router.on('navigate', () => {
                        applyStatusBarStyle();
                    });

                    // Handle Android back button
                    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
                        if (!canGoBack) {
                            CapacitorApp.exitApp();
                        } else {
                            window.history.back();
                        }
                    });

                    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
                        if (isActive) {
                            router.reload({
                                onError: (err) => {
                                    console.warn('App background token reconciliation skipped:', err);
                                },
                            });
                        }
                    });

                    const handleDeepLink = (url: string) => {
                        try {
                            // Extract path from various URL formats (The "Smart Router")
                            let path = '';
                            if (url.startsWith('kontrol://')) {
                                const urlObj = new URL(url);
                                path = `/${urlObj.hostname}${urlObj.pathname}${urlObj.search || ''}`;
                                path = path.replace(/\/+/g, '/'); // Collapse multiple slashes
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
                    };

                    // Handle Universal Links / Deep Links (The "Snap" Handshake)
                    CapacitorApp.addListener('appUrlOpen', ({ url }) => {
                        handleDeepLink(url);
                    });

                    // Check for a launch URL on cold start (when app is opened while not running)
                    CapacitorApp.getLaunchUrl().then((launchUrl) => {
                        if (launchUrl?.url) {
                            handleDeepLink(launchUrl.url);
                        }
                    });

                    // First-load splash screen dismissal is now handled in AppWrapper
                } catch (err) {
                    console.warn('Native bridge initialization failed:', err);
                }
            })();
        }

        // Global 419 (Session Expired) Handling for Mobile UX
        router.on('error', (event) => {
            const errors = event.detail.errors as any;
            if (errors?.status === 419 || (typeof errors === 'string' && errors.includes('419'))) {
                window.location.reload();
            }
        });

        // Intercept 419 response specifically if it comes as a page load failure
        router.on('invalid', (event) => {
            if (event.detail.response.status === 419) {
                event.preventDefault();
                window.location.reload();
            }
        });

        // Self-healing handler for Vite dynamic import failures (stale client-side assets)
        window.addEventListener(
            'error',
            (e) => {
                const msg = e.message || '';
                if (msg.includes('importing a module script failed') || msg.includes('Failed to fetch dynamically imported module')) {
                    console.warn('Vite asset load failed, forcing page reload...');
                    window.location.reload();
                }
            },
            true,
        );

        window.addEventListener('unhandledrejection', (e) => {
            const reason = e.reason;
            if (
                reason &&
                (reason.message?.includes('importing a module script failed') ||
                    reason.message?.includes('Failed to fetch dynamically imported module') ||
                    reason.message?.includes('dynamically imported module'))
            ) {
                console.warn('Vite asset promise rejection, forcing page reload...');
                window.location.reload();
            }
        });
    },
    progress: {
        color: '#4B5563',
    },
});
