import { useEffect, useState } from 'react';

const STORAGE_KEY = 'admin-sidebar-collapsed';

export function useSidebarState() {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored === 'true';
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, String(isCollapsed));
    }, [isCollapsed]);

    const toggle = () => setIsCollapsed((prev) => !prev);
    const collapse = () => setIsCollapsed(true);
    const expand = () => setIsCollapsed(false);

    return { isCollapsed, toggle, collapse, expand };
}
