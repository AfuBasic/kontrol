import { motion } from 'framer-motion';
import { Check, Mail, Settings, Users } from 'lucide-react';

interface Props {
    estateName: string;
}

function ConfettiPiece({ delay, x, color }: { delay: number; x: number; color: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 0, x, rotate: 0 }}
            animate={{
                opacity: [0, 1, 1, 0],
                y: [0, -60, -40, 60],
                x: [x, x + (Math.random() - 0.5) * 40, x + (Math.random() - 0.5) * 60],
                rotate: [0, 180, 360, 540],
            }}
            transition={{
                duration: 1.5,
                delay,
                ease: 'easeOut',
            }}
            className="absolute top-1/2 left-1/2"
            style={{ width: 8, height: 8, backgroundColor: color, borderRadius: 2 }}
        />
    );
}

const confettiColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function SuccessState({ estateName }: Props) {
    const steps = [
        {
            icon: Settings,
            title: 'Application Review',
            description: 'We review your estate details',
            color: 'bg-blue-600',
        },
        {
            icon: Mail,
            title: 'Personal Outreach',
            description: 'Our team reaches out to schedule setup',
            color: 'bg-violet-600',
        },
        {
            icon: Users,
            title: 'Onboarding',
            description: 'We help you onboard residents and security',
            color: 'bg-emerald-600',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="py-6 text-center"
        >
            {/* Success Icon with Confetti */}
            <div className="relative mx-auto mb-8 flex h-28 w-28 items-center justify-center">
                {/* Confetti pieces */}
                {confettiColors.map((color, i) => (
                    <ConfettiPiece key={`left-${i}`} delay={0.3 + i * 0.05} x={-20 - i * 5} color={color} />
                ))}
                {confettiColors.map((color, i) => (
                    <ConfettiPiece key={`right-${i}`} delay={0.35 + i * 0.05} x={20 + i * 5} color={color} />
                ))}

                {/* Animated rings */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50"
                />
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.5 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
                    className="absolute -inset-3 rounded-full border-2 border-emerald-200"
                />
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.3 }}
                    transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
                    className="absolute -inset-6 rounded-full border border-emerald-100"
                />

                {/* Check icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
                    className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30"
                >
                    <Check className="h-8 w-8 text-white" strokeWidth={3} />
                </motion.div>
            </div>

            {/* Title */}
            <motion.h3
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-2xl font-bold tracking-tight text-slate-900"
            >
                Application Received!
            </motion.h3>

            {/* Estate name */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {estateName}
                </span>
            </motion.div>

            {/* Message */}
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-4 text-base text-slate-600">
                We'll review your application and reach out within <span className="font-semibold text-slate-900">24-48 hours</span>.
            </motion.p>

            {/* What's Next Timeline */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-6"
            >
                <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-slate-500">What happens next</h4>

                <div className="space-y-4">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.title}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className="flex items-start gap-4 text-left"
                        >
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${step.color} shadow-lg`}>
                                <step.icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="pt-0.5">
                                <p className="font-semibold text-slate-900">{step.title}</p>
                                <p className="text-sm text-slate-500">{step.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Contact */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-6">
                <p className="text-sm text-slate-500">
                    Questions? Email us at{' '}
                    <a
                        href="mailto:hello@usekontrol.com"
                        className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 transition-colors hover:decoration-slate-900"
                    >
                        hello@usekontrol.com
                    </a>
                </p>
            </motion.div>
        </motion.div>
    );
}
