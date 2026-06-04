import { UsersIcon, MapPinIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { Head, Link } from '@inertiajs/react';
import { index } from '@/actions/App/Http/Controllers/Admin/PropertyOwnerController';
import { create as createResident } from '@/actions/App/Http/Controllers/Admin/ResidentController';
import AdminLayout from '@/Layouts/AdminLayout';

interface Resident {
    id: number;
    ulid: string;
    name: string;
    email: string;
    phone: string | null;
    property: string | null;
    status: string;
    suspended_at: string | null;
}

interface Props {
    propertyOwner: {
        id: number;
        name: string;
    };
    residents: Resident[];
}

export default function Residents({ propertyOwner, residents }: Props) {
    return (
        <>
            <Head title={`Residents - ${propertyOwner.name}`} />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Link href={index.url()} className="font-bold transition-colors hover:text-indigo-600">
                                Property Owners
                            </Link>
                            <span>/</span>
                            <span className="font-bold text-slate-800">{propertyOwner.name}</span>
                            <span>/</span>
                            <span className="text-slate-850 font-bold">Residents</span>
                        </div>
                        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Managed Residents</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Listing all occupants delegated to <span className="font-bold text-slate-800">{propertyOwner.name}</span>.
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-[32px] bg-white shadow-xs ring-1 ring-slate-100">
                    {residents.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">Name</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Contact
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Assigned Property
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {residents.map((resident) => (
                                        <tr key={resident.id} className="transition-colors hover:bg-slate-50/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
                                                        {resident.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900">{resident.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                                                    <span className="flex items-center gap-1.5 font-bold text-slate-900">
                                                        <EnvelopeIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                        {resident.email}
                                                    </span>
                                                    {resident.phone && (
                                                        <span className="flex items-center gap-1.5">
                                                            <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                            {resident.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {resident.property ? (
                                                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600">
                                                        <MapPinIcon className="h-4 w-4 shrink-0 text-slate-400" />
                                                        {resident.property}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-400 italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase ${
                                                        resident.suspended_at
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : resident.status === 'accepted'
                                                              ? 'bg-emerald-100 text-emerald-700'
                                                              : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {resident.suspended_at ? 'Suspended' : resident.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <UsersIcon className="mx-auto h-12 w-12 text-slate-300" />
                            <h3 className="mt-4 text-lg font-black text-slate-900">No Residents Assigned</h3>
                            <p className="mt-1 text-sm text-slate-500">This Property Owner has no delegated occupants yet.</p>
                            <div className="mt-6">
                                <Link
                                    href={createResident.url()}
                                    className="hover:bg-indigo-750 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all"
                                >
                                    Delegate a Resident
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Residents.layout = (page: any) => {
    const props = page.props;
    const title = props.propertyOwner ? `Residents managed by ${props.propertyOwner.name}` : 'Residents';
    return <AdminLayout title={title} children={page} />;
};
