import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import PublicLayout from '@/layouts/PublicLayout';

export default function Privacy() {
    const lastUpdated = 'February 2026';

    return (
        <PublicLayout>
            <Head title="Privacy Policy - Kontrol">
                {/* Primary Meta Tags */}
                <meta
                    name="description"
                    content="Learn how Kontrol collects, uses, and protects your data. Our privacy policy explains our commitment to data security, Google OAuth data handling, and your privacy rights."
                />
                <meta name="robots" content="index, follow" />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://usekontrol.com/privacy" />
                <meta property="og:title" content="Privacy Policy - Kontrol" />
                <meta
                    property="og:description"
                    content="Learn how Kontrol collects, uses, and protects your data. Our privacy policy explains our commitment to data security and your privacy rights."
                />
                <meta property="og:image" content="https://usekontrol.com/assets/images/og-image.png" />
                <meta property="og:site_name" content="Kontrol" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Privacy Policy - Kontrol" />
                <meta
                    name="twitter:description"
                    content="Learn how Kontrol collects, uses, and protects your data. Our privacy policy explains our commitment to data security and your privacy rights."
                />
                <meta name="twitter:image" content="https://usekontrol.com/assets/images/og-image.png" />

                {/* Canonical URL */}
                <link rel="canonical" href="https://usekontrol.com/privacy" />
            </Head>

            <div className="bg-gradient-to-b from-slate-50 to-white py-16 lg:py-24">
                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        {/* Header */}
                        <div className="mb-12 text-center">
                            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
                            <p className="mt-4 text-slate-500">Last updated: {lastUpdated}</p>
                        </div>

                        {/* Content */}
                        <div className="prose prose-slate prose-lg mx-auto max-w-none">
                            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm lg:p-12">
                                {/* Introduction */}
                                <section>
                                    <h2 className="text-2xl font-semibold text-slate-900">1. Introduction</h2>
                                    <p className="mt-4 text-slate-600">
                                        Kontrol ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains
                                        how we collect, use, disclose, and safeguard your information when you use our estate access
                                        management platform (the "Service").
                                    </p>
                                    <p className="mt-4 text-slate-600">
                                        By accessing or using Kontrol, you agree to this Privacy Policy. If you do not agree with the terms
                                        of this privacy policy, please do not access the Service.
                                    </p>
                                </section>

                                {/* Information We Collect */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">2. Information We Collect</h2>

                                    <h3 className="mt-6 text-lg font-semibold text-slate-800">2.1 Personal Information</h3>
                                    <p className="mt-3 text-slate-600">
                                        We collect information that you provide directly to us when you create an account or use our
                                        Service:
                                    </p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
                                        <li>
                                            <strong>Account information:</strong> Name, email address, phone number, and password
                                        </li>
                                        <li>
                                            <strong>Profile information:</strong> Profile photo (optional), unit/house number within your
                                            estate
                                        </li>
                                        <li>
                                            <strong>Visitor information:</strong> Names and purposes of visit for visitors you create access
                                            codes for
                                        </li>
                                        <li>
                                            <strong>Estate information:</strong> Estate name and associated property details (for
                                            administrators)
                                        </li>
                                        <li>
                                            <strong>Communication data:</strong> Messages sent through the platform and support inquiries
                                        </li>
                                    </ul>

                                    <h3 className="mt-6 text-lg font-semibold text-slate-800">2.2 Automatically Collected Information</h3>
                                    <p className="mt-3 text-slate-600">When you use the Service, we automatically collect:</p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
                                        <li>
                                            <strong>Usage data:</strong> Access times, pages viewed, and actions taken within the Service
                                        </li>
                                        <li>
                                            <strong>Device information:</strong> Device type, operating system, and browser type
                                        </li>
                                        <li>
                                            <strong>Log data:</strong> IP address, access times, and referring URLs
                                        </li>
                                    </ul>
                                </section>

                                {/* Google User Data Disclosure - CRITICAL SECTION */}
                                <section className="mt-10 rounded-xl border-2 border-blue-200 bg-blue-50 p-6">
                                    <h2 className="text-2xl font-semibold text-blue-900">3. Google User Data Disclosure</h2>
                                    <p className="mt-4 text-blue-800">
                                        Kontrol offers sign-in with Google OAuth for convenient and secure authentication. This section
                                        explains how we handle data received from Google.
                                    </p>

                                    <h3 className="mt-6 text-lg font-semibold text-blue-900">3.1 What Google Data We Access</h3>
                                    <p className="mt-3 text-blue-800">When you sign in with Google, we access the following information:</p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-blue-800">
                                        <li>
                                            <strong>Email address:</strong> Used to identify your account and for communication
                                        </li>
                                        <li>
                                            <strong>Name:</strong> Used to personalize your experience within the app
                                        </li>
                                        <li>
                                            <strong>Profile picture:</strong> Displayed within the app interface (optional)
                                        </li>
                                        <li>
                                            <strong>Google ID:</strong> Used to securely link your Google account to your Kontrol account
                                        </li>
                                    </ul>

                                    <h3 className="mt-6 text-lg font-semibold text-blue-900">3.2 How We Use Google Data</h3>
                                    <p className="mt-3 text-blue-800">Google user data is used exclusively for:</p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-blue-800">
                                        <li>Authenticating your identity and providing secure access to the Service</li>
                                        <li>Creating and maintaining your user account</li>
                                        <li>Displaying your name and profile picture within the app</li>
                                        <li>Sending essential service communications to your email address</li>
                                    </ul>

                                    <h3 className="mt-6 text-lg font-semibold text-blue-900">3.3 What We Do NOT Do with Google Data</h3>
                                    <p className="mt-3 text-blue-800">We commit to the following restrictions:</p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-blue-800">
                                        <li>
                                            <strong>We do NOT sell</strong> your Google data to any third parties
                                        </li>
                                        <li>
                                            <strong>We do NOT share</strong> your Google data with advertisers or marketing companies
                                        </li>
                                        <li>
                                            <strong>We do NOT use</strong> your Google data for purposes unrelated to the core functionality
                                            of Kontrol
                                        </li>
                                        <li>
                                            <strong>We do NOT transfer</strong> your Google data to third parties except as necessary to
                                            provide the Service
                                        </li>
                                    </ul>

                                    <h3 className="mt-6 text-lg font-semibold text-blue-900">3.4 Data Storage and Security</h3>
                                    <p className="mt-3 text-blue-800">
                                        Google data is stored securely in our encrypted database. We implement industry-standard security
                                        measures to protect this data from unauthorized access, alteration, or disclosure.
                                    </p>

                                    <h3 className="mt-6 text-lg font-semibold text-blue-900">3.5 Revoking Access</h3>
                                    <p className="mt-3 text-blue-800">
                                        You can revoke Kontrol's access to your Google data at any time by visiting your{' '}
                                        <a
                                            href="https://myaccount.google.com/permissions"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-blue-700 underline hover:text-blue-900"
                                        >
                                            Google Account Permissions
                                        </a>{' '}
                                        page. Revoking access will disconnect your Google account from Kontrol, but your Kontrol account
                                        and data will remain until you request deletion.
                                    </p>
                                </section>

                                {/* How We Use Your Information */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">4. How We Use Your Information</h2>
                                    <p className="mt-4 text-slate-600">We use the information we collect to:</p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
                                        <li>Provide, maintain, and improve the Service</li>
                                        <li>Process and manage access codes for visitor management</li>
                                        <li>Facilitate communication between residents, security personnel, and administrators</li>
                                        <li>Send notifications about visitor arrivals and estate announcements</li>
                                        <li>Ensure the security of your estate through access logging</li>
                                        <li>Respond to your comments, questions, and support requests</li>
                                        <li>Monitor and analyze trends, usage, and activities in connection with our Service</li>
                                        <li>Detect, investigate, and prevent security incidents and fraudulent transactions</li>
                                    </ul>
                                </section>

                                {/* Information Sharing */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">5. Information Sharing</h2>
                                    <p className="mt-4 text-slate-600">
                                        We do not sell, trade, or rent your personal information to third parties. We may share your
                                        information in the following limited circumstances:
                                    </p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
                                        <li>
                                            <strong>Within your estate:</strong> Your name and relevant information may be visible to estate
                                            administrators and security personnel for access management purposes
                                        </li>
                                        <li>
                                            <strong>Service providers:</strong> We may share information with third-party vendors who assist
                                            us in operating the Service (e.g., hosting, email delivery, analytics)
                                        </li>
                                        <li>
                                            <strong>Legal requirements:</strong> We may disclose information if required by law, subpoena, or
                                            other legal process
                                        </li>
                                        <li>
                                            <strong>Protection of rights:</strong> We may disclose information to protect our rights,
                                            property, or safety, or that of our users or others
                                        </li>
                                    </ul>
                                </section>

                                {/* Data Security */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">6. Data Security</h2>
                                    <p className="mt-4 text-slate-600">
                                        We implement appropriate technical and organizational security measures to protect your personal
                                        information against unauthorized access, alteration, disclosure, or destruction. These measures
                                        include:
                                    </p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
                                        <li>Encryption of data in transit using TLS/SSL</li>
                                        <li>Encryption of sensitive data at rest</li>
                                        <li>Secure password hashing using industry-standard algorithms</li>
                                        <li>Regular security assessments and updates</li>
                                        <li>Access controls limiting data access to authorized personnel only</li>
                                    </ul>
                                </section>

                                {/* Data Retention */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">7. Data Retention</h2>
                                    <p className="mt-4 text-slate-600">
                                        We retain your personal information for as long as your account is active or as needed to provide
                                        you with the Service. Specific retention periods:
                                    </p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
                                        <li>
                                            <strong>Account data:</strong> Retained until you request account deletion
                                        </li>
                                        <li>
                                            <strong>Access code history:</strong> Retained for 90 days for security audit purposes
                                        </li>
                                        <li>
                                            <strong>Activity logs:</strong> Retained for 1 year for security and compliance purposes
                                        </li>
                                    </ul>
                                    <p className="mt-4 text-slate-600">
                                        After account deletion, we may retain certain information for a limited period to comply with legal
                                        obligations, resolve disputes, and enforce our agreements.
                                    </p>
                                </section>

                                {/* Your Rights */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">8. Your Rights</h2>
                                    <p className="mt-4 text-slate-600">You have the following rights regarding your personal data:</p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
                                        <li>
                                            <strong>Access:</strong> Request a copy of the personal data we hold about you
                                        </li>
                                        <li>
                                            <strong>Correction:</strong> Request correction of inaccurate personal data
                                        </li>
                                        <li>
                                            <strong>Deletion:</strong> Request deletion of your personal data and account
                                        </li>
                                        <li>
                                            <strong>Portability:</strong> Request your data in a portable, machine-readable format
                                        </li>
                                        <li>
                                            <strong>Objection:</strong> Object to processing of your personal data in certain circumstances
                                        </li>
                                        <li>
                                            <strong>Withdrawal of consent:</strong> Withdraw consent for data processing where consent was
                                            the basis for processing
                                        </li>
                                    </ul>
                                    <p className="mt-4 text-slate-600">
                                        To exercise any of these rights, please contact your estate administrator or reach out to us
                                        directly at the contact information provided below.
                                    </p>
                                </section>

                                {/* Account Deletion */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">9. Account Deletion</h2>
                                    <p className="mt-4 text-slate-600">
                                        You may request deletion of your account at any time. To delete your account:
                                    </p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
                                        <li>Contact your estate administrator to request removal</li>
                                        <li>Or email us directly with your deletion request</li>
                                    </ul>
                                    <p className="mt-4 text-slate-600">
                                        Upon deletion, we will remove your personal information from our active systems within 30 days.
                                        Some information may be retained in backups for a limited period and will be deleted in accordance
                                        with our backup retention policies.
                                    </p>
                                </section>

                                {/* Children's Privacy */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">10. Children's Privacy</h2>
                                    <p className="mt-4 text-slate-600">
                                        The Service is not intended for children under the age of 13. We do not knowingly collect personal
                                        information from children under 13. If you believe we have collected information from a child under
                                        13, please contact us immediately.
                                    </p>
                                </section>

                                {/* Changes to This Policy */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">11. Changes to This Policy</h2>
                                    <p className="mt-4 text-slate-600">
                                        We may update this Privacy Policy from time to time. We will notify you of any changes by posting
                                        the new Privacy Policy on this page and updating the "Last updated" date. For significant changes,
                                        we will provide additional notice through the Service or via email.
                                    </p>
                                </section>

                                {/* Contact Us */}
                                <section className="mt-10">
                                    <h2 className="text-2xl font-semibold text-slate-900">12. Contact Us</h2>
                                    <p className="mt-4 text-slate-600">
                                        If you have questions about this Privacy Policy or our privacy practices, please contact us:
                                    </p>
                                    <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-600">
                                        <li>
                                            <strong>Email:</strong>{' '}
                                            <a href="mailto:privacy@usekontrol.com" className="text-blue-600 hover:underline">
                                                privacy@usekontrol.com
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
