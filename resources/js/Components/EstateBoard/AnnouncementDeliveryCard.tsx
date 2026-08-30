import { CheckCircle2, Eye, EyeOff, BarChart3 } from 'lucide-react';
import React from 'react';

interface AnnouncementDeliveryCardProps {
    metrics: {
        targets_count: number;
        reads_count: number;
        unread_count?: number;
        read_rate: number;
    };
    className?: string;
}

export default function AnnouncementDeliveryCard({ metrics, className = '' }: AnnouncementDeliveryCardProps) {
    const targetsCount = metrics.targets_count || 0;
    const readsCount = metrics.reads_count || 0;
    const unreadCount = metrics.unread_count ?? Math.max(0, targetsCount - readsCount);
    const readRate = metrics.read_rate || 0;

    return (
        <div className={`rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs ${className}`}>
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800">
                    <BarChart3 className="h-4 w-4 text-primary-600" />
                    <h3 className="text-xs font-black tracking-wider uppercase">Delivery Insights</h3>
                </div>
                <span className="text-xs font-black text-slate-900">{readRate}%</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                    className="h-full rounded-full bg-primary-600 transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, readRate))}%` }}
                />
            </div>

            {/* Numbers Grid */}
            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-left">
                <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Delivered</p>
                    <p className="mt-1 flex items-center gap-1 text-sm font-black text-slate-900">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary-500 shrink-0" />
                        {targetsCount}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Read</p>
                    <p className="mt-1 flex items-center gap-1 text-sm font-black text-emerald-600">
                        <Eye className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        {readsCount}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Unread</p>
                    <p className="mt-1 flex items-center gap-1 text-sm font-black text-slate-600">
                        <EyeOff className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {unreadCount}
                    </p>
                </div>
            </div>
        </div>
    );
}
