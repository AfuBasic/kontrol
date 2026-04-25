import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
    return (
        <>
            <Head title="Privacy Policy" />

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
                        <h1 className="mb-2 text-3xl font-semibold text-gray-900">Privacy Policy</h1>
                        <p className="mb-8 text-sm text-gray-500">Last updated: February 2026</p>

                        <div className="prose prose-gray max-w-none">
                            <h2 className="mt-8 mb-4 text-xl font-medium text-gray-900">1. Introduction</h2>
                            <p className="mb-4 text-gray-600">
                                Kontrol ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect,
                                use, disclose, and safeguard your information when you use our estate access management platform.
                            </p>

                            <h2 className="mt-8 mb-4 text-xl font-medium text-gray-900">2. Information We Collect</h2>
                            <p className="mb-4 text-gray-600">We collect information that you provide directly to us, including:</p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600">
                                <li>Personal information (name, email address, phone number)</li>
                                <li>Account credentials</li>
                                <li>Visitor information you enter when creating access codes</li>
                                <li>Estate and property information</li>
                                <li>Communication data when you contact us</li>
                            </ul>

                            <h2 className="mt-8 mb-4 text-xl font-medium text-gray-900">3. How We Use Your Information</h2>
                            <p className="mb-4 text-gray-600">We use the information we collect to:</p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600">
                                <li>Provide, maintain, and improve our services</li>
                                <li>Process access codes and visitor management</li>
                                <li>Send notifications about visitor arrivals</li>
                                <li>Communicate with you about updates and security alerts</li>
                                <li>Ensure the security of your estate</li>
                            </ul>

                            <h2 className="mt-8 mb-4 text-xl font-medium text-gray-900">4. Information Sharing</h2>
                            <p className="mb-4 text-gray-600">
                                We do not sell, trade, or rent your personal information to third parties. We may share your information only with
                                estate administrators and security personnel as necessary for access management purposes.
                            </p>

                            <h2 className="mt-8 mb-4 text-xl font-medium text-gray-900">5. Data Security</h2>
                            <p className="mb-4 text-gray-600">
                                We implement appropriate technical and organizational security measures to protect your personal information against
                                unauthorized access, alteration, disclosure, or destruction.
                            </p>

                            <h2 className="mt-8 mb-4 text-xl font-medium text-gray-900">6. Your Rights</h2>
                            <p className="mb-4 text-gray-600">You have the right to:</p>
                            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-600">
                                <li>Access and receive a copy of your personal data</li>
                                <li>Rectify inaccurate personal data</li>
                                <li>Request deletion of your personal data</li>
                                <li>Object to processing of your personal data</li>
                            </ul>

                            <h2 className="mt-8 mb-4 text-xl font-medium text-gray-900">7. Contact Us</h2>
                            <p className="mb-4 text-gray-600">
                                If you have questions about this Privacy Policy, please contact your estate administrator or reach out to us through
                                the app.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
