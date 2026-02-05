import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function TermsOfService() {
    return (
        <>
            <Head title="Terms of Service" />

            <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
                <motion.div
                    className="mx-auto max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header */}
                    <div className="mb-8">
                        <a href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to login
                        </a>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
                        <h1 className="mb-2 text-3xl font-semibold text-gray-900">Terms of Service</h1>
                        <p className="mb-8 text-sm text-gray-500">Last updated: February 2026</p>

                        <div className="prose prose-gray max-w-none">
                            <h2 className="mt-8 mb-4 text-xl font-medium text-gray-900">1. Acceptance of Terms</h2>
                            <p className="mb-4 text-gray-600">
                                By accessing or using Kontrol, you agree to be bound by these Terms of Service. If you do not agree to these terms,
                                you may not use our services.
                            </p>

                            <h2 className="mt-8 mb-4 text-xl font-medium text-gray-900">2. Description of Service</h2>
                            <p className="mb-4 text-gray-600">
                                Kontrol is an estate access management platform that enables residents to create access codes for visitors, and
                                security personnel to verify these codes at entry points.
                            </p>

                            <h2 className="mt-8 mb-4 text-xl font-medium text-gray-900">3. User Accounts</h2>
                            <p className="mb-4 text-gray-600">You are responsible for:</p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600">
                                <li>Maintaining the confidentiality of your account credentials</li>
                                <li>All activities that occur under your account</li>
                                <li>Notifying us immediately of any unauthorized use</li>
                                <li>Ensuring that your account information is accurate and up-to-date</li>
                            </ul>

                            <h2 className="mt-8 mb-4 text-xl font-medium text-gray-900">4. Acceptable Use</h2>
                            <p className="mb-4 text-gray-600">You agree not to:</p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600">
                                <li>Use the service for any unlawful purpose</li>
                                <li>Share access codes with unauthorized individuals</li>
                                <li>Attempt to gain unauthorized access to any part of the service</li>
                                <li>Interfere with or disrupt the service or servers</li>
                                <li>Impersonate any person or entity</li>
                            </ul>

                            <h2 className="mt-8 mb-4 text-xl font-medium text-gray-900">5. Access Codes</h2>
                            <p className="mb-4 text-gray-600">
                                Access codes generated through Kontrol are for authorized visitor entry only. You are responsible for ensuring that
                                access codes are shared only with intended visitors. Single-use codes expire after first use; long-lived codes remain
                                active until revoked.
                            </p>

                            <h2 className="mt-8 mb-4 text-xl font-medium text-gray-900">6. Limitation of Liability</h2>
                            <p className="mb-4 text-gray-600">
                                Kontrol is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental,
                                special, consequential, or punitive damages arising from your use of the service.
                            </p>

                            <h2 className="mt-8 mb-4 text-xl font-medium text-gray-900">7. Modifications to Service</h2>
                            <p className="mb-4 text-gray-600">
                                We reserve the right to modify or discontinue the service at any time without notice. We shall not be liable to you or
                                any third party for any modification, suspension, or discontinuance.
                            </p>

                            <h2 className="mt-8 mb-4 text-xl font-medium text-gray-900">8. Termination</h2>
                            <p className="mb-4 text-gray-600">
                                We may terminate or suspend your account immediately, without prior notice, for any breach of these Terms. Upon
                                termination, your right to use the service will immediately cease.
                            </p>

                            <h2 className="mt-8 mb-4 text-xl font-medium text-gray-900">9. Governing Law</h2>
                            <p className="mb-4 text-gray-600">
                                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which your estate is
                                located.
                            </p>

                            <h2 className="mt-8 mb-4 text-xl font-medium text-gray-900">10. Contact</h2>
                            <p className="mb-4 text-gray-600">For questions about these Terms, please contact your estate administrator.</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
