import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { useEffect } from 'react';

const VIEWPORT_HEIGHT_VARIABLE = '--app-viewport-height';
const KEYBOARD_HEIGHT_VARIABLE = '--app-keyboard-height';
const SAFE_AREA_TOP_STABLE_VARIABLE = '--safe-area-inset-top-stable';
const KEYBOARD_OPEN_ATTRIBUTE = 'data-keyboard-open';
const KEYBOARD_THRESHOLD = 100;

const isTextInput = (element: Element | null): boolean => {
    if (!(element instanceof HTMLElement)) {
        return false;
    }

    return element.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="button"]), textarea, [contenteditable="true"]');
};

export default function useNativeViewport(): void {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        const root = document.documentElement;
        const visualViewport = window.visualViewport;
        const timers = new Set<number>();
        let animationFrame = 0;
        let largestViewportHeight = 0;

        const syncViewport = () => {
            animationFrame = 0;

            const visualHeight = visualViewport?.height ?? window.innerHeight;
            const visualOffsetTop = visualViewport?.offsetTop ?? 0;
            const layoutHeight = Math.max(window.innerHeight, document.documentElement.clientHeight);

            largestViewportHeight = Math.max(largestViewportHeight, layoutHeight, visualHeight + visualOffsetTop);

            const viewportHeight = Math.max(0, Math.round(visualHeight));
            const keyboardHeight = Math.max(0, Math.round(largestViewportHeight - viewportHeight - visualOffsetTop));
            const keyboardOpen = keyboardHeight > KEYBOARD_THRESHOLD && isTextInput(document.activeElement);

            root.style.setProperty(VIEWPORT_HEIGHT_VARIABLE, `${viewportHeight}px`);
            root.style.setProperty(KEYBOARD_HEIGHT_VARIABLE, `${keyboardOpen ? keyboardHeight : 0}px`);
            root.setAttribute(KEYBOARD_OPEN_ATTRIBUTE, String(keyboardOpen));

            // Ensure the active text input is cleanly in view without jarring viewport shifts
            if (keyboardOpen && document.activeElement instanceof HTMLElement) {
                const activeEl = document.activeElement;
                [80, 250].forEach((delay) => {
                    const timer = window.setTimeout(() => {
                        timers.delete(timer);
                        if (document.activeElement === activeEl) {
                            activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, delay);
                    timers.add(timer);
                });
            }

            // iOS zeros env(safe-area-inset-top) while the keyboard is open.
            // Freeze the last closed-keyboard inset so the header cannot slide under the status bar.
            if (!keyboardOpen) {
                const safeAreaTop = getComputedStyle(root).getPropertyValue('--safe-area-inset-top').trim();

                if (safeAreaTop && safeAreaTop !== '0px') {
                    root.style.setProperty(SAFE_AREA_TOP_STABLE_VARIABLE, safeAreaTop);
                }
            }
        };

        const scheduleSync = () => {
            if (!animationFrame) {
                animationFrame = window.requestAnimationFrame(syncViewport);
            }
        };

        const scheduleSettledSync = () => {
            scheduleSync();

            [80, 220, 500].forEach((delay) => {
                const timer = window.setTimeout(() => {
                    timers.delete(timer);
                    scheduleSync();
                }, delay);

                timers.add(timer);
            });
        };

        const handleFocusChange = () => {
            scheduleSettledSync();
        };

        scheduleSettledSync();

        // Attach native Capacitor Keyboard listeners for exact pixel-height notifications
        let showListenerHandle: { remove: () => void } | null = null;
        let hideListenerHandle: { remove: () => void } | null = null;

        Keyboard.addListener('keyboardWillShow', (info) => {
            const kh = Math.round(info.keyboardHeight);
            root.style.setProperty(KEYBOARD_HEIGHT_VARIABLE, `${kh}px`);
            root.setAttribute(KEYBOARD_OPEN_ATTRIBUTE, 'true');
            scheduleSettledSync();
        }).then((handle) => {
            showListenerHandle = handle;
        }).catch(() => {});

        Keyboard.addListener('keyboardWillHide', () => {
            root.style.setProperty(KEYBOARD_HEIGHT_VARIABLE, '0px');
            root.setAttribute(KEYBOARD_OPEN_ATTRIBUTE, 'false');
            scheduleSettledSync();
        }).then((handle) => {
            hideListenerHandle = handle;
        }).catch(() => {});

        window.addEventListener('resize', scheduleSettledSync);
        window.addEventListener('pageshow', scheduleSettledSync);
        window.addEventListener('focus', scheduleSettledSync);
        window.addEventListener('focusin', handleFocusChange);
        window.addEventListener('focusout', handleFocusChange);
        document.addEventListener('visibilitychange', scheduleSettledSync);
        visualViewport?.addEventListener('resize', scheduleSettledSync);
        visualViewport?.addEventListener('scroll', scheduleSettledSync);

        return () => {
            if (animationFrame) {
                window.cancelAnimationFrame(animationFrame);
            }

            timers.forEach((timer) => window.clearTimeout(timer));
            showListenerHandle?.remove();
            hideListenerHandle?.remove();

            root.style.removeProperty(VIEWPORT_HEIGHT_VARIABLE);
            root.style.removeProperty(KEYBOARD_HEIGHT_VARIABLE);
            root.style.removeProperty(SAFE_AREA_TOP_STABLE_VARIABLE);
            root.removeAttribute(KEYBOARD_OPEN_ATTRIBUTE);

            window.removeEventListener('resize', scheduleSettledSync);
            window.removeEventListener('pageshow', scheduleSettledSync);
            window.removeEventListener('focus', scheduleSettledSync);
            window.removeEventListener('focusin', handleFocusChange);
            window.removeEventListener('focusout', handleFocusChange);
            document.removeEventListener('visibilitychange', scheduleSettledSync);
            visualViewport?.removeEventListener('resize', scheduleSettledSync);
            visualViewport?.removeEventListener('scroll', scheduleSettledSync);
        };
    }, []);
}
