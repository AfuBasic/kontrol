import { router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Filter, RotateCcw, Search } from 'lucide-react';
import { useState } from 'react';

import * as TransactionController from '@/actions/App/Http/Controllers/Admin/TransactionController';
import SearchableSelect from '@/Components/UI/SearchableSelect';

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
    maxAmountLimit?: number;
}

export default function LedgerFilters({ filters, filterOptions, maxAmountLimit = 1000000 }: Props) {
    const [showMore, setShowMore] = useState(
        Boolean(
            filters.resident_id ||
            filters.collection_id ||
            filters.payment_method ||
            filters.provider ||
            filters.coupon ||
            filters.created_by ||
            filters.approved_by ||
            filters.amount_min ||
            filters.amount_max,
        ),
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

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Math.min(Number(e.target.value), Number(local.amount_max || maxAmountLimit) - 5000);
        update('amount_min', String(val));
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Math.max(Number(e.target.value), Number(local.amount_min || 0) + 5000);
        update('amount_max', String(val));
    };

    const apply = () => {
        router.get(TransactionController.index.url(), local, { preserveState: true, replace: true });
    };

    const reset = () => {
        const cleared = {
            search: '',
            date_from: '',
            date_to: '',
            status: '',
            type: '',
            resident_id: '',
            collection_id: '',
            payment_method: '',
            provider: '',
            coupon: '',
            created_by: '',
            approved_by: '',
            amount_min: '',
            amount_max: '',
        };
        setLocal(cleared);
        router.get(TransactionController.index.url(), {}, { replace: true });
    };

    const inputClass =
        'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100';

    return (
        <div className="space-y-3">
            {/* Primary Filter Bar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={local.search}
                        onChange={(e) => update('search', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && apply()}
                        placeholder="Search transactions..."
                        className={`${inputClass} h-10 pl-9`}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="date"
                        value={local.date_from}
                        onChange={(e) => update('date_from', e.target.value)}
                        className={`${inputClass} h-10 w-28 sm:w-32`}
                    />
                    <SearchableSelect
                        options={filterOptions.statuses.map((s) => ({ value: s.value, label: s.label }))}
                        value={local.status}
                        onChange={(v) => update('status', v)}
                        placeholder="All Statuses"
                        className="w-32 sm:w-36"
                    />
                    <button
                        type="button"
                        onClick={() => setShowMore(!showMore)}
                        className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-black tracking-wider uppercase transition ${
                            showMore
                                ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Filter className="h-3 w-3" /> Filters
                    </button>
                    <button
                        type="button"
                        onClick={apply}
                        className="h-10 rounded-xl bg-[#1F6FDB] px-4 text-xs font-black tracking-wider text-white uppercase transition hover:bg-blue-700"
                    >
                        Apply
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showMore && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 sm:grid-cols-2 lg:grid-cols-3">
                            <SearchableSelect
                                label="Resident"
                                options={filterOptions.residents.map((r) => ({ value: r.id, label: r.name }))}
                                value={local.resident_id}
                                onChange={(v) => update('resident_id', v)}
                                placeholder="Select resident"
                            />
                            <SearchableSelect
                                label="Collection"
                                options={filterOptions.collections.map((c) => ({ value: c.id, label: c.name }))}
                                value={local.collection_id}
                                onChange={(v) => update('collection_id', v)}
                                placeholder="Select collection"
                            />
                            <div>
                                <label className="mb-1 block text-[9px] font-black tracking-widest text-slate-400 uppercase">Coupon Code</label>
                                <input
                                    value={local.coupon}
                                    onChange={(e) => update('coupon', e.target.value)}
                                    placeholder="e.g. WELCOME25"
                                    className={inputClass}
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <div className="flex items-center justify-between text-[9px] font-black tracking-widest text-slate-400 uppercase">
                                    <span>Amount Range</span>
                                    <span className="text-xs font-extrabold text-slate-800">
                                        ₦{Number(local.amount_min || 0).toLocaleString()} - ₦
                                        {Number(local.amount_max || maxAmountLimit).toLocaleString()}
                                    </span>
                                </div>
                                <div className="relative flex h-6 w-full items-center">
                                    {/* Base track */}
                                    <div className="absolute right-0 left-0 h-1.5 rounded-lg bg-slate-200"></div>

                                    {/* Highlight active range */}
                                    <div
                                        className="absolute h-1.5 rounded-lg bg-indigo-600"
                                        style={{
                                            left: `${(Number(local.amount_min || 0) / maxAmountLimit) * 100}%`,
                                            right: `${100 - (Number(local.amount_max || maxAmountLimit) / maxAmountLimit) * 100}%`,
                                        }}
                                    ></div>

                                    {/* Dual Thumb Inputs */}
                                    <input
                                        type="range"
                                        min="0"
                                        max={maxAmountLimit}
                                        step="5000"
                                        value={local.amount_min || 0}
                                        onChange={handleMinChange}
                                        className="pointer-events-none absolute h-1.5 w-full cursor-pointer appearance-none bg-transparent accent-indigo-600 [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto"
                                        style={{
                                            zIndex: Number(local.amount_min || 0) > maxAmountLimit / 2 ? 25 : 10,
                                        }}
                                    />
                                    <input
                                        type="range"
                                        min="0"
                                        max={maxAmountLimit}
                                        step="5000"
                                        value={local.amount_max || maxAmountLimit}
                                        onChange={handleMaxChange}
                                        className="pointer-events-none absolute h-1.5 w-full cursor-pointer appearance-none bg-transparent accent-indigo-600 [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto"
                                        style={{
                                            zIndex: Number(local.amount_min || 0) > maxAmountLimit / 2 ? 10 : 25,
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={reset}
                                    className="inline-flex items-center gap-1.5 pb-2.5 text-xs font-black tracking-widest text-slate-400 uppercase hover:text-slate-600"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" /> Reset all filters
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
