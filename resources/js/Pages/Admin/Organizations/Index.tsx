import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Building2,
    Plus,
    Search,
    Clock,
    Zap,
    Shield,
    Pencil,
    Trash2,
    Check,
    X,
    AlertCircle,
    ChevronRight,
    School,
    Church,
    HeartPulse,
    Briefcase,
    Building,
    SlidersHorizontal,
    Loader2,
    Calendar,
    ArrowRight,
    MapPin,
    AlertTriangle,
    User as UserIcon,
    Mail,
    Phone,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import Modal from '@/Components/Modal';
import CustomSelect from '@/Components/UI/CustomSelect';
import { destroy, index, store, update } from '@/actions/App/Http/Controllers/Admin/OrganizationController';
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
        profile?: {
            phone?: string | null;
        } | null;
    } | null;
}

export interface Organization {
    id: number;
    estate_id: number;
    name: string;
    type: 'school' | 'church' | 'hospital' | 'business' | 'facility' | 'other';
    access_policy?: 'unrestricted' | 'public_window' | 'managed';
    arrival_confirmation_required?: boolean;
    confirmation_window_minutes?: number;
    confirmation_escalation?: 'alert_only' | 'flag_security';
    operating_hours: {
        open?: string;
        close?: string;
        days?: string[];
        [key: string]: any;
    } | null;
    hours_enforcement: 'inherit' | 'off' | 'warn' | 'block';
    quick_entry_enabled: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    memberships?: OrganizationMembershipItem[];
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
    };
}

