import { Link, Head } from '@inertiajs/react';
import React from 'react';
import Header from '@/Components/Public/Header';

export default function Terms() {
    return (
        <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#FF7E67]/30 selection:text-white pb-12 transition-colors duration-300">
            <Head>
                <title>Terms of Use - Kontrol Gated Access</title>
                <meta name="description" content="Read Kontrol's terms of use regarding account creation, visitor pass generation, and estate community billing rules." />
            </Head>

            {/* Persistent Header */}
            <Header hideCta={false} />

            {/* Content Stage */}
            <main className="max-w-4xl mx-auto px-6 pt-40 pb-20">
                <div className="border-b border-slate-200 dark:border-slate-900 pb-8 mb-12">
                    <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                        Terms of Use
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 font-mono">
                        Last Updated: June 01, 2026
                    </p>
                </div>

                <div className="space-y-8 text-slate-650 dark:text-slate-400 leading-relaxed font-medium text-sm sm:text-base">
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            1. Acceptance of Terms
                        </h2>
                        <p>
                            By downloading, accessing, or using the Kontrol mobile application or web portal, you agree to comply with and be bound by these Terms of Use. If you are using the service on behalf of an estate management board, you represent that you have the authority to bind that entity.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            2. Account Registration and Security
                        </h2>
                        <p>
                            To use the resident app or security terminals, accounts must be created and verified. You agree to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Provide accurate, current, and complete registration information.</li>
                            <li>Maintain the confidentiality of login links, autologin links, and temporary access codes.</li>
                            <li>Promptly notify your estate administration of any unauthorized access to your household unit profile.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            3. Rules of Acceptable Use
                        </h2>
                        <p>
                            When using Kontrol to generate visitor passes or manage your household access, you agree not to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Generate fake or fraudulent visitor passes for unauthorized individuals.</li>
                            <li>Trigger emergency SOS distress alerts in non-emergency situations. False panic alarms disrupt checkpoint operations and may lead to fines by your estate management.</li>
                            <li>Attempt to bypass security verification checks or scan tokens using unofficial terminal systems.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            4. Levy Collections and Payments
                        </h2>
                        <p>
                            All financial transactions, such as payment of security dues, maintenance levies, or electricity utility bills, are initiated inside the app. Payment terms, billing periods, and overdue penalties are determined solely by your estate management board. Kontrol acts as a facilitating gateway and is not liable for billing disputes between residents and estate managers.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            5. Limitation of Liability
                        </h2>
                        <p>
                            Kontrol is a software platform designed to assist and streamline gated community operations. We do not provide physical security guards, law enforcement dispatch, or physical estate maintenance services. Under no circumstances shall Kontrol be liable for security breaches, property loss, or personal injury occurring at estate boundaries.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            6. Governing Law
                        </h2>
                        <p>
                            These terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without giving effect to any choice of law principles.
                        </p>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-50 dark:bg-[#020617] border-t border-slate-200 dark:border-slate-900 py-12 text-slate-500 text-xs">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <img 
                            src="/assets/images/kontrol-white-logo-new.png" 
                            alt="Kontrol" 
                            className="hidden dark:block h-6 w-auto" 
                        />
                        <img 
                            src="/assets/images/kontrol.png" 
                            alt="Kontrol" 
                            className="block dark:hidden h-6 w-auto" 
                        />
                        <span className="text-[10px] text-slate-650 dark:text-slate-600 font-medium">© 2026. All rights reserved.</span>
                    </div>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-slate-300">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-slate-900 dark:hover:text-slate-300">Terms of Use</Link>
                        <Link href="/contact" className="hover:text-slate-900 dark:hover:text-slate-300">Contact Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
