import { Head, Link, useForm } from '@inertiajs/react';
import { index, update } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/ResidentController';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Resident {
    id: number;
    ulid: string;
    name: string;
    email: string;
    phone: string | null;
    unit_number: string | null;
    address: string | null;
    property_id: number | null;
}

interface Property {
    id: number;
    name: string;
}

interface Props {
    resident: Resident;
    properties: Property[];
}

export default function Edit({ resident, properties }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: resident.name,
        phone: resident.phone || '',
        unit_number: resident.unit_number || '',
        address: resident.address || '',
        property_id: resident.property_id || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(update.url(resident.ulid));
    };

    return (
        <div className="mx-auto max-w-2xl pb-24">
            <Head title={`Edit Resident - ${resident.name}`} />

            <div className="mb-6 flex items-center gap-2">
                <Link
                    href={index.url()}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-650 hover:bg-slate-50 shadow-xs ring-1 ring-slate-100 transition-all"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-black text-slate-900">Edit Resident Profile</h1>
                    <p className="text-xs text-slate-550">Update resident information and property assignment.</p>
                </div>
            </div>

            <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                onSubmit={handleSubmit}
                className="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-100 sm:p-8"
            >
                <div className="space-y-6">
                    {/* Readonly email */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                            Email Address
                        </label>
                        <input
                            type="text"
                            value={resident.email}
                            disabled
                            className="mt-2 block w-full rounded-2xl border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-400 font-bold focus:outline-none"
                        />
                        <p className="mt-1 text-[10px] text-slate-400 font-bold">Email address is managed by the system and cannot be edited.</p>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Name */}
                    <div>
                        <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-2 block w-full rounded-2xl border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-indigo-550"
                            placeholder="Enter full name"
                        />
                        {errors.name && <p className="mt-1 text-xs text-rose-600 font-bold">{errors.name}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                        <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            className="mt-2 block w-full rounded-2xl border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-indigo-555"
                            placeholder="+234..."
                        />
                        {errors.phone && <p className="mt-1 text-xs text-rose-600 font-bold">{errors.phone}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {/* Unit Number */}
                        <div>
                            <label htmlFor="unit_number" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Unit Number
                            </label>
                            <input
                                type="text"
                                id="unit_number"
                                value={data.unit_number}
                                onChange={(e) => setData('unit_number', e.target.value)}
                                className="mt-2 block w-full rounded-2xl border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-indigo-555"
                                placeholder="e.g. Block 4, Apt A2"
                            />
                            {errors.unit_number && <p className="mt-1 text-xs text-rose-600 font-bold">{errors.unit_number}</p>}
                        </div>

                        {/* Property assignment */}
                        <div>
                            <label htmlFor="property_id" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Assigned Property
                            </label>
                            <select
                                id="property_id"
                                value={data.property_id}
                                onChange={(e) => setData('property_id', e.target.value)}
                                className="mt-2 block w-full rounded-2xl border-slate-200 px-4 py-3 text-sm bg-white focus:border-indigo-500 focus:ring-indigo-555"
                            >
                                <option value="">None / Floating Resident</option>
                                {properties.map((prop) => (
                                    <option key={prop.id} value={prop.id}>
                                        {prop.name}
                                    </option>
                                ))}
                            </select>
                            {errors.property_id && <p className="mt-1 text-xs text-rose-600 font-bold">{errors.property_id}</p>}
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label htmlFor="address" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Physical Address
                        </label>
                        <textarea
                            id="address"
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            rows={3}
                            className="mt-2 block w-full rounded-2xl border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-indigo-555"
                            placeholder="Enter full street address"
                        />
                        {errors.address && <p className="mt-1 text-xs text-rose-600 font-bold">{errors.address}</p>}
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
                    <Link
                        href={index.url()}
                        className="rounded-2xl px-6 py-3 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-750 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/10 transition-all hover:from-indigo-500 hover:to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 disabled:opacity-50"
                    >
                        {processing ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </motion.form>
        </div>
    );
}
