import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
    Ticket, 
    Trash2, 
    Building2, 
    User, 
    Globe, 
    Calendar,
    Plus,
    X,
    Search,
    SlidersHorizontal,
    TrendingUp,
    Percent,
    Coins,
    CheckCircle,
    Clock,
    AlertCircle,
    ArrowUpRight,
    Play,
    Pause,
    BarChart3,
    Sparkles,
    Eye,
    Infinity as InfinityIcon
} from 'lucide-react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface Coupon {
    id: number;
    code: string;
    campaign_name: string | null;
    marketing_tag: string | null;
    description: string | null;
    estate: { id: number; name: string } | null;
    user: { id: number; name: string; email: string } | null;
    status: 'active' | 'paused' | 'disabled';
    raw_status: string;
    type: 'percentage' | 'fixed';
    value: number;
    formatted_value: string;
    expires_at: string | null;
    starts_at: string | null;
    usage_limit: number | null;
    used_count: number;
}

interface PaginatedCoupons {
    data: Coupon[];
    links: any[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

interface Props {
    coupons: PaginatedCoupons;
    stats: {
        total_coupons: number;
        active_coupons: number;
        total_redemptions: number;
        total_savings: string;
    };
    filters: {
        q?: string;
        type?: string;
        scope?: string;
        status?: string;
    };
}

export default function CouponsIndex({ coupons, stats, filters }: Props) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState(filters.q || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');
    const [selectedScope, setSelectedScope] = useState(filters.scope || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [showFilters, setShowFilters] = useState(false);

    // Trigger router search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            handleFilterChange();
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, selectedType, selectedScope, selectedStatus]);

    function handleFilterChange() {
        router.get('/zeus/coupons', {
            q: searchQuery,
            type: selectedType,
            scope: selectedScope,
            status: selectedStatus,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    }

    function clearFilters() {
        setSearchQuery('');
        setSelectedType('');
        setSelectedScope('');
        setSelectedStatus('');
    }

    function handleDeleteClick(e: React.MouseEvent, coupon: Coupon) {
        e.preventDefault();
        e.stopPropagation();
        setSelectedCoupon(coupon);
        setDeleteModalOpen(true);
    }

    function handleDeleteConfirm() {
        if (!selectedCoupon) return;
        setIsDeleting(true);
        router.delete(`/zeus/coupons/${selectedCoupon.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalOpen(false);
                setSelectedCoupon(null);
            },
        });
    }

    // Dynamic color helpers for statuses
    const getStatusStyle = (coupon: Coupon) => {
        const now = new Date();
        const starts = coupon.starts_at ? new Date(coupon.starts_at) : null;
        const expires = coupon.expires_at ? new Date(coupon.expires_at) : null;

        if (coupon.status === 'paused') {
            return {
                label: 'Paused',
                bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                dot: 'bg-amber-500 shadow-amber-500/50'
            };
        }
        if (expires && expires < now) {
            return {
                label: 'Expired',
                bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                dot: 'bg-rose-500 shadow-rose-500/50'
            };
        }
        if (starts && starts > now) {
            return {
                label: 'Scheduled',
                bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                dot: 'bg-blue-500 shadow-blue-500/50'
            };
        }
        return {
            label: 'Active',
            bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            dot: 'bg-emerald-500 shadow-emerald-500/50'
        };
    };

    return (
        <ZeusLayout>
            <Head title="Platform Coupons" />

            {/* Premium Decorative Glow */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-[130px] pointer-events-none animate-pulse duration-[8000ms]" />
            
            <div className="relative mx-auto max-w-7xl px-4 py-8">
                {/* Header Section */}
                <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-500 dark:text-indigo-400">Coupon Manager</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                            Platform <span className="font-light text-slate-400">Coupons</span>
                        </h1>
                        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                            Create incentives, configure percentage discounts, fixed coupons, and schedule automated discounts targeting residents, estates, or global scopes.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <Link
                            href="/zeus/coupons/create"
                            className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 px-6 py-4 text-sm font-black text-white shadow-lg shadow-indigo-500/25 dark:shadow-indigo-500/10 transition active:scale-[0.98]"
                        >
                            <Plus className="h-4 w-4 stroke-[3]" />
                            Create Coupon
                        </Link>
                    </div>
                </div>

                {/* KPI Metrics Dashboard Panel */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
                >
                    {/* Card 1 */}
                    <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-[#0f1423] p-6 shadow-xs relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Coupons</span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.active_coupons}</span>
                            <span className="text-xs font-semibold text-slate-400">/ {stats.total_coupons} total</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>Coupons Live</span>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-[#0f1423] p-6 shadow-xs relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Redemptions</span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.total_redemptions.toLocaleString()}</span>
                            <span className="text-xs font-semibold text-slate-400">uses</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-500 font-bold">
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span>Across all accounts</span>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-[#0f1423] p-6 shadow-xs relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Savings Saved</span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-white truncate max-w-full">{stats.total_savings}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-500 font-bold">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Subscribers savings</span>
                        </div>
                    </div>

                    {/* Card 4 */}
                    <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-[#0f1423] p-6 shadow-xs relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Platform Index</span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">A+</span>
                            <span className="text-xs font-semibold text-slate-400">Health score</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-violet-500 font-bold">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Conversion optimized</span>
                        </div>
                    </div>
                </motion.div>

                {/* Filter and Search Panel */}
                <div className="mb-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-[#0f1423] p-4 shadow-xs">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        {/* Search field */}
                        <div className="relative flex-1">
                            <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by coupon code or name..."
                                className="w-full rounded-xl border border-slate-200/60 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-[#080b13] dark:text-white"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Dropdown Filters Action */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition cursor-pointer ${
                                    showFilters || selectedType || selectedScope || selectedStatus
                                        ? 'border-indigo-500/20 bg-indigo-500/5 text-indigo-500'
                                        : 'border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                }`}
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                Filters
                                {(selectedType || selectedScope || selectedStatus) && (
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] text-white">!</span>
                                )}
                            </button>

                            {(selectedType || selectedScope || selectedStatus || searchQuery) && (
                                <button
                                    onClick={clearFilters}
                                    className="rounded-xl px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-500/5 transition cursor-pointer"
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Expandable filters list */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden border-t border-slate-100 dark:border-slate-800/60 pt-4"
                            >
                                <div className="grid gap-4 sm:grid-cols-3">
                                    {/* Discount Type */}
                                    <div>
                                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Discount Type</label>
                                        <select
                                            value={selectedType}
                                            onChange={(e) => setSelectedType(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200/60 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none dark:border-slate-800 dark:bg-[#080b13] dark:text-slate-300"
                                        >
                                            <option value="">All Types</option>
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Price (₦)</option>
                                        </select>
                                    </div>

                                    {/* Audience Scope */}
                                    <div>
                                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Audience Scope</label>
                                        <select
                                            value={selectedScope}
                                            onChange={(e) => setSelectedScope(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200/60 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none dark:border-slate-800 dark:bg-[#080b13] dark:text-slate-300"
                                        >
                                            <option value="">All Scopes</option>
                                            <option value="global">Global Scopes</option>
                                            <option value="estate">Estates Restricted</option>
                                            <option value="resident">Residents Restricted</option>
                                        </select>
                                    </div>

                                    {/* Coupon Status */}
                                    <div>
                                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Coupon Status</label>
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200/60 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none dark:border-slate-800 dark:bg-[#080b13] dark:text-slate-300"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="active">Live & Active</option>
                                            <option value="paused">Paused</option>
                                            <option value="scheduled">Scheduled Future</option>
                                            <option value="expired">Expired</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* PREMIUM GRID NOTCHED TICKET LAYOUT */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {coupons.data.length === 0 ? (
                        <div className="col-span-full py-20 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1423]">
                            <Ticket className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-600 mb-3" />
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">No coupons match filters</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                                Adjust your search query, status settings or select another type parameter.
                            </p>
                            <button
                                onClick={clearFilters}
                                className="mt-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 text-xs font-bold text-indigo-500 hover:bg-indigo-100 transition cursor-pointer"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    ) : (
                        coupons.data.map((coupon) => {
                            const status = getStatusStyle(coupon);
                            const usagePercent = coupon.usage_limit 
                                ? Math.min(100, Math.round((coupon.used_count / coupon.usage_limit) * 100)) 
                                : 0;

                            return (
                                <motion.div
                                    key={coupon.id}
                                    layout
                                    className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-850 bg-white dark:bg-[#0f1423] p-6 shadow-sm hover:shadow-xl dark:hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all group"
                                >
                                    {/* Notch Cutout Left */}
                                    <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-slate-50 dark:bg-[#080b13] border-r border-slate-250 dark:border-slate-850 transform -translate-y-1/2 z-10" />
                                    {/* Notch Cutout Right */}
                                    <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-slate-50 dark:bg-[#080b13] border-l border-slate-250 dark:border-slate-850 transform -translate-y-1/2 z-10" />

                                    {/* Top Card Section */}
                                    <div>
                                        <div className="flex items-start justify-between mb-4">
                                            {/* Scope badge */}
                                            {coupon.estate ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 uppercase tracking-wider">
                                                    <Building2 className="h-3 w-3" /> Estate Restricted
                                                </span>
                                            ) : coupon.user ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-black text-purple-600 dark:text-purple-400 border border-purple-500/25 uppercase tracking-wider">
                                                    <User className="h-3 w-3" /> Resident Exclusive
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 uppercase tracking-wider">
                                                    <Globe className="h-3 w-3" /> Global Scope
                                                </span>
                                            )}

                                            {/* Status Badge */}
                                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${status.bg}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                                                {status.label}
                                            </span>
                                        </div>

                                        {/* Ticket Header (Code + Value) */}
                                        <div className="flex justify-between items-baseline mb-3">
                                            <span className="text-xl font-black font-mono tracking-widest text-slate-900 dark:text-white uppercase">
                                                {coupon.code}
                                            </span>
                                            <span className="text-lg font-black text-indigo-500">
                                                {coupon.formatted_value}
                                            </span>
                                        </div>

                                        {/* Coupon Info */}
                                        <div className="mb-4">
                                            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                                                {coupon.campaign_name || 'No Name Specified'}
                                            </h4>
                                            {coupon.description && (
                                                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">
                                                    {coupon.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ticket Perforation Divider Line */}
                                    <div className="border-t border-dashed border-slate-200 dark:border-slate-800 my-4 relative" />

                                    {/* Bottom Card Section */}
                                    <div>
                                        {/* Usage metrics / limit */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                                                <span>Usage Count</span>
                                                <span>
                                                    {coupon.used_count} / {coupon.usage_limit ? coupon.usage_limit : 'Unlimited'}
                                                </span>
                                            </div>
                                            {coupon.usage_limit ? (
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-indigo-500 rounded-full" 
                                                        style={{ width: `${usagePercent}%` }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-start overflow-hidden">
                                                    <div className="h-full w-1/4 bg-emerald-500 rounded-full animate-[pulse_1.5s_infinite]" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Metadata */}
                                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-5">
                                            {coupon.expires_at ? (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    Expires {coupon.expires_at}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-emerald-500">
                                                    <InfinityIcon className="h-3.5 w-3.5" />
                                                    Lifetime Lifespan
                                                </span>
                                            )}
                                            {coupon.estate && (
                                                <span className="truncate max-w-[120px]">{coupon.estate.name}</span>
                                            )}
                                            {coupon.user && (
                                                <span className="truncate max-w-[120px]">{coupon.user.name}</span>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/zeus/coupons/${coupon.id}`}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900 bg-white py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-500 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition"
                                            >
                                                <Eye className="h-3.5 w-3.5" /> Details
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteClick(e, coupon)}
                                                className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-400 hover:text-rose-500 hover:border-rose-500 dark:hover:border-rose-500/30 transition cursor-pointer"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>

                {/* Pagination component */}
                {coupons.last_page > 1 && (
                    <div className="mt-10 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-6">
                        <span className="text-xs font-semibold text-slate-500">
                            Page {coupons.current_page} of {coupons.last_page}
                        </span>
                        <div className="flex items-center gap-1">
                            {coupons.prev_page_url ? (
                                <Link
                                    href={coupons.prev_page_url}
                                    className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                                >
                                    Previous
                                </Link>
                            ) : (
                                <span className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-bold text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50">
                                    Previous
                                </span>
                            )}
                            {coupons.next_page_url ? (
                                <Link
                                    href={coupons.next_page_url}
                                    className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                                >
                                    Next
                                </Link>
                            ) : (
                                <span className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-bold text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50">
                                    Next
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Delete Dialog */}
            <ConfirmationModal
                title="Delete Platform Coupon?"
                message={`Are you sure you want to delete coupon code "${selectedCoupon?.code}"? Once deleted, residents will no longer be able to apply this discount to billing invoices.`}
                confirmLabel="Delete Coupon"
                onConfirm={handleDeleteConfirm}
                onClose={() => setDeleteModalOpen(false)}
                isOpen={deleteModalOpen}
            />
        </ZeusLayout>
    );
}
