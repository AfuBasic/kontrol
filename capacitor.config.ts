import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.kontrol.app',
    appName: 'Kontrol',
    webDir: 'public',
    server: {
        url: 'https://app.kontrol.test',
        cleartext: false,
    },
};

export default config;
