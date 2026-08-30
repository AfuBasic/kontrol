import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PostAudience, PostCategory, PostPriority } from '@/types';
import type { SharedData } from '@/types';

export type EstateBoardDraftData = {
    title: string;
    body: string;
    category: PostCategory;
    priority: PostPriority;
    audience: PostAudience;
    zone_ids: number[];
    updated_at: number;
};

export type DraftSaveStatus = 'idle' | 'saving' | 'saved' | 'restored';

type UseEstateBoardAutoDraftOptions = {
    formState: {
        title: string;
        body: string;
        category: PostCategory;
        priority: PostPriority;
        audience: PostAudience;
        zone_ids: number[];
    };
    setFormValues: (draft: Partial<EstateBoardDraftData>) => void;
    debounceMs?: number;
    maxAgeDays?: number;
};

export function useEstateBoardAutoDraft({
    formState,
    setFormValues,
    debounceMs = 800,
    maxAgeDays = 7,
}: UseEstateBoardAutoDraftOptions) {
    const { auth } = usePage<SharedData>().props;
    const [saveStatus, setSaveStatus] = useState<DraftSaveStatus>('idle');
    const [hasDraft, setHasDraft] = useState(false);
    const isInitialMount = useRef(true);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const statusClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Compute unique storage key scoped to estate & user context (works seamlessly in support / impersonation mode)
    const estateId = auth?.user?.context?.estate_id ?? auth?.user?.current_estate_id ?? 0;
    const userId = auth?.user?.id ?? 0;
    const storageKey = `kontrol:estate-board-draft:${estateId}:${userId}`;

    /**
     * Determines whether the form contains meaningful non-empty / non-default content.
     */
    const isMeaningful = useCallback(
        (data: typeof formState) => {
            const hasTitle = Boolean(data.title && data.title.trim().length > 0);
            const hasBody = Boolean(data.body && data.body.replace(/<[^>]*>/g, '').trim().length > 0);
            const hasNonDefaultCategory = data.category !== 'general';
            const hasNonDefaultPriority = data.priority !== 'normal';
            const hasNonDefaultAudience = data.audience !== 'all';
            const hasZones = Array.isArray(data.zone_ids) && data.zone_ids.length > 0;

            return hasTitle || hasBody || hasNonDefaultCategory || hasNonDefaultPriority || hasNonDefaultAudience || hasZones;
        },
        [],
    );

    /**
     * Clear the draft from storage and reset draft indicator state.
     */
    const clearDraft = useCallback(() => {
        try {
            localStorage.removeItem(storageKey);
            setHasDraft(false);
            setSaveStatus('idle');
        } catch {
            // Local storage access error fallback
        }
    }, [storageKey]);

    /**
     * Read draft from storage if valid and unexpired.
     */
    const getStoredDraft = useCallback((): EstateBoardDraftData | null => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return null;

            const parsed = JSON.parse(raw) as EstateBoardDraftData;
            if (!parsed || typeof parsed !== 'object') return null;

            // Check expiration
            const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
            if (Date.now() - (parsed.updated_at || 0) > maxAgeMs) {
                localStorage.removeItem(storageKey);
                return null;
            }

            return parsed;
        } catch {
            return null;
        }
    }, [storageKey, maxAgeDays]);

    // Restore draft on mount if form is currently empty
    useEffect(() => {
        if (!isInitialMount.current) return;
        isInitialMount.current = false;

        const draft = getStoredDraft();
        if (draft && !isMeaningful(formState)) {
            setFormValues({
                title: draft.title || '',
                body: draft.body || '',
                category: draft.category || 'general',
                priority: draft.priority || 'normal',
                audience: draft.audience || 'all',
                zone_ids: Array.isArray(draft.zone_ids) ? draft.zone_ids : [],
            });

            setHasDraft(true);
            setSaveStatus('restored');

            if (statusClearTimerRef.current) clearTimeout(statusClearTimerRef.current);
            statusClearTimerRef.current = setTimeout(() => {
                setSaveStatus('idle');
            }, 4000);
        }
    }, [getStoredDraft, isMeaningful, formState, setFormValues]);

    // Auto-save on form state change
    useEffect(() => {
        if (isInitialMount.current) return;

        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }

        if (!isMeaningful(formState)) {
            // Form is empty; remove any stored draft
            clearDraft();
            return;
        }

        setSaveStatus('saving');

        saveTimerRef.current = setTimeout(() => {
            try {
                const payload: EstateBoardDraftData = {
                    title: formState.title,
                    body: formState.body,
                    category: formState.category,
                    priority: formState.priority,
                    audience: formState.audience,
                    zone_ids: formState.zone_ids,
                    updated_at: Date.now(),
                };

                localStorage.setItem(storageKey, JSON.stringify(payload));
                setHasDraft(true);
                setSaveStatus('saved');

                if (statusClearTimerRef.current) clearTimeout(statusClearTimerRef.current);
                statusClearTimerRef.current = setTimeout(() => {
                    setSaveStatus('idle');
                }, 3000);
            } catch {
                setSaveStatus('idle');
            }
        }, debounceMs);

        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [formState, isMeaningful, storageKey, debounceMs, clearDraft]);

    // Listen for storage events (e.g. multi-tab sync / clear across tabs)
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === storageKey) {
                if (!e.newValue) {
                    setHasDraft(false);
                } else {
                    setHasDraft(true);
                }
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [storageKey]);

    return {
        saveStatus,
        hasDraft,
        clearDraft,
        isMeaningful: isMeaningful(formState),
    };
}
