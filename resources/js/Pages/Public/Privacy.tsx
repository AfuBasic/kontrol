import { Link, Head } from '@inertiajs/react';
import React from 'react';
import Header from '@/Components/Public/Header';

export default function Privacy() {
    return (
        <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#FF7E67]/30 selection:text-white pb-12 transition-colors duration-300">
            <Head>
                <title>Privacy Policy - Kontrol Gated Access</title>
                <meta name="description" content="Read Kontrol's privacy policy regarding information collection, security audits, and data retention inside gated communities." />
            </Head>

            {/* Persistent Header */}
            <Header hideCta={false} />

            {/* Content Stage */}
            <main className="max-w-4xl mx-auto px-6 pt-40 pb-20">
                <div className="border-b border-slate-200 dark:border-slate-900 pb-8 mb-12">
                    <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                        Privacy Policy
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 font-mono">
                        Last Updated: June 01, 2026
                    </p>
                </div>

                <div className="space-y-8 text-slate-650 dark:text-slate-400 leading-relaxed font-medium text-sm sm:text-base">
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            1. Information We Collect
                        </h2>
                        <p>
                            Kontrol collects information to provide secure gate access control and community billing solutions. This includes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Account Data:</strong> Name, phone number, email address, and unit/house address when registered by your estate administration.</li>
                            <li><strong>Visitor Logs:</strong> Guest names, vehicle registration numbers, check-in/check-out timestamps, and validating guards identifiers.</li>
                            <li><strong>Telemetry & Security:</strong> Logs of generated visitor passes, QR credentials, and emergency SOS triggers.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            2. How We Use Your Information
                        </h2>
                        <p>
                            We use the collected information strictly for community security and financial auditing purposes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Generating and verifying guest codes to replace manual paper logbooks.</li>
                            <li>Broadcasting real-time panic/distress signals containing location coordinates to gate security teams.</li>
                            <li>Reconciling levy records when online payments are made.</li>
                            <li>Sending notification alerts when visitors enter or leave the estate checkpoints.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            3. Information Sharing and Disclosure
                        </h2>
                        <p>
                            Kontrol does not sell, rent, or trade your personal information. Data is only accessible to authorized estate administrators, security personnel assigned to your community, and the residents linked to your specific household unit.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            4. Data Retention
                        </h2>
                        <p>
                            We retain visitor logs and transaction histories as long as required by your estate management board for security audits. Residents can request account deactivation, which anonymizes their household records, subject to estate administrator approval.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            5. Security Standards
                        </h2>
                        <p>
                            All visitor passes are secured using cryptographically signed tokens. Communication between mobile apps, gate terminals, and database servers is encrypted via SSL/TLS protocols. Financial transactions are processed securely through certified gateways (Paystack), and card credentials are never stored on our servers.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            6. Contact Us
                        </h2>
                        <p>
                            If you have questions regarding this Privacy Policy or wish to assert your data rights, please contact our support team on the <Link href="/contact" className="text-[#FF7E67] hover:text-[#ff8f7a] font-bold underline">Contact Page</Link>.
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
