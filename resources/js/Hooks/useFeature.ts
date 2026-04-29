import { usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';

/**
 * Enterprise-grade hook for feature gating.
 * Safely checks if a feature is enabled for the current estate.
 */
export function useFeature(slug: string): boolean {
    const { estate_plan } = usePage<SharedData>().props;
    
    if (!estate_plan?.features) {
        return false;
    }

    return estate_plan.features.includes(slug);
}
