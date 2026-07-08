import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import PartnerLayout from '@/Layouts/PartnerLayout';

interface Props {
    partner?: {
        id: number;
        name: string;
        commission_rate: string;
    } | null;
}

export default function PartnerEstate({ partner }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        estate_name: '',
        estate_address: '',
        chairman_name: '',
        chairman_phone: '',
        chairman_email: '',
        number_of_houses: '',
        state: '',
        lga: '',
        notes: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/partner/partner-requests');
    }

    return (
        <PartnerLayout>
            <Head title="Submit Partner Estate" />

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Submit Partner Estate</h1>
                    <p className="mt-2 text-gray-600">
                        Submit a new estate acquisition request{partner ? ` as ${partner.name}` : ''}. Our team will review and follow up.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-gray-200 bg-white/80 p-8 shadow-sm backdrop-blur-sm">
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-gray-700">Estate Name</label>
                            <input
                                type="text"
                                value={data.estate_name}
                                onChange={(e) => setData('estate_name', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                            />
                            {errors.estate_name && <p className="mt-1 text-sm text-red-600">{errors.estate_name}</p>}
                        </div>

                        <div className="sm:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-gray-700">Estate Address</label>
                            <textarea
                                value={data.estate_address}
                                onChange={(e) => setData('estate_address', e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Chairman Name</label>
                            <input
                                type="text"
                                value={data.chairman_name}
                                onChange={(e) => setData('chairman_name', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                            />
                            {errors.chairman_name && <p className="mt-1 text-sm text-red-600">{errors.chairman_name}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Chairman Phone</label>
                            <input
                                type="text"
                                value={data.chairman_phone}
                                onChange={(e) => setData('chairman_phone', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                            />
                            {errors.chairman_phone && <p className="mt-1 text-sm text-red-600">{errors.chairman_phone}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Chairman Email</label>
                            <input
                                type="email"
                                value={data.chairman_email}
                                onChange={(e) => setData('chairman_email', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                            />
                            {errors.chairman_email && <p className="mt-1 text-sm text-red-600">{errors.chairman_email}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Number of Houses</label>
                            <input
                                type="number"
                                value={data.number_of_houses}
                                onChange={(e) => setData('number_of_houses', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">State</label>
                            <input
                                type="text"
                                value={data.state}
                                onChange={(e) => setData('state', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">LGA</label>
                            <input
                                type="text"
                                value={data.lga}
                                onChange={(e) => setData('lga', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-gray-700">Notes</label>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={4}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
                                placeholder="Any additional context for the review team..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
                    >
                        {processing ? 'Submitting...' : 'Submit Partner Request'}
                    </button>
                </form>
            </motion.div>
        </PartnerLayout>
    );
}