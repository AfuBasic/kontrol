import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Eye, MessageSquare, Search, ThumbsUp, Plus, X, Grid, List, User, UserPlus, Activity, SlidersHorizontal } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

type AdminUser = {
    id: number;
    name: string;
};

type Incident = {
    id: number;
    ulid: string;
    hashid: string;
    title: string;
    body: string;
    category:
        | {
              value: string;
              label: string;
          }
        | string;
    priority:
        | {
              value: string;
              label: string;
          }
        | string;
    status:
        | {
              value: string;
              label: string;
          }
        | string;
    location: string | null;
    is_private: boolean;
    created_at: string;
    updated_at: string;
    acknowledged_at: string | null;
    resolving_at: string | null;
    solved_at: string | null;
    closed_at: string | null;
    upvotes_count: number;
    comments_count: number;
    attachment_url: string | null;
    attachment_type: string | null;
    reporter: {
        id: number;
        name: string;
        email: string;
    };
    reporter_role: string;
    source: string;
    assignee: {
        id: number;
        name: string;
    } | null;
    zone: {
        id: number;
        name: string;
    } | null;
};

type Props = {
    incidents:
        | {
              data: Incident[];
              links?: Array<{ url: string | null; label: string; active: boolean }>;
              current_page?: number;
              last_page?: number;
              total?: number;
          }
        | Incident[];
    filters: {
        category?: string;
        status?: string;
        search?: string;
        sort?: string;
        view?: 'board' | 'table';
        priority?: string;
        assignee_id?: string;
        sla_status?: string;
        source?: string;
    };
    categories: Array<{ value: string; label: string }>;
    statuses: Array<{ value: string; label: string }>;
    stats: {
        open: number;
        in_progress: number;
        waiting_review: number;
        resolved_this_month: number;
        avg_resolution_time: number;
        sla_compliance: number;
        source_breakdown?: Array<{
            source: string;
            label: string;
            count: number;
            percentage: number;
        }>;
    };
    insights: string[];
    admins: AdminUser[];
    recentActivity: Array<{
        id: number;
        description: string;
        causer_name: string;
        created_at: string;
    }>;
};

