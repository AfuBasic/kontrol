import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import PublicLayout from '@/layouts/PublicLayout';

export default function Terms() {
    const lastUpdated = 'February 2026';

    return (
        <PublicLayout>
            <Head title="Terms of Service - Kontrol">
                {/* Primary Meta Tags */}
                <meta
                    name="description"
                    content="Read Kontrol's Terms of Service. Understand your rights and responsibilities when using our estate access management platform, including account usage, data policies, and service guidelines."
                />
                <meta name="robots" content="index, follow" />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://usekontrol.com/terms" />
                <meta property="og:title" content="Terms of Service - Kontrol" />
                <meta
                    property="og:description"
                    content="Read Kontrol's Terms of Service. Understand your rights and responsibilities when using our estate access management platform."
                />
                <meta property="og:image" content="https://usekontrol.com/assets/images/og-image.png" />
                <meta property="og:site_name" content="Kontrol" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Terms of Service - Kontrol" />
                <meta
                    name="twitter:description"
                    content="Read Kontrol's Terms of Service. Understand your rights and responsibilities when using our estate access management platform."
                />
                <meta name="twitter:image" content="https://usekontrol.com/assets/images/og-image.png" />

                {/* Canonical URL */}
                <link rel="canonical" href="https://usekontrol.com/terms" />
            </Head>

            <div className="bg-gradient-to-b from-slate-50 to-white py-16 lg:py-24">
                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        {/* Header */}
                        <div className="mb-12 text-center">
                            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
                            <p className="mt-4 text-slate-500">Last updated: {lastUpdated}</p>
                        </div>

                        {/* Content */}
                        <div className="prose prose-slate prose-lg mx-auto max-w-none">
                            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm lg:p-12">
                                {/* Agreement */}
                                <section>
                                    <h2 className="text-2xl font-semibold text-slate-900">1. Agreement to Terms</h2>
                                    <p className="mt-4 text-slate-600">
                                        By accessing or using Kontrol (the "Service"), you agree to be bound by these Terms of Service
                                        ("Terms"). If you disagree with any part of these terms, you may not access the Service.
                                    </p>
                                    <p className="mt-4 text-slate-600">
                                        These Terms apply to all visitors, users, and others who access or use the Service, including
                                        residents, security personnel, and estate administrators.
                                    </p>
                                </section>

                                {/* Description of Service */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">2. Description of Service</h2>
                                    <p className="mt-4 text-slate-600">
                                        Kontrol is an estate access management platform that enables:
                                    </p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
                                        <li>Residents to generate digital access codes for visitors</li>
                                        <li>Security personnel to validate access codes at estate gates</li>
                                        <li>Administrators to manage estate settings, users, and access policies</li>
                                        <li>Real-time notifications and communication within estates</li>
                                        <li>Activity logging and audit trails for security purposes</li>
                                    </ul>
                                    <p className="mt-4 text-slate-600">
                                        The Service is provided "as is" and we reserve the right to modify, suspend, or discontinue any
                                        aspect of the Service at any time.
                                    </p>
                                </section>

                                {/* Account Registration */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">3. Account Registration</h2>
                                    <p className="mt-4 text-slate-600">
                                        To use certain features of the Service, you must register for an account. When you register, you
                                        agree to:
                                    </p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
                                        <li>Provide accurate, current, and complete information</li>
                                        <li>Maintain and promptly update your account information</li>
                                        <li>Keep your password secure and confidential</li>
                                        <li>
                                            Accept responsibility for all activities that occur under your account
                                        </li>
                                        <li>
                                            Notify us immediately of any unauthorized use of your account
                                        </li>
                                    </ul>
                                    <p className="mt-4 text-slate-600">
                                        We reserve the right to refuse service, terminate accounts, or remove content at our sole
                                        discretion.
                                    </p>
                                </section>

                                {/* User Responsibilities */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">4. User Responsibilities</h2>
                                    <p className="mt-4 text-slate-600">As a user of the Service, you agree to:</p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
                                        <li>Use the Service only for lawful purposes and in accordance with these Terms</li>
                                        <li>
                                            Generate access codes only for legitimate visitors whom you are authorized to invite
                                        </li>
                                        <li>Not share your account credentials with others</li>
                                        <li>
                                            Not attempt to gain unauthorized access to any part of the Service or other accounts
                                        </li>
                                        <li>
                                            Not use the Service to transmit malicious code, spam, or harmful content
                                        </li>
                                        <li>
                                            Not interfere with or disrupt the Service or servers connected to the Service
                                        </li>
                                        <li>Comply with all applicable laws and regulations</li>
                                    </ul>
                                </section>

                                {/* Acceptable Use */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">5. Acceptable Use Policy</h2>
                                    <p className="mt-4 text-slate-600">You may not use the Service to:</p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
                                        <li>Violate any local, state, national, or international law or regulation</li>
                                        <li>
                                            Harass, abuse, threaten, or intimidate other users or third parties
                                        </li>
                                        <li>
                                            Impersonate any person or entity, or falsely state or misrepresent your affiliation
                                        </li>
                                        <li>
                                            Collect or store personal data about other users without their consent
                                        </li>
                                        <li>
                                            Use automated systems, bots, or scripts to access or interact with the Service
                                        </li>
                                        <li>
                                            Attempt to reverse engineer, decompile, or extract source code from the Service
                                        </li>
                                        <li>
                                            Circumvent any access control, security, or usage limitation features
                                        </li>
                                    </ul>
                                </section>

                                {/* Administrator Responsibilities */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">6. Estate Administrator Responsibilities</h2>
                                    <p className="mt-4 text-slate-600">If you are an estate administrator, you additionally agree to:</p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
                                        <li>
                                            Ensure that all users within your estate are authorized to use the Service
                                        </li>
                                        <li>
                                            Manage user roles and permissions responsibly
                                        </li>
                                        <li>
                                            Respond to user inquiries and access requests in a timely manner
                                        </li>
                                        <li>
                                            Maintain accurate estate information within the Service
                                        </li>
                                        <li>
                                            Comply with applicable data protection laws regarding resident data
                                        </li>
                                        <li>
                                            Not use the Service to discriminate against or unfairly treat any individual
                                        </li>
                                    </ul>
                                </section>

                                {/* Intellectual Property */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">7. Intellectual Property</h2>
                                    <p className="mt-4 text-slate-600">
                                        The Service and its original content, features, and functionality are and will remain the
                                        exclusive property of Kontrol and its licensors. The Service is protected by copyright,
                                        trademark, and other laws.
                                    </p>
                                    <p className="mt-4 text-slate-600">
                                        Our trademarks and trade dress may not be used in connection with any product or service without
                                        prior written consent. You are granted a limited, non-exclusive, non-transferable license to use
                                        the Service for its intended purpose.
                                    </p>
                                </section>

                                {/* Data and Privacy */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">8. Data and Privacy</h2>
                                    <p className="mt-4 text-slate-600">
                                        Your use of the Service is also governed by our{' '}
                                        <Link href="/privacy" className="text-blue-600 hover:underline">
                                            Privacy Policy
                                        </Link>
                                        , which explains how we collect, use, and protect your data. By using the Service, you consent to
                                        the collection and use of information as described in the Privacy Policy.
                                    </p>
                                    <p className="mt-4 text-slate-600">
                                        You retain ownership of any data you submit to the Service. By submitting data, you grant us a
                                        license to use, store, and process that data to provide the Service to you.
                                    </p>
                                </section>

                                {/* Disclaimers */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">9. Disclaimers</h2>
                                    <p className="mt-4 text-slate-600">
                                        THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND,
                                        EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
                                    </p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
                                        <li>IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE</li>
                                        <li>WARRANTIES OF NON-INFRINGEMENT</li>
                                        <li>WARRANTIES THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE</li>
                                        <li>WARRANTIES REGARDING THE ACCURACY OR RELIABILITY OF ANY INFORMATION OBTAINED THROUGH THE SERVICE</li>
                                    </ul>
                                    <p className="mt-4 text-slate-600">
                                        We do not guarantee that the Service will meet your specific requirements or achieve any
                                        particular results. You use the Service at your own risk.
                                    </p>
                                </section>

                                {/* Limitation of Liability */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">10. Limitation of Liability</h2>
                                    <p className="mt-4 text-slate-600">
                                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, KONTROL AND ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS,
                                        SUPPLIERS, OR AFFILIATES SHALL NOT BE LIABLE FOR:
                                    </p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
                                        <li>
                                            Any indirect, incidental, special, consequential, or punitive damages
                                        </li>
                                        <li>
                                            Loss of profits, data, use, goodwill, or other intangible losses
                                        </li>
                                        <li>
                                            Unauthorized access to or alteration of your transmissions or data
                                        </li>
                                        <li>
                                            Any security breaches or failures of third-party systems
                                        </li>
                                        <li>
                                            Any physical security incidents at your estate, even if the Service was used
                                        </li>
                                    </ul>
                                    <p className="mt-4 text-slate-600">
                                        The Service is a tool to assist with access management. Ultimate responsibility for estate
                                        security remains with the estate and its authorized personnel.
                                    </p>
                                </section>

                                {/* Indemnification */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">11. Indemnification</h2>
                                    <p className="mt-4 text-slate-600">
                                        You agree to defend, indemnify, and hold harmless Kontrol and its affiliates, directors,
                                        officers, employees, and agents from any claims, damages, liabilities, costs, or expenses
                                        (including reasonable attorneys' fees) arising from:
                                    </p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
                                        <li>Your use of the Service</li>
                                        <li>Your violation of these Terms</li>
                                        <li>Your violation of any rights of another party</li>
                                        <li>Any content you submit or transmit through the Service</li>
                                    </ul>
                                </section>

                                {/* Termination */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">12. Termination</h2>
                                    <p className="mt-4 text-slate-600">
                                        We may terminate or suspend your account and access to the Service immediately, without prior
                                        notice or liability, for any reason, including:
                                    </p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
                                        <li>Breach of these Terms</li>
                                        <li>Request by law enforcement or government agencies</li>
                                        <li>Discontinuation or material modification of the Service</li>
                                        <li>Unexpected technical or security issues</li>
                                        <li>Extended periods of inactivity</li>
                                    </ul>
                                    <p className="mt-4 text-slate-600">
                                        Upon termination, your right to use the Service will immediately cease. Provisions of these
                                        Terms that by their nature should survive termination will survive.
                                    </p>
                                </section>

                                {/* Governing Law */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">13. Governing Law</h2>
                                    <p className="mt-4 text-slate-600">
                                        These Terms shall be governed by and construed in accordance with the laws of the jurisdiction
                                        in which Kontrol operates, without regard to its conflict of law provisions.
                                    </p>
                                    <p className="mt-4 text-slate-600">
                                        Any disputes arising from these Terms or the Service shall be resolved through binding
                                        arbitration or in the courts of competent jurisdiction, at our discretion.
                                    </p>
                                </section>

                                {/* Changes to Terms */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">14. Changes to Terms</h2>
                                    <p className="mt-4 text-slate-600">
                                        We reserve the right to modify or replace these Terms at any time. We will provide notice of any
                                        material changes by posting the new Terms on this page and updating the "Last updated" date.
                                    </p>
                                    <p className="mt-4 text-slate-600">
                                        Your continued use of the Service after any changes constitutes acceptance of the new Terms. If
                                        you do not agree to the new terms, please stop using the Service.
                                    </p>
                                </section>

                                {/* Severability */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">15. Severability</h2>
                                    <p className="mt-4 text-slate-600">
                                        If any provision of these Terms is held to be unenforceable or invalid, such provision will be
                                        modified to the minimum extent necessary to make it enforceable, or if modification is not
                                        possible, severed from these Terms. The remaining provisions will continue in full force and
                                        effect.
                                    </p>
                                </section>

                                {/* Entire Agreement */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">16. Entire Agreement</h2>
                                    <p className="mt-4 text-slate-600">
                                        These Terms, together with our Privacy Policy and any other legal notices published by us on the
                                        Service, constitute the entire agreement between you and Kontrol concerning the Service and
                                        supersede all prior agreements, understandings, and representations.
                                    </p>
                                </section>

                                {/* Contact Information */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">17. Contact Us</h2>
                                    <p className="mt-4 text-slate-600">
                                        If you have any questions about these Terms, please contact us:
                                    </p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
                                        <li>
                                            <strong>Email:</strong>{' '}
                                            <a href="mailto:legal@usekontrol.com" className="text-blue-600 hover:underline">
                                                legal@usekontrol.com
                                            </a>
                                        </li>
                                        <li>Through your estate administrator</li>
                                    </ul>
                                </section>
                            </div>
                        </div>

                        {/* Back link */}
                        <div className="mt-8 text-center">
                            <Link href="/" className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-800">
                                &larr; Back to Home
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </PublicLayout>
    );
}
