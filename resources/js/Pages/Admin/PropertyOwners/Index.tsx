import { 
    PlusIcon, 
    MagnifyingGlassIcon, 
    FunnelIcon, 
    XMarkIcon, 
    ChevronDownIcon, 
    EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
    Mail, 
    Trash2, 
    MapPin, 
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
    Users
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { properties, residents } from '@/actions/App/Http/Controllers/Admin/PropertyOwnerController';
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
        properties_owned: number;
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

export default function Index({ propertyOwners, filters: initialFilters, stats: initialStats, insights: initialInsights, inviteLink }: Props) {
    const filters = !Array.isArray(initialFilters) ? (initialFilters || {}) : {};
    const stats = initialStats || { total: 0, active: 0, pending: 0, inactive: 0, properties_owned: 0 };
    const insights = initialInsights || [];

    const { can } = usePermission();
    const hasOwners = propertyOwners && propertyOwners.data && propertyOwners.data.length > 0;
    
    // States
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [property, setProperty] = useState(filters.property || '');
    const [sort, setSort] = useState(filters.sort || '');
    
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isBulkActionRunning, setIsBulkActionRunning] = useState(false);
    const [copied, setCopied] = useState(false);
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

    const debouncedSearch = useDebounce(search, 300);

    // Apply filters
    const applyFilters = useCallback((updatedFilters: Record<string, string>) => {
        router.get(index.url(), {
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
        router.get(index.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const hasActiveFilters = Boolean(search || status || property || sort);

    // Copy link helper
    const copyToClipboard = () => {
        if (!inviteLink?.url) return;
        navigator.clipboard.writeText(inviteLink.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Selection Helpers
    const toggleSelectAll = () => {
        if (!propertyOwners?.data) return;
        if (selectedIds.length === propertyOwners.data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(propertyOwners.data.map(owner => owner.id));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
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
            onFinish: () => setIsDeleting(false)
        });
    };

    const handleBulkSuspend = () => {
        if (selectedIds.length === 0) return;
        setIsBulkActionRunning(true);
        router.post('/admin/property-owners/bulk-suspend', { ids: selectedIds }, {
            onSuccess: () => setSelectedIds([]),
            onFinish: () => setIsBulkActionRunning(false)
        });
    };

    const handleBulkActivate = () => {
        if (selectedIds.length === 0) return;
        setIsBulkActionRunning(true);
        router.post('/admin/property-owners/bulk-activate', { ids: selectedIds }, {
            onSuccess: () => setSelectedIds([]),
            onFinish: () => setIsBulkActionRunning(false)
        });
    };

    const handleBulkResend = () => {
        if (selectedIds.length === 0) return;
        setIsBulkActionRunning(true);
        router.post('/admin/property-owners/bulk-resend-invitation', { ids: selectedIds }, {
            onSuccess: () => setSelectedIds([]),
            onFinish: () => setIsBulkActionRunning(false)
        });
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
        <AdminLayout>
            <Head title="Property Owners Workspace" />

            {/* Top Workspace Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Property Owner Workspace</h1>
                    <p className="text-xs font-semibold text-slate-500">Monitor property allocations, invite landlords, and manage community profiles.</p>
                </div>
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
                
                {/* Left Workspace Column (75%) */}
                <div className="lg:col-span-3 space-y-6">
                    
                    {/* SECTION 1 — OVERVIEW STRIP */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50 flex flex-col justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Owners</span>
                            <div className="mt-2 flex items-baseline gap-2">
                                <Users className="h-4 w-4 text-blue-500 shrink-0" />
                                <span className="text-2xl font-black text-slate-900">{stats.total}</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50 flex flex-col justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                            <div className="mt-2 flex items-baseline gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span className="text-2xl font-black text-slate-900">{stats.active}</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50 flex flex-col justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</span>
                            <div className="mt-2 flex items-baseline gap-2">
                                <Send className="h-4 w-4 text-amber-500 shrink-0" />
                                <span className="text-2xl font-black text-slate-900">{stats.pending}</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50 flex flex-col justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suspended</span>
                            <div className="mt-2 flex items-baseline gap-2">
                                <UserMinus className="h-4 w-4 text-rose-500 shrink-0" />
                                <span className="text-2xl font-black text-slate-900">{stats.inactive}</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50 col-span-2 sm:col-span-1 flex flex-col justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Allocated Units</span>
                            <div className="mt-2 flex items-baseline gap-2">
                                <Building className="h-4 w-4 text-indigo-500 shrink-0" />
                                <span className="text-2xl font-black text-slate-900">{stats.properties_owned}</span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2 — INSIGHTS PANEL */}
                    {insights.length > 0 && (
                        <div className="rounded-2xl border border-blue-100/50 bg-linear-to-br from-blue-50/40 to-indigo-50/20 p-4.5 shadow-xs">
                            <div className="flex items-center gap-2 mb-2.5">
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                <h3 className="text-xs font-black tracking-wider text-blue-900 uppercase">Attention Required</h3>
                            </div>
                            <ul className="space-y-2">
                                {insights.map((insight, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs text-blue-950 font-semibold">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
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
                                <MagnifyingGlassIcon className="absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search property owners by name, email, phone, or unit..."
                                    className="w-full rounded-xl border-slate-200 pl-11 pr-4 py-3 text-xs font-semibold placeholder:text-slate-400 focus:border-slate-800 focus:ring-slate-800 focus:outline-hidden"
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
                                        <option value="invited">Invited</option>
                                        <option value="pending_activation">Pending Activation</option>
                                    </select>
                                </div>

                                <div>
                                    <select
                                        value={property}
                                        onChange={(e) => handleFilterChange('property', e.target.value)}
                                        className="w-full rounded-xl border-slate-200 bg-slate-50 py-2.5 px-3 text-[11px] font-bold text-slate-700 focus:border-slate-800 focus:outline-hidden"
                                    >
                                        <option value="">Properties Owned</option>
                                        <option value="has_properties">Has properties</option>
                                        <option value="no_properties">No properties</option>
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
                                        <option value="properties_owned">Properties Owned</option>
                                    </select>
                                </div>

                                <div className="col-span-2 sm:col-span-1">
                                    <button
                                        onClick={clearFilters}
                                        disabled={!hasActiveFilters}
                                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-[11px] font-black tracking-wider text-slate-600 uppercase shadow-xs transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4 — TABLE REDESIGN */}
                    <div className="rounded-2xl border border-slate-100 bg-white shadow-xs ring-1 ring-slate-100/50 overflow-hidden">
                        {hasOwners ? (
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
                                            <th className="px-4 py-3.5 text-left text-[9px] font-black tracking-widest text-slate-450 uppercase">Owner</th>
                                            <th className="px-4 py-3.5 text-left text-[9px] font-black tracking-widest text-slate-450 uppercase">Contact</th>
                                            <th className="px-4 py-3.5 text-left text-[9px] font-black tracking-widest text-slate-450 uppercase">Unit</th>
                                            <th className="px-4 py-3.5 text-left text-[9px] font-black tracking-widest text-slate-450 uppercase">Properties</th>
                                            <th className="px-4 py-3.5 text-left text-[9px] font-black tracking-widest text-slate-450 uppercase">Residents</th>
                                            <th className="px-4 py-3.5 text-left text-[9px] font-black tracking-widest text-slate-450 uppercase">Joined</th>
                                            <th className="px-4 py-3.5 text-left text-[9px] font-black tracking-widest text-slate-450 uppercase">Status</th>
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
                                                                <span className="text-xs font-bold text-slate-900 truncate block max-w-[130px]">{owner.name}</span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Contact */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="text-xs font-semibold text-slate-800">
                                                            <span className="block truncate max-w-[150px]">{owner.email}</span>
                                                            <span className="block text-[10px] text-slate-400 font-bold mt-0.5">{owner.phone || '—'}</span>
                                                        </div>
                                                    </td>

                                                    {/* Unit */}
                                                    <td className="px-4 py-3.5">
                                                        {owner.unit_number ? (
                                                            <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-700">
                                                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                                {owner.unit_number}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-350 font-bold">—</span>
                                                        )}
                                                    </td>

                                                    {/* Properties Count */}
                                                    <td className="px-4 py-3.5">
                                                        <Link
                                                            href={properties.url(owner.ulid)}
                                                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                                                        >
                                                            <Building className="h-3.5 w-3.5 text-slate-400" />
                                                            {owner.properties_count} Properties
                                                        </Link>
                                                    </td>

                                                    {/* Residents Count */}
                                                    <td className="px-4 py-3.5">
                                                        <Link
                                                            href={residents.url(owner.ulid)}
                                                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                                                        >
                                                            <Users className="h-3.5 w-3.5 text-slate-400" />
                                                            {owner.residents_count} Residents
                                                        </Link>
                                                    </td>

                                                    {/* Dates */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
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
                                                            {owner.status === 'inactive' ? 'Suspended' : owner.status === 'accepted' ? 'Active' : 'Pending'}
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-4 py-3.5 text-right relative">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {/* Direct Edit */}
                                                            <Link
                                                                href={`/admin/property-owners/${owner.id}/edit`}
                                                                className="p-1 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
                                                                title="Edit Profile"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Link>
                                                            
                                                            {/* Direct Resend Invitation if Pending */}
                                                            {owner.status === 'pending' && (
                                                                <button
                                                                    onClick={() => handleResendInvitation(owner.id)}
                                                                    className="p-1 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
                                                                    title="Resend Invitation"
                                                                >
                                                                    <Send className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}

                                                            {/* Overflow menu */}
                                                            <button
                                                                onClick={() => setMenuOpenId(menuOpenId === owner.id ? null : owner.id)}
                                                                className="p-1 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
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
                                                                            className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
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
                                                                                className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                                            >
                                                                                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                                                                                Grant Resident Role
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={() => {
                                                                                handleDeleteOwner(owner.id);
                                                                                setMenuOpenId(null);
                                                                            }}
                                                                            className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-50 mt-1 pt-2"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                            Delete Landlord
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
                            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 shadow-inner">
                                    <Users className="h-6 w-6" />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">No property owners found</h3>
                                <p className="mt-1 max-w-xs text-xs font-semibold text-slate-400">
                                    {hasActiveFilters 
                                        ? 'No records match your selected criteria. Try resetting or adjusting your search term.' 
                                        : 'Invite your first property owner to map properties, tenants, and track maintenance billing.'}
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
                            <p className="text-xs font-bold text-slate-500">
                                Showing <span className="text-slate-950">{propertyOwners.data.length}</span> of <span className="text-slate-950">{propertyOwners.total}</span> owners
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
                                                    ? 'bg-white text-slate-655 border border-slate-200 hover:bg-slate-50'
                                                    : 'cursor-not-allowed text-slate-300 border border-slate-100 opacity-50'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar Column (25%) */}
                <div className="space-y-6">
                    
                    {/* INVITATION LINK MANAGEMENT */}
                    {inviteLink && (
                        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs ring-1 ring-slate-100/50">
                            <h3 className="text-xs font-black tracking-widest text-slate-450 uppercase mb-3.5">Landlord Invitations</h3>
                            
                            <div className="space-y-4">
                                {/* Token link preview */}
                                <div className="rounded-xl border border-slate-150/70 bg-slate-50/50 p-3 flex flex-col gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Landlord Invite URL</span>
                                    <div className="flex items-center justify-between gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={inviteLink.url}
                                            className="w-full bg-transparent border-0 p-0 text-xs font-semibold text-slate-800 focus:ring-0 truncate"
                                        />
                                        <button
                                            onClick={copyToClipboard}
                                            className="p-1.5 text-slate-450 hover:text-slate-800 hover:bg-slate-150/50 rounded-lg shrink-0 transition"
                                            title="Copy Link"
                                        >
                                            {copied ? <Check className="h-4.5 w-4.5 text-emerald-600" /> : <Copy className="h-4.5 w-4.5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* invitation stats */}
                                <div className="grid grid-cols-2 gap-2 text-center">
                                    <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-2.5">
                                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Usages</span>
                                        <span className="block text-base font-black text-slate-900 mt-1">
                                            {inviteLink.usage_count}
                                        </span>
                                    </div>
                                    <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-2.5">
                                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Limit</span>
                                        <span className="block text-base font-black text-slate-900 mt-1">
                                            {inviteLink.max_usages || '∞'}
                                        </span>
                                    </div>
                                </div>

                                {/* Active toggle / actions */}
                                <div className="border-t border-slate-50 pt-4.5 space-y-2">
                                    <button
                                        onClick={toggleInviteLink}
                                        className={`w-full py-2.5 rounded-xl text-xs font-black tracking-wider uppercase border shadow-xs transition ${
                                            inviteLink.is_active 
                                                ? 'bg-white text-rose-600 border-rose-250 hover:bg-rose-50/50' 
                                                : 'bg-emerald-600 text-white border-transparent hover:bg-emerald-700'
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
                        </div>
                    )}
                </div>
            </div>

            {/* FLOATING BULK ACTIONS TOOLBAR */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4"
                    >
                        <div className="rounded-2xl border border-slate-900/10 bg-slate-950/95 backdrop-blur-md px-6 py-4.5 shadow-xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-xs font-black tracking-wider uppercase text-white">
                                    {selectedIds.length} Selected
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={handleBulkResend}
                                    disabled={isBulkActionRunning}
                                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-black uppercase tracking-wider transition disabled:opacity-40"
                                >
                                    Resend Invites
                                </button>
                                <button
                                    onClick={handleBulkActivate}
                                    disabled={isBulkActionRunning}
                                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-black uppercase tracking-wider transition disabled:opacity-40"
                                >
                                    Activate
                                </button>
                                <button
                                    onClick={handleBulkSuspend}
                                    disabled={isBulkActionRunning}
                                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-black uppercase tracking-wider transition disabled:opacity-40"
                                >
                                    Suspend
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isBulkActionRunning}
                                    className="px-3.5 py-2 rounded-xl bg-red-650 hover:bg-red-700 text-white text-[11px] font-black uppercase tracking-wider transition disabled:opacity-40"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
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
                            <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">Confirm Bulk Removal</h3>
                            <p className="mt-2 text-xs font-semibold text-slate-500 leading-relaxed">
                                You are about to permanently remove {selectedIds.length} property owner(s). This will detach them from the estate records. This action is irreversible.
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
        </AdminLayout>
    );
}
