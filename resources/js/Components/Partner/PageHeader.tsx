import type { ReactNode } from 'react';

interface Props {
    title: string;
    description?: string;
    eyebrow?: string;
    actions?: ReactNode;
}

/**
 * Compact page header - consistent density and baseline alignment.
 */
export default function PageHeader({ title, description, eyebrow, actions }: Props) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
                {eyebrow && (
                    <p className="mb-1 text-[10px] font-semibold tracking-[0.14em] text-stone-400 uppercase dark:text-slate-500">{eyebrow}</p>
                )}
                <h1 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-[1.35rem] dark:text-white">{title}</h1>
                {description && <p className="mt-1 max-w-2xl text-[13px] leading-snug text-stone-500 dark:text-slate-400">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 pb-0.5">{actions}</div>}
        </div>
    );
}
