import { Head, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { KeyRound, Mail, Trash2, UserPlus, Users } from 'lucide-react';
import { type FormEventHandler, useState } from 'react';
import HouseholdMemberController from '@/actions/App/Http/Controllers/Resident/HouseholdMemberController';
import ConfirmationModal from '@/components/ConfirmationModal';
import ResidentLayout from '@/layouts/ResidentLayout';

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

interface PageProps {
    flash: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
}

export default function HouseholdIndex({ members }: Props) {
    const { flash } = usePage<PageProps>().props;
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
        <ResidentLayout>
            <Head title="My Household" />

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Household</h1>
                        <p className="mt-1 text-sm text-gray-500">Manage family members who can access your estate.</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
                    >
                        <UserPlus className="h-4 w-4" />
                        Add Member
                    </button>
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

                {/* Add Member Form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <form onSubmit={handleSubmit} className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                                <h3 className="mb-4 text-base font-semibold text-gray-900">Add Family Member</h3>
                                <p className="mb-4 text-sm text-gray-500">
                                    They'll receive an email invitation to set up their account. Household members can generate visitor access codes
                                    and view the estate board.
                                </p>

                                <div className="space-y-3">
                                    <div>
                                        <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                                            Full Name
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={form.data.name}
                                            onChange={(e) => form.setData('name', e.target.value)}
                                            placeholder="e.g. Jane Doe"
                                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                        />
                                        {form.errors.name && <p className="mt-1 text-xs text-red-600">{form.errors.name}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                                            Email Address
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={form.data.email}
                                            onChange={(e) => form.setData('email', e.target.value)}
                                            placeholder="e.g. jane@example.com"
                                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                        />
                                        {form.errors.email && <p className="mt-1 text-xs text-red-600">{form.errors.email}</p>}
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                                    >
                                        {form.processing ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                                    <circle
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                        fill="none"
                                                        className="opacity-25"
                                                    />
                                                    <path
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                        className="opacity-75"
                                                    />
                                                </svg>
                                                Sending...
                                            </span>
                                        ) : (
                                            <>
                                                <Mail className="h-4 w-4" />
                                                Send Invitation
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
                                        className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Members List */}
                {members.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100"
                    >
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                            <Users className="h-8 w-8 text-indigo-400" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">No household members</h3>
                        <p className="mt-1 text-sm text-gray-500">Add family members to let them generate access codes and view the estate board.</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
                        >
                            <UserPlus className="h-4 w-4" />
                            Add your first member
                        </button>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        {members.map((member, index) => (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
                                        <span className="text-sm font-semibold text-indigo-600">
                                            {member.name
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')
                                                .slice(0, 2)
                                                .toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                                        <p className="text-xs text-gray-500">{member.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                            member.status === 'accepted' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                                        }`}
                                    >
                                        {member.status === 'accepted' ? 'Active' : 'Pending'}
                                    </span>
                                    <button
                                        onClick={() => setMemberToReset(member)}
                                        disabled={resettingId === member.id}
                                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-500 disabled:opacity-50"
                                        title="Reset password"
                                    >
                                        <KeyRound className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setMemberToDelete(member)}
                                        disabled={deletingId === member.id}
                                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                                        title="Remove member"
                                    >
                                        {deletingId === member.id ? (
                                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                                <circle
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="none"
                                                    className="opacity-25"
                                                />
                                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                                            </svg>
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Info Card */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 rounded-2xl bg-indigo-50/50 p-4 ring-1 ring-indigo-100"
                >
                    <h4 className="text-sm font-semibold text-indigo-900">What can household members do?</h4>
                    <ul className="mt-2 space-y-1 text-xs text-indigo-700">
                        <li>• Manage visitors and generate short-term access codes</li>
                        <li>• View the estate community board</li>
                        <li>• Read estate activity and announcements</li>
                    </ul>
                    <p className="mt-2 text-xs text-indigo-600/70">Household members cannot add other members or create long-term codes.</p>
                </motion.div>

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
        </ResidentLayout>
    );
}
