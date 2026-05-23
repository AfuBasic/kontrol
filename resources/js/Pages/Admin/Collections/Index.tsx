import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { clsx, type ClassValue } from 'clsx';
import { Wallet, Users, Calendar, ArrowRight, MoreVertical, AlertTriangle, Building2, Settings2 } from 'lucide-react';
import { Edit2 } from 'lucide-react';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { index, create, show, edit } from '@/actions/App/Http/Controllers/Admin/CollectionController';
import BankingSetupModal from '@/Components/BankingSetupModal';
import AdminLayout from '@/Layouts/AdminLayout';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type Collection = {
    ulid: string;
    id: number;
    name: string;
    description: string | null;
    amount: number;
    billing_type: 'one_time' | 'recurring';
    recurring_interval: string | null;
    status: 'draft' | 'active' | 'archived';
    assignments_count: number;
    targets_count: number;
    applies_to: 'all' | 'target';
    created_at: string;
};

type Props = {
    collections: {
        data: Collection[];
        links: any[];
    };
    totalResidents: number;
    hasBanking: boolean;
    banks: { name: string; code: string }[];
    settlement: {
        bank_name: string | null;
        bank_code: string | null;
        account_number: string | null;
        account_name: string | null;
    };
};

export default function CollectionsIndex({ collections, totalResidents, hasBanking, banks, settlement }: Props) {
    const [isBankingModalOpen, setIsBankingModalOpen] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    return (
        <>
            <Head title="Collections" />

            {!hasBanking && (
                <div className="mb-8 overflow-hidden rounded-3xl border border-amber-200 bg-amber-50 shadow-sm">
                    <div className="flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center">
                        <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tight text-amber-900">Settlement Account Required</h2>
                                <p className="max-w-xl text-sm text-amber-700">
                                    To create collections and receive payments from residents, you must first set up your estate's settlement bank
                                    account.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsBankingModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-700 active:scale-95"
                        >
                            <Building2 className="h-5 w-5" />
                            Setup Bank Account
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Collections</h1>
                    <p className="mt-1 text-slate-500">Manage estate dues, levies, and recurring bills.</p>
                </div>

                <div className="flex flex-row items-center gap-3">
                    <button
                        onClick={() => setIsBankingModalOpen(true)}
                        className={cn(
                            'inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-bold transition-all active:scale-95 sm:text-sm',
                            hasBanking
                                ? 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50'
                                : 'bg-amber-600 text-white shadow-lg shadow-amber-500/20 hover:bg-amber-700',
                        )}
                    >
                        <Settings2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="truncate">{hasBanking ? 'Settlement' : 'Setup Bank'}</span>
                    </button>

                    {hasBanking ? (
                        <Link
                            href={create.url()}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1F6FDB] px-4 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95 sm:text-sm"
                        >
                            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="truncate">New Collection</span>
                        </Link>
                    ) : (
                        <button
                            onClick={() => setIsBankingModalOpen(true)}
                            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-200 px-4 py-3.5 text-xs font-bold text-slate-400 transition-colors hover:bg-slate-300 sm:text-sm"
                        >
                            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="truncate">Setup Bank</span>
                        </button>
                    )}
                </div>
            </div>

            <BankingSetupModal isOpen={isBankingModalOpen} onClose={() => setIsBankingModalOpen(false)} banks={banks} currentSettings={settlement} />

            <div className="grid gap-6">
                {collections.data.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {collections.data.map((collection) => (
                            <div
                                key={collection.ulid}
                                onClick={() => router.visit(show.url(collection.ulid))}
                                className="group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 active:scale-[0.98]"
                            >
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-blue-50 group-hover:text-blue-500">
                                        <Wallet className="h-6 w-6" />
                                    </div>
                                    <span
                                        className={`rounded-full px-3 py-1 text-[10px] font-black tracking-widest uppercase ${
                                            collection.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}
                                    >
                                        {collection.status}
                                    </span>
                                </div>

                                <h3 className="mb-1 text-xl font-black tracking-tight text-slate-900">{collection.name}</h3>
                                <p className="mb-6 line-clamp-2 text-sm text-slate-500">{collection.description || 'No description provided.'}</p>

                                <div className="mb-6 flex items-center justify-between">
                                    <div className="text-2xl font-black tracking-tight text-slate-900">{formatCurrency(collection.amount)}</div>
                                    <div className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                                        {collection.billing_type.replace('_', ' ')}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 border-t border-slate-50 pt-4 text-sm font-bold text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="h-4 w-4" />
                                        {collection.status === 'active'
                                            ? collection.assignments_count
                                            : collection.applies_to === 'all'
                                              ? totalResidents
                                              : collection.targets_count}{' '}
                                        Residents
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4" />
                                        {collection.recurring_interval || 'Once'}
                                    </div>
                                </div>

                                <div className="absolute top-1/2 right-6 flex -translate-y-1/2 items-center gap-2 opacity-0 transition-all group-hover:translate-x-2 group-hover:opacity-100">
                                    {collection.status === 'draft' && hasBanking && (
                                        <Link
                                            href={edit.url(collection.ulid)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-blue-50 hover:text-blue-500 hover:ring-blue-100"
                                            title="Edit Collection"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Link>
                                    )}
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                                        <ArrowRight className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-24 text-center">
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-slate-300 shadow-sm">
                            <Wallet className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight text-slate-900">No collections found</h3>
                        <p className="mt-2 max-w-sm text-slate-500">Create your first collection to start managing estate dues and levies.</p>
                        {hasBanking ? (
                            <Link
                                href={create.url()}
                                className="mt-8 flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-sm font-black text-slate-900 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50"
                            >
                                <PlusIcon className="h-5 w-5" />
                                Create Collection
                            </Link>
                        ) : (
                            <button
                                onClick={() => setIsBankingModalOpen(true)}
                                className="mt-8 flex items-center gap-2 rounded-2xl bg-amber-600 px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-700 active:scale-95"
                            >
                                <Building2 className="h-5 w-5" />
                                Setup Bank Account First
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

CollectionsIndex.layout = (page: any) => <AdminLayout children={page} />;
