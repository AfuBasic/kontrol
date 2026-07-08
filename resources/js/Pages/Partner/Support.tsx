import {
    ChatBubbleLeftRightIcon,
    EnvelopeIcon,
    MagnifyingGlassIcon,
    QuestionMarkCircleIcon,
    TicketIcon,
    VideoCameraIcon,
    BookOpenIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import EmptyState from '@/Components/Partner/EmptyState';
import PageHeader from '@/Components/Partner/PageHeader';
import Surface from '@/Components/Partner/Surface';
import PartnerLayout from '@/Layouts/PartnerLayout';

interface FaqItem {
    question: string;
    answer: string;
    category?: string;
}

interface Resource {
    title: string;
    description: string;
    href: string;
    type: string;
}

interface Props {
    support: {
        email: string;
        response_sla: string;
        faq: FaqItem[];
        resources: Resource[];
        tickets: Array<{
            id: string;
            subject: string;
            status: string;
            updated_at: string;
        }>;
    };
}

export default function PartnerSupport({ support }: Props) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [query, setQuery] = useState('');

    const filteredFaq = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return support.faq;

        return support.faq.filter(
            (item) =>
                item.question.toLowerCase().includes(q) ||
                item.answer.toLowerCase().includes(q) ||
                (item.category ?? '').toLowerCase().includes(q),
        );
    }, [query, support.faq]);

    return (
        <PartnerLayout>
            <Head title="Support" />

            <div className="space-y-4">
                <PageHeader
                    title="Support"
                    description="Help center, resources, and ways to reach Kontrol."
                />

                <div className="grid gap-2.5 sm:grid-cols-3">
                    <Surface padding="sm" hover className="border-primary-200/60 bg-primary-50/30 dark:border-primary-900/40 dark:bg-primary-950/20">
                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
                            <EnvelopeIcon className="h-4 w-4" />
                        </div>
                        <p className="text-[13px] font-semibold text-stone-900 dark:text-white">Email support</p>
                        <p className="mt-0.5 text-[11px] text-stone-500">Typical reply within {support.response_sla}</p>
                        <a
                            href={`mailto:${support.email}?subject=Partner%20support%20request`}
                            className="mt-2.5 inline-flex text-[12px] font-semibold text-primary-600 hover:underline"
                        >
                            {support.email}
                        </a>
                    </Surface>
                    <Surface padding="sm" hover>
                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-600 dark:bg-slate-800 dark:text-slate-300">
                            <ChatBubbleLeftRightIcon className="h-4 w-4" />
                        </div>
                        <p className="text-[13px] font-semibold text-stone-900 dark:text-white">Live chat</p>
                        <p className="mt-0.5 text-[11px] text-stone-500">Coming soon — in-app partner chat</p>
                        <span className="mt-2.5 inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500 dark:bg-slate-800">
                            Future-ready
                        </span>
                    </Surface>
                    <Surface padding="sm" hover>
                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-600 dark:bg-slate-800 dark:text-slate-300">
                            <TicketIcon className="h-4 w-4" />
                        </div>
                        <p className="text-[13px] font-semibold text-stone-900 dark:text-white">Tickets</p>
                        <p className="mt-0.5 text-[11px] text-stone-500">Track support requests in one place</p>
                        <span className="mt-2.5 inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500 dark:bg-slate-800">
                            Coming soon
                        </span>
                    </Surface>
                </div>

                <div className="grid gap-3 lg:grid-cols-5">
                    <Surface className="lg:col-span-3" padding="sm">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <QuestionMarkCircleIcon className="h-4 w-4 text-stone-400" />
                                <h2 className="text-[13px] font-semibold text-stone-900 dark:text-white">Knowledge base</h2>
                            </div>
                            <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
                                <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                                <input
                                    type="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search FAQs…"
                                    aria-label="Search knowledge base"
                                    className="w-full rounded-lg border border-stone-200 bg-white py-1.5 pr-3 pl-8 text-[12px] outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="divide-y divide-stone-100 dark:divide-slate-800">
                            {filteredFaq.length === 0 ? (
                                <p className="py-8 text-center text-[12px] text-stone-500">No articles match “{query}”.</p>
                            ) : (
                                filteredFaq.map((item, index) => {
                                    const open = openIndex === index;

                                    return (
                                        <div key={item.question} className="py-2.5">
                                            <button
                                                type="button"
                                                onClick={() => setOpenIndex(open ? null : index)}
                                                aria-expanded={open}
                                                className="flex w-full items-start justify-between gap-3 text-left"
                                            >
                                                <span>
                                                    {item.category && (
                                                        <span className="mb-0.5 block text-[10px] font-semibold tracking-wide text-stone-400 uppercase">
                                                            {item.category}
                                                        </span>
                                                    )}
                                                    <span className="text-[13px] font-semibold text-stone-900 dark:text-white">
                                                        {item.question}
                                                    </span>
                                                </span>
                                                <span className={`text-stone-400 transition ${open ? 'rotate-45' : ''}`} aria-hidden>
                                                    +
                                                </span>
                                            </button>
                                            {open && (
                                                <p className="mt-1.5 pr-6 text-[12px] leading-relaxed text-stone-600 dark:text-slate-400">
                                                    {item.answer}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Surface>

                    <div className="space-y-3 lg:col-span-2">
                        <Surface padding="sm">
                            <h2 className="mb-2 text-[13px] font-semibold text-stone-900 dark:text-white">Resources</h2>
                            <ul className="space-y-2">
                                {support.resources.map((resource) => {
                                    const Icon =
                                        resource.type === 'video'
                                            ? VideoCameraIcon
                                            : resource.type === 'tool'
                                              ? SparklesIcon
                                              : BookOpenIcon;

                                    return (
                                        <li key={resource.title}>
                                            <Link
                                                href={resource.href}
                                                className="flex gap-2.5 rounded-lg border border-stone-200/80 p-2.5 transition hover:border-primary-200 hover:bg-primary-50/40 dark:border-slate-700 dark:hover:border-primary-800 dark:hover:bg-primary-950/20"
                                            >
                                                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                                                <span>
                                                    <span className="block text-[12px] font-semibold text-stone-900 dark:text-white">
                                                        {resource.title}
                                                    </span>
                                                    <span className="block text-[11px] text-stone-500">{resource.description}</span>
                                                </span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </Surface>

                        <Surface padding="sm">
                            <h2 className="mb-2 text-[13px] font-semibold text-stone-900 dark:text-white">Ticket history</h2>
                            {support.tickets.length === 0 ? (
                                <EmptyState
                                    icon={TicketIcon}
                                    title="No tickets yet"
                                    description="When you open a support ticket, status and replies will appear here."
                                    nextStep="Email support to create your first request."
                                    className="py-6"
                                />
                            ) : (
                                <ul className="space-y-2">
                                    {support.tickets.map((ticket) => (
                                        <li
                                            key={ticket.id}
                                            className="rounded-lg border border-stone-200/80 px-3 py-2 dark:border-slate-700"
                                        >
                                            <p className="text-[12px] font-semibold text-stone-900 dark:text-white">
                                                {ticket.subject}
                                            </p>
                                            <p className="text-[11px] text-stone-500">
                                                {ticket.status} · {ticket.updated_at}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Surface>
                    </div>
                </div>
            </div>
        </PartnerLayout>
    );
}
