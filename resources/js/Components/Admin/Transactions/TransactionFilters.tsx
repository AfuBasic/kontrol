import { router } from '@inertiajs/react';
import { RotateCcw, Search } from 'lucide-react';
import { useState } from 'react';

import * as TransactionController from '@/actions/App/Http/Controllers/Admin/TransactionController';

interface FilterOption {
    value: string;
    label: string;
}

interface Resident {
    id: number;
    name: string;
    email: string;
}

interface Collection {
    id: number;
    name: string;
}

interface Props {
    filters: Record<string, string>;
    filterOptions: {
        residents: Resident[];
        collections: Collection[];
        types: FilterOption[];
        statuses: FilterOption[];
        payment_methods: FilterOption[];
    };
}

export default function TransactionFilters({ filters, filterOptions }: Props) {
    const [localFilters, setLocalFilters] = useState({
        search: filters.search || '',
        resident_id: filters.resident_id || '',
        collection_id: filters.collection_id || '',
        type: filters.type || '',
        status: filters.status || '',
        payment_method: filters.payment_method || '',
        provider: filters.provider || '',
        coupon: filters.coupon || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        amount_min: filters.amount_min || '',
        amount_max: filters.amount_max || '',
    });

    const apply = () => {
        router.get(TransactionController.index.url(), localFilters, { preserveState: true, replace: true });
    };

    const reset = () => {
        const cleared = {
            search: '',
            resident_id: '',
            collection_id: '',
            type: '',
            status: '',
            payment_method: '',
            provider: '',
            coupon: '',
            date_from: '',
            date_to: '',
            amount_min: '',
            amount_max: '',
        };
        setLocalFilters(cleared);
        router.get(TransactionController.index.url(), {}, { replace: true });
    };

    const update = (key: string, value: string) => setLocalFilters((prev) => ({ ...prev, [key]: value }));

    const selectClass =
        'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1F6FDB] focus:ring-2 focus:ring-[#1F6FDB]/20';

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Advanced Filters</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="relative md:col-span-2 xl:col-span-2">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={localFilters.search}
                        onChange={(e) => update('search', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && apply()}
                        placeholder="Search resident, reference, receipt..."
                        className={`${selectClass} pl-10`}
                    />
                </div>
                <select value={localFilters.resident_id} onChange={(e) => update('resident_id', e.target.value)} className={selectClass}>
                    <option value="">All Residents</option>
                    {filterOptions.residents.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.name}
                        </option>
                    ))}
                </select>
                <select value={localFilters.collection_id} onChange={(e) => update('collection_id', e.target.value)} className={selectClass}>
                    <option value="">All Collections</option>
                    {filterOptions.collections.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <select value={localFilters.type} onChange={(e) => update('type', e.target.value)} className={selectClass}>
                    <option value="">All Types</option>
                    {filterOptions.types.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.label}
                        </option>
                    ))}
                </select>
                <select value={localFilters.status} onChange={(e) => update('status', e.target.value)} className={selectClass}>
                    <option value="">All Statuses</option>
                    {filterOptions.statuses.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>
                <select value={localFilters.payment_method} onChange={(e) => update('payment_method', e.target.value)} className={selectClass}>
                    <option value="">All Methods</option>
                    {filterOptions.payment_methods.map((m) => (
                        <option key={m.value} value={m.value}>
                            {m.label}
                        </option>
                    ))}
                </select>
                <input type="date" value={localFilters.date_from} onChange={(e) => update('date_from', e.target.value)} className={selectClass} />
                <input type="date" value={localFilters.date_to} onChange={(e) => update('date_to', e.target.value)} className={selectClass} />
                <input
                    value={localFilters.coupon}
                    onChange={(e) => update('coupon', e.target.value)}
                    placeholder="Coupon code"
                    className={selectClass}
                />
                <input
                    value={localFilters.amount_min}
                    onChange={(e) => update('amount_min', e.target.value)}
                    placeholder="Min amount (kobo)"
                    className={selectClass}
                />
                <input
                    value={localFilters.amount_max}
                    onChange={(e) => update('amount_max', e.target.value)}
                    placeholder="Max amount (kobo)"
                    className={selectClass}
                />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={apply}
                    className="rounded-xl bg-[#1F6FDB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A3D91]"
                >
                    Apply Filters
                </button>
                <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                </button>
            </div>
        </div>
    );
}