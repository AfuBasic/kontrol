import { ArchiveBoxIcon, EllipsisHorizontalIcon, MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Head, Link, useForm } from '@inertiajs/react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import Modal from '@/Components/Modal';
import FilterBar, { FilterChips } from '@/Components/UI/FilterBar';
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
    const [menuZoneId, setMenuZoneId] = useState<number | null>(null);

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

    const peopleIn = (z: Zone) => (z.residents_count ?? 0) + (z.property_owners_count ?? 0);
    const totalPeople = zones.reduce((sum, z) => sum + peopleIn(z), 0);
    const usedZones = zones.filter((z) => peopleIn(z) > 0).length;
    const unusedZones = zones.length - usedZones;

    // Busiest zones first; unused zones sink to the bottom.
    const rankedZones = useMemo(() => [...filteredZones].sort((a, b) => peopleIn(b) - peopleIn(a)), [filteredZones]);

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
                        <FilterBar
                            search={search}
                            onSearch={setSearch}
                            placeholder="Search zones"
                            searchLabel="Search zones by name or description"
                            activeCount={statusFilter !== 'all' ? 1 : 0}
                            hasActive={Boolean(search) || statusFilter !== 'all'}
                            onReset={() => {
                                setSearch('');
                                setStatusFilter('all');
                            }}
                        >
                            <FilterChips
                                label="Status"
                                value={statusFilter}
                                onChange={(val) => setStatusFilter(val as 'all' | 'active' | 'inactive')}
                                options={[
                                    { value: 'all', label: `All (${zones.length})` },
                                    { value: 'active', label: `Active (${totalActive})` },
                                    { value: 'inactive', label: `Inactive (${zones.length - totalActive})` },
                                ]}
                            />
                        </FilterBar>

                        {/* Zone Grid or Search Empty State */}
                        {filteredZones.length > 0 ? (
                            <div className="space-y-3">
                                <p className="px-1 text-xs text-slate-500">
                                    <span className="font-bold text-slate-900">{totalPeople}</span> people across{' '}
                                    <span className="font-bold text-slate-900">{usedZones}</span> of {zones.length} zones
                                    {unusedZones > 0 && ` · ${unusedZones} unused`}
                                </p>

                                <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
                                    {rankedZones.map((zone) => {
                                        const residents = zone.residents_count ?? 0;
                                        const landlords = zone.property_owners_count ?? 0;
                                        const people = residents + landlords;
                                        const share = totalPeople > 0 ? (people / totalPeople) * 100 : 0;

                                        return (
                                            <li key={zone.id} className="relative flex items-center gap-3 px-4 py-4 sm:gap-5 sm:px-5">
                                                <div className="min-w-0 flex-1 sm:w-48 sm:flex-none">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="truncate text-sm font-bold text-slate-900">{zone.name}</h3>
                                                        {!zone.is_active && (
                                                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </div>
                                                    {zone.description && <p className="mt-0.5 truncate text-xs text-slate-500">{zone.description}</p>}
                                                </div>

                                                <div className="hidden min-w-0 flex-1 sm:block">
                                                    {people === 0 ? (
                                                        <span className="text-xs text-slate-400">Unused · nobody assigned yet</span>
                                                    ) : (
                                                        <div
                                                            className="h-2 overflow-hidden rounded-full bg-slate-100"
                                                            role="img"
                                                            aria-label={`${Math.round(share)}% of people`}
                                                        >
                                                            <div
                                                                className="h-full rounded-full bg-slate-800"
                                                                style={{ width: `${Math.max(share, 2)}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="shrink-0 text-right text-xs">
                                                    {people === 0 ? (
                                                        <span className="text-slate-400 sm:hidden">Unused</span>
                                                    ) : (
                                                        <>
                                                            <p className="font-bold text-slate-900">{Math.round(share)}%</p>
                                                            <p className="mt-0.5 text-slate-500">
                                                                <Link
                                                                    href={`/admin/residents?zone=${zone.id}`}
                                                                    className="hover:text-slate-900 hover:underline"
                                                                >
                                                                    {residents} residents
                                                                </Link>
                                                                {' · '}
                                                                <Link
                                                                    href={`/admin/property-owners?zone=${zone.id}`}
                                                                    className="hover:text-slate-900 hover:underline"
                                                                >
                                                                    {landlords} landlords
                                                                </Link>
                                                            </p>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="relative shrink-0">
                                                    <button
                                                        onClick={() => setMenuZoneId(menuZoneId === zone.id ? null : zone.id)}
                                                        aria-label={`Actions for ${zone.name}`}
                                                        aria-expanded={menuZoneId === zone.id}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                                    >
                                                        <EllipsisHorizontalIcon className="h-5 w-5" />
                                                    </button>
                                                    {menuZoneId === zone.id && (
                                                        <>
                                                            <div
                                                                className="fixed inset-0 z-20"
                                                                onClick={() => setMenuZoneId(null)}
                                                                aria-hidden="true"
                                                            />
                                                            <div className="absolute top-full right-0 z-30 mt-1 w-40 rounded-xl border border-slate-200/80 bg-white py-1 shadow-lg shadow-slate-900/5">
                                                                <button
                                                                    onClick={() => {
                                                                        setMenuZoneId(null);
                                                                        startEditing(zone);
                                                                    }}
                                                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                                >
                                                                    <PencilSquareIcon className="h-4 w-4 text-slate-400" />
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setMenuZoneId(null);
                                                                        setArchivingZone(zone);
                                                                    }}
                                                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                                                >
                                                                    <ArchiveBoxIcon className="h-4 w-4 text-rose-400" />
                                                                    Archive
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
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
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="md">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                        <h3 className="text-base font-black text-slate-900">Create Zone</h3>
                        <p className="text-xs font-semibold text-slate-500">Define a physical area within this estate.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(false)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4" noValidate>
                    <div>
                        <label htmlFor="create_zone_name" className="block text-xs font-black tracking-wider text-slate-700 uppercase">
                            Zone Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            id="create_zone_name"
                            type="text"
                            required
                            placeholder="e.g. Block A, Phase 1, North Wing"
                            value={createForm.data.name}
                            onChange={(e) => createForm.setData('name', e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-hidden"
                        />
                        {createForm.errors.name && <p className="mt-1 text-xs font-semibold text-rose-500">{createForm.errors.name}</p>}
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="create_zone_desc" className="block text-xs font-black tracking-wider text-slate-700 uppercase">
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
                        {createForm.errors.description && <p className="mt-1 text-xs font-semibold text-rose-500">{createForm.errors.description}</p>}
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
            </Modal>

            {/* Edit Zone Modal */}
            <Modal isOpen={Boolean(editingZone)} onClose={() => setEditingZone(null)} maxWidth="md">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                        <h3 className="text-base font-black text-slate-900">Edit Zone</h3>
                        <p className="text-xs font-semibold text-slate-500">Update area name, details, or active status.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setEditingZone(null)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleEditSubmit} className="mt-5 space-y-4" noValidate>
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
                        {editForm.errors.description && <p className="mt-1 text-xs font-semibold text-rose-500">{editForm.errors.description}</p>}
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
            </Modal>

            {/* Archive Confirmation Dialog */}
            <Modal isOpen={Boolean(archivingZone)} onClose={() => setArchivingZone(null)} maxWidth="md">
                {archivingZone && (
                    <>
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

                        <form
                            onSubmit={handleArchiveSubmit}
                            className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4"
                            noValidate
                        >
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
                    </>
                )}
            </Modal>
        </>
    );
}

ZonesIndex.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
