import { Link, Head } from '@inertiajs/react';
import { 
    Building2, 
    QrCode, 
    Users, 
    FileText, 
    Bell, 
    ArrowRight
} from 'lucide-react';
import React, { useEffect } from 'react';
import Header from '@/Components/Public/Header';

export default function Estates() {
    // Force dark mode background on public pages and clean up on unmount
    useEffect(() => {
        document.documentElement.style.setProperty('background-color', '#020617', 'important');
        document.body.style.setProperty('background-color', '#020617', 'important');
        document.body.style.setProperty('color', '#f8fafc', 'important');
        
        return () => {
            document.documentElement.style.removeProperty('background-color');
            document.body.style.removeProperty('background-color');
            document.body.style.removeProperty('color');
        };
    }, []);

    const features = [
        {
            icon: <QrCode className="w-5 h-5 text-[#FF7E67]" />,
            title: "Automated Gate Terminals",
            desc: "Equip your gate checkpoints with our digital terminal app. Guards scan resident-generated guest codes to verify visitor status and check them in within three seconds."
        },
        {
            icon: <FileText className="w-5 h-5 text-[#4F46E5]" />,
            title: "Seamless Levy Collections",
            desc: "Create, schedule, and track maintenance fees, security levies, or utility dues. Residents pay directly in the app, and the system instantly updates your community ledger."
        },
        {
            icon: <Users className="w-5 h-5 text-emerald-400" />,
            title: "Guard Roster & Access Controls",
            desc: "Register guard profiles, assign terminal access, and monitor check-in logs in real-time. Full history logs provide an immutable audit trail of everyone entering the community."
        },
        {
            icon: <Bell className="w-5 h-5 text-red-500 animate-pulse" />,
            title: "Gatehouse Distress Integration",
            desc: "When a resident triggers a panic alert from their app, a loud warning sounds instantly at all gate terminals, displaying the home address and owner details to dispatch security fast."
        }
    ];

    const steps = [
        {
            number: "01",
            title: "Register Your Estate",
            desc: "Click 'Onboard Your Estate' to submit your estate details, billing settings, and contact information."
        },
        {
            number: "02",
            title: "Map Streets & Units",
            desc: "Use our clean administrator dashboard to create streets, add housing unit addresses, and set up your guard terminals."
        },
        {
            number: "03",
            title: "Deploy Guard App",
            desc: "Download our guard terminal app on any low-cost Android device at your estate checkpoint. It registers instantly with a code."
        },
        {
            number: "04",
            title: "Invite Residents",
            desc: "Import your residents list or allow them to sign up. They'll receive an invite code to start generating gate passes."
        }
    ];

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-[#FF7E67]/30 selection:text-white pb-24">
            <Head>
                <title>For Estates & Gated Communities - Kontrol Operations</title>
                <meta name="description" content="Deploy digital checkpoint systems, manage gate security, track logs, and automate levy collections for your gated community." />
            </Head>

            {/* Persistent Header */}
            <Header activePage="estates" />

            {/* Hero Stage */}
            <section className="pt-40 pb-20 relative overflow-hidden border-b border-slate-900">
                {/* Background glow effects */}
                <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4F46E5]/10 rounded-full filter blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-[#FF7E67]/5 rounded-full filter blur-[120px] pointer-events-none"></div>

                <div className="max-w-4xl mx-auto px-6 text-center flex flex-col gap-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4F46E5]/15 border border-[#4F46E5]/30 text-[#818cf8] text-xs font-bold self-center">
                        <Building2 className="w-3.5 h-3.5" />
                        Gated Community Operations
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight tracking-tight">
                        Modern operations for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-200 to-[#FF7E67]">estate managers.</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
                        Run your neighborhood gates, track security logs, automate maintenance levy collections, and broadcast emergency alerts—all in one place.
                    </p>

                    <div className="flex justify-center mt-4">
                        <Link 
                            href="/apply" 
                            className="px-8 py-4 bg-[#FF7E67] hover:bg-[#ff8f7a] text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 group"
                        >
                            Onboard Your Estate
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Core Pillars / Grid */}
            <section className="py-24 border-b border-slate-900">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-4">
                        <span className="text-xs font-bold text-[#4F46E5] tracking-widest uppercase">Admin System</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            Everything you need to run your community
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {features.map((f, i) => (
                            <div key={i} className="p-8 bg-[#0f172a]/20 border border-slate-900 rounded-3xl flex flex-col gap-4 hover:border-slate-800 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-900 shrink-0">
                                    {f.icon}
                                </div>
                                <h3 className="text-lg font-bold text-white">{f.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed font-medium">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Step-by-Step Onboarding Process */}
            <section className="py-24 border-b border-slate-900">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-4">
                        <span className="text-xs font-bold text-[#FF7E67] tracking-widest uppercase">Rollout Sequence</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            Get started in four simple steps
                        </h2>
                        <p className="text-slate-400 text-sm font-medium">
                            Setting up Kontrol for your estate takes less than a day with zero upfront hardware costs.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {steps.map((s, i) => (
                            <div key={i} className="p-6 bg-[#0f172a]/10 border border-slate-950 rounded-2xl flex flex-col gap-4 relative">
                                <div className="text-4xl font-black text-slate-800/40 select-none">{s.number}</div>
                                <h3 className="text-base font-bold text-white">{s.title}</h3>
                                <p className="text-xs text-slate-400 leading-relaxed font-medium">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Interactive Callout / Onboard Estate CTA */}
            <section className="py-24">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="p-10 bg-gradient-to-br from-[#0f172a]/80 to-[#020617] border border-[#FF7E67]/30 rounded-[40px] flex flex-col items-center text-center justify-between gap-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF7E67]/5 rounded-full filter blur-3xl"></div>
                        
                        <div className="max-w-2xl">
                            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                Ready to upgrade your estate security and operations?
                            </h3>
                            <p className="text-sm text-slate-400 mt-3 leading-relaxed font-medium">
                                Submit your application details, configure your subscription preferences, and instantly access your estate console dashboard.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full justify-center">
                            <Link 
                                href="/apply" 
                                className="px-8 py-4 bg-[#FF7E67] hover:bg-[#ff8f7a] text-white font-extrabold text-sm rounded-xl text-center shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                Onboard Your Estate
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#020617] border-t border-slate-900 py-12 text-slate-500 text-xs">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <img src="/assets/images/kontrol-white-logo-new.png" alt="Kontrol" className="h-6 w-auto" />
                        <span className="text-[10px] text-slate-600 font-medium">© 2026. All rights reserved.</span>
                    </div>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-slate-300">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-slate-300">Terms of Use</Link>
                        <Link href="/contact" className="hover:text-slate-300">Contact Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
