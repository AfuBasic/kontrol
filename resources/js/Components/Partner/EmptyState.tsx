import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import type { ComponentType, ReactNode } from 'react';

interface Props {
    icon: ComponentType<{ className?: string }>;
    title: string;
    description: string;
    nextStep?: string;
    action?: {
        label: string;
        href: string;
    };
    secondaryAction?: {
        label: string;
        href: string;
    };
    children?: ReactNode;
    className?: string;
}

/**
 * Premium empty state: context, next step, and clear CTA — not just "no data".
 */
export default function EmptyState({
    icon: Icon,
    title,
    description,
    nextStep,
    action,
    secondaryAction,
    children,
    className = '',
}: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex flex-col items-center px-6 py-12 text-center ${className}`}
        >
            <div className="relative mb-4">
                <div className="absolute inset-0 rounded-2xl bg-primary-500/10 blur-xl" aria-hidden />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-200/80 bg-white shadow-sm ring-1 ring-black/[0.03] dark:border-slate-700 dark:bg-slate-800 dark:ring-white/5">
                    <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
            </div>
            <h3 className="text-[15px] font-semibold tracking-tight text-stone-900 dark:text-white">{title}</h3>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-stone-500 dark:text-slate-400">{description}</p>
            {nextStep && (
                <p className="mt-3 max-w-sm text-[12px] font-medium text-stone-600 dark:text-slate-300">
                    <span className="text-primary-600 dark:text-primary-400">Next: </span>
                    {nextStep}
                </p>
            )}
            {children}
            {(action || secondaryAction) && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    {action && (
                        <Link
                            href={action.href}
                            className="inline-flex items-center rounded-lg bg-primary-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-primary-500 active:scale-[0.98]"
                        >
                            {action.label}
                        </Link>
                    )}
                    {secondaryAction && (
                        <Link
                            href={secondaryAction.href}
                            className="inline-flex items-center rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                            {secondaryAction.label}
                        </Link>
                    )}
                </div>
            )}
        </motion.div>
    );
}
