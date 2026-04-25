import { ActivityItem } from '@/Types/access-code';
import { motion } from 'framer-motion';
import { Plus, Check, Clock, X, Info } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Props {
    activities: ActivityItem[];
}

function getActivityIcon(type: ActivityItem['type']) {
    switch (type) {
        case 'created':
            return <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Plus className="h-5 w-5" /></div>;
        case 'used':
            return <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Check className="h-5 w-5" /></div>;
        case 'expired':
            return <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400"><Clock className="h-5 w-5" /></div>;
        case 'revoked':
            return <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><X className="h-5 w-5" /></div>;
        default:
            return <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Info className="h-5 w-5" /></div>;
    }
}

export default function LiveFeed({ activities }: Props) {
    return (
        <div>
            <div className="mb-6 flex items-center justify-between px-1">
                <h3 className="text-xl font-black tracking-tight text-slate-900">Live Activity</h3>
                <Link 
                    href="/resident/activity" 
                    className="text-sm font-bold text-indigo-600 underline-offset-4 hover:underline"
                >
                    History
                </Link>
            </div>

            <div className="relative space-y-2">
                {/* Vertical Line */}
                <div className="absolute top-2 bottom-2 left-5 w-0.5 bg-slate-100" />

                {activities.length > 0 ? (
                    activities.map((activity, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            className="relative flex items-center gap-4 rounded-3xl p-3 transition-colors hover:bg-slate-50"
                        >
                            <div className="relative z-10 shrink-0 bg-white p-0.5">
                                {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">{activity.message}</p>
                                <p className="text-xs font-medium text-slate-400">{activity.time}</p>
                            </div>
                            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                                {activity.code}
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="py-10 text-center bg-slate-50/50 rounded-[32px] border border-slate-100">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
                            <Clock className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-900">No recent activity</p>
                        <p className="mt-1 text-xs font-medium text-slate-400 px-6 leading-relaxed">
                            Everything is currently quiet. New entries and events will appear here in real-time.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
