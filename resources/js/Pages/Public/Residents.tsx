import { Link, Head } from '@inertiajs/react';
import { 
    Smartphone, 
    Users, 
    AlertTriangle, 
    Key, 
    Clock, 
    MessageSquare, 
    Download
} from 'lucide-react';
import React, { useEffect } from 'react';
import Header from '@/Components/Public/Header';

export default function Residents() {
    // Set mount status
    useEffect(() => {
        // Mounted
    }, []);

    const features = [
        {
            icon: <Key className="w-5 h-5 text-[#FF7E67]" />,
            title: "Instant Guest Passes",
            desc: "Create secure one-time or multi-day entry codes for visitors, contractors, or delivery agents, and share them directly via WhatsApp or text."
        },
        {
            icon: <Users className="w-5 h-5 text-[#4F46E5]" />,
            title: "Household Controls",
            desc: "Invite family members, flatmates, or domestic staff to join your household profile. Assign custom permission levels for managing visitors."
        },
        {
            icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
            title: "Immediate Distress Alerts",
            desc: "Trigger a real-time panic alarm from the app during emergencies. It sends your address and contact details directly to all gate guard terminals instantly."
        },
        {
            icon: <Clock className="w-5 h-5 text-emerald-400" />,
            title: "Arrival Notifications",
            desc: "Receive real-time push notifications the exact second your guests are checked in or out by security guards at the estate gate."
        },
        {
            icon: <MessageSquare className="w-5 h-5 text-[#FF7E67]" />,
            title: "Community Noticeboard",
            desc: "Read announcements, maintenance bulletins, and general estate notices sent directly by your property management team."
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#FF7E67]/30 selection:text-white pb-24 transition-colors duration-300">
            <Head>
                <title>For Residents - Kontrol Gated Access</title>
                <meta name="description" content="Manage guest access, emergency alerts, household members, and announcements with the Kontrol resident app." />
            </Head>

            {/* Persistent Header - CTA hidden to keep Residents page clean of onboarding actions */}
            <Header hideCta={true} activePage="residents" />

            {/* Hero Stage */}
            <section className="pt-40 pb-20 relative overflow-hidden border-b border-slate-200 dark:border-slate-900">
                {/* Background glow effects */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF7E67]/10 rounded-full filter blur-[120px] pointer-events-none"></div>

                <div className="max-w-4xl mx-auto px-6 text-center flex flex-col gap-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF7E67]/15 border border-[#FF7E67]/30 text-[#ff8f7a] text-xs font-bold self-center">
                        <Smartphone className="w-3.5 h-3.5" />
                        Resident Companion App
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                        Your home gate in your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7E67] to-indigo-500 dark:to-indigo-400">pocket.</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
                        No more intercom delays or walking down to the gate. Generate guest access codes, invite household members, and trigger panic alerts in seconds.
                    </p>
                </div>
            </section>

            {/* Resident Features Grid */}
            <section className="py-24 border-b border-slate-200 dark:border-slate-900">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-4">
                        <span className="text-xs font-bold text-[#4F46E5] tracking-widest uppercase">App Features</span>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            Streamlined tools for your household
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((f, i) => (
                            <div key={i} className="p-8 bg-slate-50 dark:bg-[#0f172a]/20 border border-slate-200 dark:border-slate-900 rounded-3xl flex flex-col gap-4 hover:border-slate-350 dark:hover:border-slate-800 transition-all shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-900 shrink-0">
                                    {f.icon}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{f.title}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How to Connect / Start */}
            <section className="py-24">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="p-10 bg-gradient-to-br from-slate-50 to-white dark:from-[#0f172a]/80 dark:to-[#020617] border border-slate-250 dark:border-[#4F46E5]/30 rounded-[40px] flex flex-col items-center text-center justify-between gap-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#4F46E5]/5 rounded-full filter blur-3xl"></div>
                        
                        <div className="max-w-2xl">
                            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                How do I activate my account?
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 leading-relaxed font-medium">
                                Once your estate administrators onboard the community onto Kontrol, download the resident companion app on iOS or Android. Simply log in with your phone number to automatically sync with your unit address.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 mt-2 justify-center">
                            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold shadow-sm">
                                <Download className="w-4 h-4 text-[#FF7E67]" />
                                Companion app available on App Store & Google Play
                            </div>
                        </div>
                    </div>
                </div>
            </section>

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
