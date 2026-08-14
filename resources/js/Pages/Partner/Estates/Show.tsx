import {
    ArrowLeftIcon,
    BanknotesIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    ChartBarIcon,
    ShieldCheckIcon,
    UserGroupIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { formatAmount, formatCommission } from '@/Utils/money';

interface EstateDetail {
    id: number;
    ulid: string;
    reference: string;
    name: string;
    email: string | null;
    address: string | null;
    location: string | null;
    chairman_name: string | null;
    chairman_email: string | null;
    chairman_phone: string | null;
    portfolio_status: string;
    status_label: string;
    commission_status: string | null;
    activation_date: string | null;
    commission_starts_at: string | null;
    commission_ends_at: string | null;
    created_at: string | null;
    counts: {
        residents: number;
        subscribed: number;
        security: number;
        admins: number;
        members: number;
    };
    commission: {
        earned_kobo: number;
        pending_kobo: number;
        monthly_revenue_kobo: number;
    };
    progress: number;
    recent_activity: string;
    earnings_href: string;
}

interface TimelineEvent {
    id: number | string;
    event_type: string;
    description: string;
    creator_name: string | null;
    created_at: string | null;
}

interface Props {
    estate: EstateDetail;
    recentResidents: { id: number; name: string; email: string; joined_at: string | null }[];
    monthlySeries: { month: string; revenue_kobo: number; commission_kobo: number }[];
    timeline: TimelineEvent[];
    commission?: { rate: string | null; type: string | null };
}

function formatDate(iso: string | null | undefined): string {
    if (!iso) {
        return '-';
    }

    return new Date(iso).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
}

const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'residents', label: 'Residents' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'commission', label: 'Commission' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'activity', label: 'Recent Activity' },
] as const;

