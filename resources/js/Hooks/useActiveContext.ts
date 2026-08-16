import { usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';

export function useActiveContext() {
    const context = usePage<SharedData>().props.auth.user?.context ?? null;
    const zoneId = context?.zone_id ?? null;

    return {
        context,
        isZoneScoped: zoneId !== null,
        zoneId,
        zoneName: context?.zone_name ?? null,
    };
}
