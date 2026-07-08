import {
    ChevronLeftIcon,
    EnvelopeIcon,
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

            <div className="relative mx-auto max-w-4xl px-4 py-8 text-[#F2F3F6] space-y-8">
                {/* Decorative Glow */}
                <div className="pointer-events-none absolute top-0 right-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-gradient-to-br from-[#6C5DFD]/5 to-[#A78BFA]/5 blur-[120px] duration-[8000ms]" />

                {/* Header Navigation */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                        href="/zeus/partners"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9297A8] hover:text-[#F2F3F6] transition-colors"
                    >
                        <ChevronLeftIcon className="h-4 w-4" /> Back to Partners
                    </Link>
                    <Link
                        href={`/zeus/partners/${partner.id}/earnings`}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#34D399] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#34D399]/90 transition-colors"
                    >
                        View Financial Dashboard
                    </Link>
                </div>

                {/* Banner alert */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 flex items-start gap-4"
                >
                    <div className="rounded-lg bg-amber-500/10 p-2 text-[#F5A623] shrink-0">
                        <LinkIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-[#F2F3F6]">Portal Access URL</h2>
                        <p className="mt-1 text-xs text-[#9297A8] leading-relaxed">
                            Members belonging to this partner can sign in to request estate attribution and check commissions at:{' '}
                            <a href={partnerPortalUrl} className="font-semibold text-white underline break-all" target="_blank" rel="noreferrer">
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
                        className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-8 shadow-2xl lg:col-span-2 space-y-6"
                    >
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#6C5DFD] shadow-[0_0_12px_rgba(108,93,253,0.6)]" />
                                <span className="text-[10px] font-black tracking-[0.25em] text-[#6C5DFD] uppercase">PARTNER DETAILS</span>
                            </div>
                            <h2 className="text-2xl font-bold text-[#F2F3F6]">Edit Partner</h2>
                            <p className="text-xs text-[#9297A8] mt-1">Modify partner profile, commission schedules, and credentials.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9297A8]">Name</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors"
                                        required
                                    />
                                    {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9297A8]">Email</label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors"
                                        required
                                    />
                                    {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9297A8]">Contact Person</label>
                                    <input
                                        type="text"
                                        value={data.contact_person}
                                        onChange={(e) => setData('contact_person', e.target.value)}
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9297A8]">Phone</label>
                                    <input
                                        type="tel"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9297A8]">Website</label>
                                    <input
                                        type="url"
                                        value={data.website}
                                        onChange={(e) => setData('website', e.target.value)}
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2 border-t border-[rgba(255,255,255,0.05)] pt-6">
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9297A8]">Commission Type</label>
                                    <select
                                        value={data.commission_type}
                                        onChange={(e) => setData('commission_type', e.target.value as 'percentage' | 'fixed')}
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
                                    {errors.commission_rate && <p className="mt-1 text-xs text-rose-500">{errors.commission_rate}</p>}
                                </div>
                            </div>

                            <div className="border-t border-[rgba(255,255,255,0.05)] pt-6 space-y-6">
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9297A8]">Status</label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value as typeof data.status)}
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9297A8]">Description</label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-4 py-3 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors"
                                    />
                                </div>
                            </div>

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
                                    className="flex-1 rounded-2xl bg-[#6C5DFD] py-4 text-sm font-bold text-white shadow-lg hover:bg-[#6C5DFD]/90 transition-all active:scale-[0.98]"
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
                            className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-2xl space-y-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-[#6C5DFD]/10 p-2 text-[#6C5DFD]">
                                    <UserPlusIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#F2F3F6]">Invite Member</h3>
                                    <p className="text-xs text-[#9297A8]">Add administrator for this partner.</p>
                                </div>
                            </div>

                            <form onSubmit={handleInvite} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-[#9297A8]">Name</label>
                                    <input
                                        type="text"
                                        value={inviteForm.data.name}
                                        onChange={(e) => inviteForm.setData('name', e.target.value)}
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-3 py-2 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD]"
                                        placeholder="Jane Doe"
                                        required
                                    />
                                    {inviteForm.errors.name && <p className="mt-1 text-xs text-rose-500">{inviteForm.errors.name}</p>}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-[#9297A8]">Email Address</label>
                                    <input
                                        type="email"
                                        value={inviteForm.data.email}
                                        onChange={(e) => inviteForm.setData('email', e.target.value)}
                                        className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-3 py-2 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD]"
                                        placeholder="member@partner.com"
                                        required
                                    />
                                    {inviteForm.errors.email && <p className="mt-1 text-xs text-rose-500">{inviteForm.errors.email}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={inviteForm.processing}
                                    className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-gray-900 border border-[rgba(255,255,255,0.08)] px-4 py-2.5 text-sm font-bold text-white hover:bg-gray-800 transition-colors disabled:opacity-60"
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
                            className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-2xl space-y-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-gray-950/40 p-2 text-gray-500">
                                    <UserGroupIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#F2F3F6]">Portal Members</h3>
                                    <p className="text-xs text-[#9297A8]">Users with console access.</p>
                                </div>
                            </div>

                            {members.length === 0 ? (
                                <p className="text-sm text-gray-600 py-4 text-center">No portal members active yet.</p>
                            ) : (
                                <ul className="divide-y divide-[rgba(255,255,255,0.05)] max-h-64 overflow-y-auto pr-1">
                                    {members.map((member) => (
                                        <li key={member.id} className="py-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-[#F2F3F6]">{member.name}</p>
                                                <p className="text-xs text-[#9297A8] mt-0.5">{member.email}</p>
                                            </div>
                                            <span className="text-[10px] text-gray-600">
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