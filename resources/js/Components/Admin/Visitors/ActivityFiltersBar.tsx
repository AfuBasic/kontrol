import { useState, type ReactNode } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { hasActiveVisitorFilters, type VisitorFilters } from './types';

type Props = {
    filters: VisitorFilters;
    hosts: Array<{ id: number; name: string }>;
    checkoutEnabled: boolean;
    activeVisitCount?: number;
    onFilterChange: (filters: Record<string, string | number | undefined>) => void;
    onClearFilters: () => void;
};

/**
 * Timeline tools - search + filters sit in the journal chrome, not as floating widgets.
 */
export default function ActivityFiltersBar({
    filters,
    hosts,
    checkoutEnabled,
    activeVisitCount = 0,
    onFilterChange,
    onClearFilters,
}: Props) {
    const [filtersOpen, setFiltersOpen] = useState(false);
    const active = hasActiveVisitorFilters(filters);
    const isInsideOnly = filters.status === 'inside';

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
                <div className="relative min-w-0 flex-1 sm:max-w-xs">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        value={filters.search || ''}
                        onChange={(e) => onFilterChange({ search: e.target.value || undefined })}
                        placeholder="Search visitor, host, code…"
                        className="w-full rounded-lg border border-gray-200 bg-gray-50/80 py-1.5 pr-2.5 pl-8 text-xs font-medium text-gray-800 transition-[border-color,box-shadow,background-color] duration-150 ease-out placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-slate-900/15 focus:outline-hidden"
                    />
                </div>

                {checkoutEnabled && (
                    <button
                        type="button"
                        onClick={() =>
                            onFilterChange({
                                status: isInsideOnly ? undefined : 'inside',
                            })
                        }
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors duration-150 ease-out active:scale-[0.97] ${
                            isInsideOnly
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'border-gray-200 bg-gray-50/80 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        <span>Currently Inside</span>
                        {activeVisitCount > 0 && (
                            <span
                                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                                    isInsideOnly
                                        ? 'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100'
                                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                                }`}
                            >
                                {activeVisitCount}
                            </span>
                        )}
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => setFiltersOpen((open) => !open)}
                    className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors duration-150 ease-out active:scale-[0.97] ${
                        filtersOpen || active
                            ? 'border-primary-200 bg-primary-50 text-primary-700'
                            : 'border-gray-200 bg-gray-50/80 text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filters
                    {active ? (
                        <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-950 px-1 text-[9px] font-bold text-white">
                            !
                        </span>
                    ) : null}
                </button>

                {active && (
                    <button
                        type="button"
                        onClick={onClearFilters}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-gray-500 transition-colors duration-150 ease-out hover:bg-gray-100 hover:text-gray-800 active:scale-[0.97]"
                    >
                        <X className="h-3.5 w-3.5" />
                        Clear
                    </button>
                )}
            </div>

            <div
                className="grid transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                style={{ gridTemplateRows: filtersOpen ? '1fr' : '0fr' }}
            >
                <div className="min-h-0 overflow-hidden">
                    <div className="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 bg-gray-50/90 p-3 sm:grid-cols-2 lg:grid-cols-4">
                        <FilterField label="Date">
                            <input
                                type="date"
                                value={filters.date || ''}
                                onChange={(e) => onFilterChange({ date: e.target.value || undefined })}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 focus:border-primary-500 focus:outline-hidden"
                            />
                        </FilterField>

                        <FilterField label="Host">
                            <select
                                value={filters.host_id || ''}
                                onChange={(e) => onFilterChange({ host_id: e.target.value || undefined })}
                                className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 focus:border-primary-500 focus:outline-hidden"
                            >
                                <option value="">All hosts</option>
                                {hosts.map((host) => (
                                    <option key={host.id} value={host.id}>
                                        {host.name}
                                    </option>
                                ))}
                            </select>
                        </FilterField>

                        {checkoutEnabled && (
                            <FilterField label="Stay status">
                                <select
                                    value={filters.status || ''}
                                    onChange={(e) => onFilterChange({ status: e.target.value || undefined })}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 focus:border-primary-500 focus:outline-hidden"
                                >
                                    <option value="">All</option>
                                    <option value="inside">Still on property</option>
                                    <option value="checked_out">Checked out</option>
                                </select>
                            </FilterField>
                        )}

                        <FilterField label="Vehicle plate">
                            <input
                                type="text"
                                value={filters.vehicle_plate || ''}
                                onChange={(e) => onFilterChange({ vehicle_plate: e.target.value || undefined })}
                                placeholder="Plate…"
                                className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 focus:border-primary-500 focus:outline-hidden"
                            />
                        </FilterField>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">{label}</label>
            <div className="mt-1">{children}</div>
        </div>
    );
}
