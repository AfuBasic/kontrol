import { useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, Home, Loader2, Mail, MapPin, Phone, User } from 'lucide-react';
import type { FocusEvent, FormEvent } from 'react';
import { NIGERIA_STATES } from '@/Utils/nigeria-states';

interface Props {
    onSuccess: (estateName: string) => void;
}

const inputClasses = {
    base: 'w-full rounded-xl border-2 bg-slate-50/50 px-4 py-3.5 text-base text-slate-900 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:outline-none scroll-mt-4',
    normal: 'border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:ring-slate-900/5',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-500/10',
};

function handleInputFocus(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setTimeout(() => {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
}

const labelClasses = 'mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700';

export default function ApplicationForm({ onSuccess }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        estate_name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        state: '',
        lga: '',
        number_of_houses: '',
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

    const formVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.06 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <motion.form variants={formVariants} initial="hidden" animate="visible" onSubmit={handleSubmit} className="space-y-5">
            <motion.div variants={itemVariants}>
                <label htmlFor="estate_name" className={labelClasses}>
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-white">
                        <Building2 className="h-3.5 w-3.5" />
                    </div>
                    Estate name <span className="text-red-500">*</span>
                </label>
                <input
                    id="estate_name"
                    type="text"
                    value={data.estate_name}
                    onChange={(e) => setData('estate_name', e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder="e.g. Lekki Gardens Phase 1"
                    className={`${inputClasses.base} ${errors.estate_name ? inputClasses.error : inputClasses.normal}`}
                />
                {errors.estate_name && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-sm font-medium text-red-600">
                        {errors.estate_name}
                    </motion.p>
                )}
            </motion.div>

            <motion.div variants={itemVariants}>
                <label htmlFor="contact_name" className={labelClasses}>
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white">
                        <User className="h-3.5 w-3.5" />
                    </div>
                    Contact person name <span className="text-red-500">*</span>
                </label>
                <input
                    id="contact_name"
                    type="text"
                    value={data.contact_name}
                    onChange={(e) => setData('contact_name', e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder="Full name"
                    className={`${inputClasses.base} ${errors.contact_name ? inputClasses.error : inputClasses.normal}`}
                />
                {errors.contact_name && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-sm font-medium text-red-600">
                        {errors.contact_name}
                    </motion.p>
                )}
            </motion.div>

            <div className="grid gap-5 sm:grid-cols-2">
                <motion.div variants={itemVariants}>
                    <label htmlFor="email" className={labelClasses}>
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white">
                            <Mail className="h-3.5 w-3.5" />
                        </div>
                        Contact person email <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        onFocus={handleInputFocus}
                        placeholder="name@estate.com"
                        className={`${inputClasses.base} ${errors.email ? inputClasses.error : inputClasses.normal}`}
                    />
                    {errors.email && (
                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-sm font-medium text-red-600">
                            {errors.email}
                        </motion.p>
                    )}
                </motion.div>

                <motion.div variants={itemVariants}>
                    <label htmlFor="phone" className={labelClasses}>
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white">
                            <Phone className="h-3.5 w-3.5" />
                        </div>
                        Contact person phone <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="phone"
                        type="tel"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        onFocus={handleInputFocus}
                        placeholder="+234 800 000 0000"
                        className={`${inputClasses.base} ${errors.phone ? inputClasses.error : inputClasses.normal}`}
                    />
                    {errors.phone && (
                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-sm font-medium text-red-600">
                            {errors.phone}
                        </motion.p>
                    )}
                </motion.div>
            </div>

            <motion.div variants={itemVariants}>
                <label htmlFor="address" className={labelClasses}>
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-white">
                        <MapPin className="h-3.5 w-3.5" />
                    </div>
                    Estate address <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                    id="address"
                    type="text"
                    value={data.address}
                    onChange={(e) => setData('address', e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder="Street, area, landmarks"
                    className={`${inputClasses.base} ${inputClasses.normal}`}
                />
            </motion.div>

            <div className="grid gap-5 sm:grid-cols-3">
                <motion.div variants={itemVariants}>
                    <label htmlFor="state" className={labelClasses}>
                        State
                    </label>
                    <select
                        id="state"
                        value={data.state}
                        onChange={(e) => setData('state', e.target.value)}
                        onFocus={handleInputFocus}
                        className={`${inputClasses.base} ${inputClasses.normal}`}
                    >
                        <option value="">Select state</option>
                        {NIGERIA_STATES.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                        ))}
                    </select>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <label htmlFor="lga" className={labelClasses}>
                        LGA
                    </label>
                    <input
                        id="lga"
                        type="text"
                        value={data.lga}
                        onChange={(e) => setData('lga', e.target.value)}
                        onFocus={handleInputFocus}
                        placeholder="e.g. Eti-Osa"
                        className={`${inputClasses.base} ${inputClasses.normal}`}
                    />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <label htmlFor="number_of_houses" className={labelClasses}>
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-600 text-white">
                            <Home className="h-3.5 w-3.5" />
                        </div>
                        Houses
                    </label>
                    <input
                        id="number_of_houses"
                        type="number"
                        min={1}
                        value={data.number_of_houses}
                        onChange={(e) => setData('number_of_houses', e.target.value)}
                        onFocus={handleInputFocus}
                        placeholder="Approx."
                        className={`${inputClasses.base} ${inputClasses.normal}`}
                    />
                </motion.div>
            </div>

            <motion.div variants={itemVariants} className="pt-2">
                <button
                    type="submit"
                    disabled={processing}
                    className="group relative w-full overflow-hidden rounded-xl bg-slate-900 px-6 py-4 text-base font-semibold text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-900/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-violet-600 opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="relative flex items-center justify-center gap-2">
                        {processing ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Submitting…
                            </>
                        ) : (
                            <>
                                Submit application
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </span>
                </button>
            </motion.div>

            <motion.p variants={itemVariants} className="text-center text-sm text-slate-500">
                We&apos;ll review your application and reach out within <span className="font-semibold text-slate-700">24–48 hours</span>.
            </motion.p>
        </motion.form>
    );
}
