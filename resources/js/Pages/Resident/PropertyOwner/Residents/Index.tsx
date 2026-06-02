import { Head, Link, router } from '@inertiajs/react';
import { suspend, destroy, edit } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/ResidentController';
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
    TrashIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

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
    residents: Resident[];
}

export default function Index({ residents }: Props) {
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

    const toggleSuspend = (resident: Resident) => {
        if (confirm('Are you sure you want to change this resident\'s activation status?')) {
            router.patch(suspend.url(resident.ulid));
        }
    };

    const removeDelegation = (resident: Resident) => {
        if (confirm('Are you sure you want to stop managing this resident? They will remain in the estate system but won\'t be delegated to you.')) {
            router.delete(destroy.url(resident.ulid));
        }
    };

    return (
        <div className="space-y-6 pb-24">
            <Head title="Managed Residents" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Managed Residents</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        View and manage details of residents/occupants delegated to you.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {residents.length > 0 ? (
                    residents.map((resident) => (
                        <div
                            key={resident.id}
                            className={`group relative overflow-hidden rounded-[32px] bg-white p-6 shadow-xs ring-1 ring-slate-100 transition-all hover:shadow-lg ${
                                resident.suspended_at ? 'opacity-70 bg-slate-50/50' : ''
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-black ${
                                        resident.suspended_at ? 'bg-rose-105 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                                    }`}>
                                        {resident.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="truncate font-black text-slate-950 text-base">{resident.name}</h3>
                                        <p className="truncate text-xs text-slate-400 font-bold">{resident.email}</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setActiveMenuId(activeMenuId === resident.id ? null : resident.id)}
                                        className="rounded-xl p-1.5 hover:bg-slate-50 text-slate-500"
                                    >
                                        <EllipsisVerticalIcon className="h-5 w-5" />
                                    </button>
                                    
                                    {activeMenuId === resident.id && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                                            <div className="absolute right-0 mt-1 z-20 w-48 origin-top-right rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-slate-100 focus:outline-none">
                                                <Link
                                                    href={edit.url(resident.ulid)}
                                                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                                                >
                                                    <PencilSquareIcon className="h-4.5 w-4.5 text-slate-400" />
                                                    Edit Details
                                                </Link>
                                                <button
                                                    onClick={() => { toggleSuspend(resident); setActiveMenuId(null); }}
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
                                                    onClick={() => { removeDelegation(resident); setActiveMenuId(null); }}
                                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600"
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
                                <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-650">
                                    <MapPinIcon className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                                    <span>
                                        {resident.property ? (
                                            <span className="font-bold text-slate-800">{resident.property}</span>
                                        ) : (
                                            <span className="italic text-slate-400">No Property Assigned</span>
                                        )}
                                        {resident.unit_number && ` (Unit ${resident.unit_number})`}
                                    </span>
                                </div>
                                {resident.phone && (
                                    <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-650">
                                        <PhoneIcon className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                                        <span>{resident.phone}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-5 rounded-2xl bg-slate-50/80 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                                    <WalletIcon className="h-4.5 w-4.5 text-slate-400" />
                                    <span>Outstanding Balance</span>
                                </div>
                                <span className={`text-sm font-black ${
                                    resident.outstanding_balance > 0 ? 'text-amber-600' : 'text-slate-900'
                                }`}>
                                    ₦{Number(resident.outstanding_balance).toLocaleString()}
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
        </div>
    );
}
