import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AffiliateLayout from '@/layouts/AffiliateLayout';
import { UserIcon, LinkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
    };
}

export default function AffiliateDashboard({ user }: Props) {
    return (
        <AffiliateLayout>
            <Head title="Affiliate Dashboard" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
            >
                {/* Welcome Header */}
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="relative">
                            <div className="absolute inset-0 bg-linear-to-r from-primary-500 to-primary-600 rounded-lg blur opacity-75"></div>
                            <div className="relative bg-primary-500 rounded-lg p-2">
                                <LinkIcon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            Welcome, {user.name}
                        </h1>
                    </div>
                    <p className="text-gray-600 text-lg">Manage your affiliate partnerships and track your performance</p>
                </div>

                {/* Quick Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {/* Referral Count */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-gray-600">Referrals</span>
                            <LinkIcon className="h-5 w-5 text-primary-500" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-3xl font-bold text-gray-900">0</p>
                            <p className="text-xs text-gray-500">Active referrals</p>
                        </div>
                    </div>

                    {/* Revenue */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-gray-600">Revenue</span>
                            <div className="h-5 w-5 rounded bg-gradient-to-br from-amber-400 to-amber-600"></div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-3xl font-bold text-gray-900">$0.00</p>
                            <p className="text-xs text-gray-500">Total earnings</p>
                        </div>
                    </div>

                    {/* Commission Rate */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-gray-600">Commission</span>
                            <div className="h-5 w-5 rounded bg-gradient-to-br from-green-400 to-green-600"></div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-3xl font-bold text-gray-900">TBD</p>
                            <p className="text-xs text-gray-500">Your rate</p>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-gray-600">Status</span>
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-3xl font-bold text-gray-900 text-lg">Active</p>
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Information</h2>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Full Name</label>
                            <p className="text-lg text-gray-900 font-semibold">{user.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Email Address</label>
                            <p className="text-lg text-gray-900 font-semibold">{user.email}</p>
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Resources & Documentation</h2>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <DocumentTextIcon className="h-6 w-6 text-primary-500 shrink-0 mt-1" />
                            <div>
                                <h3 className="font-semibold text-gray-900">Affiliate Integration Guide</h3>
                                <p className="text-sm text-gray-600 mt-1">Learn how to integrate Kontrol and start referring customers.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <LinkIcon className="h-6 w-6 text-primary-500 shrink-0 mt-1" />
                            <div>
                                <h3 className="font-semibold text-gray-900">Your Referral Link</h3>
                                <p className="text-sm text-gray-600 mt-1">Share your unique affiliate link to start earning commissions.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <UserIcon className="h-6 w-6 text-primary-500 shrink-0 mt-1" />
                            <div>
                                <h3 className="font-semibold text-gray-900">Account Settings</h3>
                                <p className="text-sm text-gray-600 mt-1">Update your profile information and payment details.</p>
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
                    <h2 className="text-2xl font-bold text-primary-900 mb-4">Get Started with Your Affiliate Account</h2>
                    <p className="text-primary-700 mb-6">Your affiliate account is now active. Start sharing your referral link and earning commissions.</p>
                    <ol className="space-y-3 text-primary-700">
                        <li className="flex gap-3">
                            <span className="font-semibold">1.</span>
                            <span>Copy your unique referral link from the resources above</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-semibold">2.</span>
                            <span>Share it with your network, blog, or social media</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-semibold">3.</span>
                            <span>Earn commissions when someone signs up using your link</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-semibold">4.</span>
                            <span>Track your earnings and performance in real-time</span>
                        </li>
                    </ol>
                </motion.div>
            </motion.div>
        </AffiliateLayout>
    );
}
