import { useState, type ReactNode } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { hasActiveVisitorFilters, type VisitorFilters } from './types';

type Props = {
    filters: VisitorFilters;
    hosts: Array<{ id: number; name: string }>;
    checkoutEnabled: boolean;
    onFilterChange: (filters: Record<string, string | number | undefined>) => void;
    onClearFilters: () => void;
};

/**
 * Shared search + filter controls for Activity timeline and Table views.
 */
export default function ActivityFiltersBar({
    filters,
    hosts,
    checkoutEnabled,
    onFilterChange,
    onClearFilters,
}: Props) {
    const [filtersOpen, setFiltersOpen] = useState(false);
    const active = hasActiveVisitorFilters(filters);

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[12rem] flex-1 sm:flex-none">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        value={filters.search || ''}
                        onChange={(e) => onFilterChange({ search: e.target.value || undefined })}
                        placeholder="Search visitor, host, code…"
                        className="w-full rounded-xl border border-gray-200 bg-white py-2 pr-3 pl-9 text-xs font-medium text-gray-800 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-hidden sm:w-64"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => setFiltersOpen((open) => !open)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors duration-150 ease-out active:scale-[0.97] ${
                        filtersOpen || active
                            ? 'border-primary-200 bg-primary-50 text-primary-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filters
                </button>

                {active && (
                    <button
                        type="button"
                        onClick={onClearFilters}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600 transition-colors duration-150 ease-out hover:bg-gray-200 active:scale-[0.97]"
                    >
                        <X className="h-3.5 w-3.5" />
                        Clear
                    </button>
                )}
            </div>

            {filtersOpen && (
                <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <FilterField label="Date">
                        <input
                            type="date"
                            value={filters.date || ''}
                            onChange={(e) => onFilterChange({ date: e.target.value || undefined })}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 focus:border-primary-500 focus:outline-hidden"
                        />
                    </FilterField>

                    <FilterField label="Host">
                        <select
                            value={filters.host_id || ''}
                            onChange={(e) => onFilterChange({ host_id: e.target.value || undefined })}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 focus:border-primary-500 focus:outline-hidden"
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
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 focus:border-primary-500 focus:outline-hidden"
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
                            placeholder="Plate number…"
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 focus:border-primary-500 focus:outline-hidden"
                        />
                    </FilterField>
                </div>
            )}
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
