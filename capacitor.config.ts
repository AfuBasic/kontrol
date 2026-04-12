import type { CapacitorConfig } from '@capacitor/cli';

// Set this to true for local development with Simulator/Emulator
const isDev = true;

const config: CapacitorConfig = {
    appId: 'com.kontrol.app',
    appName: 'Kontrol',
    webDir: 'public',
    server: {
        // Toggle between your local Herd URL and production
        // Using http for local dev to bypass SSL certificate issues in simulators
        url: isDev ? 'http://app.kontrol.test' : 'https://app.usekontrol.com',
        cleartext: isDev,
        allowNavigation: [
            'app.kontrol.test',
            'kontrol.test'
        ]
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 3000,
            launchAutoHide: false,
            backgroundColor: '#FFFFFF',
            androidScaleType: 'FIT_CENTER',
            showSpinner: false,
            splashFullScreen: true,
            splashImmersive: true,
        },
    },
};

export default config;
