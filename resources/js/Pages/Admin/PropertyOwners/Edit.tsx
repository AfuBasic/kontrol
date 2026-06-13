import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { index, update } from '@/actions/App/Http/Controllers/Admin/PropertyOwnerController';
import AdminLayout from '@/Layouts/AdminLayout';

interface PropertyOwner {
    id: number;
    ulid: string;
    name: string;
    email: string;
    phone: string | null;
    unit_number: string | null;
    address: string | null;
    email_verified_at: string | null;
}

interface Props {
    propertyOwner: PropertyOwner;
}

export default function Edit({ propertyOwner }: Props) {
    const isVerified = !!propertyOwner.email_verified_at;

    const { data, setData, put, processing, errors } = useForm({
        name: propertyOwner.name,
        email: propertyOwner.email,
        phone: propertyOwner.phone || '',
        unit_number: propertyOwner.unit_number || '',
        address: propertyOwner.address || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(update.url(propertyOwner.ulid));
    };

    return (
        <div className="mx-auto max-w-2xl">
            <Head title={`Edit Property Owner - ${propertyOwner.name}`} />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                className="mb-8"
            >
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href={index.url()} className="transition-colors hover:text-[#1F6FDB]">
                        Property Owners
                    </Link>
                    <span>/</span>
                    <span className="font-medium text-gray-900">Edit Property Owner</span>
                </div>
                <h1 className="mt-2 text-2xl font-semibold text-gray-900">Edit Property Owner</h1>
                <p className="mt-1 text-gray-500">Update contact and address information for {propertyOwner.name}.</p>
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
                                    : 'border-gray-300 focus:border-[#1F6FDB] focus:ring-blue-50'
                            }`}
                            required
                        />
                        <p className="mt-2 text-xs text-gray-400">
                            {isVerified
                                ? 'Email is verified and cannot be changed for security.'
                                : "You can edit the email address because the owner hasn't verified it yet."}
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
                            className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm transition-all focus:border-[#1F6FDB] focus:ring-2 focus:ring-blue-50 focus:outline-none"
                            placeholder="Enter owner's full name"
                            required
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
                            className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm transition-all focus:border-[#1F6FDB] focus:ring-2 focus:ring-blue-50 focus:outline-none"
                            placeholder="+234..."
                        />
                        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                    </div>

                    {/* Unit Number & Address */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <label htmlFor="unit_number" className="block text-sm font-medium text-gray-700">
                                Primary Unit Number <span className="font-normal text-gray-400">(optional)</span>
                            </label>
                            <input
                                type="text"
                                id="unit_number"
                                value={data.unit_number}
                                onChange={(e) => setData('unit_number', e.target.value)}
                                className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm transition-all focus:border-[#1F6FDB] focus:ring-2 focus:ring-blue-50 focus:outline-none"
                                placeholder="e.g., Block C, Villa 12"
                            />
                            {errors.unit_number && <p className="mt-1 text-sm text-red-600">{errors.unit_number}</p>}
                        </div>

                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                Street Address <span className="font-normal text-gray-400">(optional)</span>
                            </label>
                            <input
                                type="text"
                                id="address"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm transition-all focus:border-[#1F6FDB] focus:ring-2 focus:ring-blue-50 focus:outline-none"
                                placeholder="e.g., 123 Palm Street"
                            />
                            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex items-center justify-end gap-4 border-t border-gray-100 pt-6">
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
            </motion.form>
        </div>
    );
}

Edit.layout = (page: React.ReactNode) => <AdminLayout children={page} title="Edit Property Owner" />;
