import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { update } from '@/actions/App/Http/Controllers/Admin/SettingsController';
import AdminLayout from '@/layouts/AdminLayout';

type Contact = {
    name: string;
    value: string;
};

type Settings = {
    access_codes_enabled: boolean;
    access_code_min_lifespan_minutes: number;
    access_code_max_lifespan_minutes: number;
    access_code_single_use: boolean;
    access_code_auto_expire_unused: boolean;
    access_code_grace_period_minutes: number;
    access_code_daily_limit_per_resident: number | null;
    access_code_require_confirmation: boolean;
    contacts: Contact[];
};

type Props = {
    settings: Settings;
};

function formatDuration(minutes: number): string {
    if (minutes < 1) return '';

    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;

    const parts: string[] = [];

    if (days > 0) {
        parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    }
    if (hours > 0) {
        parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    }
    if (mins > 0 && days === 0) {
        parts.push(`${mins} ${mins === 1 ? 'minute' : 'minutes'}`);
    }

    return parts.length > 0 ? `= ${parts.join(', ')}` : '';
}

export default function Settings({ settings }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        access_codes_enabled: settings.access_codes_enabled,
        access_code_min_lifespan_minutes: settings.access_code_min_lifespan_minutes,
        access_code_max_lifespan_minutes: settings.access_code_max_lifespan_minutes,
        access_code_single_use: settings.access_code_single_use,
        access_code_auto_expire_unused: settings.access_code_auto_expire_unused,
        access_code_grace_period_minutes: settings.access_code_grace_period_minutes,
        access_code_daily_limit_per_resident: settings.access_code_daily_limit_per_resident,
        access_code_require_confirmation: settings.access_code_require_confirmation,
        contacts: settings.contacts || [],
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(update.url());
    }

    function addContact() {
        setData('contacts', [...data.contacts, { name: '', value: '' }]);
    }

    function removeContact(index: number) {
        setData(
            'contacts',
            data.contacts.filter((_, i) => i !== index),
        );
    }

    function updateContact(index: number, field: keyof Contact, value: string) {
        const updated = [...data.contacts];
        updated[index] = { ...updated[index], [field]: value };
        setData('contacts', updated);
    }

    return (
        <AdminLayout>
            <Head title="Settings" />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-8"
            >
                <h1 className="text-2xl font-semibold text-gray-900">Estate Settings</h1>
                <p className="mt-1 text-gray-500">Configure access code behavior and estate-wide preferences.</p>
            </motion.div>

            <form onSubmit={handleSubmit}>
                {/* Access Code System Toggle */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
                    className="mb-6 rounded-xl border border-gray-200 bg-white p-6"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">Access Code System</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Master toggle for the access code feature. When disabled, no new codes can be generated and existing codes are temporarily invalid.
                            </p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                checked={data.access_codes_enabled}
                                onChange={(e) => setData('access_codes_enabled', e.target.checked)}
                                className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100"></div>
                        </label>
                    </div>
                    {!data.access_codes_enabled && (
                        <div className="mt-4 rounded-lg bg-amber-50 p-3">
                            <p className="text-sm text-amber-800">
                                <span className="font-medium">Warning:</span> Access codes are currently disabled. Residents cannot generate new codes and existing codes will not work.
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* Access Code Configuration */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                    className="mb-6 rounded-xl border border-gray-200 bg-white p-6"
                >
                    <h2 className="mb-6 text-lg font-medium text-gray-900">Access Code Configuration</h2>

                    <div className="space-y-6">
                        {/* Lifespan Range */}
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label htmlFor="min_lifespan" className="block text-sm font-medium text-gray-700">
                                    Minimum Lifespan (minutes)
                                </label>
                                <input
                                    type="number"
                                    id="min_lifespan"
                                    min="1"
                                    max="10080"
                                    value={data.access_code_min_lifespan_minutes}
                                    onChange={(e) => setData('access_code_min_lifespan_minutes', parseInt(e.target.value) || 1)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Shortest allowed code validity (1 min to 7 days)
                                    {data.access_code_min_lifespan_minutes > 0 && (
                                        <span className="ml-1 font-medium text-primary-600">
                                            {formatDuration(data.access_code_min_lifespan_minutes)}
                                        </span>
                                    )}
                                </p>
                                {errors.access_code_min_lifespan_minutes && (
                                    <p className="mt-1 text-sm text-red-600">{errors.access_code_min_lifespan_minutes}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="max_lifespan" className="block text-sm font-medium text-gray-700">
                                    Maximum Lifespan (minutes)
                                </label>
                                <input
                                    type="number"
                                    id="max_lifespan"
                                    min="1"
                                    max="10080"
                                    value={data.access_code_max_lifespan_minutes}
                                    onChange={(e) => setData('access_code_max_lifespan_minutes', parseInt(e.target.value) || 1)}
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Longest allowed code validity (must be ≥ minimum)
                                    {data.access_code_max_lifespan_minutes > 0 && (
                                        <span className="ml-1 font-medium text-primary-600">
                                            {formatDuration(data.access_code_max_lifespan_minutes)}
                                        </span>
                                    )}
                                </p>
                                {errors.access_code_max_lifespan_minutes && (
                                    <p className="mt-1 text-sm text-red-600">{errors.access_code_max_lifespan_minutes}</p>
                                )}
                            </div>
                        </div>

                        {/* Grace Period */}
                        <div>
                            <label htmlFor="grace_period" className="block text-sm font-medium text-gray-700">
                                Grace Period (minutes)
                            </label>
                            <input
                                type="number"
                                id="grace_period"
                                min="0"
                                max="60"
                                value={data.access_code_grace_period_minutes}
                                onChange={(e) => setData('access_code_grace_period_minutes', parseInt(e.target.value) || 0)}
                                className="mt-1 block w-full max-w-xs rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Buffer time after expiry to account for real-world delays (0-60 minutes)
                                {data.access_code_grace_period_minutes > 0 && (
                                    <span className="ml-1 font-medium text-primary-600">
                                        {formatDuration(data.access_code_grace_period_minutes)}
                                    </span>
                                )}
                            </p>
                            {errors.access_code_grace_period_minutes && (
                                <p className="mt-1 text-sm text-red-600">{errors.access_code_grace_period_minutes}</p>
                            )}
                        </div>

                        {/* Daily Limit */}
                        <div>
                            <label htmlFor="daily_limit" className="block text-sm font-medium text-gray-700">
                                Daily Limit per Resident
                            </label>
                            <input
                                type="number"
                                id="daily_limit"
                                min="1"
                                max="100"
                                value={data.access_code_daily_limit_per_resident ?? ''}
                                onChange={(e) =>
                                    setData('access_code_daily_limit_per_resident', e.target.value ? parseInt(e.target.value) : null)
                                }
                                placeholder="Unlimited"
                                className="mt-1 block w-full max-w-xs rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                            />
                            <p className="mt-1 text-xs text-gray-500">Maximum codes a resident can generate per day. Leave empty for unlimited.</p>
                            {errors.access_code_daily_limit_per_resident && (
                                <p className="mt-1 text-sm text-red-600">{errors.access_code_daily_limit_per_resident}</p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Access Code Behavior */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
                    className="mb-6 rounded-xl border border-gray-200 bg-white p-6"
                >
                    <h2 className="mb-6 text-lg font-medium text-gray-900">Access Code Behavior</h2>

                    <div className="space-y-4">
                        {/* Single Use */}
                        <label className="flex cursor-pointer items-start gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={data.access_code_single_use}
                                onChange={(e) => setData('access_code_single_use', e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <div>
                                <span className="block text-sm font-medium text-gray-900">Single-use codes</span>
                                <span className="block text-sm text-gray-500">
                                    When enabled, an access code becomes invalid after first successful use
                                </span>
                            </div>
                        </label>

                        {/* Auto Expire */}
                        <label className="flex cursor-pointer items-start gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={data.access_code_auto_expire_unused}
                                onChange={(e) => setData('access_code_auto_expire_unused', e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <div>
                                <span className="block text-sm font-medium text-gray-900">Auto-expire unused codes</span>
                                <span className="block text-sm text-gray-500">
                                    Automatically invalidate codes that are never used after their expiry time
                                </span>
                            </div>
                        </label>

                        {/* Require Confirmation */}
                        <label className="flex cursor-pointer items-start gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={data.access_code_require_confirmation}
                                onChange={(e) => setData('access_code_require_confirmation', e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <div>
                                <span className="block text-sm font-medium text-gray-900">Require resident confirmation</span>
                                <span className="block text-sm text-gray-500">
                                    Valid codes still require resident approval before granting entry (higher security)
                                </span>
                            </div>
                        </label>
                    </div>
                </motion.div>

                {/* Estate Contacts */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                    className="mb-6 rounded-xl border border-gray-200 bg-white p-6"
                >
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">Contacts</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Add important contact numbers for the estate that residents and security can reference.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={addContact}
                            disabled={data.contacts.length >= 20}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4" />
                            Add Contact
                        </button>
                    </div>

                    {data.contacts.length === 0 ? (
                        <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
                            <p className="text-sm text-gray-500">No contacts added yet. Click "Add Contact" to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data.contacts.map((contact, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={contact.name}
                                            onChange={(e) => updateContact(index, 'name', e.target.value)}
                                            placeholder="Contact name (e.g., Security, Manager)"
                                            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                        />
                                        {errors[`contacts.${index}.name` as keyof typeof errors] && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors[`contacts.${index}.name` as keyof typeof errors]}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={contact.value}
                                            onChange={(e) => updateContact(index, 'value', e.target.value)}
                                            placeholder="Phone number"
                                            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                        />
                                        {errors[`contacts.${index}.value` as keyof typeof errors] && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors[`contacts.${index}.value` as keyof typeof errors]}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeContact(index)}
                                        className="rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                        title="Remove contact"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {errors.contacts && <p className="mt-3 text-sm text-red-600">{errors.contacts}</p>}
                </motion.div>

                {/* Save Button */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
                    className="flex justify-end"
                >
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                    >
                        {processing ? 'Saving...' : 'Save Settings'}
                    </button>
                </motion.div>
            </form>
        </AdminLayout>
    );
}