export default function PartnerEstateShow({ estate, recentResidents, monthlySeries, timeline, commission }: Props) {
    const orderedTimeline = [...timeline].reverse();

    return (
        <PartnerLayout>
            <Head title={`${estate.name} – Partner Portal`} />

            <div className="space-y-6 pb-10">
                <div>
                    <Link
                        href="/partner/partner-requests"
                        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-stone-500 transition hover:text-stone-800 dark:hover:text-white"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Back to portfolio
                    </Link>
                </div>

                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[1.75rem] text-white shadow-[0_24px_64px_-28px_rgba(6,18,48,0.55)]"
                >
                    <div className="absolute inset-0 bg-[#061230]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(31,111,219,0.42),transparent_58%)]" />
                    <div className="relative px-5 py-8 sm:px-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold tracking-[0.16em] text-white/40 uppercase">Estate workspace</p>
                                <h1 className="mt-2 text-[1.85rem] font-semibold tracking-tight sm:text-[2.25rem]">{estate.name}</h1>
                                <p className="mt-2 text-[13px] text-white/50">
                                    {estate.location || estate.address || 'Location pending'}
                                    {' · '}
                                    <span className="font-medium text-white/70">{estate.reference}</span>
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 ring-1 ring-emerald-300/20">
                                        {estate.status_label}
                                    </span>
                                    {estate.commission_status ? (
                                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold capitalize text-white/70 ring-1 ring-white/10">
                                            Commission {estate.commission_status}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href={estate.earnings_href}
                                    className="rounded-2xl bg-white px-4 py-2.5 text-[13px] font-semibold text-stone-900"
                                >
                                    View Earnings
                                </Link>
                                {commission?.rate ? (
                                    <p className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-[13px] text-white/65">
                                        Rate {formatCommission(commission.rate, commission.type)}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-4">
                            {[
                                { label: 'Residents', value: String(estate.counts.residents) },
                                { label: 'Subscribed', value: String(estate.counts.subscribed) },
                                { label: 'Security', value: String(estate.counts.security) },
                                { label: 'Admins', value: String(estate.counts.admins) },
                            ].map((cell) => (
                                <div key={cell.label} className="bg-[#061230]/75 px-4 py-3.5">
                                    <p className="text-[10px] font-medium text-white/40 uppercase">{cell.label}</p>
                                    <p className="mt-1 text-xl font-semibold tabular-nums">{cell.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                <nav className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" aria-label="Estate sections">
                    {sections.map((section) => (
                        <a
                            key={section.id}
                            href={`#${section.id}`}
                            className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-semibold text-stone-600 ring-1 ring-stone-900/[0.05] transition hover:bg-stone-50 dark:bg-white/[0.04] dark:text-slate-300 dark:ring-white/10"
                        >
                            {section.label}
                        </a>
                    ))}
                </nav>

                <div className="grid gap-5 lg:grid-cols-3">
                    <section id="overview" className="space-y-5 lg:col-span-2">
                        <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.03] dark:ring-white/[0.06]">
                            <h2 className="text-[15px] font-semibold text-stone-900 dark:text-white">Overview</h2>
                            <p className="mt-2 text-[13px] leading-relaxed text-stone-500">{estate.recent_activity}</p>
                            <div className="mt-5">
                                <div className="mb-1.5 flex justify-between text-[11px] text-stone-400">
                                    <span>Adoption progress</span>
                                    <span className="font-semibold tabular-nums text-stone-600">{estate.progress}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-white/10">
                                    <motion.div
                                        className="h-full rounded-full bg-linear-to-r from-primary-500 to-sky-400"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${estate.progress}%` }}
                                        transition={{ duration: 0.8 }}
                                    />
                                </div>
                            </div>
                            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                                <div>
                                    <dt className="text-[10px] font-medium tracking-wide text-stone-400 uppercase">Address</dt>
                                    <dd className="mt-1 text-[13px] text-stone-800 dark:text-slate-200">{estate.address || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-medium tracking-wide text-stone-400 uppercase">Activated</dt>
                                    <dd className="mt-1 text-[13px] text-stone-800 dark:text-slate-200">
                                        {formatDate(estate.activation_date || estate.created_at)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-medium tracking-wide text-stone-400 uppercase">Commission window</dt>
                                    <dd className="mt-1 text-[13px] text-stone-800 dark:text-slate-200">
                                        {estate.commission_starts_at
                                            ? `${formatDate(estate.commission_starts_at)}${
                                                  estate.commission_ends_at ? ` – ${formatDate(estate.commission_ends_at)}` : ''
                                              }`
                                            : '-'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-medium tracking-wide text-stone-400 uppercase">Reference</dt>
                                    <dd className="mt-1 text-[13px] font-medium tracking-wide text-stone-800 dark:text-slate-200">
                                        {estate.reference}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div id="revenue" className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.03]">
                            <h2 className="text-[15px] font-semibold text-stone-900 dark:text-white">Revenue</h2>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl bg-stone-50 p-4 dark:bg-white/[0.04]">
                                    <p className="text-[10px] font-medium text-stone-400 uppercase">This month</p>
                                    <p className="mt-1 text-2xl font-semibold tabular-nums text-stone-900 dark:text-white">
                                        {formatAmount(estate.commission.monthly_revenue_kobo)}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-stone-50 p-4 dark:bg-white/[0.04]">
                                    <p className="text-[10px] font-medium text-stone-400 uppercase">Your commission (lifetime)</p>
                                    <p className="mt-1 text-2xl font-semibold tabular-nums text-stone-900 dark:text-white">
                                        {formatAmount(estate.commission.earned_kobo)}
                                    </p>
                                </div>
                            </div>
                            {monthlySeries.length > 0 ? (
                                <ul className="mt-5 space-y-2">
                                    {monthlySeries.map((row) => (
                                        <li
                                            key={row.month}
                                            className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] ring-1 ring-stone-900/[0.04] dark:ring-white/10"
                                        >
                                            <span className="text-stone-500">{row.month}</span>
                                            <span className="font-semibold tabular-nums text-stone-900 dark:text-white">
                                                {formatAmount(row.revenue_kobo)}
                                                <span className="ml-2 font-medium text-stone-400">
                                                    · {formatAmount(row.commission_kobo)}
                                                </span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-4 text-[13px] text-stone-500">No commissionable revenue recorded yet for this estate.</p>
                            )}
                        </div>

                        <div id="residents" className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.03]">
                            <h2 className="text-[15px] font-semibold text-stone-900 dark:text-white">Residents</h2>
                            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {[
                                    { label: 'Total', value: estate.counts.residents, icon: UsersIcon },
                                    { label: 'Subscribed', value: estate.counts.subscribed, icon: UserGroupIcon },
                                    { label: 'Security', value: estate.counts.security, icon: ShieldCheckIcon },
                                    { label: 'Admins', value: estate.counts.admins, icon: BuildingOffice2Icon },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-2xl bg-stone-50 p-3.5 dark:bg-white/[0.04]">
                                        <item.icon className="h-4 w-4 text-stone-400" />
                                        <p className="mt-2 text-[10px] text-stone-400 uppercase">{item.label}</p>
                                        <p className="text-xl font-semibold tabular-nums text-stone-900 dark:text-white">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                            {recentResidents.length > 0 ? (
                                <ul className="mt-5 divide-y divide-stone-100 dark:divide-white/10">
                                    {recentResidents.map((resident) => (
                                        <li key={resident.id} className="flex items-center justify-between py-3">
                                            <div>
                                                <p className="text-[13px] font-semibold text-stone-900 dark:text-white">{resident.name}</p>
                                                <p className="text-[12px] text-stone-400">{resident.email}</p>
                                            </div>
                                            <p className="text-[11px] text-stone-400">{formatDate(resident.joined_at)}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-4 text-[13px] text-stone-500">No recent resident joins to show.</p>
                            )}
                        </div>
                    </section>

                    <aside className="space-y-5">
                        <div id="commission" className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.03]">
                            <div className="flex items-center gap-2">
                                <BanknotesIcon className="h-4 w-4 text-primary-500" />
                                <h2 className="text-[15px] font-semibold text-stone-900 dark:text-white">Commission</h2>
                            </div>
                            <p className="mt-4 text-[11px] text-stone-400 uppercase">Earned</p>
                            <p className="text-2xl font-semibold tabular-nums text-stone-900 dark:text-white">
                                {formatAmount(estate.commission.earned_kobo)}
                            </p>
                            <p className="mt-3 text-[11px] text-stone-400 uppercase">Pending settlement</p>
                            <p className="text-lg font-semibold tabular-nums text-sky-700 dark:text-sky-300">
                                {formatAmount(estate.commission.pending_kobo)}
                            </p>
                            <Link href={estate.earnings_href} className="mt-4 inline-flex text-[12px] font-semibold text-primary-600">
                                Open earnings →
                            </Link>
                        </div>

                        <div id="contacts" className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.03]">
                            <h2 className="text-[15px] font-semibold text-stone-900 dark:text-white">Contacts</h2>
                            <dl className="mt-4 space-y-3 text-[13px]">
                                <div>
                                    <dt className="text-[10px] text-stone-400 uppercase">Chairman / contact</dt>
                                    <dd className="mt-0.5 font-medium text-stone-800 dark:text-slate-200">
                                        {estate.chairman_name || '-'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] text-stone-400 uppercase">Email</dt>
                                    <dd className="mt-0.5 text-stone-700 dark:text-slate-300">{estate.chairman_email || estate.email || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] text-stone-400 uppercase">Phone</dt>
                                    <dd className="mt-0.5 text-stone-700 dark:text-slate-300">{estate.chairman_phone || '-'}</dd>
                                </div>
                            </dl>
                        </div>

                        <div id="timeline" className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-stone-900/[0.04] dark:bg-white/[0.03]">
                            <div className="flex items-center gap-2">
                                <CalendarDaysIcon className="h-4 w-4 text-stone-400" />
                                <h2 className="text-[15px] font-semibold text-stone-900 dark:text-white">Timeline</h2>
                            </div>
                            <ol className="mt-5 space-y-0">
                                {orderedTimeline.map((event, index) => {
                                    const isLast = index === orderedTimeline.length - 1;

                                    return (
                                        <li key={String(event.id)} className="flex gap-3">
                                            <div className="flex w-4 shrink-0 flex-col items-center">
                                                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary-500 ring-4 ring-primary-500/15" />
                                                {!isLast ? (
                                                    <span className="mt-1 w-px flex-1 min-h-[1.25rem] bg-stone-200 dark:bg-white/15" />
                                                ) : null}
                                            </div>
                                            <div className={`min-w-0 ${isLast ? 'pb-0' : 'pb-5'}`}>
                                                <p className="text-[13px] font-semibold leading-snug text-stone-900 dark:text-white">
                                                    {event.description}
                                                </p>
                                                <p className="mt-1 text-[11px] text-stone-400">
                                                    {formatDate(event.created_at)}
                                                    {event.creator_name ? ` · ${event.creator_name}` : ''}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>

                        <div id="activity" className="rounded-[1.5rem] bg-linear-to-br from-sky-50 to-white p-5 ring-1 ring-sky-100 dark:from-sky-500/10 dark:to-transparent dark:ring-sky-500/20">
                            <div className="flex items-center gap-2">
                                <ChartBarIcon className="h-4 w-4 text-sky-600" />
                                <h2 className="text-[15px] font-semibold text-stone-900 dark:text-white">Recent activity</h2>
                            </div>
                            <p className="mt-3 text-[13px] leading-relaxed text-stone-600 dark:text-slate-300">{estate.recent_activity}</p>
                        </div>
                    </aside>
                </div>
            </div>
        </PartnerLayout>
    );
}
