import { ChevronLeftIcon, EnvelopeIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';

import ZeusLayout from '@/Layouts/ZeusLayout';

interface Member {
    id: number;
    name: string;
    email: string;
    created_at: string;
}

interface Props {
    partner: {
        id: number;
        name: string;
        email: string;
        description: string | null;
        website: string | null;
        contact_person: string | null;
        phone: string | null;
        commission_rate: number;
        status: 'active' | 'inactive' | 'suspended';
        notes?: string | null;
    };
    members: Member[];
    partnerPortalUrl: string;
}

export default function EditPartner({ partner, members, partnerPortalUrl }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: partner.name,
        email: partner.email,
        description: partner.description || '',
        website: partner.website || '',
        contact_person: partner.contact_person || '',
        phone: partner.phone || '',
        commission_rate: partner.commission_rate.toString(),
        status: partner.status,
        notes: partner.notes || '',
    });

    const inviteForm = useForm({
        name: '',
        email: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/zeus/partners/${partner.id}`);
    }

    function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        inviteForm.post(`/zeus/partners/${partner.id}/invite-member`, {
            preserveScroll: true,
            onSuccess: () => inviteForm.reset(),
        });
    }

    return (
        <ZeusLayout>
            <Head title={`Edit Partner — ${partner.name}`} />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mx-auto max-w-3xl space-y-8">
                <Link href="/zeus/partners" className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
                    <ChevronLeftIcon className="h-4 w-4" /> Back to Partners
                </Link>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                    <h2 className="text-lg font-bold text-amber-900">Partner portal access</h2>
                    <p className="mt-2 text-sm text-amber-800">
                        Invite team members below. They receive an email to set their password, then sign in at{' '}
                        <a href={partnerPortalUrl} className="font-semibold underline" target="_blank" rel="noreferrer">
                            {partnerPortalUrl}
                        </a>{' '}
                        to submit estate requests and track commissions.
                    </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    <h1 className="mb-2 text-3xl font-bold text-gray-900">Edit Partner</h1>
                    <p className="mb-8 text-gray-600">Update partner organization details</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                                    placeholder="Partner name"
                                />
                                {errors.name && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">Email</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                                    placeholder="contact@partner.com"
                                />
                                {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">Description</label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={3}
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                                placeholder="Brief description of the partner"
                            />
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">Website</label>
                                <input
                                    type="url"
                                    value={data.website}
                                    onChange={(e) => setData('website', e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                                    placeholder="https://example.com"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">Contact Person</label>
                                <input
                                    type="text"
                                    value={data.contact_person}
                                    onChange={(e) => setData('contact_person', e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">Phone</label>
                                <input
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">Commission Rate (%)</label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={data.commission_rate}
                                    onChange={(e) => setData('commission_rate', e.target.value)}
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                                />
                                {errors.commission_rate && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.commission_rate}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">Status</label>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value as typeof data.status)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>

                        <div className="flex gap-3 border-t border-gray-200 pt-6">
                            <Link
                                href="/zeus/partners"
                                className="flex-1 rounded-xl border border-gray-200 bg-white px-6 py-3 text-center text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 rounded-xl bg-linear-to-r from-primary-500 to-primary-700 px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:shadow-lg disabled:opacity-60"
                            >
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-lg bg-primary-50 p-2">
                            <UserPlusIcon className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Invite portal member</h2>
                            <p className="text-sm text-gray-600">Send an invitation so they can access the partner portal</p>
                        </div>
                    </div>

                    <form onSubmit={handleInvite} className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">Full name</label>
                            <input
                                type="text"
                                value={inviteForm.data.name}
                                onChange={(e) => inviteForm.setData('name', e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                                placeholder="Jane Doe"
                            />
                            {inviteForm.errors.name && <p className="mt-1 text-xs text-red-600">{inviteForm.errors.name}</p>}
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">Email</label>
                            <input
                                type="email"
                                value={inviteForm.data.email}
                                onChange={(e) => inviteForm.setData('email', e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                                placeholder="member@partner.com"
                            />
                            {inviteForm.errors.email && <p className="mt-1 text-xs text-red-600">{inviteForm.errors.email}</p>}
                        </div>
                        <div className="sm:col-span-2">
                            <button
                                type="submit"
                                disabled={inviteForm.processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-60"
                            >
                                <EnvelopeIcon className="h-4 w-4" />
                                {inviteForm.processing ? 'Sending...' : 'Send invitation'}
                            </button>
                        </div>
                    </form>

                    {members.length > 0 && (
                        <div className="mt-8 border-t border-gray-100 pt-6">
                            <h3 className="mb-4 text-sm font-bold tracking-wide text-gray-500 uppercase">Portal members</h3>
                            <ul className="divide-y divide-gray-100">
                                {members.map((member) => (
                                    <li key={member.id} className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                                            <p className="text-xs text-gray-500">{member.email}</p>
                                        </div>
                                        <span className="text-xs text-gray-400">Invited {new Date(member.created_at).toLocaleDateString()}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </motion.div>
        </ZeusLayout>
    );
}