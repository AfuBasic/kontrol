import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { index, store } from '@/actions/App/Http/Controllers/Admin/SecurityPersonnelController';
import AdminLayout from '@/Layouts/AdminLayout';

type ZoneOption = {
    id: number;
    name: string;
};

export default function CreateSecurity({ zones = [] }: { zones?: ZoneOption[] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        badge_number: '',
        zone_id: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(store.url());
    }

    return (
        <>
            <Head title="Add Security Personnel" />

            <div className="mx-auto max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                    className="mb-8"
                >
                    <h1 className="text-2xl font-semibold text-gray-900">Add Security Personnel</h1>
                    <p className="mt-1 text-gray-500">Invite a new security staff member. They'll receive an email to set up their account.</p>
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

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                placeholder="security@example.com"
                            />
                            <p className="mt-1 text-xs text-gray-500">An invitation will be sent to this email.</p>
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                Phone Number <span className="text-gray-400">(optional)</span>
                            </label>
                            <input
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                id="phone"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                placeholder="+1 (555) 000-0000"
                            />
                            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                        </div>

                        {/* Coverage Scope Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Operational Scope & Coverage
                            </label>
                            <p className="mt-0.5 text-xs text-gray-500">Determine where this officer has administrative and access authority.</p>

                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${data.zone_id === '' ? 'border-primary-600 bg-primary-50/20 ring-1 ring-primary-600' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <input
                                        type="radio"
                                        name="scope_mode"
                                        checked={data.zone_id === ''}
                                        onChange={() => setData('zone_id', '')}
                                        className="mt-0.5 text-primary-600 focus:ring-primary-500"
                                    />
                                    <div>
                                        <span className="block text-xs font-bold text-gray-900">Entire Estate</span>
                                        <span className="mt-0.5 block text-[11px] text-gray-500">Officer can operate across all gates, visitor logs, and zones.</span>
                                    </div>
                                </label>

                                {zones.length > 0 && (
                                    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${data.zone_id !== '' ? 'border-primary-600 bg-primary-50/20 ring-1 ring-primary-600' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <input
                                            type="radio"
                                            name="scope_mode"
                                            checked={data.zone_id !== ''}
                                            onChange={() => setData('zone_id', zones[0]?.id.toString() || '')}
                                            className="mt-0.5 text-primary-600 focus:ring-primary-500"
                                        />
                                        <div>
                                            <span className="block text-xs font-bold text-gray-900">Specific Zone</span>
                                            <span className="mt-0.5 block text-[11px] text-gray-500">Restrict officer's scope to a single operational phase or block.</span>
                                        </div>
                                    </label>
                                )}
                            </div>

                            {/* Zone Selector Dropdown when Specific Zone is selected */}
                            {data.zone_id !== '' && zones.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4"
                                >
                                    <label htmlFor="zone_id" className="block text-xs font-semibold text-gray-700">
                                        Select Operational Zone
                                    </label>
                                    <select
                                        id="zone_id"
                                        value={data.zone_id}
                                        onChange={(e) => setData('zone_id', e.target.value)}
                                        className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                    >
                                        {zones.map((zone) => (
                                            <option key={zone.id} value={zone.id}>
                                                {zone.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.zone_id && <p className="mt-1 text-xs text-red-600">{errors.zone_id}</p>}
                                </motion.div>
                            )}
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

                    <div className="mt-8 flex items-center justify-end gap-4">
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
                            {processing ? 'Sending Invitation...' : 'Send Invitation'}
                        </button>
                    </div>
                </motion.form>
            </div>
        </>
    );
}
