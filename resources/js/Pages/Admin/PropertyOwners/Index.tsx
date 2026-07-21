import { PlusIcon, MagnifyingGlassIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
    Trash2, 
    Loader2, 
    Check, 
    Building, 
    ShieldCheck, 
    UserMinus, 
    Send, 
    Copy, 
    AlertCircle, 
    Calendar, 
    Pencil, 
    X, 
    Users,
    LinkIcon,
    Home
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { properties, residents, create } from '@/actions/App/Http/Controllers/Admin/PropertyOwnerController';
import { useDebounce } from '@/Hooks/useDebounce';
import { usePermission } from '@/Hooks/usePermission';
import AdminLayout from '@/Layouts/AdminLayout';

interface PropertyOwner {
    id: number;
    ulid: string;
    name: string;
    email: string;
    phone: string | null;
    unit_number: string | null;
    status: 'pending' | 'accepted' | 'inactive';
    suspended_at: string | null;
    email_verified_at: string | null;
    properties_count: number;
    residents_count: number;
    is_resident: boolean;
    created_at: string;
}

interface Props {
    propertyOwners: {
        data: PropertyOwner[];
        total: number;
        links: any[];
        next_page_url: string | null;
        current_page: number;
        last_page: number;
    };
    filters: {
        search?: string;
        status?: string;
        property?: string;
        sort?: string;
    };
    stats: {
        total: number;
        active: number;
        pending: number;
        inactive: number;
        occupancy_rate: number;
    };
    insights: string[];
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
}

export default function Index({ propertyOwners, filters: initialFilters, stats, insights, inviteLink }: Props) {
    const filters = !Array.isArray(initialFilters) ? (initialFilters || {}) : {};
    const { can } = usePermission();
    
    // States
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
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
    const applyFilters = useCallback((updatedFilters: Record<string, string>) => {
        router.get('/admin/property-owners', {
            search,
            status,
            property,
            sort,
            ...updatedFilters
        }, { preserveState: true, preserveScroll: true, replace: true });
    }, [search, status, property, sort]);

    // Handle search debounce
    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            applyFilters({ search: debouncedSearch });
        }
    }, [debouncedSearch]);

    const handleFilterChange = (key: string, value: string) => {
        if (key === 'status') setStatus(value);
        if (key === 'property') setProperty(value);
        if (key === 'sort') setSort(value);
        
        applyFilters({ [key]: value });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setProperty('');
        setSort('');
        router.get('/admin/property-owners', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const hasActiveFilters = Boolean(search || status || property || sort);

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
            navigator.clipboard.writeText(inviteLink.url)
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
        if (!propertyOwners?.data) return;
        if (selectedIds.length === propertyOwners.data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(propertyOwners.data.map((r) => r.id));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    // Bulk actions
    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setIsDeleting(true);
        router.delete('/admin/property-owners/bulk-delete', {
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
            '/admin/property-owners/bulk-suspend',
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
            '/admin/property-owners/bulk-activate',
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
            '/admin/property-owners/bulk-resend-invitation',
            { ids: selectedIds },
            {
                onSuccess: () => setSelectedIds([]),
                onFinish: () => setIsBulkActionRunning(false),
            },
        );
    };

    // Toggle invite link
    const toggleInviteLink = () => {
        router.post('/admin/property-owners/invite-link/toggle', {}, { preserveScroll: true });
    };

    // Regenerate invite link
    const regenerateInviteLink = () => {
        router.post('/admin/property-owners/invite-link/regenerate', {}, { preserveScroll: true });
    };

    // Individual actions
    const handleResendInvitation = (id: number) => {
        router.post(`/admin/property-owners/${id}/resend-invitation`, {}, { preserveScroll: true });
    };

    const handleToggleSuspend = (id: number) => {
        router.patch(`/admin/property-owners/${id}/suspend`, {}, { preserveScroll: true });
    };

    const handleMakeResident = (id: number) => {
        router.post(`/admin/property-owners/${id}/make-resident`, {}, { preserveScroll: true });
    };

    const handleDeleteOwner = (id: number) => {
        if (confirm('Are you sure you want to remove this property owner?')) {
            router.delete(`/admin/property-owners/${id}`, { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Property Owners Workspace" />

            {/* Top Workspace Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Property Owner Workspace</h1>
                    <p className="text-xs font-semibold text-slate-500">
                        Monitor property allocations, invite landlords, and manage community profiles.
                    </p>
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
                    {can('property_owners.create') && (
                        <Link
                            href={create.url()}
                            className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4.5 py-2.5 text-xs font-black tracking-wide text-white uppercase shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                        >
                            <PlusIcon className="h-4 w-4" strokeWidth={3} />
                            Add Property Owner
                        </Link>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                {/* SECTION 1 — STATS STRIP */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Landlords</span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <Users className="h-4 w-4 text-blue-500 shrink-0" />
                            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Landlords</span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span className="text-2xl font-black text-slate-900">{stats.active}</span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Verification</span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <Loader2 className="h-4 w-4 text-amber-500 shrink-0" />
                            <span className="text-2xl font-black text-slate-900">{stats.pending}</span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suspended Landlords</span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <UserMinus className="h-4 w-4 text-rose-500 shrink-0" />
                            <span className="text-2xl font-black text-slate-900">{stats.inactive}</span>
                        </div>
                    </div>
                </div>

                {/* SECTION 2 — INSIGHTS PANEL */}
                {insights.length > 0 && (
                    <div className="rounded-2xl border border-blue-100/50 bg-linear-to-br from-blue-50/40 to-indigo-50/20 p-4.5 shadow-xs">
                        <div className="mb-2.5 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <h3 className="text-xs font-black tracking-wider text-blue-900 uppercase">Attention Required</h3>
                        </div>
                        <ul className="space-y-2">
                            {insights.map((insight, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-blue-950">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                                    {insight}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

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
                                placeholder="Search landlords by name, email, phone..."
                                className="w-full rounded-xl border-slate-200 py-3 pr-4 pl-11 text-xs font-semibold placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden focus:ring-slate-800"
                            />
                        </div>

                        {/* Dropdowns filters */}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <div>
                                <select
                                    value={status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 bg-slate-50 py-2.5 px-3 text-[11px] font-bold text-slate-700 focus:border-slate-800 focus:outline-hidden"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>

                            <div>
                                <select
                                    value={property}
                                    onChange={(e) => handleFilterChange('property', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 bg-slate-50 py-2.5 px-3 text-[11px] font-bold text-slate-700 focus:border-slate-800 focus:outline-hidden"
                                >
                                    <option value="">Properties Owned</option>
                                    <option value="has_properties">Has Assigned Properties</option>
                                    <option value="no_properties">No Properties Assigned</option>
                                </select>
                            </div>

                            <div>
                                <select
                                    value={sort}
                                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                                    className="w-full rounded-xl border-slate-200 bg-slate-50 py-2.5 px-3 text-[11px] font-bold text-slate-700 focus:border-slate-800 focus:outline-hidden"
                                >
                                    <option value="">Sort By</option>
                                    <option value="name">Name</option>
                                    <option value="date_joined">Date Joined</option>
                                    <option value="properties_count">Properties Count</option>
                                </select>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <button
                                    onClick={clearFilters}
                                    disabled={!hasActiveFilters}
                                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-600 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Reset Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 4 — TABLE */}
                <div className="rounded-2xl border border-slate-100 bg-white shadow-xs ring-1 ring-slate-100/50 overflow-hidden">
                    {propertyOwners.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto border-collapse">
                                <thead className="bg-slate-50/70 border-b border-slate-100">
                                    <tr>
                                        {can('property_owners.delete') && (
                                            <th className="w-10 px-4 py-3.5 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.length === propertyOwners.data.length && propertyOwners.data.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="h-4 w-4 rounded border-slate-350 text-slate-900 focus:ring-slate-900"
                                                />
                                            </th>
                                        )}
                                        <th className="px-4 py-3.5 text-left text-[9px] font-black tracking-widest text-slate-455 uppercase">Landlord</th>
                                        <th className="px-4 py-3.5 text-left text-[9px] font-black tracking-widest text-slate-455 uppercase">Contact</th>
                                        <th className="px-4 py-3.5 text-left text-[9px] font-black tracking-widest text-slate-455 uppercase">Properties</th>
                                        <th className="px-4 py-3.5 text-left text-[9px] font-black tracking-widest text-slate-455 uppercase">Co-Residents</th>
                                        <th className="px-4 py-3.5 text-left text-[9px] font-black tracking-widest text-slate-455 uppercase">Joined</th>
                                        <th className="px-4 py-3.5 text-left text-[9px] font-black tracking-widest text-slate-455 uppercase">Status</th>
                                        <th className="w-20 px-4 py-3.5 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {propertyOwners.data.map((owner, idx) => {
                                        const isSelected = selectedIds.includes(owner.id);
                                        const initial = owner.name ? owner.name.charAt(0).toUpperCase() : 'O';
                                        
                                        // Soft premium colors for avatars
                                        const bgColors = ['bg-blue-50 text-blue-700', 'bg-indigo-50 text-indigo-700', 'bg-purple-50 text-purple-700', 'bg-emerald-50 text-emerald-700'];
                                        const avatarColor = bgColors[idx % bgColors.length];

                                        return (
                                            <tr 
                                                key={owner.ulid} 
                                                className={`group transition-colors hover:bg-slate-50/50 ${isSelected ? 'bg-slate-50/70' : ''}`}
                                            >
                                                {can('property_owners.delete') && (
                                                    <td className="px-4 py-3.5 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleSelect(owner.id)}
                                                            className="h-4 w-4 rounded border-slate-350 text-slate-900 focus:ring-slate-900"
                                                        />
                                                    </td>
                                                )}
                                                
                                                {/* Avatar & Name */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${avatarColor}`}>
                                                            {initial}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="block truncate max-w-[130px] text-xs font-bold text-slate-900">{owner.name}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Contact */}
                                                <td className="px-4 py-3.5">
                                                    <div className="text-xs font-semibold text-slate-800">
                                                        <span className="block truncate max-w-[150px]">{owner.email}</span>
                                                        <span className="mt-0.5 block text-[10px] font-bold text-slate-400">{owner.phone || '—'}</span>
                                                    </div>
                                                </td>

                                                {/* Properties Count */}
                                                <td className="px-4 py-3.5">
                                                    <Link 
                                                        href={properties.url(owner.id)}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                                                    >
                                                        <Building className="h-3.5 w-3.5 text-slate-400" />
                                                        <span>{owner.properties_count} Units</span>
                                                    </Link>
                                                </td>

                                                {/* Residents Count */}
                                                <td className="px-4 py-3.5">
                                                    <Link 
                                                        href={residents.url(owner.id)}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                                                    >
                                                        <Users className="h-3.5 w-3.5 text-slate-400" />
                                                        <span>{owner.residents_count} Residents</span>
                                                    </Link>
                                                </td>

                                                {/* Dates */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-800">
                                                        <Calendar className="h-3 w-3 text-slate-400" />
                                                        <span>{owner.created_at}</span>
                                                    </div>
                                                </td>

                                                {/* Status Badge */}
                                                <td className="px-4 py-3.5">
                                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                                        owner.status === 'inactive'
                                                            ? 'bg-rose-50 text-rose-700'
                                                            : owner.status === 'accepted'
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                        {owner.status === 'accepted' ? 'active' : owner.status}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="relative px-4 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* Direct Profile Edit */}
                                                        <Link
                                                            href={`/admin/property-owners/${owner.id}/edit`}
                                                            className="rounded-lg p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
                                                            title="Edit Profile"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Link>
                                                        
                                                        {/* Direct Resend Invitation if Pending */}
                                                        {owner.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleResendInvitation(owner.id)}
                                                                className="rounded-lg p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
                                                                title="Resend Invite"
                                                            >
                                                                <Send className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}

                                                        {/* Direct Assign Unit Link if Unassigned */}
                                                        {owner.properties_count === 0 && (
                                                            <Link
                                                                href={`/admin/property-owners/${owner.id}/edit`}
                                                                className="rounded-lg p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
                                                                title="Assign Unit"
                                                            >
                                                                <Home className="h-3.5 w-3.5" />
                                                            </Link>
                                                        )}

                                                        {/* Overflow menu */}
                                                        <button
                                                            onClick={() => setMenuOpenId(menuOpenId === owner.id ? null : owner.id)}
                                                            className="rounded-lg p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
                                                        >
                                                            <EllipsisVerticalIcon className="h-4 w-4" />
                                                        </button>

                                                        {/* Popup Dropdown */}
                                                        {menuOpenId === owner.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                                                                <div className="absolute right-4 top-11 z-20 w-48 rounded-xl border border-slate-100 bg-white p-1 shadow-lg ring-1 ring-slate-150/50 text-left">
                                                                    <button
                                                                        onClick={() => {
                                                                            handleToggleSuspend(owner.id);
                                                                            setMenuOpenId(null);
                                                                        }}
                                                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                                    >
                                                                        <UserMinus className="h-3.5 w-3.5 text-slate-400" />
                                                                        {owner.status === 'inactive' ? 'Activate Account' : 'Suspend Account'}
                                                                    </button>
                                                                    {!owner.is_resident && (
                                                                        <button
                                                                            onClick={() => {
                                                                                handleMakeResident(owner.id);
                                                                                setMenuOpenId(null);
                                                                            }}
                                                                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                                        >
                                                                            <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                                                                            Mark as Resident
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => {
                                                                            handleDeleteOwner(owner.id);
                                                                            setMenuOpenId(null);
                                                                        }}
                                                                        className="mt-1 flex w-full items-center gap-2 border-t border-slate-50 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 pt-2"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                        Delete Profile
                                                                    </button>
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
                            <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">No property owners found</h3>
                            <p className="mt-1 max-w-xs text-xs font-semibold text-slate-400">
                                {hasActiveFilters 
                                    ? 'No records match your selected criteria. Try resetting or adjusting your filters.' 
                                    : 'Get started by adding your first landlord to the property owner registry.'}
                            </p>
                            {!hasActiveFilters && can('property_owners.create') && (
                                <Link
                                    href={create.url()}
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
                                >
                                    <PlusIcon className="h-4 w-4" strokeWidth={3} />
                                    Add Property Owner
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {propertyOwners.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-5 pb-8">
                        <p className="text-xs font-bold text-slate-505">
                            Showing <span className="text-slate-950">{propertyOwners.data.length}</span> of <span className="text-slate-950">{propertyOwners.total}</span> landlords
                        </p>
                        <div className="flex gap-1.5">
                            {propertyOwners.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveScroll
                                    preserveState
                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                        link.active
                                            ? 'bg-slate-950 text-white shadow-sm'
                                            : link.url
                                                ? 'bg-white text-slate-655 border border-slate-205 hover:bg-slate-50'
                                                : 'cursor-not-allowed text-slate-300 border border-slate-100 opacity-50'
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
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">Community Invitation Link</h3>
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Token link preview */}
                                <div className="rounded-xl border border-slate-150/70 bg-slate-50/50 p-3 flex flex-col gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Public Registration URL</span>
                                    <div className="flex items-center justify-between gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={inviteLink.url}
                                            className="w-full bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 focus:ring-0 truncate"
                                        />
                                        <button
                                            onClick={copyToClipboard}
                                            className="p-1.5 text-slate-455 hover:text-slate-800 hover:bg-slate-150/50 rounded-lg shrink-0 transition"
                                            title="Copy Link"
                                        >
                                            {copied ? <Check className="h-4.5 w-4.5 text-emerald-600" /> : <Copy className="h-4.5 w-4.5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* invitation stats */}
                                <div className="grid grid-cols-2 gap-2 text-center">
                                    <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-2.5">
                                        <span className="block text-[9px] font-black text-slate-450 uppercase tracking-wider">Usages</span>
                                        <span className="block text-base font-black text-slate-900 mt-1">
                                            {inviteLink.usage_count}
                                        </span>
                                    </div>
                                    <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-2.5">
                                        <span className="block text-[9px] font-black text-slate-455 uppercase tracking-wider">Limit</span>
                                        <span className="block text-base font-black text-slate-900 mt-1">
                                            {inviteLink.max_usages || '∞'}
                                        </span>
                                    </div>
                                </div>

                                {/* Active toggle / actions */}
                                <div className="border-t border-slate-100 pt-4 space-y-2">
                                    <button
                                        onClick={toggleInviteLink}
                                        className={`w-full py-2.5 rounded-xl text-xs font-black tracking-wider uppercase border shadow-xs transition ${
                                            inviteLink.is_active 
                                                ? 'bg-white text-rose-600 border-rose-250 hover:bg-rose-50/50' 
                                                : 'bg-emerald-650 text-white border-transparent hover:bg-emerald-700'
                                        }`}
                                    >
                                        {inviteLink.is_active ? 'Disable Link' : 'Enable Link'}
                                    </button>
                                    <button
                                        onClick={regenerateInviteLink}
                                        className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-black tracking-wider uppercase transition"
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
                                <span className="text-xs font-black tracking-wider uppercase text-white">
                                    {selectedIds.length} Selected
                                </span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={handleBulkResend}
                                    disabled={isBulkActionRunning}
                                    className="rounded-xl bg-slate-800 px-3.5 py-2 text-[11px] font-black uppercase tracking-wider text-white transition hover:bg-slate-700 disabled:opacity-40"
                                >
                                    Resend Invites
                                </button>
                                <button
                                    onClick={handleBulkActivate}
                                    disabled={isBulkActionRunning}
                                    className="rounded-xl bg-slate-800 px-3.5 py-2 text-[11px] font-black uppercase tracking-wider text-white transition hover:bg-slate-700 disabled:opacity-40"
                                >
                                    Activate
                                </button>
                                <button
                                    onClick={handleBulkSuspend}
                                    disabled={isBulkActionRunning}
                                    className="rounded-xl bg-slate-800 px-3.5 py-2 text-[11px] font-black uppercase tracking-wider text-white transition hover:bg-slate-700 disabled:opacity-40"
                                >
                                    Suspend
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isBulkActionRunning}
                                    className="rounded-xl bg-red-650 px-3.5 py-2 text-[11px] font-black uppercase tracking-wider text-white transition hover:bg-red-700 disabled:opacity-40"
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
                            <p className="mt-2 text-xs leading-relaxed font-semibold text-slate-505">
                                You are about to permanently remove {selectedIds.length} property owner(s). This will detach them from the estate
                                records. This action is irreversible.
                            </p>
                            <div className="mt-6 flex justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                    className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-655 hover:bg-slate-100 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBulkDelete}
                                    disabled={isDeleting}
                                    className="inline-flex items-center gap-2 rounded-xl bg-red-655 px-4.5 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                                    ) : (
                                        'Yes, Delete Selected'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
