import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon, Eye, EyeOff } from 'lucide-react';
import { type FormEventHandler, useState } from 'react';
import PushNotificationToggle from '@/components/PushNotificationToggle';
import TelegramLinkToggle from '@/components/TelegramLinkToggle';
import ResidentLayout from '@/layouts/ResidentLayout';
import resident from '@/routes/resident';

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
}

interface PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            roles?: string[];
        };
    };
    mustVerifyEmail: boolean;
    status: string;
    [key: string]: unknown;
}

type SectionKey = 'profile' | 'password' | 'notifications';

const accordionSections: { key: SectionKey; title: string; description: string }[] = [
    { key: 'profile', title: 'Profile Information', description: "Update your account's profile information and email address." },
    { key: 'password', title: 'Update Password', description: 'Ensure your account is using a long, random password to stay secure.' },
    { key: 'notifications', title: 'Notifications', description: 'Configure how you receive alerts about visitor arrivals.' },
];

export default function Edit({ telegram, profile }: Props) {
    const [openSection, setOpenSection] = useState<SectionKey | null>('profile');

    const toggle = (key: SectionKey) => {
        setOpenSection((prev) => (prev === key ? null : key));
    };

    return (
        <ResidentLayout>
            <Head title="Profile" />

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
                <p className="mt-1 text-gray-500">Manage your account settings and preferences.</p>
            </motion.div>

            {/* Accordion Sections */}
            <div className="space-y-4">
                {accordionSections.map((section, index) => {
                    const isOpen = openSection === section.key;

                    return (
                        <motion.div
                            key={section.key}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
                                <button
                                    type="button"
                                    onClick={() => toggle(section.key)}
                                    className="flex w-full items-center justify-between px-6 py-5 text-left sm:px-8"
                                >
                                    <div>
                                        <h2 className="text-lg font-medium text-gray-900">{section.title}</h2>
                                        <p className="mt-0.5 text-sm text-gray-500">{section.description}</p>
                                    </div>
                                    <ChevronDownIcon
                                        className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            className="overflow-hidden"
                                        >
                                            <div className="border-t border-gray-100 px-6 py-6 sm:px-8 sm:py-8">
                                                {section.key === 'profile' && <ProfileForm profile={profile} />}
                                                {section.key === 'password' && <UpdatePasswordForm />}
                                                {section.key === 'notifications' && <NotificationsPanel telegram={telegram} />}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="mt-8 flex justify-center">
                <Link href="/logout" method="post" as="button" className="text-sm font-medium text-red-600 hover:text-red-700">
                    Sign Out
                </Link>
            </div>
        </ResidentLayout>
    );
}

/* ─── Profile Information Form ─── */
function ProfileForm({ profile }: { profile: Props['profile'] }) {
    const user = usePage<PageProps>().props.auth.user;
    const userRoles = user.roles ?? [];
    const isHouseholdMember = userRoles.includes('household_member') && !userRoles.includes('resident');

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
        unit_number: profile.unit_number || '',
        address: profile.address || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(resident.profile.update.url());
    };

    return (
        <form onSubmit={submit}>
            <div className="grid max-w-xl gap-6">
                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:text-sm"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                    />
                    {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Email (read-only) */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        className="mt-1 block w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-500 shadow-sm sm:text-sm"
                        value={data.email}
                        readOnly
                        autoComplete="username"
                    />
                    <p className="mt-1.5 text-xs text-gray-400">Email cannot be changed.</p>
                </div>

                {/* Unit Number (primary residents only) */}
                {!isHouseholdMember && (
                    <div>
                        <label htmlFor="unit_number" className="block text-sm font-medium text-gray-700">
                            Unit / House Number
                        </label>
                        <input
                            id="unit_number"
                            type="text"
                            className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:text-sm"
                            value={data.unit_number}
                            onChange={(e) => setData('unit_number', e.target.value)}
                            placeholder="e.g. Block A, Flat 5"
                        />
                        {errors.unit_number && <p className="mt-2 text-sm text-red-600">{errors.unit_number}</p>}
                    </div>
                )}

                {/* Full Address (primary residents only) */}
                {!isHouseholdMember && (
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                            Full Address
                        </label>
                        <textarea
                            id="address"
                            rows={3}
                            className="mt-1 block w-full resize-none rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:text-sm"
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            placeholder="e.g. Lekki Gardens Estate, Lekki, Lagos"
                            autoComplete="street-address"
                        />
                        <p className="mt-1.5 text-xs text-gray-500">Your full address within the estate (optional).</p>
                        {errors.address && <p className="mt-2 text-sm text-red-600">{errors.address}</p>}
                    </div>
                )}
            </div>

            <div className="mt-8 flex items-center gap-4">
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:scale-95 disabled:opacity-50"
                >
                    Save Changes
                </button>

                <Transition
                    show={recentlySuccessful}
                    enter="transition ease-in-out"
                    enterFrom="opacity-0"
                    leave="transition ease-in-out"
                    leaveTo="opacity-0"
                >
                    <p className="text-sm text-gray-600">Saved.</p>
                </Transition>
            </div>
        </form>
    );
}

/* ─── Update Password Form ─── */
function UpdatePasswordForm() {
    const { data, setData, put, errors, processing, recentlySuccessful, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();
        put(resident.password.update.url(), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <form onSubmit={updatePassword}>
            <div className="grid max-w-xl gap-6">
                <div>
                    <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
                        Current Password
                    </label>
                    <div className="relative mt-1">
                        <input
                            id="current_password"
                            type={showCurrentPassword ? 'text' : 'password'}
                            className="block w-full rounded-xl border border-gray-200 px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:text-sm"
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 outline-none hover:text-gray-600"
                        >
                            {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    {errors.current_password && <p className="mt-2 text-sm text-red-600">{errors.current_password}</p>}
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        New Password
                    </label>
                    <div className="relative mt-1">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            className="block w-full rounded-xl border border-gray-200 px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:text-sm"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 outline-none hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div>
                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                        Confirm Password
                    </label>
                    <div className="relative mt-1">
                        <input
                            id="password_confirmation"
                            type={showConfirmPassword ? 'text' : 'password'}
                            className="block w-full rounded-xl border border-gray-200 px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:text-sm"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 outline-none hover:text-gray-600"
                        >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    {errors.password_confirmation && <p className="mt-2 text-sm text-red-600">{errors.password_confirmation}</p>}
                </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 active:scale-95 disabled:opacity-50"
                >
                    Save
                </button>

                <Transition
                    show={recentlySuccessful}
                    enter="transition ease-in-out"
                    enterFrom="opacity-0"
                    leave="transition ease-in-out"
                    leaveTo="opacity-0"
                >
                    <p className="text-sm text-gray-600">Saved.</p>
                </Transition>
            </div>
        </form>
    );
}

/* ─── Notifications Panel ─── */
function NotificationsPanel({ telegram }: { telegram: Props['telegram'] }) {
    return (
        <div className="space-y-4">
            <PushNotificationToggle />
            <TelegramLinkToggle linked={telegram.linked} botUsername={telegram.bot_username} />
        </div>
    );
}
