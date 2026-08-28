import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { User, Shield, ChevronRight, Zap, Users, UserCircle, Crown, X, Loader2, Plus, Wallet, HelpCircle } from 'lucide-react';
import { type FormEventHandler, useState, useEffect } from 'react';
import * as SupportController from '@/actions/App/Http/Controllers/Account/SupportController';
import * as TrustedDeviceController from '@/actions/App/Http/Controllers/Account/TrustedDeviceController';
import * as EmergencyContactController from '@/actions/App/Http/Controllers/Resident/EmergencyContactController';
import { useResidentConfirmation } from '@/Components/ConfirmationProvider';
import ConfirmationSheet from '@/Components/ConfirmationSheet';
import MobileSheet from '@/Components/MobileSheet';
import TelegramLinkToggle from '@/Components/TelegramLinkToggle';

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
    emergency_contacts: {
        id: number;
        name: string;
        phone: string;
        relationship: string | null;
    }[];
    subscription?: {
        name?: string;
        expires_at?: string;
        status?: string;
    };
}

import { useFeature } from '@/Hooks/useFeature';
import resident from '@/routes/resident';
import type { SharedData } from '@/types';

export default function Edit({ telegram, profile, stats, emergency_contacts, subscription }: Props) {
    const { auth } = usePage<SharedData>().props;
    const hasTelegram = useFeature('telegram-bot-integration');
    const hasHousehold = useFeature('household-management');
    const hasPaymentCollection = useFeature('payment-collection');
    const userRoles = auth.user?.roles ?? [];
    const isHouseholdMember = userRoles.includes('household_member') && !userRoles.includes('resident');
    const parentResidentName = auth.user?.household_parent_name;
    const [activeSheet, setActiveSheet] = useState<'profile' | 'emergency_management' | null>(null);
    const [isAddContactSheetOpen, setIsAddContactSheetOpen] = useState(false);

    const CONTACT_LIMIT = 5;

    // Support deep-linking via query param
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const open = urlParams.get('open');
        if (open === 'emergency_management') {
            setActiveSheet('emergency_management');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const userInitials = auth.user?.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <>
            <Head title="Profile" />

            <div className="flex flex-col gap-8 pb-32">
                {/* 1. PREMIUM PROFILE HEADER */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[40px] bg-slate-900 p-8 text-white shadow-2xl"
                >
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 h-48 w-48 translate-x-12 -translate-y-12 rounded-full bg-indigo-500/20 blur-[80px]" />
                    <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-12 translate-y-12 rounded-full bg-emerald-500/10 blur-[80px]" />

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="group relative">
                            <div className="h-28 w-28 rounded-[32px] bg-linear-to-br from-primary-500 to-primary-700 p-1 shadow-2xl ring-4 ring-white/10">
                                <div className="flex h-full w-full items-center justify-center rounded-[28px] bg-slate-900 text-4xl font-black">
                                    {userInitials}
                                </div>
                            </div>
                            <div className="absolute -right-1 -bottom-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 shadow-lg ring-4 ring-slate-900">
                                <Zap className="h-5 w-5 text-white" fill="currentColor" />
                            </div>
                        </div>

                        <div className="mt-6">
                            <h1 className="text-2xl font-black tracking-tight">{auth.user?.name}</h1>
                            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black tracking-[0.2em] text-indigo-300 uppercase ring-1 ring-white/10">
                                    <Shield className="h-3 w-3" />
                                    Resident
                                </span>
                            </div>
                            {isHouseholdMember && parentResidentName && (
                                <p className="mt-4 text-xs font-bold text-slate-400">
                                    Household member of <span className="text-white">{parentResidentName}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* 2. STATS OVERVIEW */}
                <div className="flex items-center rounded-[32px] bg-white py-6 shadow-sm ring-1 ring-slate-200">
                    <div className={`flex-1 ${!isHouseholdMember ? 'border-r border-slate-50' : ''} px-2 text-center`}>
                        <p className="text-xl font-black text-slate-900">{stats.active_codes_count}</p>
                        <p className="text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">Active Codes</p>
                    </div>
                    {!isHouseholdMember && (
                        <div className="flex-1 px-2 text-center">
                            <p className="text-xl font-black text-slate-900">{stats.household_members_count}</p>
                            <p className="text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">Family</p>
                        </div>
                    )}
                </div>

                {/* 2.5. SUBSCRIPTION STATUS */}
                {!isHouseholdMember && subscription?.expires_at && (
                    <div className="group relative overflow-hidden rounded-3xl bg-[#0B101E] p-6 shadow-xl ring-1 ring-white/5 transition-all duration-300 hover:shadow-2xl hover:ring-white/10">
                        {/* Subtle Top Edge Highlight */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent opacity-50 transition-opacity duration-500 group-hover:opacity-100" />

                        {/* Soft Deep Glow */}
                        <div className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full bg-indigo-500/10 blur-[60px]" />

                        <div className="relative z-10 flex flex-col gap-8">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5 text-slate-300">
                                    <Crown className="h-4 w-4 text-indigo-400" strokeWidth={2.5} />
                                    <h2 className="text-[14px] font-medium tracking-wide">{subscription.name || 'Estate Subscription'}</h2>
                                </div>
                                {subscription.status === 'active' || subscription.status === 'trial' ? (
                                    <div className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
                                        <span className="text-[13px] font-medium text-emerald-400">
                                            {subscription.status === 'active' ? 'Active' : 'Trial'}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]"></span>
                                        <span className="text-[13px] font-medium text-rose-400">Expired</span>
                                    </div>
                                )}
                            </div>

                            {/* Body */}
                            <div className="flex flex-col gap-1">
                                <h3 className="text-[28px] font-medium tracking-tight text-white">{subscription.expires_at}</h3>
                                {subscription.expires_at &&
                                    !isNaN(new Date(subscription.expires_at).getTime()) &&
                                    (() => {
                                        const diffTime = new Date(subscription.expires_at).getTime() - new Date().getTime();
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                        return (
                                            <p className="text-[14px] font-medium text-slate-500">
                                                {diffDays > 0 ? `${diffDays} Days Remaining` : `${Math.abs(diffDays)} Days Ago`}
                                            </p>
                                        );
                                    })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. SETTINGS HUB */}
                <div className="space-y-8">
                    {/* Account Section */}
                    <section>
                        <h2 className="mb-4 px-2 text-xs font-black tracking-[0.2em] text-slate-400 uppercase">Personal Information</h2>
                        <div className="overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-slate-200">
                            <SettingsRow
                                icon={<UserCircle className="h-5 w-5" />}
                                label="Profile Information"
                                description="Update your name and address"
                                onClick={() => setActiveSheet('profile')}
                            />
                            <div className="mx-6 h-px bg-slate-50" />
                            <Link href={TrustedDeviceController.index.url()} className="block">
                                <SettingsRow
                                    icon={<Shield className="h-5 w-5" />}
                                    label="Trusted devices"
                                    description="See and remove devices that can sign in"
                                    onClick={() => {}}
                                />
                            </Link>

                            {hasHousehold && !isHouseholdMember && (
                                <>
                                    <div className="mx-6 h-px bg-slate-50" />
                                    <Link href="/resident/household" className="block">
                                        <SettingsRow
                                            icon={<Users className="h-5 w-5" />}
                                            label="Household Management"
                                            description="Manage family members"
                                            onClick={() => {}}
                                        />
                                    </Link>
                                </>
                            )}
                        </div>
                    </section>

                    {/* Billing Section */}
                    {!isHouseholdMember && auth.user?.roles?.includes('resident') && hasPaymentCollection && (
                        <section>
                            <h2 className="mb-4 px-2 text-xs font-black tracking-[0.2em] text-slate-400 uppercase">Balances & Billing</h2>
                            <div className="overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-slate-200">
                                <Link href="/resident/dues" className="block">
                                    <SettingsRow
                                        icon={<Wallet className="h-5 w-5" />}
                                        label="Estate Collections"
                                        description="Review and resolve estate dues"
                                        onClick={() => {}}
                                    />
                                </Link>
                            </div>
                        </section>
                    )}

                    {/* Integrations */}
                    {hasTelegram && (
                        <section>
                            <h2 className="mb-4 px-2 text-xs font-black tracking-[0.2em] text-slate-400 uppercase">Notifications</h2>
                            <div className="overflow-hidden rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
                                <TelegramLinkToggle linked={telegram.linked} botUsername={telegram.bot_username} />
                            </div>
                        </section>
                    )}

                    {/* Support Section */}
                    <section>
                        <h2 className="mb-4 px-2 text-xs font-black tracking-[0.2em] text-slate-400 uppercase">Help & Support</h2>
                        <div className="overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-slate-200">
                            <Link href={SupportController.index.url()} className="block">
                                <SettingsRow
                                    icon={<HelpCircle className="h-5 w-5" />}
                                    label="Help & Support"
                                    description="Contact Kontrol via call, WhatsApp, or email"
                                    onClick={() => {}}
                                />
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
            {/* PROFILE INFORMATION SHEET */}
            <MobileSheet isOpen={activeSheet === 'profile'} onClose={() => setActiveSheet(null)} title="Profile Information">
                <div className="p-1">
                    <ProfileForm profile={profile} onSuccess={() => setActiveSheet(null)} />
                </div>
            </MobileSheet>

            {/* EMERGENCY MANAGEMENT FLOW */}
            <MobileSheet isOpen={activeSheet === 'emergency_management'} onClose={() => setActiveSheet(null)} title="SOS Contacts">
                <div className="p-1">
                    <EmergencyContactsManager contacts={emergency_contacts} limit={CONTACT_LIMIT} onAddClick={() => setIsAddContactSheetOpen(true)} />
                </div>
            </MobileSheet>

            <MobileSheet isOpen={isAddContactSheetOpen} onClose={() => setIsAddContactSheetOpen(false)} title="New Emergency Contact">
                <div className="p-1">
                    <AddEmergencyContactForm onSuccess={() => setIsAddContactSheetOpen(false)} />
                </div>
            </MobileSheet>
        </>
    );
}

function SettingsRow({
    icon,
    label,
    description,
    onClick,
    href,
    target,
}: {
    icon: React.ReactNode;
    label: string;
    description: string;
    onClick?: () => void;
    href?: string;
    target?: string;
}) {
    const content = (
        <>
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
        </>
    );

    const className = 'flex w-full items-center justify-between p-6 text-left transition-all hover:bg-slate-50 active:bg-slate-100 group';

    if (href) {
        return (
            <a href={href} target={target} rel="noopener noreferrer" className={className}>
                {content}
            </a>
        );
    }

    return (
        <button onClick={onClick} className={className}>
            {content}
        </button>
    );
}

/* ─── Profile Information Form ─── */
function ProfileForm({ profile, onSuccess }: { profile: Props['profile']; onSuccess: () => void }) {
    const user = usePage<SharedData>().props.auth.user;
    const userRoles = user?.roles ?? [];
    const isHouseholdMember = userRoles.includes('household_member') && !userRoles.includes('resident');

    const { data, setData, patch, errors, processing } = useForm({
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
        <form onSubmit={submit} className="space-y-6 pb-8" noValidate>
            <div className="space-y-4">
                <div>
                    <label className="mb-2 block text-xs font-black tracking-widest text-slate-400 uppercase">Full Name</label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="w-full rounded-[20px] border border-slate-100 bg-slate-50 px-5 py-4 text-base font-bold text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                    />
                    {errors.name && <p className="mt-2 text-xs font-bold text-rose-500">{errors.name}</p>}
                </div>

                <div>
                    <label className="mb-2 block text-xs font-black tracking-widest text-slate-400 uppercase">Email Address</label>
                    <input
                        type="email"
                        value={user?.email ?? ''}
                        readOnly
                        className="w-full cursor-not-allowed rounded-[20px] border border-slate-100 bg-slate-100/80 px-5 py-4 text-base font-bold text-slate-500 shadow-sm select-none focus:outline-none"
                    />
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
                                className="w-full rounded-[20px] border border-slate-100 bg-slate-50 px-5 py-4 text-base font-bold text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-black tracking-widest text-slate-400 uppercase">Full Address</label>
                            <textarea
                                rows={3}
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="e.g. Lekki Gardens Estate, Lekki, Lagos"
                                className="w-full resize-none rounded-[20px] border border-slate-100 bg-slate-50 px-5 py-4 text-base font-bold text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
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

/* ─── Emergency Contacts Management List ─── */
function EmergencyContactsManager({ contacts, limit, onAddClick }: { contacts: Props['emergency_contacts']; limit: number; onAddClick: () => void }) {
    const { confirm: openConfirm } = useResidentConfirmation();
    const isLimitReached = contacts.length >= limit;
    const [contactToDelete, setContactToDelete] = useState<{ id: number; name: string } | null>(null);

    const handleDelete = () => {
        if (!contactToDelete) return;
        router.delete(EmergencyContactController.destroy.url(contactToDelete.id), {
            onSuccess: () => setContactToDelete(null),
        });
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Legal / Privacy Notice */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[32px] bg-indigo-50/50 p-6 ring-1 ring-indigo-100/50 backdrop-blur-sm"
            >
                <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                        <Shield className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[11px] font-black tracking-widest text-indigo-900 uppercase">Safety & Privacy Notice</p>
                        <p className="text-xs leading-relaxed font-bold text-indigo-600/70">
                            By adding emergency contacts, you acknowledge and agree that their names and phone numbers will be shared with the
                            estate's security personnel and administrators during an active SOS event to facilitate a rapid response.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Header Area with Add Button */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${isLimitReached ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        {contacts.length} / {limit} Contacts
                    </span>
                </div>

                {!isLimitReached && (
                    <button
                        onClick={onAddClick}
                        className="flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-[10px] font-black tracking-widest text-indigo-600 uppercase transition-all active:scale-95"
                    >
                        <Plus className="h-3 w-3" />
                        Add New
                    </button>
                )}
            </div>

            {/* Existing Contacts List */}
            <div className="space-y-4">
                {contacts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-[40px] border-2 border-dashed border-slate-100 bg-white/50 p-12 text-center"
                    >
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                            <Users className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-black text-slate-900">No emergency contacts</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">Add people who should be alerted in emergencies.</p>

                        <button
                            onClick={onAddClick}
                            className="mt-8 flex w-full items-center justify-center gap-3 rounded-[24px] bg-slate-900 py-4 text-sm font-black text-white shadow-xl transition-all active:scale-[0.98]"
                        >
                            <Plus className="h-5 w-5" />
                            Add Your First Contact
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid gap-3">
                        {contacts.map((contact) => (
                            <motion.div
                                layout
                                key={contact.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="group flex items-center justify-between rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-all hover:ring-indigo-100"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-indigo-50 text-indigo-600 shadow-inner transition-colors group-hover:bg-indigo-100">
                                        <User className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <p className="text-base leading-tight font-black text-slate-900">{contact.name}</p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{contact.phone}</p>
                                            <span className="h-1 w-1 rounded-full bg-slate-200" />
                                            <p className="text-[10px] font-bold tracking-wider text-indigo-500 uppercase">
                                                {contact.relationship || 'Contact'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const isIPadOrDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
                                        if (isIPadOrDesktop) {
                                            openConfirm({
                                                title: 'Remove emergency contact',
                                                message: `Are you sure you want to remove ${contact.name}? They will no longer receive your SOS alerts.`,
                                                confirmLabel: 'Remove contact',
                                                onConfirm: () => router.delete(EmergencyContactController.destroy.url(contact.id)),
                                            });
                                        } else {
                                            setContactToDelete({ id: contact.id, name: contact.name });
                                        }
                                    }}
                                    className="flex h-12 w-12 items-center justify-center rounded-full text-slate-300 transition-all hover:bg-rose-50 hover:text-rose-500 active:scale-90"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmationSheet
                isOpen={contactToDelete !== null}
                onClose={() => setContactToDelete(null)}
                onConfirm={handleDelete}
                title="Remove Contact"
                message={`Are you sure you want to remove ${contactToDelete?.name}? They will no longer receive your SOS alerts.`}
                confirmLabel="Remove"
                type="danger"
            />

            {isLimitReached && (
                <div className="rounded-[32px] bg-amber-50 p-6 text-center ring-1 ring-amber-100">
                    <p className="text-sm font-black text-amber-900 uppercase">Maximum Limit Reached</p>
                    <p className="mt-1 text-xs font-bold text-amber-600">You can have up to 5 emergency contacts. Remove one to add a new person.</p>
                </div>
            )}
        </div>
    );
}

/* ─── Add Emergency Contact Form (Inside Sheet) ─── */
function AddEmergencyContactForm({ onSuccess }: { onSuccess: () => void }) {
    const { data, setData, post, processing, reset } = useForm({
        name: '',
        phone: '',
        relationship: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(EmergencyContactController.store.url(), {
            onSuccess: () => {
                reset();
                onSuccess();
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-6 pb-10" noValidate>
            <div className="space-y-4">
                <div className="group relative">
                    <label className="mb-2 block px-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">Contact Name</label>
                    <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        className="w-full rounded-[24px] border border-slate-100 bg-slate-50 px-6 py-5 text-base font-bold text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                    />
                </div>
                <div className="group relative">
                    <label className="mb-2 block px-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">Phone Number</label>
                    <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="e.g. +234..."
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        required
                        className="w-full rounded-[24px] border border-slate-100 bg-slate-50 px-6 py-5 text-base font-bold text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                    />
                </div>
                <div className="group relative">
                    <label className="mb-2 block px-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">Relationship</label>
                    <input
                        type="text"
                        placeholder="e.g. Spouse, Brother"
                        value={data.relationship || ''}
                        onChange={(e) => setData('relationship', e.target.value)}
                        className="w-full rounded-[24px] border border-slate-100 bg-slate-50 px-6 py-5 text-base font-bold text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                    />
                </div>
            </div>

            <p className="px-2 text-[10px] leading-relaxed font-bold text-slate-400 italic">
                * By saving this contact, you authorize the estate's safety team to contact and share incident details with this individual during
                emergency SOS events.
            </p>

            <button
                type="submit"
                disabled={processing}
                className="flex w-full items-center justify-center gap-3 rounded-[28px] bg-slate-900 py-5 text-base font-black text-white shadow-2xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
            >
                {processing ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                    <>
                        <Plus className="h-6 w-6" />
                        Save Contact
                    </>
                )}
            </button>
        </form>
    );
}
