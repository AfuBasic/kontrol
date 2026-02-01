import { Head, Link, useForm, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AdminLayout from '@/layouts/AdminLayout';
import { index, update, destroy } from '@/actions/App/Http/Controllers/Admin/ResidentController';

type Resident = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    unit_number: string | null;
    address: string | null;
};

type Props = {
    resident: Resident;
};

export default function EditResident({ resident }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: resident.name,
        phone: resident.phone || '',
        unit_number: resident.unit_number || '',
        address: resident.address || '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(update.url({ resident: resident.id }));
    }

    function handleDelete() {
        if (confirm('Are you sure you want to remove this resident? This action cannot be undone.')) {
            router.delete(destroy.url({ resident: resident.id }));
        }
    }

    return (
        <AdminLayout>
            <Head title="Edit Resident" />

            <div className="mx-auto max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                    className="mb-8"
                >
                    <h1 className="text-2xl font-semibold text-gray-900">Edit Resident</h1>
                    <p className="mt-1 text-gray-500">Update resident information. Email cannot be changed.</p>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                    onSubmit={handleSubmit}
                    className="rounded-xl border border-gray-200 bg-white p-6"
                >
                    <div className="space-y-6">
                        {/* Email (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input
                                type="email"
                                value={resident.email}
                                disabled
                                className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
                            />
                            <p className="mt-1 text-xs text-gray-400">Email cannot be changed after invitation.</p>
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
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                placeholder="Enter resident's full name"
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
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

                    <div className="mt-8 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                        >
                            Remove Resident
                        </button>
                        <div className="flex items-center gap-4">
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
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </motion.form>
            </div>
        </AdminLayout>
    );
}
