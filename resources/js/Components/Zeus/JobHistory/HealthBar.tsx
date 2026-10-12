import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import type { Overview } from './types';

const LOOK = {
    ok: { icon: CheckCircleIcon, box: 'border-emerald-500/25 bg-emerald-500/10', tone: 'text-emerald-300', title: 'All clear' },
    attention: { icon: ExclamationTriangleIcon, box: 'border-amber-500/30 bg-amber-500/10', tone: 'text-amber-300', title: 'Needs a look' },
    down: { icon: XCircleIcon, box: 'border-rose-500/40 bg-rose-500/10', tone: 'text-rose-300', title: 'Something is stuck' },
} as const;

/** The first thing on the page: one line that answers "is the queue fine?" before any number does. */
export default function HealthBar({ health }: { health: Overview['health'] }) {
    const look = LOOK[health.level];
    const Icon = look.icon;

    return (
        <div role="status" className={`flex items-center gap-3 rounded-2xl border px-5 py-4 ${look.box}`}>
            <Icon className={`h-6 w-6 shrink-0 ${look.tone}`} />
            <p className="text-sm text-slate-200">
                <span className={`font-bold ${look.tone}`}>{look.title}.</span> {health.message}
            </p>
        </div>
    );
}
