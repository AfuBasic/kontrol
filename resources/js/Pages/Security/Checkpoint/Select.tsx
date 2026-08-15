import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ShieldCheck, MapPin, Lock, CheckCircle2, AlertCircle, ArrowRight, LogOut, Loader2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import SecurityLayout from '@/Layouts/SecurityLayout';

interface CheckpointStatus {
    name: string;
    is_available: boolean;
    is_mine: boolean;
    occupied_by_id: number | null;
    occupied_by_name: string | null;
}

interface PageProps {
    estateName: string;
    checkpoints: CheckpointStatus[];
    currentCheckpoint: string | null;
    enforced: boolean;
    flash?: {
        error?: string;
        success?: string;
    };
    [key: string]: unknown;
}

export default function CheckpointSelect() {
    const props = usePage<PageProps>().props;
    const { estateName = '', checkpoints = [], currentCheckpoint = null, enforced = false, flash } = props;
    const safeCheckpoints = Array.isArray(checkpoints) ? checkpoints : [];
    const [submitting, setSubmitting] = useState<string | null>(null);

    const handleClaim = (entryPoint: string) => {
        setSubmitting(entryPoint);
        router.post(
            '/security/checkpoint/claim',
            { entry_point: entryPoint },
            {
                onFinish: () => setSubmitting(null),
            },
        );
    };

    const handleRelease = () => {
        setSubmitting('release');
        router.post(
            '/security/checkpoint/release',
            {},
            {
                onFinish: () => setSubmitting(null),
            },
        );
    };

    return (
        <>
            <Head title="Select Operating Checkpoint" />

            <div className="space-y-5">
                {/* Header card */}
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">{estateName}</span>
                            <h1 className="text-lg font-semibold tracking-tight text-slate-900">Operating Checkpoint</h1>
                        </div>
                    </div>

                    <p className="mt-2.5 text-xs leading-relaxed text-slate-500">
                        {enforced
                            ? 'Entry point checkout enforcement is active for this estate. Select an available entry point to open your security workspace.'
                            : 'Select your operational checkpoint for visitor management and activity tracking.'}
                    </p>

                    {currentCheckpoint && (
                        <div className="mt-3.5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2.5 text-xs text-emerald-900">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                <span>
                                    Active Checkpoint: <strong className="font-semibold">{currentCheckpoint}</strong>
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={handleRelease}
                                disabled={submitting !== null}
                                className="flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-95 disabled:opacity-50"
                            >
                                <LogOut className="h-3 w-3" />
                                Release
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Error Flash Banner */}
                {flash?.error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                    >
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                        <span>{flash.error}</span>
                    </motion.div>
                )}

                {/* Checkpoint Selection List */}
                <div className="space-y-3">
                    <div className="px-1">
                        <p className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                            Available Entry Points ({safeCheckpoints.filter((c) => c.is_available).length}/{safeCheckpoints.length})
                        </p>
                    </div>

                    {safeCheckpoints.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                            No entry points configured for this estate. Please ask an estate admin to configure entry points in Estate Settings.
                        </div>
                    ) : (
                        safeCheckpoints.map((cp, idx) => {
                            const isBusy = submitting === cp.name;
                            const canClaim = cp.is_available;

                            return (
                                <motion.div
                                    key={cp.name}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                    className={`rounded-2xl border p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all ${
                                        cp.is_mine
                                            ? 'border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                                            : canClaim
                                              ? 'border-slate-200 bg-white hover:border-slate-300'
                                              : 'border-slate-200/70 bg-slate-50/70 opacity-65'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                                    cp.is_mine
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : canClaim
                                                          ? 'bg-slate-100 text-slate-700'
                                                          : 'bg-slate-100 text-slate-400'
                                                }`}
                                            >
                                                <MapPin className="h-4.5 w-4.5" />
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-slate-900">{cp.name}</span>
                                                    {cp.is_mine && (
                                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-700 uppercase">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {cp.is_mine
                                                        ? 'Claimed by you'
                                                        : cp.occupied_by_name
                                                          ? `Occupied by ${cp.occupied_by_name}`
                                                          : 'Available for claim'}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleClaim(cp.name)}
                                            disabled={!canClaim || isBusy || submitting !== null}
                                            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition active:scale-95 ${
                                                cp.is_mine
                                                    ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                                                    : canClaim
                                                      ? 'bg-slate-900 text-white shadow-xs hover:bg-slate-800'
                                                      : 'cursor-not-allowed bg-slate-100 text-slate-400'
                                            }`}
                                        >
                                            {isBusy ? (
                                                <>
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    <span>Claiming…</span>
                                                </>
                                            ) : cp.is_mine ? (
                                                <>
                                                    <span>Continue</span>
                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                </>
                                            ) : canClaim ? (
                                                <>
                                                    <span>Select</span>
                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="h-3.5 w-3.5" />
                                                    <span>Occupied</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
}

CheckpointSelect.layout = (page: ReactNode) => <SecurityLayout hideNav>{page}</SecurityLayout>;
