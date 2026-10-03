import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Building2,
    Plus,
    Pencil,
    Trash2,
    AlertCircle,
    School,
    Church,
    HeartPulse,
    Briefcase,
    Building,
    Loader2,
    Mail,
    Phone,
    Send,
    MoreHorizontal,
    Power,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';
import CustomSelect from '@/Components/UI/CustomSelect';
import FilterBar, { FilterChips } from '@/Components/UI/FilterBar';
import TextInput from '@/Components/UI/TextInput';
import { destroy, index, resendInvitation, store, update } from '@/actions/App/Http/Controllers/Admin/OrganizationController';
import { useDebounce } from '@/Hooks/useDebounce';

export interface OrganizationMembershipItem {
    id: number;
    user_id: number;
    organization_id: number;
    role: string;
    is_active: boolean;
    user?: {
        id: number;
        name: string;
        email: string;
        email_verified_at?: string | null;
        google_id?: string | null;
        profile?: {
            phone?: string | null;
        } | null;
    } | null;
}

export interface PublicWindowItem {
    id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
}

export interface Organization {
    id: number;
    estate_id: number;
    name: string;
    type: 'school' | 'church' | 'hospital' | 'business' | 'facility' | 'other';
    access_policy?: 'unrestricted' | 'public_window' | 'managed';
    is_active: boolean;
    created_at: string;
    updated_at: string;
    memberships?: OrganizationMembershipItem[];
    public_windows?: PublicWindowItem[];
    access_members_count?: number;
}

interface PaginatedOrganizations {
    data: Organization[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    organizations: PaginatedOrganizations;
    filters: {
        search?: string | null;
        type?: string | null;
        status?: string | null;
    };
    summary: {
        total: number;
        pending_invitations: number;
        inactive: number;
    };
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const isInvitationPending = (user?: { email_verified_at?: string | null; google_id?: string | null } | null) =>
    Boolean(user && user.email_verified_at === null && user.google_id === null);

const toMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);

    return h * 60 + (m || 0);
};

type PolicyStatus = { label: string; live: boolean };

/** Plain-language walk-in status; "live" means visitors can arrive right now. */
const policyStatus = (org: Organization, now: Date = new Date()): PolicyStatus => {
    if (org.type === 'hospital' || org.access_policy === 'unrestricted') {
        return { label: 'Open any time', live: true };
    }

    if (org.access_policy === 'public_window') {
        const windows = org.public_windows ?? [];

        if (windows.length === 0) {
            return { label: 'No walk-in hours set', live: false };
        }

        const minutesNow = now.getHours() * 60 + now.getMinutes();
        const open = windows.find(
            (w) => w.day_of_week === now.getDay() && toMinutes(w.start_time) <= minutesNow && minutesNow < toMinutes(w.end_time),
        );

        if (open) {
            return { label: `Open now · until ${formatTime(open.end_time)}`, live: true };
        }

        // Soonest upcoming window, looking a week ahead.
        const upcoming = windows
            .map((w) => {
                let days = (w.day_of_week - now.getDay() + 7) % 7;
                if (days === 0 && toMinutes(w.start_time) <= minutesNow) {
                    days = 7;
                }

                return { w, offset: days * 1440 + toMinutes(w.start_time) };
            })
            .sort((x, y) => x.offset - y.offset)[0].w;

        return { label: `Closed · opens ${DAY_LABELS[upcoming.day_of_week]} ${formatTime(upcoming.start_time)}`, live: false };
    }

    return { label: 'By invitation only', live: false };
};

