import {
    
    ArrowLeftIcon,
    TrashIcon,
    UserGroupIcon,
    CheckCircleIcon,
    ChartBarIcon,
    EllipsisHorizontalIcon,
    ClockIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { index, destroy } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/AnnouncementController';
import { useResidentConfirmation } from '@/Components/ConfirmationProvider';

interface Target {
    type: string;
    name: string;
}

interface Props {
    announcement: {
        id: number;
        hashid: string;
        title: string;
        body: string;
        applies_to: string;
        category?: string;
        priority?: string;
        created_at: string;
    };
    metrics: {
        targets_count: number;
        reads_count: number;
        read_rate: number;
    };
    targets: Target[];
}

const CATEGORY_COLORS: Record<string, string> = {
    general: 'bg-slate-100 text-slate-700 ring-slate-200',
    meeting: 'bg-blue-100 text-blue-700 ring-blue-200',
    maintenance: 'bg-orange-100 text-orange-700 ring-orange-200',
    security: 'bg-rose-100 text-rose-700 ring-rose-200',
    event: 'bg-purple-100 text-purple-700 ring-purple-200',
};

const PRIORITY_STYLES: Record<string, { badge: string; border: string; bg: string }> = {
    normal: { badge: 'bg-slate-100 text-slate-600', border: 'border-slate-100', bg: 'bg-slate-50' },
    important: { badge: 'bg-amber-100 text-amber-700 ring-1 ring-amber-300', border: 'border-amber-200', bg: 'bg-amber-50' },
    critical: { badge: 'bg-rose-100 text-rose-700 ring-1 ring-rose-300 animate-pulse', border: 'border-rose-200', bg: 'bg-rose-50' },
};

export default function Show({ announcement, metrics, targets }: Props) {
    const { confirm } = useResidentConfirmation();
    const [showActions, setShowActions] = useState(false);

    const handleDelete = () => {
        confirm({
            title: 'Delete broadcast',
            message: 'Are you sure you want to delete this broadcast? This action cannot be undone.',
            confirmLabel: 'Delete broadcast',
            onConfirm: () => router.delete(destroy.url(announcement.hashid as any)),
        });
    };

    const priorityStyle = PRIORITY_STYLES[announcement.priority || 'normal'];

    return (
        <div className="mx-auto max-w-4xl pb-32">
            <Head title={`Broadcast - ${announcement.title}`} />

            {/* Top Navigation */}
            <div className="mb-8 flex items-center justify-between">
                <Link
                    href={index.url()}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:text-slate-900"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to Feed
                </Link>

                <div className="relative">
                    <button
                        onClick={() => setShowActions(!showActions)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50"
                    >
                        <EllipsisHorizontalIcon className="h-5 w-5" />
                    </button>

                    <AnimatePresence>
                        {showActions && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-900/5"
                            >
                                <div className="p-1">
                                    <button
                                        onClick={handleDelete}
                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                        Delete Broadcast
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Main Content Column */}
                <div className="space-y-8 lg:col-span-2">
                    {/* Hero Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className={`overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 ${priorityStyle?.border ? `border-t-4 ${priorityStyle.border}` : ''}`}
                    >
                        <div className="p-8 sm:p-10">
                            <div className="mb-6 flex flex-wrap items-center gap-3">
                                {announcement.category && (
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black tracking-wider uppercase ring-1 ring-inset ${CATEGORY_COLORS[announcement.category] || CATEGORY_COLORS.general}`}
                                    >
                                        {announcement.category}
                                    </span>
                                )}
                                {announcement.priority && announcement.priority !== 'normal' && (
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black tracking-wider uppercase ${priorityStyle.badge}`}
                                    >
                                        {announcement.priority}
                                    </span>
                                )}
                                <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    <ClockIcon className="h-4 w-4" />
                                    Published {announcement.created_at}
                                </span>
                            </div>

                            <h1 className="text-3xl leading-tight font-black tracking-tight text-slate-900 sm:text-4xl">{announcement.title}</h1>

                            <div className="prose prose-slate prose-lg mt-8 max-w-none">
                                <p className="leading-relaxed font-medium whitespace-pre-wrap text-slate-700">{announcement.body}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Delivery Insights */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl"
                    >
                        <div className="mb-6 flex items-center gap-2 text-indigo-200">
                            <ChartBarIcon className="h-5 w-5 opacity-70" />
                            <h3 className="text-xs font-black tracking-wider uppercase">Delivery Insights</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="mb-2 flex items-end justify-between">
                                    <span className="text-3xl font-black">{metrics.read_rate}%</span>
                                    <span className="pb-1 text-sm font-semibold text-indigo-200">Read Rate</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${metrics.read_rate}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className="h-full rounded-full bg-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                                <div>
                                    <p className="mb-1 text-xs font-bold tracking-wider text-slate-400 uppercase">Delivered</p>
                                    <p className="flex items-center gap-2 text-lg font-bold">
                                        <CheckCircleIcon className="h-4 w-4 text-indigo-400" />
                                        {metrics.targets_count}
                                    </p>
                                </div>
                                <div>
                                    <p className="mb-1 text-xs font-bold tracking-wider text-slate-400 uppercase">Read</p>
                                    <p className="flex items-center gap-2 text-lg font-bold">
                                        <EyeIcon className="h-4 w-4 text-emerald-400" />
                                        {metrics.reads_count}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Audience Targets */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
                    >
                        <div className="mb-6 flex items-center gap-2 text-slate-400">
                            <UserGroupIcon className="h-5 w-5" />
                            <h3 className="text-xs font-black tracking-wider uppercase">Audience Targeting</h3>
                        </div>

                        {announcement.applies_to === 'all' ? (
                            <div className="rounded-2xl bg-slate-50 p-4 text-center">
                                <p className="text-sm font-bold text-slate-700">All Residents</p>
                                <p className="mt-1 text-xs text-slate-500">This broadcast was sent to everyone in your managed properties.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex flex-col gap-2">
                                    {targets.map((tgt, index) => (
                                        <div key={index} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                                            <span className="text-sm font-bold text-slate-700">{tgt.name}</span>
                                            <span className="rounded-md bg-white px-2 py-1 text-[10px] font-black tracking-wider text-slate-400 uppercase shadow-sm ring-1 ring-slate-200">
                                                {tgt.type}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
