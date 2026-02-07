import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { type FormEventHandler } from 'react';
import PushNotificationToggle from '@/components/PushNotificationToggle';
import TelegramLinkToggle from '@/components/TelegramLinkToggle';
import ResidentLayout from '@/layouts/ResidentLayout';
import resident from '@/routes/resident';

interface Props {
    mustVerifyEmail: boolean;
    status?: string;
    telegram: {
        linked: boolean;
        bot_username: string;
    };
    profile: {
        unit_number: string;
        address: string;
    };
}

interface PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
    mustVerifyEmail: boolean;
    status: string;
    [key: string]: unknown;
}

export default function Edit({ telegram, profile }: Props) {
    const user = usePage<PageProps>().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
        unit_number: profile.unit_number || '',
        address: profile.address || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(resident.profile.update.url());
    };

    return (
        <ResidentLayout>
            <Head title="Profile" />

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
                <p className="mt-1 text-gray-500">Manage your basic information.</p>
            </motion.div>

            {/* Profile Form */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
                <form onSubmit={submit} className="p-6 sm:p-8">
                    <header className="mb-6">
                        <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                        <p className="mt-1 text-sm text-gray-600">Update your account's profile information and email address.</p>
                    </header>

                    <div className="grid max-w-xl gap-6">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:text-sm"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                autoComplete="name"
                            />
                            {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:text-sm"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="username"
                            />
                            {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        {/* Unit Number */}
                        <div>
                            <label htmlFor="unit_number" className="block text-sm font-medium text-gray-700">
                                Unit / House Number
                            </label>
                            <input
                                id="unit_number"
                                type="text"
                                className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:text-sm"
                                value={data.unit_number}
                                onChange={(e) => setData('unit_number', e.target.value)}
                                placeholder="e.g. Block A, Flat 5"
                            />
                            {errors.unit_number && <p className="mt-2 text-sm text-red-600">{errors.unit_number}</p>}
                        </div>

                        {/* Full Address */}
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                Full Address
                            </label>
                            <textarea
                                id="address"
                                rows={3}
                                className="mt-1 block w-full resize-none rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:text-sm"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="e.g. Lekki Gardens Estate, Lekki, Lagos"
                                autoComplete="street-address"
                            />
                            <p className="mt-1.5 text-xs text-gray-500">Your full address within the estate (optional).</p>
                            {errors.address && <p className="mt-2 text-sm text-red-600">{errors.address}</p>}
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:scale-95 disabled:opacity-50"
                        >
                            Save Changes
                        </button>

                        <Transition
                            show={recentlySuccessful}
                            enter="transition ease-in-out"
                            enterFrom="opacity-0"
                            leave="transition ease-in-out"
                            leaveTo="opacity-0"
                        >
                            <p className="text-sm text-gray-600">Saved.</p>
                        </Transition>
                    </div>
                </form>
            </motion.div>

            {/* Password Update */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
                <UpdatePasswordForm />
            </motion.div>

            {/* Connected Services */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
                <div className="p-6 sm:p-8">
                    <header className="mb-6">
                        <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
                        <p className="mt-1 text-sm text-gray-600">Configure how you receive alerts about visitor arrivals.</p>
                    </header>

                    <div className="space-y-4">
                        <PushNotificationToggle />

                        <TelegramLinkToggle linked={telegram.linked} botUsername={telegram.bot_username} />
                    </div>
                </div>
            </motion.div>

            <div className="mt-8 flex justify-center">
                <Link href="/logout" method="post" as="button" className="text-sm font-medium text-red-600 hover:text-red-700">
                    Sign Out
                </Link>
            </div>
        </ResidentLayout>
    );
}

function UpdatePasswordForm() {
    const { data, setData, put, errors, processing, recentlySuccessful, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();
        put(resident.password.update.url(), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <form onSubmit={updatePassword} className="p-6 sm:p-8">
            <header className="mb-6">
                <h2 className="text-lg font-medium text-gray-900">Update Password</h2>
                <p className="mt-1 text-sm text-gray-600">Ensure your account is using a long, random password to stay secure.</p>
            </header>

            <div className="grid max-w-xl gap-6">
                <div>
                    <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
                        Current Password
                    </label>
                    <input
                        id="current_password"
                        type="password"
                        className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:text-sm"
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        autoComplete="current-password"
                    />
                    {errors.current_password && <p className="mt-2 text-sm text-red-600">{errors.current_password}</p>}
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        New Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:text-sm"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="new-password"
                    />
                    {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div>
                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                        Confirm Password
                    </label>
                    <input
                        id="password_confirmation"
                        type="password"
                        className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:text-sm"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                    />
                    {errors.password_confirmation && <p className="mt-2 text-sm text-red-600">{errors.password_confirmation}</p>}
                </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 active:scale-95 disabled:opacity-50"
                >
                    Save
                </button>

                <Transition
                    show={recentlySuccessful}
                    enter="transition ease-in-out"
                    enterFrom="opacity-0"
                    leave="transition ease-in-out"
                    leaveTo="opacity-0"
                >
                    <p className="text-sm text-gray-600">Saved.</p>
                </Transition>
            </div>
        </form>
    );
}
