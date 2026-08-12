import { MagnifyingGlassIcon, PlusIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Trash2,
    Loader2,
    Check,
    Users,
    Percent,
    ShieldCheck,
    UserMinus,
    Send,
    Copy,
    AlertCircle,
    Calendar,
    Pencil,
    Clock,
    X,
    LinkIcon,
    Home,
    Building,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { index as approvalsIndex } from '@/actions/App/Http/Controllers/Admin/ResidentApprovalController';
import { bulkDelete, index, markAsPropertyOwner } from '@/actions/App/Http/Controllers/Admin/ResidentController';
import { useDebounce } from '@/Hooks/useDebounce';
import { usePermission } from '@/Hooks/usePermission';
import AdminLayout from '@/Layouts/AdminLayout';

type Resident = {
    id: number;
    ulid: string;
    name: string;
    email: string;
    phone: string | null;
    unit_number: string | null;
    zone_id?: number | null;
    zone_name?: string | null;
    property_owner_id: number | null;
    property_owner_name: string | null;
    property_id: number | null;
    property_name: string | null;
    status: 'pending' | 'active' | 'inactive';
    is_property_owner: boolean;
    role_label: string;
    household_members_count: number;
    suspended_at: string | null;
    email_verified_at: string | null;
    last_active: string;
    created_at: string;
    is_estate_creator: boolean;
};

type PaginatedResidents = {
    data: Resident[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    residents: PaginatedResidents & { next_page_url: string | null };
    zones?: Array<{ id: number; name: string }>;
    filters: {
        search?: string;
        status?: string;
        role?: string;
        property?: string;
        zone?: string;
        sort?: string;
    };
    stats: {
        total: number;
        active: number;
        pending: number;
        inactive: number;
        occupancy_rate: number;
    };
    insights?: string[] | null;
    incompleteResidents?: { id: number; name: string }[] | null;
    inviteLink: {
        token: string;
        url: string;
        is_active: boolean;
        usage_count: number;
        max_usages: number | null;
        requires_approval: boolean;
        expires_at: string | null;
        is_expired: boolean;
    } | null;
};

export default function Residents({
    residents: initialResidents,
    filters: initialFilters,
    stats: initialStats,
    insights: initialInsights,
    incompleteResidents,
    inviteLink,
}: Props) {
    const residents = initialResidents || { data: [], current_page: 1, last_page: 1, total: 0, links: [], next_page_url: null };
    const hasResidents = residents.data.length > 0;
    const isLoading = initialResidents === undefined;

    const filters = !Array.isArray(initialFilters) ? initialFilters || {} : {};
    const stats = initialStats || { total: 0, active: 0, pending: 0, inactive: 0, occupancy_rate: 0 };
    const insights = initialInsights || [];

    const { can } = usePermission();

    // States
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [role, setRole] = useState(filters.role || '');
    const [property, setProperty] = useState(filters.property || '');
    const [sort, setSort] = useState(filters.sort || '');

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isBulkActionRunning, setIsBulkActionRunning] = useState(false);
    const [copied, setCopied] = useState(false);
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

    const debouncedSearch = useDebounce(search, 300);

    // Apply filters
    const applyFilters = useCallback(
        (updatedFilters: Record<string, string>) => {
            router.get(
                index.url(),
                {
                    search,
                    status,
                    role,
                    property,
                    sort,
                    ...updatedFilters,
                },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        },
        [search, status, role, property, sort],
    );

    // Handle search debounce
    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            applyFilters({ search: debouncedSearch });
        }
    }, [debouncedSearch]);

    const handleFilterChange = (key: string, value: string) => {
        if (key === 'status') setStatus(value);
        if (key === 'role') setRole(value);
        if (key === 'property') setProperty(value);
        if (key === 'sort') setSort(value);

        applyFilters({ [key]: value });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setRole('');
        setProperty('');
        setSort('');
        router.get(index.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const hasActiveFilters = Boolean(search || status || role || property || sort);

    const fallbackCopy = (text: string) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
    };

    // Copy link helper
    const copyToClipboard = () => {
        if (!inviteLink?.url) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
                .writeText(inviteLink.url)
                .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch(() => fallbackCopy(inviteLink.url));
        } else {
            fallbackCopy(inviteLink.url);
        }
    };

    // Selection Helpers
    const toggleSelectAll = () => {
        if (!residents?.data) return;
        
        const selectableIds = residents.data.filter(r => !r.is_estate_creator).map(r => r.id);
        
        if (selectedIds.length === selectableIds.length && selectableIds.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(selectableIds);
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    // Bulk actions
    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setIsDeleting(true);
        router.delete(bulkDelete.url(), {
            data: { ids: selectedIds },
            onSuccess: () => {
                setSelectedIds([]);
                setShowDeleteConfirm(false);
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    const handleBulkSuspend = () => {
        if (selectedIds.length === 0) return;
        setIsBulkActionRunning(true);
        router.post(
            '/admin/residents/bulk-suspend',
            { ids: selectedIds },
            {
                onSuccess: () => setSelectedIds([]),
                onFinish: () => setIsBulkActionRunning(false),
            },
        );
    };

    const handleBulkActivate = () => {
        if (selectedIds.length === 0) return;
        setIsBulkActionRunning(true);
        router.post(
            '/admin/residents/bulk-activate',
            { ids: selectedIds },
            {
                onSuccess: () => setSelectedIds([]),
                onFinish: () => setIsBulkActionRunning(false),
            },
        );
    };

    const handleBulkResend = () => {
        if (selectedIds.length === 0) return;
        setIsBulkActionRunning(true);
        router.post(
            '/admin/residents/bulk-resend-invitation',
            { ids: selectedIds },
            {
                onSuccess: () => setSelectedIds([]),
                onFinish: () => setIsBulkActionRunning(false),
            },
        );
    };

    // Toggle invite link
    const toggleInviteLink = () => {
        router.post('/admin/residents/invite-link/toggle', {}, { preserveScroll: true });
    };

    // Regenerate invite link
    const regenerateInviteLink = () => {
        router.post('/admin/residents/invite-link/regenerate', {}, { preserveScroll: true });
    };

    // Individual actions
    const handleResendInvitation = (id: number) => {
        router.post(`/admin/residents/${id}/resend-invitation`, {}, { preserveScroll: true });
    };

    const handleToggleSuspend = (id: number) => {
        router.patch(`/admin/residents/${id}/suspend`, {}, { preserveScroll: true });
    };

    const handleMarkAsPropertyOwner = (resident: Resident) => {
        if (!confirm(`Convert ${resident.name} to a Property Owner (Landlord)? They will keep resident access.`)) {
            return;
        }

        router.patch(markAsPropertyOwner.url(resident.ulid), {}, { preserveScroll: true });
    };

    const handleDeleteResident = (id: number) => {
        if (confirm('Are you sure you want to remove this resident?')) {
            router.delete(`/admin/residents/${id}`, { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Residents Workspace" />

            {/* Top Workspace Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Resident Workspace</h1>
                    <p className="text-xs font-semibold text-slate-500">Monitor community health, handle activations, and manage profiles.</p>
                </div>
                <div className="flex items-center gap-2">
                    {inviteLink && (
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4.5 py-2.5 text-xs font-black tracking-wide text-slate-700 uppercase shadow-xs transition-all hover:bg-slate-50 active:scale-95"
                        >
                            <LinkIcon className="h-4 w-4 text-slate-500" />
                            Invite Link Settings
                        </button>
                    )}
                    {can('residents.create') && (
                        <Link
                            href={index.url() + '/create'}
                            className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4.5 py-2.5 text-xs font-black tracking-wide text-white uppercase shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                        >
                            <PlusIcon className="h-4 w-4" strokeWidth={3} />
                            Invite Resident
                        </Link>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                {/* SECTION 1 — RESIDENT OVERVIEW STRIP */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Total Community</span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <Users className="h-4 w-4 shrink-0 text-blue-500" />
                            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Active Residents</span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                            <span className="text-2xl font-black text-slate-900">{stats.active}</span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Pending Access</span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                            <span className="text-2xl font-black text-slate-900">{stats.pending}</span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Suspended Accounts</span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <UserMinus className="h-4 w-4 shrink-0 text-rose-500" />
                            <span className="text-2xl font-black text-slate-900">{stats.inactive}</span>
                        </div>
                    </div>
                </div>

                {/* SECTION 2 — INSIGHTS PANEL (deferred) */}
                <Deferred
                    data={['insights', 'incompleteResidents']}
                    fallback={
                        <div className="h-20 animate-pulse rounded-2xl border border-blue-100/40 bg-blue-50/30" />
                    }
                >
                    {((insights && insights.length > 0) || (incompleteResidents && incompleteResidents.length > 0)) && (
                        <div className="rounded-2xl border border-blue-100/50 bg-linear-to-br from-blue-50/40 to-indigo-50/20 p-4.5 shadow-xs">
                            <div className="mb-2.5 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                <h3 className="text-xs font-black tracking-wider text-blue-900 uppercase">Attention Required</h3>
                            </div>
                            <ul className="space-y-2">
                                {insights.map((insight, idx) => {
                                    if (insight.includes('require profile completion')) return null;
                                    return (
                                        <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-blue-950">
                                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                                            <span>{insight}</span>
                                        </li>
                                    );
                                })}
                                {incompleteResidents && incompleteResidents.length > 0 && (
                                    <li className="flex items-start gap-2 text-xs font-semibold text-blue-950">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                                        <span>
                                            {incompleteResidents.length} resident{incompleteResidents.length > 1 ? 's' : ''} require profile
                                            completion:{' '}
                                            <span className="inline-flex flex-wrap gap-x-1.5 gap-y-0.5">
                                                {incompleteResidents.map((r, idx) => (
                                                    <span key={r.id} className="inline-flex items-center">
                                                        <Link
                                                            href={`/admin/residents/${r.id}/edit`}
                                                            className="font-bold text-blue-700 underline hover:text-blue-900"
                                                        >
                                                            {r.name}
                                                        </Link>
                                                        {idx < incompleteResidents.length - 1 && (
                                                            <span className="mr-1 text-blue-950/80">,</span>
                                                        )}
                                                    </span>
                                                ))}
                                            </span>
                                        </span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
                </Deferred>

                {/* SECTION 3 — SEARCH & FILTERS */}
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                    <div className="flex flex-col gap-3">
                        {/* Search Input */}
                        <div className="relative w-full">
                            <MagnifyingGlassIcon className="pointer-events-none absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search residents by name, email, phone, or unit..."
                                className="w-full rounded-xl border-slate-200 py-3 pr-4 pl-11 text-xs font-semibold placeholder:text-slate-400 focus:border-slate-800 focus:ring-slate-800 focus:outline-hidden"
                            />
                        </div>

                        {/* Dropdowns filters */}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                            <div>
                                <select
                                    value={status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] font-bold text-slate-700 focus:border-slate-800 focus:outline-hidden"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>

                            <div>
                                <select
                                    value={role}
                                    onChange={(e) => handleFilterChange('role', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] font-bold text-slate-700 focus:border-slate-800 focus:outline-hidden"
                                >
                                    <option value="">All Roles</option>
                                    <option value="tenant">Tenants</option>
                                    <option value="property_owner">Landlords</option>
                                    <option value="resident">Residents</option>
                                </select>
                            </div>

                            <div>
                                <select
                                    value={property}
                                    onChange={(e) => handleFilterChange('property', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] font-bold text-slate-700 focus:border-slate-800 focus:outline-hidden"
                                >
                                    <option value="">Properties Allocation</option>
                                    <option value="has_property">Assigned Unit</option>
                                    <option value="no_property">Unassigned Unit</option>
                                </select>
                            </div>

                            <div>
                                <select
                                    value={sort}
                                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] font-bold text-slate-700 focus:border-slate-800 focus:outline-hidden"
                                >
                                    <option value="">Sort By</option>
                                    <option value="name">Name</option>
                                    <option value="date_joined">Date Joined</option>
                                    <option value="last_active">Last Active</option>
                                </select>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <button
                                    onClick={clearFilters}
                                    disabled={!hasActiveFilters}
                                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-black tracking-wider text-slate-600 uppercase shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 4 — TABLE REDESIGN */}
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs ring-1 ring-slate-100/50">
                    {isLoading ? (
                        <div className="animate-pulse space-y-4 p-6">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4 border-b border-slate-50 py-3.5">
                                    <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-100" />
                                    <div className="min-w-0 flex-1 space-y-2 py-1">
                                        <div className="bg-slate-150 h-3 w-1/4 rounded" />
                                        <div className="h-2 w-1/2 rounded bg-slate-100" />
                                    </div>
                                    <div className="h-3 w-12 rounded bg-slate-100" />
                                    <div className="h-3 w-16 rounded bg-slate-100" />
                                </div>
                            ))}
                        </div>
                    ) : hasResidents ? (
                        <div className="overflow-x-auto min-h-[280px]">
                            <table className="w-full table-auto border-collapse">
                                <thead className="border-b border-slate-100 bg-slate-50/70">
                                    <tr>
                                        {can('residents.delete') && (
                                            <th className="w-10 px-4 py-3.5 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        residents.data.filter(r => !r.is_estate_creator).length > 0 &&
                                                        selectedIds.length === residents.data.filter(r => !r.is_estate_creator).length
                                                    }
                                                    onChange={toggleSelectAll}
                                                    className="border-slate-350 h-4 w-4 rounded text-slate-900 focus:ring-slate-900"
                                                />
                                            </th>
                                        )}
                                        <th className="text-slate-455 px-4 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                            Resident
                                        </th>
                                        <th className="text-slate-455 px-4 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                            Contact
                                        </th>
                                        <th className="text-slate-455 px-4 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">Unit</th>
                                        <th className="text-slate-455 px-4 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                            Household
                                        </th>
                                        <th className="text-slate-455 px-4 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                            Joined & Active
                                        </th>
                                        <th className="text-slate-455 px-4 py-3.5 text-left text-[9px] font-black tracking-widest uppercase">
                                            Status
                                        </th>
                                        <th className="w-20 px-4 py-3.5 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {residents.data.map((resident, idx) => {
                                        const isSelected = selectedIds.includes(resident.id);
                                        const initial = resident.name ? resident.name.charAt(0).toUpperCase() : 'R';

                                        // Soft premium colors for avatars
                                        const bgColors = [
                                            'bg-blue-50 text-blue-700',
                                            'bg-indigo-50 text-indigo-700',
                                            'bg-purple-50 text-purple-700',
                                            'bg-emerald-50 text-emerald-700',
                                        ];
                                        const avatarColor = bgColors[idx % bgColors.length];

                                        return (
                                            <tr
                                                key={resident.ulid}
                                                className={`group transition-colors hover:bg-slate-50/50 ${isSelected ? 'bg-slate-50/70' : ''}`}
                                            >
                                                {can('residents.delete') && (
                                                    <td className="px-4 py-3.5 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            disabled={resident.is_estate_creator}
                                                            onChange={() => toggleSelect(resident.id)}
                                                            className="border-slate-350 h-4 w-4 rounded text-slate-900 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        />
                                                    </td>
                                                )}

                                                {/* Avatar & Name */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${avatarColor}`}
                                                        >
                                                            {initial}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="block max-w-[130px] truncate text-xs font-bold text-slate-900">
                                                                {resident.name}
                                                            </span>
                                                            <span className="mt-0.5 inline-flex rounded-md bg-slate-50 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-slate-400 uppercase ring-1 ring-slate-100">
                                                                {resident.role_label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Contact */}
                                                <td className="px-4 py-3.5">
                                                    <div className="text-xs font-semibold text-slate-800">
                                                        <span className="block max-w-[150px] truncate">{resident.email}</span>
                                                        <span className="mt-0.5 block text-[10px] font-bold text-slate-400">
                                                            {resident.phone || '—'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Unit */}
                                                <td className="px-4 py-3.5">
                                                    {resident.unit_number ? (
                                                        <span className="text-xs font-bold text-slate-700">{resident.unit_number}</span>
                                                    ) : (
                                                        <span className="text-slate-350 text-xs font-bold">Unassigned</span>
                                                    )}
                                                </td>

                                                {/* Household */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                                                        <Users className="h-3.5 w-3.5 text-slate-400" />
                                                        {resident.household_members_count > 0 ? (
                                                            <span>{resident.household_members_count + 1} Members</span>
                                                        ) : (
                                                            <span className="text-slate-400">1 Member</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Dates */}
                                                <td className="px-4 py-3.5">
                                                    <div className="text-slate-850 text-xs font-semibold">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3 text-slate-400" />
                                                            <span>{resident.created_at}</span>
                                                        </div>
                                                        <div className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{resident.last_active}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Status Badge */}
                                                <td className="px-4 py-3.5">
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                                                            resident.status === 'inactive'
                                                                ? 'bg-rose-50 text-rose-700'
                                                                : (resident.status === 'active' || resident.status === 'accepted')
                                                                  ? 'bg-emerald-50 text-emerald-700'
                                                                  : 'bg-amber-50 text-amber-700'
                                                        }`}
                                                    >
                                                        {resident.status}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="relative px-4 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* Direct Profile Edit */}
                                                        <Link
                                                            href={`/admin/residents/${resident.id}/edit`}
                                                            className="rounded-lg p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
                                                            title="Edit Profile"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Link>

                                                        {/* Direct Resend Invitation if Pending */}
                                                        {resident.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleResendInvitation(resident.id)}
                                                                className="rounded-lg p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
                                                                title="Resend Invite"
                                                            >
                                                                <Send className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}

                                                        {/* Direct Assign Unit Link if Unassigned */}
                                                        {!resident.unit_number && (
                                                            <Link
                                                                href={`/admin/residents/${resident.id}/edit`}
                                                                className="rounded-lg p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
                                                                title="Assign Unit"
                                                            >
                                                                <Home className="h-3.5 w-3.5" />
                                                            </Link>
                                                        )}

                                                        {!resident.is_property_owner && (
                                                            <button
                                                                onClick={() => handleMarkAsPropertyOwner(resident)}
                                                                className="rounded-lg p-1 text-emerald-500 transition-all hover:bg-emerald-50 hover:text-emerald-700"
                                                                title="Convert to Landlord"
                                                            >
                                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}

                                                        {/* Overflow menu */}
                                                        <button
                                                            onClick={() => setMenuOpenId(menuOpenId === resident.id ? null : resident.id)}
                                                            className="rounded-lg p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
                                                        >
                                                            <EllipsisVerticalIcon className="h-4 w-4" />
                                                        </button>

                                                        {/* Popup Dropdown */}
                                                        {menuOpenId === resident.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                                                                <div className="ring-slate-150/50 absolute top-11 right-4 z-20 w-48 rounded-xl border border-slate-100 bg-white p-1 text-left shadow-lg ring-1">
                                                                    {!resident.is_estate_creator && (
                                                                        <button
                                                                            onClick={() => {
                                                                                handleToggleSuspend(resident.id);
                                                                                setMenuOpenId(null);
                                                                            }}
                                                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                                        >
                                                                            <UserMinus className="h-3.5 w-3.5 text-slate-400" />
                                                                            {resident.status === 'inactive' ? 'Activate Account' : 'Suspend Account'}
                                                                        </button>
                                                                    )}
                                                                    {!resident.is_property_owner && (
                                                                        <button
                                                                            onClick={() => {
                                                                                handleMarkAsPropertyOwner(resident);
                                                                                setMenuOpenId(null);
                                                                            }}
                                                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                                        >
                                                                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                                                            Convert to Landlord
                                                                        </button>
                                                                    )}
                                                                    {!resident.is_estate_creator && (
                                                                        <button
                                                                            onClick={() => {
                                                                                handleDeleteResident(resident.id);
                                                                                setMenuOpenId(null);
                                                                            }}
                                                                            className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-slate-50 px-3 py-2 pt-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                            Delete Profile
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* Redesigned Empty State */
                        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 shadow-inner">
                                <Users className="h-6 w-6" />
                            </div>
                            <h3 className="text-sm font-black tracking-wide text-slate-900 uppercase">No residents found</h3>
                            <p className="mt-1 max-w-xs text-xs font-semibold text-slate-400">
                                {hasActiveFilters
                                    ? 'No records match your selected criteria. Try resetting or adjusting your search term.'
                                    : 'Get started by inviting your first resident to join the community directory.'}
                            </p>
                            {!hasActiveFilters && can('residents.create') && (
                                <Link
                                    href={index.url() + '/create'}
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800"
                                >
                                    <PlusIcon className="h-4 w-4" strokeWidth={3} />
                                    Invite Resident
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {residents.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-5 pb-8">
                        <p className="text-slate-505 text-xs font-bold">
                            Showing <span className="text-slate-950">{residents.data.length}</span> of{' '}
                            <span className="text-slate-950">{residents.total}</span> residents
                        </p>
                        <div className="flex gap-1.5">
                            {residents.links.map((link, idx) => (
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

            {/* INVITATION LINK MANAGEMENT MODAL */}
            <AnimatePresence>
                {showInviteModal && inviteLink && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
                        onClick={() => setShowInviteModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                                <h3 className="text-base font-black tracking-wide text-slate-900 uppercase">Community Invitation Link</h3>
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Token link preview */}
                                <div className="border-slate-150/70 flex flex-col gap-2 rounded-xl border bg-slate-50/50 p-3">
                                    <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Public Registration URL</span>
                                    <div className="flex items-center justify-between gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={inviteLink.url}
                                            className="w-full truncate border-0 bg-transparent p-0 text-xs font-semibold text-slate-800 focus:ring-0"
                                        />
                                        <button
                                            onClick={copyToClipboard}
                                            className="text-slate-455 hover:bg-slate-150/50 shrink-0 rounded-lg p-1.5 transition hover:text-slate-800"
                                            title="Copy Link"
                                        >
                                            {copied ? <Check className="h-4.5 w-4.5 text-emerald-600" /> : <Copy className="h-4.5 w-4.5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* invitation stats */}
                                <div className="grid grid-cols-2 gap-2 text-center">
                                    <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-2.5">
                                        <span className="text-slate-450 block text-[9px] font-black tracking-wider uppercase">Usages</span>
                                        <span className="mt-1 block text-base font-black text-slate-900">{inviteLink.usage_count}</span>
                                    </div>
                                    <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-2.5">
                                        <span className="text-slate-455 block text-[9px] font-black tracking-wider uppercase">Limit</span>
                                        <span className="mt-1 block text-base font-black text-slate-900">{inviteLink.max_usages || '∞'}</span>
                                    </div>
                                </div>

                                {/* Active toggle / actions */}
                                <div className="space-y-2 border-t border-slate-100 pt-4">
                                    <button
                                        onClick={toggleInviteLink}
                                        className={`w-full rounded-xl border py-2.5 text-xs font-black tracking-wider uppercase shadow-xs transition ${
                                            inviteLink.is_active
                                                ? 'border-rose-250 bg-white text-rose-600 hover:bg-rose-50/50'
                                                : 'bg-emerald-600 border-transparent text-white hover:bg-emerald-700'
                                        }`}
                                    >
                                        {inviteLink.is_active ? 'Disable Link' : 'Enable Link'}
                                    </button>
                                    <button
                                        onClick={regenerateInviteLink}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-black tracking-wider text-slate-700 uppercase transition hover:bg-slate-100"
                                    >
                                        Regenerate Token
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FLOATING BULK ACTIONS TOOLBAR */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-6 left-1/2 z-40 w-full max-w-2xl -translate-x-1/2 px-4"
                    >
                        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-900/10 bg-slate-950/95 px-6 py-4.5 shadow-xl backdrop-blur-md">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                                <span className="text-xs font-black tracking-wider text-white uppercase">{selectedIds.length} Selected</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={handleBulkResend}
                                    disabled={isBulkActionRunning}
                                    className="rounded-xl bg-slate-800 px-3.5 py-2 text-[11px] font-black tracking-wider text-white uppercase transition hover:bg-slate-700 disabled:opacity-40"
                                >
                                    Resend Invites
                                </button>
                                <button
                                    onClick={handleBulkActivate}
                                    disabled={isBulkActionRunning}
                                    className="rounded-xl bg-slate-800 px-3.5 py-2 text-[11px] font-black tracking-wider text-white uppercase transition hover:bg-slate-700 disabled:opacity-40"
                                >
                                    Activate
                                </button>
                                <button
                                    onClick={handleBulkSuspend}
                                    disabled={isBulkActionRunning}
                                    className="rounded-xl bg-slate-800 px-3.5 py-2 text-[11px] font-black tracking-wider text-white uppercase transition hover:bg-slate-700 disabled:opacity-40"
                                >
                                    Suspend
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isBulkActionRunning}
                                    className="bg-red-650 rounded-xl px-3.5 py-2 text-[11px] font-black tracking-wider text-white uppercase transition hover:bg-red-700 disabled:opacity-40"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                                >
                                    <X className="h-4.5 w-4.5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk Delete Confirm Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 shadow-inner">
                                <Trash2 className="h-6 w-6" />
                            </div>
                            <h3 className="text-base font-black tracking-wide text-slate-900 uppercase">Confirm Bulk Removal</h3>
                            <p className="text-slate-505 mt-2 text-xs leading-relaxed font-semibold">
                                You are about to permanently remove {selectedIds.length} resident(s). This will detach them from the estate records.
                                This action is irreversible.
                            </p>
                            <div className="mt-6 flex justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                    className="text-slate-655 rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-slate-100 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBulkDelete}
                                    disabled={isDeleting}
                                    className="bg-red-655 inline-flex items-center gap-2 rounded-xl px-4.5 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isDeleting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : 'Yes, Delete Selected'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
