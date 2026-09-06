import { Head, router } from '@inertiajs/react';
import {
    MessageSquare,
    Search,
    ThumbsUp,
    Sparkles,
    Lightbulb,
    AlertTriangle,
    Clock,
    User,
    Building2,
    Smartphone,
    Monitor,
    ShieldAlert,
    CheckCircle2,
    Eye,
    Archive,
} from 'lucide-react';
import { useState } from 'react';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface FeedbackItem {
    id: number;
    ulid: string;
    category: 'praise' | 'improvement' | 'idea' | 'problem';
    message: string;
    status: 'new' | 'reviewing' | 'noted' | 'archived';
    source: string | null;
    platform: string | null;
    app_version: string | null;
    route_or_screen: string | null;
    role_context: string | null;
    support_mode: boolean;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
    estate: {
        id: number;
        name: string;
    } | null;
    impersonator: {
        id: number;
        name: string;
    } | null;
    created_at: string;
    created_at_human: string;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
    from: number | null;
    to: number | null;
}

interface Props {
    feedbacks: PaginatedData<FeedbackItem>;
    filters: {
        status: string;
        category: string;
        search: string;
    };
    counts: {
        all: number;
        new: number;
        reviewing: number;
        noted: number;
        archived: number;
    };
}

export default function FeedbackIndex({ feedbacks, filters, counts }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || 'all');
    const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);

    const applyFilters = (newStatus?: string, newCategory?: string, newSearch?: string) => {
        router.get(
            '/zeus/feedback',
            {
                status: newStatus !== undefined ? newStatus : statusFilter,
                category: newCategory !== undefined ? newCategory : categoryFilter,
                search: newSearch !== undefined ? newSearch : search,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(undefined, undefined, search);
    };

    const handleUpdateStatus = (id: number, status: 'new' | 'reviewing' | 'noted' | 'archived') => {
        router.patch(
            `/zeus/feedback/${id}/status`,
            { status },
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (selectedItem && selectedItem.id === id) {
                        setSelectedItem({ ...selectedItem, status });
                    }
                },
            },
        );
    };

    const categoryBadge = (category: FeedbackItem['category']) => {
        switch (category) {
            case 'praise':
                return {
                    label: 'Praise',
                    icon: ThumbsUp,
                    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                };
            case 'improvement':
                return {
                    label: 'Improvement',
                    icon: Sparkles,
                    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                };
            case 'idea':
                return {
                    label: 'Idea',
                    icon: Lightbulb,
                    className: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
                };
            case 'problem':
                return {
                    label: 'Problem',
                    icon: AlertTriangle,
                    className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
                };
        }
    };

    const statusBadge = (status: FeedbackItem['status']) => {
        switch (status) {
            case 'new':
                return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
            case 'reviewing':
                return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'noted':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'archived':
                return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return (
        <ZeusLayout>
            <Head title="User Feedback Inbox - Zeus" />

            <div className="space-y-6 p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                <MessageSquare className="h-4 w-4" />
                            </span>
                            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                                User Feedback Inbox
                            </h1>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                            Central triage for feedback, product suggestions, and issues reported by residents and estate admins.
                        </p>
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-3">
                    {[
                        { id: 'all', label: 'All Feedback', count: counts.all },
                        { id: 'new', label: 'New', count: counts.new },
                        { id: 'reviewing', label: 'Under Review', count: counts.reviewing },
                        { id: 'noted', label: 'Noted', count: counts.noted },
                        { id: 'archived', label: 'Archived', count: counts.archived },
                    ].map((tab) => {
                        const isActive = statusFilter === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                    setStatusFilter(tab.id);
                                    applyFilters(tab.id, undefined, undefined);
                                }}
                                className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                    isActive
                                        ? 'bg-white/10 text-white shadow-xs'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Filter & Search Bar */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                    <form onSubmit={handleSearchSubmit} className="relative sm:col-span-8 lg:col-span-9">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search feedback text, user name, email, or estate..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-4 pl-10 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                    </form>

                    <div className="sm:col-span-4 lg:col-span-3">
                        <select
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                applyFilters(undefined, e.target.value, undefined);
                            }}
                            className="w-full rounded-xl border border-white/10 bg-[#12141C] py-2.5 px-3 text-xs text-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        >
                            <option value="all">All Categories</option>
                            <option value="praise">Praise</option>
                            <option value="improvement">Improvement</option>
                            <option value="idea">Idea</option>
                            <option value="problem">Problem</option>
                        </select>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Feedback Items Table/List */}
                    <div className={`${selectedItem ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3`}>
                        {feedbacks.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
                                <MessageSquare className="h-8 w-8 text-slate-600" />
                                <h3 className="mt-3 text-sm font-semibold text-white">No feedback records found</h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    No submissions match the current filter or search criteria.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0D0E15]">
                                <div className="divide-y divide-white/5">
                                    {feedbacks.data.map((fb) => {
                                        const badge = categoryBadge(fb.category);
                                        const CategoryIcon = badge.icon;
                                        const isSelected = selectedItem?.id === fb.id;

                                        return (
                                            <div
                                                key={fb.id}
                                                onClick={() => setSelectedItem(fb)}
                                                className={`group cursor-pointer p-4 transition-colors ${
                                                    isSelected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
                                                        >
                                                            <CategoryIcon className="h-3 w-3" />
                                                            {badge.label}
                                                        </span>
                                                        <span
                                                            className={`rounded-md border px-2 py-0.5 text-[10px] font-medium capitalize ${statusBadge(
                                                                fb.status,
                                                            )}`}
                                                        >
                                                            {fb.status}
                                                        </span>
                                                        {fb.support_mode && (
                                                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                                                                <ShieldAlert className="h-2.5 w-2.5" />
                                                                Support Mode
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                                        <Clock className="h-3 w-3" />
                                                        {fb.created_at_human}
                                                    </div>
                                                </div>

                                                <p className="mt-2.5 text-xs text-slate-200 leading-relaxed line-clamp-2">
                                                    {fb.message}
                                                </p>

                                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400">
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-3 w-3 text-slate-500" />
                                                        <span>{fb.user ? fb.user.name : 'Unknown User'}</span>
                                                    </div>
                                                    {fb.estate && (
                                                        <div className="flex items-center gap-1">
                                                            <Building2 className="h-3 w-3 text-slate-500" />
                                                            <span>{fb.estate.name}</span>
                                                        </div>
                                                    )}
                                                    {fb.platform && (
                                                        <div className="flex items-center gap-1 capitalize">
                                                            {fb.platform === 'web' ? (
                                                                <Monitor className="h-3 w-3 text-slate-500" />
                                                            ) : (
                                                                <Smartphone className="h-3 w-3 text-slate-500" />
                                                            )}
                                                            <span>{fb.platform}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Pagination */}
                        {feedbacks.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-400">
                                <div>
                                    Showing <span className="font-semibold text-white">{feedbacks.from}</span> to{' '}
                                    <span className="font-semibold text-white">{feedbacks.to}</span> of{' '}
                                    <span className="font-semibold text-white">{feedbacks.total}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {feedbacks.prev_page_url && (
                                        <button
                                            onClick={() => router.get(feedbacks.prev_page_url!)}
                                            className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/5 text-white"
                                        >
                                            Previous
                                        </button>
                                    )}
                                    {feedbacks.next_page_url && (
                                        <button
                                            onClick={() => router.get(feedbacks.next_page_url!)}
                                            className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/5 text-white"
                                        >
                                            Next
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Detail Sidebar / Progressive Disclosure */}
                    {selectedItem && (
                        <div className="space-y-4 lg:col-span-5">
                            <div className="rounded-2xl border border-white/10 bg-[#0D0E15] p-5">
                                <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Feedback Details</h3>
                                        <span className="text-[11px] font-mono text-slate-500">
                                            ULID: {selectedItem.ulid}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setSelectedItem(null)}
                                        className="text-xs text-slate-400 hover:text-white"
                                    >
                                        Close
                                    </button>
                                </div>

                                <div className="mt-4 space-y-4">
                                    {/* Status Triage Controls */}
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                            Update Status
                                        </label>
                                        <div className="mt-2 grid grid-cols-4 gap-1.5">
                                            {[
                                                { id: 'new', label: 'New', icon: Clock },
                                                { id: 'reviewing', label: 'Review', icon: Eye },
                                                { id: 'noted', label: 'Noted', icon: CheckCircle2 },
                                                { id: 'archived', label: 'Archive', icon: Archive },
                                            ].map((st) => {
                                                const Icon = st.icon;
                                                const isCurrent = selectedItem.status === st.id;
                                                return (
                                                    <button
                                                        key={st.id}
                                                        type="button"
                                                        onClick={() =>
                                                            handleUpdateStatus(
                                                                selectedItem.id,
                                                                st.id as 'new' | 'reviewing' | 'noted' | 'archived',
                                                            )
                                                        }
                                                        className={`flex flex-col items-center gap-1 rounded-xl p-2 text-[11px] font-semibold transition ${
                                                            isCurrent
                                                                ? 'bg-indigo-600 text-white shadow-xs'
                                                                : 'border border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/5 hover:text-white'
                                                        }`}
                                                    >
                                                        <Icon className="h-3.5 w-3.5" />
                                                        <span>{st.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Feedback Message */}
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                            User Statement
                                        </label>
                                        <div className="mt-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 text-xs leading-relaxed text-slate-200">
                                            {selectedItem.message}
                                        </div>
                                    </div>

                                    {/* Author & Estate Context */}
                                    <div className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Submitter:</span>
                                            <span className="font-medium text-white">
                                                {selectedItem.user
                                                    ? `${selectedItem.user.name} (${selectedItem.user.email})`
                                                    : 'Unknown'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Estate Context:</span>
                                            <span className="font-medium text-white">
                                                {selectedItem.estate?.name || 'Global / None'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Effective Role:</span>
                                            <span className="font-medium capitalize text-white">
                                                {selectedItem.role_context || 'resident'}
                                            </span>
                                        </div>
                                        {selectedItem.support_mode && (
                                            <div className="flex items-center justify-between border-t border-amber-500/20 pt-2 text-amber-400">
                                                <span>Impersonated by:</span>
                                                <span className="font-medium">
                                                    {selectedItem.impersonator?.name || 'Zeus Admin'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Technical Context */}
                                    <div className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Platform / Env:</span>
                                            <span className="font-mono text-white capitalize">
                                                {selectedItem.platform || 'web'}
                                            </span>
                                        </div>
                                        {selectedItem.app_version && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">App Version:</span>
                                                <span className="font-mono text-white">
                                                    v{selectedItem.app_version}
                                                </span>
                                            </div>
                                        )}
                                        {selectedItem.route_or_screen && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">Source Route:</span>
                                                <span className="font-mono text-white">
                                                    {selectedItem.route_or_screen}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Submitted:</span>
                                            <span className="text-slate-300">
                                                {new Date(selectedItem.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ZeusLayout>
    );
}
