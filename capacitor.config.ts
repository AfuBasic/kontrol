import type { CapacitorConfig } from '@capacitor/cli';

// Set this to true for local development with Simulator/Emulator
const isDev = true;

const config: CapacitorConfig = {
    appId: 'com.kontrol.app',
    appName: 'Kontrol',
    webDir: 'public',
    server: {
        // Using http for local dev to bypass SSL certificate issues in simulators
        url: isDev ? 'http://app.kontrol.test' : 'https://app.usekontrol.com',
        cleartext: isDev,
        allowNavigation: ['app.kontrol.test', 'kontrol.test'],
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
            launchShowDuration: 3000,
            launchAutoHide: true,
            backgroundColor: '#FFFFFF',
            androidScaleType: 'CENTER',
            showSpinner: false,
            splashFullScreen: true,
            splashImmersive: true,
        },
    },
};

export default config;
