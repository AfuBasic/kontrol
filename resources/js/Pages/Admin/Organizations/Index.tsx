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
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import Modal from '@/Components/Modal';
import { destroy, index, store, update } from '@/actions/App/Http/Controllers/Admin/OrganizationController';
import { useDebounce } from '@/Hooks/useDebounce';

export interface Organization {
    id: number;
    estate_id: number;
    name: string;
    type: 'school' | 'church' | 'hospital' | 'business' | 'facility' | 'other';
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

    // Form state
    const form = useForm({
        name: '',
        type: 'school' as Organization['type'],
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
        form.setData({
            name: org.name,
            type: org.type,
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
                has_hours: false,
                hours_enforcement: 'off',
                quick_entry_enabled: true,
            });
        } else if (config.defaultHours) {
            form.setData({
                ...form.data,
                type: newType,
                has_hours: true,
                open_time: config.defaultHours.open,
                close_time: config.defaultHours.close,
                selected_days: [...config.defaultHours.days],
                hours_enforcement: 'inherit',
            });
        } else {
            form.setData('type', newType);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const isHospital = form.data.type === 'hospital';
        const payload: Record<string, any> = {
            name: form.data.name,
            type: form.data.type,
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

        if (editingOrg) {
            router.put(update.url(editingOrg.id), payload, {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    setEditingOrg(null);
                    form.reset();
                },
            });
        } else {
            router.post(store.url(), payload, {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    form.reset();
                },
            });
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
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center sm:p-12 shadow-xs">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-slate-900">No organizations yet</h3>
                        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
                            Add schools, churches, hospitals, or other organizations that operate within this estate.
                            Organizations can manage recurring access while Security retains control of admission.
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

                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedType}
                                    onChange={(e) => handleTypeFilterChange(e.target.value)}
                                    className="rounded-xl border-slate-200 bg-white py-2 pr-8 pl-3 text-xs font-semibold text-slate-700 focus:border-slate-800 focus:ring-slate-800"
                                >
                                    <option value="all">All Types</option>
                                    <option value="school">School</option>
                                    <option value="church">Church</option>
                                    <option value="hospital">Hospital</option>
                                    <option value="business">Business</option>
                                    <option value="facility">Facility</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* No Search Results */}
                        {isSearchEmpty ? (
                            <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center">
                                <p className="text-xs font-semibold text-slate-700">
                                    No organizations match your filters.
                                </p>
                                <p className="mt-1 text-[11px] text-slate-400">
                                    Try searching by a different name or clear current filter options.
                                </p>
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
                            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs divide-y divide-slate-100">
                                {organizations.data.map((org) => {
                                    const config = TYPE_CONFIG[org.type] || TYPE_CONFIG.other;
                                    const IconComponent = config.icon;
                                    const hours = org.operating_hours;
                                    const hasHours = Boolean(hours?.open && hours?.close);

                                    return (
                                        <div
                                            key={org.id}
                                            className="group flex flex-col gap-3 p-4 transition-colors hover:bg-slate-50/60 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5"
                                        >
                                            {/* Organization Primary Info */}
                                            <div className="flex items-start gap-3.5 min-w-0 sm:items-center">
                                                <div
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${config.color}`}
                                                >
                                                    <IconComponent className="h-4 w-4" />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-bold text-slate-900 truncate">
                                                            {org.name}
                                                        </span>
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
                                                    </div>

                                                    {/* Operational Context Line */}
                                                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                                        {org.type === 'hospital' ? (
                                                            <span className="text-rose-700 font-medium flex items-center gap-1">
                                                                Unrestricted destination · 24/7 Access
                                                            </span>
                                                        ) : hasHours ? (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3 text-slate-400" />
                                                                <span>
                                                                    {formatTime(hours?.open)} – {formatTime(hours?.close)}
                                                                </span>
                                                                {org.hours_enforcement === 'block' && (
                                                                    <span className="text-rose-600 font-medium text-[11px] ml-1">
                                                                        · Strict hours
                                                                    </span>
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span>Standard access schedule</span>
                                                        )}

                                                        {org.quick_entry_enabled && (
                                                            <span className="text-indigo-600 font-medium flex items-center gap-1">
                                                                <Zap className="h-3 w-3 fill-indigo-500/20" />
                                                                Quick Entry active
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Row Actions */}
                                            <div className="flex items-center justify-end gap-2 shrink-0 pt-2 border-t border-slate-100 sm:border-0 sm:pt-0">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(org)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                                >
                                                    <Pencil className="h-3.5 w-3.5 text-slate-400" />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingOrg(org)}
                                                    className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
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
                    <div className="flex items-start justify-between border-b border-slate-100 px-7 py-5">
                        <div>
                            <h2 className="text-lg font-black tracking-tight text-slate-900">
                                {editingOrg ? 'Edit Organization' : 'Add Organization'}
                            </h2>
                            <p className="mt-0.5 text-xs font-semibold text-slate-500">
                                {editingOrg
                                    ? 'Update details, access policy, and operating schedules.'
                                    : 'Set up a school, church, medical centre or facility operating within the estate.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            aria-label="Close dialog"
                            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Two-Column Workspace Body */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
                        {/* LEFT COLUMN: User Decisions (7 cols) */}
                        <div className="lg:col-span-7 p-7 space-y-6 overflow-y-auto max-h-[72vh]">
                            {/* Section: Organization Details */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black tracking-tight text-slate-900">
                                    Organization Details
                                </h3>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700">
                                        Organization Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        placeholder="e.g. St Matthew's High School, Grace Medical Centre"
                                        className="mt-1.5 w-full rounded-xl border-slate-200 py-2.5 px-3.5 text-xs font-semibold placeholder:text-slate-400 focus:border-slate-800 focus:ring-slate-800"
                                    />
                                    {form.errors.name && (
                                        <p className="mt-1 text-[11px] font-bold text-rose-600">{form.errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2">
                                        Organization Type <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {(Object.keys(TYPE_CONFIG) as Array<Organization['type']>).map((typeKey) => {
                                            const cfg = TYPE_CONFIG[typeKey];
                                            const isSelected = form.data.type === typeKey;
                                            const TypeIcon = cfg.icon;

                                            return (
                                                <button
                                                    key={typeKey}
                                                    type="button"
                                                    onClick={() => handleTypeSelect(typeKey)}
                                                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                                                        isSelected
                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-xs ring-1 ring-slate-900'
                                                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50/70'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <TypeIcon
                                                            className={`h-4 w-4 ${
                                                                isSelected ? 'text-white' : 'text-slate-600'
                                                            }`}
                                                        />
                                                        <span className="text-xs font-bold">{cfg.label}</span>
                                                    </div>
                                                    <span
                                                        className={`mt-1 text-[10px] line-clamp-2 leading-relaxed ${
                                                            isSelected ? 'text-slate-300' : 'text-slate-500'
                                                        }`}
                                                    >
                                                        {cfg.description}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Section: Access Configuration (Adaptive) */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <h3 className="text-xs font-black tracking-tight text-slate-900">
                                    Gate & Visitor Access
                                </h3>

                                {form.data.type === 'hospital' ? (
                                    <div className="rounded-xl border border-rose-200/80 bg-rose-50/50 p-4">
                                        <div className="flex items-start gap-3">
                                            <HeartPulse className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-xs font-bold text-rose-950">
                                                    Unrestricted Destination
                                                </h4>
                                                <p className="mt-1 text-[11px] text-rose-800 leading-relaxed font-medium">
                                                    Medical emergencies, patients, and healthcare visitors are admitted without requiring pre-registered organization passes or time restrictions. Security records admissions for accountability.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700">
                                                Outside Operating Hours Policy
                                            </label>
                                            <select
                                                value={form.data.hours_enforcement}
                                                onChange={(e) =>
                                                    form.setData('hours_enforcement', e.target.value as any)
                                                }
                                                className="mt-1.5 w-full rounded-xl border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 focus:border-slate-800 focus:ring-slate-800"
                                            >
                                                <option value="inherit">Follow estate default policy</option>
                                                <option value="warn">Warn security guard & require confirmation</option>
                                                <option value="block">Strictly block visitors outside schedule</option>
                                                <option value="off">Off (informational schedule only)</option>
                                            </select>
                                            <p className="mt-1 text-[10px] font-medium text-slate-400">
                                                Determines how the security gate terminal behaves if someone arrives outside open hours.
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 p-3.5 bg-slate-50/50">
                                            <div className="pr-4">
                                                <span className="text-xs font-bold text-slate-900 block">
                                                    Quick Entry Tag Admission
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-medium">
                                                    Allow guards to admit organization visitors with quick physical tags without a resident code.
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    form.setData('quick_entry_enabled', !form.data.quick_entry_enabled)
                                                }
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
                                    </div>
                                )}
                            </div>

                            {/* Section: Operating Schedule (Hidden for Hospital) */}
                            {form.data.type !== 'hospital' && (
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xs font-black tracking-tight text-slate-900">
                                                Operating Schedule
                                            </h3>
                                            <p className="text-[10px] font-medium text-slate-400">
                                                Provide normal hours of operation used by security at the gates.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
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
                                        <div className="space-y-3.5">
                                            {/* Hours Pickers */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-700">
                                                        Opening Time
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={form.data.open_time}
                                                        onChange={(e) => form.setData('open_time', e.target.value)}
                                                        className="mt-1 w-full rounded-xl border-slate-200 py-2 px-3 text-xs font-bold text-slate-800 focus:border-slate-800 focus:ring-slate-800"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-700">
                                                        Closing Time
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={form.data.close_time}
                                                        onChange={(e) => form.setData('close_time', e.target.value)}
                                                        className="mt-1 w-full rounded-xl border-slate-200 py-2 px-3 text-xs font-bold text-slate-800 focus:border-slate-800 focus:ring-slate-800"
                                                    />
                                                </div>
                                            </div>

                                            {/* Days Selector with Quick Presets */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="block text-[11px] font-bold text-slate-700">
                                                        Operating Days
                                                    </label>
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                        <button
                                                            type="button"
                                                            onClick={() => setDaysPreset('weekdays')}
                                                            className="hover:text-slate-800 transition-colors"
                                                        >
                                                            Weekdays
                                                        </button>
                                                        <span>·</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDaysPreset('daily')}
                                                            className="hover:text-slate-800 transition-colors"
                                                        >
                                                            Every Day
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
                                                                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                                                                    isSelected
                                                                        ? 'bg-slate-900 text-white shadow-xs'
                                                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                {d.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-slate-200 p-3 text-center">
                                            <p className="text-xs font-medium text-slate-400">
                                                No schedule defined — organization operates 24/7 or per special event.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Edit Mode Only: Active Status Toggle */}
                            {editingOrg && (
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-bold text-slate-900 block">Active Status</span>
                                        <span className="text-[10px] font-medium text-slate-500">
                                            Deactivated organizations are hidden from security quick entry terminals.
                                        </span>
                                    </div>
                                    <button
                                        type="button"
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

                        {/* RIGHT COLUMN: Live Access Summary / Consequence Card (5 cols) */}
                        <div className="lg:col-span-5 bg-slate-50/75 border-t lg:border-t-0 lg:border-l border-slate-100 p-7 flex flex-col justify-between">
                            <div className="space-y-5">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        Live Access Summary
                                    </span>
                                    <h4 className="mt-1 text-base font-black text-slate-900 truncate">
                                        {form.data.name.trim() || 'Untitled Organization'}
                                    </h4>
                                    <div className="mt-1 flex items-center gap-1.5">
                                        <span
                                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${currentTypeConfig.badgeColor}`}
                                        >
                                            {currentTypeConfig.label}
                                        </span>
                                        <span className="text-[11px] font-medium text-slate-500">
                                            · {form.data.type === 'hospital' ? 'Unrestricted' : 'Managed Access'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    {/* Operational Model */}
                                    <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-2xs">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Access Model
                                        </span>
                                        <p className="mt-1 text-xs font-bold text-slate-800 leading-snug">
                                            {form.data.type === 'hospital'
                                                ? '24/7 Unrestricted Medical Access'
                                                : currentTypeConfig.defaultAccess}
                                        </p>
                                    </div>

                                    {/* Hours & Schedule Summary */}
                                    <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-2xs">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Gate Hours & Policy
                                        </span>
                                        <div className="mt-1 text-xs font-bold text-slate-800">
                                            {form.data.type === 'hospital' ? (
                                                <span className="text-emerald-700">Open 24/7 · Emergency Exempt</span>
                                            ) : form.data.has_hours ? (
                                                <div>
                                                    <p>
                                                        {formatTime(form.data.open_time)} – {formatTime(form.data.close_time)}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                                                        {form.data.selected_days.length === 7
                                                            ? 'Every day of the week'
                                                            : form.data.selected_days.length === 5 &&
                                                                !form.data.selected_days.includes('saturday') &&
                                                                !form.data.selected_days.includes('sunday')
                                                              ? 'Monday to Friday (Weekdays)'
                                                              : `${form.data.selected_days.length} active operating days`}
                                                    </p>
                                                    <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                                        <span className="text-slate-500">Off-hours rule:</span>
                                                        <span className="font-bold capitalize text-slate-700">
                                                            {form.data.hours_enforcement === 'inherit'
                                                                ? 'Estate default'
                                                                : form.data.hours_enforcement}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-500 font-medium">No specific hours set</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Entry Status */}
                                    <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-2xs flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                Quick Entry Tag
                                            </span>
                                            <span className="text-xs font-bold text-slate-800">
                                                {form.data.quick_entry_enabled ? 'Available at Gates' : 'Disabled'}
                                            </span>
                                        </div>
                                        <span
                                            className={`h-2.5 w-2.5 rounded-full ${
                                                form.data.quick_entry_enabled ? 'bg-emerald-500' : 'bg-slate-300'
                                            }`}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-200/70 text-[11px] font-medium text-slate-500 leading-relaxed">
                                Security gate officers will automatically see this configuration when processing admissions for this organization.
                            </div>
                        </div>
                    </div>

                    {/* Stable Action Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-7 py-4 bg-white">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="rounded-xl border border-slate-200 bg-white px-4.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-98"
                        >
                            {form.processing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {editingOrg ? 'Save Changes' : 'Create Organization'}
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
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                        Are you sure you want to remove <span className="font-semibold text-slate-800">{deletingOrg?.name}</span>?
                        All past visitor access logs and historical records will remain preserved.
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
                            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-colors"
                        >
                            Confirm Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

