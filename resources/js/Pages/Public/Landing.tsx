import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import LoginController from '@/Actions/App/Http/Controllers/Auth/LoginController';
import PricingCard from '@/Components/PricingCard';
import ApplicationModal from '@/Components/Public/ApplicationModal';
import PublicLayout from '@/Layouts/PublicLayout';

interface Feature {
    id: number;
    name: string;
}

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    formatted_price: string;
    billing_interval: 'quarterly' | 'semi-annually' | 'annually';
    is_featured: boolean;
    badge: string | null;
    color: string;
    max_residents: number | null;
    max_security: number | null;
    max_admins: number | null;
    features: Feature[];
}

interface Props {
    plans: Plan[];
}

// ───────────────────────────────────────────────────────────────────────────────
// Icons
// ───────────────────────────────────────────────────────────────────────────────

function ShieldIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
        </svg>
    );
}

function QrCodeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"
            />
        </svg>
    );
}

function BoltIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
    );
}

function BellIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
        </svg>
    );
}

function UsersIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
        </svg>
    );
}

function ClipboardIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
            />
        </svg>
    );
}

function DevicePhoneMobileIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
            />
        </svg>
    );
}

function LockClosedIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
        </svg>
    );
}

function ChatBubbleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
        </svg>
    );
}

function CheckCircleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function XCircleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    );
}

function ArrowRightIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
    );
}

function SparklesIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
            />
        </svg>
    );
}

function ChartIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
        </svg>
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// Animation variants
// ───────────────────────────────────────────────────────────────────────────────

const fadeInUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] },
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.08,
        },
    },
};

// ───────────────────────────────────────────────────────────────────────────────
// Static content
// ───────────────────────────────────────────────────────────────────────────────

const coreBenefits = [
    {
        icon: QrCodeIcon,
        title: 'Generate in seconds',
        description: 'Residents create secure, single-use access codes for any visitor from their phone. No phone calls, no paper, no delays.',
    },
    {
        icon: BoltIcon,
        title: 'Validate at the gate',
        description: 'Security enters the code, sees who it belongs to, and lets the visitor in. Every check is instant and logged automatically.',
    },
    {
        icon: ChartIcon,
        title: 'Track everything',
        description: 'A complete, tamper-proof audit trail of every visitor: who, when, whom they visited, and when they left. Permanent peace of mind.',
    },
];

const bentoFeatures = [
    {
        icon: BellIcon,
        title: 'Real-time notifications',
        description: 'Know the moment your visitor reaches the gate.',
    },
    {
        icon: ChatBubbleIcon,
        title: 'Telegram built-in',
        description: 'Generate and share codes right inside Telegram.',
    },
    {
        icon: UsersIcon,
        title: 'Role-based access',
        description: 'Separate, scoped apps for residents, security, and admins.',
    },
    {
        icon: ClipboardIcon,
        title: 'Community announcements',
        description: 'Broadcast updates to every resident in seconds.',
    },
    {
        icon: DevicePhoneMobileIcon,
        title: 'Mobile apps available on Android and iOS',
        description: 'Native apps for every resident, security officer, and admin.',
    },
    {
        icon: LockClosedIcon,
        title: 'Privacy-first',
        description: 'Minimal data collection, encrypted end-to-end.',
    },
];

const comparisonRows = [
    { feature: 'Visitor approval time', old: '2–5 minutes on a phone call', kontrol: 'Instant. Visitor shows a code' },
    { feature: 'Visitor log', old: 'Paper notebook at the gate', kontrol: 'Permanent, searchable, encrypted' },
    { feature: 'After-hours visitors', old: 'Wake up to take the call', kontrol: 'Pre-generate a code in advance' },
    { feature: 'Resident experience', old: 'Interruptions and frustration', kontrol: 'One tap. One code. Done.' },
    { feature: 'Accountability', old: 'Unclear who let whom in', kontrol: 'Every entry traced to a resident' },
    { feature: 'Setup & training', old: 'Weeks of meetings', kontrol: 'Live in days, with onboarding' },
];

const estatePlaceholders = ['Parkview Estate', 'Northridge Gardens', 'The Residency', 'Ocean Springs', 'Sapphire Court', 'Highland Park'];

