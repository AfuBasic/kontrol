import { ChevronDownIcon, EnvelopeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Head } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';

interface FaqItem {
    question: string;
    answer: string;
    category?: string;
}

interface Props {
    support: {
        email: string;
        response_sla: string;
        avg_reply_hours?: number;
        queue_status?: string;
        status?: string;
        business_hours?: string;
        faq: FaqItem[];
    };
}

export default function PartnerSupport({ support }: Props) {
    const [query, setQuery] = useState('');
    const [openQuestion, setOpenQuestion] = useState<string | null>(null);

    const mailto = `mailto:${support.email}?subject=${encodeURIComponent('Partner support request')}`;

    const filteredFaq = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) {
            return support.faq;
        }

        return support.faq.filter(
            (item) =>
                item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q) || (item.category ?? '').toLowerCase().includes(q),
        );
    }, [query, support.faq]);

    return (
        <PartnerLayout>
            <Head title="Support" />

            <div className="mx-auto max-w-5xl space-y-8 pb-8">
                <div>
                    <p className="text-[11px] font-medium tracking-[0.14em] text-stone-400 uppercase">Partner success</p>
                    <h1 className="mt-1 text-[1.5rem] font-semibold tracking-tight text-stone-900 dark:text-white">Support</h1>
                </div>

                {/* Hero */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="relative overflow-hidden rounded-[1.75rem] bg-[#061230] text-white shadow-[0_28px_64px_-32px_rgba(10,61,145,0.55)]"
                >
                    <div className="pointer-events-none absolute inset-0" aria-hidden>
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(31,111,219,0.42),transparent_58%)]" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.1),transparent_48%)]" />
                        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-sky-200/20 to-transparent" />
                    </div>

                    <div className="relative px-5 py-7 sm:px-8 sm:py-9">
                        <p className="text-[13px] font-medium text-white/50">Partner Success Center</p>
                        <h2 className="mt-1 max-w-lg text-[1.85rem] font-semibold tracking-tight sm:text-[2.25rem]">Need help?</h2>
                        <p className="mt-2 max-w-md text-[14px] text-white/50">We&apos;re here whenever you need us.</p>

                        <div className="mt-6 flex flex-wrap gap-2">
                            <div className="rounded-xl bg-white/[0.07] px-3.5 py-2.5 ring-1 ring-white/10">
                                <p className="text-[9px] font-semibold tracking-wide text-white/40 uppercase">Avg. response</p>
                                <p className="text-[13px] font-semibold">&lt; {support.response_sla}</p>
                            </div>
                            <div className="rounded-xl bg-white/[0.07] px-3.5 py-2.5 ring-1 ring-white/10">
                                <p className="text-[9px] font-semibold tracking-wide text-white/40 uppercase">FAQs</p>
                                <p className="text-[13px] font-semibold tabular-nums">{support.faq.length}</p>
                            </div>
                            <div className="rounded-xl bg-white/[0.07] px-3.5 py-2.5 ring-1 ring-white/10">
                                <p className="text-[9px] font-semibold tracking-wide text-white/40 uppercase">Status</p>
                                <p className="flex items-center gap-1.5 text-[13px] font-semibold">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                    {support.status ?? 'Online'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2.5">
                            <a
                                href={mailto}
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold text-stone-900 transition hover:bg-white/95"
                            >
                                <EnvelopeIcon className="h-4 w-4" />
                                Contact support
                            </a>
                            <button
                                type="button"
                                onClick={() => document.getElementById('faq-search')?.focus()}
                                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
                            >
                                Browse FAQs
                            </button>
                        </div>
                    </div>
                </motion.section>

                {/* FAQs */}
                <section className="space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h2 className="text-[15px] font-semibold tracking-tight text-stone-900 dark:text-white">Frequently asked questions</h2>
                            <p className="mt-0.5 text-[12px] text-stone-500">Quick answers to common partner questions</p>
                        </div>
                    </div>

                    <div className="relative">
                        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                            id="faq-search"
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search FAQs…"
                            aria-label="Search FAQs"
                            className="w-full rounded-2xl bg-white py-3 pr-4 pl-11 text-[14px] text-stone-900 shadow-sm ring-1 ring-stone-900/[0.06] transition outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-primary-200 dark:bg-white/[0.04] dark:text-white dark:ring-white/10 dark:focus:ring-primary-800"
                        />
                    </div>

                    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.035] dark:ring-white/[0.06]">
                        {filteredFaq.length === 0 ? (
                            <p className="px-5 py-10 text-center text-[13px] text-stone-500">
                                No FAQs match “{query.trim()}”. Try another search or contact support.
                            </p>
                        ) : (
                            <ul>
                                {filteredFaq.map((item, _i) => {
                                    const open = openQuestion === item.question;

                                    return (
                                        <li key={item.question} className="border-b border-stone-100 last:border-0 dark:border-white/[0.05]">
                                            <button
                                                type="button"
                                                onClick={() => setOpenQuestion(open ? null : item.question)}
                                                aria-expanded={open}
                                                className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left transition hover:bg-stone-50/80 sm:px-5 dark:hover:bg-white/[0.03]"
                                            >
                                                <span className="min-w-0">
                                                    {item.category && (
                                                        <span className="mb-1 block text-[10px] font-semibold tracking-wide text-stone-400 uppercase">
                                                            {item.category}
                                                        </span>
                                                    )}
                                                    <span className="block text-[14px] font-semibold text-stone-900 dark:text-white">
                                                        {item.question}
                                                    </span>
                                                </span>
                                                <ChevronDownIcon
                                                    className={`mt-1 h-4 w-4 shrink-0 text-stone-400 transition duration-200 ${
                                                        open ? 'rotate-180' : ''
                                                    }`}
                                                />
                                            </button>
                                            <AnimatePresence initial={false}>
                                                {open && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                                        className="overflow-hidden"
                                                    >
                                                        <p className="px-4 pb-4 text-[13px] leading-relaxed text-stone-600 sm:px-5 dark:text-slate-400">
                                                            {item.answer}
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </section>

                {/* Status + contact */}
                <section className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.035] dark:ring-white/[0.06]">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                            <p className="text-[14px] font-semibold text-stone-900 dark:text-white">Support team {support.status ?? 'Online'}</p>
                        </div>
                        <dl className="mt-4 space-y-2.5">
                            {[
                                { label: 'Average reply', value: `~${support.avg_reply_hours ?? 8} hours` },
                                { label: 'Queue', value: support.queue_status ?? 'Low' },
                                { label: 'Hours', value: support.business_hours ?? 'Mon–Fri' },
                            ].map((row) => (
                                <div key={row.label} className="flex justify-between gap-3 text-[12px]">
                                    <dt className="text-stone-400">{row.label}</dt>
                                    <dd className="font-semibold text-stone-800 dark:text-slate-200">{row.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.035] dark:ring-white/[0.06]">
                        <p className="text-[14px] font-semibold text-stone-900 dark:text-white">Still need help?</p>
                        <p className="mt-1 text-[12px] text-stone-500">
                            Reach us at <span className="font-semibold text-stone-700 dark:text-slate-200">{support.email}</span>. Typical reply
                            within {support.response_sla}.
                        </p>
                        <a
                            href={mailto}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-[12px] font-semibold text-white dark:bg-white dark:text-stone-900"
                        >
                            <EnvelopeIcon className="h-3.5 w-3.5" />
                            Email support
                        </a>
                    </div>
                </section>
            </div>
        </PartnerLayout>
    );
}
