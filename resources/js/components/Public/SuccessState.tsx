import { motion } from 'framer-motion';
import { CheckCircle, Sparkles } from 'lucide-react';

interface Props {
    estateName: string;
}

export default function SuccessState({ estateName }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="py-8 text-center"
        >
            {/* Success Icon */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center"
            >
                <div className="absolute inset-0 rounded-full bg-emerald-100" />
                <div className="absolute inset-2 rounded-full bg-emerald-50" />
                <CheckCircle className="relative h-10 w-10 text-emerald-500" strokeWidth={2} />

                {/* Sparkles */}
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="absolute -top-1 -right-1"
                >
                    <Sparkles className="h-5 w-5 text-amber-400" />
                </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-slate-900"
            >
                Application Received!
            </motion.h3>

            {/* Message */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-4 space-y-3">
                <p className="text-base text-slate-600">
                    Thanks for applying, <span className="font-medium text-slate-900">{estateName}</span>!
                </p>
                <p className="text-sm text-slate-500">We'll review your application and reach out within 24-48 hours to get you set up.</p>
            </motion.div>

            {/* What's Next */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 rounded-xl border border-slate-100 bg-slate-50/50 p-5"
            >
                <h4 className="text-sm font-semibold text-slate-700">What happens next?</h4>
                <ul className="mt-3 space-y-2 text-left text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                            1
                        </span>
                        <span>We review your estate details</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                            2
                        </span>
                        <span>Our team reaches out to schedule setup</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                            3
                        </span>
                        <span>We help you onboard residents and security</span>
                    </li>
                </ul>
            </motion.div>

            {/* Contact Note */}
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-6 text-xs text-slate-400">
                Questions? Email us at{' '}
                <a href="mailto:hello@usekontrol.com" className="text-blue-500 hover:underline">
                    hello@usekontrol.com
                </a>
            </motion.p>
        </motion.div>
    );
}
