import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
    };
}

export default function AcceptInvitation({ user }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(`/invitation/${user.id}`);
    }

    return (
        <>
            <Head title="Set Up Your Password - Kontrol" />

            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full max-w-md"
                >
                    <div className="mb-8 text-center">
                        <div className="mb-6 flex justify-center">
                            <div className="h-12 w-auto">
                                <img src="/assets/images/kontrol.png" alt="Kontrol" className="h-full w-auto object-contain" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-900">Welcome, {user.name}!</h1>
                        <p className="mt-2 text-gray-500">Set up your password to access your estate dashboard.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6">
                        <div className="space-y-5">
                            {/* Email (read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
                                    {user.email}
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                    placeholder="Enter your password"
                                    autoFocus
                                />
                                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    id="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                    placeholder="Confirm your password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="mt-6 w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                        >
                            {processing ? 'Setting up...' : 'Set Password & Continue'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </>
    );
}
