import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { BuildingOffice2Icon, CalendarDaysIcon, UsersIcon } from '@heroicons/react/24/outline';
import { index } from '@/actions/App/Http/Controllers/Admin/PropertyOwnerController';

interface Property {
    id: number;
    ulid: string;
    name: string;
    residents_count: number;
    archived_at: string | null;
    created_at: string;
}

interface Props {
    propertyOwner: {
        id: number;
        name: string;
    };
    properties: Property[];
}

export default function Properties({ propertyOwner, properties }: Props) {
    return (
        <>
            <Head title={`Properties - ${propertyOwner.name}`} />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Link href={index.url()} className="hover:text-indigo-600 font-bold transition-colors">
                                Property Owners
                            </Link>
                            <span>/</span>
                            <span className="font-bold text-slate-800">{propertyOwner.name}</span>
                            <span>/</span>
                            <span className="font-bold text-slate-850">Properties</span>
                        </div>
                        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                            Managed Properties
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Listing all properties owned by <span className="font-bold text-slate-800">{propertyOwner.name}</span>.
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-[32px] bg-white shadow-xs ring-1 ring-slate-100">
                    {properties.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Property Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Residents Count
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Created On
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {properties.map((property) => (
                                        <tr key={property.id} className="transition-colors hover:bg-slate-50/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
                                                        <BuildingOffice2Icon className="h-5 w-5" />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900">
                                                        {property.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600">
                                                    <UsersIcon className="h-4 w-4 text-slate-400 shrink-0" />
                                                    {property.residents_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-550">
                                                    <CalendarDaysIcon className="h-4 w-4 text-slate-400 shrink-0" />
                                                    {property.created_at}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <BuildingOffice2Icon className="mx-auto h-12 w-12 text-slate-300" />
                            <h3 className="mt-4 text-lg font-black text-slate-900">No Properties Found</h3>
                            <p className="mt-1 text-sm text-slate-500">
                                This Property Owner has not registered any properties yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Properties.layout = (page: any) => {
    const props = page.props;
    const title = props.propertyOwner ? `Properties owned by ${props.propertyOwner.name}` : 'Properties';
    return <AdminLayout title={title} children={page} />;
};
