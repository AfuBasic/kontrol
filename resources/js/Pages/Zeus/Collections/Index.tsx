import { Link } from '@inertiajs/react';
import ZeusLayout from '@/Layouts/ZeusLayout';
import { Head, router } from '@inertiajs/react';
import { 
    BanknotesIcon, 
    ArrowTrendingUpIcon, 
    ArrowTrendingDownIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    BuildingOfficeIcon,
    UserIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import debounce from 'lodash/debounce';

interface GlobalMetrics {
    total_expected: number;
    total_paid: number;
    active_collections: number;
    expected_platform_revenue: number;
    realized_platform_revenue: number;
    lost_platform_revenue: number;
}

interface Collection {
    id: number;
    name: string;
    estate_name: string;
    estate_id: number;
    targets_count: number;
    amount_expected: number;
    amount_paid: number;
    platform_fee_earned: number;
    completion_rate: number;
}

interface TopEstate {
    estate_name: string;
    volume_processed: number;
    platform_revenue: number;
}

interface Defaulter {
    id: number;
    resident_name: string;
    estate_name: string;
    collection_name: string;
    amount_owed: number;
    days_overdue: number;
    lost_platform_fee: number;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationData {
    data: Collection[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Props {
    metrics: GlobalMetrics;
    collections: PaginationData;
    topEstates: TopEstate[];
    defaulters: Defaulter[];
    filters: { search?: string };
}

export default function Collections({ metrics, collections, topEstates, defaulters, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const handleSearch = debounce((query: string) => {
        router.get(
            '/zeus/collections',
            { search: query },
            { preserveState: true, replace: true }
        );
    }, 500);

    const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        handleSearch(e.target.value);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <ZeusLayout>
            <Head title="Platform Collections" />

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-3xl font-black tracking-tight text-transparent dark:from-white dark:to-slate-400">
                        Global Collections
                    </h1>
                    <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                        Oversight of all active estate collections and platform revenue tracking.
                    </p>
                </div>
            </div>

            {/* Platform Revenue KPIs */}
            <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Active Collections */}
                <div className="group relative overflow-hidden rounded-[2rem] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200/50 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:bg-[#0a0e17] dark:ring-white/10">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl transition-all group-hover:bg-blue-500/20" />
                    <div className="relative">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                <BanknotesIcon className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Active Collections</p>
                                <p className="mt-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                    {metrics.active_collections}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expected Revenue */}
                <div className="group relative overflow-hidden rounded-[2rem] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200/50 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:bg-[#0a0e17] dark:ring-white/10">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl transition-all group-hover:bg-indigo-500/20" />
                    <div className="relative">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                <ArrowTrendingUpIcon className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Expected Revenue</p>
                                <p className="mt-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                    {formatCurrency(metrics.expected_platform_revenue)}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                                0.5% Fee
                            </span>
                            <span className="text-xs font-medium text-slate-500">
                                of {formatCurrency(metrics.total_expected)} vol.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Realized Revenue */}
                <div className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 p-6 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/30">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20 blur-2xl transition-all" />
                    <div className="relative">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
                                <BanknotesIcon className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-xs font-bold tracking-widest text-emerald-100 uppercase">Realized Revenue</p>
                                <p className="mt-1 text-3xl font-black tracking-tight text-white">
                                    {formatCurrency(metrics.realized_platform_revenue)}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-emerald-100">
                            <span className="text-xs font-medium">
                                From {formatCurrency(metrics.total_paid)} processed vol.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Lost Revenue */}
                <div className="group relative overflow-hidden rounded-[2rem] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-rose-200/50 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:bg-[#0a0e17] dark:ring-rose-900/30">
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl transition-all group-hover:bg-rose-500/20" />
                    <div className="relative">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                                <ArrowTrendingDownIcon className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Lost Revenue</p>
                                <p className="mt-1 text-3xl font-black tracking-tight text-rose-600 dark:text-rose-400">
                                    {formatCurrency(metrics.lost_platform_revenue)}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-rose-500">
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            <span>Due to manual offline payments</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {/* Collections Ledger - Full Width */}
                <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/40 ring-1 ring-slate-100 dark:bg-[#0a0e17] dark:shadow-none dark:ring-white/10">
                    <div className="border-b border-slate-100 bg-slate-50/50 p-6 sm:px-8 dark:border-white/5 dark:bg-white/5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                                    Collections Ledger
                                </h3>
                                <p className="mt-1 text-xs font-medium text-slate-500">
                                    Monitor fee generation per active collection globally.
                                </p>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                    <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={onSearchChange}
                                    className="block w-full rounded-2xl border-0 bg-white py-2.5 pl-11 pr-4 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-blue-500"
                                    placeholder="Search collection..."
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-white/5">
                            <thead className="bg-white dark:bg-transparent">
                                <tr>
                                    <th className="px-8 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">Collection</th>
                                    <th className="px-8 py-4 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">Expected / Paid</th>
                                    <th className="px-8 py-4 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">Platform Fee</th>
                                    <th className="px-8 py-4 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white dark:divide-white/5 dark:bg-transparent">
                                {collections.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <BanknotesIcon className="mb-3 h-8 w-8" />
                                                <p className="text-sm font-medium">No active collections found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    collections.data.map((collection) => (
                                        <tr key={collection.id} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-white/5">
                                            <td className="whitespace-nowrap px-8 py-5">
                                                <Link href={`/zeus/collections/${collection.id}`} className="flex flex-col focus:outline-none">
                                                    <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 transition-colors">
                                                        {collection.name}
                                                    </span>
                                                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <BuildingOfficeIcon className="h-3 w-3" />
                                                            {collection.estate_name}
                                                        </span>
                                                        <span>&bull;</span>
                                                        <span className="flex items-center gap-1">
                                                            <UserIcon className="h-3 w-3" />
                                                            {collection.targets_count} targeted
                                                        </span>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="whitespace-nowrap px-8 py-5 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-black text-slate-900 dark:text-white">
                                                        {formatCurrency(collection.amount_paid)}
                                                    </span>
                                                    <span className="mt-1 text-[11px] font-medium text-slate-400">
                                                        of {formatCurrency(collection.amount_expected)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-8 py-5 text-right">
                                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                                                    {formatCurrency(collection.platform_fee_earned)}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                                                        <div 
                                                            className="h-full rounded-full bg-blue-500 transition-all" 
                                                            style={{ width: `${collection.completion_rate}%` }} 
                                                        />
                                                    </div>
                                                    <span className="w-9 text-right text-xs font-bold text-slate-600 dark:text-slate-400">
                                                        {collection.completion_rate}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {collections.links && collections.links.length > 3 && (
                        <div className="border-t border-slate-100 bg-white p-4 sm:px-8 dark:border-white/5 dark:bg-[#0a0e17]">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-500">
                                    Showing <span className="font-bold text-slate-900 dark:text-white">{(collections.current_page - 1) * collections.per_page + 1}</span> to <span className="font-bold text-slate-900 dark:text-white">{Math.min(collections.current_page * collections.per_page, collections.total)}</span> of <span className="font-bold text-slate-900 dark:text-white">{collections.total}</span> entries
                                </p>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    {collections.links.map((link, idx) => {
                                        const isFirst = idx === 0;
                                        const isLast = idx === collections.links.length - 1;
                                        
                                        if (isFirst || isLast) {
                                            return (
                                                <Link
                                                    key={idx}
                                                    href={link.url || '#'}
                                                    className={`relative inline-flex items-center px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 dark:ring-white/10 dark:hover:bg-white/5 ${isFirst ? 'rounded-l-md' : ''} ${isLast ? 'rounded-r-md' : ''} ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    dangerouslySetInnerHTML={{ __html: isFirst ? '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>' : '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>' }}
                                                />
                                            );
                                        }

                                        return (
                                            <Link
                                                key={idx}
                                                href={link.url || '#'}
                                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 ${
                                                    link.active
                                                        ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                        : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:outline-offset-0 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/5'
                                                }`}
                                            >
                                                {link.label}
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Defaulters Ledger */}
                    <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/40 ring-1 ring-slate-100 dark:bg-[#0a0e17] dark:shadow-none dark:ring-white/10">
                        <div className="border-b border-slate-100 p-6 sm:px-8 dark:border-white/5">
                            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                                Top Defaulters Impact
                            </h3>
                            <p className="mt-1 text-xs font-medium text-slate-500">Highest overdue assignments causing lost revenue.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-white/5">
                                <thead className="bg-slate-50/50 dark:bg-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">Resident</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black tracking-widest text-rose-500 uppercase">Lost Fee</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white dark:divide-white/5 dark:bg-transparent">
                                    {defaulters.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} className="px-6 py-8 text-center text-sm font-medium text-slate-500">
                                                No major defaulters found.
                                            </td>
                                        </tr>
                                    ) : (
                                        defaulters.map((defaulter) => (
                                            <tr key={defaulter.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-white/5">
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{defaulter.resident_name}</div>
                                                    <div className="mt-1 text-[10px] text-slate-500">{defaulter.estate_name}</div>
                                                    <div className="mt-1 inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 ring-1 ring-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                                                        {defaulter.days_overdue} days overdue
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right align-top">
                                                    <span className="text-sm font-black text-rose-500">
                                                        {formatCurrency(defaulter.lost_platform_fee)}
                                                    </span>
                                                    <div className="mt-1 text-[10px] font-medium text-slate-400">
                                                        {formatCurrency(defaulter.amount_owed)} owed
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Top Estates */}
                    <div className="overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl shadow-slate-900/20 ring-1 ring-white/10 dark:from-[#0a0e17] dark:to-[#111827]">
                        <div className="relative border-b border-white/10 p-6 sm:px-8">
                            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-blue-500/20 blur-3xl" />
                            <h3 className="relative z-10 text-lg font-black tracking-tight text-white">
                                Top Revenue Drivers
                            </h3>
                            <p className="relative z-10 mt-1 text-xs font-medium text-slate-400">
                                Estates generating the highest platform fees.
                            </p>
                        </div>
                        <ul className="divide-y divide-white/5">
                            {topEstates.length === 0 ? (
                                <li className="p-8 text-center text-sm font-medium text-slate-500">
                                    No data available yet.
                                </li>
                            ) : (
                                topEstates.map((estate, idx) => (
                                    <li key={idx} className="relative overflow-hidden p-6 sm:px-8 transition-colors hover:bg-white/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-black shadow-lg ${
                                                    idx === 0 
                                                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-orange-500/30' 
                                                        : idx === 1 
                                                        ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900 shadow-slate-400/30'
                                                        : idx === 2
                                                        ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-white shadow-amber-900/30'
                                                        : 'bg-white/10 text-white'
                                                }`}>
                                                    #{idx + 1}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">
                                                        {estate.estate_name}
                                                    </p>
                                                    <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                                        {formatCurrency(estate.volume_processed)} Processed
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-emerald-400">
                                                    {formatCurrency(estate.platform_revenue)}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </ZeusLayout>
    );
}
