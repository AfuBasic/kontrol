import { useState, useEffect, useCallback } from 'react';
import {
    Users,
    MapPin,
    Mail,
    Phone,
    UserPlus,
    Search,
    Building2,
    Eye,
    Plus,
    X,
} from 'lucide-react';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { index, availableResidents, assignResidents } from '@/actions/App/Http/Controllers/Admin/PropertyOwnerController';
import { create as createResident } from '@/actions/App/Http/Controllers/Admin/ResidentController';
import Modal from '@/Components/Modal';
import SectionErrorBoundary from '@/Components/SectionErrorBoundary';
import { TableRowSkeleton } from '@/Components/Skeletons';
import EmptyState from '@/Components/States/EmptyState';
import AdminLayout from '@/Layouts/AdminLayout';

interface Resident {
    id: number;
    ulid: string;
    name: string;
    email: string;
    phone: string | null;
    property: string | null;
    status: string;
    suspended_at: string | null;
}

interface AvailableResident {
    id: number;
    name: string;
    email: string;
    current_owner: string | null;
}

interface Props {
    propertyOwner: {
        id: number;
        ulid: string;
        name: string;
    };
    residents?: Resident[] | null;
}

export default function Residents({ propertyOwner, residents }: Props) {
    const residentList = residents ?? [];
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<AvailableResident[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const ownerIdentifier = propertyOwner?.ulid || propertyOwner?.id;

    const fetchAvailableResidents = useCallback(
        async (query: string) => {
            if (!ownerIdentifier) return;
            setIsSearching(true);
            try {
                const response = await axios.get(availableResidents.url(ownerIdentifier), {
                    params: { search: query },
                });
                setSearchResults(response.data);
            } catch (error) {
                console.error('Failed to fetch available residents', error);
            } finally {
                setIsSearching(false);
            }
        },
        [ownerIdentifier],
    );

    useEffect(() => {
        if (isAssignModalOpen) {
            const timer = setTimeout(() => {
                fetchAvailableResidents(searchQuery);
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setSearchQuery('');
            setSelectedIds([]);
            setSearchResults([]);
        }
    }, [isAssignModalOpen, searchQuery, fetchAvailableResidents]);

    const handleAssign = () => {
        if (selectedIds.length === 0 || !ownerIdentifier) return;

        setIsSubmitting(true);
        router.post(
            assignResidents.url(ownerIdentifier),
            {
                resident_ids: selectedIds,
            },
            {
                onSuccess: () => {
                    setIsAssignModalOpen(false);
                },
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const toggleSelection = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const getStatusBadge = (res: Resident) => {
        if (res.suspended_at) {
            return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';
        }
        if (res.status === 'accepted') {
            return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
        }
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
    };

    return (
        <>
            <Head title={`Managed Residents - ${propertyOwner.name}`} />

            <div className="space-y-6">
                {/* Header & Breadcrumb section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                            <Link href={index.url()} className="font-semibold transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">
                                Property Owners
                            </Link>
                            <span className="text-slate-300 dark:text-slate-600">/</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{propertyOwner.name}</span>
                            <span className="text-slate-300 dark:text-slate-600">/</span>
                            <span className="font-bold text-slate-900 dark:text-white">Residents</span>
                        </div>
                        <h1 className="mt-1.5 text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">Managed Residents</h1>
                        <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Listing all occupants delegated to <span className="font-bold text-slate-700 dark:text-slate-300">{propertyOwner.name}</span>.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setIsAssignModalOpen(true)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95 sm:w-auto"
                        >
                            <UserPlus className="h-4 w-4" />
                            <span>Assign Resident</span>
                        </button>
                    </div>
                </div>

                <SectionErrorBoundary name="po-residents">
                    <Deferred data="residents" fallback={<TableRowSkeleton rows={6} columns={4} />}>
                        <div className="overflow-visible rounded-2xl border border-slate-200/80 bg-white shadow-xs md:overflow-hidden dark:border-slate-800 dark:bg-slate-900">
                            {residentList.length > 0 ? (
                                <>
                                    {/* Mobile Cards View (< md) */}
                                    <div className="divide-y divide-slate-100 p-3 md:hidden dark:divide-slate-800">
                                        {residentList.map((res) => (
                                            <div key={res.id} className="space-y-3 py-3.5 first:pt-1 last:pb-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                                                            {res.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <Link
                                                                href={`/admin/residents/${res.id}`}
                                                                className="truncate font-bold text-sm text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                                                            >
                                                                {res.name}
                                                            </Link>
                                                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                                <Mail className="h-3 w-3 text-slate-400" />
                                                                <span className="truncate">{res.email}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(res)}`}
                                                    >
                                                        {res.suspended_at ? 'Suspended' : res.status === 'accepted' ? 'Active' : res.status}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-2.5 text-xs dark:bg-slate-800/50">
                                                    <div className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                                                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                        <span>{res.property || 'No property assigned'}</span>
                                                    </div>
                                                    {res.phone && (
                                                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                                            <Phone className="h-3 w-3 text-slate-400" />
                                                            <span>{res.phone}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-end">
                                                    <Link
                                                        href={`/admin/residents/${res.id}`}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                    >
                                                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                                                        <span>View Profile</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop Table View (>= md) */}
                                    <div className="hidden overflow-x-auto md:block">
                                        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                                            <thead className="bg-slate-50/70 dark:bg-slate-800/40">
                                                <tr>
                                                    <th className="px-6 py-3.5 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                        Resident
                                                    </th>
                                                    <th className="px-6 py-3.5 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                        Contact
                                                    </th>
                                                    <th className="px-6 py-3.5 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                        Assigned Property
                                                    </th>
                                                    <th className="px-6 py-3.5 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-3.5 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                                                {residentList.map((resident) => (
                                                    <tr key={resident.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-700 text-xs dark:bg-indigo-950/50 dark:text-indigo-300">
                                                                    {resident.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <Link
                                                                    href={`/admin/residents/${resident.id}`}
                                                                    className="text-xs font-bold text-slate-900 hover:text-indigo-600 hover:underline dark:text-slate-100 dark:hover:text-indigo-400"
                                                                >
                                                                    {resident.name}
                                                                </Link>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex flex-col gap-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                                <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                                                                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                                    {resident.email}
                                                                </span>
                                                                {resident.phone && (
                                                                    <span className="flex items-center gap-1.5 text-[11px]">
                                                                        <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                                                                        {resident.phone}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {resident.property ? (
                                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                                    {resident.property}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs font-semibold text-slate-400 italic">Unassigned</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span
                                                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(resident)}`}
                                                            >
                                                                {resident.suspended_at ? 'Suspended' : resident.status === 'accepted' ? 'Active' : resident.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                                            <Link
                                                                href={`/admin/residents/${resident.id}`}
                                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                            >
                                                                <Eye className="h-3 w-3 text-slate-400" />
                                                                <span>View</span>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <EmptyState
                                    icon={Users}
                                    title="No Residents Assigned"
                                    description={`This property owner currently has no delegated residents or tenants.`}
                                    action={
                                        <div className="flex flex-col items-center justify-center gap-2.5 sm:flex-row">
                                            <button
                                                onClick={() => setIsAssignModalOpen(true)}
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95 sm:w-auto"
                                            >
                                                <UserPlus className="h-4 w-4" />
                                                <span>Assign Existing Resident</span>
                                            </button>
                                            <Link
                                                href={createResident.url()}
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 sm:w-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                            >
                                                <Plus className="h-4 w-4 text-slate-400" />
                                                <span>Invite New Resident</span>
                                            </Link>
                                        </div>
                                    }
                                />
                            )}
                        </div>
                    </Deferred>
                </SectionErrorBoundary>
            </div>

            <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} maxWidth="2xl">
                <div className="p-6 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Assign Residents</h2>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Search and select existing residents in the estate to assign them to <span className="font-semibold text-slate-700 dark:text-slate-300">{propertyOwner.name}</span>.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsAssignModalOpen(false)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="mt-4">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                            </div>
                            <input
                                type="text"
                                className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-3 pl-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                                placeholder="Search by resident name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="h-72 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30">
                            {isSearching ? (
                                <div className="flex h-full items-center justify-center">
                                    <div className="text-xs font-semibold text-slate-400">Searching available residents...</div>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {searchResults.map((res) => (
                                        <li
                                            key={res.id}
                                            className={`flex cursor-pointer items-center justify-between p-3.5 transition-colors hover:bg-white dark:hover:bg-slate-800 ${
                                                selectedIds.includes(res.id) ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''
                                            }`}
                                            onClick={() => toggleSelection(res.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(res.id)}
                                                    onChange={() => {}}
                                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:border-slate-600 dark:bg-slate-700"
                                                />
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{res.name}</p>
                                                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{res.email}</p>
                                                    {res.current_owner && (
                                                        <p className="mt-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                                            Currently assigned to: {res.current_owner}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex h-full items-center justify-center p-6 text-center">
                                    <div className="text-xs font-semibold text-slate-400">
                                        {searchQuery ? 'No available residents match your search' : 'Type a name or email to search residents'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-5 space-y-3 border-t border-slate-100 pt-3.5 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">Selected:</span>
                            <span className={`font-bold ${selectedIds.length > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                {selectedIds.length > 0 ? `${selectedIds.length} resident(s) selected` : 'None'}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsAssignModalOpen(false)}
                                className="flex-1 whitespace-nowrap rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-center text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAssign}
                                disabled={selectedIds.length === 0 || isSubmitting}
                                className="flex-1 whitespace-nowrap inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 px-4 text-center text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSubmitting ? 'Assigning...' : selectedIds.length > 0 ? `Assign (${selectedIds.length})` : 'Assign Selected'}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}

Residents.layout = (page: any) => {
    const props = page.props;
    const title = props.propertyOwner ? `Residents managed by ${props.propertyOwner.name}` : 'Residents';
    return <AdminLayout title={title} children={page} />;
};
