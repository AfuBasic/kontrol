import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo<any>;
    }
}

window.Pusher = Pusher;

function csrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    wsPath: import.meta.env.VITE_REVERB_PATH ?? '',
    authEndpoint: '/broadcasting/auth',
    auth: {
        // Read CSRF at request time so token rotations still authorize private channels.
        headers: {
            'X-CSRF-TOKEN': csrfToken(),
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
    },
    // pusher-js reads headers once at construct unless headersProvider is used.
    authorizer: (channel: { name: string }, options: { authEndpoint?: string; auth?: { headers?: Record<string, string> } }) => ({
        authorize: (socketId: string, callback: (error: boolean, data: unknown) => void) => {
            const body = new URLSearchParams({
                socket_id: socketId,
                channel_name: channel.name,
            });

            fetch(options.authEndpoint || '/broadcasting/auth', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                    ...(options.auth?.headers ?? {}),
                },
                body,
            })
                .then(async (response) => {
                    if (!response.ok) {
                        throw new Error(`Broadcast auth failed (${response.status})`);
                    }

                    return response.json();
                })
                .then((data) => callback(false, data))
                .catch((error) => callback(true, error));
        },
    }),
});
