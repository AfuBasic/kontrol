import { Head, Link } from '@inertiajs/react';
import { create, show } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/CollectionController';
import { WalletIcon, PlusIcon, CalendarIcon, CheckCircleIcon, ArrowUpRightIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Collection {
    id: number;
    ulid: string;
    name: string;
    amount: number;
    status: string;
    due_at: string;
    assignments_count: number;
    paid_count: number;
    total_amount: number;
    collected_amount: number;
    created_at: string;
}

interface Props {
    collections: Collection[];
}

export default function Index({ collections }: Props) {
    return (
        <div className="space-y-6 pb-24">
            <Head title="Rent & Fees Collections" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Rent & Fees</h1>
                    <p className="mt-1 text-sm text-slate-500">Create and track rent, utility, and generator fee collections.</p>
                </div>
                <Link
                    href={create.url()}
                    className="shadow-indigo-650/15 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-700 active:scale-98"
                >
                    <PlusIcon className="h-5 w-5" />
                    New Collection
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {collections.length > 0 ? (
                    collections.map((col) => {
                        const collectedPct = col.assignments_count > 0 ? Math.round((col.paid_count / col.assignments_count) * 100) : 0;

                        return (
                            <Link
                                key={col.id}
                                href={show.url(col.ulid)}
                                className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] bg-white p-6 shadow-xs ring-1 ring-slate-100 transition-all hover:shadow-lg hover:ring-indigo-100"
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                            <WalletIcon className="h-5 w-5" />
                                        </div>
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                                                col.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                                            }`}
                                        >
                                            {col.status}
                                        </span>
                                    </div>

                                    <div className="mt-4">
                                        <h3 className="text-base font-black text-slate-900 transition-colors group-hover:text-indigo-600">
                                            {col.name}
                                        </h3>
                                        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                            <CalendarIcon className="h-4 w-4" />
                                            <span>Due by {col.due_at}</span>
                                        </div>
                                    </div>

                                    {/* Progression Bar */}
                                    <div className="mt-5 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-400 uppercase">Payment Progress</span>
                                            <span className="font-bold text-slate-900">
                                                {collectedPct}% ({col.paid_count}/{col.assignments_count})
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                            <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${collectedPct}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Amount per head</p>
                                        <p className="text-sm font-black text-slate-900">₦{Number(col.amount).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Collected Total</p>
                                        <p className="text-sm font-black text-slate-900">₦{Number(col.collected_amount).toLocaleString()}</p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                ) : (
                    <div className="col-span-full rounded-[32px] bg-white py-16 text-center shadow-xs ring-1 ring-slate-100">
                        <WalletIcon className="text-slate-350 mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-black text-slate-900">No Bills Created</h3>
                        <p className="mt-1 text-sm text-slate-500">You haven't setup any payment collection sheets yet.</p>
                        <Link
                            href={create.url()}
                            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700"
                        >
                            Create First Collection
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