export default function IncidentsIndex({
    incidents: rawIncidents,
    filters: initialFilters,
    categories,
    statuses,
    stats,
    admins,
    recentActivity,
}: Props) {
    const filters = initialFilters && !Array.isArray(initialFilters) ? initialFilters : {};
    const viewMode = filters.view || 'board';

    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [status, setStatus] = useState(filters.status || '');
    const [priority, setPriority] = useState(filters.priority || '');
    const [assigneeId, setAssigneeId] = useState(filters.assignee_id || '');
    const [slaStatus, setSlaStatus] = useState(filters.sla_status || '');
    const [source, setSource] = useState(filters.source || '');
    const [sort, setSort] = useState(filters.sort || 'newest');

    // Assignee dropdown state per incident card/row
    const [activeAssigneeDropdown, setActiveAssigneeDropdown] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get flat incidents list
    const incidentsList = Array.isArray(rawIncidents) ? rawIncidents : rawIncidents.data || [];

    // Bulk selection state
    const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    const toggleIncidentSelection = (hashid: string) => {
        setSelectedIncidents((prev) =>
            prev.includes(hashid) ? prev.filter((id) => id !== hashid) : [...prev, hashid]
        );
    };

    const toggleAllIncidents = () => {
        if (selectedIncidents.length === incidentsList.length) {
            setSelectedIncidents([]);
        } else {
            setSelectedIncidents(incidentsList.map((i) => i.hashid));
        }
    };

    const handleBulkDelete = () => {
        if (confirm(`Are you sure you want to delete ${selectedIncidents.length} selected incident(s)?`)) {
            setIsDeleting(true);
            router.delete(route('admin.incidents.bulk_destroy'), {
                data: { ids: selectedIncidents },
                onSuccess: () => {
                    setSelectedIncidents([]);
                    setIsDeleting(false);
                },
                onError: () => setIsDeleting(false),
                preserveScroll: true
            });
        }
    };

    // Filter logic update
    const applyFilters = (newParams: Record<string, string | undefined>) => {
        const params: Record<string, string | undefined> = {
            view: viewMode,
            search: search || undefined,
            category: category || undefined,
            status: status || undefined,
            priority: priority || undefined,
            assignee_id: assigneeId || undefined,
            sla_status: slaStatus || undefined,
            source: source || undefined,
            sort: sort !== 'newest' ? sort : undefined,
            ...newParams,
        };

        // Clean parameters
        Object.keys(params).forEach((key) => {
            if (params[key] === undefined) delete params[key];
        });

        router.get('/admin/incidents', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveAssigneeDropdown(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleClearFilters = () => {
        setSearch('');
        setCategory('');
        setStatus('');
        setPriority('');
        setAssigneeId('');
        setSlaStatus('');
        setSource('');
        setSort('newest');
        router.get('/admin/incidents', { view: viewMode }, { preserveState: true, preserveScroll: true });
    };

    // Inline assignee update
    const handleAssign = (incidentId: number, incidentHash: string, adminId: number | null) => {
        router.put(
            `/admin/incidents/${incidentHash}/status`,
            {
                assigned_to: adminId,
                status: 'acknowledged', // auto acknowledge on assign if pending
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setActiveAssigneeDropdown(null);
                },
            },
        );
    };

    // Inline status transitions
    const handleStatusTransition = (incidentHash: string, nextStatus: string) => {
        router.put(
            `/admin/incidents/${incidentHash}/status`,
            {
                status: nextStatus,
            },
            { preserveScroll: true },
        );
    };

    // SLA helper calculations
    const getSlaStatus = (incident: Incident) => {
        const created = new Date(incident.created_at).getTime();
        const resolved = incident.solved_at
            ? new Date(incident.solved_at).getTime()
            : incident.closed_at
              ? new Date(incident.closed_at).getTime()
              : null;

        const nowTime = new Date().getTime();
        const durationLimit = 24 * 60 * 60 * 1000; // 24 hours in ms
        const warningLimit = 16 * 60 * 60 * 1000; // 16 hours in ms

        if (resolved) {
            const timeTaken = resolved - created;
            const breached = timeTaken > durationLimit;
            return {
                label: breached ? 'SLA Breached' : 'SLA Met',
                style: breached ? 'bg-red-50 text-red-700 border-red-200/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
                indicator: breached ? '🔴' : '🟢',
                breached,
            };
        }

        const elapsed = nowTime - created;
        if (elapsed > durationLimit) {
            return {
                label: 'SLA Breached',
                style: 'bg-rose-50 text-rose-700 border-rose-250 animate-pulse',
                indicator: '🔴',
                breached: true,
            };
        } else if (elapsed > warningLimit) {
            return {
                label: 'SLA Warning',
                style: 'bg-amber-50 text-amber-700 border-amber-250 animate-pulse',
                indicator: '🟠',
                breached: false,
            };
        } else {
            const remainingHours = Math.round((durationLimit - elapsed) / (1000 * 60 * 60));
            return {
                label: `${remainingHours}h remaining`,
                style: 'bg-slate-50 text-slate-700 border-slate-200',
                indicator: '🟢',
                breached: false,
            };
        }
    };

    // Get Priority styles
    const getPriorityStyles = (priorityVal: any) => {
        const value = typeof priorityVal === 'object' ? priorityVal.value : priorityVal;
        switch (value) {
            case 'critical':
                return { bg: 'bg-rose-600 text-white', text: 'Critical', colorClass: 'text-rose-600' };
            case 'high':
                return { bg: 'bg-orange-500 text-white', text: 'High', colorClass: 'text-orange-500' };
            case 'medium':
                return { bg: 'bg-blue-500 text-white', text: 'Medium', colorClass: 'text-blue-500' };
            default:
                return { bg: 'bg-slate-400 text-white', text: 'Low', colorClass: 'text-slate-400' };
        }
    };

    // Get Status styles
    const getStatusStyles = (statusVal: any) => {
        const value = typeof statusVal === 'object' ? statusVal.value : statusVal;
        switch (value) {
            case 'pending':
                return { label: 'Open', color: 'bg-amber-50 text-amber-700 border-amber-200/50' };
            case 'acknowledged':
                return { label: 'Assigned', color: 'bg-blue-50 text-blue-700 border-blue-200/50' };
            case 'resolving':
                return { label: 'In Progress', color: 'bg-indigo-50 text-indigo-700 border-indigo-200/50' };
            case 'solved':
                return { label: 'Waiting for Review', color: 'bg-emerald-50 text-emerald-700 border-emerald-200/50' };
            case 'closed':
                return { label: 'Closed', color: 'bg-slate-100 text-slate-600 border-slate-200' };
            default:
                return { label: 'Unknown', color: 'bg-slate-50 text-slate-500 border-slate-200' };
        }
    };

    // 1. Needs Attention Triage
    const needsAttentionIncidents = incidentsList.filter((incident) => {
        const priorityVal = typeof incident.priority === 'object' ? incident.priority.value : incident.priority;
        const statusVal = typeof incident.status === 'object' ? incident.status.value : incident.status;
        const isCritical = priorityVal === 'critical' || priorityVal === 'high';

        // SLA breach warning helper
        const created = new Date(incident.created_at).getTime();
        const isApproachingSla = !incident.solved_at && !incident.closed_at && new Date().getTime() - created > 16 * 60 * 60 * 1000;

        return (isCritical && statusVal === 'pending') || (statusVal === 'pending' && !incident.assignee) || isApproachingSla;
    });

    // 2. Kanban Board Columns Mapping
    const boardColumns = [
        { id: 'pending', title: 'Open', count: stats.open },
        {
            id: 'acknowledged',
            title: 'Assigned',
            count: incidentsList.filter((i) => (typeof i.status === 'object' ? i.status.value : i.status) === 'acknowledged').length,
        },
        { id: 'resolving', title: 'In Progress', count: stats.in_progress },
        { id: 'solved', title: 'Waiting for Resident', count: stats.waiting_review },
        {
            id: 'closed',
            title: 'Closed',
            count: incidentsList.filter((i) => (typeof i.status === 'object' ? i.status.value : i.status) === 'closed').length,
        },
    ];

    const hasActiveFilters = Boolean(search || category || status || priority || assigneeId || slaStatus);

    return (
        <>
            <Head title="Incident Management Workspace" />

            {/* Title & Quick Actions */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Incident Workspace</h1>
                    <p className="text-xs font-semibold text-slate-500">
                        Track estate operational health, resolve safety reports, and manage SLA deadlines.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Switcher */}
                    <div className="inline-flex rounded-xl bg-slate-100 p-1">
                        <button
                            onClick={() => applyFilters({ view: 'board' })}
                            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                viewMode === 'board' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Grid className="h-3.5 w-3.5" />
                            Board
                        </button>
                        <button
                            onClick={() => applyFilters({ view: 'table' })}
                            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                viewMode === 'table' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <List className="h-3.5 w-3.5" />
                            Table
                        </button>
                    </div>

                    <Link
                        href="/admin/incidents/create"
                        className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-xs font-black tracking-wide text-white uppercase shadow-sm transition hover:bg-slate-800 active:scale-95"
                    >
                        <Plus className="h-4 w-4" strokeWidth={3} />
                        Report Incident
                    </Link>
                </div>
            </div>

            <div className="space-y-6">
                {/* SECTION 1 - INCIDENT HEALTH STATS */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Open</span>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900">{stats.open}</span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">In Progress</span>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900">{stats.in_progress}</span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Awaiting Review</span>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900">{stats.waiting_review}</span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Resolved This Month</span>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900">{stats.resolved_this_month}</span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Avg. Resolution</span>
                        <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-slate-900">{stats.avg_resolution_time}</span>
                            <span className="text-xs font-bold text-slate-400">hours</span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">SLA Compliance</span>
                        <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-slate-900">{stats.sla_compliance}%</span>
                        </div>
                    </div>
                </div>

                {/* SECTION 1.5 - INCIDENT SOURCE BREAKDOWN */}
                {stats.source_breakdown && stats.source_breakdown.length > 0 && (
                    <div className="rounded-2xl border border-slate-100 bg-white p-4.5 shadow-xs ring-1 ring-slate-100/50">
                        <h3 className="mb-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            Operational Incident Origin (Sources)
                        </h3>
                        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                            {stats.source_breakdown.map((src, idx) => {
                                const colors = ['bg-indigo-600', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-rose-500'];
                                return (
                                    <div
                                        key={src.source}
                                        style={{ width: `${src.percentage}%` }}
                                        className={`${colors[idx % colors.length]} h-full`}
                                        title={`${src.label}: ${src.count} (${src.percentage}%)`}
                                    />
                                );
                            })}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-4 text-[10px] font-bold">
                            {stats.source_breakdown.map((src, idx) => {
                                const dotColors = ['bg-indigo-600', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-rose-500'];
                                return (
                                    <div key={src.source} className="flex items-center gap-1.5">
                                        <span className={`h-2.5 w-2.5 rounded-full ${dotColors[idx % dotColors.length]}`} />
                                        <span className="text-slate-600">{src.label}</span>
                                        <span className="font-extrabold text-slate-900">{src.percentage}%</span>
                                        <span className="font-normal text-slate-400">({src.count})</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* SECTION 2 - NEEDS ATTENTION */}
                {needsAttentionIncidents.length > 0 ? (
                    <div className="rounded-2xl border border-red-100 bg-linear-to-br from-red-50/40 to-orange-50/20 p-4.5 shadow-xs">
                        <div className="mb-3 flex items-center gap-2">
                            <AlertTriangle className="h-4.5 w-4.5 animate-bounce text-red-600" />
                            <h3 className="text-xs font-black tracking-wider text-red-900 uppercase">Needs Immediate Attention</h3>
                        </div>
                        <div className="space-y-2.5">
                            {needsAttentionIncidents.slice(0, 3).map((incident) => {
                                const priorityInfo = getPriorityStyles(incident.priority);
                                const slaInfo = getSlaStatus(incident);
                                return (
                                    <div
                                        key={incident.id}
                                        className="flex flex-col gap-2.5 rounded-xl border border-red-100/70 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="mt-1 text-sm">{slaInfo.indicator}</span>
                                            <div>
                                                <Link
                                                    href={`/admin/incidents/${incident.hashid}`}
                                                    className="text-xs font-black text-slate-900 hover:text-indigo-600"
                                                >
                                                    {incident.title}
                                                </Link>
                                                <div className="text-slate-455 mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold">
                                                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] uppercase ${priorityInfo.bg}`}>
                                                        {priorityInfo.text}
                                                    </span>
                                                    <span>•</span>
                                                    <span>Reported by {incident.reporter.name}</span>
                                                    <span>•</span>
                                                    <span>{formatDistanceToNow(new Date(incident.created_at))} ago</span>
                                                    {incident.location && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{incident.location}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                            <span className={`rounded-xl border px-2 py-1 text-[9px] font-black uppercase ${slaInfo.style}`}>
                                                {slaInfo.label}
                                            </span>

                                            {/* Quick Assign Action */}
                                            {!incident.assignee ? (
                                                <button
                                                    onClick={() => setActiveAssigneeDropdown(incident.id)}
                                                    className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-slate-800"
                                                >
                                                    <UserPlus className="h-3 w-3" />
                                                    Assign
                                                </button>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-500">Assigned to {incident.assignee.name}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-4.5 shadow-xs">
                        <div className="flex items-center gap-2.5">
                            <span className="text-base">🟢</span>
                            <div>
                                <h3 className="text-xs font-black tracking-wider text-emerald-900 uppercase">Excellent</h3>
                                <p className="text-[11px] font-semibold text-emerald-800/80">No incidents currently require immediate attention.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* DYNAMIC SEARCH & COMPACT FILTERS */}
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3.5">
                        <div className="flex flex-col gap-3 sm:flex-row">
                            {/* Search bar */}
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search incidents by title, reporter name, location..."
                                    className="w-full rounded-xl border-slate-200 py-3 pr-4 pl-11 text-xs font-semibold placeholder:text-slate-400 focus:border-slate-800 focus:ring-slate-800 focus:outline-hidden"
                                />
                            </div>

                            <button
                                type="submit"
                                className="rounded-xl bg-slate-900 px-6 py-3 text-xs font-black tracking-wider text-white uppercase transition hover:bg-slate-800"
                            >
                                Search
                            </button>
                        </div>

                        {/* Inline Dropdown Filters */}
                        <div className="flex flex-wrap items-center gap-2 border-t border-slate-50 pt-3">
                            <div className="mr-2 flex items-center gap-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                                <SlidersHorizontal className="h-3 w-3" />
                                Filters
                            </div>

                            {/* Status */}
                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    applyFilters({ status: e.target.value || undefined });
                                }}
                                className="text-slate-655 rounded-xl border-slate-200 bg-slate-50/50 px-3 py-1.5 text-[10px] font-bold focus:border-slate-800 focus:outline-hidden"
                            >
                                <option value="">All Statuses</option>
                                {statuses.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>

                            {/* Priority */}
                            <select
                                value={priority}
                                onChange={(e) => {
                                    setPriority(e.target.value);
                                    applyFilters({ priority: e.target.value || undefined });
                                }}
                                className="text-slate-655 rounded-xl border-slate-200 bg-slate-50/50 px-3 py-1.5 text-[10px] font-bold focus:border-slate-800 focus:outline-hidden"
                            >
                                <option value="">All Priorities</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>

                            {/* Category */}
                            <select
                                value={category}
                                onChange={(e) => {
                                    setCategory(e.target.value);
                                    applyFilters({ category: e.target.value || undefined });
                                }}
                                className="text-slate-655 rounded-xl border-slate-200 bg-slate-50/50 px-3 py-1.5 text-[10px] font-bold focus:border-slate-800 focus:outline-hidden"
                            >
                                <option value="">All Categories</option>
                                {categories.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>

                            {/* Assignee */}
                            <select
                                value={assigneeId}
                                onChange={(e) => {
                                    setAssigneeId(e.target.value);
                                    applyFilters({ assignee_id: e.target.value || undefined });
                                }}
                                className="text-slate-655 rounded-xl border-slate-200 bg-slate-50/50 px-3 py-1.5 text-[10px] font-bold focus:border-slate-800 focus:outline-hidden"
                            >
                                <option value="">All Assignees</option>
                                {admins.map((adm) => (
                                    <option key={adm.id} value={adm.id}>
                                        {adm.name}
                                    </option>
                                ))}
                            </select>

                            {/* SLA Status */}
                            <select
                                value={slaStatus}
                                onChange={(e) => {
                                    setSlaStatus(e.target.value);
                                    applyFilters({ sla_status: e.target.value || undefined });
                                }}
                                className="text-slate-655 rounded-xl border-slate-200 bg-slate-50/50 px-3 py-1.5 text-[10px] font-bold focus:border-slate-800 focus:outline-hidden"
                            >
                                <option value="">All SLA Statuses</option>
                                <option value="compliant">SLA Compliant</option>
                                <option value="warning">SLA Warning</option>
                                <option value="breached">SLA Breached</option>
                            </select>

                            {/* Source */}
                            <select
                                value={source}
                                onChange={(e) => {
                                    setSource(e.target.value);
                                    applyFilters({ source: e.target.value || undefined });
                                }}
                                className="text-slate-655 rounded-xl border-slate-200 bg-slate-50/50 px-3 py-1.5 text-[10px] font-bold focus:border-slate-800 focus:outline-hidden"
                            >
                                <option value="">All Sources</option>
                                <option value="resident_report">Resident Reports</option>
                                <option value="security_report">Security Reports</option>
                                <option value="estate_management">Estate Management</option>
                                <option value="system_generated">System Generated</option>
                                <option value="inspection">Inspection</option>
                            </select>

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="border-slate-150 ml-auto inline-flex items-center gap-1 rounded-xl border bg-slate-50 px-3 py-1.5 text-[10px] font-black text-slate-600 uppercase hover:bg-slate-100"
                                >
                                    <X className="h-3 w-3" />
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* BOARD OR TABLE VIEW */}
                {incidentsList.length > 0 ? (
                    viewMode === 'board' ? (
                        /* KANBAN BOARD VIEW */
                        <div className="grid min-w-[900px] grid-cols-1 gap-4 overflow-x-auto pb-4 sm:grid-cols-5">
                            {boardColumns.map((col) => {
                                const colIncidents = incidentsList.filter((incident) => {
                                    const statusVal = typeof incident.status === 'object' ? incident.status.value : incident.status;
                                    return statusVal === col.id;
                                });

                                return (
                                    <div key={col.id} className="flex min-h-[450px] flex-col rounded-2xl bg-slate-50/70 p-3">
                                        <div className="mb-3 flex items-center justify-between px-1">
                                            <h3 className="text-xs font-black tracking-wider text-slate-700 uppercase">{col.title}</h3>
                                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-black text-slate-600">
                                                {colIncidents.length}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-2.5">
                                            {colIncidents.map((incident) => {
                                                const priorityInfo = getPriorityStyles(incident.priority);
                                                const slaInfo = getSlaStatus(incident);

                                                return (
                                                    <motion.div
                                                        layout
                                                        key={incident.id}
                                                        className="group relative rounded-xl border border-slate-200/60 bg-white p-3.5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] transition-all hover:border-slate-300 hover:shadow-sm"
                                                    >
                                                        {/* Priority, SLA & Zone */}
                                                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                                                            <span
                                                                className={`rounded px-1.5 py-0.5 text-[8px] font-black tracking-wider uppercase ${priorityInfo.bg}`}
                                                            >
                                                                {priorityInfo.text}
                                                            </span>
                                                            <span className={`rounded-sm text-[8px] font-bold ${slaInfo.style} border-none`}>
                                                                {slaInfo.label}
                                                            </span>
                                                            {incident.zone ? (
                                                                <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[8px] font-black text-indigo-700 uppercase border border-indigo-100">
                                                                    {incident.zone.name}
                                                                </span>
                                                            ) : (
                                                                <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[8px] font-black text-slate-500 uppercase border border-slate-200/50">
                                                                    Entire Estate
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Title */}
                                                        <Link
                                                            href={`/admin/incidents/${incident.hashid}`}
                                                            className="block text-xs leading-snug font-bold text-slate-900 transition group-hover:text-indigo-600"
                                                        >
                                                            {incident.title}
                                                        </Link>

                                                        {/* Reporter & Location */}
                                                        <div className="mt-2 flex flex-col gap-0.5 text-[10px] font-bold text-slate-400">
                                                            <span>
                                                                By {incident.reporter.name}{' '}
                                                                <span className="text-[9px] font-normal text-slate-500">
                                                                    ({incident.reporter_role})
                                                                </span>
                                                            </span>
                                                            <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-500">
                                                                <span className="py-0.2 rounded bg-slate-100 px-1 text-[8px] font-black text-slate-500 uppercase">
                                                                    {incident.source.replace('_', ' ')}
                                                                </span>
                                                                {incident.location && <span>@ {incident.location}</span>}
                                                            </div>
                                                        </div>

                                                        {/* Engagement icons & Assignee */}
                                                        <div className="mt-3.5 flex items-center justify-between border-t border-slate-50 pt-2.5">
                                                            <div className="flex items-center gap-2 text-slate-400">
                                                                <div className="flex items-center gap-0.5">
                                                                    <MessageSquare className="h-3 w-3" />
                                                                    <span className="text-[9px] font-bold">{incident.comments_count}</span>
                                                                </div>
                                                                <div className="flex items-center gap-0.5">
                                                                    <ThumbsUp className="h-3 w-3" />
                                                                    <span className="text-[9px] font-bold">{incident.upvotes_count}</span>
                                                                </div>
                                                            </div>

                                                            {/* Assignee inline select */}
                                                            <div className="relative">
                                                                <button
                                                                    onClick={() =>
                                                                        setActiveAssigneeDropdown(
                                                                            activeAssigneeDropdown === incident.id ? null : incident.id,
                                                                        )
                                                                    }
                                                                    className="flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50/50 px-2 py-1 text-[9px] font-bold text-slate-600 hover:bg-slate-100"
                                                                >
                                                                    <User className="h-2.5 w-2.5" />
                                                                    <span className="max-w-[70px] truncate">
                                                                        {incident.assignee ? incident.assignee.name : 'Assign'}
                                                                    </span>
                                                                </button>

                                                                {/* Assignee Popover */}
                                                                <AnimatePresence>
                                                                    {activeAssigneeDropdown === incident.id && (
                                                                        <div
                                                                            ref={dropdownRef}
                                                                            className="border-slate-150 absolute right-0 bottom-full z-30 mb-1 w-44 rounded-xl border bg-white p-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden"
                                                                        >
                                                                            <p className="border-b border-slate-50 px-2 py-1.5 text-[9px] font-black tracking-wider text-slate-400 uppercase">
                                                                                Assign Guard/Staff
                                                                            </p>
                                                                            <div className="max-h-36 overflow-y-auto py-1">
                                                                                <button
                                                                                    onClick={() => handleAssign(incident.id, incident.hashid, null)}
                                                                                    className="w-full rounded-lg px-2 py-1 text-left text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                                                                >
                                                                                    Unassigned
                                                                                </button>
                                                                                {admins.map((adm) => (
                                                                                    <button
                                                                                        key={adm.id}
                                                                                        onClick={() =>
                                                                                            handleAssign(incident.id, incident.hashid, adm.id)
                                                                                        }
                                                                                        className="w-full rounded-lg px-2 py-1 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                                                                    >
                                                                                        {adm.name}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                            {colIncidents.length === 0 && (
                                                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-8 text-center">
                                                    <span className="text-[10px] font-bold text-slate-400">Column Empty</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* REDESIGNED SPREADSHEET TABLE VIEW */
                        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs ring-1 ring-slate-100/50">
                            <div className="min-h-[280px] overflow-x-auto">
                                <table className="w-full table-auto border-collapse">
                                    <thead className="border-b border-slate-100 bg-slate-50/70">
                                        <tr>
                                            <th className="px-6 py-3.5 w-10 text-left">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                                    checked={selectedIncidents.length > 0 && selectedIncidents.length === incidentsList.length}
                                                    onChange={toggleAllIncidents}
                                                />
                                            </th>
                                            <th className="text-slate-455 px-6 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                Incident
                                            </th>
                                            <th className="text-slate-455 px-6 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                Priority
                                            </th>
                                            <th className="text-slate-455 px-6 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                Category
                                            </th>
                                            <th className="text-slate-455 px-6 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                Reporter
                                            </th>
                                            <th className="text-slate-455 px-6 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                Source
                                            </th>
                                            <th className="text-slate-455 px-6 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                Location
                                            </th>
                                            <th className="text-slate-455 px-6 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                Assignee
                                            </th>
                                            <th className="text-slate-455 px-6 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                Status
                                            </th>
                                            <th className="text-slate-455 px-6 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                Scope/Zone
                                            </th>
                                            <th className="text-slate-455 px-6 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                                Age
                                            </th>
                                            <th className="w-10 px-6 py-3.5"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {incidentsList.map((incident) => {
                                            const priorityInfo = getPriorityStyles(incident.priority);
                                            const statusInfo = getStatusStyles(incident.status);
                                            const categoryLabel = typeof incident.category === 'object' ? incident.category.label : incident.category;

                                            return (
                                                <tr key={incident.id} className={`transition hover:bg-slate-50/40 ${selectedIncidents.includes(incident.hashid) ? 'bg-indigo-50/40' : ''}`}>
                                                    <td className="px-6 py-3.5 w-10">
                                                        <input 
                                                            type="checkbox" 
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                                            checked={selectedIncidents.includes(incident.hashid)}
                                                            onChange={() => toggleIncidentSelection(incident.hashid)}
                                                        />
                                                    </td>
                                                    {/* Incident title */}
                                                    <td className="px-6 py-3.5">
                                                        <Link
                                                            href={`/admin/incidents/${incident.hashid}`}
                                                            className="block max-w-[220px] truncate text-xs font-bold text-slate-900 hover:text-indigo-600"
                                                        >
                                                            {incident.title}
                                                        </Link>
                                                        <span className="mt-0.5 block max-w-[220px] truncate text-[10px] font-semibold text-slate-400">
                                                            {incident.body}
                                                        </span>
                                                    </td>

                                                    {/* Priority */}
                                                    <td className="px-6 py-3.5 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex rounded px-1.5 py-0.5 text-[8px] font-black tracking-wider uppercase ${priorityInfo.bg}`}
                                                        >
                                                            {priorityInfo.text}
                                                        </span>
                                                    </td>

                                                    {/* Category */}
                                                    <td className="px-6 py-3.5 text-xs font-semibold whitespace-nowrap text-slate-600">
                                                        {categoryLabel.replace('_', ' ')}
                                                    </td>

                                                    {/* Reporter */}
                                                    <td className="px-6 py-3.5 whitespace-nowrap">
                                                        <div className="text-xs font-semibold text-slate-800">
                                                            <span>{incident.reporter.name}</span>
                                                            <span className="block text-[9px] font-bold text-slate-400">
                                                                {incident.reporter_role}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Source */}
                                                    <td className="px-6 py-3.5 text-xs font-bold whitespace-nowrap text-slate-500">
                                                        <span className="rounded border border-slate-200/60 bg-slate-50 px-1.5 py-0.5 text-[9px] font-black text-slate-500 uppercase">
                                                            {incident.source.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    {/* Location */}
                                                    <td className="px-6 py-3.5 text-xs font-bold whitespace-nowrap text-slate-500">
                                                        {incident.location || '-'}
                                                    </td>

                                                    {/* Assignee */}
                                                    <td className="px-6 py-3.5 text-xs font-bold whitespace-nowrap text-slate-700">
                                                        {incident.assignee ? (
                                                            incident.assignee.name
                                                        ) : (
                                                            <span className="font-semibold text-slate-400 italic">Unassigned</span>
                                                        )}
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-6 py-3.5 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${statusInfo.color}`}
                                                        >
                                                            {statusInfo.label}
                                                        </span>
                                                    </td>

                                                    {/* Scope/Zone */}
                                                    <td className="px-6 py-3.5 whitespace-nowrap">
                                                        {incident.zone ? (
                                                            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-black text-indigo-700 uppercase border border-indigo-100">
                                                                {incident.zone.name}
                                                            </span>
                                                        ) : (
                                                            <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[9px] font-black text-slate-500 uppercase border border-slate-200/50">
                                                                Entire Estate
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Age */}
                                                    <td className="px-6 py-3.5 text-xs font-bold whitespace-nowrap text-slate-500">
                                                        {formatDistanceToNow(new Date(incident.created_at))}
                                                    </td>

                                                    {/* Quick View Link */}
                                                    <td className="px-6 py-3.5 text-right text-sm whitespace-nowrap">
                                                        <Link
                                                            href={`/admin/incidents/${incident.hashid}`}
                                                            className="text-slate-400 hover:text-slate-800"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                ) : (
                    /* REDESIGNED EMPTY STATE */
                    <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-xs">
                        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                        <h3 className="text-sm font-black tracking-wider text-slate-900 uppercase">No active incidents</h3>
                        <p className="mx-auto mt-1 max-w-xs text-xs font-semibold text-slate-400">
                            Your estate currently has no active community incidents recorded. Residents can report maintenance requests, plumbing
                            issues, or security concerns directly.
                        </p>
                        <Link
                            href="/admin/incidents/create"
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4.5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800"
                        >
                            <Plus className="h-4 w-4" />
                            Report Incident
                        </Link>
                    </div>
                )}

                {/* PAGINATION */}
                {!Array.isArray(rawIncidents) && rawIncidents.last_page && rawIncidents.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-5 pb-8">
                        <p className="text-slate-505 text-xs font-bold">
                            Showing <span className="text-slate-950">{rawIncidents.data.length}</span> of{' '}
                            <span className="text-slate-950">{rawIncidents.total}</span> reported incidents
                        </p>
                        <div className="flex gap-1.5">
                            {rawIncidents.links?.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveScroll
                                    preserveState
                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                        link.active
                                            ? 'bg-slate-950 text-white shadow-sm'
                                            : link.url
                                              ? 'text-slate-655 border-slate-205 border bg-white hover:bg-slate-50'
                                              : 'cursor-not-allowed border border-slate-100 text-slate-300 opacity-50'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Bulk Actions Bar */}
            <AnimatePresence>
                {selectedIncidents.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-full bg-slate-900 px-6 py-3 shadow-2xl ring-1 ring-white/10"
                    >
                        <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">
                                {selectedIncidents.length}
                            </span>
                            <span className="text-sm font-semibold text-white">selected</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleBulkDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-4 py-1.5 text-sm font-bold text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
                            >
                                <X className="h-4 w-4" />
                                {isDeleting ? 'Deleting...' : 'Delete Selected'}
                            </button>
                            <button
                                onClick={() => setSelectedIncidents([])}
                                className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
