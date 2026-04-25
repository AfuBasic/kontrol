import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { User, Lock, Bell, Shield, ChevronRight, LogOut, Mail, Home, MapPin, Zap, Users, Activity, UserCircle, Eye, EyeOff } from 'lucide-react';
import { type FormEventHandler, useState } from 'react';
import TelegramLinkToggle from '@/Components/TelegramLinkToggle';
import ResidentLayout from '@/Layouts/ResidentLayout';
import resident from '@/Routes/resident';
import MobileSheet from '@/Components/MobileSheet';
import type { SharedData } from '@/Types';

interface Props {
    mustVerifyEmail: boolean;
    status?: string;
    telegram: {
        linked: boolean;
        bot_username: string;
    };
    profile: {
        unit_number: string;
        address: string;
    };
    stats: {
        active_codes_count: number;
        household_members_count: number;
        last_activity: string;
    };
}

export default function Edit({ telegram, profile, stats }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [activeSheet, setActiveSheet] = useState<'profile' | 'password' | null>(null);

    const userInitials = auth.user?.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <ResidentLayout>
            <Head title="Profile Hub" />

            <div className="flex flex-col gap-8 pb-32">
                {/* 1. PREMIUM PROFILE HEADER */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[32px] bg-slate-900 p-8 text-white shadow-2xl"
                >
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-indigo-500/20 blur-3xl" />
                    <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-8 translate-y-8 rounded-full bg-emerald-500/10 blur-3xl" />

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="group relative">
                            <div className="h-24 w-24 rounded-[24px] bg-gradient-to-br from-indigo-500 to-purple-600 p-1 shadow-xl ring-4 ring-white/10">
                                <div className="flex h-full w-full items-center justify-center rounded-[20px] bg-slate-900 text-3xl font-black">
                                    {userInitials}
                                </div>
                            </div>
                            <div className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-slate-900">
                                <Zap className="h-4 w-4 text-white" fill="currentColor" />
                            </div>
                        </div>

                        <div className="mt-6">
                            <h1 className="text-2xl font-black tracking-tight">{auth.user?.name}</h1>
                            <div className="mt-2 flex items-center justify-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black tracking-widest text-indigo-300 uppercase ring-1 ring-white/10">
                                    <Shield className="h-3 w-3" />
                                    Resident
                                </span>
                                <span className="text-xs font-bold text-slate-400">{auth.user?.email}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 2. UNIFIED ACCOUNT OVERVIEW */}
                <div className="flex items-center rounded-[32px] bg-white py-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200">
                    <div className="flex-1 border-r border-slate-50 px-2 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                            <Zap className="h-5 w-5" fill="currentColor" />
                        </div>
                        <p className="text-xl font-black text-slate-900">{stats.active_codes_count}</p>
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Active</p>
                    </div>

                    <div className="flex-1 border-r border-slate-50 px-2 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <Users className="h-5 w-5" />
                        </div>
                        <p className="text-xl font-black text-slate-900">{stats.household_members_count}</p>
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Family</p>
                    </div>

                    <div className="flex-1 px-2 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <Activity className="h-5 w-5" />
                        </div>
                        <p className="text-xl font-black text-slate-900">
                            {stats.last_activity === 'No recent activity' ? 'None' : stats.last_activity.split(' ')[0]}
                        </p>
                        <p className="truncate text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            {stats.last_activity === 'No recent activity' ? 'Activity' : stats.last_activity.split(' ').slice(1).join(' ')}
                        </p>
                    </div>
                </div>

                {/* 3. SETTINGS GROUPS */}
                <div className="space-y-8">
                    {/* Account Section */}
                    <section>
                        <h2 className="mb-4 px-2 text-xs font-black tracking-[0.2em] text-slate-400 uppercase">Account</h2>
                        <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200">
                            <SettingsRow
                                icon={<UserCircle className="h-5 w-5" />}
                                label="Profile Information"
                                description="Update your name and address"
                                onClick={() => setActiveSheet('profile')}
                            />
                            <div className="mx-6 h-px bg-slate-50" />
                            <SettingsRow
                                icon={<Lock className="h-5 w-5" />}
                                label="Security"
                                description="Update your account password"
                                onClick={() => setActiveSheet('password')}
                            />
                        </div>
                    </section>

                    {/* Integrations Section */}
                    <section>
                        <h2 className="mb-4 px-2 text-xs font-black tracking-[0.2em] text-slate-400 uppercase">Integrations</h2>
                        <div className="overflow-hidden rounded-[32px] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200">
                            <TelegramLinkToggle linked={telegram.linked} botUsername={telegram.bot_username} />
                        </div>
                    </section>

                    {/* Danger Zone */}
                    <div className="px-2">
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="flex w-full items-center justify-center gap-3 rounded-[24px] bg-rose-50 py-4 text-sm font-black text-rose-600 ring-1 ring-rose-100 transition-all hover:bg-rose-100 active:scale-[0.98]"
                        >
                            <LogOut className="h-5 w-5" />
                            Sign Out Account
                        </Link>
                    </div>
                </div>
            </div>

            {/* EDIT SHEETS */}
            <MobileSheet isOpen={activeSheet === 'profile'} onClose={() => setActiveSheet(null)} title="Profile Information">
                <div className="p-1">
                    <ProfileForm profile={profile} onSuccess={() => setActiveSheet(null)} />
                </div>
            </MobileSheet>

            <MobileSheet isOpen={activeSheet === 'password'} onClose={() => setActiveSheet(null)} title="Update Password">
                <div className="p-1">
                    <UpdatePasswordForm onSuccess={() => setActiveSheet(null)} />
                </div>
            </MobileSheet>
        </ResidentLayout>
    );
}

