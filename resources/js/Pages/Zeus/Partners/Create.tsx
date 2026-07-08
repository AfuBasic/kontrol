import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import ZeusLayout from '@/Layouts/ZeusLayout';

export default function CreatePartner() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        description: '',
        website: '',
        contact_person: '',
        phone: '',
        commission_type: 'percentage',
        commission_rate: '10',
        status: 'active',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/zeus/partners');
    }

    return (
        <ZeusLayout>
            <Head title="Create Partner – Zeus" />

            <div className="mx-auto max-w-3xl space-y-6">
                <Link
                    href="/zeus/partners"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ChevronLeftIcon className="h-4 w-4" /> Back to Partners
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
                >
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Create Partner</h1>
                        <p className="text-gray-500 mt-1">Add a new partner organization to your strategic referral network.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Partner Details Section */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Partner Details</h3>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">Organization Name</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full rounded-xl border border-gray-250 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-gray-300"
                                        placeholder="Acme Referrals Ltd"
                                        required
                                    />
                                    {errors.name && <p className="mt-1.5 text-xs font-semibold text-rose-600">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">Billing / Contact Email</label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full rounded-xl border border-gray-250 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-gray-300"
                                        placeholder="billing@acme.com"
                                        required
                                    />
                                    {errors.email && <p className="mt-1.5 text-xs font-semibold text-rose-600">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">Contact Person Name</label>
                                    <input
                                        type="text"
                                        value={data.contact_person}
                                        onChange={(e) => setData('contact_person', e.target.value)}
                                        className="w-full rounded-xl border border-gray-250 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-gray-300"
                                        placeholder="Jane Doe"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="w-full rounded-xl border border-gray-250 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-gray-300"
                                        placeholder="+234..."
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">Website URL</label>
                                    <input
                                        type="url"
                                        value={data.website}
                                        onChange={(e) => setData('website', e.target.value)}
                                        className="w-full rounded-xl border border-gray-250 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-gray-300"
                                        placeholder="https://acme.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Commission configuration */}
                        <div className="space-y-6 border-t border-gray-100 pt-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Commission Rules</h3>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">Commission Type</label>
                                    <select
                                        value={data.commission_type}
                                        onChange={(e) => setData('commission_type', e.target.value)}
                                        className="w-full rounded-xl border border-gray-250 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₦)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        {data.commission_type === 'percentage' ? 'Rate (%)' : 'Amount (in kobo)'}
                                    </label>
                                    <input
                                        type="number"
                                        value={data.commission_rate}
                                        onChange={(e) => setData('commission_rate', e.target.value)}
                                        min="0"
                                        max={data.commission_type === 'percentage' ? '100' : undefined}
                                        step="any"
                                        className="w-full rounded-xl border border-gray-250 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                        required
                                    />
                                    <p className="mt-1 text-[11px] text-gray-400">
                                        {data.commission_type === 'fixed'
                                            ? 'Enter fixed value in kobo (e.g. 50000 kobo = ₦500.00)'
                                            : 'Percentage rate applied to gross resident payments.'}
                                    </p>
                                    {errors.commission_rate && <p className="mt-1.5 text-xs font-semibold text-rose-600">{errors.commission_rate}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Status & Notes */}
                        <div className="space-y-6 border-t border-gray-100 pt-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Status & Profile</h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">Default Status</label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="w-full rounded-xl border border-gray-250 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">Internal Description / Notes</label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-xl border border-gray-250 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-gray-300"
                                        placeholder="Add descriptive details about how the partnership is run..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 border-t border-gray-150 pt-6">
                            <Link
                                href="/zeus/partners"
                                className="flex-1 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 hover:shadow-lg transition-all disabled:opacity-60"
                            >
                                {processing ? 'Creating...' : 'Create Partner'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </ZeusLayout>
    );
}