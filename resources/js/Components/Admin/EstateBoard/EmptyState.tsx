import React from 'react';
import { Megaphone, Plus, SearchX } from 'lucide-react';

type Props = {
    hasActiveFilters?: boolean;
    onClearFilters?: () => void;
    onFocusComposer?: () => void;
};

export default function EmptyState({ hasActiveFilters = false, onClearFilters, onFocusComposer }: Props) {
    return (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xs ring-1 ring-slate-200/60">
                {hasActiveFilters ? <SearchX className="h-8 w-8 text-slate-400" /> : <Megaphone className="h-8 w-8 text-primary-600" />}
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">{hasActiveFilters ? 'No matching announcements found' : 'No announcements yet'}</h3>

            <p className="mt-2 max-w-sm text-xs leading-relaxed font-medium text-slate-500">
                {hasActiveFilters
                    ? "Try adjusting your search terms or filters to find what you're looking for."
                    : 'Keep residents informed about maintenance, meetings, and estate news by broadcasting your first update.'}
            </p>

            {hasActiveFilters ? (
                <button
                    onClick={onClearFilters}
                    className="mt-6 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-100"
                >
                    Clear Search Filters
                </button>
            ) : (
                <button
                    onClick={onFocusComposer}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-sm transition hover:bg-slate-800 active:scale-95"
                >
                    <Plus className="h-4 w-4" />
                    <span>Create First Announcement</span>
                </button>
            )}
        </div>
    );
}
