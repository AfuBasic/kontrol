import { useEffect, useState } from 'react';

const DEFAULT_STORAGE_KEY = 'admin-sidebar-collapsed';

/**
 * Persist sidebar collapse state. Pass a unique storageKey per layout
 * so partner/admin/zeus sidebars do not share state.
 */
export function useSidebarState(storageKey: string = DEFAULT_STORAGE_KEY) {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        const stored = localStorage.getItem(storageKey);

        return stored === 'true';
    });

    useEffect(() => {
        localStorage.setItem(storageKey, String(isCollapsed));
    }, [isCollapsed, storageKey]);

    const toggle = () => setIsCollapsed((prev) => !prev);
    const collapse = () => setIsCollapsed(true);
    const expand = () => setIsCollapsed(false);

    return { isCollapsed, toggle, collapse, expand };
}
