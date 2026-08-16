type InertiaVisit = {
    prefetch?: boolean;
    silent?: boolean;
    preserveUrl?: boolean;
    showProgress?: boolean;
    deferredProps?: boolean;
    method?: string;
    only?: string[];
    except?: string[];
    reset?: string[];
    url?: string | URL;
    headers?: Record<string, string>;
};

export type InertiaVisitEvent = {
    detail: {
        visit: InertiaVisit;
    };
};

function normalizePathname(pathname: string): string {
    if (pathname === '/') {
        return '/';
    }

    return pathname.replace(/\/+$/, '') || '/';
}

export function getVisitPathname(url: InertiaVisit['url']): string | null {
    if (!url) {
        return null;
    }

    try {
        const pathname = typeof url === 'string' ? new URL(url, window.location.origin).pathname : url.pathname;

        return normalizePathname(pathname);
    } catch {
        return null;
    }
}

export function isPrefetchVisit(event: InertiaVisitEvent): boolean {
    return event.detail.visit.prefetch === true;
}

export function isSilentVisit(event: InertiaVisitEvent): boolean {
    return Boolean(event.detail.visit.silent || event.detail.visit.headers?.['X-Background-Reload']);
}

export function isBackgroundVisit(event: InertiaVisitEvent): boolean {
    return isPrefetchVisit(event) || isSilentVisit(event);
}

export function isPartialVisit(visit: InertiaVisit): boolean {
    return (visit.only?.length ?? 0) > 0 || (visit.except?.length ?? 0) > 0 || (visit.reset?.length ?? 0) > 0 || visit.deferredProps === true;
}

export function isRouteChangeVisit(event: InertiaVisitEvent): boolean {
    const visit = event.detail.visit;

    if (isBackgroundVisit(event)) {
        return false;
    }

    if (visit.showProgress === false) {
        return false;
    }

    if (visit.preserveUrl) {
        return false;
    }

    if (isPartialVisit(visit)) {
        return false;
    }

    const method = (visit.method ?? 'get').toLowerCase();

    if (method !== 'get') {
        return false;
    }

    const destinationPathname = getVisitPathname(visit.url);
    const currentPathname = normalizePathname(window.location.pathname);

    if (!destinationPathname || destinationPathname === currentPathname) {
        return false;
    }

    return true;
}
