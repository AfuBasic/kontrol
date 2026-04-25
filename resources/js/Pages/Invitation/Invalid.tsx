import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function InvalidInvitation() {
    return (
        <>
            <Head title="Invalid Invitation - Kontrol" />

            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full max-w-md text-center"
                >
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                        <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-semibold text-gray-900">Invalid or Expired Invitation</h1>
                    <p className="mt-3 text-gray-500">This invitation link is either invalid, has expired, or has already been used.</p>
                    <p className="mt-2 text-gray-500">Please contact your platform administrator for a new invitation.</p>

                    <Link
                        href="/"
                        className="mt-8 inline-block rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                    >
                        Go to Homepage
                    </Link>
                </motion.div>
            </div>
        </>
    );
}
