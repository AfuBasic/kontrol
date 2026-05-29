import { useEffect } from 'react';

export function useForceLogout(userId?: number) {
    useEffect(() => {
        if (!userId) return;

        const channel = window.Echo.private(`users.${userId}`);

        channel.listen('.force.logout', () => {
            window.location.href = '/login';
        });

        return () => {
            channel.stopListening('.force.logout');
            window.Echo.leave(`users.${userId}`);
        };
    }, [userId]);
}
