import {
    BellIcon,
    BuildingOfficeIcon,
    ClockIcon,
    Cog6ToothIcon,
    EnvelopeIcon,
    IdentificationIcon,
    KeyIcon,
    ShieldCheckIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import PageHeader from '@/Components/Partner/PageHeader';
import Surface from '@/Components/Partner/Surface';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { formatCommission, formatCommissionLength } from '@/Utils/money';

interface Props {
    tab: string;
    user: {
        id: number;
        name: string;
        email: string;
        created_at: string | null;
    };
    partner: {
        name: string;
        status: string;
        description: string | null;
        website: string | null;
        contact_person: string | null;
        commission_type: string | null;
        commission_rate: string | null;
        commission_length: number | null;
        created_at: string | null;
    } | null;
    activity: Array<{
        id: number;
        title: string;
        status: string;
        status_label: string;
        at: string | null;
        at_human: string | null;
    }>;
    preferences: {
        email_product: boolean;
        email_settlements: boolean;
        email_pipeline: boolean;
    };
}

const TABS = [
    { key: 'account', label: 'Account', icon: UserIcon },
    { key: 'business', label: 'Business', icon: BuildingOfficeIcon },
    { key: 'commission', label: 'Commission', icon: IdentificationIcon },
    { key: 'security', label: 'Security', icon: ShieldCheckIcon },
    { key: 'notifications', label: 'Notifications', icon: BellIcon },
    { key: 'activity', label: 'Activity', icon: ClockIcon },
    { key: 'preferences', label: 'Preferences', icon: Cog6ToothIcon },
] as const;

function StatusBadge({ status }: { status: string }) {
    const styles =
        status === 'active'
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300'
            : 'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-300';

    return (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset ${styles}`}>
            {status}
        </span>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <dt className="text-[10px] font-semibold tracking-wide text-stone-400 uppercase">{label}</dt>
            <dd className="mt-0.5 text-[13px] font-medium text-stone-900 dark:text-white">{children}</dd>
        </div>
    );
}

function PrefToggle({ label, description, checked }: { label: string; description: string; checked: boolean }) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-stone-200/80 px-3 py-2.5 dark:border-slate-700">
            <div>
                <p className="text-[13px] font-semibold text-stone-900 dark:text-white">{label}</p>
                <p className="text-[11px] text-stone-500">{description}</p>
            </div>
            <span
                className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition ${checked ? 'bg-primary-600' : 'bg-stone-300 dark:bg-slate-600'}`}
                role="switch"
                aria-checked={checked}
                aria-label={label}
            >
                <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${checked ? 'left-4' : 'left-0.5'}`}
                />
            </span>
        </div>
    );
}

export default function PartnerProfile({ tab, user, partner, activity, preferences }: Props) {
    const active = TABS.some((t) => t.key === tab) ? tab : 'account';
    const initials = user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    function setTab(key: string) {
        router.get('/partner/profile', { tab: key }, { preserveState: true, preserveScroll: true, replace: true });
    }

    return (
        <PartnerLayout>
            <Head title="Account" />

            <div className="space-y-4">
                <PageHeader title="Account center" description="Manage identity, business details, security, and preferences." />

                {/* Identity strip */}
                <Surface padding="sm">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-semibold text-stone-900 dark:text-white">{user.name}</p>
                            <p className="text-[12px] text-stone-500">{user.email}</p>
                        </div>
                        {partner && <StatusBadge status={partner.status} />}
                    </div>
                </Surface>

                <div className="flex flex-col gap-3 lg:flex-row">
                    {/* Tabs nav */}
                    <nav
                        className="flex gap-1 overflow-x-auto lg:w-44 lg:shrink-0 lg:flex-col lg:overflow-visible"
                        aria-label="Account sections"
                    >
                        {TABS.map((t) => {
                            const Icon = t.icon;
                            const isActive = active === t.key;

                            return (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setTab(t.key)}
                                    className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium transition ${
                                        isActive
                                            ? 'bg-stone-900 text-white shadow-sm dark:bg-white dark:text-stone-900'
                                            : 'text-stone-600 hover:bg-stone-200/60 dark:text-slate-400 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5 shrink-0" />
                                    {t.label}
                                </button>
                            );
                        })}
                    </nav>

                    <motion.div
                        key={active}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className="min-w-0 flex-1"
                    >
                        <Surface padding="md">
                            {active === 'account' && (
                                <div className="space-y-4">
                                    <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">Account</h2>
                                    <dl className="grid gap-3 sm:grid-cols-2">
                                        <Field label="Full name">{user.name}</Field>
                                        <Field label="Email">
                                            <span className="inline-flex items-center gap-1.5">
                                                <EnvelopeIcon className="h-3.5 w-3.5 text-stone-400" />
                                                {user.email}
                                            </span>
                                        </Field>
                                        <Field label="Member since">{user.created_at ?? '—'}</Field>
                                    </dl>
                                    <p className="text-[12px] text-stone-500">
                                        To update your name or email, contact support so we can verify the change.
                                    </p>
                                    <Link href="/partner/support" className="text-[12px] font-semibold text-primary-600 hover:underline">
                                        Contact support →
                                    </Link>
                                </div>
                            )}

                            {active === 'business' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">Business</h2>
                                        {partner && <StatusBadge status={partner.status} />}
                                    </div>
                                    {partner ? (
                                        <dl className="grid gap-3 sm:grid-cols-2">
                                            <Field label="Organization">{partner.name}</Field>
                                            <Field label="Contact person">{partner.contact_person || '—'}</Field>
                                            <Field label="Website">
                                                {partner.website ? (
                                                    <a href={partner.website} className="text-primary-600 hover:underline" target="_blank" rel="noreferrer">
                                                        {partner.website}
                                                    </a>
                                                ) : (
                                                    '—'
                                                )}
                                            </Field>
                                            <Field label="Partner since">{partner.created_at ?? '—'}</Field>
                                            {partner.description && (
                                                <div className="sm:col-span-2">
                                                    <Field label="Description">{partner.description}</Field>
                                                </div>
                                            )}
                                        </dl>
                                    ) : (
                                        <p className="text-[13px] text-stone-500">No partner organization linked.</p>
                                    )}
                                </div>
                            )}

                            {active === 'commission' && (
                                <div className="space-y-4">
                                    <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">Commission plan</h2>
                                    {partner ? (
                                        <>
                                            <div className="grid gap-2.5 sm:grid-cols-3">
                                                <div className="rounded-lg bg-stone-50 p-3 dark:bg-slate-800/50">
                                                    <p className="text-[10px] font-semibold text-stone-400 uppercase">Rate</p>
                                                    <p className="mt-1 text-xl font-bold text-stone-900 dark:text-white">
                                                        {formatCommission(partner.commission_rate, partner.commission_type)}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg bg-stone-50 p-3 dark:bg-slate-800/50">
                                                    <p className="text-[10px] font-semibold text-stone-400 uppercase">Duration</p>
                                                    <p className="mt-1 text-xl font-bold text-stone-900 dark:text-white">
                                                        {formatCommissionLength(partner.commission_length)}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg bg-stone-50 p-3 dark:bg-slate-800/50">
                                                    <p className="text-[10px] font-semibold text-stone-400 uppercase">Type</p>
                                                    <p className="mt-1 text-[13px] font-semibold capitalize text-stone-900 dark:text-white">
                                                        {partner.commission_type ?? '—'}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-[12px] text-stone-500">
                                                Plan history and amendments are managed by Kontrol. Reach out if you need a review.
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-[13px] text-stone-500">Commission plan unavailable.</p>
                                    )}
                                </div>
                            )}

                            {active === 'security' && (
                                <div className="space-y-4">
                                    <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">Security</h2>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between rounded-lg border border-stone-200/80 px-3 py-2.5 dark:border-slate-700">
                                            <div className="flex items-center gap-2.5">
                                                <KeyIcon className="h-4 w-4 text-stone-400" />
                                                <div>
                                                    <p className="text-[13px] font-semibold text-stone-900 dark:text-white">Password</p>
                                                    <p className="text-[11px] text-stone-500">Use a unique password for this account</p>
                                                </div>
                                            </div>
                                            <Link
                                                href="/forgot-password"
                                                className="text-[12px] font-semibold text-primary-600 hover:underline"
                                            >
                                                Reset
                                            </Link>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg border border-stone-200/80 px-3 py-2.5 dark:border-slate-700">
                                            <div className="flex items-center gap-2.5">
                                                <ShieldCheckIcon className="h-4 w-4 text-stone-400" />
                                                <div>
                                                    <p className="text-[13px] font-semibold text-stone-900 dark:text-white">
                                                        Two-factor authentication
                                                    </p>
                                                    <p className="text-[11px] text-stone-500">Coming soon — extra protection for your account</p>
                                                </div>
                                            </div>
                                            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500 dark:bg-slate-800">
                                                Soon
                                            </span>
                                        </div>
                                        <div className="rounded-lg border border-stone-200/80 px-3 py-2.5 dark:border-slate-700">
                                            <p className="text-[13px] font-semibold text-stone-900 dark:text-white">Active sessions</p>
                                            <p className="mt-0.5 text-[11px] text-stone-500">
                                                Session management will list devices signed into this portal. Contact support to revoke access.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {active === 'notifications' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">
                                            Notification preferences
                                        </h2>
                                        <Link href="/partner/notifications" className="text-[12px] font-semibold text-primary-600 hover:underline">
                                            Inbox →
                                        </Link>
                                    </div>
                                    <div className="space-y-2">
                                        <PrefToggle
                                            label="Product updates"
                                            description="New features and announcements from Kontrol"
                                            checked={preferences.email_product}
                                        />
                                        <PrefToggle
                                            label="Settlements"
                                            description="When commissions settle and statements are ready"
                                            checked={preferences.email_settlements}
                                        />
                                        <PrefToggle
                                            label="Pipeline"
                                            description="Estate approvals, info requests, and rejections"
                                            checked={preferences.email_pipeline}
                                        />
                                    </div>
                                    <p className="text-[11px] text-stone-400">
                                        Preference saves will ship with the notification settings backend. In-app alerts are already live.
                                    </p>
                                </div>
                            )}

                            {active === 'activity' && (
                                <div className="space-y-3">
                                    <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">Recent activity</h2>
                                    {activity.length === 0 ? (
                                        <p className="py-8 text-center text-[12px] text-stone-500">No estate activity yet.</p>
                                    ) : (
                                        <ul className="divide-y divide-stone-100 dark:divide-slate-800">
                                            {activity.map((item) => (
                                                <li key={item.id} className="flex items-start justify-between gap-3 py-2.5">
                                                    <div>
                                                        <p className="text-[13px] font-semibold text-stone-900 dark:text-white">
                                                            {item.title}
                                                        </p>
                                                        <p className="text-[11px] text-stone-500">{item.status_label}</p>
                                                    </div>
                                                    <span className="shrink-0 text-[11px] text-stone-400">{item.at_human}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            {active === 'preferences' && (
                                <div className="space-y-4">
                                    <h2 className="text-[14px] font-semibold text-stone-900 dark:text-white">Preferences</h2>
                                    <p className="text-[12px] text-stone-500">
                                        Theme is controlled from the top bar (sun/moon). Your choice is saved on this device.
                                    </p>
                                    <div className="rounded-lg border border-stone-200/80 px-3 py-2.5 dark:border-slate-700">
                                        <p className="text-[13px] font-semibold text-stone-900 dark:text-white">Banking & payouts</p>
                                        <p className="mt-0.5 text-[11px] text-stone-500">
                                            Payout bank details are managed securely by Kontrol. Request updates via support.
                                        </p>
                                        <Link href="/partner/support" className="mt-2 inline-flex text-[12px] font-semibold text-primary-600 hover:underline">
                                            Request bank update →
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </Surface>
                    </motion.div>
                </div>
            </div>
        </PartnerLayout>
    );
}
