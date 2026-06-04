import { Link, Head } from '@inertiajs/react';
import React from 'react';
import Header from '@/Components/Public/Header';

export default function Terms() {
    return (
        <div className="min-h-screen bg-white pb-12 font-sans text-slate-900 transition-colors duration-300 selection:bg-[#FF7E67]/30 selection:text-white dark:bg-[#020617] dark:text-slate-100">
            <Head>
                <title>Terms of Use - Kontrol Gated Access</title>
                <meta
                    name="description"
                    content="Read Kontrol's terms of use regarding account creation, visitor pass generation, and estate community billing rules."
                />
            </Head>

            {/* Persistent Header */}
            <Header hideCta={false} />

            {/* Content Stage */}
            <main className="mx-auto max-w-4xl px-6 pt-40 pb-20">
                <div className="mb-12 border-b border-slate-200 pb-8 dark:border-slate-900">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-white">Terms of Use</h1>
                    <p className="mt-2 font-mono text-sm text-slate-500">Last Updated: June 01, 2026</p>
                </div>

                <div className="text-slate-650 space-y-8 text-sm leading-relaxed font-medium sm:text-base dark:text-slate-400">
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
                        <p>
                            By downloading, accessing, or using the Kontrol mobile application or web portal, you agree to comply with and be bound by
                            these Terms of Use. If you are using the service on behalf of an estate management board, you represent that you have the
                            authority to bind that entity.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">2. Account Registration and Security</h2>
                        <p>To use the resident app or security terminals, accounts must be created and verified. You agree to:</p>
                        <ul className="list-disc space-y-2 pl-6">
                            <li>Provide accurate, current, and complete registration information.</li>
                            <li>Maintain the confidentiality of login links, autologin links, and temporary access codes.</li>
                            <li>Promptly notify your estate administration of any unauthorized access to your household unit profile.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">3. Rules of Acceptable Use</h2>
                        <p>When using Kontrol to generate visitor passes or manage your household access, you agree not to:</p>
                        <ul className="list-disc space-y-2 pl-6">
                            <li>Generate fake or fraudulent visitor passes for unauthorized individuals.</li>
                            <li>
                                Trigger emergency SOS distress alerts in non-emergency situations. False panic alarms disrupt checkpoint operations
                                and may lead to fines by your estate management.
                            </li>
                            <li>Attempt to bypass security verification checks or scan tokens using unofficial terminal systems.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">4. Levy Collections and Payments</h2>
                        <p>
                            All financial transactions, such as payment of security dues, maintenance levies, or electricity utility bills, are
                            initiated inside the app. Payment terms, billing periods, and overdue penalties are determined solely by your estate
                            management board. Kontrol acts as a facilitating gateway and is not liable for billing disputes between residents and
                            estate managers.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">5. Limitation of Liability</h2>
                        <p>
                            Kontrol is a software platform designed to assist and streamline gated community operations. We do not provide physical
                            security guards, law enforcement dispatch, or physical estate maintenance services. Under no circumstances shall Kontrol
                            be liable for security breaches, property loss, or personal injury occurring at estate boundaries.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">6. Governing Law</h2>
                        <p>
                            These terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without
                            giving effect to any choice of law principles.
                        </p>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-slate-50 py-12 text-xs text-slate-500 dark:border-slate-900 dark:bg-[#020617]">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
                    <div className="flex items-center gap-3">
                        <img src="/assets/images/kontrol-white-logo-new.png" alt="Kontrol" className="hidden h-6 w-auto dark:block" />
                        <img src="/assets/images/kontrol.png" alt="Kontrol" className="block h-6 w-auto dark:hidden" />
                        <span className="text-slate-650 text-[10px] font-medium dark:text-slate-600">© 2026. All rights reserved.</span>
                    </div>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-slate-300">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="hover:text-slate-900 dark:hover:text-slate-300">
                            Terms of Use
                        </Link>
                        <Link href="/contact" className="hover:text-slate-900 dark:hover:text-slate-300">
                            Contact Support
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
