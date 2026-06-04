import { Link, Head } from '@inertiajs/react';
import React from 'react';
import Header from '@/Components/Public/Header';

export default function Privacy() {
    return (
        <div className="min-h-screen bg-white pb-12 font-sans text-slate-900 transition-colors duration-300 selection:bg-[#FF7E67]/30 selection:text-white dark:bg-[#020617] dark:text-slate-100">
            <Head>
                <title>Privacy Policy - Kontrol Gated Access</title>
                <meta
                    name="description"
                    content="Read Kontrol's privacy policy regarding information collection, security audits, and data retention inside gated communities."
                />
            </Head>

            {/* Persistent Header */}
            <Header hideCta={false} />

            {/* Content Stage */}
            <main className="mx-auto max-w-4xl px-6 pt-40 pb-20">
                <div className="mb-12 border-b border-slate-200 pb-8 dark:border-slate-900">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-white">Privacy Policy</h1>
                    <p className="mt-2 font-mono text-sm text-slate-500">Last Updated: June 01, 2026</p>
                </div>

                <div className="text-slate-650 space-y-8 text-sm leading-relaxed font-medium sm:text-base dark:text-slate-400">
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">1. Information We Collect</h2>
                        <p>Kontrol collects information to provide secure gate access control and community billing solutions. This includes:</p>
                        <ul className="list-disc space-y-2 pl-6">
                            <li>
                                <strong>Account Data:</strong> Name, phone number, email address, and unit/house address when registered by your
                                estate administration.
                            </li>
                            <li>
                                <strong>Visitor Logs:</strong> Guest names, vehicle registration numbers, check-in/check-out timestamps, and
                                validating guards identifiers.
                            </li>
                            <li>
                                <strong>Telemetry & Security:</strong> Logs of generated visitor passes, QR credentials, and emergency SOS triggers.
                            </li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">2. How We Use Your Information</h2>
                        <p>We use the collected information strictly for community security and financial auditing purposes:</p>
                        <ul className="list-disc space-y-2 pl-6">
                            <li>Generating and verifying guest codes to replace manual paper logbooks.</li>
                            <li>Broadcasting real-time panic/distress signals containing location coordinates to gate security teams.</li>
                            <li>Reconciling levy records when online payments are made.</li>
                            <li>Sending notification alerts when visitors enter or leave the estate checkpoints.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">3. Information Sharing and Disclosure</h2>
                        <p>
                            Kontrol does not sell, rent, or trade your personal information. Data is only accessible to authorized estate
                            administrators, security personnel assigned to your community, and the residents linked to your specific household unit.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">4. Data Retention</h2>
                        <p>
                            We retain visitor logs and transaction histories as long as required by your estate management board for security audits.
                            Residents can request account deactivation, which anonymizes their household records, subject to estate administrator
                            approval.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">5. Security Standards</h2>
                        <p>
                            All visitor passes are secured using cryptographically signed tokens. Communication between mobile apps, gate terminals,
                            and database servers is encrypted via SSL/TLS protocols. Financial transactions are processed securely through certified
                            gateways (Paystack), and card credentials are never stored on our servers.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">6. Contact Us</h2>
                        <p>
                            If you have questions regarding this Privacy Policy or wish to assert your data rights, please contact our support team on
                            the{' '}
                            <Link href="/contact" className="font-bold text-[#FF7E67] underline hover:text-[#ff8f7a]">
                                Contact Page
                            </Link>
                            .
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
