import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Head, router } from '@inertiajs/react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState, useMemo } from 'react';

import AdminLayout from '@/layouts/AdminLayout';

interface Activity {
    id: number;
    description: string;
    created_at: string;
    causer?: { name: string; email: string };
    subject?: { name?: string; title?: string; id: number };
    properties: Record<string, any>;
}

interface Props {
    activities: {
        data: Activity[];
        next_page_url: string | null;
    };
}

export default function ActivityLogIndex({ activities: initialActivities }: Props) {
    const [activities, setActivities] = useState<Activity[]>(initialActivities.data);
    const [nextPageUrl, setNextPageUrl] = useState<string | null>(initialActivities.next_page_url);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Infinite Scroll Logic
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && nextPageUrl && !loading) {
                    loadMore();
                }
            },
            { threshold: 1.0 },
        );
        if (loadMoreRef.current) observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [nextPageUrl, loading]);

    const loadMore = () => {
        if (!nextPageUrl || loading) return;
        setLoading(true);
        router.visit(nextPageUrl, {
            preserveState: true,
            preserveScroll: true,
            only: ['activities'],
            onSuccess: (page) => {
                const newActs = (page.props.activities as any).data;
                setActivities((prev) => [...prev, ...newActs]);
                setNextPageUrl((page.props.activities as any).next_page_url);
                setLoading(false);
            },
        });
    };

    // Filter Logic
    const filteredActivities = useMemo(() => {
        if (!searchQuery) return activities;
        const q = searchQuery.toLowerCase();
        return activities.filter(
            (a) =>
                a.causer?.name.toLowerCase().includes(q) ||
                a.description.toLowerCase().includes(q) ||
                (a.subject?.name || '').toLowerCase().includes(q),
        );
    }, [activities, searchQuery]);

    // Grouping Logic
    const grouped = useMemo(() => {
        return filteredActivities.reduce(
            (acc, act) => {
                const d = format(parseISO(act.created_at), 'yyyy-MM-dd');
                if (!acc[d]) acc[d] = [];
                acc[d].push(act);
                return acc;
            },
            {} as Record<string, Activity[]>,
        );
    }, [filteredActivities]);

    const getDateLabel = (dateStr: string) => {
        const date = parseISO(dateStr);
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMMM d, yyyy');
    };

    return (
        <AdminLayout>
            <Head title="Activity Feed" />

            <div className="min-h-screen bg-[#F8FAFC] pb-32">
                {/* 1. STICKY SEARCH BAR */}
                <div className="sticky top-6 z-50 mx-auto max-w-2xl px-4 pb-6">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search activities, users, or subjects..."
                            className="block w-full rounded-2xl border border-gray-100 bg-white/95 py-4 pr-4 pl-12 text-base text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </motion.div>
                </div>

                <div className="mx-auto mt-12 max-w-4xl px-4 sm:px-6">
                    <div className="relative">
                        {/* 2. THE RAIL: Soft Blue Connector */}
                        <div className="absolute top-0 bottom-0 left-8 w-1 rounded-full bg-blue-100/60 sm:left-32" />

                        <div className="space-y-20">
                            {Object.entries(grouped).map(([date, items]) => (
                                <section key={date} className="relative">
                                    {/* 3. DATE MARKER (Better alignment by the rail) */}
                                    <div className="relative z-10 mb-12 flex items-center">
                                        {/* Glow Node */}
                                        <div className="absolute left-8 h-5 w-5 -translate-x-1/2 rounded-full border-4 border-white bg-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.6)] sm:left-32" />

                                        {/* Date Label - Sitting properly next to the node */}
                                        <div className="ml-16 sm:absolute sm:left-32 sm:ml-0 sm:-translate-x-[calc(100%+24px)]">
                                            <div className="inline-block rounded-2xl bg-white px-5 py-2 text-sm font-black tracking-widest whitespace-nowrap text-[#1E293B] uppercase shadow-[0_4px_20px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
                                                {getDateLabel(date)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. ACTIVITY ENTRIES */}
                                    <div className="space-y-12">
                                        {items.map((act) => (
                                            <motion.div
                                                key={act.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                className="group relative flex flex-col sm:flex-row"
                                            >
                                                {/* Inner Rail Node */}
                                                <div className="absolute top-6 left-8 h-3 w-3 -translate-x-1/2 rounded-full bg-white ring-2 ring-blue-200 transition-all group-hover:scale-125 group-hover:bg-blue-400 sm:left-32" />

                                                {/* Left Column: Timestamp (Desktop) */}
                                                <div className="hidden w-32 shrink-0 pt-5 pr-10 text-right sm:block">
                                                    <span className="text-xs font-black tracking-widest text-slate-300 uppercase group-hover:text-blue-300">
                                                        {format(parseISO(act.created_at), 'h:mm a')}
                                                    </span>
                                                </div>

                                                {/* Right Column: The Elevated Card */}
                                                <div className="ml-16 flex-1 sm:ml-12">
                                                    {/* Mobile Timestamp */}
                                                    <div className="mb-2 block text-[10px] font-bold tracking-widest text-slate-400 uppercase sm:hidden">
                                                        {format(parseISO(act.created_at), 'h:mm a')}
                                                    </div>

                                                    <div className="relative rounded-3xl bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.03)] ring-1 ring-slate-100/50 transition-all duration-300 hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] hover:ring-blue-100">
                                                        <div className="flex items-start gap-5">
                                                            {/* User Avatar Placeholder */}
                                                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-linear-to-br from-slate-100 to-slate-200 shadow-inner">
                                                                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-400">
                                                                    {act.causer?.name.charAt(0)}
                                                                </div>
                                                                <div className="absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400"></div>
                                                            </div>

                                                            <div className="flex-1">
                                                                <div className="flex flex-col gap-1">
                                                                    <h4 className="text-[17px] font-extrabold text-[#1E293B]">
                                                                        {act.causer?.name || 'System Execution'}
                                                                    </h4>
                                                                    <p className="text-[15px] leading-relaxed text-[#64748B]">{act.description}</p>
                                                                </div>

                                                                {/* Subject Badge */}
                                                                <div className="mt-4 flex flex-wrap gap-2">
                                                                    <div className="inline-flex items-center gap-2 rounded-[12px] bg-blue-50/50 px-3 py-1.5 ring-1 ring-blue-100/50">
                                                                        <div className="h-4 w-4 rounded-full bg-blue-400/20 p-1 text-blue-500">
                                                                            <div className="h-full w-full rounded-full bg-blue-500" />
                                                                        </div>
                                                                        <span className="text-[13px] font-bold text-blue-600">
                                                                            {act.subject?.name || act.subject?.title || 'System Configuration'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>

                        {/* Pagination Status */}
                        <div ref={loadMoreRef} className="mt-40 flex justify-center">
                            {loading ? (
                                <div className="flex items-center gap-4 rounded-full bg-white px-8 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                                    <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Synchronizing...</span>
                                </div>
                            ) : (
                                !nextPageUrl &&
                                activities.length > 0 && (
                                    <div className="flex flex-col items-center gap-6 py-20">
                                        <div className="h-10 w-[2px] bg-linear-to-b from-blue-100 to-transparent" />
                                        <span className="text-[10px] font-black tracking-[0.4em] text-slate-300 uppercase">Archive Ends</span>
                                    </div>
                                )
                            )}

                            {!filteredActivities.length && !loading && (
                                <div className="flex flex-col items-center py-40">
                                    <div className="group relative mb-8 flex h-24 w-24 items-center justify-center">
                                        <div className="absolute inset-0 animate-pulse rounded-[32px] bg-blue-50 transition-all group-hover:bg-blue-100" />
                                        <MagnifyingGlassIcon className="relative h-8 w-8 text-blue-200" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">Quiet Atmosphere</h3>
                                    <p className="mt-2 text-sm font-medium text-slate-400">No events matched your current search parameters.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
