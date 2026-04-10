import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import ZeusLayout from '@/layouts/ZeusLayout';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

interface Props {
    affiliate: {
        id: number;
        name: string;
        email: string;
        description: string | null;
        website: string | null;
        contact_person: string | null;
        phone: string | null;
        commission_rate: number;
        status: 'active' | 'inactive' | 'suspended';
    };
}

export default function EditAffiliate({ affiliate }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: affiliate.name,
        email: affiliate.email,
        description: affiliate.description || '',
        website: affiliate.website || '',
        contact_person: affiliate.contact_person || '',
        phone: affiliate.phone || '',
        commission_rate: affiliate.commission_rate.toString(),
        status: affiliate.status,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/zeus/affiliates/${affiliate.id}`);
    }

    return (
        <ZeusLayout>
            <Head title={`Edit Affiliate — ${affiliate.name}`} />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl">
                <Link
                    href="/zeus/affiliates"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 mb-6"
                >
                    <ChevronLeftIcon className="h-4 w-4" /> Back to Affiliates
                </Link>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-8 shadow-sm">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Affiliate</h1>
                    <p className="text-gray-600 mb-8">Update affiliate partner information</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    placeholder="Affiliate name"
                                />
                                {errors.name && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    placeholder="contact@affiliate.com"
                                />
                                {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={3}
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                placeholder="Brief description of the affiliate"
                            />
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                                <input
                                    type="url"
                                    value={data.website}
                                    onChange={(e) => setData('website', e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    placeholder="https://example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person</label>
                                <input
                                    type="text"
                                    value={data.contact_person}
                                    onChange={(e) => setData('contact_person', e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Commission Rate (%)</label>
                                <input
                                    type="number"
                                    value={data.commission_rate}
                                    onChange={(e) => setData('commission_rate', e.target.value)}
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                />
                                {errors.commission_rate && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.commission_rate}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value as any)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>

                        <div className="flex gap-3 border-t border-gray-200 pt-6">
                            <Link
                                href="/zeus/affiliates"
                                className="flex-1 rounded-xl border border-gray-200 bg-white px-6 py-3 text-center text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 rounded-xl bg-linear-to-r from-primary-500 to-primary-700 px-6 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-px disabled:opacity-60"
                            >
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </ZeusLayout>
    );
}
