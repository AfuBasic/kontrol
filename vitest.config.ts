import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Unit tests for the browser-side resilience code (offline queue, network monitor, retry rules).
export default defineConfig({
    resolve: {
        alias: { '@': path.resolve(__dirname, 'resources/js') },
    },
    test: {
        environment: 'jsdom',
        include: ['resources/js/**/*.test.ts'],
        restoreMocks: true,
    },
});
