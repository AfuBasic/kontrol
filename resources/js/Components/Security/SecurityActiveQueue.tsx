import React, { useState } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Car, CheckCircle2, Clock, LogOut, ShieldAlert, Users, X } from 'lucide-react';
import { formatStayDuration } from '@/Components/Admin/Visitors/types';
import MobileSheet from '@/Components/MobileSheet';

export type SecurityActiveVisit = {
    id: number;
    access_log_id: number;
    code: string | null;
    pass_uuid: string | null;
    visitor: {
        name: string;
        phone: string | null;
        type: string | null;
    };
    host: {
        id?: number | null;
        name: string;
        unit?: string | null;
        address?: string | null;
    };
    purpose: string | null;
    verified_at: string | null;
    verified_at_iso: string | null;
    verified_at_time: string | null;
    verified_at_human: string | null;
    verifier_name: string;
    entry_point: string;
    duration_minutes: number;
    is_overstayed: boolean;
    code_expires_at: string | null;
    code_type: string | null;
    vehicle: {
        make: string;
        model: string;
        plate: string;
    } | null;
    can_checkout: boolean;
    checkout_constraint: string | null;
};

type Props = {
    activeVisits: SecurityActiveVisit[];
    onVisitSelected?: (visit: SecurityActiveVisit) => void;
};

export default function SecurityActiveQueue({ activeVisits }: Props) {
    const [selectedVisit, setSelectedVisit] = useState<SecurityActiveVisit | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);

    const handleCheckout = async (visit: SecurityActiveVisit) => {
        if (!visit.code && !visit.pass_uuid) return;
        setProcessingId(visit.id);
        setCheckoutError(null);
        setCheckoutSuccess(null);

        try {
            const passCode = visit.code || visit.pass_uuid;
            await axios.post('/security/verify/decision', {
                decision: 'checkout',
                code: passCode,
                access_log_id: visit.access_log_id,
            });

            setCheckoutSuccess(`Checked out ${visit.visitor.name} successfully.`);
            setSelectedVisit(null);
            router.reload({ only: ['activeVisits', 'activeCount', 'logs'] });
        } catch (err: any) {
            const msg =
                err.response?.data?.errors?.checkout?.[0] ||
                err.response?.data?.message ||
                'Checkout rejected: Please verify checkpoint assignment.';
            setCheckoutError(msg);
        } finally {
            setProcessingId(null);
        }
    };

    if (activeVisits.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                    <Users className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">No visitors awaiting checkout</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    No visitors are currently checked into the estate.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {checkoutSuccess && (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                    <span>{checkoutSuccess}</span>
                    <button onClick={() => setCheckoutSuccess(null)}>
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {checkoutError && (
                <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                    <span>{checkoutError}</span>
                    <button onClick={() => setCheckoutError(null)}>
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {activeVisits.length} {activeVisits.length === 1 ? 'Visitor Inside' : 'Visitors Inside'}
                </span>
            </div>

            <div className="space-y-2.5">
                {activeVisits.map((visit) => {
                    const elapsed = formatStayDuration(visit.duration_minutes, visit);
                    const isBusy = processingId === visit.id;

                    return (
                        <div
                            key={visit.id}
                            className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-2xs transition-colors ${
                                visit.is_overstayed
                                    ? 'border-amber-300 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20'
                                    : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                                            {visit.visitor.name}
                                        </h4>
                                        {visit.code && (
                                            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                #{visit.code}
                                            </span>
                                        )}
                                        {visit.is_overstayed && (
                                            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase dark:bg-amber-900/40 dark:text-amber-300">
                                                Pass Expired
                                            </span>
                                        )}
                                    </div>

                                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 font-medium">
                                        Visiting <span className="font-bold text-slate-900 dark:text-white">{visit.host.name}</span>
                                        {visit.host.unit && <span className="text-slate-400"> · {visit.host.unit}</span>}
                                    </p>

                                    <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                        <span>Entered: {visit.verified_at_time || visit.verified_at}</span>
                                        <span>·</span>
                                        <span>{visit.entry_point}</span>
                                        {visit.vehicle && (
                                            <>
                                                <span>·</span>
                                                <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                                                    <Car className="h-3 w-3" />
                                                    {visit.vehicle.plate}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="shrink-0 text-right">
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                        <Clock className="h-3 w-3" />
                                        <span>{elapsed}</span>
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setSelectedVisit(visit)}
                                    className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                                >
                                    Details
                                </button>

                                {visit.can_checkout ? (
                                    <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => handleCheckout(visit)}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        <span>{isBusy ? 'Checking out...' : 'Check Out'}</span>
                                    </button>
                                ) : (
                                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                        {visit.checkout_constraint || 'Checkout at entry gate'}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Visit Details Modal Sheet */}
            <MobileSheet
                isOpen={Boolean(selectedVisit)}
                onClose={() => setSelectedVisit(null)}
                title="Active Visit Details"
            >
                {selectedVisit && (
                    <div className="space-y-4 pb-8 text-xs">
                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Visitor</span>
                            <p className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">{selectedVisit.visitor.name}</p>
                            {selectedVisit.visitor.phone && (
                                <p className="text-slate-500">{selectedVisit.visitor.phone}</p>
                            )}
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Host</span>
                            <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">{selectedVisit.host.name}</p>
                            {selectedVisit.host.unit && <p className="text-slate-500">Unit: {selectedVisit.host.unit}</p>}
                            {selectedVisit.host.address && <p className="text-slate-500">{selectedVisit.host.address}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Entry Gate</span>
                                <p className="mt-0.5 font-bold text-slate-900 dark:text-white">{selectedVisit.entry_point}</p>
                            </div>
                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Checked In</span>
                                <p className="mt-0.5 font-bold text-slate-900 dark:text-white">{selectedVisit.verified_at_time || selectedVisit.verified_at}</p>
                            </div>
                        </div>

                        {selectedVisit.can_checkout && (
                            <button
                                type="button"
                                disabled={processingId === selectedVisit.id}
                                onClick={() => handleCheckout(selectedVisit)}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 py-3 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>{processingId === selectedVisit.id ? 'Processing Check-Out...' : 'Confirm Check-Out'}</span>
                            </button>
                        )}
                    </div>
                )}
            </MobileSheet>
        </div>
    );
}
