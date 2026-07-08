import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/24/outline';
import PartnerLayout from '@/Layouts/PartnerLayout';

interface PartnerRequest {
    id: number;
    estate_name: string;
    status: string;
    chairman_name: string;
    chairman_email: string;
    created_at: string;
    estate?: { ulid: string; name: string; status: string } | null;
}

interface Props {
    partnerRequests: PartnerRequest[];
}

export default function PartnerRequestsIndex({ partnerRequests }: Props) {
    return (
        <PartnerLayout>
            <Head title="Partner Requests" />

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Partner Requests</h1>
                        <p className="mt-2 text-gray-600">Track estates you have submitted as a partner.</p>
                    </div>
                    <Link
                        href="/partner/partner-requests/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Submit Estate
                    </Link>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">Estate</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">Chairman</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">Submitted</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {partnerRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                                        No partner requests yet. Submit your first estate to get started.
                                    </td>
                                </tr>
                            ) : (
                                partnerRequests.map((request) => (
                                    <tr key={request.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-gray-900">{request.estate_name}</p>
                                            {request.estate && (
                                                <p className="text-xs text-gray-500">Live: {request.estate.name}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {request.chairman_name}
                                            <br />
                                            <span className="text-xs text-gray-400">{request.chairman_email}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 capitalize">
                                                {request.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(request.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </PartnerLayout>
    );
}