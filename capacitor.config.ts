import type { CapacitorConfig } from '@capacitor/cli';
import * as fs from 'fs';
import * as path from 'path';

// Set this to true for local development with Simulator/Emulator
const isDev = process.env.NODE_ENV !== 'production' && process.env.CAPACITOR_PROD !== 'true';

// Default local URL
const isAndroid = process.argv.includes('android') || process.env.CAPACITOR_PLATFORM_NAME === 'android';
let devUrl = 'https://app.usekontrol.afuwapetunde.com';
// hostname must match the actual URL being loaded
let devHostname = 'app.usekontrol.afuwapetunde.com';

// Dynamically read from .env to prevent committing local URLs to Git
try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf-8');
        const match = envFile.match(/^CAPACITOR_DEV_URL=(.*)$/m);
        if (match) {
            devUrl = match[1].trim();
            devHostname = new URL(devUrl).hostname;
        }
    }
} catch (e) {
    console.warn('Could not read CAPACITOR_DEV_URL from .env', e);
}

const prodUrl = isAndroid ? 'https://app.usekontrol.afuwapetunde.com' : 'https://app.usekontrol.com';
const prodHostname = isAndroid ? 'app.usekontrol.afuwapetunde.com' : 'app.usekontrol.com';

const config: CapacitorConfig = {
    appId: 'com.kontrol.hq',
    appName: 'Kontrol',
    webDir: 'public',
    appendUserAgent: ' KontrolApp',
    // loggingBehavior: isDev ? 'debug' : 'none',
    server: {
        url: isDev ? devUrl : prodUrl,
        cleartext: isDev,
        // The hostname MUST match your production domain in production, or else cookies/CSRF will fail.
        hostname: isDev ? devHostname : prodHostname,
        // Allow all subdomains and the emulator IP for local development
        allowNavigation: ['app.usekontrol.com', 'app.usekontrol.afuwapetunde.com'],
        // CRITICAL: Must be 'https' in production to support modern browser features (Geolocation, Cookies, etc.)
        androidScheme: isDev && !devUrl.startsWith('https') ? 'http' : 'https',
    },
    android: {
        // Hardware acceleration is on by default in modern Capacitor,
        // but we ensure the WebView background matches the app theme to prevent flickering.
        backgroundColor: '#020617',
        allowMixedContent: isDev,
        captureInput: true,
        buildOptions: {
            releaseType: 'AAB',
        },
    },
    ios: {
        // 'never' allows the app to handle its own safe area padding via CSS env(safe-area-inset-*)
        contentInset: 'never',
        backgroundColor: '#020617',
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
            launchAutoHide: false, // Handled manually in app.tsx
            backgroundColor: '#FFFFFF',
            androidScaleType: 'CENTER',
            showSpinner: false,
            splashFullScreen: true,
            splashImmersive: true,
        },
        Keyboard: {
            resize: 'body', // Best for Android to prevent viewport jumping
            style: 'DARK',
            resizeOnFullScreen: true,
        },
        StatusBar: {
            style: 'LIGHT',
            backgroundColor: '#FFFFFF',
        },
    },
};

export default config;