const TYPE_CONFIG = {
    school: {
        label: 'School',
        icon: School,
        color: 'text-amber-600 bg-amber-50 border-amber-200/60',
        badgeColor: 'text-amber-700 bg-amber-50',
        description: 'Drop-off, parents, teachers & student traffic.',
        defaultAccess: 'Managed organization access. Eligible parents and staff are logged or admitted through Quick Entry.',
        defaultHours: { open: '07:30', close: '16:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
        isUnrestricted: false,
    },
    church: {
        label: 'Church / Religious',
        icon: Church,
        color: 'text-purple-600 bg-purple-50 border-purple-200/60',
        badgeColor: 'text-purple-700 bg-purple-50',
        description: 'Worship services, choir practice & community gatherings.',
        defaultAccess: 'Managed organization access during service days and fellowship hours.',
        defaultHours: { open: '08:00', close: '20:00', days: ['wednesday', 'friday', 'sunday'] },
        isUnrestricted: false,
    },
    hospital: {
        label: 'Hospital / Clinic',
        icon: HeartPulse,
        color: 'text-rose-600 bg-rose-50 border-rose-200/60',
        badgeColor: 'text-rose-700 bg-rose-50',
        description: '24/7 patient care, emergencies & clinic visitors.',
        defaultAccess: 'Unrestricted destination. Visitors cannot be turned away solely due to missing credentials.',
        defaultHours: null,
        isUnrestricted: true,
    },
    business: {
        label: 'Business / Office',
        icon: Briefcase,
        color: 'text-blue-600 bg-blue-50 border-blue-200/60',
        badgeColor: 'text-blue-700 bg-blue-50',
        description: 'Commercial operations, clients, employees & deliveries.',
        defaultAccess: 'Standard commercial schedule with operational gate logging.',
        defaultHours: { open: '08:00', close: '18:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
        isUnrestricted: false,
    },
    facility: {
        label: 'Estate Facility',
        icon: Building,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200/60',
        badgeColor: 'text-emerald-700 bg-emerald-50',
        description: 'Clubhouse, sports courts, pools & shared community spaces.',
        defaultAccess: 'Estate-operated facility accessible to verified residents and authorized guests.',
        defaultHours: { open: '07:00', close: '21:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
        isUnrestricted: false,
    },
    other: {
        label: 'Other Organization',
        icon: Building2,
        color: 'text-slate-600 bg-slate-50 border-slate-200/60',
        badgeColor: 'text-slate-700 bg-slate-100',
        description: 'Other non-residential operational destinations inside the estate.',
        defaultAccess: 'Operational gate logging according to estate standards.',
        defaultHours: { open: '08:00', close: '18:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
        isUnrestricted: false,
    },
} as const;

const DAYS = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' },
];

/** Format 24h time 'HH:mm' to 'h:mm A' */
function formatTime(timeStr?: string | null): string {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`;
}

export default function OrganizationsIndex({ organizations, filters }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || 'all');
    const debouncedSearch = useDebounce(searchQuery, 300);

    // Modal & Action states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const form = useForm({
        name: '',
        type: 'school' as Organization['type'],
        admin_name: '',
        admin_email: '',
        admin_phone: '',
        access_policy: 'managed' as 'unrestricted' | 'public_window' | 'managed',
        arrival_confirmation_required: false,
        confirmation_window_minutes: 30,
        confirmation_escalation: 'alert_only' as 'alert_only' | 'flag_security',
        has_hours: true,
        open_time: '07:30',
        close_time: '16:00',
        selected_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        hours_enforcement: 'inherit' as Organization['hours_enforcement'],
        quick_entry_enabled: true,
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
            },
            { preserveState: true, replace: true },
        );
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedType('all');
        router.get(index.url(), {}, { preserveState: true, replace: true });
    };

    const openCreateModal = () => {
        form.reset();
        form.clearErrors();
        form.setData({
            name: '',
            type: 'school',
            admin_name: '',
            admin_email: '',
            admin_phone: '',
            access_policy: 'managed',
            arrival_confirmation_required: false,
            confirmation_window_minutes: 30,
            confirmation_escalation: 'alert_only',
            has_hours: true,
            open_time: '07:30',
            close_time: '16:00',
            selected_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            hours_enforcement: 'inherit',
            quick_entry_enabled: true,
            is_active: true,
        });
        setEditingOrg(null);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (org: Organization) => {
        form.clearErrors();
        setEditingOrg(org);
        const hours = org.operating_hours;
        const primaryAdmin = org.memberships?.find((m) => m.role === 'admin' && m.is_active)?.user;

        form.setData({
            name: org.name,
            type: org.type,
            admin_name: primaryAdmin?.name || '',
            admin_email: primaryAdmin?.email || '',
            admin_phone: primaryAdmin?.profile?.phone || '',
            access_policy: (org.access_policy ||
                (org.type === 'hospital' ? 'unrestricted' : org.type === 'church' ? 'public_window' : 'managed')) as any,
            arrival_confirmation_required: Boolean(org.arrival_confirmation_required),
            confirmation_window_minutes: org.confirmation_window_minutes ?? 30,
            confirmation_escalation: (org.confirmation_escalation || 'alert_only') as any,
            has_hours: Boolean(hours && hours.open && hours.close),
            open_time: hours?.open || '08:00',
            close_time: hours?.close || '17:00',
            selected_days: hours?.days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            hours_enforcement: org.hours_enforcement || 'inherit',
            quick_entry_enabled: org.quick_entry_enabled,
            is_active: org.is_active,
        });
        setIsCreateModalOpen(true);
    };

    const handleTypeSelect = (newType: Organization['type']) => {
        const config = TYPE_CONFIG[newType];
        if (config.isUnrestricted) {
            form.setData({
                ...form.data,
                type: newType,
                access_policy: 'unrestricted',
                arrival_confirmation_required: false,
                has_hours: false,
                hours_enforcement: 'off',
                quick_entry_enabled: true,
            });
        } else if (config.defaultHours) {
            form.setData({
                ...form.data,
                type: newType,
                access_policy:
                    form.data.access_policy === 'unrestricted' ? (newType === 'church' ? 'public_window' : 'managed') : form.data.access_policy,
                has_hours: true,
                open_time: config.defaultHours.open,
                close_time: config.defaultHours.close,
                selected_days: [...config.defaultHours.days],
                hours_enforcement: 'inherit',
            });
        } else {
            form.setData({
                ...form.data,
                type: newType,
                access_policy:
                    form.data.access_policy === 'unrestricted' ? (newType === 'church' ? 'public_window' : 'managed') : form.data.access_policy,
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const isHospital = form.data.type === 'hospital';
        const effectivePolicy = isHospital ? 'unrestricted' : form.data.access_policy;

        const payload: Record<string, any> = {
            name: form.data.name,
            type: form.data.type,
            admin_name: form.data.admin_name,
            admin_email: form.data.admin_email,
            admin_phone: form.data.admin_phone,
            access_policy: effectivePolicy,
            arrival_confirmation_required: effectivePolicy === 'unrestricted' ? false : form.data.arrival_confirmation_required,
            confirmation_window_minutes: form.data.confirmation_window_minutes,
            confirmation_escalation: form.data.confirmation_escalation,
            hours_enforcement: isHospital ? 'off' : form.data.hours_enforcement,
            quick_entry_enabled: form.data.quick_entry_enabled,
            is_active: form.data.is_active,
            operating_hours:
                !isHospital && form.data.has_hours
                    ? {
                          open: form.data.open_time,
                          close: form.data.close_time,
                          days: form.data.selected_days,
                      }
                    : null,
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

    const toggleDay = (dayKey: string) => {
        const current = [...form.data.selected_days];
        const index = current.indexOf(dayKey);
        if (index > -1) {
            if (current.length > 1) {
                current.splice(index, 1);
            }
        } else {
            current.push(dayKey);
        }
        form.setData('selected_days', current);
    };

    const setDaysPreset = (preset: 'weekdays' | 'daily' | 'weekends') => {
        if (preset === 'weekdays') {
            form.setData('selected_days', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
        } else if (preset === 'daily') {
            form.setData('selected_days', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
        } else if (preset === 'weekends') {
            form.setData('selected_days', ['saturday', 'sunday']);
        }
    };

    const isFiltered = Boolean(searchQuery || (selectedType && selectedType !== 'all'));
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
                        {/* Compact Utility Row (Search & Filter) */}
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute top-2.5 left-3.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search organizations..."
                                    className="w-full rounded-xl border-slate-200 py-2 pr-4 pl-9 text-xs font-semibold placeholder:text-slate-400 focus:border-slate-800 focus:ring-slate-800"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute top-2.5 right-3 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            <div className="flex min-w-[150px] items-center gap-2">
                                <CustomSelect
                                    value={selectedType}
                                    onChange={(val) => handleTypeFilterChange(String(val))}
                                    options={[
                                        { value: 'all', label: 'All Types' },
                                        { value: 'school', label: 'School' },
                                        { value: 'church', label: 'Church' },
                                        { value: 'hospital', label: 'Hospital' },
                                        { value: 'business', label: 'Business' },
                                        { value: 'facility', label: 'Facility' },
                                        { value: 'other', label: 'Other' },
                                    ]}
                                    size="sm"
                                    buttonClassName="h-10 text-xs font-semibold"
                                />
                            </div>
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
                            /* Organization Rows List */
                            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                                {organizations.data.map((org) => {
                                    const config = TYPE_CONFIG[org.type] || TYPE_CONFIG.other;
                                    const IconComponent = config.icon;
                                    const hours = org.operating_hours;
                                    const hasHours = Boolean(hours?.open && hours?.close);
                                    const primaryAdmin = org.memberships?.find((m) => m.role === 'admin' && m.is_active)?.user;

                                    return (
                                        <div
                                            key={org.id}
                                            className="group flex flex-col gap-3 p-4 transition-colors hover:bg-slate-50/60 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5"
                                        >
                                            {/* Organization Primary Info */}
                                            <div className="flex min-w-0 items-start gap-3.5 sm:items-center">
                                                <div
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${config.color}`}
                                                >
                                                    <IconComponent className="h-4 w-4" />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="truncate font-bold text-slate-900">{org.name}</span>
                                                        <span
                                                            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${config.badgeColor}`}
                                                        >
                                                            {config.label}
                                                        </span>
                                                        {!org.is_active && (
                                                            <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                                                Inactive
                                                            </span>
                                                        )}
                                                        {primaryAdmin && (
                                                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                                                <UserIcon className="h-2.5 w-2.5 text-slate-400" />
                                                                Admin: {primaryAdmin.name}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Operational Context Line */}
                                                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                                        {org.type === 'hospital' ? (
                                                            <span className="flex items-center gap-1 font-medium text-rose-700">
                                                                Unrestricted destination · 24/7 Access
                                                            </span>
                                                        ) : hasHours ? (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3 text-slate-400" />
                                                                <span>
                                                                    {formatTime(hours?.open)} – {formatTime(hours?.close)}
                                                                </span>
                                                                {org.hours_enforcement === 'block' && (
                                                                    <span className="ml-1 text-[11px] font-medium text-rose-600">· Strict hours</span>
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span>Standard access schedule</span>
                                                        )}

                                                        {org.quick_entry_enabled && (
                                                            <span className="flex items-center gap-1 font-medium text-indigo-600">
                                                                <Zap className="h-3 w-3 fill-indigo-500/20" />
                                                                Quick Entry active
                                                            </span>
                                                        )}

                                                        {org.arrival_confirmation_required && (
                                                            <span className="flex items-center gap-1 font-medium text-emerald-700">
                                                                <Check className="h-3 w-3 text-emerald-600" />
                                                                Confirmation ({org.confirmation_window_minutes ?? 30}m)
                                                            </span>
                                                        )}

                                                        {org.access_policy === 'managed' && (
                                                            <span className="flex items-center gap-1 font-medium text-purple-700">
                                                                <Shield className="h-3 w-3 text-purple-600" />
                                                                Managed roster
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Row Actions */}
                                            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 pt-2 sm:border-0 sm:pt-0">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(org)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900"
                                                >
                                                    <Pencil className="h-3.5 w-3.5 text-slate-400" />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingOrg(org)}
                                                    className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                                    title="Delete organization"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
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
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                        Organization name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        placeholder="e.g. St Matthew's High School"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs transition-all placeholder:font-normal placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-hidden"
                                    />
                                    {form.errors.name && <p className="mt-1.5 text-xs font-medium text-rose-600">{form.errors.name}</p>}
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
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                            Admin Full Name
                                        </label>
                                        <div className="relative">
                                            <UserIcon className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                            <input
                                                type="text"
                                                value={form.data.admin_name}
                                                onChange={(e) => form.setData('admin_name', e.target.value)}
                                                placeholder="e.g. Dr. Samuel Adeyemi"
                                                className="w-full rounded-xl border-slate-200 py-2 pr-3.5 pl-9 text-xs font-medium placeholder:text-slate-400 focus:border-slate-800 focus:ring-slate-800"
                                            />
                                        </div>
                                        {form.errors.admin_name && (
                                            <p className="mt-1.5 text-xs font-medium text-rose-600">{form.errors.admin_name}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                                Admin Email Address
                                            </label>
                                            <div className="relative">
                                                <Mail className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                                <input
                                                    type="email"
                                                    value={form.data.admin_email}
                                                    onChange={(e) => form.setData('admin_email', e.target.value)}
                                                    placeholder="e.g. admin@school.org"
                                                    className="w-full rounded-xl border-slate-200 py-2 pr-3.5 pl-9 text-xs font-medium placeholder:text-slate-400 focus:border-slate-800 focus:ring-slate-800"
                                                />
                                            </div>
                                            {form.errors.admin_email && (
                                                <p className="mt-1.5 text-xs font-medium text-rose-600">{form.errors.admin_email}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                                Admin Phone <span className="font-normal text-slate-400">(optional)</span>
                                            </label>
                                            <div className="relative">
                                                <Phone className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                                <input
                                                    type="tel"
                                                    value={form.data.admin_phone}
                                                    onChange={(e) => form.setData('admin_phone', e.target.value)}
                                                    placeholder="e.g. +234 801 234 5678"
                                                    className="w-full rounded-xl border-slate-200 py-2 pr-3.5 pl-9 text-xs font-medium placeholder:text-slate-400 focus:border-slate-800 focus:ring-slate-800"
                                                />
                                            </div>
                                            {form.errors.admin_phone && (
                                                <p className="mt-1.5 text-xs font-medium text-rose-600">{form.errors.admin_phone}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Access & Policy */}
                            <div className="space-y-4 border-t border-slate-100 pt-5">
                                <h3 className="text-sm font-semibold text-slate-900">Access & Admission Policy</h3>

                                {form.data.type === 'hospital' ? (
                                    <div className="rounded-lg border border-rose-100 bg-rose-50 p-3.5 text-xs leading-relaxed text-rose-800">
                                        <span className="mb-0.5 block font-semibold">Unrestricted medical destination</span>
                                        Security logs visitor details and generates an entry tag immediately 24/7. Physical arrival confirmation is never required.
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
                                                        label: 'Managed Access',
                                                        description: 'Staff, students, and roster members admitted',
                                                    },
                                                    {
                                                        value: 'public_window',
                                                        label: 'Public Schedule',
                                                        description: 'Admit visitors during defined operating hours & windows',
                                                    },
                                                    {
                                                        value: 'unrestricted',
                                                        label: 'Unrestricted Entry',
                                                        description: 'Guard issues an entry tag (no arrival confirmation required)',
                                                    },
                                                ]}
                                                size="sm"
                                            />
                                        </div>

                                        <div>
                                            <CustomSelect
                                                label="Outside normal hours"
                                                value={form.data.hours_enforcement}
                                                onChange={(val) => form.setData('hours_enforcement', val as any)}
                                                options={[
                                                    {
                                                        value: 'inherit',
                                                        label: 'Follow estate default',
                                                        description: 'Inherit estate-wide policy outside schedule',
                                                    },
                                                    {
                                                        value: 'warn',
                                                        label: 'Warn & require confirmation',
                                                        description: 'Notify guard and prompt for admission confirmation',
                                                    },
                                                    {
                                                        value: 'block',
                                                        label: 'Strictly block visitors',
                                                        description: 'Disallow non-emergency entry outside schedule',
                                                    },
                                                    {
                                                        value: 'off',
                                                        label: 'Off (informational only)',
                                                        description: 'Gate logging only without warnings or blocks',
                                                    },
                                                ]}
                                                size="sm"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between gap-4 py-1">
                                            <div className="flex-1 pr-2">
                                                <span className="block text-xs font-medium text-slate-900">Quick Entry</span>
                                                <span className="block text-xs text-slate-500 leading-relaxed">
                                                    Allow guards to admit visitors with quick physical tags without a resident code
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={form.data.quick_entry_enabled}
                                                onClick={() => form.setData('quick_entry_enabled', !form.data.quick_entry_enabled)}
                                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                    form.data.quick_entry_enabled ? 'bg-slate-900' : 'bg-slate-200'
                                                }`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                                        form.data.quick_entry_enabled ? 'translate-x-4' : 'translate-x-0'
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Arrival Confirmation Settings (Progressive Disclosure) */}
                                        {form.data.access_policy !== 'unrestricted' && (
                                            <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex-1 pr-2">
                                                        <span className="block text-xs font-semibold text-slate-900">
                                                            Require Arrival Confirmation
                                                        </span>
                                                        <span className="block text-[11px] text-slate-500 leading-relaxed">
                                                            Organization admin verifies visitor reached premises (checkout is never blocked)
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={form.data.arrival_confirmation_required}
                                                        onClick={() =>
                                                            form.setData('arrival_confirmation_required', !form.data.arrival_confirmation_required)
                                                        }
                                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                            form.data.arrival_confirmation_required ? 'bg-slate-900' : 'bg-slate-200'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                                                form.data.arrival_confirmation_required ? 'translate-x-4' : 'translate-x-0'
                                                            }`}
                                                        />
                                                    </button>
                                                </div>

                                                {form.data.arrival_confirmation_required && (
                                                    <div className="grid grid-cols-2 gap-3 border-t border-slate-200/60 pt-2">
                                                        <div>
                                                            <CustomSelect
                                                                label="Expected arrival window"
                                                                value={String(form.data.confirmation_window_minutes)}
                                                                onChange={(val) => form.setData('confirmation_window_minutes', Number(val))}
                                                                options={[
                                                                    { value: '15', label: '15 minutes' },
                                                                    { value: '30', label: '30 minutes' },
                                                                    { value: '45', label: '45 minutes' },
                                                                    { value: '60', label: '60 minutes' },
                                                                    { value: '120', label: '2 hours' },
                                                                ]}
                                                                size="sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <CustomSelect
                                                                label="If overdue escalate to"
                                                                value={form.data.confirmation_escalation}
                                                                onChange={(val) => form.setData('confirmation_escalation', val as any)}
                                                                options={[
                                                                    {
                                                                        value: 'alert_only',
                                                                        label: 'Alert only',
                                                                        description: 'Internal organization dashboard alert',
                                                                    },
                                                                    {
                                                                        value: 'flag_security',
                                                                        label: 'Flag security terminal',
                                                                        description: 'Highlight on guard console queue',
                                                                    },
                                                                ]}
                                                                size="sm"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Section 3: Operating hours (Hidden for Hospital) */}
                            {form.data.type !== 'hospital' && (
                                <div className="space-y-4 border-t border-slate-100 pt-5">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 pr-2">
                                            <h3 className="text-sm font-semibold text-slate-900">Operating hours</h3>
                                            <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">Set normal operational days and gate arrival window</p>
                                        </div>

                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={form.data.has_hours}
                                            onClick={() => form.setData('has_hours', !form.data.has_hours)}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                form.data.has_hours ? 'bg-slate-900' : 'bg-slate-200'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                                    form.data.has_hours ? 'translate-x-4' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {form.data.has_hours ? (
                                        <div className="space-y-4">
                                            {/* Days Selector with Quick Presets */}
                                            <div>
                                                <div className="mb-1.5 flex items-center justify-between">
                                                    <label className="block text-xs font-medium text-slate-700">Days</label>
                                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                                        <button
                                                            type="button"
                                                            onClick={() => setDaysPreset('weekdays')}
                                                            className="transition-colors hover:text-slate-800"
                                                        >
                                                            Weekdays
                                                        </button>
                                                        <span>·</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDaysPreset('daily')}
                                                            className="transition-colors hover:text-slate-800"
                                                        >
                                                            Every day
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-1.5">
                                                    {DAYS.map((d) => {
                                                        const isSelected = form.data.selected_days.includes(d.key);
                                                        return (
                                                            <button
                                                                key={d.key}
                                                                type="button"
                                                                onClick={() => toggleDay(d.key)}
                                                                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                                                    isSelected
                                                                        ? 'bg-slate-900 text-white'
                                                                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                {d.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Hours Pickers */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <CustomSelect
                                                        label="Opening time"
                                                        value={form.data.open_time}
                                                        onChange={(val) => form.setData('open_time', String(val))}
                                                        options={[
                                                            { value: '06:00', label: '6:00 AM' },
                                                            { value: '06:30', label: '6:30 AM' },
                                                            { value: '07:00', label: '7:00 AM' },
                                                            { value: '07:30', label: '7:30 AM' },
                                                            { value: '08:00', label: '8:00 AM' },
                                                            { value: '08:30', label: '8:30 AM' },
                                                            { value: '09:00', label: '9:00 AM' },
                                                            { value: '09:30', label: '9:30 AM' },
                                                            { value: '10:00', label: '10:00 AM' },
                                                            { value: '11:00', label: '11:00 AM' },
                                                            { value: '12:00', label: '12:00 PM' },
                                                        ]}
                                                        size="sm"
                                                    />
                                                </div>
                                                <div>
                                                    <CustomSelect
                                                        label="Closing time"
                                                        value={form.data.close_time}
                                                        onChange={(val) => form.setData('close_time', String(val))}
                                                        options={[
                                                            { value: '12:00', label: '12:00 PM' },
                                                            { value: '13:00', label: '1:00 PM' },
                                                            { value: '14:00', label: '2:00 PM' },
                                                            { value: '15:00', label: '3:00 PM' },
                                                            { value: '16:00', label: '4:00 PM' },
                                                            { value: '17:00', label: '5:00 PM' },
                                                            { value: '18:00', label: '6:00 PM' },
                                                            { value: '19:00', label: '7:00 PM' },
                                                            { value: '20:00', label: '8:00 PM' },
                                                            { value: '21:00', label: '9:00 PM' },
                                                            { value: '22:00', label: '10:00 PM' },
                                                        ]}
                                                        size="sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400">No schedule set — operates 24/7 or per special event.</p>
                                    )}
                                </div>
                            )}

                            {/* Edit Mode Only: Active Status Toggle */}
                            {editingOrg && (
                                <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
                                    <div className="flex-1 pr-2">
                                        <span className="block text-xs font-medium text-slate-900">Active status</span>
                                        <span className="block text-xs text-slate-500 leading-relaxed">Deactivated organizations are hidden from security terminals</span>
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
                                            {form.data.type === 'hospital' ? 'Unrestricted' : 'Managed Access'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 text-xs">
                                    <div>
                                        <span className="mb-0.5 block font-medium text-slate-400">Policy</span>
                                        <p className="leading-relaxed text-slate-700">
                                            {form.data.type === 'hospital' || form.data.access_policy === 'unrestricted'
                                                ? '24/7 Unrestricted Medical / Emergency Access'
                                                : form.data.access_policy === 'public_window'
                                                  ? 'Public Schedule (Windows & Operating Hours)'
                                                  : 'Managed Access (Staff, Students & Member Roster)'}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="mb-0.5 block font-medium text-slate-400">Outside Hours Rule</span>
                                        <p className="leading-relaxed text-slate-700">
                                            {form.data.type === 'hospital'
                                                ? 'Exempt (24/7)'
                                                : form.data.hours_enforcement === 'inherit'
                                                  ? 'Follow estate default policy'
                                                  : form.data.hours_enforcement === 'warn'
                                                    ? 'Warn security guard & require confirmation'
                                                    : form.data.hours_enforcement === 'block'
                                                      ? 'Strictly block visitors outside schedule'
                                                      : 'Off (informational schedule only)'}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="mb-0.5 block font-medium text-slate-400">Operating hours</span>
                                        {form.data.type === 'hospital' ? (
                                            <p className="text-slate-700">Open 24/7 · Emergency exempt</p>
                                        ) : form.data.has_hours ? (
                                            <div>
                                                <p className="font-medium text-slate-800">
                                                    {formatTime(form.data.open_time)} – {formatTime(form.data.close_time)}
                                                </p>
                                                <p className="mt-0.5 text-slate-500">
                                                    {form.data.selected_days.length === 7
                                                        ? 'Every day'
                                                        : form.data.selected_days.length === 5 &&
                                                            !form.data.selected_days.includes('saturday') &&
                                                            !form.data.selected_days.includes('sunday')
                                                          ? 'Monday to Friday'
                                                          : `${form.data.selected_days.length} days / week`}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-slate-500">No schedule set (operates 24/7)</p>
                                        )}
                                    </div>

                                    <div>
                                        <span className="mb-0.5 block font-medium text-slate-400">Arrival Confirmation</span>
                                        <p className="text-slate-700">
                                            {form.data.type === 'hospital' || form.data.access_policy === 'unrestricted'
                                                ? 'Not required'
                                                : form.data.arrival_confirmation_required
                                                  ? `Required within ${form.data.confirmation_window_minutes}m`
                                                  : 'Disabled'}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="mb-0.5 block font-medium text-slate-400">Primary Administrator</span>
                                        {form.data.admin_name.trim() || form.data.admin_email.trim() ? (
                                            <div>
                                                <p className="font-medium text-slate-800">
                                                    {form.data.admin_name.trim() || 'Admin (Name not set)'}
                                                </p>
                                                {form.data.admin_email.trim() && (
                                                    <p className="text-slate-500">{form.data.admin_email.trim()}</p>
                                                )}
                                                {form.data.admin_phone.trim() && (
                                                    <p className="text-slate-400">{form.data.admin_phone.trim()}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-slate-500">Not assigned (can be added later)</p>
                                        )}
                                    </div>

                                    <div>
                                        <span className="mb-0.5 block font-medium text-slate-400">Quick Entry</span>
                                        <p className="text-slate-700">{form.data.quick_entry_enabled ? 'Enabled for gate tags' : 'Disabled'}</p>
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
