
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, X, Info, DoorOpen } from 'lucide-react';
import type { ActivityItem } from '@/types/access-code';

interface Props {
    activities: ActivityItem[];
}

function getActivityConfig(type: ActivityItem['type']) {
    switch (type) {
        case 'created':
            return {
                icon: <Plus className="h-5 w-5" />,
                color: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
                label: 'Code Generated',
            };
        case 'used':
            return {
                icon: <DoorOpen className="h-5 w-5" />,
                color: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
                label: 'Entry Granted',
            };
        case 'expired':
            return {
                icon: <Clock className="h-5 w-5" />,
                color: 'bg-slate-50 text-slate-400 ring-slate-100',
                label: 'Code Expired',
            };
        case 'revoked':
            return {
                icon: <X className="h-5 w-5" />,
                color: 'bg-rose-50 text-rose-600 ring-rose-100',
                label: 'Access Revoked',
            };
        default:
            return {
                icon: <Info className="h-5 w-5" />,
                color: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
                label: 'Event',
            };
    }
}

export default function LiveFeed({ activities }: Props) {
    return (
        <div className="space-y-4">
            <AnimatePresence mode="popLayout">
                {activities.length > 0 ? (
                    <div className="grid gap-3">
                        {activities.map((activity, index) => {
                            const config = getActivityConfig(activity.type);
                            return (
                                <motion.div
                                    key={`${activity.code}-${index}`}
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: index * 0.05,
                                        ease: [0.23, 1, 0.32, 1],
                                    }}
                                    className="group relative flex items-center justify-between overflow-hidden rounded-[28px] bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] ring-1 ring-slate-100 transition-all hover:shadow-lg hover:ring-indigo-100"
                                >
                                    {/* Glass Accents */}
                                    <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 rounded-full bg-slate-50/50 blur-2xl transition-colors group-hover:bg-indigo-50/50" />

                                    <div className="relative flex items-center gap-4">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-[20px] shadow-sm ring-1 ${config.color}`}>
                                            {config.icon}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                    {config.label}
                                                </span>
                                                <span className="h-1 w-1 rounded-full bg-slate-200" />
                                                <span className="text-[10px] font-bold text-slate-300 uppercase">{activity.time}</span>
                                            </div>
                                            <p className="mt-0.5 truncate text-sm leading-tight font-black text-slate-900">{activity.message}</p>
                                        </div>
                                    </div>

                                    <div className="relative flex shrink-0 flex-col items-end">
                                        <div className="rounded-xl bg-slate-50 px-2.5 py-1 text-[10px] font-black tracking-tighter text-slate-400 ring-1 ring-slate-100 transition-all group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:ring-indigo-100">
                                            #{activity.code}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-[40px] border border-dashed border-slate-200 bg-white py-12 text-center"
                    >
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-300">
                            <Activity className="h-10 w-10 opacity-20" />
                        </div>
                        <h4 className="text-lg font-black tracking-tight text-slate-900">Quiet Neighborhood</h4>
                        <p className="mx-auto mt-2 max-w-xs px-10 text-xs leading-relaxed font-bold text-slate-400">
                            No visitor activity recorded recently. New events will appear here in real-time.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Re-using Activity icon from Lucide
function Activity(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    );
}
