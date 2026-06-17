import {
    BuildingOffice2Icon,
    ArrowLeftIcon,
    UsersIcon,
    WalletIcon,
    MegaphoneIcon,
    ClockIcon,
    PlusIcon,
    TrashIcon,
    ArrowDownLeftIcon,
    UserPlusIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Head, Link, useForm, router } from '@inertiajs/react';
import MobileSheet from '@/Components/MobileSheet';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { show as showAnnouncement } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/AnnouncementController';
import { assignResident, removeResident, index, show as showProperty } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/PropertyController';
import { WhenVisible } from '@inertiajs/react';
import { useDebounce } from '@/Hooks/useDebounce';
import { Loader2 } from 'lucide-react';

interface Resident {
    id: number;
    ulid: string;
    name: string;
    phone: string | null;
    unit_number: string | null;
    status: string;
}

interface OutstandingCollection {
    id: number;
    resident_name: string;
    name: string;
    amount_due: number;
    amount_paid: number;
    status: string;
    due_date: string;
}

interface Payment {
    id: number;
    resident_name: string;
    collection_name: string;
    amount: number;
    status: string;
    date: string;
}

interface Announcement {
    id: number;
    hashid: string;
    title: string;
    status: string;
    applies_to: string;
    created_at: string;
}

interface Activity {
    type: string;
    description: string;
    date: string;
    timestamp: number;
}

interface EligibleResident {
    id: number;
    name: string;
    property: string;
}

interface Props {
    property: {
        id: number;
        ulid: string;
        name: string;
    };
    residents: Resident[];
    outstandingCollections: {
        data: OutstandingCollection[];
        next_page_url: string | null;
        total: number;
    };
    outstandingBalance: number;
    totalCollected: number;
    payments: Payment[];
    announcements: Announcement[];
    activities: Activity[];
    eligibleResidents: EligibleResident[];
    filters: {
        search_collection: string;
    };
}

type Tab = 'overview' | 'residents' | 'collections' | 'announcements' | 'activity';

