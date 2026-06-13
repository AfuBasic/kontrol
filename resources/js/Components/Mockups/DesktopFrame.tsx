import { ReactNode } from 'react';

interface Props {
    src: string;
    alt: string;
    className?: string;
}

export default function DesktopFrame({ src, alt, className = '' }: Props) {
    return (
        <div
            className={`relative mx-auto rounded-xl border border-slate-200/50 bg-slate-900/5 p-2 shadow-2xl backdrop-blur-sm sm:rounded-2xl sm:p-4 lg:rounded-3xl lg:p-6 dark:border-slate-800/50 dark:bg-white/5 ${className}`}
        >
            <div className="relative overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl dark:bg-slate-900 dark:ring-white/10">
                {/* Mac OS Style Title Bar */}
                <div className="flex items-center gap-2 border-b border-slate-200/50 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                    <div className="h-3 w-3 rounded-full bg-red-400 shadow-sm"></div>
                    <div className="h-3 w-3 rounded-full bg-amber-400 shadow-sm"></div>
                    <div className="h-3 w-3 rounded-full bg-green-400 shadow-sm"></div>
                </div>

                {/* The Dashboard Image */}
                <img src={src} alt={alt} className="h-auto w-full rounded-b-md" />
            </div>

            {/* Gloss reflection overlay (optional for premium feel) */}
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/0 via-white/0 to-white/5 dark:to-white/10"></div>
        </div>
    );
}
