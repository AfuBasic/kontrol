import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';

export default function Privacy() {
    return (
        <PublicLayout>
            <Head>
                <title>Privacy Policy - Kontrol</title>
            </Head>

            <div className="bg-white py-24 sm:py-32 dark:bg-slate-950">
                <div className="mx-auto max-w-3xl px-6 lg:px-8">
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <h1 className="mb-8 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">Privacy Policy</h1>
                        <p className="mb-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
                            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>

                        <h2>1. Introduction</h2>
                        <p>
                            At Kontrol, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your
                            information when you visit our website or use our application. Please read this privacy policy carefully. If you do not
                            agree with the terms of this privacy policy, please do not access the site.
                        </p>

                        <h2>2. Information We Collect</h2>
                        <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
                        <ul>
                            <li>
                                <strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email
                                address, and telephone number.
                            </li>
                            <li>
                                <strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your
                                IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before
                                and after accessing the Site.
                            </li>
                            <li>
                                <strong>Financial Data:</strong> Financial information, such as data related to your payment method (e.g., valid
                                credit card number, card brand, expiration date) that we may collect when you purchase, order, return, exchange, or
                                request information about our services from the Site.
                            </li>
                        </ul>

                        <h2>3. Use of Your Information</h2>
                        <p>
                            Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience.
                            Specifically, we may use information collected about you via the Site to:
                        </p>
                        <ul>
                            <li>Create and manage your account.</li>
                            <li>Process your transactions.</li>
                            <li>Email you regarding your account or order.</li>
                            <li>Increase the efficiency and operation of the Site.</li>
                            <li>Monitor and analyze usage and trends to improve your experience with the Site.</li>
                        </ul>

                        <h2>4. Disclosure of Your Information</h2>
                        <p>
                            We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
                        </p>
                        <ul>
                            <li>
                                <strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to
                                respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights,
                                property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or
                                regulation.
                            </li>
                            <li>
                                <strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services
                                for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer
                                service, and marketing assistance.
                            </li>
                        </ul>

                        <h2>5. Security of Your Information</h2>
                        <p>
                            We use administrative, technical, and physical security measures to help protect your personal information. While we have
                            taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no
                            security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any
                            interception or other type of misuse.
                        </p>

                        <h2>6. Contact Us</h2>
                        <p>If you have questions or comments about this Privacy Policy, please contact us at: support@kontrol.app</p>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
