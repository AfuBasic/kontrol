import { PauseIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { formatAge } from '@/Lib/jobs';

type Props = { live: boolean; onToggle: () => void; generatedAt: string };

/** Shows that a page is refreshing itself, how old its figures are, and lets the owner pause it. */
export default function LiveButton({ live, onToggle, generatedAt }: Props) {
    const [now, setNow] = useState(() => Date.now());

    // Ticks once a second so "12 s ago" stays honest between refreshes.
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    const age = Math.max(0, (now - new Date(generatedAt).getTime()) / 1000);

    return (
        <button
            type="button"
            onClick={onToggle}
            aria-pressed={live}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 px-3.5 text-sm font-semibold text-slate-200 hover:bg-white/5"
        >
            {live ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
            <span className={`h-2 w-2 rounded-full ${live ? 'animate-pulse bg-emerald-400' : 'bg-slate-600'}`} />
            {live ? `Live · ${formatAge(age)}` : 'Paused'}
        </button>
    );
}