// ───────────────────────────────────────────────────────────────────────────────
// Product mockup components, illustrative UI used throughout the page
// ───────────────────────────────────────────────────────────────────────────────

function HeroAccessCodeMock() {
    return (
        <div className="relative w-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white">
                        <QrCodeIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500">Access code</p>
                        <p className="text-sm font-semibold text-slate-900">For Chidi, driver</p>
                    </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                </span>
            </div>

            <div className="mt-5 rounded-2xl bg-linear-to-br from-slate-900 to-slate-800 p-5 text-center">
                <p className="text-[11px] font-medium tracking-[0.2em] text-slate-400 uppercase">Show at gate</p>
                <p className="mt-1.5 font-mono text-3xl font-bold tracking-[0.35em] text-white sm:text-4xl">4B2-9XQ</p>
                <p className="mt-2 text-xs text-slate-400">Expires in 2h 14m · Single use</p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 py-2.5">
                    <p className="text-[10px] font-medium text-slate-500 uppercase">Visitor</p>
                    <p className="text-xs font-semibold text-slate-900">Musa</p>
                </div>
                <div className="rounded-xl bg-slate-50 py-2.5">
                    <p className="text-[10px] font-medium text-slate-500 uppercase">Arrives</p>
                    <p className="text-xs font-semibold text-slate-900">Today</p>
                </div>
                <div className="rounded-xl bg-slate-50 py-2.5">
                    <p className="text-[10px] font-medium text-slate-500 uppercase">Vehicle</p>
                    <p className="text-xs font-semibold text-slate-900">LAG-284</p>
                </div>
            </div>
        </div>
    );
}

function HeroNotificationMock() {
    return (
        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <BellIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900">Musa arrived at the gate</p>
                <p className="truncate text-xs text-slate-500">Code 4B2-9XQ validated · 12s ago</p>
            </div>
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
        </div>
    );
}

function HeroActivityMock() {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-900">Today at the gate</p>
                <span className="text-[10px] font-medium text-emerald-600">Live</span>
            </div>
            <div className="mt-3 flex items-end gap-1.5">
                {[38, 62, 45, 74, 90, 52, 68].map((h, i) => (
                    <div
                        key={i}
                        className="flex-1 rounded-sm bg-linear-to-t from-blue-400 to-indigo-500"
                        style={{ height: `${h * 0.6}px` }}
                    />
                ))}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">47</span>
                <span className="text-xs font-medium text-slate-500">visitors verified</span>
            </div>
        </div>
    );
}

