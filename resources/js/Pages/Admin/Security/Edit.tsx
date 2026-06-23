import { Head, Link, useForm, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { index, update, destroy } from '@/actions/App/Http/Controllers/Admin/SecurityPersonnelController';
import AdminLayout from '@/Layouts/AdminLayout';

type SecurityPerson = {
    ulid: string;
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    phone: string | null;
    badge_number: string | null;
};

type Props = {
    security: SecurityPerson;
};

export default function EditSecurity({ security }: Props) {
    const isVerified = !!security.email_verified_at;
    const { data, setData, put, processing, errors } = useForm({
        name: security.name,
        email: security.email,
        phone: security.phone || '',
        badge_number: security.badge_number || '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(update.url({ security: security.ulid }));
    }

    function handleDelete() {
        if (confirm('Are you sure you want to remove this security personnel? This action cannot be undone.')) {
            router.delete(destroy.url({ security: security.ulid }));
        }
    }

    return (
        <>
            <Head title="Edit Security Personnel" />

            <div className="mx-auto max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                    className="mb-8"
                >
                    <h1 className="text-2xl font-semibold text-gray-900">Edit Security Personnel</h1>
                    <p className="mt-1 text-gray-500">Update security personnel information. Email cannot be changed.</p>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                    onSubmit={handleSubmit}
                    className="rounded-xl border border-gray-200 bg-white p-6"
                >
                    <div className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                disabled={isVerified}
                                className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm transition-all focus:ring-1 focus:outline-none ${
                                    isVerified
                                        ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400'
                                        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                                }`}
                            />
                            <p className="mt-1 text-xs text-gray-400">
                                {isVerified
                                    ? 'Email is verified and cannot be changed for security.'
                                    : "You can edit the email address because the personnel hasn't verified it yet."}
                            </p>
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                placeholder="Enter full name"
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                Phone Number <span className="text-gray-400">(optional)</span>
                            </label>
                            <input
                                type="tel" inputMode="numeric" pattern="[0-9]*"
                                id="phone"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                placeholder="+1 (555) 000-0000"
                            />
                            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                        </div>

                        {/* Badge Number */}
                        <div>
                            <label htmlFor="badge_number" className="block text-sm font-medium text-gray-700">
                                Badge Number <span className="text-gray-400">(optional)</span>
                            </label>
                            <input
                                type="text"
                                id="badge_number"
                                value={data.badge_number}
                                onChange={(e) => setData('badge_number', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                placeholder="e.g., SEC-001"
                            />
                            {errors.badge_number && <p className="mt-1 text-sm text-red-600">{errors.badge_number}</p>}
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                        >
                            Remove Personnel
                        </button>
                        <div className="flex items-center gap-4">
                            <Link
                                href={index.url()}
                                className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </motion.form>
            </div>
        </>
    );
}
