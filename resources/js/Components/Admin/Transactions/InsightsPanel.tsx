import { motion } from 'framer-motion';
import { AlertTriangle, Lightbulb, Sparkles, TrendingUp } from 'lucide-react';

interface Insight {
    type: 'positive' | 'negative' | 'warning' | 'info';
    message: string;
}

interface Props {
    insights?: Insight[];
    loading?: boolean;
}

const toneMap = {
    positive: { icon: TrendingUp, className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
    negative: { icon: AlertTriangle, className: 'border-rose-200 bg-rose-50 text-rose-800' },
    warning: { icon: AlertTriangle, className: 'border-amber-200 bg-amber-50 text-amber-800' },
    info: { icon: Lightbulb, className: 'border-[#C7DCFF] bg-[#F0F5FF] text-[#0A3D91]' },
};

export default function InsightsPanel({ insights, loading }: Props) {
    if (loading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                ))}
            </div>
        );
    }

    if (!insights || insights.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Insights will appear as more financial activity is recorded.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#1F6FDB]" />
                <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Insights</p>
            </div>
            {insights.map((insight, index) => {
                const tone = toneMap[insight.type];
                const Icon = tone.icon;

                return (
                    <motion.div
                        key={insight.message}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`rounded-2xl border p-4 ${tone.className}`}
                    >
                        <div className="flex items-start gap-3">
                            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                            <p className="text-sm font-medium">{insight.message}</p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
