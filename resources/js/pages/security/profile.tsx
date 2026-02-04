import { Head, router, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { User, Mail, Building2, Lock, LogOut, Eye, EyeOff, Check } from 'lucide-react';
import { useState } from 'react';
import SecurityLayout from '@/layouts/SecurityLayout';
import ProfileController from '@/actions/App/Http/Controllers/Security/ProfileController';
import LoginController from '@/actions/App/Http/Controllers/Auth/LoginController';

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
    };
    estateName: string;
}

export default function ProfilePage({ user, estateName }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const { data, setData, put, processing, errors, reset, recentlySuccessful } = useForm({
        name: user.name,
        password: '',
        password_confirmation: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        put(ProfileController.update.url(), {
            preserveScroll: true,
            onSuccess: () => {
                reset('password', 'password_confirmation');
            },
        });
    }

    function handleLogout() {
        router.post(LoginController.destroy.url());
    }

    return (
        <SecurityLayout>
            <Head title="Profile" />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
            >
                <h1 className="text-xl font-bold text-slate-900">Profile</h1>
                <p className="mt-0.5 text-sm text-slate-500">Manage your account</p>
            </motion.div>

            {/* Avatar Section */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="mb-6 flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
            >
                <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-primary-700 text-2xl font-bold text-white shadow-lg shadow-primary-500/30">
                    {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                </div>
                <h2 className="text-lg font-semibold text-slate-900">{user.name}</h2>
                <p className="text-sm text-slate-500">Security Staff</p>
            </motion.div>

            {/* Account Info */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mb-6 space-y-3"
            >
                {/* Email - Read Only */}
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                            <Mail className="h-5 w-5 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Email</p>
                            <p className="truncate text-sm text-slate-500">{user.email}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            Managed
                        </span>
                    </div>
                </div>

                {/* Estate - Read Only */}
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                            <Building2 className="h-5 w-5 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Estate</p>
                            <p className="truncate text-sm text-slate-700">{estateName}</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Edit Form */}
            <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                onSubmit={handleSubmit}
                className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
            >
                <h3 className="mb-4 text-sm font-semibold text-slate-900">Edit Profile</h3>

                {/* Name Field */}
                <div className="mb-4">
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Name</label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="block w-full rounded-xl border-0 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 ring-1 ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            placeholder="Your name"
                        />
                    </div>
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>

                {/* Password Field */}
                <div className="mb-4">
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">New Password</label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="block w-full rounded-xl border-0 bg-slate-50 py-3 pl-10 pr-12 text-sm text-slate-900 ring-1 ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            placeholder="Leave blank to keep current"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                </div>

                {/* Confirm Password Field */}
                {data.password && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-4"
                    >
                        <label className="mb-1.5 block text-xs font-medium text-slate-600">Confirm Password</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Lock className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                className="block w-full rounded-xl border-0 bg-slate-50 py-3 pl-10 pr-12 text-sm text-slate-900 ring-1 ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                placeholder="Confirm new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                            >
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Success Message */}
                {recentlySuccessful && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                    >
                        <Check className="h-4 w-4" />
                        Profile updated successfully
                    </motion.div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-xl bg-linear-to-br from-primary-500 to-primary-700 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {processing ? 'Saving...' : 'Save Changes'}
                </button>
            </motion.form>

            {/* Logout Section */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
            >
                {showLogoutConfirm ? (
                    <div className="text-center">
                        <p className="mb-4 text-sm text-slate-600">Are you sure you want to log out?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-medium text-slate-700 transition-all active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition-all active:scale-[0.98]"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-100 bg-red-50 py-3 text-sm font-semibold text-red-600 transition-all hover:border-red-200 hover:bg-red-100 active:scale-[0.98]"
                    >
                        <LogOut className="h-4 w-4" />
                        Log Out
                    </button>
                )}
            </motion.div>
        </SecurityLayout>
    );
}
