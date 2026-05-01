import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Wallet, Calendar, Clock, Users, ArrowLeft, Send, Trash2, CheckCircle, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { index, publish, destroy, edit } from '@/actions/App/Http/Controllers/Admin/CollectionController';

type Collection = {
    id: number;
    name: string;
    description: string | null;
    amount: number;
    billing_type: 'one_time' | 'recurring';
    recurring_interval: string | null;
    status: 'draft' | 'active' | 'archived';
    start_date: string;
    grace_days: number;
    applies_to: 'all' | 'target';
    targets_count?: number;
    created_at: string;
};

type Stats = {
    total_assignments: number;
    paid_count: number;
    pending_count: number;
    overdue_count: number;
    total_expected: number;
    total_collected: number;
};

type Props = {
    collection: Collection;
    stats: Stats;
    totalResidents: number;
};

export default function ShowCollection({ collection, stats, totalResidents }: Props) {
    const { post, delete: destroyCall, processing } = useForm();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount || 0);
    };

    const handlePublish = () => {
        if (confirm('Are you sure you want to publish this collection? This will generate assignments for residents.')) {
            post(publish.url(collection.id));
        }
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this collection? All associated assignments will be removed.')) {
            destroyCall(destroy.url(collection.id));
        }
    };

    return (
        <>
            <Head title={collection.name} />

            <div className="mx-auto max-w-5xl">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link
                            href={index.url()}
                            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Collections
                        </Link>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">{collection.name}</h1>
                        <div className="mt-2 flex items-center gap-3">
                            <span className={`rounded-full px-3 py-1 text-[10px] font-black tracking-widest uppercase ${
                                collection.status === 'active' 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : 'bg-amber-100 text-amber-700'
                            }`}>
                                {collection.status}
                            </span>
                            <span className="text-sm font-bold text-slate-400">Created {new Date(collection.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {collection.status === 'draft' && (
                            <button
                                onClick={handlePublish}
                                disabled={processing}
                                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                            >
                                <Send className="h-4 w-4" />
                                Publish & Generate
                            </button>
                        )}
                        {collection.status === 'draft' && (
                            <>
                                <Link
                                    href={edit.url(collection.id)}
                                    className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-slate-900 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 active:scale-95"
                                >
                                    Edit
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    disabled={processing}
                                    className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-rose-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-rose-50 active:scale-95 disabled:opacity-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                            <Users className="h-5 w-5" />
                        </div>
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Residents</div>
                        <div className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                            {collection.status === 'active' 
                                ? (stats.total_assignments ?? 0) 
                                : (collection.applies_to === 'all' ? (totalResidents ?? 0) : (collection.targets_count ?? 0))
                            }
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Paid</div>
                        <div className="mt-1 text-2xl font-black tracking-tight text-slate-900">{stats.paid_count ?? 0}</div>
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pending</div>
                        <div className="mt-1 text-2xl font-black tracking-tight text-slate-900">{stats.pending_count ?? 0}</div>
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Overdue</div>
                        <div className="mt-1 text-2xl font-black tracking-tight text-slate-900">{stats.overdue_count ?? 0}</div>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Collection Details */}
                    <div className="lg:col-span-1">
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                            <h3 className="mb-6 text-lg font-black tracking-tight text-slate-900">Collection Details</h3>
                            
                            <div className="space-y-6">
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Amount per Resident</div>
                                    <div className="mt-1 text-xl font-black text-slate-900">{formatCurrency(collection.amount)}</div>
                                </div>

                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Billing Type</div>
                                    <div className="mt-1 font-bold text-slate-900 capitalize">{collection.billing_type.replace('_', ' ')}</div>
                                </div>

                                {collection.billing_type === 'recurring' && (
                                    <div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interval</div>
                                        <div className="mt-1 font-bold text-slate-900 capitalize">{collection.recurring_interval}</div>
                                    </div>
                                )}

                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Next Due Date</div>
                                    <div className="mt-1 font-bold text-slate-900">{new Date(collection.start_date).toLocaleDateString()}</div>
                                </div>

                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Grace Period</div>
                                    <div className="mt-1 font-bold text-slate-900">{collection.grace_days} Days</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="lg:col-span-2">
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                            <h3 className="mb-6 text-lg font-black tracking-tight text-slate-900">Financial Summary</h3>
                            
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                                <div className="flex-1 rounded-2xl bg-slate-50 p-6">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Expected</div>
                                    <div className="mt-1 text-2xl font-black text-slate-900">{formatCurrency(stats.total_expected)}</div>
                                </div>
                                <div className="flex-1 rounded-2xl bg-emerald-50 p-6">
                                    <div className="text-xs font-bold text-emerald-600/60 uppercase tracking-widest">Total Collected</div>
                                    <div className="mt-1 text-2xl font-black text-emerald-600">{formatCurrency(stats.total_collected)}</div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-500">Collection Progress</span>
                                    <span className="text-sm font-black text-slate-900">
                                        {stats.total_expected > 0 
                                            ? Math.round((stats.total_collected / stats.total_expected) * 100) 
                                            : 0}%
                                    </span>
                                </div>
                                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div 
                                        className="h-full bg-emerald-500 transition-all duration-1000"
                                        style={{ width: `${stats.total_expected > 0 ? (stats.total_collected / stats.total_expected) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

ShowCollection.layout = (page: any) => <AdminLayout children={page} />;