function SettingsRow({ icon, label, description, onClick }: { icon: React.ReactNode; label: string; description: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex w-full items-center justify-between p-6 text-left transition-all hover:bg-slate-50 active:bg-slate-100"
        >
            <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-black text-slate-900">{label}</p>
                    <p className="text-xs font-bold text-slate-400">{description}</p>
                </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300" />
        </button>
    );
}

/* ─── Profile Information Form ─── */
function ProfileForm({ profile, onSuccess }: { profile: Props['profile']; onSuccess: () => void }) {
    const user = usePage<SharedData>().props.auth.user;
    const userRoles = user?.roles ?? [];
    const isHouseholdMember = userRoles.includes('household_member') && !userRoles.includes('resident');

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user?.name ?? '',
        unit_number: profile.unit_number || '',
        address: profile.address || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(resident.profile.update.url(), {
            onSuccess: () => {
                setTimeout(onSuccess, 500);
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-6 pb-8">
            <div className="space-y-4">
                <div>
                    <label className="mb-2 block text-xs font-black tracking-widest text-slate-400 uppercase">Full Name</label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="w-full rounded-[20px] border border-slate-100 bg-slate-50 px-5 py-4 text-base font-bold shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                    />
                    {errors.name && <p className="mt-2 text-xs font-bold text-rose-500">{errors.name}</p>}
                </div>

                {!isHouseholdMember && (
                    <>
                        <div>
                            <label className="mb-2 block text-xs font-black tracking-widest text-slate-400 uppercase">Unit / House Number</label>
                            <input
                                type="text"
                                value={data.unit_number}
                                onChange={(e) => setData('unit_number', e.target.value)}
                                placeholder="e.g. Block A, Flat 5"
                                className="w-full rounded-[20px] border border-slate-100 bg-slate-50 px-5 py-4 text-base font-bold shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-black tracking-widest text-slate-400 uppercase">Full Address</label>
                            <textarea
                                rows={3}
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="e.g. Lekki Gardens Estate, Lekki, Lagos"
                                className="w-full resize-none rounded-[20px] border border-slate-100 bg-slate-50 px-5 py-4 text-base font-bold shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                            />
                        </div>
                    </>
                )}
            </div>

            <button
                type="submit"
                disabled={processing}
                className="w-full rounded-[24px] bg-slate-900 py-4 text-base font-black text-white shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
            >
                {processing ? 'Saving...' : 'Save Changes'}
            </button>
        </form>
    );
}

/* ─── Update Password Form ─── */
function UpdatePasswordForm({ onSuccess }: { onSuccess: () => void }) {
    const { data, setData, put, errors, processing, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(resident.password.update.url(), {
            onSuccess: () => {
                reset();
                setTimeout(onSuccess, 500);
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-6 pb-8">
            <div className="space-y-4">
                <div>
                    <label className="mb-2 block text-xs font-black tracking-widest text-slate-400 uppercase">Current Password</label>
                    <div className="relative">
                        <input
                            type={showCurrent ? 'text' : 'password'}
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            className="w-full rounded-[20px] border border-slate-100 bg-slate-50 px-5 py-4 pr-12 text-base font-bold shadow-sm focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrent(!showCurrent)}
                            className="absolute top-1/2 right-5 -translate-y-1/2 text-slate-400"
                        >
                            {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    {errors.current_password && <p className="mt-2 text-xs font-bold text-rose-500">{errors.current_password}</p>}
                </div>

                <div>
                    <label className="mb-2 block text-xs font-black tracking-widest text-slate-400 uppercase">New Password</label>
                    <div className="relative">
                        <input
                            type={showNew ? 'text' : 'password'}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="w-full rounded-[20px] border border-slate-100 bg-slate-50 px-5 py-4 pr-12 text-base font-bold shadow-sm focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNew(!showNew)}
                            className="absolute top-1/2 right-5 -translate-y-1/2 text-slate-400"
                        >
                            {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    {errors.password && <p className="mt-2 text-xs font-bold text-rose-500">{errors.password}</p>}
                </div>
            </div>

            <button
                type="submit"
                disabled={processing}
                className="w-full rounded-[24px] bg-slate-900 py-4 text-base font-black text-white shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
            >
                {processing ? 'Updating...' : 'Update Password'}
            </button>
        </form>
    );
}
