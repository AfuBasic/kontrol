import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { SlidersHorizontal, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';

type Option = { value: string; label: string };

export function FilterChips({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: Option[];
    onChange: (value: string) => void;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">{label}</span>
            <div role="group" aria-label={label} className="inline-flex w-fit max-w-full overflow-x-auto rounded-xl bg-slate-100 p-1">
                {options.map((option) => {
                    const selected = (value ?? '') === option.value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => onChange(option.value)}
                            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                                selected ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

type FilterBarProps = {
    search: string;
    onSearch: (value: string) => void;
    placeholder: string;
    searchLabel: string;
    /** Number of non-search filters currently applied (shown on the mobile button). */
    activeCount: number;
    hasActive: boolean;
    onReset: () => void;
    /** Chip groups, rendered left. */
    children?: ReactNode;
    /** Controls pinned right (e.g. sort). */
    trailing?: ReactNode;
};

/**
 * Prominent search field with chip filters. On phones the chips collapse
 * behind a Filters button so the list stays near the top of the screen.
 */
export default function FilterBar({
    search,
    onSearch,
    placeholder,
    searchLabel,
    activeCount,
    hasActive,
    onReset,
    children,
    trailing,
}: FilterBarProps) {
    const [open, setOpen] = useState(activeCount > 0);
    const hasControls = Boolean(children || trailing);

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <div className="relative min-w-0 flex-1">
                        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => onSearch(e.target.value)}
                            placeholder={placeholder}
                            aria-label={searchLabel}
                            className="w-full rounded-xl border border-slate-300 bg-slate-50 h-11 pr-3 pl-10 text-sm font-medium text-slate-900 shadow-xs placeholder:text-slate-500 focus:border-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-800/10 focus:outline-hidden"
                        />
                    </div>
                    {hasControls && (
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            aria-expanded={open}
                            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-xs transition active:scale-95 lg:hidden"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            Filters
                            {activeCount > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[11px] font-black text-white">
                                    {activeCount}
                                </span>
                            )}
                        </button>
                    )}
                </div>

                {hasControls && (
                    <div className={`${open ? 'flex' : 'hidden'} flex-col gap-3 lg:flex lg:flex-row lg:items-start lg:justify-between`}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6">{children}</div>
                        <div className="flex items-center gap-3">
                            {trailing && <div className="min-w-[10rem] flex-1 lg:flex-none">{trailing}</div>}
                            {hasActive && (
                                <button
                                    type="button"
                                    onClick={onReset}
                                    className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-slate-500 underline-offset-4 transition hover:text-slate-900 hover:underline"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
