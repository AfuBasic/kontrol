import { Head, Link } from '@inertiajs/react';
import { Smartphone, QrCode, CreditCard, Bell, Users, Shield, ArrowRight, Apple, CheckCircle2, MessageSquare, KeyRound } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import MagneticButton from '@/Components/Public/MagneticButton';

export default function ProductResidents() {
    return (
        <PublicLayout>
            <Head>
                <title>Kontrol for Residents — Smooth Gate Access and Effortless Living</title>
                <meta
                    name="description"
                    content="Experience seamless living in your estate. Generate visitor passes, pay service dues, manage household members, and receive verified announcements right from your phone."
                />
            </Head>

            <div className="overflow-hidden">
                {/* HERO SECTION */}
                <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-slate-950 pt-28 pb-20 text-white">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-600/15 blur-[140px]" />
                        <div
                            className="absolute inset-0 opacity-[0.04]"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
                                backgroundSize: '32px 32px',
                            }}
                        />
                    </div>

                    <div className="relative z-10 mx-auto max-w-5xl px-6 text-center lg:px-8">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-cyan-300 uppercase">
                            <Smartphone className="h-3.5 w-3.5" /> For Estate Residents & Families
                        </div>

                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                            Estate living, effortless at your fingertips.
                        </h1>

                        <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-slate-300 sm:text-xl">
                            No more calling the gate to confirm guests. No more digging for payment receipts. Kontrol gives you instant control over who enters your home, how you pay dues, and what's happening in your neighborhood.
                        </p>

                        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <a
                                href="#download"
                                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-slate-950 shadow-xl transition-all duration-300 hover:bg-slate-100"
                            >
                                Download the Resident App <ArrowRight className="h-4 w-4" />
                            </a>
                            <Link
                                href="/apply"
                                className="inline-flex min-h-14 items-center justify-center rounded-full border border-slate-700 bg-slate-900/60 px-8 text-base font-semibold text-white backdrop-blur-sm transition hover:border-slate-500 hover:bg-slate-800"
                            >
                                Bring Kontrol to Your Estate
                            </Link>
                        </div>
                    </div>
                </section>

                {/* APP HIGHLIGHTS GRID */}
                <section className="border-t border-slate-100 bg-white py-20 sm:py-28 dark:border-slate-900 dark:bg-slate-950">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                Everything you need to manage your home
                            </h2>
                            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                                Crafted for speed, clarity, and peace of mind on iOS and Android.
                            </p>
                        </div>

                        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/50 p-6 dark:border-slate-800/80 dark:bg-slate-900/40">
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                    <QrCode className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Instant Visitor Passes</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    Generate 6-digit access codes or QR passes in 5 seconds. Share via WhatsApp or SMS.
                                </p>
                            </div>

                            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/50 p-6 dark:border-slate-800/80 dark:bg-slate-900/40">
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                    <CreditCard className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">One-Tap Levy Payments</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    View breakdown of service charges, pay securely, and download verified receipts anytime.
                                </p>
                            </div>

                            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/50 p-6 dark:border-slate-800/80 dark:bg-slate-900/40">
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                                    <Users className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Household Access</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    Add family members and domestic staff. Set permissions on who can create visitor passes.
                                </p>
                            </div>

                            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/50 p-6 dark:border-slate-800/80 dark:bg-slate-900/40">
                                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                                    <Bell className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Official Broadcasts</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    Get official estate updates, power schedules, and maintenance notices directly without chat clutter.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* VISITOR FLOW WALKTHROUGH */}
                <section className="border-t border-slate-100 bg-slate-50 py-20 sm:py-28 dark:border-slate-900 dark:bg-slate-900/30">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
                            <div>
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                                    <KeyRound className="h-4 w-4" /> Seamless Guest Experience
                                </div>
                                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                    How visitor entry works in 3 easy steps
                                </h2>
                                <div className="mt-8 space-y-6">
                                    <div className="flex gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                                            1
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-slate-900 dark:text-white">Generate a pass</h4>
                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                                Enter your guest's name in the Kontrol app. An access code and QR pass are created instantly.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                                            2
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-slate-900 dark:text-white">Share with guest</h4>
                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                                Send the pass to your guest via WhatsApp or text. They present it to the guard upon arrival.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                                            3
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-slate-900 dark:text-white">Instant arrival alert</h4>
                                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                                Guard verifies the pass with one tap. You get a push notification: "Your guest has arrived at the gate."
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stylized App Card */}
                            <div className="mx-auto max-w-sm rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl dark:border-slate-800">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-xs font-semibold text-slate-400">Visitor Pass Active</span>
                                    </div>
                                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 uppercase">Single Entry</span>
                                </div>

                                <div className="mt-6 text-center">
                                    <p className="text-xs text-slate-400">Access Code</p>
                                    <p className="mt-1 text-4xl font-mono font-extrabold tracking-widest text-white">482 910</p>
                                    <p className="mt-2 text-xs text-slate-400">Valid for: Olumide Davies</p>
                                </div>

                                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-400">Host</span>
                                        <span className="font-semibold text-white">House 14B</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-400">Valid Until</span>
                                        <span className="font-semibold text-white">Today, 11:59 PM</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-400">Gate</span>
                                        <span className="font-semibold text-white">Main Entrance</span>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <button className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white transition hover:bg-blue-500">
                                        Share Pass via WhatsApp
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* APP DOWNLOAD CTA SECTION */}
                <section id="download" className="relative overflow-hidden bg-slate-900 py-32 text-center text-white">
                    <div className="relative z-10 mx-auto max-w-4xl px-6">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-300">
                            Available on iOS & Android
                        </div>

                        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                            Download Kontrol for your phone
                        </h2>

                        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
                            Once your estate is onboarded, download the app to activate your resident account and enjoy hassle-free living.
                        </p>

                        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <a
                                href="https://apps.apple.com/ng/app/access-kontrol/id6772562083"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex min-w-[200px] items-center gap-3 rounded-2xl bg-white px-6 py-3.5 text-slate-950 shadow-xl transition-all duration-300 hover:bg-slate-100 hover:scale-105"
                            >
                                <Apple className="h-7 w-7" />
                                <div className="text-left">
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">Download on the</p>
                                    <p className="text-base font-bold">App Store</p>
                                </div>
                            </a>

                            <a
                                href="https://play.google.com/store/apps/details?id=com.kontrol.hq&hl=en"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex min-w-[200px] items-center gap-3 rounded-2xl bg-slate-800 px-6 py-3.5 text-white ring-1 ring-white/10 transition-all duration-300 hover:bg-slate-700 hover:scale-105"
                            >
                                <img src="/assets/images/google-play.svg" alt="Google Play" className="h-7 w-7" />
                                <div className="text-left">
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Get it on</p>
                                    <p className="text-base font-bold">Google Play</p>
                                </div>
                            </a>
                        </div>

                        <div className="mt-12">
                            <p className="text-sm text-slate-400">
                                Is your estate not yet on Kontrol?{' '}
                                <Link href="/apply" className="font-semibold text-blue-400 hover:underline">
                                    Tell your estate manager or apply on their behalf &rarr;
                                </Link>
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
