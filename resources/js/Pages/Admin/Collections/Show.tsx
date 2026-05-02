import { Head, Link, useForm, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    Users,
    CheckCircle,
    AlertCircle,
    DollarSign,
    Search,
    MoreHorizontal,
    Bell,
    ChevronRight,
    Download,
    Info,
    User,
    CreditCard,
    ShieldCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { index, publish, edit, remind, exportMethod } from '@/actions/App/Http/Controllers/Admin/CollectionController';
import ConfirmationModal from '@/Components/ConfirmationModal';
import SearchInput from '@/Components/SearchInput';
import AdminLayout from '@/Layouts/AdminLayout';

type Collection = {
    id: number;
    name: string;
    description: string | null;
    amount: number;
    billing_type: 'one_time' | 'recurring';
    recurring_interval: string | null;
    status: 'draft' | 'active' | 'archived';
    start_date: string;
    due_at: string | null;
    due_day: number;
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

type Assignment = {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    };
    amount_due: number;
    amount_paid: number;
    status: 'pending' | 'paid' | 'overdue' | 'partial';
    due_date: string;
    paid_at: string | null;
    created_at: string;
};

type Props = {
    collection: Collection;
    stats: Stats;
    assignments: Assignment[];
    totalResidents: number;
    settlement: {
        bank_name: string | null;
        paystack_subaccount_code: string | null;
    };
};

export default function ShowCollection({ collection, stats, assignments = [], totalResidents, settlement }: Props) {
    const { post, processing } = useForm();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue' | 'partial'>('all');
    const [showConfig, setShowConfig] = useState(false);
    const [isRemindModalOpen, setIsRemindModalOpen] = useState(false);
    const [isReminding, setIsReminding] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [recordData, setRecordData] = useState({ amount: '', method: 'bank_transfer' });
    const [isRecording, setIsRecording] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const collectionRate = useMemo(() => {
        if (stats.total_expected === 0) return 0;
        const rate = (stats.total_collected / stats.total_expected) * 100;
        return rate > 0 && rate < 1 ? rate.toFixed(1) : Math.round(rate);
    }, [stats.total_collected, stats.total_expected]);

    const handleRemind = () => {
        setIsReminding(true);
        router.post(
            remind.url(collection.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsReminding(false);
                    setIsRemindModalOpen(false);
                },
            },
        );
    };

    const handleExport = () => {
        window.location.href = exportMethod.url(collection.id);
    };

    const handleRecordPayment = () => {
        if (!selectedAssignment || !recordData.amount) return;

        setIsRecording(true);
        router.post(
            route('admin.collections.assignments.record-payment', selectedAssignment.id),
            {
                amount: recordData.amount,
                method: recordData.method,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsRecording(false);
                    setIsRecordModalOpen(false);
                    setSelectedAssignment(null);
                    setRecordData({ amount: '', method: 'bank_transfer' });
                },
            },
        );
    };

    const filteredAssignments = useMemo(() => {
        return assignments.filter((a) => {
            const matchesSearch =
                a.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.user.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [assignments, searchQuery, statusFilter]);

    const handlePublish = () => {
        if (confirm('Are you sure you want to publish this collection? This will generate assignments for residents.')) {
            post(publish.url(collection.id));
        }
    };

    return (
        <>
            <Head title={`${collection.name} - Collections`} />

            <div className="space-y-8">
                {/* Settlement Alert */}
                {!settlement.paystack_subaccount_code && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                        <div className="flex items-center justify-between rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">Settlement not configured</h4>
                                    <p className="text-xs font-medium text-slate-500">
                                        Setup your estate's bank account to receive payments directly.
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={route('admin.settings')}
                                className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
                            >
                                Configure Banking
                            </Link>
                        </div>
                    </motion.div>
                )}

                {/* 🥇 1. HEADER (SMART SUMMARY) */}
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-2">
                        <nav className="flex items-center gap-2">
                            <Link
                                href={index.url()}
                                className="text-xs font-bold tracking-widest text-slate-400 uppercase transition-colors hover:text-[#0A3D91]"
                            >
                                Collections
                            </Link>
                            <ChevronRight className="h-3 w-3 text-slate-300" />
                            <span className="text-xs font-bold tracking-widest text-slate-900 uppercase">Details</span>
                        </nav>

                        <div className="mt-2 flex flex-wrap items-center gap-4">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{collection.name}</h1>
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase shadow-sm ring-1 ${
                                    collection.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                                        : 'bg-amber-50 text-amber-700 ring-amber-100'
                                }`}
                            >
                                <span
                                    className={`h-2 w-2 rounded-full ${collection.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]`}
                                />
                                {collection.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                            <Calendar className="h-4 w-4 text-slate-300" />
                            Established on{' '}
                            {new Date(collection.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>

                    <div className="flex w-full items-center gap-2 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200 lg:w-auto">
                        <div className="flex min-w-max flex-col items-center border-r border-slate-100 px-4 py-1 sm:px-6">
                            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Rate</span>
                            <span className="text-lg font-bold tracking-tight text-emerald-600 sm:text-xl">{collectionRate}%</span>
                        </div>
                        <div className="flex min-w-max flex-col items-center px-4 py-1 sm:px-6">
                            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Collected</span>
                            <span className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                                {formatCurrency(stats.total_collected)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions Bar (Draft State) */}
                {collection.status === 'draft' && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 flex flex-col items-start justify-between gap-6 rounded-3xl bg-indigo-600 p-6 text-white shadow-lg shadow-indigo-500/10 sm:flex-row sm:items-center sm:p-8"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                                <Info className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold tracking-tight">Ready to launch?</h3>
                                <p className="text-sm font-medium text-blue-100">
                                    Publish this collection to start receiving payments from residents.
                                </p>
                            </div>
                        </div>
                        <div className="flex w-full gap-3 sm:w-auto">
                            <button
                                onClick={handlePublish}
                                disabled={processing}
                                className="flex-1 rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-600 transition-all hover:bg-indigo-50 active:scale-95 disabled:opacity-50 sm:flex-none"
                            >
                                Publish Now
                            </button>
                            <Link
                                href={edit.url(collection.id)}
                                className="flex flex-1 items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-700 active:scale-95 sm:flex-none"
                            >
                                Edit
                            </Link>
                        </div>
                    </motion.div>
                )}

                <div className="grid gap-8 lg:grid-cols-4">
                    {/* 🥇 2. PRIMARY METRICS (UPGRADED) */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:col-span-4 lg:grid-cols-4">
                        <MetricCard
                            title="Assignments"
                            value={stats.total_assignments}
                            icon={<Users className="h-4 w-4" />}
                            color="indigo"
                            context={`${totalResidents} Residents`}
                        />
                        <MetricCard
                            title="Paid"
                            value={stats.paid_count}
                            icon={<CheckCircle className="h-4 w-4" />}
                            color="emerald"
                            percentage={stats.total_assignments > 0 ? (stats.paid_count / stats.total_assignments) * 100 : 0}
                        />
                        <MetricCard
                            title="Pending"
                            value={stats.pending_count}
                            icon={<Clock className="h-4 w-4" />}
                            color="amber"
                            percentage={stats.total_assignments > 0 ? (stats.pending_count / stats.total_assignments) * 100 : 0}
                        />
                        <MetricCard
                            title="Overdue"
                            value={stats.overdue_count}
                            icon={<AlertCircle className="h-4 w-4" />}
                            color="rose"
                            percentage={stats.total_assignments > 0 ? (stats.overdue_count / stats.total_assignments) * 100 : 0}
                        />
                    </div>

                    {/* 🥇 3. FINANCIAL PERFORMANCE PANEL */}
                    <div className="order-1 space-y-8 lg:col-span-3">
                        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-10">
                            <div className="mb-8 flex items-center justify-between sm:mb-10">
                                <div>
                                    <h3 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Revenue Performance</h3>
                                    <p className="text-sm font-medium text-slate-400">Total volume and collection progress</p>
                                </div>
                                <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors hover:bg-slate-100">
                                    <Download className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-12">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Target Revenue</span>
                                    <div className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                        {formatCurrency(stats.total_expected)}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold tracking-widest text-emerald-500/60 uppercase">Collected</span>
                                    <div className="text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">
                                        {formatCurrency(stats.total_collected)}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold tracking-widest text-rose-500/60 uppercase">Outstanding</span>
                                    <div className="text-2xl font-bold tracking-tight text-rose-600 sm:text-3xl">
                                        {formatCurrency(stats.total_expected - stats.total_collected)}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12">
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-900 sm:text-sm">Overall Progress</span>
                                    <span className="text-xs font-bold text-emerald-600 sm:text-sm">{collectionRate}% Complete</span>
                                </div>
                                <div className="relative h-4 w-full overflow-hidden rounded-2xl bg-slate-100 ring-4 ring-slate-50 sm:h-6">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${collectionRate}%` }}
                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                        className="absolute inset-y-0 left-0 bg-emerald-500"
                                    />
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                                </div>
                            </div>

                            {/* 🥇 4. PAYMENT DISTRIBUTION */}
                            <div className="mt-12 flex flex-col gap-4">
                                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Distribution Breakdown</span>
                                <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div style={{ width: `${(stats.paid_count / stats.total_assignments) * 100}%` }} className="bg-emerald-500" />
                                    <div style={{ width: `${(stats.pending_count / stats.total_assignments) * 100}%` }} className="bg-amber-400" />
                                    <div style={{ width: `${(stats.overdue_count / stats.total_assignments) * 100}%` }} className="bg-rose-500" />
                                </div>
                                <div className="flex flex-wrap gap-4 text-[10px] font-bold tracking-widest uppercase sm:gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" /> Paid
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-amber-400" /> Pending
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-rose-500" /> Overdue
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 🥇 6. COLLECTION DETAILS */}
                    <div className="order-2 space-y-8 lg:col-span-1">
                        <div className="rounded-[2.5rem] bg-white p-6 shadow-2xl ring-1 shadow-slate-200/50 ring-slate-100 sm:p-8">
                            <div className="mb-8 flex items-center justify-between">
                                <h3 className="text-lg font-bold tracking-tight text-slate-900 uppercase">Configuration</h3>
                                <button onClick={() => setShowConfig(!showConfig)} className="text-slate-400 transition-colors hover:text-slate-900">
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-6 sm:space-y-8">
                                <DetailItem label="Amount" value={formatCurrency(collection.amount)} icon={<DollarSign className="h-4 w-4" />} />
                                <DetailItem
                                    label="Schedule"
                                    value={collection.billing_type.replace('_', ' ')}
                                    icon={<Calendar className="h-4 w-4" />}
                                />
                                {collection.billing_type === 'recurring' && (
                                    <DetailItem
                                        label="Interval"
                                        value={collection.recurring_interval || 'N/A'}
                                        icon={<Clock className="h-4 w-4" />}
                                    />
                                )}
                                <DetailItem
                                    label={collection.billing_type === 'recurring' ? 'Due Day' : 'Due Date'}
                                    value={
                                        collection.billing_type === 'recurring'
                                            ? `Day ${collection.due_day}`
                                            : collection.due_at
                                              ? new Date(collection.due_at).toLocaleDateString()
                                              : 'N/A'
                                    }
                                    icon={<Clock className="h-4 w-4" />}
                                />
                                <DetailItem label="Grace" value={`${collection.grace_days} Days`} icon={<AlertCircle className="h-4 w-4" />} />
                                <DetailItem
                                    label="Visibility"
                                    value={collection.applies_to === 'all' ? 'All' : `${collection.targets_count} Specific`}
                                    icon={<Users className="h-4 w-4" />}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🥇 5. INTELLIGENT RESIDENT LIST (FULL WIDTH) */}
                <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                    <div className="border-b border-slate-50 bg-slate-50/30 p-6 sm:p-8">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Resident Activity</h3>
                            <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200 sm:gap-2">
                                {(['all', 'paid', 'pending', 'overdue'] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setStatusFilter(f)}
                                        className={`rounded-xl px-3 py-2 text-[9px] font-bold tracking-widest whitespace-nowrap uppercase transition-all sm:px-4 sm:text-[10px] ${
                                            statusFilter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'
                                        }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                            <div className="flex-1">
                                <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search residents..." />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsRemindModalOpen(true)}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
                                >
                                    <Bell className="h-4 w-4" />
                                    Send Reminders
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
                                >
                                    <Download className="h-4 w-4" />
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] text-left lg:min-w-0">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/20 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                    <th className="px-6 py-5 sm:px-8">Resident</th>
                                    <th className="px-6 py-5 text-right sm:px-8">Amount</th>
                                    <th className="px-6 py-5 sm:px-8">Status</th>
                                    <th className="hidden px-6 py-5 sm:table-cell sm:px-8">Due Date</th>
                                    <th className="px-6 py-5 text-right sm:px-8">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <AnimatePresence mode="popLayout">
                                    {filteredAssignments.map((a) => (
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            key={a.id}
                                            className="group transition-colors hover:bg-slate-50/50"
                                        >
                                            <td className="px-6 py-5 sm:px-8 sm:py-6">
                                                <div className="flex items-center gap-3 sm:gap-4">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                                        <User className="h-5 w-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-bold text-slate-900">{a.user.name}</p>
                                                        <p className="truncate text-xs font-medium text-slate-400 sm:hidden">
                                                            {a.status} • {new Date(a.due_date).toLocaleDateString()}
                                                        </p>
                                                        <p className="hidden truncate text-xs font-medium text-slate-400 sm:block">{a.user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right sm:px-8 sm:py-6">
                                                <div className="text-sm font-bold text-slate-900">{formatCurrency(a.amount_due)}</div>
                                                {a.amount_paid > 0 && (
                                                    <div className="flex flex-col items-end">
                                                        <div className="text-[9px] font-bold text-emerald-500 sm:text-[10px]">
                                                            Paid: {formatCurrency(a.amount_paid)}
                                                        </div>
                                                        {a.paid_at && (
                                                            <div className="text-[8px] font-medium tracking-tight text-slate-400 uppercase">
                                                                {new Date(a.paid_at).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric',
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 sm:px-8 sm:py-6">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[9px] font-bold tracking-widest uppercase sm:text-[10px] ${
                                                        a.status === 'paid'
                                                            ? 'bg-emerald-50 text-emerald-600'
                                                            : a.status === 'overdue'
                                                              ? 'bg-rose-50 text-rose-600'
                                                              : 'bg-amber-50 text-amber-600'
                                                    }`}
                                                >
                                                    {a.status}
                                                </span>
                                            </td>
                                            <td className="hidden px-6 py-5 sm:table-cell sm:px-8 sm:py-6">
                                                <p className="text-sm font-bold text-slate-600">{new Date(a.due_date).toLocaleDateString()}</p>
                                                {a.status === 'overdue' && <p className="text-[10px] font-bold text-rose-500 uppercase">Overdue</p>}
                                            </td>
                                            <td className="px-6 py-5 text-right sm:px-8 sm:py-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    {a.status !== 'paid' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedAssignment(a);
                                                                setRecordData({
                                                                    ...recordData,
                                                                    amount: ((a.amount_due - a.amount_paid) / 100).toString(),
                                                                });
                                                                setIsRecordModalOpen(true);
                                                            }}
                                                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-500 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                                                            title="Record Payment"
                                                        >
                                                            <CreditCard className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition-colors hover:text-slate-900">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {filteredAssignments.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-slate-50 text-slate-400">
                                                <Search className="h-8 w-8" />
                                            </div>
                                            <p className="mt-4 font-bold text-slate-900">No results found</p>
                                            <p className="text-sm font-medium text-slate-400">Try adjusting your filters.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isRemindModalOpen}
                onClose={() => setIsRemindModalOpen(false)}
                onConfirm={handleRemind}
                title="Send Reminders"
                message={`You are about to send payment reminders to ${Number(stats.pending_count) + Number(stats.overdue_count)} residents who have outstanding payments. Do you want to proceed?`}
                confirmLabel="Yes, Send Reminders"
                cancelLabel="Cancel"
                type="info"
                isLoading={isReminding}
            />
            <ConfirmationModal
                isOpen={isRecordModalOpen}
                onClose={() => setIsRecordModalOpen(false)}
                onConfirm={handleRecordPayment}
                title="Record Manual Payment"
                message={`Record a manual payment for ${selectedAssignment?.user.name}. This will update their status and contribution.`}
                confirmLabel="Record Payment"
                cancelLabel="Cancel"
                type="info"
                isLoading={isRecording}
            >
                <div className="mt-4 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Amount (NGN)</label>
                        <input
                            type="number"
                            value={recordData.amount}
                            onChange={(e) => setRecordData({ ...recordData, amount: e.target.value })}
                            className="mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 text-sm font-bold focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Payment Method</label>
                        <select
                            value={recordData.method}
                            onChange={(e) => setRecordData({ ...recordData, method: e.target.value })}
                            className="mt-1 block w-full rounded-xl border-slate-200 bg-slate-50 text-sm font-bold focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cash">Cash</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
            </ConfirmationModal>
        </>
    );
}

function MetricCard({
    title,
    value,
    icon,
    color,
    percentage,
    context,
}: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    percentage?: number;
    context?: string;
}) {
    const colors: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
        amber: 'bg-amber-50 text-amber-600 ring-amber-100',
        rose: 'bg-rose-50 text-rose-600 ring-rose-100',
    };

    return (
        <div
            className={`group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:shadow-md hover:ring-slate-200`}
        >
            <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                    <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>{icon}</div>
                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{title}</span>
                </div>
                <div className="mt-4 flex items-end justify-between">
                    <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
                    {percentage !== undefined && (
                        <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${colors[color]}`}>{Math.round(percentage)}%</span>
                    )}
                    {context && <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{context}</span>}
                </div>
            </div>
        </div>
    );
}

function DetailItem({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
    return (
        <div className="group flex items-center gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white">
                {icon}
            </div>
            <div>
                <p className="mb-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">{label}</p>
                <p className="text-sm font-bold text-slate-900 capitalize">{value}</p>
            </div>
        </div>
    );
}

ShowCollection.layout = (page: React.ReactNode) => <AdminLayout children={page} title="Collections" />;
