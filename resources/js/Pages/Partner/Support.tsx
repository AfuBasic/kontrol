import {
    ChatBubbleLeftRightIcon,
    EnvelopeIcon,
    QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';

interface FaqItem {
    question: string;
    answer: string;
}

interface Props {
    support: {
        email: string;
        faq: FaqItem[];
    };
}

export default function PartnerSupport({ support }: Props) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <PartnerLayout>
            <Head title="Support – Partner Portal" />

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Support</h1>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                        Get help with estates, commissions, and your partner account.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <section className="rounded-2xl border border-primary-200 bg-linear-to-br from-primary-50 to-white p-6 shadow-sm lg:col-span-1 dark:border-primary-900/40 dark:from-primary-950/40 dark:to-slate-900">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/20">
                            <ChatBubbleLeftRightIcon className="h-6 w-6" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Contact Kontrol</h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Our partner success team typically responds within one business day.
                        </p>
                        <a
                            href={`mailto:${support.email}?subject=Partner%20support%20request`}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500"
                        >
                            <EnvelopeIcon className="h-4 w-4" />
                            Email support
                        </a>
                        <p className="mt-3 text-xs text-slate-500">{support.email}</p>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-5 flex items-center gap-3">
                            <QuestionMarkCircleIcon className="h-6 w-6 text-slate-400" />
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Frequently asked questions</h2>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {support.faq.map((item, index) => {
                                const open = openIndex === index;

                                return (
                                    <div key={item.question} className="py-3">
                                        <button
                                            type="button"
                                            onClick={() => setOpenIndex(open ? null : index)}
                                            aria-expanded={open}
                                            className="flex w-full items-start justify-between gap-4 text-left"
                                        >
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {item.question}
                                            </span>
                                            <span
                                                className={`mt-0.5 shrink-0 text-slate-400 transition ${open ? 'rotate-45' : ''}`}
                                                aria-hidden
                                            >
                                                +
                                            </span>
                                        </button>
                                        {open && (
                                            <p className="mt-2 pr-8 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                                {item.answer}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Ready to grow?{' '}
                        <Link href="/partner/partner-requests/create" className="font-semibold text-primary-600 hover:underline">
                            Submit a new estate
                        </Link>{' '}
                        or review your{' '}
                        <Link href="/partner/earnings" className="font-semibold text-primary-600 hover:underline">
                            earnings
                        </Link>
                        .
                    </p>
                </div>
            </motion.div>
        </PartnerLayout>
    );
}
