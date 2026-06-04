import { motion } from 'framer-motion';
import { Users, Calendar, Activity } from 'lucide-react';

interface Props {
    activeCount: number;
    expectedToday: number;
    totalToday: number;
}

export default function SummaryDashboard({ activeCount, expectedToday, totalToday }: Props) {
    const totalExpected = activeCount + expectedToday;
    const arrivalRate = totalExpected > 0 ? (activeCount / totalExpected) * 100 : 0;

    return (
        <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold tracking-tight text-slate-900">Today's Overview</h3>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <Activity className="h-4 w-4" />
                </div>
            </div>

            <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-2">
                <div>
                    <div className="mb-2 flex items-end justify-between">
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Arrival Rate</p>
                            <p className="mt-1 text-2xl font-black text-slate-900">
                                {activeCount} / {totalExpected}
                            </p>
                        </div>
                        <p className="text-sm font-black text-indigo-600">{Math.round(arrivalRate)}%</p>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-50 ring-1 ring-slate-100/50">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${arrivalRate}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-linear-to-r from-indigo-500 to-blue-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-6 sm:border-t-0 sm:border-l sm:border-slate-100 sm:pt-0 sm:pl-8">
                    <div className="group">
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Inside</p>
                        <div className="mt-1 flex items-baseline gap-1.5">
                            <p className="text-2xl font-black text-slate-900 transition-transform group-hover:scale-105">{activeCount}</p>
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                                <Users className="h-2.5 w-2.5" fill="currentColor" />
                            </div>
                        </div>
                    </div>
                    <div className="group">
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Expected</p>
                        <div className="mt-1 flex items-baseline gap-1.5">
                            <p className="text-2xl font-black text-slate-900 transition-transform group-hover:scale-105">{expectedToday}</p>
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                                <Calendar className="h-2.5 w-2.5" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
