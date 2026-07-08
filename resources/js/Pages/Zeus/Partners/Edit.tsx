import {
    ChevronLeftIcon,
    EnvelopeIcon,
    LinkIcon,
    UserGroupIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Percent, Coins, ShieldCheck, Phone, Mail, User } from 'lucide-react';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface Member {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
}

interface Props {
    partner: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        commission_type: 'percentage' | 'fixed';
        commission_rate: number;
        commission_length: number | null;
        status: 'active' | 'inactive' | 'suspended';
    };
    members: Member[];
    partnerPortalUrl: string;
}

export default function EditPartner({ partner, members, partnerPortalUrl }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: partner.name,
        email: partner.email,
        phone: partner.phone || '',
        commission_type: partner.commission_type,
        commission_rate: partner.commission_rate.toString(),
        commission_length: partner.commission_length ?? 'always',
        status: partner.status,
    });

    const inviteForm = useForm({
        name: '',
        email: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const payload = { ...data };
        if (payload.commission_length === 'always' || payload.commission_length === '') {
            payload.commission_length = '';
        }
        put(`/zeus/partners/${partner.id}`);
    }

    function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        inviteForm.post(`/zeus/partners/${partner.id}/invite-member`, {
            preserveScroll: true,
            onSuccess: () => inviteForm.reset(),
        });
    }

    function resendInvite(memberId: number) {
        router.post(`/zeus/partners/${partner.id}/members/${memberId}/resend-invite`, {}, {
            preserveScroll: true,
        });
    }

    const modeOptions = [
        {
            id: 'percentage',
            title: 'Percentage Rate',
            description: 'Apply percentage of the total transaction fees.',
            icon: Percent,
            color: 'text-[#6C5DFD] border-[#6C5DFD]/20 bg-[#6C5DFD]/5',
        },
        {
            id: 'fixed',
            title: 'Fixed Fee',
            description: 'Apply a flat amount per subscription billing cycle.',
            icon: Coins,
            color: 'text-[#34D399] border-[#34D399]/20 bg-[#34D399]/5',
        },
    ];

    const lengthOptions = [
        { label: '6 Months', value: 6 },
        { label: '1 Year (12m)', value: 12 },
        { label: '2 Years (24m)', value: 24 },
        { label: 'Always Eligible', value: 'always' },
    ];

    const statusOptions = [
        { label: 'Pending', value: 'pending', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
        { label: 'Active', value: 'active', color: 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30' },
        { label: 'Inactive', value: 'inactive', color: 'bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/30' },
        { label: 'Suspended', value: 'suspended', color: 'bg-rose-500/15 text-rose-500 border-rose-500/30' },
    ];

    return (
        <ZeusLayout>
            <Head title={`Edit Partner – ${partner.name}`} />

            <div className="relative mx-auto max-w-4xl px-4 py-8 text-[#F2F3F6] bg-[#0A0B10] min-h-screen space-y-8">
                {/* Decorative Glow */}
                <div className="pointer-events-none absolute top-0 right-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-gradient-to-br from-[#6C5DFD]/5 to-[#A78BFA]/5 blur-[120px] duration-[8000ms]" />

                {/* Header Navigation */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                        href="/zeus/partners"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9297A8] hover:text-[#F2F3F6] transition-colors uppercase tracking-wider"
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
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-[#9297A8]">Partner Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-3.5 h-4 w-4 text-[#9297A8]" />
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] py-3 pr-4 pl-10 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors"
                                            required
                                        />
                                    </div>
                                    {errors.name && <p className="mt-1.5 text-xs text-rose-500">{errors.name}</p>}
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-[#9297A8]">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#9297A8]" />
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] py-3 pr-4 pl-10 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors"
                                                required
                                            />
                                        </div>
                                        {errors.email && <p className="mt-1.5 text-xs text-rose-500">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-[#9297A8]">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-[#9297A8]" />
                                            <input
                                                type="tel"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] py-3 pr-4 pl-10 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD] transition-colors"
                                            />
                                        </div>
                                        {errors.phone && <p className="mt-1.5 text-xs text-rose-500">{errors.phone}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Commission Schedule */}
                            <div className="space-y-6 border-t border-[rgba(255,255,255,0.06)] pt-6">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#9297A8] mb-4">
                                    Commission Schedule
                                </h3>

                                <div className="space-y-3">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {modeOptions.map((opt) => {
                                            const Icon = opt.icon;
                                            const isSelected = data.commission_type === opt.id;
                                            return (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setData('commission_type', opt.id as any)}
                                                    className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
                                                        isSelected
                                                            ? 'border-[#6C5DFD] bg-[#6C5DFD]/5 shadow-lg'
                                                            : 'border-[rgba(255,255,255,0.08)] bg-[#0A0B10] hover:border-gray-700'
                                                    }`}
                                                >
                                                    <div className={`rounded-xl p-2.5 ${opt.color}`}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm font-bold text-[#F2F3F6]">{opt.title}</span>
                                                        <span className="block text-xs text-[#9297A8] mt-1">{opt.description}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {data.commission_type && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden space-y-2 mt-4"
                                        >
                                            <label className="block text-xs font-semibold text-[#9297A8]">
                                                {data.commission_type === 'percentage' ? 'Commission Rate (%)' : 'Flat Amount (₦)'}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3.5 text-sm font-bold text-[#9297A8]">
                                                    {data.commission_type === 'percentage' ? '%' : '₦'}
                                                </span>
                                                <input
                                                    type="number"
                                                    value={data.commission_rate}
                                                    onChange={(e) => setData('commission_rate', e.target.value)}
                                                    min="0"
                                                    max={data.commission_type === 'percentage' ? '100' : undefined}
                                                    step="any"
                                                    className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] py-3 pr-4 pl-9 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD]"
                                                    placeholder={data.commission_type === 'percentage' ? '10' : '5000'}
                                                    required
                                                />
                                            </div>
                                            <p className="text-[10px] text-[#9297A8]">
                                                {data.commission_type === 'fixed'
                                                    ? 'Enter flat amount in Naira (e.g. 5000 = ₦5,000.00)'
                                                    : 'Percentage rate applied to resident transaction fees.'}
                                            </p>
                                            {errors.commission_rate && <p className="text-xs text-rose-500 mt-1">{errors.commission_rate}</p>}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-[#9297A8]">
                                        Commission Length
                                    </label>
                                    <div className="grid gap-2 sm:grid-cols-4">
                                        {lengthOptions.map((opt) => {
                                            const isSelected = data.commission_length === opt.value;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setData('commission_length', opt.value)}
                                                    className={`rounded-xl border py-2.5 text-center text-xs font-bold transition-all ${
                                                        isSelected
                                                            ? 'border-[#6C5DFD] bg-[#6C5DFD] text-white'
                                                            : 'border-[rgba(255,255,255,0.08)] bg-[#0A0B10] text-[#9297A8] hover:border-gray-700'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.commission_length && <p className="text-xs text-rose-500 mt-1">{errors.commission_length}</p>}
                                </div>
                            </div>

                            {/* Lifecycle Status Option */}
                            <div className="space-y-3 border-t border-[rgba(255,255,255,0.06)] pt-6">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#9297A8]">
                                    Account Status
                                </h3>
                                <div className="flex gap-3">
                                    {statusOptions.map((opt) => {
                                        const isSelected = data.status === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setData('status', opt.value as any)}
                                                className={`rounded-full px-4 py-2 text-xs font-bold border transition-all ${
                                                    isSelected
                                                        ? opt.color + ' ring-1 ring-[#6C5DFD]'
                                                        : 'border-[rgba(255,255,255,0.08)] bg-[#0A0B10] text-[#9297A8] hover:border-gray-700'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.status && <p className="text-xs text-rose-500 mt-1">{errors.status}</p>}
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
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-[#F2F3F6]">{member.name}</p>
                                                    {!member.email_verified_at && (
                                                        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-400 border border-blue-500/20">
                                                            Pending
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[#9297A8] mt-0.5">{member.email}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {!member.email_verified_at && (
                                                    <button
                                                        type="button"
                                                        onClick={() => resendInvite(member.id)}
                                                        className="text-xs font-bold text-[#6C5DFD] hover:underline"
                                                    >
                                                        Resend Invite
                                                    </button>
                                                )}
                                                <span className="text-[10px] text-gray-600">
                                                    Joined {new Date(member.created_at).toLocaleDateString('en-NG', { dateStyle: 'short' })}
                                                </span>
                                            </div>
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