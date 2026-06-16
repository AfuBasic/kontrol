import { useState, useEffect, useCallback } from 'react';
import { UsersIcon, MapPinIcon, EnvelopeIcon, PhoneIcon, UserPlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { index, availableResidents, assignResidents } from '@/actions/App/Http/Controllers/Admin/PropertyOwnerController';
import { create as createResident } from '@/actions/App/Http/Controllers/Admin/ResidentController';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import axios from 'axios';

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
        name: string;
    };
    residents: Resident[];
}

export default function Residents({ propertyOwner, residents }: Props) {
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<AvailableResident[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchAvailableResidents = useCallback(
        async (query: string) => {
            setIsSearching(true);
            try {
                const response = await axios.get(availableResidents.url(propertyOwner.id), {
                    params: { search: query },
                });
                setSearchResults(response.data);
            } catch (error) {
                console.error('Failed to fetch available residents', error);
            } finally {
                setIsSearching(false);
            }
        },
        [propertyOwner.id],
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
        if (selectedIds.length === 0) return;

        setIsSubmitting(true);
        router.post(
            assignResidents.url(propertyOwner.id),
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

    return (
        <>
            <Head title={`Residents - ${propertyOwner.name}`} />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Link href={index.url()} className="font-bold transition-colors hover:text-indigo-600">
                                Property Owners
                            </Link>
                            <span>/</span>
                            <span className="font-bold text-slate-800">{propertyOwner.name}</span>
                            <span>/</span>
                            <span className="text-slate-850 font-bold">Residents</span>
                        </div>
                        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Managed Residents</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Listing all occupants delegated to <span className="font-bold text-slate-800">{propertyOwner.name}</span>.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsAssignModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                        >
                            <UserPlusIcon className="h-5 w-5" />
                            <span>Assign Resident</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-[32px] bg-white shadow-xs ring-1 ring-slate-100">
                    {residents.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">Name</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Contact
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Assigned Property
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {residents.map((resident) => (
                                        <tr key={resident.id} className="transition-colors hover:bg-slate-50/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 font-bold text-slate-500">
                                                        {resident.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900">{resident.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                                                    <span className="flex items-center gap-1.5 font-bold text-slate-900">
                                                        <EnvelopeIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                        {resident.email}
                                                    </span>
                                                    {resident.phone && (
                                                        <span className="flex items-center gap-1.5">
                                                            <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                            {resident.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {resident.property ? (
                                                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600">
                                                        <MapPinIcon className="h-4 w-4 shrink-0 text-slate-400" />
                                                        {resident.property}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-400 italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase ${
                                                        resident.suspended_at
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : resident.status === 'accepted'
                                                              ? 'bg-emerald-100 text-emerald-700'
                                                              : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {resident.suspended_at ? 'Suspended' : resident.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <UsersIcon className="mx-auto h-12 w-12 text-slate-300" />
                            <h3 className="mt-4 text-lg font-black text-slate-900">No Residents Assigned</h3>
                            <p className="mt-1 text-sm text-slate-500">This Property Owner has no delegated occupants yet.</p>
                            <div className="mt-6 flex items-center justify-center gap-4">
                                <button
                                    onClick={() => setIsAssignModalOpen(true)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700"
                                >
                                    <UserPlusIcon className="h-5 w-5" />
                                    <span>Assign Resident</span>
                                </button>
                                <Link
                                    href={createResident.url()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50"
                                >
                                    Delegate a Resident
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Modal show={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} maxWidth="2xl">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-slate-900">Assign Residents</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Search and select existing residents in the estate to assign them to {propertyOwner.name}.
                    </p>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                            </div>
                            <input
                                type="text"
                                className="block w-full rounded-xl border-0 py-3 pr-3 pl-10 text-slate-900 shadow-sm ring-1 ring-slate-300 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="h-80 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50">
                            {isSearching ? (
                                <div className="flex h-full items-center justify-center">
                                    <div className="text-sm font-semibold text-slate-400">Searching...</div>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <ul className="divide-y divide-slate-200">
                                    {searchResults.map((res) => (
                                        <li
                                            key={res.id}
                                            className={`flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-white ${
                                                selectedIds.includes(res.id) ? 'bg-indigo-50 hover:bg-indigo-50' : ''
                                            }`}
                                            onClick={() => toggleSelection(res.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(res.id)}
                                                    onChange={() => {}}
                                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                                />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{res.name}</p>
                                                    <p className="text-xs font-semibold text-slate-500">{res.email}</p>
                                                    {res.current_owner && (
                                                        <p className="mt-1 text-xs font-medium text-amber-600">
                                                            Currently assigned to: {res.current_owner}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <div className="text-sm font-semibold text-slate-400">
                                        {searchQuery ? 'No available residents found' : 'Type to search available residents'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsAssignModalOpen(false)}
                            className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-300 ring-inset hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleAssign}
                            disabled={selectedIds.length === 0 || isSubmitting}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Assigning...' : `Assign Selected (${selectedIds.length})`}
                        </button>
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
