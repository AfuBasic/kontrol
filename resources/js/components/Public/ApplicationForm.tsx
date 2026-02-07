import { useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Building2, Loader2, Mail, MapPin, MessageSquare, Phone } from 'lucide-react';
import type { FormEvent } from 'react';

interface Props {
    onSuccess: (estateName: string) => void;
}

export default function ApplicationForm({ onSuccess }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        estate_name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        post('/apply', {
            onSuccess: () => {
                const estateName = data.estate_name;
                reset();
                onSuccess(estateName);
            },
        });
    }

    return (
        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} onSubmit={handleSubmit} className="space-y-5">
            {/* Estate Name */}
            <div>
                <label htmlFor="estate_name" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    Estate Name <span className="text-red-400">*</span>
                </label>
                <input
                    id="estate_name"
                    type="text"
                    value={data.estate_name}
                    onChange={(e) => setData('estate_name', e.target.value)}
                    placeholder="e.g. Lekki Gardens Phase 1"
                    className={`w-full rounded-xl border bg-white px-4 py-3.5 text-base text-slate-900 transition-all placeholder:text-slate-400 focus:ring-2 focus:outline-none ${
                        errors.estate_name
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                            : 'border-slate-200 focus:border-blue-400 focus:ring-blue-100'
                    }`}
                />
                {errors.estate_name && <p className="mt-1.5 text-sm text-red-500">{errors.estate_name}</p>}
            </div>

            {/* Email */}
            <div>
                <label htmlFor="email" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Mail className="h-4 w-4 text-slate-400" />
                    Email Address <span className="text-red-400">*</span>
                </label>
                <input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="admin@yourestate.com"
                    className={`w-full rounded-xl border bg-white px-4 py-3.5 text-base text-slate-900 transition-all placeholder:text-slate-400 focus:ring-2 focus:outline-none ${
                        errors.email
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                            : 'border-slate-200 focus:border-blue-400 focus:ring-blue-100'
                    }`}
                />
                {errors.email && <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
                <label htmlFor="phone" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Phone className="h-4 w-4 text-slate-400" />
                    Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                    id="phone"
                    type="tel"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                    placeholder="+234 800 000 0000"
                    className={`w-full rounded-xl border bg-white px-4 py-3.5 text-base text-slate-900 transition-all placeholder:text-slate-400 focus:ring-2 focus:outline-none ${
                        errors.phone
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                            : 'border-slate-200 focus:border-blue-400 focus:ring-blue-100'
                    }`}
                />
                {errors.phone && <p className="mt-1.5 text-sm text-red-500">{errors.phone}</p>}
            </div>

            {/* Address (Optional) */}
            <div>
                <label htmlFor="address" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    Estate Address <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                    id="address"
                    type="text"
                    value={data.address}
                    onChange={(e) => setData('address', e.target.value)}
                    placeholder="Full address of the estate"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
            </div>

            {/* Notes (Optional) */}
            <div>
                <label htmlFor="notes" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <MessageSquare className="h-4 w-4 text-slate-400" />
                    Additional Notes <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                    id="notes"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    placeholder="Anything else you'd like us to know?"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={processing}
                className="relative w-full rounded-xl bg-slate-900 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
                {processing ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Submitting...
                    </span>
                ) : (
                    'Submit Application'
                )}
            </button>

            {/* Trust Message */}
            <p className="text-center text-xs text-slate-400">We'll review your application and reach out personally within 24-48 hours.</p>
        </motion.form>
    );
}
