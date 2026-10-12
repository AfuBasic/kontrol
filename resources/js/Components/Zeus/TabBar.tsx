type Tab<T extends string> = { id: T; label: string; badge?: string | number | null };

type Props<T extends string> = { tabs: Array<Tab<T>>; active: T; onChange: (id: T) => void; label: string };

/** Splits a long page into parts. The choice lives in the page's address, so a link or a refresh lands on the same tab. */
export default function TabBar<T extends string>({ tabs, active, onChange, label }: Props<T>) {
    return (
        <div role="tablist" aria-label={label} className="flex gap-1 border-b border-slate-800/80">
            {tabs.map((tab) => {
                const selected = tab.id === active;

                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => onChange(tab.id)}
                        className={`-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition ${selected ? 'border-primary-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
                    >
                        {tab.label}
                        {tab.badge !== undefined && tab.badge !== null && (
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${selected ? 'bg-primary-500/20 text-primary-200' : 'bg-slate-800 text-slate-400'}`}
                            >
                                {tab.badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
