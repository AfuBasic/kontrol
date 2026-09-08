import React, { useState } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import { Car, Clock, LogOut, ShieldCheck, Tag, Users, X, AlertCircle, Building2, User, ChevronRight } from 'lucide-react';
import MobileSheet from '@/Components/MobileSheet';

export type SecurityActiveVisit = {
    id: number;
    access_log_id: number;
    code: string | null;
    tag?: string | null;
    is_quick_entry?: boolean;
    entry_type?: 'quick_entry' | 'visitor_pass' | 'organization_credential' | string;
    entry_type_label?: string;
    has_captured_identity?: boolean;
    destination_name?: string;
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
    raw_entry_point?: string | null;
    gate?: string;
    duration_minutes: number;
    is_overstayed: boolean;
    outside_hours?: boolean;
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
        if (!visit.code && !visit.pass_uuid && !visit.tag) return;
        if (processingId !== null) return; // Prevent concurrent or duplicate taps

        setProcessingId(visit.id);
        setCheckoutError(null);
        setCheckoutSuccess(null);

        try {
            const passCode = visit.code || visit.tag || visit.pass_uuid;
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
                err.response?.data?.errors?.tag?.[0] ||
                err.response?.data?.message ||
                "We couldn't complete the checkout. Try again.";
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
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800">
                    <span>{checkoutSuccess}</span>
                    <button
                        type="button"
                        onClick={() => setCheckoutSuccess(null)}
                        className="rounded p-1 hover:bg-emerald-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {checkoutError && (
                <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                        <span>{checkoutError}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCheckoutError(null)}
                        className="rounded p-1 hover:bg-rose-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
                    {activeVisits.length} {activeVisits.length === 1 ? 'Visitor Inside' : 'Visitors Inside'}
                </span>
            </div>

            <div className="space-y-3">
                {activeVisits.map((visit) => {
                    const isBusy = processingId === visit.id;
                    const isQuick = Boolean(visit.is_quick_entry);
                    const isOrgCred = visit.entry_type === 'organization_credential';
                    const destination = visit.destination_name || visit.host.name;
                    const isRedundantPurpose =
                        !visit.purpose ||
                        visit.purpose === 'Quick Entry' ||
                        visit.purpose === `Visit to ${destination}` ||
                        visit.purpose.toLowerCase() === destination.toLowerCase();

                    return (
                        <div
                            key={visit.id}
                            className={`flex flex-col rounded-2xl border bg-white p-4 shadow-xs transition-colors dark:bg-slate-900 ${
                                visit.is_overstayed
                                    ? 'border-amber-300 ring-1 ring-amber-200 dark:border-amber-800 dark:ring-amber-950'
                                    : 'border-slate-200/90 dark:border-slate-800'
                            }`}
                        >
                            {/* TOP ROW: Identity + Destination vs Bold INSIDE status */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                                            {visit.visitor.name}
                                        </h3>
                                        {visit.outside_hours && (
                                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-amber-700 uppercase ring-1 ring-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300">
                                                Outside Hours
                                            </span>
                                        )}
                                        {visit.is_overstayed && (
                                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-amber-800 uppercase dark:bg-amber-900/50 dark:text-amber-300">
                                                Overstayed
                                            </span>
                                        )}
                                        {(visit as any).confirmation_state === 'CONFIRMED' && (
                                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-emerald-700 uppercase ring-1 ring-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                Facility Confirmed
                                            </span>
                                        )}
                                        {(visit as any).confirmation_state === 'OVERDUE' && (
                                            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-rose-700 uppercase ring-1 ring-rose-300/60 dark:bg-rose-950/40 dark:text-rose-300 animate-pulse">
                                                Confirmation Overdue
                                            </span>
                                        )}
                                    </div>

                                    {/* Destination / Organization */}
                                    <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                        {isQuick || isOrgCred ? (
                                            <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                        ) : (
                                            <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                        )}
                                        <span className="truncate">{destination}</span>
                                        {visit.host.unit && !isQuick && (
                                            <span className="text-slate-400">· Unit {visit.host.unit}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Presence Status: Prominent, restrained INSIDE */}
                                <div className="shrink-0 text-right">
                                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-800 ring-1 ring-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/50">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                                        <span className="text-xs font-black tracking-wider">INSIDE</span>
                                    </div>
                                    <div className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                        Since {visit.verified_at_time || visit.verified_at}
                                    </div>
                                </div>
                            </div>

                            {/* MIDDLE: Operational 3-Column Facts (Check-In | Gate | Entry Type) */}
                            <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-xl bg-slate-50/80 p-2.5 dark:bg-slate-800/50">
                                <div>
                                    <span className="block text-[9px] font-black tracking-wider text-slate-400 uppercase">
                                        Check-In
                                    </span>
                                    <p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                                        {visit.verified_at_time || visit.verified_at}
                                    </p>
                                </div>

                                <div>
                                    <span className="block text-[9px] font-black tracking-wider text-slate-400 uppercase">
                                        Gate
                                    </span>
                                    <p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                        {visit.gate || visit.entry_point || 'Gate not recorded'}
                                    </p>
                                </div>

                                <div className="col-span-2 sm:col-span-1">
                                    <span className="block text-[9px] font-black tracking-wider text-slate-400 uppercase">
                                        Entry Type
                                    </span>
                                    <p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                                        {visit.entry_type_label || (isQuick ? 'Quick Entry' : 'Visitor Pass')}
                                    </p>
                                </div>
                            </div>

                            {/* LOWER: Guard, Identifier (Tag / Pass Code), Vehicle, Purpose */}
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {visit.tag ? (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                                            <Tag className="h-3 w-3" />
                                            <span>Visitor Tag #{visit.tag}</span>
                                        </span>
                                    ) : visit.code ? (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            <span>Pass #{visit.code}</span>
                                        </span>
                                    ) : null}

                                    {visit.vehicle && (
                                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                                            <Car className="h-3 w-3 text-slate-400" />
                                            <span>{visit.vehicle.plate}</span>
                                        </span>
                                    )}
                                </div>

                                <div className="text-[11px] text-slate-400">
                                    Guard: <span className="font-semibold text-slate-600 dark:text-slate-300">{visit.verifier_name}</span>
                                </div>
                            </div>

                            {!isRedundantPurpose && (
                                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 italic">
                                    "{visit.purpose}"
                                </p>
                            )}

                            {/* BOTTOM: Primary Operational Action & Secondary Detail */}
                            <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setSelectedVisit(visit)}
                                    className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                                >
                                    <span>View Details</span>
                                    <ChevronRight className="h-3 w-3" />
                                </button>

                                {visit.can_checkout ? (
                                    <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => handleCheckout(visit)}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        <span>{isBusy ? 'Checking out...' : 'Check Out'}</span>
                                    </button>
                                ) : (
                                    <div className="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 ring-1 ring-amber-200/70 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/50">
                                        {visit.checkout_constraint || 'Checkout at entry gate'}
                                    </div>
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
                                <p className="mt-0.5 text-slate-500">{selectedVisit.visitor.phone}</p>
                            )}
                            {selectedVisit.tag && (
                                <div className="mt-2 inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                                    <Tag className="h-3 w-3" />
                                    <span>Visitor Tag #{selectedVisit.tag}</span>
                                </div>
                            )}
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                {selectedVisit.is_quick_entry ? 'Destination / Organization' : 'Host'}
                            </span>
                            <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                                {selectedVisit.destination_name || selectedVisit.host.name}
                            </p>
                            {selectedVisit.host.unit && !selectedVisit.is_quick_entry && (
                                <p className="text-slate-500">Unit: {selectedVisit.host.unit}</p>
                            )}
                            {selectedVisit.host.address && !selectedVisit.is_quick_entry && (
                                <p className="text-slate-500">{selectedVisit.host.address}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Entry Gate</span>
                                <p className="mt-0.5 font-bold text-slate-900 dark:text-white">
                                    {selectedVisit.gate || selectedVisit.entry_point || 'Gate not recorded'}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Checked In</span>
                                <p className="mt-0.5 font-bold text-slate-900 dark:text-white">
                                    {selectedVisit.verified_at_time || selectedVisit.verified_at}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Admitted By Guard</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedVisit.verifier_name}</span>
                            </div>
                            {selectedVisit.purpose && (
                                <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2 dark:border-slate-700/60">
                                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Purpose</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedVisit.purpose}</span>
                                </div>
                            )}
                        </div>

                        {selectedVisit.vehicle && (
                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Vehicle Details</span>
                                <p className="mt-0.5 font-bold text-slate-900 dark:text-white">
                                    {selectedVisit.vehicle.make} {selectedVisit.vehicle.model} ·{' '}
                                    <span className="font-mono text-indigo-600">{selectedVisit.vehicle.plate}</span>
                                </p>
                            </div>
                        )}

                        {selectedVisit.can_checkout ? (
                            <button
                                type="button"
                                disabled={processingId === selectedVisit.id}
                                onClick={() => handleCheckout(selectedVisit)}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>{processingId === selectedVisit.id ? 'Checking out...' : 'Check Out Now'}</span>
                            </button>
                        ) : (
                            <div className="rounded-xl bg-amber-50 p-3 text-center text-xs font-bold text-amber-800 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300">
                                {selectedVisit.checkout_constraint || 'Checkout must be performed at entry gate'}
                            </div>
                        )}
                    </div>
                )}
            </MobileSheet>
        </div>
    );
}