const TYPE_CONFIG = {
    school: {
        label: 'School',
        icon: School,
        color: 'text-amber-600 bg-amber-50 border-amber-200/60',
        badgeColor: 'text-amber-700 bg-amber-50',
        description: 'Drop-off, parents, teachers & student traffic.',
        isUnrestricted: false,
    },
    church: {
        label: 'Church / Religious',
        icon: Church,
        color: 'text-purple-600 bg-purple-50 border-purple-200/60',
        badgeColor: 'text-purple-700 bg-purple-50',
        description: 'Worship services, choir practice & community gatherings.',
        isUnrestricted: false,
    },
    hospital: {
        label: 'Hospital / Clinic',
        icon: HeartPulse,
        color: 'text-rose-600 bg-rose-50 border-rose-200/60',
        badgeColor: 'text-rose-700 bg-rose-50',
        description: '24/7 patient care, emergencies & clinic visitors.',
        isUnrestricted: true,
    },
    business: {
        label: 'Business / Office',
        icon: Briefcase,
        color: 'text-blue-600 bg-blue-50 border-blue-200/60',
        badgeColor: 'text-blue-700 bg-blue-50',
        description: 'Commercial operations, clients, employees & deliveries.',
        isUnrestricted: false,
    },
    facility: {
        label: 'Estate Facility',
        icon: Building,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200/60',
        badgeColor: 'text-emerald-700 bg-emerald-50',
        description: 'Clubhouse, sports courts, pools & shared community spaces.',
        isUnrestricted: false,
    },
    other: {
        label: 'Other Organization',
        icon: Building2,
        color: 'text-slate-600 bg-slate-50 border-slate-200/60',
        badgeColor: 'text-slate-700 bg-slate-100',
        description: 'Other non-residential operational destinations inside the estate.',
        isUnrestricted: false,
    },
} as const;

