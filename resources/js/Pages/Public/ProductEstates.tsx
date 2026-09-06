import { Head, Link } from '@inertiajs/react';
import { Shield, CreditCard, Users, Megaphone, FileSpreadsheet, ArrowRight, CheckCircle2, Clock, Bell, Building } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';
import MagneticButton from '@/Components/Public/MagneticButton';
import { apply } from '@/routes/public';

export default function ProductEstates() {
    return (
        <PublicLayout>
            <Head>
                <title>Kontrol for Estates — Complete Operating System for Gated Communities</title>
                <meta
                    name="description"
                    content="Eliminate gate bottlenecks, automate service charge collections, and bring order to resident communication. Built for estate managers, ExCos, and facility teams."
                />
            </Head>

            <div className="overflow-hidden">
                {/* HERO SECTION */}
                <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-slate-950 pt-28 pb-20 text-white">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/15 blur-[140px]" />
                        <div
                            className="absolute inset-0 opacity-[0.04]"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
                                backgroundSize: '32px 32px',
                            }}
                        />
                    </div>

                    <div className="relative z-10 mx-auto max-w-5xl px-6 text-center lg:px-8">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-blue-300 uppercase">
                            <Building className="h-3.5 w-3.5" /> For Estate Managers, ExCos & HOAs
                        </div>

                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                            The command center your estate has been missing.
                        </h1>

                        <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-slate-300 sm:text-xl">
                            From visitor verification at the gate to dues reconciliation in the office, Kontrol replaces fragmented spreadsheets, paper logbooks, and chaotic WhatsApp groups with a single, synchronized platform.
                        </p>

                        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <MagneticButton>
                                <Link
                                    href={apply.url()}
                                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-slate-950 shadow-xl transition-all duration-300 hover:bg-slate-100"
                                >
                                    Apply for Your Estate <ArrowRight className="h-4 w-4" />
                                </Link>
                            </MagneticButton>
                            <a
                                href="#features"
                                className="inline-flex min-h-14 items-center justify-center rounded-full border border-slate-700 bg-slate-900/60 px-8 text-base font-semibold text-white backdrop-blur-sm transition hover:border-slate-500 hover:bg-slate-800"
                            >
                                Explore Features
                            </a>
                        </div>
                        <p className="mt-4 text-xs text-slate-400">
                            First 30 days free · Dedicated onboarding assistance · No credit card required
                        </p>
                    </div>
                </section>

                {/* THE CHALLENGES SECTION */}
                <section className="border-t border-slate-100 bg-white py-20 sm:py-28 dark:border-slate-900 dark:bg-slate-950">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                Why estate management breaks down
                            </h2>
                            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                                Most estates don't fail due to lack of effort — they fail because their tools don't talk to each other.
                            </p>
                        </div>

                        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
                            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/50 p-8 dark:border-slate-800/80 dark:bg-slate-900/40">
                                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                                    <Clock className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Gate Congestion & Manual Logs</h3>
                                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    Guards calling residents, illegible paper visitor books, and long queues at the security gate during peak return hours.
                                </p>
                            </div>

                            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/50 p-8 dark:border-slate-800/80 dark:bg-slate-900/40">
                                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                                    <FileSpreadsheet className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Manual Payment Tracking</h3>
                                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    Chasing bank transfer receipts, manually updating Excel sheets, and constant disputes over who has paid estate dues.
                                </p>
                            </div>

                            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/50 p-8 dark:border-slate-800/80 dark:bg-slate-900/40">
                                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                    <Megaphone className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Chaotic WhatsApp Groups</h3>
                                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    Important estate announcements drown in resident chatter, complaints go untracked, and disputes turn public.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* THE SOLUTION PILLARS */}
                <section id="features" className="border-t border-slate-100 bg-slate-50 py-20 sm:py-28 dark:border-slate-900 dark:bg-slate-900/40">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                Everything you need to coordinate estate life
                            </h2>
                            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                                Kontrol equips your administration, guards, and residents with purpose-built tools.
                            </p>
                        </div>

                        <div className="mt-16 space-y-12">
                            {/* Feature 1 */}
                            <div className="grid grid-cols-1 items-center gap-10 rounded-3xl border border-slate-200 bg-white p-8 lg:grid-cols-2 lg:p-12 dark:border-slate-800 dark:bg-slate-950">
                                <div>
                                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                                        <Shield className="h-4 w-4" /> Access Control & Security
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
                                        Frictionless gate operations with instant logs
                                    </h3>
                                    <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
                                        Security guards scan digital visitor passes using a dedicated guard interface. Every entry and exit is logged in real-time with timestamps, visitor details, and host resident verification.
                                    </p>
                                    <ul className="mt-6 space-y-3">
                                        <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                            <CheckCircle2 className="h-4 w-4 text-blue-500" /> One-time and recurring visitor passes
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                            <CheckCircle2 className="h-4 w-4 text-blue-500" /> Instant arrival notifications to host residents
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                            <CheckCircle2 className="h-4 w-4 text-blue-500" /> Complete audit trail of gate traffic
                                        </li>
                                    </ul>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Gate Feed</span>
                                        </div>
                                        <span className="text-xs text-slate-400">Updated seconds ago</span>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {[
                                            { visitor: 'Adewale Johnson', host: 'House 14B, Palm Crescent', status: 'Checked In', time: '14:22' },
                                            { visitor: 'DHL Delivery (Bolaji)', host: 'House 7, Olive Grove', status: 'Checked In', time: '14:18' },
                                            { visitor: 'Engr. Chukwuma', host: 'House 22A, Main Ave', status: 'Checked Out', time: '13:50' },
                                        ].map((row, i) => (
                                            <div key={i} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-xs dark:bg-slate-950">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{row.visitor}</p>
                                                    <p className="text-xs text-slate-500">{row.host}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                                        {row.status}
                                                    </span>
                                                    <p className="mt-1 text-xs text-slate-400">{row.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Feature 2 */}
                            <div className="grid grid-cols-1 items-center gap-10 rounded-3xl border border-slate-200 bg-white p-8 lg:grid-cols-2 lg:p-12 dark:border-slate-800 dark:bg-slate-950">
                                <div className="order-2 lg:order-1 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Service Charge Collections</span>
                                        <span className="text-xs font-bold text-emerald-500">92% Collected</span>
                                    </div>
                                    <div className="mt-6 grid grid-cols-2 gap-4">
                                        <div className="rounded-xl bg-white p-4 dark:bg-slate-950">
                                            <p className="text-xs text-slate-500">Total Billed</p>
                                            <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">₦12.4M</p>
                                            <p className="mt-1 text-xs text-slate-400">Q3 Estate Levy</p>
                                        </div>
                                        <div className="rounded-xl bg-white p-4 dark:bg-slate-950">
                                            <p className="text-xs text-slate-500">Total Received</p>
                                            <p className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">₦11.4M</p>
                                            <p className="mt-1 text-xs text-slate-400">Direct settlements</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="order-1 lg:order-2">
                                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                        <CreditCard className="h-4 w-4" /> Dues & Financial Management
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
                                        Transparent dues collection with automatic receipts
                                    </h3>
                                    <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
                                        Generate recurring or ad-hoc levies, notify residents automatically, allow them to pay securely via debit card or bank transfer, and instantly generate audit-ready receipts.
                                    </p>
                                    <ul className="mt-6 space-y-3">
                                        <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Automated billing cycles & payment reminders
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Instant payment confirmation and digital receipts
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Granular financial reports for ExCo meetings
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Feature 3 */}
                            <div className="grid grid-cols-1 items-center gap-10 rounded-3xl border border-slate-200 bg-white p-8 lg:grid-cols-2 lg:p-12 dark:border-slate-800 dark:bg-slate-950">
                                <div>
                                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-50 px-3.5 py-1 text-xs font-semibold text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                                        <Users className="h-4 w-4" /> Directory & Broadcasts
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
                                        Clean communication without the WhatsApp noise
                                    </h3>
                                    <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
                                        Keep a clean, verified database of homeowners, tenants, and staff. Broadcast urgent announcements with guaranteed delivery, and handle resident maintenance requests privately.
                                    </p>
                                    <ul className="mt-6 space-y-3">
                                        <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                            <CheckCircle2 className="h-4 w-4 text-purple-500" /> Role-based resident & staff directory
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                            <CheckCircle2 className="h-4 w-4 text-purple-500" /> Official broadcasts via push notifications
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                            <CheckCircle2 className="h-4 w-4 text-purple-500" /> Private ticketing for complaints & facility issues
                                        </li>
                                    </ul>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                                    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                                        <div className="flex items-center gap-3">
                                            <Bell className="h-5 w-5 text-purple-500" />
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Official Announcement</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">Scheduled Water Treatment Maintenance</p>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                            The estate water facility will undergo routine maintenance this Saturday between 9:00 AM and 1:00 PM. Please store sufficient water in advance.
                                        </p>
                                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                                            <span>Sent to 142 Households</span>
                                            <span>Delivered · 100%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ONBOARDING TIMELINE */}
                <section className="border-t border-slate-100 bg-white py-20 sm:py-28 dark:border-slate-900 dark:bg-slate-950">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                How onboarding works
                            </h2>
                            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                                We partner directly with your estate committee to ensure zero downtime and smooth adoption.
                            </p>
                        </div>

                        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
                            <div className="rounded-3xl border border-slate-200 p-8 dark:border-slate-800">
                                <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">01</div>
                                <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Discovery & Setup</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    You submit your estate details. We configure your estate boundaries, house numbers, gate policies, and dues structures.
                                </p>
                            </div>

                            <div className="rounded-3xl border border-slate-200 p-8 dark:border-slate-800">
                                <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">02</div>
                                <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Staff & Guard Training</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    We provide hands-on training for your security team and admin personnel using standard mobile devices.
                                </p>
                            </div>

                            <div className="rounded-3xl border border-slate-200 p-8 dark:border-slate-800">
                                <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">03</div>
                                <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Resident Rollout</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    Residents receive direct invitations to download the Kontrol app. Your 30-day free trial begins with live support.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* BOTTOM CTA */}
                <section className="relative overflow-hidden bg-slate-900 py-32 text-center text-white">
                    <div className="relative z-10 mx-auto max-w-4xl px-6">
                        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                            Ready to modernize your estate?
                        </h2>
                        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
                            Join our founding cohort of estates. Get 30 days free, guided setup, and direct access to our product team.
                        </p>
                        <div className="mt-10 flex justify-center">
                            <MagneticButton>
                                <Link
                                    href={apply.url()}
                                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-10 text-lg font-bold text-slate-950 shadow-xl transition hover:bg-slate-100"
                                >
                                    Apply for Your Estate <ArrowRight className="h-5 w-5" />
                                </Link>
                            </MagneticButton>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
