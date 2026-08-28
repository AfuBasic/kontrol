import { Head, usePage } from '@inertiajs/react';
import { ArrowLeft, ChevronRight, Mail, Phone, Info } from 'lucide-react';
import type { ReactNode } from 'react';
import AnimatedLayout from '@/Layouts/AnimatedLayout';
import AdminLayout from '@/Layouts/AdminLayout';
import PartnerLayout from '@/Layouts/PartnerLayout';
import ResidentLayout from '@/Layouts/ResidentLayout';
import SecurityLayout from '@/Layouts/SecurityLayout';
import type { SharedData } from '@/types';

interface SupportDetails {
    email: string;
    phone: string;
    phone_formatted: string;
    whatsapp: string;
    whatsapp_formatted: string;
}

interface Props {
    support: SupportDetails;
}

function WhatsAppIcon({ className = 'h-5 w-5' }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
        >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
}

export default function Support({ support }: Props) {
    const { auth } = usePage<SharedData>().props;
    const roles = auth.user?.roles ?? [];

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            window.history.back();
        } else if (roles.includes('security')) {
            window.location.href = '/security/profile';
        } else if (roles.some((r) => ['resident', 'household_member', 'property_owner'].includes(r))) {
            window.location.href = '/resident/profile';
        } else {
            window.location.href = '/admin/profile';
        }
    };

    const whatsappMessage = encodeURIComponent('Hello Kontrol Support, I need some help.');
    const whatsappUrl = `https://wa.me/${support.whatsapp}?text=${whatsappMessage}`;
    const emailUrl = `mailto:${support.email}?subject=${encodeURIComponent('Kontrol Support Request')}`;
    const phoneUrl = `tel:${support.phone}`;

    return (
        <>
            <Head title="Help & Support" />

            <div className="mx-auto max-w-xl space-y-6 pb-20 sm:pb-16">
                {/* Mobile Back Button & Navigation */}
                <div className="flex items-center gap-3 pt-1">
                    <button
                        type="button"
                        onClick={handleBack}
                        aria-label="Go back"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-700 shadow-xs transition active:scale-95 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest dark:text-slate-400">
                        Support
                    </span>
                </div>

                {/* Header */}
                <header className="space-y-1.5 px-0.5">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                        Help & Support
                    </h1>
                    <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        Need help with Kontrol? Reach our support team using any of the options below.
                    </p>
                </header>

                {/* Contact Action Surfaces */}
                <section aria-label="Support contact options">
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs divide-y divide-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800/70">
                        {/* 1. Call Support */}
                        <a
                            href={phoneUrl}
                            aria-label={`Call Kontrol Support at ${support.phone_formatted}`}
                            className="group flex min-h-[64px] items-center justify-between gap-3.5 px-4 py-3.5 transition-colors active:bg-slate-50 sm:px-5 hover:bg-slate-50/70 dark:active:bg-slate-800/80 dark:hover:bg-slate-800/40"
                        >
                            <div className="flex min-w-0 items-center gap-3.5">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 transition-transform group-hover:scale-105 dark:bg-emerald-500/20 dark:text-emerald-400">
                                    <Phone className="h-5 w-5" strokeWidth={2.2} />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                                        Call Support
                                    </h2>
                                    <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {support.phone_formatted}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300" />
                        </a>

                        {/* 2. WhatsApp Support */}
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Chat with Kontrol Support on WhatsApp"
                            className="group flex min-h-[64px] items-center justify-between gap-3.5 px-4 py-3.5 transition-colors active:bg-slate-50 sm:px-5 hover:bg-slate-50/70 dark:active:bg-slate-800/80 dark:hover:bg-slate-800/40"
                        >
                            <div className="flex min-w-0 items-center gap-3.5">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#25D366] transition-transform group-hover:scale-105 dark:bg-[#25D366]/20 dark:text-[#25D366]">
                                    <WhatsAppIcon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                                        Chat on WhatsApp
                                    </h2>
                                    <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Typically the fastest way to reach us.
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300" />
                        </a>

                        {/* 3. Email Support */}
                        <a
                            href={emailUrl}
                            aria-label={`Email Kontrol Support at ${support.email}`}
                            className="group flex min-h-[64px] items-center justify-between gap-3.5 px-4 py-3.5 transition-colors active:bg-slate-50 sm:px-5 hover:bg-slate-50/70 dark:active:bg-slate-800/80 dark:hover:bg-slate-800/40"
                        >
                            <div className="flex min-w-0 items-center gap-3.5">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 transition-transform group-hover:scale-105 dark:bg-indigo-500/20 dark:text-indigo-400">
                                    <Mail className="h-5 w-5" strokeWidth={2.2} />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                                        Email Support
                                    </h2>
                                    <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {support.email}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300" />
                        </a>
                    </div>
                </section>

                {/* Restrained Supporting Guidance */}
                <section aria-label="Support guidance">
                    <div className="flex items-start gap-3.5 rounded-2xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-900/40">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <Info className="h-4 w-4" strokeWidth={2.2} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                                Before contacting support
                            </h3>
                            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                If you're reporting an issue, including what you were trying to do and what happened will help us assist you faster.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

function AccountShell({ children }: { children: ReactNode }) {
    const { auth } = usePage<SharedData>().props;
    const roles = auth.user?.roles ?? [];

    if (roles.includes('security')) {
        return (
            <SecurityLayout>
                <AnimatedLayout>{children}</AnimatedLayout>
            </SecurityLayout>
        );
    }

    if (roles.some((role) => ['resident', 'household_member', 'property_owner'].includes(role))) {
        return (
            <ResidentLayout>
                <AnimatedLayout>{children}</AnimatedLayout>
            </ResidentLayout>
        );
    }

    if (auth.user && 'partner_id' in auth.user && auth.user.partner_id) {
        return (
            <PartnerLayout>
                <AnimatedLayout>{children}</AnimatedLayout>
            </PartnerLayout>
        );
    }

    return (
        <AdminLayout title="Help & Support">
            <AnimatedLayout>{children}</AnimatedLayout>
        </AdminLayout>
    );
}

Support.layout = (page: ReactNode) => <AccountShell>{page}</AccountShell>;
