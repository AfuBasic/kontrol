import { Head, useForm, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

interface Props {
    user: {
        name: string;
        email: string;
    };
}

export default function Profile({ user }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;

    const { data, setData, put, processing, errors, clearErrors } = useForm({
        name: user.name,
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        put('/admin/profile');
    }

    return (
        <>
            <Head title="Profile" />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-8"
            >
                <h1 className="text-2xl font-semibold text-gray-900">Admin Profile</h1>
                <p className="mt-1 text-gray-500">Manage your personal account information.</p>
            </motion.div>

            {/* Success Message */}
            <AnimatePresence>
                {flash?.success && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-sm"
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            {flash.success}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Personal Information */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                        className="h-full rounded-xl border border-gray-200 bg-white p-6 shadow-xs"
                    >
                        <div className="mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                <Eye className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
                        </div>

                        <div className="space-y-5">
                            {/* Email (Read-only) */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={user.email}
                                    disabled
                                    className="mt-1 block w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
                                />
                                <p className="mt-1 text-xs text-gray-400">Login email cannot be changed.</p>
                            </div>

                            {/* Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:outline-none"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <h3 className="mb-4 text-sm font-medium text-gray-400 text-gray-900 italic">Change Password</h3>

                                <div className="space-y-4">
                                    {/* Password */}
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                            New Password
                                        </label>
                                        <div className="relative mt-1">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                id="password"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                placeholder="Leave blank to keep current"
                                                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-12 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 outline-none hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                                    </div>

                                    {/* Password Confirmation */}
                                    <div>
                                        <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                                            Confirm Password
                                        </label>
                                        <div className="relative mt-1">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                id="password_confirmation"
                                                value={data.password_confirmation}
                                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                                placeholder="Confirm new password"
                                                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-12 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 outline-none hover:text-gray-600"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Global Save Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-end"
                >
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-gray-800 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving Changes...
                            </>
                        ) : (
                            'Update Profile'
                        )}
                    </button>
                </motion.div>
            </form>
        </>
    );
}

Profile.layout = (page: any) => <AdminLayout children={page} title="Profile" />;
