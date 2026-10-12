type Props = { label: string; value: string; sub: string; tone?: string };

/** One headline figure on a Zeus page: a label, a big number and a line of explanation. */
export default function StatTile({ label, value, sub, tone = 'text-white' }: Props) {
    return (
        <div className="rounded-2xl border border-slate-800/70 bg-[#0f1423] p-5">
            <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">{label}</p>
            <p className={`mt-2 text-3xl font-black tracking-tight tabular-nums ${tone}`}>{value}</p>
            <p className="mt-1 text-xs text-slate-500">{sub}</p>
        </div>
    );
}