function ResidentShowcaseMock() {
    return (
        <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-[36px] border-[10px] border-slate-900 bg-slate-900 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.45)]">
                <div className="rounded-[26px] bg-linear-to-b from-slate-50 to-white p-5">
                    <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-slate-200" />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-slate-500">New visitor</p>
                            <p className="text-lg font-semibold text-slate-900">Create code</p>
                        </div>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                            <QrCodeIcon className="h-4 w-4 text-slate-700" />
                        </div>
                    </div>

                    <div className="mt-5 space-y-3">
                        <div>
                            <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Visitor name</p>
                            <div className="mt-1 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900">
                                Musa Ibrahim
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Purpose</p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                                {['Driver', 'Delivery', 'Friend', 'Service'].map((tag, i) => (
                                    <span
                                        key={tag}
                                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                            i === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                                        }`}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Valid for</p>
                            <div className="mt-1 grid grid-cols-3 gap-1.5">
                                {['1 hour', '4 hours', '1 day'].map((tag, i) => (
                                    <span
                                        key={tag}
                                        className={`rounded-xl px-2 py-2 text-center text-xs font-semibold ${
                                            i === 1
                                                ? 'border border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border border-slate-200 bg-white text-slate-600'
                                        }`}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button className="mt-5 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20">
                        Generate code
                    </button>
                </div>
            </div>

            <div className="absolute -top-4 -right-6 hidden rotate-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl sm:block">
                <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Shared via</p>
                <p className="text-sm font-semibold text-slate-900">Telegram · SMS</p>
            </div>
        </div>
    );
}

function SecurityShowcaseMock() {
    return (
        <div className="relative mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.25)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                            <ShieldIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500">Gate validation</p>
                            <p className="text-sm font-semibold text-slate-900">Main entrance</p>
                        </div>
                    </div>
                    <span className="text-xs font-medium text-slate-500">09:42</span>
                </div>

                <div className="mt-6">
                    <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Enter visitor code</p>
                    <div className="mt-2 grid grid-cols-6 gap-1.5">
                        {['4', 'B', '2', '9', 'X', 'Q'].map((char) => (
                            <div
                                key={char}
                                className="flex aspect-square items-center justify-center rounded-xl border border-slate-200 bg-slate-50 font-mono text-xl font-bold text-slate-900"
                            >
                                {char}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                    <div className="flex items-center gap-2.5">
                        <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                        <p className="text-sm font-semibold text-emerald-900">Valid. Let them in</p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div>
                            <p className="text-emerald-700/70">Visitor</p>
                            <p className="font-semibold text-slate-900">Musa Ibrahim</p>
                        </div>
                        <div>
                            <p className="text-emerald-700/70">Host</p>
                            <p className="font-semibold text-slate-900">Chidi O. · Block 4</p>
                        </div>
                        <div>
                            <p className="text-emerald-700/70">Vehicle</p>
                            <p className="font-semibold text-slate-900">LAG-284-AK</p>
                        </div>
                        <div>
                            <p className="text-emerald-700/70">Expires</p>
                            <p className="font-semibold text-slate-900">In 2h 14m</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex gap-2.5">
                    <button className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white">Admit</button>
                    <button className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700">
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
}

function AdminShowcaseMock() {
    return (
        <div className="relative mx-auto w-full max-w-xl">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_80px_-20px_rgba(15,23,42,0.25)]">
                <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                    <span className="ml-3 text-xs font-medium text-slate-500">Parkview Estate · Dashboard</span>
                </div>

                <div className="p-5">
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Today', value: '47', sub: '+12 vs avg', tone: 'text-emerald-600' },
                            { label: 'Active codes', value: '23', sub: '8 expiring soon', tone: 'text-amber-600' },
                            { label: 'Residents', value: '184', sub: '96% onboarded', tone: 'text-slate-500' },
                        ].map((stat) => (
                            <div key={stat.label} className="rounded-xl border border-slate-100 bg-slate-50/40 p-3.5">
                                <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">{stat.label}</p>
                                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                                <p className={`text-[11px] font-medium ${stat.tone}`}>{stat.sub}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <p className="text-xs font-semibold text-slate-900">Recent entries</p>
                            <span className="text-[10px] font-medium text-slate-500">Live</span>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {[
                                { name: 'Musa Ibrahim', host: 'Chidi O.', time: '09:42', badge: 'Driver', tone: 'bg-blue-50 text-blue-700' },
                                { name: 'Glovo rider', host: 'Ada K.', time: '09:18', badge: 'Delivery', tone: 'bg-amber-50 text-amber-700' },
                                { name: 'Tayo A.', host: 'Bola S.', time: '08:55', badge: 'Friend', tone: 'bg-emerald-50 text-emerald-700' },
                            ].map((row) => (
                                <div key={row.time} className="flex items-center gap-3 px-4 py-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                        {row.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold text-slate-900">{row.name}</p>
                                        <p className="truncate text-[11px] text-slate-500">Visiting {row.host}</p>
                                    </div>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${row.tone}`}>{row.badge}</span>
                                    <span className="text-[11px] font-medium text-slate-500">{row.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// Page
// ───────────────────────────────────────────────────────────────────────────────

export default function Landing({ plans }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [billingPeriod, setBillingPeriod] = useState<'quarterly' | 'semi-annually' | 'annually'>('annually');
    const [selectedPlanId, setSelectedPlanId] = useState<number | undefined>();
    const [selectedPlanName, setSelectedPlanName] = useState<string | undefined>();
    const [selectedPlanInterval, setSelectedPlanInterval] = useState<'quarterly' | 'semi-annually' | 'annually' | undefined>();

    const allFeatures = useMemo(() => {
        const map = new Map<number, Feature>();
        plans.forEach((plan) => {
            plan.features.forEach((f) => {
                if (!map.has(f.id)) map.set(f.id, f);
            });
        });
        return Array.from(map.values());
    }, [plans]);

    const savingsMap = useMemo(() => {
        const basePrices = new Map<string, number>();
        plans.filter((p) => p.billing_interval === 'quarterly').forEach((p) => basePrices.set(p.name, p.price));

        const savings = new Map<number, number>();
        plans.forEach((p) => {
            const base = basePrices.get(p.name);
            if (base && p.billing_interval !== 'quarterly') {
                const multiplier = p.billing_interval === 'semi-annually' ? 2 : 4;
                const expectedPrice = base * multiplier;
                const actualPrice = p.price;
                const percentage = Math.round(((expectedPrice - actualPrice) / expectedPrice) * 100);
                if (percentage > 0) {
                    savings.set(p.id, percentage);
                }
            }
        });
        return savings;
    }, [plans]);

    useEffect(() => {
        setModalOpen(false);
        setSelectedPlanId(undefined);
        setSelectedPlanName(undefined);
        setSelectedPlanInterval(undefined);
        if (window.location.hash === '#apply') {
            history.replaceState('', document.title, window.location.pathname + window.location.search);
        }

        function handleHashChange() {
            setModalOpen(window.location.hash === '#apply');
        }

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    function smoothScrollTo(selector: string) {
        const element = document.querySelector(selector);
        if (!element) return;

        const target = element.getBoundingClientRect().top + window.scrollY;
        const start = window.scrollY;
        const distance = target - start - 80;
        const duration = 1000;
        let startTime: number | null = null;

        function easeInOutCubic(t: number): number {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        function scroll(currentTime: number) {
            if (startTime === null) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = easeInOutCubic(progress);

            window.scrollTo(0, start + distance * ease);

            if (progress < 1) {
                requestAnimationFrame(scroll);
            }
        }

        requestAnimationFrame(scroll);
    }

    function openModal() {
        smoothScrollTo('#pricing');
    }

    function openModalWithPlan(planId: number, planName: string, billingInterval: 'quarterly' | 'semi-annually' | 'annually') {
        setSelectedPlanId(planId);
        setSelectedPlanName(planName);
        setSelectedPlanInterval(billingInterval);
        window.location.hash = 'apply';
        setModalOpen(true);
    }

    function closeModal() {
        history.pushState('', document.title, window.location.pathname + window.location.search);
        setModalOpen(false);
        setTimeout(() => {
            setSelectedPlanId(undefined);
            setSelectedPlanName(undefined);
        }, 300);
    }

    return (
        <PublicLayout onApplyClick={openModal}>
            <Head title="Kontrol · Modern Gated Community Access Control">
                <meta
                    name="description"
                    content="Kontrol is the modern gated community access management platform. Generate digital access codes for visitors, validate instantly at the gate, and track every entry with complete audit trails."
                />
                <meta
                    name="keywords"
                    content="gated community access control, visitor management, gate access, digital access codes, residential security, gated community, access management, Nigeria, Africa"
                />
                <meta name="author" content="Kontrol" />
                <meta name="robots" content="index, follow" />

                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://usekontrol.com/" />
                <meta property="og:title" content="Kontrol · Modern Gated Community Access Control" />
                <meta
                    property="og:description"
                    content="Replace outdated phone calls and paper logs with instant digital access codes. Security validates visitors in seconds, not minutes."
                />
                <meta property="og:image" content="https://usekontrol.com/assets/images/og-image.png" />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:image:alt" content="Kontrol · Gated Community Access Reimagined" />
                <meta property="og:site_name" content="Kontrol" />
                <meta property="og:locale" content="en_US" />

                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content="https://usekontrol.com/" />
                <meta name="twitter:title" content="Kontrol · Modern Gated Community Access Control" />
                <meta
                    name="twitter:description"
                    content="Replace outdated phone calls and paper logs with instant digital access codes. Security validates visitors in seconds, not minutes."
                />
                <meta name="twitter:image" content="https://usekontrol.com/assets/images/og-image.png" />
                <meta name="twitter:image:alt" content="Kontrol · Gated Community Access Reimagined" />

                <meta name="application-name" content="Kontrol" />
                <meta name="apple-mobile-web-app-title" content="Kontrol" />
                <meta name="theme-color" content="#0f172a" />
                <meta name="msapplication-TileColor" content="#0f172a" />

                <link rel="canonical" href="https://usekontrol.com/" />
            </Head>

            {/* ─── Hero ──────────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-linear-to-b from-slate-100 via-blue-50/50 to-white">
                <div className="absolute inset-0">
                    <div className="absolute -top-24 right-0 h-[720px] w-[720px] translate-x-1/4 rounded-full bg-linear-to-br from-blue-300/50 via-indigo-300/35 to-transparent blur-[120px]" />
                    <div className="absolute top-1/4 -left-24 h-[520px] w-[520px] rounded-full bg-linear-to-tr from-indigo-300/40 via-purple-200/25 to-transparent blur-[100px]" />
                    <div className="absolute -bottom-24 left-1/3 h-[420px] w-[420px] rounded-full bg-linear-to-t from-sky-200/50 via-blue-200/30 to-transparent blur-[90px]" />
                    <div
                        className="absolute inset-0 opacity-[0.5]"
                        style={{
                            backgroundImage:
                                'linear-gradient(to right, rgb(148 163 184 / 0.18) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / 0.18) 1px, transparent 1px)',
                            backgroundSize: '56px 56px',
                            maskImage: 'radial-gradient(ellipse at center top, black 30%, transparent 75%)',
                        }}
                    />
                </div>

                <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-20 lg:px-8 lg:pt-24 lg:pb-32">
                    <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
                            className="lg:col-span-6"
                        >
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 backdrop-blur-sm">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span>Now onboarding gated communities across Nigeria</span>
                            </div>

                            <h1 className="mt-6 text-[2.5rem] leading-[1.05] font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl xl:text-[4rem]">
                                Modern access control
                                <br />
                                <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                                    for gated communities.
                                </span>
                            </h1>

                            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                                Kontrol is an access management platform for gated communities. Residents generate time-limited codes for their
                                visitors, security validates those codes at the gate, and administrators see every entry as it happens. Codes expire on
                                their own. Every visit is recorded. Nothing gets written in a notebook at the gate.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                                <button
                                    onClick={openModal}
                                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(15,23,42,0.5)] transition-all duration-300 hover:bg-slate-800 hover:shadow-[0_20px_40px_-10px_rgba(15,23,42,0.6)]"
                                >
                                    Apply for Access
                                    <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                                </button>
                                <button
                                    onClick={() => smoothScrollTo('#product')}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50"
                                >
                                    See it in action
                                </button>
                            </div>

                            <div className="mt-10 flex items-center gap-5">
                                <div className="flex -space-x-2">
                                    {[
                                        'from-blue-400 to-indigo-500',
                                        'from-emerald-400 to-teal-500',
                                        'from-amber-400 to-orange-500',
                                        'from-rose-400 to-pink-500',
                                    ].map((gradient, i) => (
                                        <div
                                            key={i}
                                            className={`h-8 w-8 rounded-full bg-linear-to-br ${gradient} ring-2 ring-white`}
                                        />
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center gap-1">
                                        {[0, 1, 2, 3, 4].map((i) => (
                                            <svg key={i} className="h-3.5 w-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.161c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 00-.363 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.175 0l-3.366 2.446c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.363-1.118L2.072 9.384c-.783-.57-.38-1.81.588-1.81h4.161a1 1 0 00.95-.69l1.286-3.957z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-600">
                                        <span className="font-semibold text-slate-900">Trusted by residents</span> across Nigeria
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, delay: 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
                            className="relative lg:col-span-6"
                        >
                            <div className="relative mx-auto max-w-md lg:max-w-none">
                                <div className="absolute -inset-6 rounded-[32px] bg-linear-to-br from-blue-500/10 via-indigo-500/10 to-transparent blur-2xl" />

                                <div className="relative">
                                    <HeroAccessCodeMock />

                                    <motion.div
                                        initial={{ opacity: 0, x: 20, y: -10 }}
                                        animate={{ opacity: 1, x: 0, y: 0 }}
                                        transition={{ duration: 0.7, delay: 0.6 }}
                                        className="absolute -top-5 -right-4 w-64 sm:-right-8"
                                    >
                                        <HeroNotificationMock />
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, x: -20, y: 10 }}
                                        animate={{ opacity: 1, x: 0, y: 0 }}
                                        transition={{ duration: 0.7, delay: 0.75 }}
                                        className="absolute -bottom-8 -left-4 hidden w-52 sm:block"
                                    >
                                        <HeroActivityMock />
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ─── Trust / Social Proof ──────────────────────────────────────── */}
            <section className="border-y border-slate-100 bg-slate-50/60">
                <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase"
                    >
                        Trusted by forward-thinking communities
                    </motion.p>
                    <div className="mt-6 grid grid-cols-2 items-center gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
                        {estatePlaceholders.map((name) => (
                            <div key={name} className="flex items-center justify-center">
                                <span className="font-serif text-base font-semibold tracking-tight text-slate-400 sm:text-lg">{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Core Value Propositions ──────────────────────────────────── */}
            <section className="relative bg-white py-20 lg:py-28">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-80px' }}
                        variants={staggerContainer}
                        className="mx-auto max-w-2xl text-center"
                    >
                        <motion.div
                            variants={fadeInUp}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold tracking-wide text-slate-600 uppercase"
                        >
                            Why Kontrol
                        </motion.div>
                        <motion.h2 variants={fadeInUp} className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                            Everything you need to run a modern gate.
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                            Three simple primitives replace the entire phone-call, paper-log, guesswork workflow.
                        </motion.p>
                    </motion.div>

                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-80px' }}
                        variants={staggerContainer}
                        className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-3"
                    >
                        {coreBenefits.map((item) => (
                            <motion.div
                                key={item.title}
                                variants={fadeInUp}
                                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-b from-white to-slate-50/40 p-7 transition-all duration-300 hover:border-slate-300 hover:shadow-[0_20px_50px_-20px_rgba(15,23,42,0.15)]"
                            >
                                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-semibold tracking-tight text-slate-900">{item.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ─── Product Showcase ─────────────────────────────────────────── */}
            <section id="product" className="relative overflow-hidden bg-slate-50/50 py-20 lg:py-28">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.6 }}
                        className="mx-auto max-w-2xl text-center"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                            Product
                        </div>
                        <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                            One platform. Three native experiences.
                        </h2>
                        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                            Kontrol is not one app. It's three purpose-built workflows for the three people who live at your gate.
                        </p>
                    </motion.div>

                    {/* Residents */}
                    <div className="mt-20 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase">
                                For residents
                            </div>
                            <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                                Invite a visitor in under 10 seconds.
                            </h3>
                            <p className="mt-4 text-base leading-relaxed text-slate-600">
                                No more phone calls to the gate. Residents generate codes from their phone, share them over Telegram, WhatsApp, or SMS,
                                and get notified the moment their guest arrives.
                            </p>
                            <ul className="mt-6 space-y-3">
                                {[
                                    'Single-use codes that expire automatically',
                                    'Pre-schedule for visitors arriving tomorrow',
                                    'Share over Telegram in one tap',
                                    'Instant arrival notification',
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-3">
                                        <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                                        <span className="text-sm text-slate-700">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.7, delay: 0.15 }}
                            className="lg:order-last"
                        >
                            <ResidentShowcaseMock />
                        </motion.div>
                    </div>

                    {/* Security */}
                    <div className="mt-24 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.7, delay: 0.15 }}
                            className="lg:order-first"
                        >
                            <SecurityShowcaseMock />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-700 uppercase">
                                For security
                            </div>
                            <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                                Validate visitors without ever calling a resident.
                            </h3>
                            <p className="mt-4 text-base leading-relaxed text-slate-600">
                                Security punches in the code. Kontrol verifies it, shows who the visitor is, who they're here for, and logs the entry,
                                all in one screen, in under two seconds.
                            </p>
                            <ul className="mt-6 space-y-3">
                                {[
                                    'Two-tap validation at the gate',
                                    'Instant rejection for expired or invalid codes',
                                    'Full visitor context: host, vehicle, purpose',
                                    'Works offline-friendly on any phone',
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-3">
                                        <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                                        <span className="text-sm text-slate-700">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>

                    {/* Admins */}
                    <div className="mt-24 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-700 uppercase">
                                For community admins
                            </div>
                            <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                                See everything. Control everything.
                            </h3>
                            <p className="mt-4 text-base leading-relaxed text-slate-600">
                                A clean, real-time dashboard of every resident, every code, every visitor, with announcements, billing, and role
                                management built in.
                            </p>
                            <ul className="mt-6 space-y-3">
                                {[
                                    'Real-time visitor and entry analytics',
                                    'Broadcast community-wide announcements',
                                    'Granular role and permission management',
                                    'Tamper-proof audit log for every action',
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-3">
                                        <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                                        <span className="text-sm text-slate-700">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.7, delay: 0.15 }}
                            className="lg:order-last"
                        >
                            <AdminShowcaseMock />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ─── Feature Bento Grid ───────────────────────────────────────── */}
            <section id="features" className="relative bg-white py-20 lg:py-28">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.6 }}
                        className="mx-auto max-w-2xl text-center"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                            Features
                        </div>
                        <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                            Built with the details that matter.
                        </h2>
                        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                            A focused toolkit, not a bloated platform. Every feature earns its place.
                        </p>
                    </motion.div>

                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true, margin: '-80px' }}
                        variants={staggerContainer}
                        className="mx-auto mt-14 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {bentoFeatures.map((feature) => (
                            <motion.div
                                key={feature.title}
                                variants={fadeInUp}
                                className="group rounded-2xl border border-slate-200 bg-linear-to-b from-white to-slate-50/30 p-6 transition-all duration-300 hover:border-slate-300 hover:shadow-[0_20px_50px_-20px_rgba(15,23,42,0.12)]"
                            >
                                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                                    <feature.icon className="h-5 w-5" />
                                </div>
                                <h3 className="text-base font-semibold tracking-tight text-slate-900">{feature.title}</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ─── Why Kontrol (Comparison) ─────────────────────────────────── */}
            <section className="relative overflow-hidden bg-slate-950 py-20 lg:py-28">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-br from-blue-500/10 via-indigo-500/10 to-transparent blur-3xl" />
                    <div
                        className="absolute inset-0 opacity-[0.4]"
                        style={{
                            backgroundImage:
                                'linear-gradient(to right, rgb(30 41 59 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgb(30 41 59 / 0.5) 1px, transparent 1px)',
                            backgroundSize: '64px 64px',
                            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
                        }}
                    />
                </div>

                <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.6 }}
                        className="mx-auto max-w-2xl text-center"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-slate-300 uppercase">
                            Old way vs Kontrol
                        </div>
                        <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                            The difference is night and day.
                        </h2>
                        <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">
                            Communities running on phone calls and paper aren't just inconvenienced. They're operating blind.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur"
                    >
                        <div className="grid grid-cols-3 border-b border-white/10 bg-white/[0.02]">
                            <div className="px-4 py-4 text-left text-xs font-semibold tracking-wide text-slate-400 uppercase sm:px-6">
                                Capability
                            </div>
                            <div className="flex items-center gap-2 px-4 py-4 text-left text-xs font-semibold tracking-wide text-slate-400 uppercase sm:px-6">
                                <XCircleIcon className="h-4 w-4 text-rose-400" />
                                <span className="hidden sm:inline">The old way</span>
                                <span className="sm:hidden">Old</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-4 text-left text-xs font-semibold tracking-wide text-blue-300 uppercase sm:px-6">
                                <CheckCircleIcon className="h-4 w-4 text-blue-300" />
                                <span>Kontrol</span>
                            </div>
                        </div>
                        {comparisonRows.map((row, i) => (
                            <div
                                key={row.feature}
                                className={`grid grid-cols-3 ${i !== comparisonRows.length - 1 ? 'border-b border-white/5' : ''}`}
                            >
                                <div className="px-4 py-4 text-xs font-semibold text-white sm:px-6 sm:py-5 sm:text-sm">{row.feature}</div>
                                <div className="px-4 py-4 text-xs leading-relaxed text-slate-400 sm:px-6 sm:py-5 sm:text-sm">{row.old}</div>
                                <div className="px-4 py-4 text-xs leading-relaxed text-slate-100 sm:px-6 sm:py-5 sm:text-sm">{row.kontrol}</div>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-3"
                    >
                        {[
                            { icon: LockClosedIcon, title: 'Privacy-first', description: 'Minimal data collection. Encryption end-to-end.' },
                            { icon: SparklesIcon, title: 'Onboarded by humans', description: 'Our team personally sets up your community.' },
                            { icon: ShieldIcon, title: 'Secured at every layer', description: 'OAuth, audit logs, role-based access.' },
                        ].map((item) => (
                            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur">
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-blue-300">
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <h3 className="mt-3 text-sm font-semibold text-white">{item.title}</h3>
                                <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.description}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ─── Pricing ──────────────────────────────────────────────────── */}
            {plans.length > 0 && (
                <section id="pricing" className="relative bg-white py-20 lg:py-28">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.6 }}
                            className="mx-auto max-w-2xl text-center"
                        >
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold tracking-wide text-slate-600 uppercase">
                                Pricing
                            </div>
                            <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                                Honest pricing that grows with you.
                            </h2>
                            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                                Pay per resident. No setup fees, no surprise bills. Cancel anytime.
                            </p>

                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="mt-10 flex justify-center"
                            >
                                <div className="relative inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                                    {(['quarterly', 'semi-annually', 'annually'] as const).map((interval) => {
                                        const labels = {
                                            quarterly: 'Quarterly',
                                            'semi-annually': '6 Months',
                                            annually: 'Annually',
                                        };
                                        return (
                                            <button
                                                key={interval}
                                                onClick={() => setBillingPeriod(interval)}
                                                className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 sm:px-5 ${
                                                    billingPeriod === interval ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                                style={{ WebkitTapHighlightColor: 'transparent' }}
                                            >
                                                {billingPeriod === interval && (
                                                    <motion.div
                                                        layoutId="pricing-selector-pill"
                                                        className="absolute inset-0 rounded-full bg-slate-900 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.4)]"
                                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                                    />
                                                )}
                                                <span className="relative z-10">{labels[interval]}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </motion.div>

                        {plans.some((p) => p.billing_interval === billingPeriod) ? (
                            <motion.div
                                key={billingPeriod}
                                initial="initial"
                                animate="animate"
                                variants={staggerContainer}
                                className="mx-auto mt-12 grid gap-6 lg:grid-cols-3"
                            >
                                {plans
                                    .filter((p) => p.billing_interval === billingPeriod)
                                    .map((plan) => (
                                        <PricingCard
                                            key={plan.id}
                                            plan={plan}
                                            allFeatures={allFeatures}
                                            billingPeriod={billingPeriod}
                                            savings={savingsMap.get(plan.id)}
                                            onSelect={() => openModalWithPlan(plan.id, plan.name, plan.billing_interval)}
                                        />
                                    ))}
                            </motion.div>
                        ) : (
                            <p className="mt-16 text-center text-slate-400">No plans available for this billing period</p>
                        )}

                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="mx-auto mt-10 max-w-xl text-center text-sm text-slate-500"
                        >
                            Pricing is calculated per resident. All plans include 24/7 support, secure codes, and real-time validation. Need something
                            custom?{' '}
                            <button onClick={openModal} className="font-semibold text-slate-900 underline underline-offset-4 hover:text-blue-600">
                                Talk to us
                            </button>
                        </motion.p>
                    </div>
                </section>
            )}

            {/* ─── Final CTA ────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-white py-16 lg:py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.7 }}
                        className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950 px-6 py-16 sm:px-12 lg:px-16 lg:py-20"
                    >
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute -top-32 -right-16 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
                            <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
                        </div>

                        <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                                    Your gate deserves better than a phone call.
                                </h2>
                                <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
                                    Apply now. Our team will personally onboard your community, residents, security, and admins, in a matter of days.
                                </p>
                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <button
                                        onClick={openModal}
                                        className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-xl transition-all duration-300 hover:bg-slate-100"
                                    >
                                        Apply for Access
                                        <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                                    </button>
                                    <a
                                        href={LoginController.show.url()}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
                                    >
                                        Sign in
                                    </a>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 sm:gap-6">
                                {[
                                    { stat: 'Seconds', label: 'to generate a code' },
                                    { stat: '2 taps', label: 'to validate at the gate' },
                                    { stat: '24/7', label: 'monitoring & support' },
                                    { stat: '0', label: 'paper logs ever again' },
                                ].map((item) => (
                                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
                                        <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{item.stat}</p>
                                        <p className="mt-1 text-xs text-slate-400 sm:text-sm">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <ApplicationModal
                isOpen={modalOpen}
                onClose={closeModal}
                selectedPlanId={selectedPlanId}
                selectedPlanName={selectedPlanName}
                selectedPlanInterval={selectedPlanInterval}
            />
        </PublicLayout>
    );
}