/** Format 24h time 'HH:mm' to 'h:mm A' */
function formatTime(timeStr?: string | null): string {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`;
}

export default function OrganizationsIndex({ organizations, filters, summary }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const debouncedSearch = useDebounce(searchQuery, 300);

    // Close overflow menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('[data-overflow-menu]')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Modal & Action states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
    const [resendingInviteId, setResendingInviteId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleResendInvite = (org: Organization) => {
        if (resendingInviteId !== null) return;
        setOpenMenuId(null);

        setResendingInviteId(org.id);
        router.post(
            resendInvitation.url(org.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setResendingInviteId(null);
                },
            },
        );
    };

    const handleToggleActive = (org: Organization) => {
        setOpenMenuId(null);
        router.put(
            update.url(org.id),
            {
                name: org.name,
                type: org.type,
                access_policy: org.access_policy ?? 'managed',
                is_active: !org.is_active,
            },
            { preserveScroll: true },
        );
    };

    // Form state
    const form = useForm({
        name: '',
        type: 'school' as Organization['type'],
        admin_email: '',
        admin_phone: '',
        access_policy: 'managed' as 'unrestricted' | 'public_window' | 'managed',
        is_active: true,
    });

    // Auto-search via debounced query
    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            router.get(
                index.url(),
                {
                    search: debouncedSearch || undefined,
                    type: selectedType !== 'all' ? selectedType : undefined,
                    status: selectedStatus !== 'all' ? selectedStatus : undefined,
                },
                { preserveState: true, replace: true },
            );
        }
    }, [debouncedSearch]);

    const handleTypeFilterChange = (type: string) => {
        setSelectedType(type);
        router.get(
            index.url(),
            {
                search: searchQuery || undefined,
                type: type !== 'all' ? type : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleStatusFilterChange = (status: string) => {
        setSelectedStatus(status);
        router.get(
            index.url(),
            {
                search: searchQuery || undefined,
                type: selectedType !== 'all' ? selectedType : undefined,
                status: status !== 'all' ? status : undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedType('all');
        setSelectedStatus('all');
        router.get(index.url(), {}, { preserveState: true, replace: true });
    };

    const openCreateModal = () => {
        form.reset();
        form.clearErrors();
        form.setData({
            name: '',
            type: 'school',
            admin_email: '',
            admin_phone: '',
            access_policy: 'managed',
            is_active: true,
        });
        setEditingOrg(null);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (org: Organization) => {
        form.clearErrors();
        setEditingOrg(org);
        const primaryAdmin = org.memberships?.find((m) => m.role === 'admin' && m.is_active)?.user;

        form.setData({
            name: org.name,
            type: org.type,
            admin_email: primaryAdmin?.email || '',
            admin_phone: primaryAdmin?.profile?.phone || '',
            access_policy: (org.access_policy ||
                (org.type === 'hospital' ? 'unrestricted' : org.type === 'church' ? 'public_window' : 'managed')) as any,
            is_active: org.is_active,
        });
        setIsCreateModalOpen(true);
    };

    const handleTypeSelect = (newType: Organization['type']) => {
        const config = TYPE_CONFIG[newType];
        form.setData({
            ...form.data,
            type: newType,
            access_policy: config.isUnrestricted
                ? 'unrestricted'
                : form.data.access_policy === 'unrestricted'
                  ? newType === 'church'
                      ? 'public_window'
                      : 'managed'
                  : form.data.access_policy,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const isHospital = form.data.type === 'hospital';
        const effectivePolicy = isHospital ? 'unrestricted' : form.data.access_policy;

        const payload: Record<string, any> = {
            name: form.data.name,
            type: form.data.type,
            admin_email: form.data.admin_email,
            admin_phone: form.data.admin_phone,
            access_policy: effectivePolicy,
            is_active: form.data.is_active,
        };

        setIsSubmitting(true);

        const options = {
            onStart: () => setIsSubmitting(true),
            onFinish: () => setIsSubmitting(false),
            onError: () => setIsSubmitting(false),
            onSuccess: () => {
                setIsSubmitting(false);
                setIsCreateModalOpen(false);
                setEditingOrg(null);
                form.reset();
            },
        };

        if (editingOrg) {
            router.put(update.url(editingOrg.id), payload, options);
        } else {
            router.post(store.url(), payload, options);
        }
    };

    const handleDelete = () => {
        if (!deletingOrg) return;
        router.delete(destroy.url(deletingOrg.id), {
            onSuccess: () => setDeletingOrg(null),
        });
    };

    const isFiltered = Boolean(searchQuery || (selectedType && selectedType !== 'all') || (selectedStatus && selectedStatus !== 'all'));

    const orgGroups = (Object.keys(TYPE_CONFIG) as Organization['type'][])
        .map((type) => ({ type, orgs: organizations.data.filter((org) => (TYPE_CONFIG[org.type] ? org.type : 'other') === type) }))
        .filter((group) => group.orgs.length > 0);
    const isZeroData = organizations.total === 0 && !isFiltered;
    const isSearchEmpty = organizations.total === 0 && isFiltered;

    const currentTypeConfig = TYPE_CONFIG[form.data.type] || TYPE_CONFIG.other;

    return (
        <>
            <Head title="Organizations" />

            <div className="space-y-6 pb-20">
                {/* Page Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Organizations</h1>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Manage organizations operating within the estate and their access rules.
                        </p>
                    </div>

                    {!isZeroData && (
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-98"
                        >
                            <Plus className="h-4 w-4" />
                            Add Organization
                        </button>
                    )}
                </div>

                {!isZeroData && (
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>
                            <span className="font-bold text-slate-900">{summary.total}</span> organization{summary.total !== 1 ? 's' : ''}
                        </span>
                        {summary.pending_invitations > 0 && (
                            <button
                                type="button"
                                onClick={() => handleStatusFilterChange('pending')}
                                className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-800 transition hover:bg-amber-100"
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                {summary.pending_invitations} invitation{summary.pending_invitations !== 1 ? 's' : ''} pending
                            </button>
                        )}
                        {summary.inactive > 0 && <span>{summary.inactive} inactive</span>}
                    </p>
                )}

                {/* Zero State (No records created yet) */}
                {isZeroData ? (
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xs sm:p-12">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-slate-900">No organizations yet</h3>
                        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
                            Add schools, churches, hospitals, or other organizations that operate within this estate. Organizations can manage
                            recurring access while Security retains control of admission.
                        </p>
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4.5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-98"
                            >
                                <Plus className="h-4 w-4" />
                                Add Organization
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-3">
                            <FilterBar
                                search={searchQuery}
                                onSearch={setSearchQuery}
                                placeholder="Search organizations"
                                searchLabel="Search organizations by name"
                                activeCount={[selectedType, selectedStatus].filter((v) => v !== 'all').length}
                                hasActive={isFiltered}
                                onReset={handleClearFilters}
                            >
                                <FilterChips
                                    label="Type"
                                    value={selectedType}
                                    onChange={handleTypeFilterChange}
                                    options={[
                                        { value: 'all', label: 'All' },
                                        { value: 'school', label: 'Schools' },
                                        { value: 'church', label: 'Churches' },
                                        { value: 'hospital', label: 'Hospitals' },
                                        { value: 'business', label: 'Business' },
                                        { value: 'facility', label: 'Facilities' },
                                        { value: 'other', label: 'Other' },
                                    ]}
                                />
                                <FilterChips
                                    label="Status"
                                    value={selectedStatus}
                                    onChange={handleStatusFilterChange}
                                    options={[
                                        { value: 'all', label: 'All' },
                                        { value: 'active', label: 'Active' },
                                        { value: 'pending', label: 'Pending' },
                                        { value: 'inactive', label: 'Inactive' },
                                    ]}
                                />
                            </FilterBar>

                            {/* Result Counter when filtering */}
                            {isFiltered && !isSearchEmpty && (
                                <p className="text-[11px] font-medium text-slate-500">
                                    Showing {organizations.total} organization{organizations.total !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>

                        {/* No Search Results */}
                        {isSearchEmpty ? (
                            <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center">
                                <p className="text-xs font-semibold text-slate-700">No organizations match your filters.</p>
                                <p className="mt-1 text-[11px] text-slate-400">Try searching by a different name or clear current filter options.</p>
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            /* Operational Directory, grouped by type */
                            <div className="space-y-6">
                                {orgGroups.map((group) => (
                                    <section key={group.type} aria-label={TYPE_CONFIG[group.type].label}>
                                        <h2 className="mb-2 flex items-center gap-2 px-1 text-[11px] font-black tracking-widest text-slate-500 uppercase">
                                            {TYPE_CONFIG[group.type].label}
                                            {organizations.last_page === 1 && (
                                                <span className="font-semibold text-slate-400">{group.orgs.length}</span>
                                            )}
                                        </h2>
                                        <div className="divide-y divide-slate-100 overflow-visible rounded-2xl border border-slate-100 bg-white shadow-xs">
                                            {group.orgs.map((org) => {
                                                const config = TYPE_CONFIG[org.type] || TYPE_CONFIG.other;
                                                const IconComponent = config.icon;
                                                const primaryAdmin = org.memberships?.find((m) => m.role === 'admin' && m.is_active)?.user;
                                                const hasPendingInvitation = isInvitationPending(primaryAdmin);

                                                return (
                                                    <article
                                                        key={org.id}
                                                        className="group relative flex items-start gap-4 p-4.5 transition-colors hover:bg-slate-50/70 sm:px-5"
                                                    >
                                                        {/* Organization Type Icon */}
                                                        <div
                                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${config.color} mt-0.5`}
                                                        >
                                                            <IconComponent className="h-4.5 w-4.5" />
                                                        </div>

                                                        {/* Central Operational Details */}
                                                        <div className="min-w-0 flex-1">
                                                            {/* Header: Name, Type, Status */}
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <h3 className="truncate text-sm font-bold text-slate-900">{org.name}</h3>
                                                                    </div>
                                                                </div>

                                                                {/* Status shown only when it needs attention; "Active" is the default and adds no signal */}
                                                                <div
                                                                    className={`shrink-0 items-center gap-1.5 pt-0.5 ${hasPendingInvitation || !org.is_active ? 'flex' : 'hidden'}`}
                                                                >
                                                                    <span
                                                                        className={`h-2 w-2 rounded-full ${
                                                                            hasPendingInvitation
                                                                                ? 'bg-amber-500'
                                                                                : org.is_active
                                                                                  ? 'bg-emerald-500'
                                                                                  : 'bg-slate-300'
                                                                        }`}
                                                                    />
                                                                    <span
                                                                        className={`text-[11px] font-semibold ${
                                                                            hasPendingInvitation
                                                                                ? 'text-amber-700'
                                                                                : org.is_active
                                                                                  ? 'text-emerald-700'
                                                                                  : 'text-slate-400'
                                                                        }`}
                                                                    >
                                                                        {hasPendingInvitation ? 'Pending' : org.is_active ? 'Active' : 'Inactive'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Single Policy-Aware Prose Operational Detail */}
                                                            {(() => {
                                                                const policy = policyStatus(org);
                                                                const members = org.access_members_count ?? 0;

                                                                return (
                                                                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-600">
                                                                        <span className="inline-flex items-center gap-1.5">
                                                                            <span
                                                                                className={`h-1.5 w-1.5 rounded-full ${policy.live ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                                            />
                                                                            <span className={policy.live ? 'font-semibold text-emerald-700' : ''}>
                                                                                {policy.label}
                                                                            </span>
                                                                        </span>
                                                                        <span className="text-slate-300 sm:hidden">·</span>
                                                                        <span className="sm:hidden">
                                                                            {members} member{members !== 1 ? 's' : ''}
                                                                        </span>
                                                                    </p>
                                                                );
                                                            })()}

                                                            {/* Admin Information */}
                                                            {primaryAdmin && (
                                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                                                        <Mail className="h-3 w-3 text-slate-400" />
                                                                        {primaryAdmin.email}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Members */}
                                                        <div className="hidden w-24 shrink-0 self-center text-right sm:block">
                                                            <p className="text-sm font-bold text-slate-900">{org.access_members_count ?? 0}</p>
                                                            <p className="text-[11px] text-slate-500">members</p>
                                                        </div>

                                                        {primaryAdmin && hasPendingInvitation && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleResendInvite(org)}
                                                                disabled={resendingInviteId === org.id}
                                                                className="hidden shrink-0 items-center gap-1.5 self-center rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50 sm:inline-flex"
                                                            >
                                                                {resendingInviteId === org.id ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    <Send className="h-3 w-3" />
                                                                )}
                                                                Resend invite
                                                            </button>
                                                        )}

                                                        {/* Overflow Actions Menu */}
                                                        <div
                                                            className="relative shrink-0 self-center"
                                                            data-overflow-menu
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => setOpenMenuId(openMenuId === org.id ? null : org.id)}
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                                                title="Organization actions"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </button>

                                                            {openMenuId === org.id && (
                                                                <div className="absolute top-full right-0 z-30 mt-1 w-48 rounded-xl border border-slate-200/80 bg-white py-1 shadow-lg shadow-slate-900/5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setOpenMenuId(null);
                                                                            openEditModal(org);
                                                                        }}
                                                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                                                    >
                                                                        <Pencil className="h-3.5 w-3.5 text-slate-400" />
                                                                        Edit
                                                                    </button>

                                                                    {primaryAdmin && hasPendingInvitation && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleResendInvite(org)}
                                                                            disabled={resendingInviteId === org.id}
                                                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                                                                        >
                                                                            {resendingInviteId === org.id ? (
                                                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                                                                            ) : (
                                                                                <Send className="h-3.5 w-3.5 text-slate-400" />
                                                                            )}
                                                                            Resend Invitation
                                                                        </button>
                                                                    )}

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleActive(org)}
                                                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                                                    >
                                                                        <Power className="h-3.5 w-3.5 text-slate-400" />
                                                                        {org.is_active ? 'Deactivate' : 'Activate'}
                                                                    </button>

                                                                    <div className="my-1 border-t border-slate-100" />

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setOpenMenuId(null);
                                                                            setDeletingOrg(org);
                                                                        }}
                                                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {organizations.last_page > 1 && (
                            <div className="flex items-center justify-between px-2 pt-2 text-xs font-medium text-slate-500">
                                <div>
                                    Page {organizations.current_page} of {organizations.last_page}
                                </div>
                                <div className="flex items-center gap-1">
                                    {organizations.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || '#'}
                                            preserveScroll
                                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                                                link.active
                                                    ? 'bg-slate-900 text-white'
                                                    : link.url
                                                      ? 'text-slate-600 hover:bg-slate-100'
                                                      : 'cursor-not-allowed text-slate-300'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create / Edit Organization Dialog (Wide Two-Column Recomposition) */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="4xl">
                <form onSubmit={handleSubmit} className="flex flex-col">
                    {/* Header */}
                    <div className="border-b border-slate-100 px-7 py-5 pr-14">
                        <h2 className="text-lg font-bold text-slate-900">{editingOrg ? 'Edit Organization' : 'Add Organization'}</h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            {editingOrg
                                ? 'Update details, access policy, and operating schedules.'
                                : 'Set up a school, church, medical centre or facility operating within the estate.'}
                        </p>
                    </div>

                    {/* Two-Column Workspace Body */}
                    <div className="grid min-h-[460px] grid-cols-1 lg:grid-cols-12">
                        {/* LEFT COLUMN: User Decisions (7 cols) */}
                        <div className="max-h-[72vh] space-y-7 overflow-y-auto p-7 lg:col-span-7">
                            {/* Section 1: Organization */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-900">Organization</h3>

                                <div>
                                    <TextInput
                                        label="Organization name"
                                        required
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        placeholder="e.g. St Matthew's High School"
                                        error={form.errors.name}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Organization type <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(Object.keys(TYPE_CONFIG) as Array<Organization['type']>).map((typeKey) => {
                                            const cfg = TYPE_CONFIG[typeKey];
                                            const isSelected = form.data.type === typeKey;
                                            const TypeIcon = cfg.icon;

                                            return (
                                                <button
                                                    key={typeKey}
                                                    type="button"
                                                    onClick={() => handleTypeSelect(typeKey)}
                                                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                                                        isSelected
                                                            ? 'border-slate-900 bg-slate-900 text-white'
                                                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <TypeIcon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                                                    <span className="truncate text-xs font-medium">{cfg.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Section: Organization Administrator */}
                            <div className="space-y-4 border-t border-slate-100 pt-5">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">Organization Administrator</h3>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Assign the primary contact or lead administrator who manages this organization.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <TextInput
                                                label="Organization Email"
                                                type="email"
                                                icon={Mail}
                                                value={form.data.admin_email}
                                                onChange={(e) => form.setData('admin_email', e.target.value)}
                                                placeholder="e.g. admin@school.org"
                                                error={form.errors.admin_email}
                                            />
                                        </div>

                                        <div>
                                            <TextInput
                                                label="Phone Number"
                                                type="tel"
                                                icon={Phone}
                                                value={form.data.admin_phone}
                                                onChange={(e) => form.setData('admin_phone', e.target.value)}
                                                placeholder="e.g. +234 801 234 5678"
                                                error={form.errors.admin_phone}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-600">
                                        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                                        <p className="leading-relaxed">
                                            This email address will be used for the organization's account authentication and login credentials.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Access & Policy */}
                            <div className="space-y-4 border-t border-slate-100 pt-5">
                                <h3 className="text-sm font-semibold text-slate-900">Access & Admission Policy</h3>

                                {form.data.type === 'hospital' ? (
                                    <div className="rounded-lg border border-rose-100 bg-rose-50 p-3.5 text-xs leading-relaxed text-rose-800">
                                        <span className="mb-0.5 block font-semibold">Unrestricted medical destination</span>
                                        Walk-ins are admitted any time. Security photographs the visitor's ID and issues an entry tag.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <CustomSelect
                                                label="Access Policy"
                                                value={form.data.access_policy}
                                                onChange={(val) => form.setData('access_policy', val as any)}
                                                options={[
                                                    {
                                                        value: 'managed',
                                                        label: 'No walk-ins',
                                                        description: 'Only members and visitors with a pass are admitted',
                                                    },
                                                    {
                                                        value: 'public_window',
                                                        label: 'Walk-ins during their hours',
                                                        description: 'The organization sets its own walk-in hours',
                                                    },
                                                    {
                                                        value: 'unrestricted',
                                                        label: 'Walk-ins any time',
                                                        description: 'Always open, e.g. hospitals and clinics',
                                                    },
                                                ]}
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {form.data.type !== 'hospital' && form.data.access_policy === 'public_window' && (
                                <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-600">
                                    <span className="mb-0.5 block font-semibold text-slate-900">Walk-in hours</span>
                                    The organization's admin sets its walk-in hours from their Profile, and can switch between no walk-ins and
                                    walk-ins during their hours. Only you can allow walk-ins at any time. Until hours are set, walk-ins are turned
                                    away.
                                </div>
                            )}

                            {/* Edit Mode Only: Active Status Toggle */}
                            {editingOrg && (
                                <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
                                    <div className="flex-1 pr-2">
                                        <span className="block text-xs font-medium text-slate-900">Active status</span>
                                        <span className="block text-xs leading-relaxed text-slate-500">
                                            Deactivated organizations are hidden from security terminals
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={form.data.is_active}
                                        onClick={() => form.setData('is_active', !form.data.is_active)}
                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            form.data.is_active ? 'bg-emerald-600' : 'bg-slate-200'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                                form.data.is_active ? 'translate-x-4' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: Calm Live Summary (5 cols) */}
                        <div className="flex flex-col justify-between border-t border-slate-100 bg-slate-50 p-7 lg:col-span-5 lg:border-t-0 lg:border-l">
                            <div className="space-y-6">
                                <div>
                                    <span className="text-xs font-semibold text-slate-400">Access summary</span>
                                    <h4 className="mt-1 truncate text-base font-semibold text-slate-900">
                                        {form.data.name.trim() || 'New organization'}
                                    </h4>
                                    <div className="mt-1 flex items-center gap-1.5">
                                        <span className="text-xs font-medium text-slate-700">{currentTypeConfig.label}</span>
                                        <span className="text-xs text-slate-400">·</span>
                                        <span className="text-xs text-slate-500">
                                            {form.data.type === 'hospital' || form.data.access_policy === 'unrestricted'
                                                ? 'Walk-ins any time'
                                                : form.data.access_policy === 'public_window'
                                                  ? 'Walk-ins during their hours'
                                                  : 'No walk-ins'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 text-xs">
                                    <div>
                                        <span className="mb-0.5 block font-medium text-slate-400">Policy</span>
                                        <p className="leading-relaxed text-slate-700">
                                            {form.data.type === 'hospital' || form.data.access_policy === 'unrestricted'
                                                ? 'Walk-ins admitted any time'
                                                : form.data.access_policy === 'public_window'
                                                  ? 'Walk-ins admitted during the hours the organization sets'
                                                  : 'No walk-ins; members and pass holders only'}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="mb-0.5 block font-medium text-slate-400">Organization Login Email</span>
                                        {form.data.admin_email.trim() ? (
                                            <div>
                                                <p className="font-medium text-slate-800">{form.data.admin_email.trim()}</p>
                                                {form.data.admin_phone.trim() && <p className="text-slate-400">{form.data.admin_phone.trim()}</p>}
                                            </div>
                                        ) : (
                                            <p className="text-slate-500">Not assigned (can be added later)</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className="mt-8 text-xs leading-relaxed text-slate-400">
                                Gate terminals use this policy when processing visitors arriving for this organization.
                            </p>
                        </div>
                    </div>

                    {/* Stable Action Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-white px-7 py-4">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="rounded-xl border border-slate-200 bg-white px-4.5 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || form.processing}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {(isSubmitting || form.processing) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {isSubmitting || form.processing
                                ? editingOrg
                                    ? 'Saving changes...'
                                    : 'Creating...'
                                : editingOrg
                                  ? 'Save Changes'
                                  : 'Create Organization'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={Boolean(deletingOrg)} onClose={() => setDeletingOrg(null)} maxWidth="sm">
                <div className="p-6 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                        <AlertCircle className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3.5 text-base font-bold text-slate-900">Delete Organization?</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                        Are you sure you want to remove <span className="font-semibold text-slate-800">{deletingOrg?.name}</span>? All past visitor
                        access logs and historical records will remain preserved.
                    </p>
                    <div className="mt-6 flex justify-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => setDeletingOrg(null)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
                        >
                            Confirm Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
