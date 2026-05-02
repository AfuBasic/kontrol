import LandingLayout from '@/Layouts/LandingLayout';
import SEO from '@/Components/Landing/SEO';
import { motion } from 'framer-motion';
import { 
    Lock, 
    Zap, 
    CreditCard, 
    Shield, 
    Home as HomeIcon,
    ArrowRight,
    CheckCircle2
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { login } from '@/routes';
import landing from '@/routes/landing';

const FeatureDetail = ({ title, description, icon: Icon, color, image, reversed = false }: any) => (
    <section className="py-20 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className={`grid gap-16 lg:grid-cols-2 lg:items-center ${reversed ? 'lg:direction-rtl' : ''}`}>
                <motion.div 
                    initial={{ opacity: 0, x: reversed ? 30 : -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className={reversed ? 'lg:order-2' : ''}
                >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color} shadow-lg shadow-current/10`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
                    <p className="mt-6 text-lg font-medium leading-relaxed text-slate-500">
                        {description}
                    </p>
                    <ul className="mt-10 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <li key={i} className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <span className="text-sm font-bold text-slate-700">Premium feature capability {i}</span>
                            </li>
                        ))}
                    </ul>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className={`relative ${reversed ? 'lg:order-1' : ''}`}
                >
                    <div className="aspect-square rounded-[3rem] bg-slate-100 overflow-hidden shadow-2xl ring-1 ring-slate-200">
                        <div className="h-full w-full bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center p-12">
                             {/* Placeholder for specific feature illustration or screenshots */}
                             <Icon className={`h-32 w-32 ${color.split(' ')[1]}`} />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    </section>
);

export default function Features() {
    return (
        <LandingLayout>
            <SEO 
                title="Powerful Features for Modern Estates" 
                description="Explore Kontrol's robust suite of tools: from visitor access codes and SOS emergency alerts to automated collection tracking and household management."
            />

            {/* --- HEADER --- */}
            <header className="relative bg-primary-900 pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden text-center">
                <div className="absolute top-0 left-0 h-full w-full opacity-10">
                    <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary-500 blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-primary-500 blur-3xl animate-pulse delay-1000" />
                </div>
                
                <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
                            The Complete <span className="text-primary-400">Toolkit</span> for Estate Operations.
                        </h1>
                        <p className="mt-8 text-xl font-medium text-primary-100 leading-relaxed max-w-2xl mx-auto">
                            We've built a multi-layered ecosystem that solves the most complex challenges of residential living.
                        </p>
                    </motion.div>
                </div>
            </header>

            {/* --- VISUAL HIGHLIGHT --- */}
            <section className="py-20 -mt-12">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="overflow-hidden rounded-[3rem] bg-white shadow-2xl shadow-primary-900/10 ring-1 ring-slate-200"
                    >
                        <img 
                            src="/images/landing/features.png" 
                            alt="Kontrol Platform Features" 
                            className="w-full object-cover"
                        />
                    </motion.div>
                </div>
            </section>

            {/* --- FEATURE SECTIONS --- */}
            <FeatureDetail 
                title="Visitor Access Codes"
                description="Secure your estate with expiring, one-time-use digital keys. Residents generate codes for guests, and security validates them at the gatehouse with a simple scan."
                icon={Lock}
                color="bg-primary-50 text-primary-600"
            />

            <FeatureDetail 
                title="SOS Emergency System"
                description="Safety is just a tap away. Our SOS system instantly alerts estate security and designated emergency contacts with real-time location data when triggered by a resident."
                icon={Zap}
                color="bg-rose-50 text-rose-600"
                reversed
            />

            <FeatureDetail 
                title="Collections & Billing"
                description="Automate the heavy lifting of estate financial operations. Track dues, manage recurring bills, and provide residents with instant digital receipts—all synchronized with the estate bank account."
                icon={CreditCard}
                color="bg-emerald-50 text-emerald-600"
            />

            <FeatureDetail 
                title="Household Management"
                description="Organize everything related to your home in one place. Manage family members, register vehicles for gatehouse clearance, and authorize domestic staff access."
                icon={HomeIcon}
                color="bg-amber-50 text-amber-600"
                reversed
            />

            <FeatureDetail 
                title="Security Dashboard"
                description="Empower your security personnel with a real-time command center. Validate visitors, monitor estate activity logs, and respond to SOS alerts from a unified mobile-first interface."
                icon={Shield}
                color="bg-slate-900 text-white"
            />

            {/* --- FINAL CTA --- */}
            <section className="py-24 bg-slate-50">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Everything you need, nothing you don't.
                    </h2>
                    <div className="mt-12 flex flex-wrap justify-center gap-4">
                        <Link
                            href={login().url}
                            className="flex h-14 items-center justify-center rounded-2xl bg-primary-700 px-10 text-lg font-bold text-white shadow-xl shadow-primary-700/20 transition-all hover:bg-primary-800 hover:scale-105"
                        >
                            Get Started
                        </Link>
                        <Link
                            href={landing.mobile().url}
                            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-lg font-bold text-slate-900 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50"
                        >
                            See Mobile Experience
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
