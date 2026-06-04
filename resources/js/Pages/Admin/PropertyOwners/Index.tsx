import {
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    XMarkIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    BuildingOffice2Icon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, Phone, MapPin, LinkIcon } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { index, create, properties, residents } from '@/actions/App/Http/Controllers/Admin/PropertyOwnerController';
import { index as inviteLinkIndex } from '@/actions/App/Http/Controllers/Admin/PropertyOwnerInviteLinkController';
import PropertyOwnerActions from '@/Components/Admin/PropertyOwnerActions';
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
    status: 'pending' | 'accepted';
    suspended_at: string | null;
    email_verified_at: string | null;
    properties_count: number;
    residents_count: number;
    created_at: string;
}

interface Props {
    propertyOwners: {
        data: PropertyOwner[];
        total: number;
        links: any[];
        next_page_url: string | null;
        current_page: number;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function Index({ propertyOwners, filters }: Props) {
    const { can } = usePermission();
    const hasOwners = propertyOwners && propertyOwners.data && propertyOwners.data.length > 0;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const debouncedSearch = useDebounce(search, 300);

    // Debounce search
    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            router.get(index.url(), { search: debouncedSearch, status }, { preserveState: true, preserveScroll: true, replace: true });
        }
    }, [debouncedSearch, filters.search, status]);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setStatus(newStatus);
        router.get(index.url(), { search, status: newStatus }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = useCallback(() => {
        setSearch('');
        setStatus('');
        router.get(index.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    }, []);

    const hasActiveFilters = Boolean(search || status);

    return (
        <>
            <Head title="Property Owners Management" />

            <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Property Owners</h1>
                    <p className="mt-1 text-slate-500">Manage and oversee all estate property owners.</p>
                </div>
                {can('property_owners.create') && (
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                        <Link
                            href={inviteLinkIndex.url()}
                            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                        >
                            <LinkIcon className="text-slate-550 h-4 w-4" />
                            Manage Invite Link
                        </Link>
                        <Link
                            href={create.url()}
                            className="flex items-center justify-center gap-2 rounded-2xl bg-[#1F6FDB] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Add Property Owner
                        </Link>
                    </div>
                )}
            </div>

            {/* Filters Section - Modernized */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        name="search"
                        id="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full rounded-2xl border-0 bg-white py-3.5 pl-11 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-[#1F6FDB]"
                        placeholder="Search property owners..."
                    />
                </div>
                <div className="w-full sm:w-56">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <FunnelIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                        </div>
                        <select
                            value={status}
                            onChange={handleStatusChange}
                            className="block w-full appearance-none rounded-2xl border-0 bg-white py-3.5 pr-10 pl-11 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-[#1F6FDB]"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active Owners</option>
                            <option value="pending">Pending Invites</option>
                            <option value="suspended">Suspended Owners</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                            <ChevronDownIcon className="h-5 w-5" />
                        </div>
                    </div>
                </div>
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                    >
                        <XMarkIcon className="h-4 w-4" />
                        Reset
                    </button>
                )}
            </div>

            {/* Content Container */}
            <div className="space-y-4">
                {hasOwners ? (
                    <>
                        {/* Mobile Card List (Hidden on Desktop) */}
                        <div className="flex flex-col gap-4 sm:hidden">
                            <AnimatePresence mode="popLayout">
                                {propertyOwners.data.map((owner) => (
                                    <motion.div
                                        layout
                                        key={owner.ulid}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all active:bg-slate-50"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 font-black text-slate-400 shadow-inner">
                                                    {owner.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black tracking-tight text-slate-900">{owner.name}</h3>
                                                    <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                                        <MapPin className="h-3 w-3" />
                                                        {owner.unit_number || 'Unit Pending'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${
                                                        owner.suspended_at
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : owner.status === 'accepted'
                                                              ? 'bg-emerald-100 text-emerald-700'
                                                              : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {owner.suspended_at ? 'Suspended' : owner.status}
                                                </span>
                                                <PropertyOwnerActions owner={owner} />
                                            </div>
                                        </div>

                                        <div className="mt-5 space-y-3 rounded-2xl bg-slate-50/50 p-4 ring-1 ring-slate-100">
                                            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                                <Mail className="h-4 w-4 text-slate-400" />
                                                <span className="truncate">{owner.email}</span>
                                            </div>
                                            {owner.phone && (
                                                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                                    <Phone className="h-4 w-4 text-slate-400" />
                                                    {owner.phone}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                                            <Link
                                                href={properties.url(owner.ulid)}
                                                className="flex items-center justify-between rounded-xl bg-slate-50 p-3 transition-all hover:bg-slate-100"
                                            >
                                                <div className="text-slate-550 flex items-center gap-2 text-xs font-bold uppercase">
                                                    <BuildingOffice2Icon className="h-4.5 w-4.5 text-slate-400" />
                                                    Properties
                                                </div>
                                                <span className="text-sm font-black text-slate-900">{owner.properties_count}</span>
                                            </Link>
                                            <Link
                                                href={residents.url(owner.ulid)}
                                                className="flex items-center justify-between rounded-xl bg-slate-50 p-3 transition-all hover:bg-slate-100"
                                            >
                                                <div className="text-slate-550 flex items-center gap-2 text-xs font-bold uppercase">
                                                    <UsersIcon className="h-4.5 w-4.5 text-slate-400" />
                                                    Residents
                                                </div>
                                                <span className="text-sm font-black text-slate-900">{owner.residents_count}</span>
                                            </Link>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Desktop Table (Hidden on Mobile) */}
                        <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm sm:block">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Property Owner
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Contact
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Unit/Address
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Properties
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Residents
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Status
                                        </th>
                                        <th className="relative px-6 py-4">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {propertyOwners.data.map((owner) => (
                                        <tr key={owner.ulid} className="transition-colors hover:bg-slate-50/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 font-bold text-slate-500">
                                                        {owner.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="text-sm font-bold text-slate-900">{owner.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col text-xs font-medium text-slate-500">
                                                    <span className="font-bold text-slate-900">{owner.email}</span>
                                                    <span>{owner.phone || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col text-xs font-medium text-slate-500">
                                                    <span className="font-bold text-slate-900">{owner.unit_number || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    href={properties.url(owner.ulid)}
                                                    className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                                                >
                                                    <BuildingOffice2Icon className="h-4.5 w-4.5 shrink-0 text-slate-400" />
                                                    {owner.properties_count}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    href={residents.url(owner.ulid)}
                                                    className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                                                >
                                                    <UsersIcon className="h-4.5 w-4.5 shrink-0 text-slate-400" />
                                                    {owner.residents_count}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest uppercase ${
                                                        owner.suspended_at
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : owner.status === 'accepted'
                                                              ? 'bg-emerald-100 text-emerald-700'
                                                              : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {owner.suspended_at ? 'Suspended' : owner.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                                <PropertyOwnerActions owner={owner} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Strategy */}
                        <div className="mt-8 flex flex-col items-center justify-center gap-6 pb-12">
                            <div className="hidden w-full sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-slate-705 text-sm">
                                        Showing <span className="font-bold">{propertyOwners.data.length}</span> entries of{' '}
                                        <span className="font-bold">{propertyOwners.total}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {propertyOwners.links.map((link: any, i: number) => {
                                        if (link.url === null) return null;
                                        return (
                                            <Link
                                                key={i}
                                                href={link.url}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                                                    link.active
                                                        ? 'bg-slate-900 text-white shadow-sm'
                                                        : 'bg-white text-slate-700 shadow-xs ring-1 ring-slate-200 hover:bg-slate-50'
                                                }`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="col-span-full rounded-[32px] bg-white py-16 text-center shadow-xs ring-1 ring-slate-100">
                        <UsersIcon className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-4 text-lg font-black text-slate-900">No Property Owners</h3>
                        <p className="mt-1 text-sm text-slate-500">Get started by inviting a new Property Owner.</p>
                    </div>
                )}
            </div>
        </>
    );
}

Index.layout = (page: any) => <AdminLayout title="Property Owners" children={page} />;
