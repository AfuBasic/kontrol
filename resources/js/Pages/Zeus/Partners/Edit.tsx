import {
    ChevronLeftIcon,
    EnvelopeIcon,
    KeyIcon,
    LinkIcon,
    UserGroupIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
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
        commission_type: 'percentage' | 'fixed';
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
        commission_type: partner.commission_type || 'percentage',
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
            <Head title={`Edit Partner – ${partner.name}`} />

            <div className="mx-auto max-w-4xl space-y-8">
                {/* Header Navigation */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                        href="/zeus/partners"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeftIcon className="h-4 w-4" /> Back to Partners
                    </Link>
                    <Link
                        href={`/zeus/partners/${partner.id}/earnings`}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
                    >
                        View Financial Dashboard
                    </Link>
                </div>

                {/* Banner alert */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 to-amber-100/50 p-6 flex items-start gap-4"
                >
                    <div className="rounded-lg bg-amber-500/10 p-2 text-amber-700 shrink-0">
                        <LinkIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-amber-900">Portal Access URL</h2>
                        <p className="mt-1 text-sm text-amber-800">
                            Members belonging to this partner can sign in to request estate attribution and check commissions at:{' '}
                            <a href={partnerPortalUrl} className="font-semibold underline break-all" target="_blank" rel="noreferrer">
                                {partnerPortalUrl}
                            </a>
                        </p>
                    </div>
                </motion.div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Edit Form Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm lg:col-span-2 space-y-6"
                    >
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Edit Partner</h2>
                            <p className="text-sm text-gray-500 mt-1">Modify partner profile, commission schedules, and credentials.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Name</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full rounded-xl border border-gray-250 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                        required
                                    />
                                    {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Email</label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full rounded-xl border border-gray-250 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                        required
                                    />
                                    {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Contact Person</label>
                                    <input
                                        type="text"
                                        value={data.contact_person}
                                        onChange={(e) => setData('contact_person', e.target.value)}
                                        className="w-full rounded-xl border border-gray-250 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Phone</label>
                                    <input
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="w-full rounded-xl border border-gray-250 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Website</label>
                                    <input
                                        type="url"
                                        value={data.website}
                                        onChange={(e) => setData('website', e.target.value)}
                                        className="w-full rounded-xl border border-gray-250 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2 border-t border-gray-100 pt-6">
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Commission Type</label>
                                    <select
                                        value={data.commission_type}
                                        onChange={(e) => setData('commission_type', e.target.value as 'percentage' | 'fixed')}
                                        className="w-full rounded-xl border border-gray-255 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₦)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                                        {data.commission_type === 'percentage' ? 'Rate (%)' : 'Amount (kobo)'}
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
                                    {errors.commission_rate && <p className="mt-1 text-xs text-rose-600">{errors.commission_rate}</p>}
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-6 space-y-6">
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Status</label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value as typeof data.status)}
                                        className="w-full rounded-xl border border-gray-255 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Description</label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-xl border border-gray-250 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 border-t border-gray-150 pt-6">
                                <Link
                                    href="/zeus/partners"
                                    className="flex-1 rounded-xl border border-gray-200 bg-white px-5 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 hover:shadow-lg transition-all"
                                >
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </motion.div>

                    {/* Members List and Invite Panel */}
                    <div className="space-y-8">
                        {/* Invite Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.05 }}
                            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                                    <UserPlusIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Invite Member</h3>
                                    <p className="text-xs text-gray-500">Add an administrator for this partner.</p>
                                </div>
                            </div>

                            <form onSubmit={handleInvite} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-gray-600">Name</label>
                                    <input
                                        type="text"
                                        value={inviteForm.data.name}
                                        onChange={(e) => inviteForm.setData('name', e.target.value)}
                                        className="w-full rounded-xl border border-gray-250 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        placeholder="Jane Doe"
                                        required
                                    />
                                    {inviteForm.errors.name && <p className="mt-1 text-xs text-rose-600">{inviteForm.errors.name}</p>}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-gray-600">Email Address</label>
                                    <input
                                        type="email"
                                        value={inviteForm.data.email}
                                        onChange={(e) => inviteForm.setData('email', e.target.value)}
                                        className="w-full rounded-xl border border-gray-250 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        placeholder="member@partner.com"
                                        required
                                    />
                                    {inviteForm.errors.email && <p className="mt-1 text-xs text-rose-600">{inviteForm.errors.email}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={inviteForm.processing}
                                    className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors disabled:opacity-60"
                                >
                                    <EnvelopeIcon className="h-4.5 w-4.5" />
                                    Send Invitation
                                </button>
                            </form>
                        </motion.div>

                        {/* Portal Members List */}
                        <motion.div
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
                                    <UserGroupIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Portal Members</h3>
                                    <p className="text-xs text-gray-500">Users with console access.</p>
                                </div>
                            </div>

                            {members.length === 0 ? (
                                <p className="text-sm text-gray-400 py-4 text-center">No portal members active yet.</p>
                            ) : (
                                <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto pr-1">
                                    {members.map((member) => (
                                        <li key={member.id} className="py-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{member.email}</p>
                                            </div>
                                            <span className="text-[10px] text-gray-400">
                                                Joined {new Date(member.created_at).toLocaleDateString('en-NG', { dateStyle: 'short' })}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </ZeusLayout>
    );
}