import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Mail, ShieldCheck, Rocket } from 'lucide-react';

interface Props {
    estate: string;
    requires_approval: boolean;
}

export default function JoinSuccess({ estate, requires_approval }: Props) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F0F5FF] p-6 text-center">
            <Head title={requires_approval ? "Registration Successful" : "Welcome to " + estate} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg rounded-3xl bg-white p-12 shadow-2xl ring-1 ring-black/5"
            >
                <div className="flex justify-center">
                    <div className="relative">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                            className="flex h-24 w-24 items-center justify-center rounded-full bg-green-50 text-green-500"
                        >
                            <CheckCircle2 className="h-12 w-12" />
                        </motion.div>
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 0, 0.5],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-full bg-green-400"
                        />
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8"
                >
                    <h1 className="text-3xl font-bold text-gray-900">
                        {requires_approval ? 'Request Received!' : 'Almost There!'}
                    </h1>
                    <p className="mt-4 text-lg text-gray-600">
                        {requires_approval ? (
                            <>Your application to join <span className="font-bold text-primary-600">{estate}</span> has been submitted. Next step: confirm your email.</>
                        ) : (
                            <>Welcome to <span className="font-bold text-primary-600">{estate}</span>! Your account is created. Just one more step to unlock access.</>
                        )}
                    </p>
                </motion.div>

                <div className="mt-12 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-start gap-4 rounded-2xl bg-blue-50 p-4 text-left ring-1 ring-blue-100"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                            <Mail className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Verify Your Email</p>
                            <p className="text-sm text-gray-500">We've sent a verification link to your inbox. Please click it to activate your account.</p>
                        </div>
                    </motion.div>

                    {requires_approval && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                            className="flex items-start gap-4 rounded-2xl bg-gray-50 p-4 text-left"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                                <Clock className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Admin Approval</p>
                                <p className="text-sm text-gray-500">Once verified, the estate administrators will review and approve your application.</p>
                            </div>
                        </motion.div>
                    )}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-12"
                >
                    <Link
                        href="/login"
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-primary-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-700 hover:shadow-primary-500/40"
                    >
                        {requires_approval ? 'Return to Login' : 'Login to Your Account'}
                    </Link>
                </motion.div>

                <div className="mt-8 flex justify-center gap-2 text-sm text-gray-400">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Powered by Kontrol Secure Onboarding</span>
                </div>
            </motion.div>
        </div>
    );
}
