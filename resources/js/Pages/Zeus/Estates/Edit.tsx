import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import ZeusLayout from '@/layouts/ZeusLayout';

interface Props {
    estate: {
        id: number;
        name: string;
        email: string;
        address: string | null;
        status: 'active' | 'inactive';
        admin_accepted: boolean;
        charge_type: 'residents' | 'estate';
        free_trial_enabled: boolean;
        free_trial_days: number;
    };
}

export default function EditEstate({ estate }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: estate.name,
        email: estate.email,
        address: estate.address || '',
        status: estate.status,
        charge_type: estate.charge_type,
        free_trial_enabled: estate.free_trial_enabled,
        free_trial_days: estate.free_trial_days,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/zeus/estates/${estate.id}`);
    }

    return (
        <ZeusLayout backUrl="/zeus/dashboard">
            <Head title={`Edit ${estate.name} - Zeus`} />

            <div className="mx-auto max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                    className="mb-8"
                >
                    <h1 className="text-2xl font-semibold text-gray-900">Edit Estate</h1>
                    <p className="mt-1 text-gray-500">Update estate details.</p>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                    onSubmit={handleSubmit}
                    className="rounded-xl border border-gray-200 bg-white p-6"
                >
                    <div className="space-y-6">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Estate Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                placeholder="Enter estate name"
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Admin Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className={`mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none ${
                                    estate.admin_accepted ? 'cursor-not-allowed bg-gray-100 text-gray-500' : ''
                                }`}
                                placeholder="admin@estate.com"
                                disabled={estate.admin_accepted}
                            />
                            {estate.admin_accepted && (
                                <p className="mt-1 text-xs text-gray-500">Email cannot be changed after the admin has accepted the invitation.</p>
                            )}
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        {/* Address */}
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                Address <span className="text-gray-400">(optional)</span>
                            </label>
                            <textarea
                                id="address"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                rows={3}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                placeholder="Enter estate address"
                            />
                            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                Status
                            </label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value as 'active' | 'inactive')}
                                className={`mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none ${
                                    !estate.admin_accepted ? 'cursor-not-allowed bg-gray-100 text-gray-500' : ''
                                }`}
                                disabled={!estate.admin_accepted}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            {!estate.admin_accepted && (
                                <p className="mt-1 text-xs text-gray-500">Estate cannot be activated until the admin accepts the invitation.</p>
                            )}
                            {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                        </div>

                        {/* Billing Model */}
                        <div>
                            <label htmlFor="charge_type" className="block text-sm font-medium text-gray-700">
                                Billing Model
                            </label>
                            <select
                                id="charge_type"
                                value={data.charge_type}
                                onChange={(e) => setData('charge_type', e.target.value as 'residents' | 'estate')}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                            >
                                <option value="estate">Charge Estate</option>
                                <option value="residents">Charge Residents</option>
                            </select>
                            {errors.charge_type && <p className="mt-1 text-sm text-red-600">{errors.charge_type}</p>}
                        </div>

                        {/* Free Trial Enabled */}
                        <div>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={data.free_trial_enabled}
                                    onChange={(e) => setData('free_trial_enabled', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Enable Free Trial</span>
                            </label>
                            <p className="mt-1 text-xs text-gray-500">Allow this estate to start with a trial period before billing begins.</p>
                        </div>

                        {/* Free Trial Days */}
                        {data.free_trial_enabled && (
                            <div>
                                <label htmlFor="free_trial_days" className="block text-sm font-medium text-gray-700">
                                    Trial Duration (Days)
                                </label>
                                <input
                                    type="number"
                                    id="free_trial_days"
                                    min="1"
                                    max="365"
                                    value={data.free_trial_days}
                                    onChange={(e) => setData('free_trial_days', parseInt(e.target.value) || 30)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                />
                                <p className="mt-1 text-xs text-gray-500">Number of days from estate creation before billing begins (default: 30)</p>
                                {errors.free_trial_days && <p className="mt-1 text-sm text-red-600">{errors.free_trial_days}</p>}
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex items-center justify-end gap-4">
                        <Link
                            href="/zeus/dashboard"
                            className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                        >
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </motion.form>
            </div>
        </ZeusLayout>
    );
}
