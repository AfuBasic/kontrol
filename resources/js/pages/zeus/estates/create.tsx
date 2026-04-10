import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import ZeusLayout from '@/layouts/ZeusLayout';

export default function CreateEstate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        address: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/zeus/estates');
    }

    return (
        <ZeusLayout backUrl="/zeus/dashboard">
            <Head title="Create Estate - Zeus" />

            <div className="mx-auto max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                            Infrastructure
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Deploy <span className="text-slate-400 font-light">Estate</span>
                    </h1>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, delay: 0.05 }}
                    onSubmit={handleSubmit}
                    className="rounded-lg border border-slate-200 bg-white p-7"
                >
                    <div className="space-y-6">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Entity Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full rounded border border-slate-200 px-4 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-300 focus:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                                placeholder="e.g. Silverwood Heights"
                            />
                            {errors.name && <p className="mt-1.5 text-[11px] font-bold uppercase text-red-500 tracking-tight">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Administrative Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="w-full rounded border border-slate-200 px-4 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-300 focus:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                                placeholder="admin@entity.com"
                            />
                            <p className="mt-2 text-[11px] text-slate-400 leading-relaxed uppercase tracking-tight font-medium">System will dispatch initialization credentials to this endpoint.</p>
                            {errors.email && <p className="mt-1.5 text-[11px] font-bold uppercase text-red-500 tracking-tight">{errors.email}</p>}
                        </div>

                        {/* Address */}
                        <div>
                            <label htmlFor="address" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Physical Mapping
                            </label>
                            <textarea
                                id="address"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                rows={3}
                                className="w-full rounded border border-slate-200 px-4 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-300 focus:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                                placeholder="Primary operations address..."
                            />
                            {errors.address && <p className="mt-1.5 text-[11px] font-bold uppercase text-red-500 tracking-tight">{errors.address}</p>}
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-end gap-3">
                        <Link
                            href="/zeus/dashboard"
                            className="rounded px-4 py-2 text-[12px] font-bold text-slate-400 transition-all hover:bg-slate-50 active:scale-95 uppercase tracking-wider"
                        >
                            Abort
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded bg-slate-900 px-6 py-2.5 text-[12px] font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-40 active:scale-95 uppercase tracking-wider"
                        >
                            {processing ? 'Provisioning...' : 'Deploy Estate'}
                        </button>
                    </div>
                </motion.form>
            </div>
        </ZeusLayout>
    );
}
