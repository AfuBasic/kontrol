import { UserIcon, LinkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import PartnerLayout from '@/Layouts/PartnerLayout';

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
    };
}

export default function AffiliateDashboard({ user }: Props) {
    return (
        <PartnerLayout>
            <Head title="Partner Portal" />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
                {/* Welcome Header */}
                <div>
                    <div className="mb-2 flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-lg bg-linear-to-r from-primary-500 to-primary-600 opacity-75 blur"></div>
                            <div className="relative rounded-lg bg-primary-500 p-2">
                                <LinkIcon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <h1 className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-4xl font-bold text-transparent">
                            Welcome, {user.name}
                        </h1>
                    </div>
                    <p className="text-lg text-gray-600">Manage your partner estates and track onboarding requests</p>
                </div>

                {/* Quick Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {/* Partner Request Count */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Partner Requests</span>
                            <LinkIcon className="h-5 w-5 text-primary-500" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-3xl font-bold text-gray-900">0</p>
                            <p className="text-xs text-gray-500">Active partner requests</p>
                        </div>
                    </div>

                    {/* Revenue */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Revenue</span>
                            <div className="from-warning-400 h-5 w-5 rounded bg-linear-to-br to-warning-600"></div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-3xl font-bold text-gray-900">$0.00</p>
                            <p className="text-xs text-gray-500">Total earnings</p>
                        </div>
                    </div>

                    {/* Commission Rate */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Commission</span>
                            <div className="from-success-400 h-5 w-5 rounded bg-linear-to-br to-success-600"></div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-3xl font-bold text-gray-900">TBD</p>
                            <p className="text-xs text-gray-500">Your rate</p>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Status</span>
                            <div className="h-2 w-2 rounded-full bg-success-500"></div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-3xl text-lg font-bold text-gray-900">Active</p>
                            <p className="text-xs text-gray-500">Account status</p>
                        </div>
                    </div>
                </motion.div>

                {/* Account Information Card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
                >
                    <h2 className="mb-6 text-2xl font-bold text-gray-900">Account Information</h2>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-600">Full Name</label>
                            <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-600">Email Address</label>
                            <p className="text-lg font-semibold text-gray-900">{user.email}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Resources Card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
                >
                    <h2 className="mb-6 text-2xl font-bold text-gray-900">Resources & Documentation</h2>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <DocumentTextIcon className="mt-1 h-6 w-6 shrink-0 text-primary-500" />
                            <div>
                                <h3 className="font-semibold text-gray-900">Partner Onboarding Guide</h3>
                                <p className="mt-1 text-sm text-gray-600">Learn how to submit estates and track your partner requests.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <LinkIcon className="mt-1 h-6 w-6 shrink-0 text-primary-500" />
                            <div>
                                <h3 className="font-semibold text-gray-900">Your Partner Link</h3>
                                <p className="mt-1 text-sm text-gray-600">Share your unique partner link to start earning commissions.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <UserIcon className="mt-1 h-6 w-6 shrink-0 text-primary-500" />
                            <div>
                                <h3 className="font-semibold text-gray-900">Account Settings</h3>
                                <p className="mt-1 text-sm text-gray-600">Update your profile information and payment details.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Getting Started Section */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="rounded-2xl border border-primary-200 bg-linear-to-br from-primary-50 to-primary-100/50 p-8"
                >
                    <h2 className="mb-4 text-2xl font-bold text-primary-900">Get Started with Your Partner Portal</h2>
                    <p className="mb-6 text-primary-700">
                        Your partner account is active. Submit estate onboarding requests and track commissions as estates go live.
                    </p>
                    <ol className="space-y-3 text-primary-700">
                        <li className="flex gap-3">
                            <span className="font-semibold">1.</span>
                            <span>Go to Partner Requests and submit a new estate</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-semibold">2.</span>
                            <span>Our team reviews and approves qualified estates</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-semibold">3.</span>
                            <span>Earn commissions when attributed estates generate revenue</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-semibold">4.</span>
                            <span>Track your earnings and performance in real-time</span>
                        </li>
                    </ol>
                </motion.div>
            </motion.div>
        </PartnerLayout>
    );
}
