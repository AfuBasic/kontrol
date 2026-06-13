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
} from '@heroicons/react/24/outline';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { show as showAnnouncement } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/AnnouncementController';
import { assignResident, removeResident, index } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/PropertyController';

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
    outstandingCollections: OutstandingCollection[];
    payments: Payment[];
    announcements: Announcement[];
    activities: Activity[];
    eligibleResidents: EligibleResident[];
}

type Tab = 'overview' | 'residents' | 'collections' | 'announcements' | 'activity';

export default function Show({ property, residents, outstandingCollections, payments, announcements, activities, eligibleResidents }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [showAssignForm, setShowAssignForm] = useState(false);

    const assignForm = useForm({
        resident_id: '',
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
            useForm({ resident_id: residentId }).post(removeResident.url(property.ulid));
        }
    };

    const outstandingBalance = outstandingCollections.reduce((acc, curr) => acc + (curr.amount_due - curr.amount_paid), 0);

    return (
        <div className="space-y-6 pb-24">
            <Head title={`Property Details - ${property.name}`} />

            {/* Header */}
            <div className="flex items-center gap-3">
                <Link
                    href={index.url()}
                    className="text-slate-655 hover:bg-slate-550 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs ring-1 ring-slate-100 transition-all"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-black text-slate-900">{property.name}</h1>
                    <p className="text-xs text-slate-500">Property Overview & Management Dashboard</p>
                </div>
            </div>

            {/* Custom Tab Navigation Bar */}
            <div className="flex rounded-2xl border-b border-slate-100 bg-white px-2 pt-2 shadow-xs ring-1 ring-slate-100">
                {(['overview', 'residents', 'collections', 'announcements', 'activity'] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 border-b-2 pt-2 pb-3 text-center text-xs font-bold tracking-wider uppercase transition-all ${
                            activeTab === tab
                                ? 'border-indigo-650 font-black text-indigo-600'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Contents */}
            <div className="min-h-96">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-[32px] bg-white p-6 shadow-xs ring-1 ring-slate-100">
                                <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Total Residents</h3>
                                <p className="mt-2 text-3xl font-black text-slate-950">{residents.length}</p>
                                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4 text-xs font-semibold text-slate-500">
                                    <span>Active: {residents.filter((r) => r.status === 'active').length}</span>
                                    <span>Suspended: {residents.filter((r) => r.status === 'suspended').length}</span>
                                </div>
                            </div>

                            <div className="rounded-[32px] bg-white p-6 shadow-xs ring-1 ring-slate-100">
                                <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Outstanding Balance</h3>
                                <p className="mt-2 text-3xl font-black text-slate-950">₦{outstandingBalance.toLocaleString()}</p>
                                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4 text-xs font-semibold text-slate-500">
                                    <span>Pending: {outstandingCollections.length} bills</span>
                                </div>
                            </div>

                            <div className="rounded-[32px] bg-white p-6 shadow-xs ring-1 ring-slate-100">
                                <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Recent Payments</h3>
                                <p className="mt-2 text-3xl font-black text-slate-950">
                                    ₦{payments.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                                </p>
                                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4 text-xs font-semibold text-slate-500">
                                    <span>Collected payments logs</span>
                                </div>
                            </div>

                            <div className="col-span-full rounded-[32px] bg-white p-6 shadow-xs ring-1 ring-slate-100">
                                <h3 className="text-sm font-black text-slate-950">Overview Details</h3>
                                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">ULID</p>
                                        <p className="mt-1 font-mono font-semibold text-slate-900">{property.ulid}</p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned Residents</p>
                                        <p className="mt-1 font-semibold text-slate-900">
                                            {residents.map((r) => r.name).join(', ') || 'No resident assigned'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* RESIDENTS TAB */}
                    {activeTab === 'residents' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-black text-slate-900">Assigned Residents</h2>
                                {!showAssignForm && (
                                    <button
                                        onClick={() => setShowAssignForm(true)}
                                        className="text-indigo-650 inline-flex items-center gap-1.5 rounded-2xl bg-indigo-50 px-4 py-2 text-xs font-black transition-colors hover:bg-indigo-100"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        Assign Resident
                                    </button>
                                )}
                            </div>

                            {showAssignForm && (
                                <form onSubmit={handleAssign} className="rounded-[32px] bg-indigo-50/50 p-6 ring-1 ring-indigo-50">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                                        <div className="flex-1">
                                            <label htmlFor="resident_id" className="block text-xs font-bold tracking-wider text-indigo-900 uppercase">
                                                Select Resident
                                            </label>
                                            <select
                                                id="resident_id"
                                                value={assignForm.data.resident_id}
                                                onChange={(e) => assignForm.setData('resident_id', e.target.value)}
                                                className="focus:ring-indigo-555 mt-2 block w-full rounded-2xl border-indigo-200 bg-white px-4 py-3 text-sm focus:border-indigo-500"
                                            >
                                                <option value="">Choose a resident...</option>
                                                {eligibleResidents.map((r) => (
                                                    <option key={r.id} value={r.id}>
                                                        {r.name} (Current Property: {r.property})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="submit"
                                                disabled={assignForm.processing}
                                                className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                Assign
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowAssignForm(false)}
                                                className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                    {assignForm.errors.resident_id && (
                                        <p className="mt-2 text-xs font-bold text-rose-600">{assignForm.errors.resident_id}</p>
                                    )}
                                </form>
                            )}

                            <div className="overflow-hidden rounded-[32px] bg-white shadow-xs ring-1 ring-slate-100">
                                {residents.length > 0 ? (
                                    <table className="min-w-full divide-y divide-slate-100">
                                        <thead className="bg-slate-50/50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                    Resident
                                                </th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                    Unit
                                                </th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                    Status
                                                </th>
                                                <th className="relative px-6 py-4"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {residents.map((resident) => (
                                                <tr key={resident.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 font-black text-slate-500">
                                                                {resident.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900">{resident.name}</p>
                                                                {resident.phone && (
                                                                    <p className="text-xs font-semibold text-slate-400">{resident.phone}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-bold text-slate-600">{resident.unit_number || '—'}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                                                                resident.status === 'active'
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : 'bg-rose-100 text-rose-700'
                                                            }`}
                                                        >
                                                            {resident.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                                        <button
                                                            onClick={() => handleRemoveResident(resident.id)}
                                                            className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                                            title="Deassociate occupant"
                                                        >
                                                            <TrashIcon className="h-4.5 w-4.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="py-16 text-center">
                                        <UsersIcon className="mx-auto h-12 w-12 text-slate-300" />
                                        <h3 className="mt-4 text-lg font-black text-slate-900">No occupants</h3>
                                        <p className="mt-1 text-sm text-slate-500">Assign residents to this property to begin tracking them.</p>
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
                                <div className="rounded-[32px] bg-white p-6 shadow-xs ring-1 ring-slate-100">
                                    <h3 className="font-black text-slate-950">Outstanding Bills</h3>
                                    <div className="mt-4 divide-y divide-slate-100">
                                        {outstandingCollections.length > 0 ? (
                                            outstandingCollections.map((bill) => (
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
                                            ))
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
                                        <MegaphoneIcon className="text-slate-350 mx-auto h-12 w-12" />
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
                                <p className="text-slate-550 text-xs">Property transaction timelines.</p>
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
                                                                <p className="text-slate-450 mt-1 text-xs font-bold uppercase">{act.date}</p>
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
