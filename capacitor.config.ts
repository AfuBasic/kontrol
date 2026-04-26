import type { CapacitorConfig } from '@capacitor/cli';

// Set this to true for local development with Simulator/Emulator
const isDev = true;

const config: CapacitorConfig = {
    appId: 'com.kontrol.app',
    appName: 'Kontrol',
    webDir: 'public',
    server: {
        url: isDev ? 'http://kontrol.test' : 'https://app.usekontrol.com',
        cleartext: isDev,
        allowNavigation: ['kontrol.test', 'app.kontrol.test'],
    },
    plugins: {
        FirebaseAuthentication: {
            providers: ['google.com'],
            skipNativeAuth: false,
            google: {
                webClientId: '642588363209-ju96lbs3lvhb0stpvf0q9j5i9m2vselh.apps.googleusercontent.com',
                forceCodeForRefreshToken: true,
            },
        },
        SplashScreen: {
            launchShowDuration: 0,
            launchAutoHide: false, // Handled manually in app.tsx after custom loader is ready
            backgroundColor: '#FFFFFF',
            androidScaleType: 'CENTER',
            showSpinner: false,
            splashFullScreen: true,
            splashImmersive: true,
        },
    },
};

export default config;
