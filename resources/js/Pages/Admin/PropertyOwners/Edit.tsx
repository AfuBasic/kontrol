import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { index, update } from '@/actions/App/Http/Controllers/Admin/PropertyOwnerController';

interface PropertyOwner {
    id: number;
    ulid: string;
    name: string;
    email: string;
    phone: string | null;
    unit_number: string | null;
    address: string | null;
}

interface Props {
    propertyOwner: PropertyOwner;
}

export default function Edit({ propertyOwner }: Props) {
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
        <>
            <Head title="Edit Property Owner" />

            <div className="max-w-2xl space-y-6">
                <div className="flex items-center gap-3">
                    <Link
                        href={index.url()}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-100 hover:bg-slate-50 transition-all"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Edit Property Owner</h1>
                        <p className="mt-0.5 text-sm text-slate-505">Update contact and address information for {propertyOwner.name}.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-100 space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="col-span-full">
                            <label className="block text-sm font-bold text-slate-700">Full Name</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1.5 w-full rounded-2xl border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            />
                            {errors.name && <p className="mt-1 text-xs font-bold text-rose-600">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700">Email Address</label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="mt-1.5 w-full rounded-2xl border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            />
                            {errors.email && <p className="mt-1 text-xs font-bold text-rose-600">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700">Phone Number</label>
                            <input
                                type="text"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                className="mt-1.5 w-full rounded-2xl border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            {errors.phone && <p className="mt-1 text-xs font-bold text-rose-600">{errors.phone}</p>}
                        </div>

                        <div className="col-span-full">
                            <label className="block text-sm font-bold text-slate-700">Primary Unit Number</label>
                            <input
                                type="text"
                                value={data.unit_number}
                                onChange={(e) => setData('unit_number', e.target.value)}
                                placeholder="e.g. Block C, Villa 12"
                                className="mt-1.5 w-full rounded-2xl border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            {errors.unit_number && <p className="mt-1 text-xs font-bold text-rose-600">{errors.unit_number}</p>}
                        </div>

                        <div className="col-span-full">
                            <label className="block text-sm font-bold text-slate-700">Address</label>
                            <textarea
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                rows={3}
                                className="mt-1.5 w-full rounded-2xl border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            {errors.address && <p className="mt-1 text-xs font-bold text-rose-600">{errors.address}</p>}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <Link
                            href={index.url()}
                            className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-indigo-700/35 active:scale-[0.98] disabled:opacity-50"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

Edit.layout = (page: any) => <AdminLayout title="Edit Property Owner" children={page} />;
