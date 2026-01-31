import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AnimatedLayout from '@/layouts/AnimatedLayout';

export default function CreateEstate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        address: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/zeus/estates');
    }

    return (
        <AnimatedLayout>
            <Head title="Create Estate - Zeus" />

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="border-b border-gray-200 bg-white"
                >
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-auto">
                                    <img src="/assets/images/kontrol.png" alt="Kontrol" className="h-full w-auto object-contain" />
                                </div>
                                <span className="text-lg font-semibold text-gray-900">Zeus</span>
                            </div>

                            <Link
                                href="/zeus/dashboard"
                                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                            >
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </motion.header>

                <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                        className="mb-8"
                    >
                        <h1 className="text-2xl font-semibold text-gray-900">Create Estate</h1>
                        <p className="mt-1 text-gray-500">Add a new estate to the platform. An invitation email will be sent to the estate admin.</p>
                    </motion.div>

                    <motion.form
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                        onSubmit={handleSubmit}
                        className="rounded-xl border border-gray-200 bg-white p-6"
                    >
                        <div className="space-y-6">
                            {/* Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Estate Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                    placeholder="Enter estate name"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Admin Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                    placeholder="admin@estate.com"
                                />
                                <p className="mt-1 text-xs text-gray-500">An invitation will be sent to this email to set up the admin account.</p>
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            {/* Address */}
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                    Address <span className="text-gray-400">(optional)</span>
                                </label>
                                <textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                    placeholder="Enter estate address"
                                />
                                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-end gap-4">
                            <Link
                                href="/zeus/dashboard"
                                className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                            >
                                {processing ? 'Creating...' : 'Create Estate'}
                            </button>
                        </div>
                    </motion.form>
                </main>
            </div>
        </AnimatedLayout>
    );
}