export default function Show({ property, residents, outstandingCollections, outstandingBalance, totalCollected, payments, announcements, activities, eligibleResidents, filters }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchCollection, setSearchCollection] = useState(filters.search_collection || '');
    const debouncedSearchCollection = useDebounce(searchCollection, 300);

    useEffect(() => {
        if (debouncedSearchCollection !== (filters.search_collection || '')) {
            router.get(
                showProperty.url(property.ulid),
                { search_collection: debouncedSearchCollection },
                { preserveState: true, preserveScroll: true, replace: true }
            );
        }
    }, [debouncedSearchCollection, filters.search_collection, property.ulid]);

    const filteredResidents =
        searchQuery === ''
            ? eligibleResidents
            : eligibleResidents.filter((resident) =>
                  resident.name.toLowerCase().includes(searchQuery.toLowerCase())
              );

    const assignForm = useForm({
        resident_ids: [] as string[],
    });

    const handleAssign = (e: React.FormEvent) => {
        e.preventDefault();
        assignForm.post(assignResident.url(property.ulid), {
            onSuccess: () => {
                setShowAssignForm(false);
                assignForm.reset();
            },
        });
    };

    const handleRemoveResident = (residentId: number) => {
        if (confirm('Are you sure you want to remove this resident from the property?')) {
            router.post(removeResident.url(property.ulid), { resident_id: residentId });
        }
    };

    return (
        <div className="space-y-8 pb-24">
            <Head title={`Property Details - ${property.name}`} />

            {/* Premium Header */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-indigo-50/40 via-white to-rose-50/20 p-6 ring-1 ring-slate-200/50 sm:p-8">
                <div className="relative flex items-center gap-4">
                    <Link
                        href={index.url()}
                        className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-600"
                    >
                        <ArrowLeftIcon className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{property.name}</h1>
                        <p className="mt-1 text-xs font-bold tracking-wider text-slate-400 uppercase sm:text-sm">
                            Property Overview & Management Dashboard
                        </p>
                    </div>
                </div>
            </div>

            {/* Scrollable Tab Navigation Bar */}
            <div className="relative mt-8 border-b border-slate-200/60">
                <div className="hide-scrollbar -mx-4 flex overflow-x-auto px-4 sm:mx-0 sm:px-0">
                    <div className="flex w-max space-x-8 px-2">
                        {(['overview', 'residents', 'collections', 'announcements', 'activity'] as Tab[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`relative pt-2 pb-4 text-[11px] font-black tracking-widest uppercase transition-all ${
                                    activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activePropertyTab"
                                        className="absolute right-0 bottom-0 left-0 h-[3px] rounded-t-full bg-indigo-600"
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">{tab === 'residents' ? 'occupants' : tab}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Contents */}
            <div className="min-h-96">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {/* Total Residents Card */}
                            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-white via-white to-indigo-50/30 p-6 ring-1 ring-slate-200/50">
                                <div className="relative">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">Total Occupants</h3>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                            <UsersIcon className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <p className="mt-4 text-4xl font-black tracking-tight text-slate-900">{residents.length}</p>
                                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                                        <span className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>Active:{' '}
                                            {residents.filter((r) => r.status === 'active').length}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-rose-400"></div>Suspended:{' '}
                                            {residents.filter((r) => r.status === 'suspended').length}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Outstanding Balance Card */}
                            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-white via-white to-amber-50/40 p-6 ring-1 ring-slate-200/50">
                                <div className="relative">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">Pending Dues</h3>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                                            <WalletIcon className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <p className="mt-4 text-4xl font-black tracking-tight text-slate-900">₦{outstandingBalance.toLocaleString()}</p>
                                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                                        <span>Unpaid Bills: {outstandingCollections.total}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Payments Card */}
                            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 ring-1 ring-indigo-500">
                                <div className="relative">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black tracking-widest text-indigo-200 uppercase">Total Collected</h3>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm">
                                            <ArrowDownLeftIcon className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <p className="mt-4 text-4xl font-black tracking-tight text-white">
                                        ₦{totalCollected.toLocaleString()}
                                    </p>
                                    <div className="mt-6 flex items-center justify-between border-t border-indigo-500/50 pt-4 text-[10px] font-black tracking-wider text-indigo-200 uppercase">
                                        <span>Recent Payment History</span>
                                    </div>
                                </div>
                            </div>

                            {/* Property Details */}
                            <div className="relative col-span-full overflow-hidden rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200/50 sm:p-8">
                                <h3 className="text-sm font-black tracking-wider text-slate-900 uppercase">Property Specifications</h3>
                                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200/50">
                                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">System ID</p>
                                        <div className="mt-2 flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-xs ring-1 ring-slate-200">
                                                <BuildingOffice2Icon className="h-4 w-4" />
                                            </div>
                                            <p className="font-mono text-sm font-bold text-slate-900">{property.ulid}</p>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200/50">
                                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Assigned Profiles</p>
                                        <div className="mt-2 flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200">
                                                <UserPlusIcon className="h-4 w-4" />
                                            </div>
                                            <p className="truncate text-sm font-bold text-slate-900">
                                                {residents.map((r) => r.name).join(', ') || 'No resident assigned'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* RESIDENTS TAB */}
                    {activeTab === 'residents' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-black text-slate-900">Assigned Occupants</h2>
                                {!showAssignForm && (
                                    <button
                                        onClick={() => setShowAssignForm(true)}
                                        className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-600 transition-colors hover:bg-indigo-100"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        Assign Occupant
                                    </button>
                                )}
                            </div>

                                <MobileSheet isOpen={showAssignForm} onClose={() => { setShowAssignForm(false); assignForm.reset(); setSearchQuery(''); }} title="Assign Occupant">
                                    <div className="mt-2 flex flex-col h-full max-h-[70vh]">
                                        {/* Sticky Search Bar */}
                                        <div className="relative shrink-0">
                                            <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                                            <input
                                                type="text"
                                                placeholder="Search occupants by name..."
                                                className="w-full rounded-2xl border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>

                                        {/* Scrollable Resident List */}
                                        <div className="mt-4 flex-1 overflow-y-auto pr-2 pb-4 space-y-2">
                                            {filteredResidents.length === 0 ? (
                                                <div className="py-12 text-center">
                                                    <UsersIcon className="mx-auto h-8 w-8 text-slate-300" />
                                                    <h3 className="mt-4 text-sm font-bold text-slate-900">No occupants found</h3>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {searchQuery ? "We couldn't find anyone matching that search." : "You have no eligible occupants to assign."}
                                                    </p>
                                                </div>
                                            ) : (
                                                filteredResidents.map(resident => (
                                                    <motion.button
                                                        whileTap={{ scale: 0.98 }}
                                                        key={resident.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const ids = assignForm.data.resident_ids;
                                                            if (ids.includes(resident.id.toString())) {
                                                                assignForm.setData('resident_ids', ids.filter(id => id !== resident.id.toString()));
                                                            } else {
                                                                assignForm.setData('resident_ids', [...ids, resident.id.toString()]);
                                                            }
                                                        }}
                                                        className={`flex w-full items-center gap-4 rounded-3xl p-4 text-left transition-all ${
                                                            assignForm.data.resident_ids.includes(resident.id.toString())
                                                                ? 'bg-slate-900 shadow-xl shadow-slate-900/20 ring-1 ring-slate-900'
                                                                : 'bg-white ring-1 ring-slate-100 hover:bg-slate-50 hover:shadow-sm'
                                                        }`}
                                                    >
                                                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-black shadow-inner transition-colors ${
                                                            assignForm.data.resident_ids.includes(resident.id.toString())
                                                                ? 'bg-white/10 text-white'
                                                                : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500'
                                                        }`}>
                                                            {resident.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        
                                                        <div className="flex-1">
                                                            <p className={`text-base font-black tracking-tight ${assignForm.data.resident_ids.includes(resident.id.toString()) ? 'text-white' : 'text-slate-900'}`}>
                                                                {resident.name}
                                                            </p>
                                                            <p className={`mt-0.5 text-xs font-semibold ${assignForm.data.resident_ids.includes(resident.id.toString()) ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                Current Property: {resident.property}
                                                            </p>
                                                        </div>
                                                        
                                                        {assignForm.data.resident_ids.includes(resident.id.toString()) && (
                                                            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                                                <CheckCircleIcon className="h-7 w-7 text-white" />
                                                            </motion.div>
                                                        )}
                                                    </motion.button>
                                                ))
                                            )}
                                        </div>

                                        {/* Submit Button */}
                                        <div className="shrink-0 border-t border-slate-100 pt-4 mt-2">
                                            <button
                                                type="button"
                                                onClick={handleAssign}
                                                disabled={assignForm.processing || assignForm.data.resident_ids.length === 0}
                                                className="w-full rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                {assignForm.processing 
                                                    ? 'Assigning...' 
                                                    : assignForm.data.resident_ids.length > 0 
                                                        ? `Assign ${assignForm.data.resident_ids.length} Selected Occupant${assignForm.data.resident_ids.length > 1 ? 's' : ''}` 
                                                        : 'Select Occupants to Assign'}
                                            </button>
                                            {assignForm.errors.resident_ids && (
                                                <p className="mt-3 text-center text-xs font-bold text-rose-600">{assignForm.errors.resident_ids}</p>
                                            )}
                                        </div>
                                    </div>
                                </MobileSheet>

                            <div className="overflow-hidden rounded-[32px] bg-white shadow-xs ring-1 ring-slate-100">
                                {residents.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {residents.map((resident) => (
                                            <div key={resident.id} className="group relative flex flex-col justify-between rounded-3xl bg-white p-5 ring-1 ring-slate-100 transition-all hover:shadow-xl hover:shadow-slate-200/40">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 font-black text-indigo-600 shadow-inner">
                                                            {resident.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-base font-black text-slate-900">{resident.name}</p>
                                                            <p className="mt-0.5 text-xs font-semibold text-slate-500">{resident.phone || 'No phone number'}</p>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black tracking-wider uppercase ${
                                                            resident.status === 'active'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-rose-100 text-rose-700'
                                                        }`}
                                                    >
                                                        {resident.status}
                                                    </span>
                                                </div>
                                                
                                                <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Unit:</span>
                                                        <span className="text-sm font-black text-slate-700">{resident.unit_number || 'Unassigned'}</span>
                                                    </div>
                                                    
                                                    <button
                                                        onClick={() => handleRemoveResident(resident.id)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-500 transition-colors hover:bg-rose-500 hover:text-white"
                                                        title="Remove occupant from property"
                                                    >
                                                        <TrashIcon className="h-4.5 w-4.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-16 text-center">
                                        <UsersIcon className="mx-auto h-12 w-12 text-slate-300" />
                                        <h3 className="mt-4 text-lg font-black text-slate-900">No occupants</h3>
                                        <p className="mt-1 text-sm text-slate-500">Assign occupants to this property to begin tracking them.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* COLLECTIONS TAB */}
                    {activeTab === 'collections' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Property Collections</h2>
                                <p className="text-xs text-slate-500">Bills and recent payments scoped to this property.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                {/* Outstanding Bills */}
                                <div className="rounded-[32px] bg-white p-6 shadow-xs ring-1 ring-slate-100 flex flex-col h-[500px]">
                                    <div className="shrink-0 mb-4">
                                        <h3 className="font-black text-slate-950">Outstanding Bills</h3>
                                        <div className="mt-3 relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <MagnifyingGlassIcon className="h-4.5 w-4.5 text-slate-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={searchCollection}
                                                onChange={(e) => setSearchCollection(e.target.value)}
                                                className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all"
                                                placeholder="Search bills by occupant or name..."
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pr-2 divide-y divide-slate-100 custom-scrollbar">
                                        {outstandingCollections.data.length > 0 ? (
                                            <>
                                                {outstandingCollections.data.map((bill) => (
                                                    <div key={bill.id} className="flex items-center justify-between py-3.5">
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-950">{bill.name}</p>
                                                            <p className="text-xs font-semibold text-slate-400">
                                                                {bill.resident_name} &middot; Due {bill.due_date}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-black text-slate-900">
                                                                ₦{(bill.amount_due - bill.amount_paid).toLocaleString()}
                                                            </p>
                                                            <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-black tracking-wider text-amber-700 uppercase">
                                                                {bill.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {outstandingCollections.next_page_url && (
                                                    <WhenVisible
                                                        always
                                                        fallback={<div className="py-4 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" /></div>}
                                                        params={{
                                                            data: {
                                                                collections_page: outstandingCollections.current_page + 1,
                                                            },
                                                            only: ['outstandingCollections'],
                                                            preserveUrl: true,
                                                        }}
                                                    >
                                                        <div className="py-4 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" /></div>
                                                    </WhenVisible>
                                                )}
                                            </>
                                        ) : (
                                            <div className="py-8 text-center text-sm font-semibold text-slate-400">No outstanding bills found.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Payment Logs */}
                                <div className="rounded-[32px] bg-white p-6 shadow-xs ring-1 ring-slate-100">
                                    <h3 className="font-black text-slate-900">Recent Receipts</h3>
                                    <div className="mt-4 divide-y divide-slate-100">
                                        {payments.length > 0 ? (
                                            payments.map((p) => (
                                                <div key={p.id} className="flex items-center justify-between py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                                            <ArrowDownLeftIcon className="h-4.5 w-4.5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-950">{p.resident_name}</p>
                                                            <p className="text-xs font-bold text-slate-400">{p.collection_name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-slate-900">₦{p.amount.toLocaleString()}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{p.date}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center text-sm font-semibold text-slate-400">No payment history recorded.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ANNOUNCEMENTS TAB */}
                    {activeTab === 'announcements' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Property Broadcasts</h2>
                                <p className="text-xs text-slate-500">Announcements targeting residents of this property.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {announcements.length > 0 ? (
                                    announcements.map((a) => (
                                        <div key={a.id} className="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-100">
                                            <div className="flex items-center justify-between">
                                                <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-[9px] font-black tracking-wider text-indigo-700 uppercase">
                                                    {a.status}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{a.created_at}</span>
                                            </div>
                                            <h3 className="mt-3 text-base font-black text-slate-950">{a.title}</h3>
                                            <div className="mt-4 flex items-center justify-between">
                                                <span className="text-xs font-semibold text-slate-500">Target: {a.applies_to}</span>
                                                <Link
                                                    href={showAnnouncement.url(a.hashid as any)}
                                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                                                >
                                                    Read Announcement
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full rounded-[32px] bg-white py-12 text-center shadow-xs ring-1 ring-slate-100">
                                        <MegaphoneIcon className="mx-auto h-12 w-12 text-slate-300" />
                                        <p className="mt-2 text-sm font-semibold text-slate-500">No announcements sent to this property.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ACTIVITY TAB */}
                    {activeTab === 'activity' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Activity Logs</h2>
                                <p className="text-xs text-slate-500">Property transaction timelines.</p>
                            </div>

                            <div className="rounded-[32px] bg-white p-6 shadow-xs ring-1 ring-slate-100">
                                {activities.length > 0 ? (
                                    <div className="flow-root">
                                        <ul className="-mb-8">
                                            {activities.map((act, actIdx) => (
                                                <li key={actIdx}>
                                                    <div className="relative pb-8">
                                                        {actIdx !== activities.length - 1 ? (
                                                            <span
                                                                className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-slate-100"
                                                                aria-hidden="true"
                                                            />
                                                        ) : null}
                                                        <div className="relative flex items-start space-x-3">
                                                            <div className="relative">
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-8 ring-white">
                                                                    <ClockIcon className="h-5 w-5" />
                                                                </div>
                                                            </div>
                                                            <div className="min-w-0 flex-1 py-1.5">
                                                                <p className="text-sm font-bold text-slate-900">{act.description}</p>
                                                                <p className="mt-1 text-xs font-bold text-slate-400 uppercase">{act.date}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-sm font-semibold text-slate-400">No recent property activities.</div>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
