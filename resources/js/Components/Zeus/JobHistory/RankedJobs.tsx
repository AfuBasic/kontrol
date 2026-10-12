import type { ReactNode } from 'react';
import { formatDuration } from '@/Lib/jobs';
import type { FlakyJob, SlowJob } from './types';

type Props = { slowest: SlowJob[]; flakiest: FlakyJob[] };

/** Where to look first: the jobs that take longest, and the ones that fail most often. */
export default function RankedJobs({ slowest, flakiest }: Props) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <Ranking title="Slowest jobs" hint="By average time, jobs that worked." empty="No finished jobs in this period.">
                {slowest.map((job) => (
                    <Row
                        key={job.job}
                        name={job.job}
                        sub={`${job.runs} ${job.runs === 1 ? 'run' : 'runs'} · slowest ${formatDuration(job.max_duration_ms)}`}
                    >
                        <span className="text-sm font-bold text-sky-300 tabular-nums">{formatDuration(job.avg_duration_ms)}</span>
                    </Row>
                ))}
            </Ranking>

            <Ranking title="Failing most" hint="By share of attempts that failed." empty="Nothing failed in this period.">
                {flakiest.map((job) => (
                    <Row key={job.job} name={job.job} sub={`${job.failed} of ${job.runs} attempts failed`}>
                        <span className="text-sm font-bold text-rose-300 tabular-nums">{job.failure_rate}%</span>
                    </Row>
                ))}
            </Ranking>
        </div>
    );
}

function Ranking({ title, hint, empty, children }: { title: string; hint: string; empty: string; children: ReactNode[] }) {
    return (
        <section className="rounded-2xl border border-slate-800/70 bg-[#0f1423]" aria-label={title}>
            <div className="border-b border-slate-800/70 px-6 py-4">
                <h2 className="text-sm font-bold text-white">{title}</h2>
                <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
            </div>
            {children.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-slate-500">{empty}</p>
            ) : (
                <div className="divide-y divide-slate-800/60">{children}</div>
            )}
        </section>
    );
}

function Row({ name, sub, children }: { name: string; sub: string; children: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 px-6 py-3">
            <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
            </div>
            {children}
        </div>
    );
}
