import { BuildingOffice2Icon, PlusIcon, UsersIcon, WalletIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Head, useForm, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { store, update, destroy, show } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/PropertyController';
import { useResidentConfirmation } from '@/Components/ConfirmationProvider';

interface Property {
    id: number;
    ulid: string;
    name: string;
    residents_count: number;
    outstanding_balance: number;
    created_at: string;
}

interface Props {
    properties: Property[];
}

export default function Index({ properties }: Props) {
    const { confirm } = useResidentConfirmation();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);

    const createForm = useForm({
        name: '',
    });

    const editForm = useForm({
        name: '',
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(store.url(), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProperty) return;
        editForm.put(update.url(editingProperty.ulid), {
            onSuccess: () => {
                setEditingProperty(null);
                editForm.reset();
            },
        });
    };

    const deleteProperty = (property: Property) => {
        confirm({
            title: 'Archive property',
            message: 'Are you sure you want to archive this property? Any assigned residents will be unassigned.',
            confirmLabel: 'Archive property',
            onConfirm: () => router.delete(destroy.url(property.ulid)),
        });
    };

    return (
        <div className="space-y-6 pb-24">
            <Head title="Properties Hub" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Properties Hub</h1>
                    <p className="mt-1 text-sm text-slate-500">Create, inspect, and organize your real estate holdings.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="shadow-indigo-650/15 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-700 active:scale-98 sm:w-auto"
                >
                    <PlusIcon className="h-5 w-5" />
                    Add Property
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {properties.length > 0 ? (
                    properties.map((property) => (
                        <div
                            key={property.id}
                            onClick={() => router.visit(show.url(property.ulid))}
                            className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[32px] bg-white p-6 shadow-xs ring-1 ring-slate-100 transition-all hover:shadow-lg active:scale-[0.98]"
                        >
                            <div>
                                <div className="flex items-start justify-between">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                        <BuildingOffice2Icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex items-center gap-1.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingProperty(property);
                                                editForm.setData('name', property.name);
                                            }}
                                            className="rounded-xl p-1.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-indigo-600"
                                        >
                                            <PencilSquareIcon className="h-4.5 w-4.5" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteProperty(property);
                                            }}
                                            className="rounded-xl p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                        >
                                            <TrashIcon className="h-4.5 w-4.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <h2 className="text-lg font-black text-slate-900 transition-colors group-hover:text-indigo-600">
                                        {property.name}
                                    </h2>
                                    <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase">Created {property.created_at}</p>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                                <div className="flex items-center gap-2">
                                    <UsersIcon className="h-5 w-5 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="text-sm font-black text-slate-900">{property.residents_count}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Occupants</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <WalletIcon className="h-5 w-5 shrink-0 text-slate-400" />
                                    <div>
                                        <p className="text-sm font-black text-slate-900">₦{Number(property.outstanding_balance).toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Balance</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full rounded-[32px] bg-white px-6 py-16 text-center shadow-xs ring-1 ring-slate-100">
                        <BuildingOffice2Icon className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-4 text-lg font-black text-slate-900">No Properties Registered</h3>
                        <p className="mt-1 text-sm text-slate-500">Create your first property to start organizing residents and collections.</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700"
                        >
                            Add Property
                        </button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white p-6 shadow-2xl ring-1 ring-slate-100 sm:p-8"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-950">Add New Property</h3>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="hover:text-slate-650 rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-50"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="mt-6 space-y-4" noValidate>
                                <div>
                                    <label htmlFor="create-name" className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                                        Property Name
                                    </label>
                                    <input
                                        type="text"
                                        id="create-name"
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="e.g. Block A, Villa 12"
                                    />
                                    {createForm.errors.name && <p className="mt-1 text-xs font-bold text-rose-600">{createForm.errors.name}</p>}
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createForm.processing}
                                        className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/10 transition-all hover:bg-indigo-700 active:scale-98 disabled:opacity-50"
                                    >
                                        {createForm.processing ? 'Adding...' : 'Add Property'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingProperty && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditingProperty(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white p-6 shadow-2xl ring-1 ring-slate-100 sm:p-8"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-950">Rename Property</h3>
                                <button
                                    onClick={() => setEditingProperty(null)}
                                    className="hover:text-slate-650 rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-50"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit} className="mt-6 space-y-4" noValidate>
                                <div>
                                    <label htmlFor="edit-name" className="block text-xs font-bold tracking-wider text-slate-700 uppercase">
                                        Property Name
                                    </label>
                                    <input
                                        type="text"
                                        id="edit-name"
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="e.g. Block A, Villa 12"
                                    />
                                    {editForm.errors.name && <p className="mt-1 text-xs font-bold text-rose-600">{editForm.errors.name}</p>}
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setEditingProperty(null)}
                                        className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/10 transition-all hover:bg-indigo-700 active:scale-98 disabled:opacity-50"
                                    >
                                        {editForm.processing ? 'Saving...' : 'Rename'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
