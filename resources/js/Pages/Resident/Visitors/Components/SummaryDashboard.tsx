import { motion } from 'framer-motion';
import { Users, Calendar, Activity } from 'lucide-react';

interface Props {
    activeCount: number;
    expectedToday: number;
    totalToday: number;
}

export default function SummaryDashboard({ activeCount, expectedToday, totalToday }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center rounded-[32px] bg-white py-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200"
        >
            {/* Inside Stat */}
            <div className="group flex-1 border-r border-slate-50 px-2 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 transition-transform group-hover:scale-110">
                    <Users className="h-5 w-5" fill="currentColor" />
                </div>
                <p className="text-xl font-black text-slate-900">{activeCount}</p>
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Inside</p>
            </div>

            {/* Expected Stat */}
            <div className="group flex-1 border-r border-slate-50 px-2 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-110">
                    <Calendar className="h-5 w-5" />
                </div>
                <p className="text-xl font-black text-slate-900">{expectedToday}</p>
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Expected</p>
            </div>

            {/* Total Today Stat */}
            <div className="group flex-1 px-2 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-110">
                    <Activity className="h-5 w-5" />
                </div>
                <p className="text-xl font-black text-slate-900">{totalToday}</p>
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Today</p>
            </div>
        </motion.div>
    );
}
