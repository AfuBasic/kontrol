import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, MapPin, ShieldCheck, Users, Settings as SettingsIcon } from 'lucide-react';
import React from 'react';

import admin from '@/routes/admin';

interface SetupProps {
    estate: {
        id: number;
        name: string;
        address: string | null;
        settings: any;
    };
    progress: {
        address_completed: boolean;
        zones_completed: boolean;
        security_completed: boolean;
        residents_completed: boolean;
    };
}

export default function SetupIndex({ estate, progress }: SetupProps) {
    const { post, processing } = useForm();

    const handleComplete = () => {
        post(admin.setup.complete.url());
    };

    return (
        <>
            <Head title="Estate Setup - Kontrol" />

            <div className="mx-auto max-w-4xl py-12">
                <div className="mb-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"
                    >
                        <CheckCircle2 className="h-8 w-8" />
                    </motion.div>
                    <h1 className="mb-3 text-3xl font-bold tracking-tight text-gray-900">Let's get your estate ready.</h1>
                    <p className="text-lg text-gray-600">
                        Welcome, administrator. We've set up the basics for <span className="font-semibold text-gray-900">{estate.name}</span>.
                        Complete these recommended steps to get the most out of Kontrol.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Step 1: Account (Always Complete) */}
                    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Administrator account activated</h3>
                                <p className="text-sm text-gray-500">Your secure access is verified and ready.</p>
                            </div>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Complete</span>
                    </div>

                    {/* Step 2: Estate Details */}
                    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                        <div className="mb-4 flex items-start gap-4 sm:mb-0 sm:items-center">
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${progress.address_completed ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}
                            >
                                {progress.address_completed ? <CheckCircle2 className="h-6 w-6" /> : <SettingsIcon className="h-5 w-5" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900">Review estate details</h3>
                                    {!progress.address_completed && (
                                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-blue-700 uppercase">
                                            Recommended
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500">Add your estate's physical address and update contact information.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pl-14 sm:pl-0">
                            <Link
                                href={admin.settings.url()}
                                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                            >
                                {progress.address_completed ? 'Update details' : 'Review details'} <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Step 3: Zones (Optional) */}
                    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                        <div className="mb-4 flex items-start gap-4 sm:mb-0 sm:items-center">
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${progress.zones_completed ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}
                            >
                                {progress.zones_completed ? <CheckCircle2 className="h-6 w-6" /> : <MapPin className="h-5 w-5" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900">Set up zones</h3>
                                    {!progress.zones_completed && (
                                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-gray-600 uppercase">
                                            Optional
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500">Group your properties into streets, phases, or blocks.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 pl-14 sm:pl-0">
                            {!progress.zones_completed && <span className="text-xs text-gray-400">Skip for now</span>}
                            <Link
                                href={admin.zones.index.url()}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-xs transition-all hover:bg-gray-50 hover:text-gray-900"
                            >
                                {progress.zones_completed ? 'Manage zones' : 'Set up zones'}
                            </Link>
                        </div>
                    </div>

                    {/* Step 4: Security Personnel */}
                    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                        <div className="mb-4 flex items-start gap-4 sm:mb-0 sm:items-center">
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${progress.security_completed ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}
                            >
                                {progress.security_completed ? <CheckCircle2 className="h-6 w-6" /> : <ShieldCheck className="h-5 w-5" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900">Add security personnel</h3>
                                    {!progress.security_completed && (
                                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-blue-700 uppercase">
                                            Recommended
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500">Invite guards to manage access control at your entry points.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 pl-14 sm:pl-0">
                            {!progress.security_completed && <span className="text-xs text-gray-400">Skip for now</span>}
                            <Link
                                href={admin.security.create.url()}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-xs transition-all hover:bg-gray-50 hover:text-gray-900"
                            >
                                {progress.security_completed ? 'Manage security' : 'Add security'}
                            </Link>
                        </div>
                    </div>

                    {/* Step 5: Invite Resident */}
                    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                        <div className="mb-4 flex items-start gap-4 sm:mb-0 sm:items-center">
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${progress.residents_completed ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}
                            >
                                {progress.residents_completed ? <CheckCircle2 className="h-6 w-6" /> : <Users className="h-5 w-5" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900">Invite your first resident</h3>
                                    {!progress.residents_completed && (
                                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-blue-700 uppercase">
                                            Recommended
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500">Bring your community to Kontrol by inviting a resident.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 pl-14 sm:pl-0">
                            {!progress.residents_completed && <span className="text-xs text-gray-400">Skip for now</span>}
                            <Link
                                href={admin.residents.create.url()}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-xs transition-all hover:bg-gray-50 hover:text-gray-900"
                            >
                                {progress.residents_completed ? 'Manage residents' : 'Invite resident'}
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex justify-center border-t border-gray-200 pt-8">
                    <button
                        onClick={handleComplete}
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-sm transition-all hover:bg-slate-800 hover:shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        {processing ? 'Loading...' : 'Continue to estate dashboard'}
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </>
    );
}
