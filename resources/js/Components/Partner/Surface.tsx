import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
    children: ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md';
    hover?: boolean;
    as?: 'div' | 'section' | 'article';
}

const paddingMap = {
    none: '',
    sm: 'p-3.5 sm:p-4',
    md: 'p-4 sm:p-5',
};

/**
 * Premium surface card — warm light / deep dark, subtle ring, tight padding.
 */
export default function Surface({ children, className, padding = 'md', hover = false, as: Tag = 'div' }: Props) {
    return (
        <Tag
            className={cn(
                'rounded-xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)] ring-1 ring-black/[0.02]',
                'dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none dark:ring-white/[0.03]',
                hover &&
                    'transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-black/[0.04] dark:hover:border-slate-700 dark:hover:ring-white/[0.06]',
                paddingMap[padding],
                className,
            )}
        >
            {children}
        </Tag>
    );
}
