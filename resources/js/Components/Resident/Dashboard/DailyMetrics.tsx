import { motion } from 'framer-motion';
import type { HomeStats } from '@/types/access-code';

interface Props {
    stats: HomeStats;
}

export default function DailyMetrics({ stats }: Props) {
    const total = stats.total_expected || stats.visitors_today || 0;
    const arrivalRate = total > 0 ? Math.min((stats.visitors_today / total) * 100, 100) : 0;

    return (
        <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
            <h3 className="mb-6 text-lg font-bold tracking-tight text-slate-900">Today's Overview</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                <div>
                    <div className="mb-2 flex items-end justify-between">
                        <div>
                            <p className="text-sm font-bold tracking-wider text-slate-500 uppercase">Arrival Rate</p>
                            <p className="text-2xl font-black text-slate-900">
                                {stats.visitors_today} / {total}
                            </p>
                        </div>
                        <p className="text-sm font-bold text-indigo-600">{Math.round(arrivalRate)}%</p>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${arrivalRate}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-linear-to-r from-indigo-500 to-blue-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-6 sm:border-t-0 sm:border-l sm:border-slate-100 sm:pt-0 sm:pl-8">
                    <div>
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Active Codes</p>
                        <div className="mt-1 flex items-baseline gap-1">
                            <p className="text-2xl font-black text-slate-900">{stats.active_codes}</p>
                            <span className="text-[10px] font-bold text-slate-300">Remaining</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Completed</p>
                        <div className="mt-1 flex items-baseline gap-1">
                            <p className="text-2xl font-black text-slate-900">{stats.visitors_today}</p>
                            <span className="text-xs font-bold text-slate-300">Today</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
