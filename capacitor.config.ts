import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.kontrol.app',
    appName: 'Kontrol',
    webDir: 'public',
    server: {
        url: 'https://app.usekontrol.com',
        cleartext: false,
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
