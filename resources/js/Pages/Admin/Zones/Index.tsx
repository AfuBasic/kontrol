import AdminLayout from '@/Layouts/AdminLayout';
import {
    ArchiveBoxIcon,
    BuildingOfficeIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    PlusIcon,
    UserGroupIcon,
    UsersIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { type FormEvent, useState } from 'react';

type Zone = {
    id: number;
    estate_id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    memberships_count?: number;
    assignments_count?: number;
    created_at: string;
};

type Props = {
    zones: Zone[];
};

export default function ZonesIndex({ zones }: Props) {
    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingZone, setEditingZone] = useState<Zone | null>(null);
    const [archivingZone, setArchivingZone] = useState<Zone | null>(null);

    const createForm = useForm({
        name: '',
        description: '',
        is_active: true,
    });

    const editForm = useForm({
        name: '',
        description: '',
        is_active: true,
    });

    const archiveForm = useForm({});

    const handleCreateSubmit = (e: FormEvent) => {
        e.preventDefault();
        createForm.post('/admin/zones', {
            onSuccess: () => {
                createForm.reset();
                setIsCreateModalOpen(false);
            },
        });
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingZone) return;

        editForm.put(`/admin/zones/${editingZone.id}`, {
            onSuccess: () => {
                setEditingZone(null);
            },
        });
    };

    const handleArchiveSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!archivingZone) return;

        archiveForm.delete(`/admin/zones/${archivingZone.id}`, {
            onSuccess: () => {
                setArchivingZone(null);
            },
        });
    };

    const startEditing = (zone: Zone) => {
        setEditingZone(zone);
        editForm.setData({
            name: zone.name,
            description: zone.description || '',
            is_active: zone.is_active,
        });
    };

    const filteredZones = zones.filter(
        (z) =>
            z.name.toLowerCase().includes(search.toLowerCase()) ||
            (z.description && z.description.toLowerCase().includes(search.toLowerCase()))
    );

    const totalActive = zones.filter((z) => z.is_active).length;
    const totalMembers = zones.reduce((acc, z) => acc + (z.memberships_count || 0), 0);
    const totalAssignments = zones.reduce((acc, z) => acc + (z.assignments_count || 0), 0);

    return (
        <AdminLayout title="Zone Management">
            <Head title="Zone Management - Kontrol" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Zone Management</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Create and manage physical subdivisions (blocks, phases, wings) within your estate.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Create Zone
                    </button>
                </div>

                {/* Stats Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
                                <BuildingOfficeIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Zones</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{zones.length}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                <CheckCircleIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Zones</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{totalActive}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                <UsersIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Zone Members</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{totalMembers}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                <UserGroupIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Staff Assignments</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{totalAssignments}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Filter / Search Bar */}
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="relative flex-1 max-w-md">
                        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search zones by name or description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                        />
                    </div>
                </div>

                {/* Zone Cards Grid */}
                {filteredZones.length > 0 ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {filteredZones.map((zone) => (
                            <motion.div
                                key={zone.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                <BuildingOfficeIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                                    {zone.name}
                                                </h3>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        zone.is_active
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}
                                                >
                                                    {zone.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {zone.description && (
                                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                            {zone.description}
                                        </p>
                                    )}

                                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
                                        <div>
                                            <span className="text-slate-400">Memberships:</span>{' '}
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                {zone.memberships_count || 0}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Assignments:</span>{' '}
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                {zone.assignments_count || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => startEditing(zone)}
                                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-all"
                                    >
                                        <PencilSquareIcon className="h-4 w-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setArchivingZone(zone)}
                                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition-all"
                                    >
                                        <ArchiveBoxIcon className="h-4 w-4" />
                                        Archive
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                        <BuildingOfficeIcon className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">No zones found</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {search
                                ? 'No zones match your search query.'
                                ? 'Get started by creating your estate’s first zone.'}
                        </p>
                        {!search && (
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-500"
                            >
                                <PlusIcon className="h-5 w-5" />
                                Create Zone
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Create Zone Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                    >
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Zone</h3>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    Zone Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Block A, Phase 1, Residential Wing"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                                {createForm.errors.name && (
                                    <p className="mt-1 text-xs text-rose-500">{createForm.errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    Description (Optional)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Add details about this zone's boundaries or purpose..."
                                    value={createForm.data.description}
                                    onChange={(e) => createForm.setData('description', e.target.value)}
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 disabled:opacity-50"
                                >
                                    Create Zone
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Edit Zone Modal */}
            {editingZone && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                    >
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Zone</h3>
                            <button
                                onClick={() => setEditingZone(null)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    Zone Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                                {editForm.errors.name && (
                                    <p className="mt-1 text-xs text-rose-500">{editForm.errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={editForm.data.description}
                                    onChange={(e) => editForm.setData('description', e.target.value)}
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="edit_is_active"
                                    checked={editForm.data.is_active}
                                    onChange={(e) => editForm.setData('is_active', e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                                <label htmlFor="edit_is_active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Zone Active Status
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingZone(null)}
                                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 disabled:opacity-50"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Archive Confirmation Dialog */}
            {archivingZone && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                    >
                        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <ExclamationTriangleIcon className="h-6 w-6" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Archive Zone</h3>
                        </div>

                        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            Are you sure you want to archive <strong className="text-slate-900 dark:text-white">{archivingZone.name}</strong>?
                        </p>
                        <div className="mt-3 rounded-xl bg-amber-50 p-3.5 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                            <strong>Historical Integrity Preserved:</strong> Archiving this zone soft-deletes the zone record. All historical incidents, visitor logs, and compliance records associated with this zone remain completely intact for audit purposes.
                        </div>

                        <form onSubmit={handleArchiveSubmit} className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setArchivingZone(null)}
                                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={archiveForm.processing}
                                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 disabled:opacity-50"
                            >
                                Archive Zone
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AdminLayout>
    );
}
