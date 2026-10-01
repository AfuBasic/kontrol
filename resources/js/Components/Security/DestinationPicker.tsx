import { Building2, ChevronRight, Search, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import MobileSheet from '@/Components/MobileSheet';

export interface WalkInDestination {
    id: number;
    name: string;
    type: string;
    access_policy: string;
    /** Whether walk-ins are accepted right now (as of page load). */
    is_open: boolean;
    /** e.g. "Always open", "Open until 2:00 PM", "Closed · opens Sun 8:00 AM" */
    status_label?: string;
}

const RECENT_KEY = 'kontrol.walkIn.recentDestinations';
const RECENT_LIMIT = 3;

export function readRecentDestinations(): number[] {
    try {
        const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
        return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'number') : [];
    } catch {
        return [];
    }
}

/** Remember a destination at the front of this device's recent list. */
export function rememberDestination(id: number): void {
    try {
        const next = [id, ...readRecentDestinations().filter((x) => x !== id)].slice(0, RECENT_LIMIT);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
        // Storage can be unavailable (private mode); recents are a convenience only.
    }
}

const typeLabel = (type: string) => type.replace(/_/g, ' ');

interface Props {
    destinations: WalkInDestination[];
    selected: WalkInDestination | null;
    onSelect: (destination: WalkInDestination) => void;
}

export default function DestinationPicker({ destinations, selected, onSelect }: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const recentIds = useMemo(() => (open ? readRecentDestinations() : []), [open]);

    const sections = useMemo(() => {
        const needle = query.trim().toLowerCase();
        const matches = destinations.filter(
            (d) => !needle || d.name.toLowerCase().includes(needle) || typeLabel(d.type).toLowerCase().includes(needle),
        );
        const byName = (a: WalkInDestination, b: WalkInDestination) => a.name.localeCompare(b.name);

        const recent = needle
            ? []
            : recentIds.map((id) => matches.find((d) => d.id === id)).filter((d): d is WalkInDestination => !!d && d.is_open);
        const recentSet = new Set(recent.map((d) => d.id));

        return [
            { title: 'Recent', items: recent },
            { title: 'Open now', items: matches.filter((d) => d.is_open && !recentSet.has(d.id)).sort(byName) },
            { title: 'Closed', items: matches.filter((d) => !d.is_open).sort(byName) },
        ].filter((s) => s.items.length > 0);
    }, [destinations, query, recentIds]);

    const choose = (destination: WalkInDestination) => {
        if (!destination.is_open) return;
        onSelect(destination);
        setOpen(false);
        setQuery('');
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex min-h-[64px] w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-left transition active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
            >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                    <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    {selected ? (
                        <>
                            <p className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{selected.name}</p>
                            <p
                                className={`flex items-center gap-1.5 text-xs font-semibold ${
                                    selected.is_open ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'
                                }`}
                            >
                                <span className={`h-1.5 w-1.5 rounded-full ${selected.is_open ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                {selected.status_label ?? (selected.is_open ? 'Open' : 'Closed')}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-[15px] font-bold text-slate-900 dark:text-white">Choose destination</p>
                            <p className="text-xs text-slate-500">Where the visitor says they are going</p>
                        </>
                    )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </button>

            <MobileSheet isOpen={open} onClose={() => setOpen(false)} title="Choose destination">
                <div className="flex flex-col gap-4 pb-2">
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search businesses…"
                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-10 pl-10 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                        />
                        {query && (
                            <button
                                type="button"
                                aria-label="Clear search"
                                onClick={() => setQuery('')}
                                className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {sections.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-500">
                            {destinations.length === 0 ? 'No businesses take walk-ins in this estate yet.' : `Nothing matches “${query.trim()}”.`}
                        </p>
                    ) : (
                        sections.map((section) => (
                            <section key={section.title}>
                                <h3 className="mb-1.5 px-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">{section.title}</h3>
                                <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/70">
                                    {section.items.map((d) => (
                                        <li key={d.id}>
                                            <button
                                                type="button"
                                                disabled={!d.is_open}
                                                onClick={() => choose(d)}
                                                className={`flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-2.5 text-left ${
                                                    d.is_open ? 'active:bg-slate-50' : 'cursor-not-allowed bg-slate-50/60'
                                                } ${selected?.id === d.id ? 'bg-indigo-50/60' : ''}`}
                                            >
                                                <span className="min-w-0">
                                                    <span className={`block truncate text-[15px] ${d.is_open ? 'text-slate-900' : 'text-slate-400'}`}>
                                                        {d.name}
                                                    </span>
                                                    <span className="block text-xs text-slate-500 capitalize">{typeLabel(d.type)}</span>
                                                </span>
                                                <span
                                                    className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${
                                                        d.is_open ? 'text-emerald-700' : 'text-slate-400'
                                                    }`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${d.is_open ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                    {d.status_label ?? (d.is_open ? 'Open' : 'Closed')}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))
                    )}
                </div>
            </MobileSheet>
        </>
    );
}
