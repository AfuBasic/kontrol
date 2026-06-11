import {
    UsersIcon,
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    WalletIcon,
    EllipsisVerticalIcon,
    UserMinusIcon,
    UserPlusIcon,
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import { suspend, destroy, edit, create, index } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/ResidentController';
import { useDebounce } from '@/Hooks/useDebounce';

interface Resident {
    id: number;
    ulid: string;
    name: string;
    email: string;
    phone: string | null;
    unit_number: string | null;
    property: string | null;
    property_id: number | null;
    outstanding_balance: number;
    status: string;
    suspended_at: string | null;
    is_active: boolean;
}

interface Props {
    residents: {
        data: Resident[];
        total: number;
        per_page: number;
        current_page: number;
        links: any[];
    };
    totalUnfiltered: number;
    filters: {
        search: string;
        status: string;
    };
}

export default function Index({ residents, totalUnfiltered, filters }: Props) {
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const debouncedSearch = useDebounce(search, 300);

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

    const toggleSuspend = (resident: Resident) => {
        if (confirm("Are you sure you want to change this resident's activation status?")) {
            router.patch(suspend.url(resident.ulid));
        }
    };

    const removeDelegation = (resident: Resident) => {
        if (confirm("Are you sure you want to stop managing this resident? They will remain in the estate system but won't be delegated to you.")) {
            router.delete(destroy.url(resident.ulid));
        }
    };

    const hasActiveFilters = Boolean(search || status);
    const hasResidents = residents && residents.data && residents.data.length > 0;
    const showFilters = totalUnfiltered > 1 || hasActiveFilters;
    const showPagination = residents.total > residents.per_page;

    return (
        <div className="space-y-6 pb-24">
            <Head title="Managed Residents" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Managed Residents</h1>
                    <p className="mt-1 text-sm text-slate-500">View and manage details of residents/occupants delegated to you.</p>
                </div>
                <Link
                    href={create.url()}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/10 transition-all hover:-translate-y-0.5 hover:from-indigo-500 hover:to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25 active:translate-y-0 active:scale-98"
                >
                    <UserPlusIcon className="h-5 w-5 text-indigo-100" />
                    Invite Resident
                </Link>
            </div>

            {/* Conditional Filters bar: Only show if records > 1 or filters are active */}
            {showFilters && (
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <MagnifyingGlassIcon className="h-4.5 w-4.5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="text-slate-900 block w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm font-semibold shadow-xs placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                            placeholder="Search by name or email..."
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <FunnelIcon className="h-4.5 w-4.5 text-slate-400" />
                            </div>
                            <select
                                value={status}
                                onChange={handleStatusChange}
                                className="text-slate-900 block w-full rounded-2xl border border-slate-200 bg-white py-3 pr-8 pl-10 text-sm font-semibold shadow-xs focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                            >
                                <option value="">All Statuses</option>
                                <option value="accepted">Accepted</option>
                                <option value="pending">Pending</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-xs transition-all hover:bg-slate-50 active:scale-95"
                        >
                            <XMarkIcon className="h-4 w-4" />
                            Reset
                        </button>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {hasResidents ? (
                    residents.data.map((resident) => (
                        <div
                            key={resident.id}
                            className={`group relative overflow-hidden rounded-[32px] bg-white p-6 shadow-xs ring-1 ring-slate-100 transition-all hover:shadow-lg ${
                                resident.suspended_at ? 'bg-slate-50/50 opacity-70' : ''
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex flex-1 items-center gap-3 min-w-0">
                                    <div
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-black ${
                                            resident.suspended_at ? 'bg-rose-100 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                                        }`}
                                    >
                                        {resident.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate text-base font-black text-slate-900" title={resident.name}>{resident.name}</h3>
                                        <p className="truncate text-xs font-bold text-slate-400">{resident.email}</p>
                                        <div className="mt-1.5">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black tracking-widest uppercase ${
                                                    resident.suspended_at
                                                        ? 'bg-rose-100 text-rose-700'
                                                        : resident.status === 'accepted'
                                                          ? 'bg-emerald-100 text-emerald-700'
                                                          : 'bg-amber-100 text-amber-700'
                                                }`}
                                            >
                                                {resident.suspended_at ? 'Suspended' : resident.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setActiveMenuId(activeMenuId === resident.id ? null : resident.id)}
                                        className="text-slate-550 rounded-xl p-1.5 hover:bg-slate-50"
                                    >
                                        <EllipsisVerticalIcon className="h-5 w-5" />
                                    </button>

                                    {activeMenuId === resident.id && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                                            <div className="absolute right-0 z-20 mt-1 w-48 origin-top-right rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-slate-100 focus:outline-none">
                                                <Link
                                                    href={edit.url(resident.ulid)}
                                                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                                                >
                                                    <PencilSquareIcon className="h-4.5 w-4.5 text-slate-400" />
                                                    Edit Details
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        toggleSuspend(resident);
                                                        setActiveMenuId(null);
                                                    }}
                                                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-slate-50 ${
                                                        resident.suspended_at ? 'text-emerald-600' : 'text-rose-600'
                                                    }`}
                                                >
                                                    {resident.suspended_at ? (
                                                        <>
                                                            <UserPlusIcon className="h-4.5 w-4.5" />
                                                            Activate
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserMinusIcon className="h-4.5 w-4.5" />
                                                            Deactivate
                                                        </>
                                                    )}
                                                </button>
                                                <div className="my-1 border-t border-slate-100" />
                                                <button
                                                    onClick={() => {
                                                        removeDelegation(resident);
                                                        setActiveMenuId(null);
                                                    }}
                                                    className="text-slate-550 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-rose-50 hover:text-rose-600"
                                                >
                                                    <TrashIcon className="h-4.5 w-4.5" />
                                                    Remove Delegation
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 space-y-3 border-t border-slate-100 pt-4">
                                <div className="text-slate-600 flex items-center gap-2.5 text-sm font-semibold">
                                    <MapPinIcon className="h-4.5 w-4.5 shrink-0 text-slate-450" />
                                    <span>
                                        {resident.property ? (
                                            <>
                                                <span className="font-bold text-slate-800">{resident.property}</span>
                                                {resident.unit_number && (
                                                    <span className="text-slate-500 font-medium"> (Unit {resident.unit_number})</span>
                                                )}
                                            </>
                                        ) : resident.unit_number ? (
                                            <span className="font-bold text-slate-800">Unit {resident.unit_number}</span>
                                        ) : (
                                            <span className="text-slate-400 italic font-medium">No Property Assigned</span>
                                        )}
                                    </span>
                                </div>
                                {resident.phone && resident.phone.trim() !== '' && resident.phone !== 'null' && resident.phone !== 'undefined' && (
                                    <div className="text-slate-600 flex items-center gap-2.5 text-sm font-semibold">
                                        <PhoneIcon className="h-4.5 w-4.5 shrink-0 text-slate-450" />
                                        <span>{resident.phone}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    <WalletIcon className="h-4.5 w-4.5 text-slate-400" />
                                    <span>Outstanding Balance</span>
                                </div>
                                <span className={`text-sm font-black ${resident.outstanding_balance > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {resident.outstanding_balance > 0 ? `₦${Number(resident.outstanding_balance).toLocaleString()}` : '₦0'}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full rounded-[32px] bg-white py-16 text-center shadow-xs ring-1 ring-slate-100">
                        <UsersIcon className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-4 text-lg font-black text-slate-900">No Residents Assigned</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            You don't have any delegated occupants. Please contact the Estate Administrator to assign residents to you.
                        </p>
                    </div>
                )}
            </div>

            {/* Conditional Pagination: Only show if records > per page */}
            {showPagination && (
                <div className="mt-8 flex flex-col items-center justify-center gap-6 pb-12">
                    <div className="flex w-full items-center justify-between border-t border-slate-100 pt-6">
                        <div>
                            <p className="text-xs font-semibold text-slate-500">
                                Showing <span className="font-bold text-slate-900">{residents.data.length}</span> entries of{' '}
                                <span className="font-bold text-slate-900">{residents.total}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {residents.links.map((link: any, i: number) => {
                                if (link.url === null) return null;
                                return (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                                            link.active
                                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                                                : 'bg-white text-slate-700 shadow-xs ring-1 ring-slate-200 hover:bg-slate-50'
                                        }`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
