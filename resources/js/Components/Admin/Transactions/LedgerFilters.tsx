import { router } from '@inertiajs/react';
import { ChevronDown, ChevronUp, RotateCcw, Search } from 'lucide-react';
import { useState } from 'react';

import TransactionController from '@/actions/App/Http/Controllers/Admin/TransactionController';

interface FilterOption {
    value: string;
    label: string;
}

interface Resident {
    id: number;
    name: string;
}

interface Collection {
    id: number;
    name: string;
}

interface Admin {
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
        admins: Admin[];
    };
}

export default function LedgerFilters({ filters, filterOptions }: Props) {
    const [showMore, setShowMore] = useState(
        Boolean(filters.resident_id || filters.collection_id || filters.payment_method || filters.provider || filters.coupon || filters.created_by || filters.approved_by || filters.amount_min || filters.amount_max),
    );

    const [local, setLocal] = useState({
        search: filters.search || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        status: filters.status || '',
        type: filters.type || '',
        resident_id: filters.resident_id || '',
        collection_id: filters.collection_id || '',
        payment_method: filters.payment_method || '',
        provider: filters.provider || '',
        coupon: filters.coupon || '',
        created_by: filters.created_by || '',
        approved_by: filters.approved_by || '',
        amount_min: filters.amount_min || '',
        amount_max: filters.amount_max || '',
    });

    const update = (key: string, value: string) => setLocal((prev) => ({ ...prev, [key]: value }));

    const apply = () => {
        router.get(TransactionController.index.url(), local, { preserveState: true, replace: true });
    };

    const reset = () => {
        const cleared = {
            search: '', date_from: '', date_to: '', status: '', type: '',
            resident_id: '', collection_id: '', payment_method: '', provider: '',
            coupon: '', created_by: '', approved_by: '', amount_min: '', amount_max: '',
        };
        setLocal(cleared);
        router.get(TransactionController.index.url(), {}, { replace: true });
    };

    const inputClass =
        'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100';

    return (
        <div className="rounded-xl border border-slate-200/80 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={local.search}
                        onChange={(e) => update('search', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && apply()}
                        placeholder="Search transactions, residents, references…"
                        className={`${inputClass} pl-9`}
                    />
                </div>
                <input type="date" value={local.date_from} onChange={(e) => update('date_from', e.target.value)} className={`${inputClass} sm:w-36`} />
                <input type="date" value={local.date_to} onChange={(e) => update('date_to', e.target.value)} className={`${inputClass} sm:w-36`} />
                <select value={local.status} onChange={(e) => update('status', e.target.value)} className={`${inputClass} sm:w-32`}>
                    <option value="">Status</option>
                    {filterOptions.statuses.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>
                <select value={local.type} onChange={(e) => update('type', e.target.value)} className={`${inputClass} sm:w-36`}>
                    <option value="">Type</option>
                    {filterOptions.types.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={() => setShowMore(!showMore)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                    More Filters
                    {showMore ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <button type="button" onClick={apply} className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                    Apply
                </button>
            </div>

            {showMore && (
                <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
                    <select value={local.resident_id} onChange={(e) => update('resident_id', e.target.value)} className={inputClass}>
                        <option value="">Resident</option>
                        {filterOptions.residents.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                    <select value={local.collection_id} onChange={(e) => update('collection_id', e.target.value)} className={inputClass}>
                        <option value="">Collection</option>
                        {filterOptions.collections.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <select value={local.payment_method} onChange={(e) => update('payment_method', e.target.value)} className={inputClass}>
                        <option value="">Payment Method</option>
                        {filterOptions.payment_methods.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                    <input value={local.coupon} onChange={(e) => update('coupon', e.target.value)} placeholder="Coupon code" className={inputClass} />
                    <input value={local.provider} onChange={(e) => update('provider', e.target.value)} placeholder="Gateway / provider" className={inputClass} />
                    <input value={local.amount_min} onChange={(e) => update('amount_min', e.target.value)} placeholder="Min amount (kobo)" className={inputClass} />
                    <input value={local.amount_max} onChange={(e) => update('amount_max', e.target.value)} placeholder="Max amount (kobo)" className={inputClass} />
                    <select value={local.created_by} onChange={(e) => update('created_by', e.target.value)} className={inputClass}>
                        <option value="">Created By</option>
                        {filterOptions.admins.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>
                    <select value={local.approved_by} onChange={(e) => update('approved_by', e.target.value)} className={inputClass}>
                        <option value="">Approved By</option>
                        {filterOptions.admins.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>
                    <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
                        <RotateCcw className="h-3.5 w-3.5" /> Reset filters
                    </button>
                </div>
            )}
        </div>
    );
}