import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { index, store } from '@/actions/App/Http/Controllers/Admin/ResidentController';
import AdminLayout from '@/layouts/AdminLayout';

export default function CreateResident() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        unit_number: '',
        address: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(store.url());
    }

    return (
        <AdminLayout>
            <Head title="Add Resident" />

            <div className="mx-auto max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                    className="mb-8"
                >
                    <h1 className="text-2xl font-semibold text-gray-900">Add Resident</h1>
                    <p className="mt-1 text-gray-500">Invite a new resident to your estate. They'll receive an email to set up their account.</p>
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
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                placeholder="Enter resident's full name"
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                placeholder="resident@example.com"
                            />
                            <p className="mt-1 text-xs text-gray-500">An invitation will be sent to this email.</p>
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                Phone Number <span className="text-gray-400">(optional)</span>
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                placeholder="+1 (555) 000-0000"
                            />
                            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                        </div>

                        {/* Unit Number */}
                        <div>
                            <label htmlFor="unit_number" className="block text-sm font-medium text-gray-700">
                                Unit Number <span className="text-gray-400">(optional)</span>
                            </label>
                            <input
                                type="text"
                                id="unit_number"
                                value={data.unit_number}
                                onChange={(e) => setData('unit_number', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                placeholder="e.g., A-101, Block 2 Unit 5"
                            />
                            {errors.unit_number && <p className="mt-1 text-sm text-red-600">{errors.unit_number}</p>}
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
                                placeholder="Enter resident's address within the estate"
                            />
                            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-end gap-4">
                        <Link
                            href={index.url()}
                            className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                        >
                            {processing ? 'Sending Invitation...' : 'Send Invitation'}
                        </button>
                    </div>
                </motion.form>
            </div>
        </AdminLayout>
    );
}
