import { Head, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, FormEventHandler } from 'react';
import HouseholdMemberController from '@/actions/App/Http/Controllers/Resident/HouseholdMemberController';
import ConfirmationModal from '@/Components/ConfirmationModal';
import ResidentLayout from '@/Layouts/ResidentLayout';
import FeatureCard from './Components/FeatureCard';
import { KeyRound, Mail, Trash2, UserPlus, Users, ShieldCheck, Activity, BellRing, Sparkles, Zap } from 'lucide-react';
import MobileSheet from '@/Components/MobileSheet';
import type { SharedData } from '@/types';

interface HouseholdMember {
    id: number;
    name: string;
    email: string;
    status: 'pending' | 'accepted';
    created_at: string;
}

interface Props {
    members: HouseholdMember[];
}

export default function HouseholdIndex({ members }: Props) {
    const { flash, auth } = usePage<SharedData>().props;
    const [showForm, setShowForm] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [memberToDelete, setMemberToDelete] = useState<HouseholdMember | null>(null);
    const [memberToReset, setMemberToReset] = useState<HouseholdMember | null>(null);
    const [resettingId, setResettingId] = useState<number | null>(null);

    const form = useForm({
        name: '',
        email: '',
    });

    const deleteForm = useForm({});
    const resetForm = useForm({});

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(HouseholdMemberController.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setShowForm(false);
            },
        });
    };

    const handleDelete = () => {
        if (!memberToDelete) return;
        setDeletingId(memberToDelete.id);
        deleteForm.delete(HouseholdMemberController.destroy.url({ householdMember: memberToDelete.id }), {
            preserveScroll: true,
            onFinish: () => {
                setDeletingId(null);
                setMemberToDelete(null);
            },
        });
    };

    const handleResetPassword = () => {
        if (!memberToReset) return;
        setResettingId(memberToReset.id);
        resetForm.post(`/resident/household/${memberToReset.id}/reset-password`, {
            preserveScroll: true,
            onFinish: () => {
                setResettingId(null);
                setMemberToReset(null);
            },
        });
    };

    return (
        <>
            <Head title="My Household" />

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                {/* Header */}
                <div className="mb-8 flex items-end justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Household Hub</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">Manage Family</h1>
                        <p className="mt-1 text-sm font-bold text-slate-400">Share community access with your loved ones</p>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowForm(!showForm)}
                        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700"
                    >
                        <UserPlus className="h-6 w-6" />
                    </motion.button>
                </div>

                {/* Flash Messages */}
                <AnimatePresence>
                    {flash?.success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200"
                        >
                            {flash.success}
                        </motion.div>
                    )}
                    {flash?.error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200"
                        >
                            {flash.error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Add Member Form - Premium Bottom Sheet */}
                <MobileSheet isOpen={showForm} onClose={() => setShowForm(false)} title="Add Family Member">
                    {auth?.user?.resident_subscription?.status === 'past_due' ? (
                        <div className="flex flex-col items-center text-center py-8">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-600 mb-6">
                                <ShieldCheck className="h-10 w-10" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-3">Access Restricted</h3>
                            <p className="text-slate-500 font-medium leading-relaxed mb-10 px-4">
                                Your subscription for this estate is currently inactive. Please visit the Kontrol web platform to manage your access.
                            </p>
                            <button 
                                onClick={() => setShowForm(false)}
                                className="w-full rounded-[28px] bg-slate-900 py-5 text-lg font-black text-white shadow-xl transition-all active:scale-95"
                            >
                                Got it
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-1">
                        <p className="mb-6 text-sm font-bold text-slate-400">
                            They'll receive an email invitation to set up their account. Household members can generate visitor access codes
                            and view the estate board.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    autoFocus
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="e.g. Jane Doe"
                                    className="w-full rounded-[20px] border border-slate-100 bg-slate-50 px-5 py-4 text-base font-bold shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                                />
                                {form.errors.name && <p className="mt-2 text-xs font-bold text-rose-500">{form.errors.name}</p>}
                            </div>

                            <div>
                                <label htmlFor="email" className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                    placeholder="e.g. jane@example.com"
                                    className="w-full rounded-[20px] border border-slate-100 bg-slate-50 px-5 py-4 text-base font-bold shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                                />
                                {form.errors.email && <p className="mt-2 text-xs font-bold text-rose-500">{form.errors.email}</p>}
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col gap-3 pb-6">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-[24px] bg-slate-900 py-4 text-base font-black text-white shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
                            >
                                {form.processing ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
                                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                                        </svg>
                                        Sending Invite...
                                    </span>
                                ) : (
                                    <>
                                        <Mail className="h-5 w-5" />
                                        <span>Send Invitation</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    form.reset();
                                    form.clearErrors();
                                }}
                                className="w-full py-2 text-sm font-black text-slate-400 transition-colors hover:text-slate-900"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
                </MobileSheet>

                {/* Members List */}
                {members.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group relative overflow-hidden rounded-[40px] bg-slate-900 p-12 text-center shadow-2xl"
                    >
                        <div className="absolute inset-0 opacity-[0.1] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[32px] bg-white/10 text-white backdrop-blur-md transition-transform group-hover:rotate-6">
                            <Users className="h-12 w-12" />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight text-white">Your household is empty</h3>
                        <p className="mt-3 text-sm font-medium leading-relaxed text-slate-400 px-4">
                            Add family members to share control. They'll be able to generate their own visitor codes and stay updated.
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-black text-slate-900 shadow-xl transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <UserPlus className="h-5 w-5" />
                            Add first member
                        </button>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Household Members ({members.length})</h3>
                        </div>
                        {members.map((member, index) => (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className="group relative flex items-center justify-between rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200 transition-all hover:shadow-lg"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-black text-white">
                                            {member.name[0].toUpperCase()}
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${member.status === 'accepted' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-slate-900">{member.name}</p>
                                        <p className="text-xs font-bold text-slate-400">{member.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setMemberToReset(member)}
                                        className="rounded-xl p-3 text-slate-400 transition-all hover:bg-slate-50 hover:text-indigo-600 active:scale-90"
                                    >
                                        <KeyRound className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => setMemberToDelete(member)}
                                        className="rounded-xl p-3 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-500 active:scale-90"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Features Section */}
                <div className="mt-12 space-y-6 pb-32">
                    <div className="px-2">
                        <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">What they can do</h3>
                    </div>
                    <div className="grid gap-4">
                        <FeatureCard 
                            title="Visitor Management"
                            description="They can generate short-term access codes for their own guests and deliveries."
                            icon={<Zap className="h-6 w-6" />}
                            color="bg-indigo-50 text-indigo-600"
                            delay={0.1}
                        />
                        <FeatureCard 
                            title="Community Board"
                            description="Stay updated with announcements and community activities on the estate board."
                            icon={<BellRing className="h-6 w-6" />}
                            color="bg-amber-50 text-amber-600"
                            delay={0.2}
                        />
                        <FeatureCard 
                            title="Real-time Activity"
                            description="View visitor entries and exits related to your home in the live activity feed."
                            icon={<Activity className="h-6 w-6" />}
                            color="bg-emerald-50 text-emerald-600"
                            delay={0.3}
                        />
                    </div>
                    <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck className="h-5 w-5 text-indigo-400" />
                            <h4 className="text-sm font-black uppercase tracking-widest">Privacy & Control</h4>
                        </div>
                        <p className="text-xs font-medium leading-relaxed text-slate-400">
                            Household members cannot add other members or create long-term codes. You remain the primary administrator of your home.
                        </p>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={memberToDelete !== null}
                    onClose={() => setMemberToDelete(null)}
                    onConfirm={handleDelete}
                    title="Remove household member"
                    message={`Are you sure you want to remove ${memberToDelete?.name ?? 'this member'}? They will lose access to the estate.`}
                    confirmLabel="Remove"
                    type="danger"
                    isLoading={deletingId !== null}
                />

                {/* Reset Password Confirmation Modal */}
                <ConfirmationModal
                    isOpen={memberToReset !== null}
                    onClose={() => setMemberToReset(null)}
                    onConfirm={handleResetPassword}
                    title="Reset password"
                    message={`Send a password reset email to ${memberToReset?.name ?? 'this member'}? Their current password will be invalidated.`}
                    confirmLabel="Send Reset Email"
                    type="warning"
                    isLoading={resettingId !== null}
                />
            </motion.div>
        </>
    );
}
