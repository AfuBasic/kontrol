import { ArchiveBoxIcon, MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Head, Link, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Building2, Loader2, Shield, Users } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import ZoneEmptyState from '@/Components/Admin/Zones/ZoneEmptyState';
import { destroy, store, update } from '@/actions/App/Http/Controllers/Admin/ZoneController';

type Zone = {
    id: number;
    estate_id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    residents_count?: number;
    property_owners_count?: number;
    created_at: string;
};

type Props = {
    zones: Zone[];
};

export default function ZonesIndex({ zones }: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
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
        createForm.post(store.url(), {
            onSuccess: () => {
                createForm.reset();
                setIsCreateModalOpen(false);
            },
        });
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingZone) return;

        editForm.put(update.url(editingZone.id), {
            onSuccess: () => {
                setEditingZone(null);
            },
        });
    };

    const handleArchiveSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!archivingZone) return;

        archiveForm.delete(destroy.url(archivingZone.id), {
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

    const filteredZones = zones.filter((z) => {
        const matchesSearch =
            z.name.toLowerCase().includes(search.toLowerCase()) || (z.description && z.description.toLowerCase().includes(search.toLowerCase()));

        if (!matchesSearch) return false;

        if (statusFilter === 'active') return z.is_active;
        if (statusFilter === 'inactive') return !z.is_active;
        return true;
    });

    const totalActive = zones.filter((z) => z.is_active).length;

    return (
        <>
            <Head title="Zone Management - Kontrol" />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black tracking-tight text-slate-900">Zone Management</h1>
                            {zones.length > 0 && (
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                                    {totalActive} Active {totalActive === 1 ? 'Zone' : 'Zones'}
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Create and manage the physical areas (blocks, phases, wings) that make up your estate.
                        </p>
                    </div>
                    <div>
                        <button
                            onClick={() => {
                                createForm.reset();
                                setIsCreateModalOpen(true);
                            }}
                            className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4.5 py-2.5 text-xs font-black tracking-wide text-white uppercase shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                        >
                            <PlusIcon className="h-4 w-4" strokeWidth={3} />
                            Create Zone
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                {zones.length === 0 ? (
                    <ZoneEmptyState
                        onCreateZone={() => {
                            createForm.reset();
                            setIsCreateModalOpen(true);
                        }}
                    />
                ) : (
                    <>
                        {/* Content Toolbar */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative w-full max-w-sm">
                                <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search zones by name or description..."
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-9 pl-10 text-xs font-semibold shadow-xs placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-hidden"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        aria-label="Clear search"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs focus:border-slate-800 focus:outline-hidden"
                                >
                                    <option value="all">All Zones ({zones.length})</option>
                                    <option value="active">Active Only ({totalActive})</option>
                                    <option value="inactive">Inactive Only ({zones.length - totalActive})</option>
                                </select>
                            </div>
                        </div>

                        {/* Zone Grid or Search Empty State */}
                        {filteredZones.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredZones.map((zone) => (
                                    <motion.div
                                        key={zone.id}
                                        layout
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
                                    >
                                        <div>
                                            {/* Header: Name & Status */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex min-w-0 items-center gap-2.5">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                                                        <Building2 className="h-4 w-4" />
                                                    </div>
                                                    <h3 className="truncate text-sm font-black text-slate-900">{zone.name}</h3>
                                                </div>
                                                <span
                                                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase ${
                                                        zone.is_active
                                                            ? 'border border-emerald-200/60 bg-emerald-50 text-emerald-700'
                                                            : 'border border-slate-200/60 bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${zone.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}
                                                    />
                                                    {zone.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>

                                            {/* Description */}
                                            <p className="mt-2.5 line-clamp-2 min-h-[32px] text-xs leading-relaxed font-medium text-slate-500">
                                                {zone.description || <span className="text-slate-400 italic">No description provided</span>}
                                            </p>

                                            {/* Operational Associations */}
                                            <div className="mt-4 grid grid-cols-2 gap-2">
                                                <Link
                                                    href={`/admin/residents?zone=${zone.id}`}
                                                    className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 transition-all hover:border-slate-200 hover:bg-slate-100"
                                                    title={`View residents in ${zone.name}`}
                                                >
                                                    <Users className="h-4 w-4 text-slate-400" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs leading-none font-black text-slate-900">{zone.residents_count ?? 0}</p>
                                                        <p className="mt-0.5 truncate text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                                                            Residents
                                                        </p>
                                                    </div>
                                                </Link>

                                                <Link
                                                    href={`/admin/property-owners?zone=${zone.id}`}
                                                    className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 transition-all hover:border-slate-200 hover:bg-slate-100"
                                                    title={`View landlords in ${zone.name}`}
                                                >
                                                    <Building2 className="h-4 w-4 text-slate-400" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs leading-none font-black text-slate-900">
                                                            {zone.property_owners_count ?? 0}
                                                        </p>
                                                        <p className="mt-0.5 truncate text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                                                            Landlords
                                                        </p>
                                                    </div>
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                                            <button
                                                onClick={() => startEditing(zone)}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                                            >
                                                <PencilSquareIcon className="h-3.5 w-3.5 text-slate-400" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setArchivingZone(zone)}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-rose-600 shadow-2xs transition-all hover:border-rose-200 hover:bg-rose-50 active:scale-95"
                                            >
                                                <ArchiveBoxIcon className="h-3.5 w-3.5 text-rose-400" />
                                                Archive
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xs">
                                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                    <MagnifyingGlassIcon className="h-5 w-5" />
                                </div>
                                <h3 className="mt-3 text-sm font-bold text-slate-900">No zones match your search</h3>
                                <p className="mt-1 text-xs font-medium text-slate-500">
                                    We couldn't find any zone matching your search or active filter.
                                </p>
                                <div className="mt-4">
                                    <button
                                        onClick={() => {
                                            setSearch('');
                                            setStatusFilter('all');
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50"
                                    >
                                        <XMarkIcon className="h-3.5 w-3.5" />
                                        Clear search and filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create Zone Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateModalOpen(false)}
                            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Create Zone</h3>
                                    <p className="text-xs font-semibold text-slate-500">Define a physical area within this estate.</p>
                                </div>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
                                <div>
                                    <label htmlFor="create_zone_name" className="block text-xs font-black tracking-wider text-slate-700 uppercase">
                                        Zone Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        id="create_zone_name"
                                        type="text"
                                        required
                                        autoFocus
                                        placeholder="e.g. Block A, Phase 1, North Wing"
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-hidden"
                                    />
                                    {createForm.errors.name && <p className="mt-1 text-xs font-semibold text-rose-500">{createForm.errors.name}</p>}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <label
                                            htmlFor="create_zone_desc"
                                            className="block text-xs font-black tracking-wider text-slate-700 uppercase"
                                        >
                                            Description
                                        </label>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Optional</span>
                                    </div>
                                    <textarea
                                        id="create_zone_desc"
                                        rows={3}
                                        placeholder="Optional description for this area."
                                        value={createForm.data.description}
                                        onChange={(e) => createForm.setData('description', e.target.value)}
                                        className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-hidden"
                                    />
                                    {createForm.errors.description && (
                                        <p className="mt-1 text-xs font-semibold text-rose-500">{createForm.errors.description}</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createForm.processing}
                                        className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-black tracking-wider text-white uppercase shadow-sm transition-all hover:bg-slate-800 disabled:opacity-50"
                                    >
                                        {createForm.processing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                        {createForm.processing ? 'Creating...' : 'Create Zone'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Zone Modal */}
            <AnimatePresence>
                {editingZone && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditingZone(null)}
                            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Edit Zone</h3>
                                    <p className="text-xs font-semibold text-slate-500">Update area name, details, or active status.</p>
                                </div>
                                <button
                                    onClick={() => setEditingZone(null)}
                                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
                                <div>
                                    <label htmlFor="edit_zone_name" className="block text-xs font-black tracking-wider text-slate-700 uppercase">
                                        Zone Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        id="edit_zone_name"
                                        type="text"
                                        required
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-hidden"
                                    />
                                    {editForm.errors.name && <p className="mt-1 text-xs font-semibold text-rose-500">{editForm.errors.name}</p>}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="edit_zone_desc" className="block text-xs font-black tracking-wider text-slate-700 uppercase">
                                            Description
                                        </label>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Optional</span>
                                    </div>
                                    <textarea
                                        id="edit_zone_desc"
                                        rows={3}
                                        value={editForm.data.description}
                                        onChange={(e) => editForm.setData('description', e.target.value)}
                                        className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-hidden"
                                    />
                                    {editForm.errors.description && (
                                        <p className="mt-1 text-xs font-semibold text-rose-500">{editForm.errors.description}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 pt-1">
                                    <input
                                        type="checkbox"
                                        id="edit_is_active"
                                        checked={editForm.data.is_active}
                                        onChange={(e) => editForm.setData('is_active', e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
                                    />
                                    <label htmlFor="edit_is_active" className="text-xs font-bold text-slate-700">
                                        Active in estate management
                                    </label>
                                </div>

                                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingZone(null)}
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-black tracking-wider text-white uppercase shadow-sm transition-all hover:bg-slate-800 disabled:opacity-50"
                                    >
                                        {editForm.processing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                        {editForm.processing ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Archive Confirmation Dialog */}
            <AnimatePresence>
                {archivingZone && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setArchivingZone(null)}
                            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl"
                        >
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 text-rose-600">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Archive Zone?</h3>
                                    <p className="text-xs font-semibold text-slate-500">Deactivate zone from active estate management</p>
                                </div>
                            </div>

                            <p className="mt-4 text-xs leading-relaxed font-medium text-slate-600">
                                Are you sure you want to archive <strong className="text-slate-900">{archivingZone.name}</strong>?
                            </p>

                            <div className="mt-3 rounded-xl border border-amber-200/60 bg-amber-50/70 p-3 text-[11px] leading-relaxed font-medium text-amber-900">
                                <strong className="font-bold">Historical Records Preserved:</strong> Archiving removes this zone from new resident,
                                property, and staff assignment selectors. All existing historical logs, incident reports, and records are retained for
                                audits.
                            </div>

                            <form onSubmit={handleArchiveSubmit} className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setArchivingZone(null)}
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={archiveForm.processing}
                                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-black tracking-wider text-white uppercase shadow-sm transition-all hover:bg-rose-700 disabled:opacity-50"
                                >
                                    {archiveForm.processing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    {archiveForm.processing ? 'Archiving...' : 'Archive Zone'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

ZonesIndex.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
