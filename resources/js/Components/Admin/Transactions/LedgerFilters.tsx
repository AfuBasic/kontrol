import { router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Filter, RotateCcw, Search } from 'lucide-react';
import { useState } from 'react';

import TransactionController from '@/actions/App/Http/Controllers/Admin/TransactionController';
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
}

export default function LedgerFilters({ filters, filterOptions }: Props) {
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
            filters.amount_max
        )
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
                        className={`${inputClass} pl-9 h-10`}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="date"
                        value={local.date_from}
                        onChange={(e) => update('date_from', e.target.value)}
                        className={`${inputClass} w-28 sm:w-32 h-10`}
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
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 h-10 text-xs font-black tracking-wider uppercase transition ${
                            showMore
                                ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Filter className="h-3 w-3" /> Filters
                    </button>
                    <button
                        type="button"
                        onClick={apply}
                        className="rounded-xl bg-[#1F6FDB] px-4 h-10 text-xs font-black tracking-wider text-white uppercase transition hover:bg-blue-700"
                    >
                        Apply
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showMore && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
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
                                <input value={local.coupon} onChange={(e) => update('coupon', e.target.value)} placeholder="e.g. WELCOME25" className={inputClass} />
                            </div>
                            <div className="sm:col-span-2 space-y-2">
                                <label className="block text-[9px] font-black tracking-widest text-slate-400 uppercase">
                                    Amount Range: ₦{Number(local.amount_min || 0).toLocaleString()} - ₦{Number(local.amount_max || 1000000).toLocaleString()}
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                                            <span>Min Amount</span>
                                            <span>₦{Number(local.amount_min || 0).toLocaleString()}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="500000"
                                            step="5000"
                                            value={local.amount_min || 0}
                                            onChange={(e) => update('amount_min', e.target.value)}
                                            className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                                            <span>Max Amount</span>
                                            <span>₦{Number(local.amount_max || 1000000).toLocaleString()}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1000000"
                                            step="10000"
                                            value={local.amount_max || 1000000}
                                            onChange={(e) => update('amount_max', e.target.value)}
                                            className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={reset}
                                    className="inline-flex items-center gap-1.5 text-xs font-black tracking-widest text-slate-400 uppercase hover:text-slate-600 pb-2.5"
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