import { 
    MegaphoneIcon, 
    PlusIcon, 
    TrashIcon, 
    MagnifyingGlassIcon, 
    XMarkIcon,
    ChartBarIcon,
    CalendarIcon,
    ClockIcon,
    ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import { index, create, destroy, show } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/AnnouncementController';
import { useDebounce } from '@/Hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';

interface Announcement {
    id: number;
    hashid: string;
    title: string;
    body: string;
    status: string;
    category: string;
    priority: string;
    applies_to: string;
    targets_count: number;
    reads_count: number;
    created_at: string;
}

interface Props {
    announcements: {
        data: Announcement[];
        total: number;
        per_page: number;
        current_page: number;
        links: any[];
    };
    metrics: {
        total: number;
        this_month: number;
        last_broadcast: string | null;
    };
    filters: {
        search: string;
        category: string;
        priority: string;
    };
}

const CATEGORY_COLORS: Record<string, string> = {
    general: 'bg-slate-100 text-slate-700 ring-slate-200',
    meeting: 'bg-blue-100 text-blue-700 ring-blue-200',
    maintenance: 'bg-orange-100 text-orange-700 ring-orange-200',
    security: 'bg-rose-100 text-rose-700 ring-rose-200',
    event: 'bg-purple-100 text-purple-700 ring-purple-200',
};

const PRIORITY_STYLES: Record<string, { badge: string, border: string }> = {
    normal: { badge: 'bg-slate-100 text-slate-600', border: 'ring-slate-100' },
    important: { badge: 'bg-amber-100 text-amber-700', border: 'ring-amber-200' },
    critical: { badge: 'bg-rose-100 text-rose-700 animate-pulse', border: 'ring-rose-300 shadow-rose-100' },
};

export default function Index({ announcements, metrics, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const debouncedSearch = useDebounce(search, 300);

    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            router.get(index.url(), { search: debouncedSearch, category: filters.category, priority: filters.priority }, { preserveState: true, preserveScroll: true, replace: true });
        }
    }, [debouncedSearch, filters.category, filters.priority]);

    const setFilter = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value === filters[key as keyof typeof filters] ? '' : value };
        router.get(index.url(), newFilters, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = useCallback(() => {
        setSearch('');
        router.get(index.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    }, []);

    const deleteAnnouncement = (hashid: string) => {
        if (confirm('Are you sure you want to delete this broadcast? This will remove it from target feeds.')) {
            router.delete(destroy.url(hashid as any));
        }
    };

    const hasActiveFilters = Boolean(search || filters.category || filters.priority);
    const hasAnnouncements = announcements && announcements.data && announcements.data.length > 0;

    return (
        <div className="space-y-8 pb-32 max-w-7xl mx-auto">
            <Head title="Communication Center" />

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Communication Center</h1>
                    <p className="mt-1.5 text-sm font-medium text-slate-500">Manage broadcasts, alerts, and instructions for your occupants.</p>
                </div>
                <Link
                    href={create.url()}
                    className="shadow-indigo-650/20 inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-700 hover:shadow-indigo-600/30 active:scale-95"
                >
                    <PlusIcon className="h-5 w-5" />
                    New Broadcast
                </Link>
            </div>

            {/* Communication Summary Hero */}
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-8 sm:p-10 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent"></div>
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
                
                <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-indigo-200">
                            <ChartBarIcon className="h-5 w-5 opacity-70" />
                            <span className="text-xs font-bold uppercase tracking-wider">Total Broadcasts</span>
                        </div>
                        <span className="text-4xl font-black text-white">{metrics.total}</span>
                    </div>
                    <div className="flex flex-col gap-2 sm:pl-8 pt-6 sm:pt-0">
                        <div className="flex items-center gap-2 text-indigo-200">
                            <CalendarIcon className="h-5 w-5 opacity-70" />
                            <span className="text-xs font-bold uppercase tracking-wider">This Month</span>
                        </div>
                        <span className="text-4xl font-black text-white">{metrics.this_month}</span>
                    </div>
                    <div className="flex flex-col gap-2 sm:pl-8 pt-6 sm:pt-0">
                        <div className="flex items-center gap-2 text-indigo-200">
                            <ClockIcon className="h-5 w-5 opacity-70" />
                            <span className="text-xs font-bold uppercase tracking-wider">Latest Update</span>
                        </div>
                        <span className="text-xl mt-2 font-black text-white">{metrics.last_broadcast || 'Never'}</span>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 max-w-md relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full rounded-2xl border-0 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:leading-6 transition-all"
                            placeholder="Search broadcasts..."
                        />
                    </div>
                    
                    <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                        <button
                            onClick={() => setFilter('priority', 'important')}
                            className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold transition-all whitespace-nowrap ${
                                filters.priority === 'important' 
                                ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300' 
                                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            Important
                        </button>
                        <button
                            onClick={() => setFilter('category', 'meeting')}
                            className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold transition-all whitespace-nowrap ${
                                filters.category === 'meeting' 
                                ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300' 
                                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            Meetings
                        </button>
                        <button
                            onClick={() => setFilter('category', 'security')}
                            className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold transition-all whitespace-nowrap ${
                                filters.category === 'security' 
                                ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-300' 
                                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            Security
                        </button>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200"
                            >
                                <XMarkIcon className="h-4 w-4" />
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Broadcast Feed */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                    {hasAnnouncements ? (
                        announcements.data.map((ann) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                key={ann.id}
                                className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 transition-all hover:shadow-xl hover:-translate-y-1 ${PRIORITY_STYLES[ann.priority || 'normal']?.border || 'ring-slate-200'}`}
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {ann.category && (
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${CATEGORY_COLORS[ann.category] || CATEGORY_COLORS.general}`}>
                                                    {ann.category}
                                                </span>
                                            )}
                                            {ann.priority && ann.priority !== 'normal' && (
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${PRIORITY_STYLES[ann.priority].badge}`}>
                                                    {ann.priority}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => { e.preventDefault(); deleteAnnouncement(ann.hashid); }}
                                            className="rounded-full p-2 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 focus:opacity-100 z-10"
                                            title="Delete Broadcast"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="mt-5">
                                        <Link href={show.url(ann.hashid as any)} className="absolute inset-0 z-0" />
                                        <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                                            {ann.title}
                                        </h3>
                                        <p className="mt-3 line-clamp-3 text-sm font-medium text-slate-500 leading-relaxed">
                                            {ann.body}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audience</span>
                                        <span className="text-xs font-bold text-slate-700">
                                            {ann.applies_to === 'all' ? 'All Residents' : `${ann.targets_count} Targets`}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{ann.created_at}</span>
                                        <div className="flex items-center gap-1 text-slate-500">
                                            <ChatBubbleLeftEllipsisIcon className="h-3.5 w-3.5" />
                                            <span className="text-xs font-bold">{ann.reads_count} Reads</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className="col-span-full flex flex-col items-center justify-center rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 py-24 px-6 text-center"
                        >
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
                                <MegaphoneIcon className="h-10 w-10 text-indigo-500" />
                            </div>
                            <h3 className="mt-6 text-xl font-black text-slate-900">No broadcasts yet</h3>
                            <p className="mt-2 max-w-md text-sm font-medium text-slate-500 leading-relaxed">
                                Keep residents informed by sending updates about meetings, maintenance, security notices, and community events.
                            </p>
                            <Link
                                href={create.url()}
                                className="mt-8 shadow-indigo-600/20 inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <PlusIcon className="h-5 w-5" />
                                Create First Broadcast
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Pagination */}
            {announcements.total > announcements.per_page && (
                <div className="mt-12 flex flex-col items-center justify-center gap-6">
                    <div className="flex w-full items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500">
                            Showing <span className="font-bold text-slate-900">{announcements.data.length}</span> entries of{' '}
                            <span className="font-bold text-slate-900">{announcements.total}</span>
                        </p>
                        <div className="flex items-center gap-1.5">
                            {announcements.links.map((link: any, i: number) => {
                                if (link.url === null) return null;
                                return (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                                            link.active
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                                : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300'
                                        }`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
