import type { CapacitorConfig } from '@capacitor/cli';
import * as fs from 'fs';
import * as path from 'path';

// Check if running in dev mode or platform-specific dev
const isDev = process.env.CAPACITOR_DEV === 'true' || process.env.NODE_ENV === 'development';
const isIosDev = process.env.CAPACITOR_PLATFORM === 'ios' || process.argv.includes('ios');
const isAndroidDev = process.env.CAPACITOR_PLATFORM === 'android' || process.argv.includes('android');

// Default URLs
let devUrl = isIosDev ? 'http://app.kontrol.test' : 'https://app.usekontrol.afuwapetunde.com';
let devHostname = isIosDev ? 'app.kontrol.test' : 'app.usekontrol.afuwapetunde.com';

// Dynamically read from .env if in dev mode
if (isDev) {
    try {
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envFile = fs.readFileSync(envPath, 'utf-8');
            const customDevUrl = isIosDev
                ? envFile.match(/^CAPACITOR_IOS_URL=(.*)$/m)?.[1]?.trim()
                : envFile.match(/^CAPACITOR_DEV_URL=(.*)$/m)?.[1]?.trim();

            if (customDevUrl) {
                devUrl = customDevUrl;
                devHostname = new URL(devUrl).hostname;
            }
        }
    } catch (e) {
        console.warn('Could not read custom dev URL from .env', e);
    }
}

const prodUrl = 'https://app.usekontrol.com';
const prodHostname = 'app.usekontrol.com';

const config: CapacitorConfig = {
    appId: 'com.kontrol.hq',
    appName: 'Kontrol',
    webDir: 'public',
    appendUserAgent: ' KontrolApp',
    // loggingBehavior: isDev ? 'debug' : 'none',
    server: {
        url: isDev ? devUrl : prodUrl,
        cleartext: isDev,
        // The hostname MUST match your domain in production, or else cookies/CSRF will fail.
        hostname: isDev ? devHostname : prodHostname,
        // Allow all subdomains and the emulator IP for local development
        allowNavigation: ['app.usekontrol.com', 'app.usekontrol.afuwapetunde.com', 'app.kontrol.test', '*.kontrol.test', 'usekontrol.com'],
        // CRITICAL: Must be 'https' in production to support modern browser features (Geolocation, Cookies, etc.)
        androidScheme: isDev && !devUrl.startsWith('https') ? 'http' : 'https',
    },
    android: {
        // Hardware acceleration is on by default in modern Capacitor,
        // but we ensure the WebView background matches the app theme to prevent flickering.
        backgroundColor: '#F8FAFC',
        allowMixedContent: isDev,
        captureInput: true,
        buildOptions: {
            releaseType: 'AAB',
        },
    },
    ios: {
        // 'never' allows the app to handle its own safe area padding via CSS env(safe-area-inset-*)
        contentInset: 'never',
        backgroundColor: '#F8FAFC',
        allowsLinkPreview: true,
    },
    plugins: {
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert'],
        },
        FirebaseAuthentication: {
            providers: ['google.com'],
            skipNativeAuth: false,
            google: {
                webClientId: '481153520794-pc89ft1dv7u0rhl6tdddvag114fcu90a.apps.googleusercontent.com',
                forceCodeForRefreshToken: true,
            },
        },
        SplashScreen: {
            launchShowDuration: 30000,
            launchAutoHide: true, // Handled manually in app.tsx
            backgroundColor: '#FFFFFF',
            androidScaleType: 'CENTER',
            showSpinner: false,
            splashFullScreen: true,
            splashImmersive: true,
        },
        // Android keyboard resizing is owned by MainActivity's adjustResize mode.
        StatusBar: {
            style: 'LIGHT',
            backgroundColor: '#FFFFFF',
        },
    },
};

export default config;
