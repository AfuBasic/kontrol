import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import ZeusLayout from '@/Layouts/ZeusLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    Plus, 
    Building2, 
    Users, 
    Home, 
    Activity, 
    X, 
    TrendingUp, 
    MapPin,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { index, toggleStatus, destroy, resetPassword } from '@/actions/App/Http/Controllers/Zeus/EstateController';

type EstateExplorerData = {
    id: number;
    ulid: string;
    name: string;
    address: string;
    status: 'active' | 'inactive';
    billing_mode: string;
    total_residents: number;
    total_properties: number;
    health_score: number;
    mrr: number;
    created_at: string;
};

type Props = {
    estates: EstateExplorerData[];
    filters: {
        search: string;
        status: string;
    };
};

export default function EstateExplorer({ estates, filters }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [selectedEstate, setSelectedEstate] = useState<EstateExplorerData | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            index.url(),
            { search: searchQuery, status: statusFilter },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleToggleStatus = (estateId: number, currentStatus: string) => {
        if (confirm(`Are you sure you want to ${currentStatus === 'active' ? 'deactivate' : 'activate'} this estate?`)) {
            router.post(toggleStatus.url({ estate: estateId }), {}, { preserveScroll: true });
        }
    };

    const handleDelete = (estateId: number, name: string) => {
        if (confirm(`Are you sure you want to completely delete "${name}"? This action cannot be undone.`)) {
            router.delete(destroy.url({ estate: estateId }), { preserveScroll: true });
        }
    };

    const handleResetPassword = (estateId: number) => {
        if (confirm("Are you sure you want to reset the admin password for this estate?")) {
            router.post(resetPassword.url({ estate: estateId }), {}, { preserveScroll: true });
        }
    };

    const getHealthColor = (score: number) => {
        if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-rose-600 bg-rose-50 border-rose-200';
    };

    const getHealthProgressColor = (score: number) => {
        if (score >= 90) return 'stroke-emerald-500';
        if (score >= 70) return 'stroke-amber-500';
        return 'stroke-rose-500';
    };

    return (
        <ZeusLayout>
            <Head title="Estate Explorer" />

            {/* Header & Actions */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Estate Explorer</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Deep behavioral profiling and health monitoring across all estates.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/zeus/estates/create"
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        Add Estate
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <form onSubmit={handleSearch} className="flex flex-1 items-center gap-3">
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-xl border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <button
                        type="submit"
                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800"
                    >
                        Filter
                    </button>
                </form>
            </div>

            {/* Estate Card Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {estates.length === 0 ? (
                    <div className="col-span-full py-12 text-center">
                        <Building2 className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-4 text-lg font-black text-slate-900">No estates found</h3>
                        <p className="mt-1 text-sm text-slate-500">Adjust your search or add a new estate to get started.</p>
                    </div>
                ) : (
                    estates.map((estate) => (
                        <motion.div
                            layoutId={`estate-${estate.id}`}
                            key={estate.id}
                            onClick={() => setSelectedEstate(estate)}
                            className="group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5"
                        >
                            <div className="p-6">
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                        <Building2 className="h-6 w-6" />
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                                            estate.status === 'active'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        {estate.status === 'active' ? (
                                            <CheckCircle2 className="h-3 w-3" />
                                        ) : (
                                            <AlertCircle className="h-3 w-3" />
                                        )}
                                        {estate.status}
                                    </span>
                                </div>

                                <h3 className="text-lg font-black text-slate-900 line-clamp-1">{estate.name}</h3>
                                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500 line-clamp-1">
                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                    {estate.address}
                                </p>

                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <div className="rounded-2xl bg-slate-50 p-3">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Users className="h-4 w-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Residents</span>
                                        </div>
                                        <p className="mt-1.5 text-lg font-black text-slate-900">{estate.total_residents}</p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-3">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Home className="h-4 w-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Properties</span>
                                        </div>
                                        <p className="mt-1.5 text-lg font-black text-slate-900">{estate.total_properties}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    {/* Circular Progress for Health Score */}
                                    <div className="relative h-10 w-10">
                                        <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                                            <path
                                                className="stroke-slate-200"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                strokeWidth="3"
                                            />
                                            <path
                                                className={getHealthProgressColor(estate.health_score)}
                                                strokeDasharray={`${estate.health_score}, 100`}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-xs font-black text-slate-700">{estate.health_score}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-600">Health Score</span>
                                </div>
                                <Activity className="h-5 w-5 text-slate-400 transition-colors group-hover:text-indigo-600" />
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Estate Insights Modal (Slide-over) */}
            <AnimatePresence>
                {selectedEstate && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedEstate(null)}
                            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
                        />

                        {/* Slide-over Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                            className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white shadow-2xl"
                        >
                            <div className="flex flex-col h-full">
                                {/* Panel Header */}
                                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur-md">
                                    <h2 className="text-lg font-black text-slate-900">Estate Insights</h2>
                                    <button
                                        onClick={() => setSelectedEstate(null)}
                                        className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 active:scale-95"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Panel Content */}
                                <div className="flex-1 p-6">
                                    <div className="mb-8">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 shadow-inner">
                                            <Building2 className="h-8 w-8" />
                                        </div>
                                        <h1 className="mt-4 text-2xl font-black text-slate-900">{selectedEstate.name}</h1>
                                        <p className="mt-1 text-sm font-medium text-slate-500">{selectedEstate.address}</p>
                                    </div>

                                    {/* Main Stats */}
                                    <div className="mb-8 grid grid-cols-2 gap-4">
                                        <div className={`rounded-3xl border p-5 ${getHealthColor(selectedEstate.health_score)}`}>
                                            <div className="flex items-center justify-between">
                                                <Activity className="h-5 w-5 opacity-75" />
                                                <span className="text-2xl font-black">{selectedEstate.health_score}</span>
                                            </div>
                                            <p className="mt-2 text-xs font-bold uppercase tracking-wider opacity-75">Health Score</p>
                                        </div>
                                        <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5 text-indigo-600">
                                            <div className="flex items-center justify-between">
                                                <TrendingUp className="h-5 w-5 opacity-75" />
                                                <span className="text-xl font-black">
                                                    ₦{(selectedEstate.mrr).toLocaleString('en-NG')}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-xs font-bold uppercase tracking-wider opacity-75">Est. MRR</p>
                                        </div>
                                    </div>

                                    {/* Additional Metrics (Placeholder for trendlines/charts) */}
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="mb-3 text-sm font-black text-slate-900 uppercase tracking-widest">Demographics</h3>
                                            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                                                <div className="flex justify-between border-b border-slate-200 pb-3">
                                                    <span className="text-sm font-medium text-slate-600">Total Residents</span>
                                                    <span className="text-sm font-black text-slate-900">{selectedEstate.total_residents}</span>
                                                </div>
                                                <div className="flex justify-between pt-3">
                                                    <span className="text-sm font-medium text-slate-600">Total Properties</span>
                                                    <span className="text-sm font-black text-slate-900">{selectedEstate.total_properties}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="mb-3 text-sm font-black text-slate-900 uppercase tracking-widest">Actions</h3>
                                            <div className="flex flex-col gap-3">
                                                <Link
                                                    href={`/zeus/estates/${selectedEstate.id}`}
                                                    className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-[0.98]"
                                                >
                                                    View Full Details
                                                </Link>
                                                <Link
                                                    href={`/zeus/estates/${selectedEstate.id}/edit`}
                                                    className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
                                                >
                                                    Edit Settings
                                                </Link>
                                                <div className="mt-4 grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => {
                                                            handleToggleStatus(selectedEstate.id, selectedEstate.status);
                                                            setSelectedEstate(null);
                                                        }}
                                                        className="rounded-2xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                                                    >
                                                        Toggle Status
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleResetPassword(selectedEstate.id);
                                                            setSelectedEstate(null);
                                                        }}
                                                        className="rounded-2xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                                                    >
                                                        Reset Password
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        handleDelete(selectedEstate.id, selectedEstate.name);
                                                        setSelectedEstate(null);
                                                    }}
                                                    className="mt-2 w-full rounded-2xl bg-rose-50 py-3 text-sm font-bold text-rose-600 transition-all hover:bg-rose-100 active:scale-[0.98]"
                                                >
                                                    Delete Estate
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </ZeusLayout>
    );
}
