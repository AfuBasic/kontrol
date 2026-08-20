import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { renderToString } from 'react-dom/server';
import { ConfirmationProvider } from './Components/ConfirmationProvider';

const appName = import.meta.env.VITE_APP_NAME || 'Kontrol';

createServer((page) =>
    createInertiaApp({
        page,
        render: renderToString,
        title: (title) => (title ? `${title} - ${appName}` : appName),
        resolve: (name) => resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
        setup: ({ App, props }) => (
            <ConfirmationProvider>
                <App {...props} />
            </ConfirmationProvider>
        ),
    }),
);
