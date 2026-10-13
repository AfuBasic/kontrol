import { GROUP_COLOUR, GROUP_LABEL } from './groups';
import type { OnlineRow } from './types';

/** People with a session touched in the last five minutes, newest first. */
export default function OnlinePanel({ online }: { online: OnlineRow[] | null }) {
    if (online === null) {
        return (
            <p className="rounded-2xl border border-dashed border-slate-700 px-6 py-12 text-center text-sm text-slate-400">
                Sessions are not kept in the database here, so who is online cannot be listed.
            </p>
        );
    }

    if (online.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-16 text-center">
                <p className="text-base font-semibold text-white">No one is online right now</p>
                <p className="mt-1 text-sm text-slate-400">A person shows here while their session is active, and for five minutes after.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-800/60 bg-[#0f1423]">
            <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_180px_130px] items-center gap-4 border-b border-slate-800/70 bg-black/10 px-5 py-3 text-[11px] font-bold tracking-widest text-slate-500 uppercase">
                <span>Person</span>
                <span>Estate</span>
                <span>Using</span>
                <span className="text-right">Last active</span>
            </div>
            {online.map((row) => (
                <div
                    key={row.user_id}
                    className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_180px_130px] items-center gap-4 border-b border-slate-800/60 px-5 py-3 last:border-b-0"
                >
                    <p className="truncate text-sm font-semibold text-white">{row.name}</p>
                    <p className="truncate text-sm text-slate-400">{row.estate ?? '—'}</p>
                    <p className="inline-flex items-center gap-2 text-sm text-slate-300">
                        {row.client ? (
                            <>
                                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: GROUP_COLOUR[row.client] }} />
                                <span className="truncate">
                                    {GROUP_LABEL[row.client]}
                                    {row.app_version ? ` ${row.app_version}` : ''}
                                </span>
                            </>
                        ) : (
                            <span className="text-slate-500">Not recorded yet</span>
                        )}
                    </p>
                    <p className="text-right text-sm text-slate-400" title={new Date(row.last_active_at).toLocaleString()}>
                        {row.last_active_human}
                    </p>
                </div>
            ))}
        </div>
    );
}
