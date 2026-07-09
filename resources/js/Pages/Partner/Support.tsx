import {
    ArrowRightIcon,
    BookOpenIcon,
    ChatBubbleLeftRightIcon,
    ChevronDownIcon,
    DocumentTextIcon,
    EnvelopeIcon,
    MagnifyingGlassIcon,
    PlayCircleIcon,
    SparklesIcon,
    TicketIcon,
    UsersIcon,
    VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { Head, Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';

interface FaqItem {
    question: string;
    answer: string;
    category?: string;
    read_minutes?: number;
    popular?: boolean;
}

interface Resource {
    title: string;
    description: string;
    href: string;
    type: string;
    size?: string;
    updated?: string;
}

interface Ticket {
    id: string;
    subject: string;
    status: string;
    updated_at: string;
}

interface Props {
    support: {
        email: string;
        response_sla: string;
        avg_reply_hours?: number;
        queue_status?: string;
        status?: string;
        business_hours?: string;
        article_count?: number;
        faq: FaqItem[];
        categories?: string[];
        resources: Resource[];
        tickets: Ticket[];
    };
}

const DEFAULT_CATEGORIES = [
    'Getting Started',
    'Estate Referrals',
    'Commissions',
    'Settlements',
    'Banking',
    'Account',
    'Security',
];

function resourceIcon(type: string) {
    const t = type.toLowerCase();
    if (t.includes('video')) {
        return VideoCameraIcon;
    }
    if (t.includes('pdf') || t.includes('guide')) {
        return DocumentTextIcon;
    }

    return BookOpenIcon;
}

export default function PartnerSupport({ support }: Props) {
    const [query, setQuery] = useState('');
    const [openCategory, setOpenCategory] = useState<string | null>(null);
    const [openArticle, setOpenArticle] = useState<string | null>(null);

    const categories = support.categories?.length ? support.categories : DEFAULT_CATEGORIES;
    const articleCount = support.article_count ?? support.faq.length;
    const mailto = `mailto:${support.email}?subject=${encodeURIComponent('Partner support request')}`;

    const filteredFaq = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) {
            return support.faq;
        }

        return support.faq.filter(
            (item) =>
                item.question.toLowerCase().includes(q) ||
                item.answer.toLowerCase().includes(q) ||
                (item.category ?? '').toLowerCase().includes(q),
        );
    }, [query, support.faq]);

    const popular = useMemo(
        () => support.faq.filter((f) => f.popular).slice(0, 5),
        [support.faq],
    );

    const byCategory = useMemo(() => {
        const map: Record<string, FaqItem[]> = {};
        for (const cat of categories) {
            map[cat] = [];
        }
        for (const item of filteredFaq) {
            const cat = item.category ?? 'Account';
            if (!map[cat]) {
                map[cat] = [];
            }
            map[cat].push(item);
        }

        return map;
    }, [categories, filteredFaq]);

    return (
        <PartnerLayout>
            <Head title="Support" />

            <div className="mx-auto max-w-5xl space-y-8 pb-8">
                {/* Quiet page label */}
                <div>
                    <p className="text-[11px] font-medium tracking-[0.14em] text-stone-400 uppercase">Partner success</p>
                    <h1 className="mt-1 text-[1.5rem] font-semibold tracking-tight text-stone-900 dark:text-white">
                        Support
                    </h1>
                </div>

                {/* ═══ HELP HERO ═══ */}
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
                        <h2 className="mt-1 max-w-lg text-[1.85rem] font-semibold tracking-tight sm:text-[2.25rem]">
                            Need help?
                        </h2>
                        <p className="mt-2 max-w-md text-[14px] text-white/50">
                            We&apos;re here whenever you need us.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-2">
                            <div className="rounded-xl bg-white/[0.07] px-3.5 py-2.5 ring-1 ring-white/10">
                                <p className="text-[9px] font-semibold tracking-wide text-white/40 uppercase">
                                    Avg. response
                                </p>
                                <p className="text-[13px] font-semibold">&lt; {support.response_sla}</p>
                            </div>
                            <div className="rounded-xl bg-white/[0.07] px-3.5 py-2.5 ring-1 ring-white/10">
                                <p className="text-[9px] font-semibold tracking-wide text-white/40 uppercase">
                                    Articles
                                </p>
                                <p className="text-[13px] font-semibold tabular-nums">{articleCount}</p>
                            </div>
                            <div className="rounded-xl bg-white/[0.07] px-3.5 py-2.5 ring-1 ring-white/10">
                                <p className="text-[9px] font-semibold tracking-wide text-white/40 uppercase">
                                    Status
                                </p>
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
                                onClick={() => document.getElementById('help-search')?.focus()}
                                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
                            >
                                <BookOpenIcon className="h-4 w-4" />
                                Browse articles
                            </button>
                        </div>
                    </div>
                </motion.section>

                {/* ═══ QUICK ACTIONS ═══ */}
                <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                    {[
                        {
                            icon: EnvelopeIcon,
                            title: 'Email support',
                            body: `Typical reply in ${support.response_sla}`,
                            href: mailto,
                            external: true,
                        },
                        {
                            icon: ChatBubbleLeftRightIcon,
                            title: 'Live chat',
                            body: 'Coming soon',
                            badge: 'Soon',
                        },
                        {
                            icon: BookOpenIcon,
                            title: 'Knowledge base',
                            body: 'Browse guides',
                            onClick: () => document.getElementById('help-search')?.focus(),
                        },
                        {
                            icon: PlayCircleIcon,
                            title: 'Video tutorials',
                            body: 'Watch onboarding',
                            href: '/partner/partner-requests/create',
                        },
                    ].map((action, i) => {
                        const Icon = action.icon;
                        const inner = (
                            <>
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-600 transition group-hover:bg-primary-500/10 group-hover:text-primary-600 dark:bg-white/10 dark:text-slate-300">
                                    <Icon className="h-4 w-4" />
                                </span>
                                <p className="mt-3 text-[13px] font-semibold text-stone-900 dark:text-white">
                                    {action.title}
                                </p>
                                <p className="mt-0.5 text-[11px] text-stone-500">{action.body}</p>
                                {action.badge && (
                                    <span className="mt-2 inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500 dark:bg-white/10">
                                        {action.badge}
                                    </span>
                                )}
                            </>
                        );

                        const className =
                            'group relative rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-stone-900/[0.04] transition hover:-translate-y-0.5 hover:shadow-md hover:ring-stone-900/[0.08] dark:bg-white/[0.035] dark:ring-white/[0.06] dark:hover:ring-white/12';

                        if (action.href && action.external) {
                            return (
                                <motion.a
                                    key={action.title}
                                    href={action.href}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.04 * i }}
                                    className={className}
                                >
                                    {inner}
                                </motion.a>
                            );
                        }
                        if (action.href) {
                            return (
                                <motion.div
                                    key={action.title}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.04 * i }}
                                >
                                    <Link href={action.href} className={`block ${className}`}>
                                        {inner}
                                    </Link>
                                </motion.div>
                            );
                        }

                        return (
                            <motion.button
                                key={action.title}
                                type="button"
                                onClick={action.onClick}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.04 * i }}
                                className={`w-full text-left ${className}`}
                            >
                                {inner}
                            </motion.button>
                        );
                    })}
                </section>

                {/* ═══ SEARCH + HELP LIBRARY ═══ */}
                <section className="space-y-4">
                    <div className="relative">
                        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                            id="help-search"
                            type="search"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                if (e.target.value.trim()) {
                                    setOpenCategory(null);
                                }
                            }}
                            placeholder="Search guides, commissions, settlements…"
                            aria-label="Search help library"
                            className="w-full rounded-2xl bg-white py-3.5 pr-4 pl-11 text-[14px] text-stone-900 shadow-sm outline-none ring-1 ring-stone-900/[0.06] transition placeholder:text-stone-400 focus:ring-2 focus:ring-primary-200 dark:bg-white/[0.04] dark:text-white dark:ring-white/10 dark:focus:ring-primary-800"
                        />
                    </div>

                    {query.trim() ? (
                        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.035] dark:ring-white/[0.06]">
                            {filteredFaq.length === 0 ? (
                                <p className="px-5 py-8 text-center text-[13px] text-stone-500">
                                    No guides match “{query.trim()}”
                                </p>
                            ) : (
                                <ul>
                                    {filteredFaq.map((item) => {
                                        const open = openArticle === item.question;

                                        return (
                                            <li
                                                key={item.question}
                                                className="border-b border-stone-100 last:border-0 dark:border-white/[0.05]"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenArticle(open ? null : item.question)}
                                                    className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
                                                >
                                                    <span>
                                                        <span className="text-[10px] font-semibold tracking-wide text-stone-400 uppercase">
                                                            {item.category}
                                                        </span>
                                                        <span className="mt-0.5 block text-[13px] font-semibold text-stone-900 dark:text-white">
                                                            {item.question}
                                                        </span>
                                                    </span>
                                                    <ChevronDownIcon
                                                        className={`mt-1 h-4 w-4 shrink-0 text-stone-400 transition ${open ? 'rotate-180' : ''}`}
                                                    />
                                                </button>
                                                <AnimatePresence>
                                                    {open && (
                                                        <motion.p
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden px-4 pb-4 text-[13px] leading-relaxed text-stone-600 sm:px-5 dark:text-slate-400"
                                                        >
                                                            {item.answer}
                                                        </motion.p>
                                                    )}
                                                </AnimatePresence>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {categories.map((cat, i) => {
                                const items = byCategory[cat] ?? [];
                                const open = openCategory === cat;

                                return (
                                    <motion.div
                                        key={cat}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.03 * i }}
                                        className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.035] dark:ring-white/[0.06]"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setOpenCategory(open ? null : cat)}
                                            className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left"
                                        >
                                            <span>
                                                <span className="block text-[13px] font-semibold text-stone-900 dark:text-white">
                                                    {cat}
                                                </span>
                                                <span className="text-[11px] text-stone-400">
                                                    {items.length} article{items.length === 1 ? '' : 's'}
                                                </span>
                                            </span>
                                            <ChevronDownIcon
                                                className={`h-4 w-4 text-stone-400 transition ${open ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        <AnimatePresence>
                                            {open && (
                                                <motion.ul
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden border-t border-stone-100 dark:border-white/[0.05]"
                                                >
                                                    {items.length === 0 ? (
                                                        <li className="px-4 py-3 text-[12px] text-stone-500">
                                                            No articles in this category yet.
                                                        </li>
                                                    ) : (
                                                        items.map((item) => (
                                                            <li key={item.question}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setOpenArticle(
                                                                            openArticle === item.question
                                                                                ? null
                                                                                : item.question,
                                                                        )
                                                                    }
                                                                    className="w-full px-4 py-2.5 text-left text-[12px] font-medium text-stone-700 transition hover:bg-stone-50 dark:text-slate-300 dark:hover:bg-white/[0.03]"
                                                                >
                                                                    {item.question}
                                                                    {openArticle === item.question && (
                                                                        <p className="mt-1.5 font-normal leading-relaxed text-stone-500">
                                                                            {item.answer}
                                                                        </p>
                                                                    )}
                                                                </button>
                                                            </li>
                                                        ))
                                                    )}
                                                </motion.ul>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ═══ POPULAR ARTICLES ═══ */}
                <section>
                    <h2 className="mb-3 text-[13px] font-semibold tracking-tight text-stone-500 dark:text-slate-400">
                        Popular articles
                    </h2>
                    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.035] dark:ring-white/[0.06]">
                        <ul>
                            {(popular.length ? popular : support.faq.slice(0, 5)).map((item, i) => (
                                <li key={item.question}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOpenArticle(item.question);
                                            setOpenCategory(item.category ?? null);
                                            document.getElementById('help-search')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }}
                                        className="group flex w-full items-center gap-3 border-b border-stone-100 px-4 py-3.5 text-left transition last:border-0 hover:bg-stone-50/80 sm:px-5 dark:border-white/[0.05] dark:hover:bg-white/[0.03]"
                                    >
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-[11px] font-bold text-stone-500 dark:bg-white/10">
                                            {i + 1}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[13px] font-semibold text-stone-900 dark:text-white">
                                                {item.question}
                                            </span>
                                            <span className="mt-0.5 block text-[11px] text-stone-400">
                                                {item.category}
                                                {item.read_minutes ? ` · ${item.read_minutes} min read` : ''}
                                                {' · Popular'}
                                            </span>
                                        </span>
                                        <ArrowRightIcon className="h-4 w-4 shrink-0 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-primary-600" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* ═══ RESOURCES + SUPPORT STATUS ═══ */}
                <section className="grid gap-4 lg:grid-cols-5">
                    <div className="lg:col-span-3">
                        <h2 className="mb-3 text-[13px] font-semibold tracking-tight text-stone-500 dark:text-slate-400">
                            Partner resources
                        </h2>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                            {support.resources.map((resource, i) => {
                                const Icon = resourceIcon(resource.type);

                                return (
                                    <motion.div
                                        key={resource.title}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.04 * i }}
                                    >
                                        <Link
                                            href={resource.href}
                                            className="group flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-900/[0.04] transition hover:-translate-y-0.5 hover:shadow-md dark:bg-white/[0.035] dark:ring-white/[0.06]"
                                        >
                                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
                                                <Icon className="h-5 w-5" />
                                            </span>
                                            <p className="mt-3 text-[13px] font-semibold text-stone-900 dark:text-white">
                                                {resource.title}
                                            </p>
                                            <p className="mt-0.5 flex-1 text-[11px] leading-snug text-stone-500">
                                                {resource.description}
                                            </p>
                                            <p className="mt-3 text-[10px] font-medium tracking-wide text-stone-400 uppercase">
                                                {resource.type}
                                                {resource.size ? ` · ${resource.size}` : ''}
                                                {resource.updated ? ` · ${resource.updated}` : ''}
                                            </p>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <h2 className="mb-3 text-[13px] font-semibold tracking-tight text-stone-500 dark:text-slate-400">
                            Support status
                        </h2>
                        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.035] dark:ring-white/[0.06]">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                                <p className="text-[14px] font-semibold text-stone-900 dark:text-white">
                                    Support team {support.status ?? 'Online'}
                                </p>
                            </div>
                            <dl className="mt-4 space-y-3">
                                {[
                                    { label: 'Average reply', value: `~${support.avg_reply_hours ?? 8} hours` },
                                    { label: 'Current queue', value: support.queue_status ?? 'Low' },
                                    { label: 'Business hours', value: support.business_hours ?? 'Mon–Fri' },
                                    { label: 'SLA', value: support.response_sla },
                                ].map((row) => (
                                    <div key={row.label} className="flex justify-between gap-3 text-[12px]">
                                        <dt className="text-stone-400">{row.label}</dt>
                                        <dd className="font-semibold text-stone-800 dark:text-slate-200">{row.value}</dd>
                                    </div>
                                ))}
                            </dl>
                            <a
                                href={mailto}
                                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-2.5 text-[12px] font-semibold text-white dark:bg-white dark:text-stone-900"
                            >
                                <EnvelopeIcon className="h-3.5 w-3.5" />
                                Email {support.email}
                            </a>
                        </div>
                    </div>
                </section>

                {/* ═══ MY REQUESTS ═══ */}
                <section>
                    <h2 className="mb-3 text-[13px] font-semibold tracking-tight text-stone-500 dark:text-slate-400">
                        My support requests
                    </h2>
                    {support.tickets.length === 0 ? (
                        <div className="flex max-h-[220px] items-center gap-4 rounded-2xl bg-stone-50/80 px-5 py-5 ring-1 ring-stone-900/[0.03] dark:bg-white/[0.03] dark:ring-white/[0.05]">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-stone-400 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/10">
                                <TicketIcon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold text-stone-800 dark:text-white">No open requests</p>
                                <p className="mt-0.5 text-[12px] text-stone-500">
                                    Email us and we&apos;ll track your conversation here soon.
                                </p>
                            </div>
                            <a
                                href={mailto}
                                className="shrink-0 rounded-xl bg-stone-900 px-3.5 py-2 text-[12px] font-semibold text-white dark:bg-white dark:text-stone-900"
                            >
                                Contact support
                            </a>
                        </div>
                    ) : (
                        <ol className="relative ml-3 space-y-0 border-l border-stone-200 pl-5 dark:border-slate-700">
                            {support.tickets.map((ticket) => (
                                <li key={ticket.id} className="relative pb-5 last:pb-0">
                                    <span className="absolute top-1.5 -left-[1.4rem] h-2.5 w-2.5 rounded-full bg-primary-500 ring-4 ring-white dark:ring-slate-950" />
                                    <p className="text-[13px] font-semibold text-stone-900 dark:text-white">
                                        {ticket.subject}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-stone-500">
                                        {ticket.status} · {ticket.updated_at}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>

                {/* ═══ COMMUNITY ═══ */}
                <section className="relative overflow-hidden rounded-2xl bg-stone-900 px-5 py-6 text-white sm:px-7">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.25),transparent_55%)]" />
                    <div className="relative flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                                <UsersIcon className="h-5 w-5 text-indigo-200" />
                            </span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[15px] font-semibold">Partner community</p>
                                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/70">
                                        Coming soon
                                    </span>
                                </div>
                                <p className="mt-1 max-w-md text-[12px] text-white/55">
                                    Success stories, best practices, and ideas from partners like you.
                                </p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/50">
                            <SparklesIcon className="h-3.5 w-3.5" />
                            Stay tuned
                        </span>
                    </div>
                </section>
            </div>
        </PartnerLayout>
    );
}
