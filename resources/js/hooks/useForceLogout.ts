import { router } from '@inertiajs/react';
import { useEffect } from 'react';

export function useForceLogout(userId: number) {
    useEffect(() => {
        const channel = window.Echo.private(`users.${userId}`);

        channel.listen('.force.logout', () => {
            router.visit('/login');
        });

        return () => {
            channel.stopListening('.force.logout');
            window.Echo.leave(`users.${userId}`);
        };
    }, [userId]);
}
