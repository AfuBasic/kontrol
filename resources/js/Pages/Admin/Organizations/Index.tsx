import { Head, Link, router, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { useState, useMemo } from 'react';
import Modal from '@/Components/Modal';
import { destroy, index, store, update } from '@/actions/App/Http/Controllers/Admin/OrganizationController';

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

const TYPE_OPTIONS = [
    { value: 'all', label: 'All Types' },
    { value: 'school', label: 'School' },
    { value: 'church', label: 'Church' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'business', label: 'Business' },
    { value: 'facility', label: 'Facility' },
    { value: 'other', label: 'Other' },
] as const;

const ENFORCEMENT_OPTIONS = [
    { value: 'inherit', label: 'Inherit from Estate Default' },
    { value: 'off', label: 'Off — Informational Only' },
    { value: 'warn', label: 'Warn — Guard Confirms to Admit' },
    { value: 'block', label: 'Block — Hard Disallow Outside Hours' },
] as const;

const DAYS_OF_WEEK = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' },
];

export default function OrganizationsIndex({ organizations, filters }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || 'all');

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);

    // Form for Create/Edit
    const form = useForm({
        name: '',
        type: 'school' as Organization['type'],
        has_hours: false,
        open_time: '07:30',
        close_time: '16:00',
        selected_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        hours_enforcement: 'inherit' as Organization['hours_enforcement'],
        quick_entry_enabled: true,
        is_active: true,
    });

    const openCreateModal = () => {
        form.reset();
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            index.url(),
            {
                search: searchQuery || undefined,
                type: selectedType !== 'all' ? selectedType : undefined,
            },
            { preserveState: true, replace: true },
        );
    };

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload: Record<string, any> = {
            name: form.data.name,
            type: form.data.type,
            hours_enforcement: form.data.hours_enforcement,
            quick_entry_enabled: form.data.quick_entry_enabled,
            is_active: form.data.is_active,
            operating_hours: form.data.has_hours
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

    const handleToggleQuickEntry = (org: Organization) => {
        router.put(
            update.url(org.id),
            {
                name: org.name,
                type: org.type,
                operating_hours: org.operating_hours,
                hours_enforcement: org.hours_enforcement,
                is_active: org.is_active,
                quick_entry_enabled: !org.quick_entry_enabled,
            },
            { preserveScroll: true },
        );
    };

    const handleToggleActive = (org: Organization) => {
        router.put(
            update.url(org.id),
            {
                name: org.name,
                type: org.type,
                operating_hours: org.operating_hours,
                hours_enforcement: org.hours_enforcement,
                quick_entry_enabled: org.quick_entry_enabled,
                is_active: !org.is_active,
            },
            { preserveScroll: true },
        );
    };

    const handleDelete = () => {
        if (!deletingOrg) return;
        router.delete(destroy.url(deletingOrg.id), {
            onSuccess: () => setDeletingOrg(null),
        });
    };

    const getTypeIcon = (type: Organization['type']) => {
        switch (type) {
            case 'school':
                return <School className="h-4 w-4 text-amber-500" />;
            case 'church':
                return <Church className="h-4 w-4 text-purple-500" />;
            case 'hospital':
                return <HeartPulse className="h-4 w-4 text-rose-500" />;
            case 'business':
                return <Briefcase className="h-4 w-4 text-blue-500" />;
            case 'facility':
                return <Building className="h-4 w-4 text-emerald-500" />;
            default:
                return <Building2 className="h-4 w-4 text-slate-500" />;
        }
    };

    const toggleDay = (day: string) => {
        const days = [...form.data.selected_days];
        const idx = days.indexOf(day);
        if (idx >= 0) {
            days.splice(idx, 1);
        } else {
            days.push(day);
        }
        form.setData('selected_days', days);
    };

    return (
        <>
            <Head title="Estate Organizations" />

            <div className="space-y-6 pb-20">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Organizations & Institutions</h1>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Configure schools, churches, hospitals & commercial destinations inside the estate for Quick Entry access.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4.5 py-2.5 text-xs font-black tracking-wide text-white uppercase shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                    >
                        <Plus className="h-4 w-4 stroke-[3]" />
                        Add Organization
                    </button>
                </div>

                {/* Filters Strip */}
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs ring-1 ring-slate-100/50">
                    <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search organizations by name..."
                                className="w-full rounded-xl border-slate-200 py-2.5 pr-4 pl-10 text-xs font-semibold placeholder:text-slate-400 focus:border-slate-800 focus:ring-slate-800"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={selectedType}
                                onChange={(e) => handleTypeFilterChange(e.target.value)}
                                className="rounded-xl border-slate-200 py-2.5 pr-8 pl-3 text-xs font-semibold text-slate-700 focus:border-slate-800 focus:ring-slate-800"
                            >
                                {TYPE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="submit"
                                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                            >
                                Search
                            </button>
                        </div>
                    </form>
                </div>

                {/* Organizations Table / Grid */}
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs ring-1 ring-slate-100/50">
                    {organizations.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <Building2 className="h-7 w-7" />
                            </div>
                            <h3 className="mt-4 text-base font-black text-slate-900">No organizations found</h3>
                            <p className="mt-1 max-w-sm text-xs font-semibold text-slate-500">
                                {searchQuery || selectedType !== 'all'
                                    ? 'No organizations matched your current filters. Try changing your search query or type.'
                                    : 'Add your first estate organization (school, church, hospital) to enable high-volume Quick Entry admissions.'}
                            </p>
                            {!searchQuery && selectedType === 'all' && (
                                <button
                                    type="button"
                                    onClick={openCreateModal}
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-slate-800"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add First Organization
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-100 bg-slate-50/75 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                                    <tr>
                                        <th className="py-3.5 pr-3 pl-6">Organization</th>
                                        <th className="px-3 py-3.5">Type</th>
                                        <th className="px-3 py-3.5">Operating Hours</th>
                                        <th className="px-3 py-3.5">Hours Policy</th>
                                        <th className="px-3 py-3.5 text-center">Quick Entry</th>
                                        <th className="px-3 py-3.5 text-center">Status</th>
                                        <th className="py-3.5 pr-6 pl-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                                    {organizations.data.map((org) => {
                                        const hours = org.operating_hours;
                                        return (
                                            <tr key={org.id} className="transition-colors hover:bg-slate-50/60">
                                                <td className="py-4 pr-3 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                                                            {getTypeIcon(org.type)}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-slate-900">{org.name}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-3 py-4">
                                                    <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 capitalize">
                                                        {org.type}
                                                    </span>
                                                </td>

                                                <td className="px-3 py-4 text-slate-500">
                                                    {hours?.open && hours?.close ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                            <span>
                                                                {hours.open} – {hours.close}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">24 Hours / Unset</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                            org.hours_enforcement === 'block'
                                                                ? 'bg-rose-50 text-rose-700'
                                                                : org.hours_enforcement === 'warn'
                                                                  ? 'bg-amber-50 text-amber-700'
                                                                  : org.hours_enforcement === 'off'
                                                                    ? 'bg-slate-100 text-slate-600'
                                                                    : 'bg-blue-50 text-blue-700'
                                                        }`}
                                                    >
                                                        {org.hours_enforcement || 'inherit'}
                                                    </span>
                                                </td>

                                                <td className="px-3 py-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleQuickEntry(org)}
                                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                            org.quick_entry_enabled ? 'bg-indigo-600' : 'bg-slate-200'
                                                        }`}
                                                        title="Toggle Quick Entry"
                                                    >
                                                        <span
                                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                                                org.quick_entry_enabled ? 'translate-x-4' : 'translate-x-0'
                                                            }`}
                                                        />
                                                    </button>
                                                </td>

                                                <td className="px-3 py-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleActive(org)}
                                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                            org.is_active ? 'bg-emerald-600' : 'bg-slate-200'
                                                        }`}
                                                        title="Toggle Active Status"
                                                    >
                                                        <span
                                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                                                org.is_active ? 'translate-x-4' : 'translate-x-0'
                                                            }`}
                                                        />
                                                    </button>
                                                </td>

                                                <td className="py-4 pr-6 pl-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(org)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingOrg(org)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-rose-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {organizations.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 text-xs font-semibold text-slate-500">
                            <div>
                                Showing <span className="font-bold text-slate-800">{organizations.data.length}</span> of{' '}
                                <span className="font-bold text-slate-800">{organizations.total}</span> organizations
                            </div>
                            <div className="flex items-center gap-1">
                                {organizations.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        preserveScroll
                                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                                            link.active
                                                ? 'bg-slate-900 text-white'
                                                : link.url
                                                  ? 'text-slate-600 hover:bg-slate-200'
                                                  : 'cursor-not-allowed text-slate-300'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create / Edit Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="lg">
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-base font-black text-slate-900">
                                {editingOrg ? 'Edit Organization' : 'Add New Organization'}
                            </h3>
                            <p className="text-xs font-semibold text-slate-400">
                                Specify details and Quick Entry operational parameters.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="mt-5 space-y-4 text-xs font-semibold text-slate-700">
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-bold text-slate-900">Organization Name *</label>
                            <input
                                type="text"
                                required
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="e.g. Corona Primary School, St. Jude Catholic Church"
                                className="mt-1 w-full rounded-xl border-slate-200 py-2 px-3 text-xs font-semibold placeholder:text-slate-400 focus:border-slate-800 focus:ring-slate-800"
                            />
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-xs font-bold text-slate-900">Organization Type *</label>
                            <select
                                value={form.data.type}
                                onChange={(e) => form.setData('type', e.target.value as any)}
                                className="mt-1 w-full rounded-xl border-slate-200 py-2 px-3 text-xs font-semibold text-slate-800 focus:border-slate-800 focus:ring-slate-800"
                            >
                                <option value="school">School (Drop-off, parents, staff)</option>
                                <option value="church">Church / Religious Institution</option>
                                <option value="hospital">Hospital / Clinic / Medical</option>
                                <option value="business">Commercial Business / Office</option>
                                <option value="facility">Clubhouse / Sports / Estate Facility</option>
                                <option value="other">Other Operational Destination</option>
                            </select>
                        </div>

                        {/* Operating Hours Toggle */}
                        <div className="rounded-xl border border-slate-100 bg-slate-50/75 p-3.5 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-slate-900">Define Operating Hours</span>
                                    <p className="text-[11px] font-normal text-slate-500">
                                        Limit or warn guards during off-hours admissions.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => form.setData('has_hours', !form.data.has_hours)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        form.data.has_hours ? 'bg-indigo-600' : 'bg-slate-200'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                            form.data.has_hours ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>

                            {form.data.has_hours && (
                                <div className="space-y-3 pt-2 border-t border-slate-200/60">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700">Opening Time</label>
                                            <input
                                                type="time"
                                                value={form.data.open_time}
                                                onChange={(e) => form.setData('open_time', e.target.value)}
                                                className="mt-1 w-full rounded-lg border-slate-200 py-1.5 px-2.5 text-xs font-semibold focus:border-slate-800 focus:ring-slate-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700">Closing Time</label>
                                            <input
                                                type="time"
                                                value={form.data.close_time}
                                                onChange={(e) => form.setData('close_time', e.target.value)}
                                                className="mt-1 w-full rounded-lg border-slate-200 py-1.5 px-2.5 text-xs font-semibold focus:border-slate-800 focus:ring-slate-800"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                                            Active Days
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {DAYS_OF_WEEK.map((d) => {
                                                const isSelected = form.data.selected_days.includes(d.key);
                                                return (
                                                    <button
                                                        key={d.key}
                                                        type="button"
                                                        onClick={() => toggleDay(d.key)}
                                                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                                                            isSelected
                                                                ? 'bg-slate-900 text-white'
                                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        {d.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Operating Hours Enforcement Override */}
                        <div>
                            <label className="block text-xs font-bold text-slate-900">
                                Operating Hours Enforcement Policy
                            </label>
                            <select
                                value={form.data.hours_enforcement}
                                onChange={(e) => form.setData('hours_enforcement', e.target.value as any)}
                                className="mt-1 w-full rounded-xl border-slate-200 py-2 px-3 text-xs font-semibold text-slate-800 focus:border-slate-800 focus:ring-slate-800"
                            >
                                {ENFORCEMENT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-[10px] text-slate-400">
                                Set to 'Off' for 24/7 hospitals. Use 'Block' for strict schools. 'Inherit' uses the estate default.
                            </p>
                        </div>

                        {/* Quick Entry & Active Toggles */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <label className="flex items-center gap-2.5 cursor-pointer rounded-xl border border-slate-100 p-3 bg-slate-50/50 hover:bg-slate-50">
                                <input
                                    type="checkbox"
                                    checked={form.data.quick_entry_enabled}
                                    onChange={(e) => form.setData('quick_entry_enabled', e.target.checked)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                />
                                <div>
                                    <span className="text-xs font-bold text-slate-900 block">Quick Entry</span>
                                    <span className="text-[10px] text-slate-400">Enable tag admission</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer rounded-xl border border-slate-100 p-3 bg-slate-50/50 hover:bg-slate-50">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(e) => form.setData('is_active', e.target.checked)}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                                />
                                <div>
                                    <span className="text-xs font-bold text-slate-900 block">Active Status</span>
                                    <span className="text-[10px] text-slate-400">Visible to security</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-50"
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
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                        <AlertCircle className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-base font-black text-slate-900">Delete Organization?</h3>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                        Are you sure you want to delete <span className="font-bold text-slate-800">{deletingOrg?.name}</span>? Existing
                        access history and visitor logs will be preserved.
                    </p>
                    <div className="mt-6 flex justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => setDeletingOrg(null)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
                        >
                            Confirm Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
