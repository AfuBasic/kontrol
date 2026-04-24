import { HomeStats } from '@/types/access-code';
import { motion } from 'framer-motion';

interface Props {
    stats: HomeStats;
}

export default function DailyMetrics({ stats }: Props) {
    const total = stats.codes_today || 1; // Avoid division by zero
    const arrivalRate = (stats.visitors_today / total) * 100;

    return (
        <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
            <h3 className="mb-6 text-lg font-bold tracking-tight text-slate-900">Today's Overview</h3>
            
            <div className="space-y-6">
                <div>
                    <div className="mb-2 flex items-end justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Arrival Rate</p>
                            <p className="text-2xl font-black text-slate-900">{stats.visitors_today} / {stats.codes_today}</p>
                        </div>
                        <p className="text-sm font-bold text-indigo-600">{Math.round(arrivalRate)}%</p>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${arrivalRate}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-linear-to-r from-indigo-500 to-blue-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Codes</p>
                        <div className="mt-1 flex items-baseline gap-1">
                            <p className="text-2xl font-black text-slate-900">{stats.active_codes}</p>
                            <span className="text-xs font-bold text-emerald-500">+2</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed</p>
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
