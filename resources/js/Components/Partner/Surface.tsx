import type { ReactNode } from 'react';
import { cn } from '@/Lib/utils';

interface Props {
    children: ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    as?: 'div' | 'section' | 'article';
    /** Fill parent height for equal-height grid rows */
    stretch?: boolean;
}

const paddingMap = {
    none: '',
    sm: 'p-3.5 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
};

/**
 * Premium surface - elevation over borders, soft ring, optional stretch.
 */
export default function Surface({ children, className, padding = 'md', hover = false, as: Tag = 'div', stretch = false }: Props) {
    return (
        <Tag
            className={cn(
                'rounded-2xl bg-white/80 shadow-[0_1px_0_rgba(28,25,23,0.04),0_8px_24px_-14px_rgba(28,25,23,0.12)] ring-1 ring-stone-900/[0.04] backdrop-blur-sm',
                'dark:bg-white/[0.035] dark:shadow-none dark:ring-white/[0.06]',
                hover &&
                    'transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(28,25,23,0.2)] hover:ring-stone-900/[0.06] dark:hover:bg-white/[0.05] dark:hover:ring-white/[0.08]',
                stretch && 'flex h-full flex-col',
                paddingMap[padding],
                className,
            )}
        >
            {children}
        </Tag>
    );
}
