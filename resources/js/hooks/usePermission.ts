import { usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';

export function usePermission() {
    const { auth } = usePage<SharedData>().props;

    // Derived state
    const permissions = auth.user?.permissions?.map((p) => p.name) || [];
    const roles = auth.user?.roles || [];
    const isAdmin = roles.includes('admin');

    /**
     * Check if the user has a specific permission or is an admin.
     */
    const can = (permission: string): boolean => {
        if (isAdmin) return true;
        return permissions.includes(permission);
    };

    /**
     * Check if the user has a specific role.
     */
    const hasRole = (role: string): boolean => {
        return roles.includes(role);
    };

    return { can, hasRole, isAdmin, user: auth.user };
}
