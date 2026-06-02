import { Head, Link } from '@inertiajs/react';
import { index as propertiesIndex } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/PropertyController';
import { index as residentsIndex } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/ResidentController';
import { index as collectionsIndex } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/CollectionController';
import { index as announcementsIndex } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/AnnouncementController';
import { 
    UsersIcon, 
    BuildingOffice2Icon, 
    WalletIcon, 
    MegaphoneIcon, 
    ChevronRightIcon, 
    ArrowUpRightIcon,
    ArrowDownLeftIcon
} from '@heroicons/react/24/outline';

interface Props {
    residentsCount: number;
    outstandingCollectionsCount: number;
    propertiesCount: number;
    announcementsCount: number;
    recentPayments: Array<{
        id: number;
        resident_name: string;
        collection_name: string;
        amount: number;
        status: string;
        date: string;
    }>;
    recentAnnouncements: Array<{
        id: number;
        title: string;
        status: string;
        published_at: string | null;
        created_at: string;
    }>;
    recentActivity: Array<{
        id: number;
        resident_name: string;
        visitor_name: string;
        purpose: string | null;
        action: string;
        date: string;
    }>;
}

export default function Dashboard({
    residentsCount,
    outstandingCollectionsCount,
    propertiesCount,
    announcementsCount,
    recentPayments,
    recentAnnouncements,
    recentActivity
}: Props) {
    return (
        <div className="space-y-6 pb-24">
            <Head title="Property Owner Dashboard" />

            {/* Header section with gradient glow */}
            <div className="relative overflow-hidden rounded-[32px] bg-linear-to-br from-indigo-900 to-indigo-950 p-6 text-white shadow-xl shadow-indigo-950/20 sm:p-8">
                <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-300">
                            Property Owner
                        </span>
                        <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Estate Hub</h1>
                        <p className="mt-1 text-sm text-indigo-200/80">
                            Monitor and manage your property holdings and occupants.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={propertiesIndex.url()}
                            className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-950 transition-all hover:bg-slate-100 active:scale-95"
                        >
                            Properties
                        </Link>
                        <Link
                            href={residentsIndex.url()}
                            className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-700 active:scale-95"
                        >
                            Residents
                        </Link>
                    </div>
                </div>
                {/* Visual decorative circles */}
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {/* Properties */}
                <Link
                    href={propertiesIndex.url()}
                    className="group flex flex-col justify-between rounded-[32px] bg-white p-5 shadow-xs ring-1 ring-slate-100 transition-all hover:shadow-md hover:ring-indigo-100"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                            <BuildingOffice2Icon className="h-5 w-5" />
                        </div>
                        <ChevronRightIcon className="h-4 w-4 text-slate-400 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                    </div>
                    <div className="mt-4">
                        <p className="text-2xl font-black text-slate-900">{propertiesCount}</p>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Properties</p>
                    </div>
                </Link>
 
                {/* Residents */}
                <Link
                    href={residentsIndex.url()}
                    className="group flex flex-col justify-between rounded-[32px] bg-white p-5 shadow-xs ring-1 ring-slate-100 transition-all hover:shadow-md hover:ring-indigo-100"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                            <UsersIcon className="h-5 w-5" />
                        </div>
                        <ChevronRightIcon className="h-4 w-4 text-slate-400 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                    </div>
                    <div className="mt-4">
                        <p className="text-2xl font-black text-slate-900">{residentsCount}</p>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Residents</p>
                    </div>
                </Link>

                {/* Outstanding Bills */}
                <Link
                    href={collectionsIndex.url()}
                    className="group flex flex-col justify-between rounded-[32px] bg-white p-5 shadow-xs ring-1 ring-slate-100 transition-all hover:shadow-md hover:ring-indigo-100"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                            <WalletIcon className="h-5 w-5" />
                        </div>
                        <ChevronRightIcon className="h-4 w-4 text-slate-400 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                    </div>
                    <div className="mt-4">
                        <p className="text-2xl font-black text-slate-900">{outstandingCollectionsCount}</p>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Bills</p>
                    </div>
                </Link>
 
                {/* Announcements */}
                <Link
                    href={announcementsIndex.url()}
                    className="group flex flex-col justify-between rounded-[32px] bg-white p-5 shadow-xs ring-1 ring-slate-100 transition-all hover:shadow-md hover:ring-indigo-100"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                            <MegaphoneIcon className="h-5 w-5" />
                        </div>
                        <ChevronRightIcon className="h-4 w-4 text-slate-400 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                    </div>
                    <div className="mt-4">
                        <p className="text-2xl font-black text-slate-900">{announcementsCount}</p>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Announcements</p>
                    </div>
                </Link>
            </div>

            {/* Details Split Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Recent Payments */}
                <div className="flex flex-col rounded-[32px] bg-white p-6 shadow-xs ring-1 ring-slate-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-slate-900">Recent Rent & Fee Payments</h2>
                        <Link href={collectionsIndex.url()} className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700">
                            View All
                        </Link>
                    </div>
                    <div className="mt-4 flex-1 divide-y divide-slate-100">
                        {recentPayments.length > 0 ? (
                            recentPayments.map((p) => (
                                <div key={p.id} className="flex items-center justify-between py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                            <ArrowDownLeftIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-950 text-sm">{p.resident_name}</p>
                                            <p className="text-xs text-slate-400 font-bold">{p.collection_name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-900 text-sm">₦{Number(p.amount).toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{p.date}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                                <WalletIcon className="h-10 w-10 text-slate-350" />
                                <p className="mt-2 text-sm text-slate-500 font-semibold">No payments received yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scoped Activity Feed (Visitor entries for managed residents) */}
                <div className="flex flex-col rounded-[32px] bg-white p-6 shadow-xs ring-1 ring-slate-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-slate-900">Recent Occupant Activity</h2>
                    </div>
                    <div className="mt-4 flex-1 divide-y divide-slate-100">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((log) => (
                                <div key={log.id} className="flex items-start justify-between py-3.5">
                                    <div className="flex gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-black">
                                            {log.visitor_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">
                                                <span className="font-black text-slate-950">{log.visitor_name}</span> entered/exited
                                            </p>
                                            <p className="text-xs text-slate-500 font-semibold">
                                                Hosted by: <span className="font-bold">{log.resident_name}</span> {log.purpose && `(${log.purpose})`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                            log.action === 'check_in' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-150 text-slate-700'
                                        }`}>
                                            {log.action === 'check_in' ? 'Check In' : 'Check Out'}
                                        </span>
                                        <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase">{log.date}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                                <UsersIcon className="h-10 w-10 text-slate-355" />
                                <p className="mt-2 text-sm text-slate-500 font-semibold">No occupant guest logs recorded</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
