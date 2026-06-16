import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { MagnifyingGlassIcon, UserPlusIcon, MapPinIcon } from '@heroicons/react/24/outline';
import Modal from '@/Components/Modal';
import axios from 'axios';
import { availableResidents, assignResidents } from '@/actions/App/Http/Controllers/Admin/PropertyOwnerController';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    propertyOwnerId: number;
}

interface AvailableResident {
    id: number;
    name: string;
    email: string;
    current_owner: string | null;
}

export default function AssignResidentModal({ isOpen, onClose, propertyOwnerId }: Props) {
    const [search, setSearch] = useState('');
    const [residents, setResidents] = useState<AvailableResident[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchResidents = useCallback(async (searchQuery: string) => {
        setIsLoading(true);
        try {
            const response = await axios.get(availableResidents.url({ propertyOwner: String(propertyOwnerId) }), {
                params: { search: searchQuery },
            });
            setResidents(response.data);
        } catch (error) {
            console.error('Failed to fetch residents', error);
        } finally {
            setIsLoading(false);
        }
    }, [propertyOwnerId]);

    // Debounce search
    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            fetchResidents(search);
        }, 300);

        return () => clearTimeout(timer);
    }, [search, isOpen, fetchResidents]);

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setSearch('');
            setSelectedIds([]);
            setResidents([]);
        }
    }, [isOpen]);

    const toggleSelection = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const handleAssign = () => {
        if (selectedIds.length === 0) return;

        setIsSubmitting(true);
        router.post(
            assignResidents.url({ propertyOwner: String(propertyOwnerId) }),
            { resident_ids: selectedIds },
            {
                onSuccess: () => {
                    onClose();
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Assign Residents" maxWidth="lg">
            <div className="mt-4">
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        className="block w-full rounded-xl border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        placeholder="Search residents by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="mt-4 h-72 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/50 p-2">
                    {isLoading && residents.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-gray-500">
                            Loading residents...
                        </div>
                    ) : residents.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                            <UserPlusIcon className="mx-auto h-8 w-8 text-gray-300" />
                            <p className="mt-2 text-sm text-gray-500">No unassigned residents found.</p>
                        </div>
                    ) : (
                        <ul className="space-y-1">
                            {residents.map((resident) => (
                                <li key={resident.id}>
                                    <label
                                        className={`flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors ${
                                            selectedIds.includes(resident.id)
                                                ? 'bg-indigo-50 ring-1 ring-indigo-200'
                                                : 'hover:bg-white'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={selectedIds.includes(resident.id)}
                                                onChange={() => toggleSelection(resident.id)}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-900">{resident.name}</span>
                                                <span className="text-xs text-gray-500">{resident.email}</span>
                                            </div>
                                        </div>
                                        {resident.current_owner && (
                                            <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
                                                <MapPinIcon className="h-3 w-3" />
                                                <span>Under {resident.current_owner}</span>
                                            </div>
                                        )}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleAssign}
                        disabled={selectedIds.length === 0 || isSubmitting}
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Assigning...' : `Assign ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
