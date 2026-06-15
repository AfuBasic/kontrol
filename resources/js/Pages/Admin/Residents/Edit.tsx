import { Head, Link, useForm, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { index, update, destroy } from '@/actions/App/Http/Controllers/Admin/ResidentController';
import AdminLayout from '@/Layouts/AdminLayout';

type Resident = {
    ulid: string;
    id: number;
    name: string;
    email: string;
    phone: string | null;
    unit_number: string | null;
    address: string | null;
    email_verified_at: string | null;
    property_owner_id: number | null;
    property_id: number | null;
};

type Props = {
    resident: Resident;
    propertyOwners?: { id: number; name: string }[];
};

export default function EditResident({ resident, propertyOwners = [] }: Props) {
    const isVerified = !!resident.email_verified_at;

    const { data, setData, put, processing, errors } = useForm({
        name: resident.name,
        email: resident.email,
        phone: resident.phone || '',
        unit_number: resident.unit_number || '',
        address: resident.address || '',
        property_owner_id: resident.property_owner_id || '',
        property_id: resident.property_id || '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(update.url({ resident: resident.ulid ?? String(resident.id) }));
    }

    function handleDelete() {
        if (confirm('Are you sure you want to remove this resident? This action cannot be undone.')) {
            router.delete(destroy.url({ resident: resident.ulid ?? String(resident.id) }));
        }
    }

    return (
        <div className="mx-auto max-w-2xl">
            <Head title={`Edit Resident - ${resident.name}`} />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                className="mb-8"
            >
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href={index.url()} className="transition-colors hover:text-primary-600">
                        Residents
                    </Link>
                    <span>/</span>
                    <span className="font-medium text-gray-900">Edit Resident</span>
                </div>
                <h1 className="mt-2 text-2xl font-semibold text-gray-900">Edit Resident</h1>
                <p className="mt-1 text-gray-500">Update resident information.</p>
            </motion.div>

            <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                onSubmit={handleSubmit}
                className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xs"
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
                            className={`mt-1 block w-full rounded-xl border px-4 py-3 text-sm transition-all focus:ring-2 focus:outline-none ${
                                isVerified
                                    ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400'
                                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-50'
                            }`}
                        />
                        <p className="mt-2 text-xs text-gray-400">
                            {isVerified
                                ? 'Email is verified and cannot be changed for security.'
                                : "You can edit the email address because the resident hasn't verified it yet."}
                        </p>
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    <div className="my-6 h-px bg-gray-100" />

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
                            className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-50 focus:outline-none"
                            placeholder="Enter resident's full name"
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone Number <span className="font-normal text-gray-400">(optional)</span>
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-50 focus:outline-none"
                            placeholder="+234..."
                        />
                        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                    </div>

                    {/* Unit Number & Address */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <label htmlFor="unit_number" className="block text-sm font-medium text-gray-700">
                                Unit Number
                            </label>
                            <input
                                type="text"
                                id="unit_number"
                                value={data.unit_number}
                                onChange={(e) => setData('unit_number', e.target.value)}
                                className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-50 focus:outline-none"
                                placeholder="e.g., Block A1, Apt 4"
                            />
                            {errors.unit_number && <p className="mt-1 text-sm text-red-600">{errors.unit_number}</p>}
                        </div>

                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                Street Address
                            </label>
                            <input
                                type="text"
                                id="address"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-50 focus:outline-none"
                                placeholder="e.g., 123 Palm Street"
                            />
                            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                        </div>
                    </div>

                    {/* Property Owner Delegation */}
                    <div>
                        <label htmlFor="property_owner_id" className="block text-sm font-medium text-gray-700">
                            Property Owner <span className="font-normal text-gray-400">(optional delegation)</span>
                        </label>
                        <select
                            id="property_owner_id"
                            value={data.property_owner_id}
                            onChange={(e) => setData('property_owner_id', e.target.value)}
                            className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-50 focus:outline-none"
                        >
                            <option value="">None / Standard Resident</option>
                            {propertyOwners.map((owner) => (
                                <option key={owner.id} value={owner.id}>
                                    {owner.name}
                                </option>
                            ))}
                        </select>
                        {errors.property_owner_id && <p className="mt-1 text-sm text-red-600">{errors.property_owner_id}</p>}
                    </div>
                </div>

                <div className="mt-10 flex items-center justify-between border-t border-gray-100 pt-6">
                    <button type="button" onClick={handleDelete} className="text-sm font-semibold text-red-500 transition-colors hover:text-red-600">
                        Remove Resident
                    </button>
                    <div className="flex items-center gap-4">
                        <Link href={index.url()} className="px-6 py-3 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-[#0A3D91] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-800 active:scale-95 disabled:opacity-50"
                        >
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </motion.form>
        </div>
    );
}

EditResident.layout = (page: React.ReactNode) => <AdminLayout children={page} title="Edit Resident" />;
