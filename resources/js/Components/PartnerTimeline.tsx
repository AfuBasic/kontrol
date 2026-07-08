import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';

type TimelineStep = {
    key: string;
    label: string;
    date?: string | null;
};

interface Props {
    currentStatus?: string | null;
    steps: TimelineStep[];
}

export default function PartnerTimeline({ currentStatus, steps }: Props) {
    const currentIndex = steps.findIndex((step) => step.key === currentStatus);

    return (
        <div className="space-y-0">
            {steps.map((step, index) => {
                const isComplete = currentIndex >= 0 && index <= currentIndex;
                const isCurrent = step.key === currentStatus;

                return (
                    <motion.div
                        key={step.key}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: index * 0.06 }}
                        className="relative flex gap-4 pb-6 last:pb-0"
                    >
                        {index < steps.length - 1 && (
                            <div
                                className={`absolute top-8 left-[11px] h-[calc(100%-8px)] w-px ${
                                    isComplete ? 'bg-emerald-400/60 dark:bg-emerald-500/40' : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                            />
                        )}

                        <div className="relative z-10 mt-0.5">
                            {isComplete ? (
                                <CheckCircle2 className={`h-6 w-6 ${isCurrent ? 'text-emerald-500' : 'text-emerald-400/80'}`} />
                            ) : (
                                <Circle className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p
                                className={`text-sm font-semibold ${
                                    isCurrent
                                        ? 'text-slate-900 dark:text-white'
                                        : isComplete
                                          ? 'text-slate-700 dark:text-slate-300'
                                          : 'text-slate-400 dark:text-slate-500'
                                }`}
                            >
                                {step.label}
                            </p>
                            {step.date && (
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{step.date}</p>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}