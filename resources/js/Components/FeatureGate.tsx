import React from 'react';
import { useFeature } from '@/Hooks/useFeature';

interface Props {
    feature: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Enterprise-grade wrapper for conditional rendering based on features.
 */
export default function FeatureGate({ feature, children, fallback = null }: Props) {
    const isEnabled = useFeature(feature);

    if (!isEnabled) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
