import type { ReactNode } from 'react';

interface Props {
    title: string;
    description?: string;
    eyebrow?: string;
    actions?: ReactNode;
}

/**
 * Compact page header with consistent density and alignment.
 */
export default function PageHeader({ title, description, eyebrow, actions }: Props) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
                {eyebrow && (
                    <p className="mb-0.5 text-[11px] font-semibold tracking-wide text-stone-500 uppercase dark:text-slate-400">
                        {eyebrow}
                    </p>
                )}
                <h1 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-[22px] dark:text-white">
                    {title}
                </h1>
                {description && (
                    <p className="mt-0.5 max-w-2xl text-[13px] leading-snug text-stone-500 dark:text-slate-400">
                        {description}
                    </p>
                )}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}
