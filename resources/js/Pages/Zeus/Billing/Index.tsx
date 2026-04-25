import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import ZeusLayout from '@/Layouts/ZeusLayout';
import { CurrencyDollarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function BillingIndex() {
    return (
        <ZeusLayout>
            <Head title="Billing Configuration" />

            {/* Page Header */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
                <div className="mb-2 flex items-center gap-3">
                    <CurrencyDollarIcon className="h-8 w-8 text-primary-600" />
                    <h1 className="text-3xl font-bold text-gray-900">Billing Configuration</h1>
                </div>
                <p className="text-gray-600">Configure platform-wide billing settings</p>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Payment Methods */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Payment Methods</h2>
                        <p className="text-sm text-gray-600">Configure accepted payment methods</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                            <div>
                                <p className="font-medium text-gray-900">Stripe</p>
                                <p className="text-sm text-gray-600">Credit cards and international payments</p>
                            </div>
                            <div className="h-5 w-5 rounded-full bg-green-100">
                                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 opacity-50">
                            <div>
                                <p className="font-medium text-gray-900">PayPal</p>
                                <p className="text-sm text-gray-600">PayPal wallet integration</p>
                            </div>
                            <span className="text-xs font-semibold text-gray-500">Coming Soon</span>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 opacity-50">
                            <div>
                                <p className="font-medium text-gray-900">Bank Transfer</p>
                                <p className="text-sm text-gray-600">Direct bank transfers</p>
                            </div>
                            <span className="text-xs font-semibold text-gray-500">Coming Soon</span>
                        </div>
                    </div>
                </motion.div>

                {/* Currency Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Currency & Taxes</h2>
                        <p className="text-sm text-gray-600">Configure pricing and tax settings</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Primary Currency</label>
                            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                                <span className="text-xl font-bold text-gray-900">₦</span>
                                <div>
                                    <p className="font-medium text-gray-900">Nigerian Naira</p>
                                    <p className="text-xs text-gray-600">NGN</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">VAT/Tax Rate</label>
                            <div className="rounded-lg border border-gray-300 px-4 py-3">
                                <p className="font-medium text-gray-900">7.5%</p>
                                <p className="text-xs text-gray-600">Applied to all pricing</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Invoicing */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Invoicing</h2>
                        <p className="text-sm text-gray-600">Automatic invoice generation and delivery</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                            <div>
                                <p className="font-medium text-gray-900">Auto-send Invoices</p>
                                <p className="text-sm text-gray-600">Send invoices automatically on billing</p>
                            </div>
                            <input type="checkbox" checked disabled className="h-4 w-4 rounded" />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                            <div>
                                <p className="font-medium text-gray-900">Email Notifications</p>
                                <p className="text-sm text-gray-600">Notify customers of upcoming renewals</p>
                            </div>
                            <input type="checkbox" checked disabled className="h-4 w-4 rounded" />
                        </div>
                    </div>
                </motion.div>

                {/* Dunning Management */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Dunning & Retries</h2>
                        <p className="text-sm text-gray-600">Handle failed payments automatically</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Retry Attempts</label>
                            <div className="rounded-lg border border-gray-300 px-4 py-3">
                                <p className="font-medium text-gray-900">3 attempts</p>
                                <p className="text-xs text-gray-600">Before marking as past due</p>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Grace Period</label>
                            <div className="rounded-lg border border-gray-300 px-4 py-3">
                                <p className="font-medium text-gray-900">7 days</p>
                                <p className="text-xs text-gray-600">Before suspending service</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Future Features */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="mt-8 rounded-xl border border-primary-200 bg-primary-50 p-6"
            >
                <h3 className="mb-3 font-bold text-primary-900">Upcoming Features</h3>
                <ul className="space-y-2 text-sm text-primary-800">
                    <li>• Usage-based billing and metered features</li>
                    <li>• Advanced dunning workflows with customizable rules</li>
                    <li>• Multi-currency support with automatic conversion</li>
                    <li>• Custom billing cycles and proration</li>
                    <li>• Integration with accounting software</li>
                </ul>
            </motion.div>
        </ZeusLayout>
    );
}
