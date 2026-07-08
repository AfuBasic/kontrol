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

            <div className="relative mx-auto max-w-3xl px-4 py-8 text-[#F2F3F6] space-y-6">
                {/* Decorative Glow */}
                <div className="pointer-events-none absolute top-0 right-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-gradient-to-br from-[#6C5DFD]/5 to-[#A78BFA]/5 blur-[120px] duration-[8000ms]" />

                <Link
                    href="/zeus/partners"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9297A8] hover:text-[#F2F3F6] transition-colors"
                >
                    <ChevronLeftIcon className="h-4 w-4" /> Back to Partners
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-8 shadow-2xl space-y-6"
                >
                    <div className="mb-4">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#6C5DFD] shadow-[0_0_12px_rgba(108,93,253,0.6)]" />
                            <span className="text-[10px] font-black tracking-[0.25em] text-[#6C5DFD] uppercase">PARTNER ONBOARDING</span>
                        </div>
                        <h1 className="text-3xl font-bold text-[#F2F3F6]">Create Partner</h1>
                        <p className="text-[#9297A8] mt-1">Register a new partner organization with custom commission rates.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Partner Details Section */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9297A8] border-b border-[rgba(255,255,255,0.05)] pb-2">
                                Organization Details
                            </h3>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9297A8]">Organization Name</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors placeholder:text-gray-600"
                                        placeholder="Acme Referrals Ltd"
                                        required
                                    />
                                    {errors.name && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9297A8]">Billing / Contact Email</label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors placeholder:text-gray-600"
                                        placeholder="billing@acme.com"
                                        required
                                    />
                                    {errors.email && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9297A8]">Contact Person Name</label>
                                    <input
                                        type="text"
                                        value={data.contact_person}
                                        onChange={(e) => setData('contact_person', e.target.value)}
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors placeholder:text-gray-600"
                                        placeholder="Jane Doe"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9297A8]">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors placeholder:text-gray-600"
                                        placeholder="+234..."
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9297A8]">Website URL</label>
                                    <input
                                        type="url"
                                        value={data.website}
                                        onChange={(e) => setData('website', e.target.value)}
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors placeholder:text-gray-600"
                                        placeholder="https://acme.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Commission configuration */}
                        <div className="space-y-6 border-t border-[rgba(255,255,255,0.05)] pt-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9297A8]">Commission Schedule</h3>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9297A8]">Commission Type</label>
                                    <select
                                        value={data.commission_type}
                                        onChange={(e) => setData('commission_type', e.target.value)}
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₦)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9297A8]">
                                        {data.commission_type === 'percentage' ? 'Rate (%)' : 'Amount (kobo)'}
                                    </label>
                                    <input
                                        type="number"
                                        value={data.commission_rate}
                                        onChange={(e) => setData('commission_rate', e.target.value)}
                                        min="0"
                                        max={data.commission_type === 'percentage' ? '100' : undefined}
                                        step="any"
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors"
                                        required
                                    />
                                    <p className="mt-1.5 text-[10px] text-[#9297A8]">
                                        {data.commission_type === 'fixed'
                                            ? 'Enter fixed value in kobo (e.g. 50000 kobo = ₦500.00)'
                                            : 'Percentage rate applied to resident transaction fees.'}
                                    </p>
                                    {errors.commission_rate && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.commission_rate}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Status & Notes */}
                        <div className="space-y-6 border-t border-[rgba(255,255,255,0.05)] pt-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9297A8]">Lifecycle & Notes</h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9297A8]">Account Status</label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9297A8]">Internal Notes / Profile Details</label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors placeholder:text-gray-600"
                                        placeholder="Record helpful partner relationship details..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 border-t border-[rgba(255,255,255,0.08)] pt-6">
                            <Link
                                href="/zeus/partners"
                                className="flex-1 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] py-4 text-center text-sm font-bold text-[#9297A8] hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 rounded-2xl bg-[#6C5DFD] py-4 text-sm font-bold text-white shadow-lg hover:bg-[#6C5DFD]/90 transition-all active:scale-[0.98] disabled:opacity-60"
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