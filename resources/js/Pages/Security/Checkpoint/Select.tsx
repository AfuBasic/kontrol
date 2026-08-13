import { Head, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ShieldCheck, MapPin, Lock, CheckCircle2, AlertCircle, ArrowRight, LogOut } from 'lucide-react';
import { useState } from 'react';
import SecurityLayout from '@/Layouts/SecurityLayout';

interface CheckpointStatus {
    name: string;
    is_available: bool;
    is_mine: bool;
    occupied_by_id: number | null;
    occupied_by_name: string | null;
}

interface PageProps {
    estateName: string;
    checkpoints: CheckpointStatus[];
    currentCheckpoint: string | null;
    enforced: bool;
    flash?: {
        error?: string;
        success?: string;
    };
    [key: string]: unknown;
}

export default function CheckpointSelect() {
    const props = usePage<PageProps>().props;
    const { estateName, checkpoints, currentCheckpoint, enforced, flash } = props;
    const [submitting, setSubmitting] = useState<string | null>(null);

    const handleClaim = (entryPoint: string) => {
        setSubmitting(entryPoint);
        router.post(
            '/security/checkpoint/claim',
            { entry_point: entryPoint },
            {
                onFinish: () => setSubmitting(null),
            }
        );
    };

    const handleRelease = () => {
        setSubmitting('release');
        router.post(
            '/security/checkpoint/release',
            {},
            {
                onFinish: () => setSubmitting(null),
            }
        );
    };

    return (
        <SecurityLayout hideNav variant="dark">
            <Head title="Select Operating Checkpoint" />

            <div className="mx-auto max-w-lg space-y-6 pt-2 pb-12 text-white">
                {/* Header card */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-xl"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                                {estateName}
                            </span>
                            <h1 className="text-xl font-bold tracking-tight text-white">
                                Operating Checkpoint
                            </h1>
                        </div>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-slate-400">
                        {enforced
                            ? 'Entry point checkout enforcement is active for this estate. Select an available entry point to open your security workspace.'
                            : 'Select your operational checkpoint for visitor management and activity tracking.'}
                    </p>

                    {currentCheckpoint && (
                        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-300">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                <span>Active Checkpoint: <strong>{currentCheckpoint}</strong></span>
                            </div>
                            <button
                                type="button"
                                onClick={handleRelease}
                                disabled={submitting !== null}
                                className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/30 active:scale-95"
                            >
                                <LogOut className="h-3 w-3" />
                                Release
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Error Banner */}
                {flash?.error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-300"
                    >
                        <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                        <span>{flash.error}</span>
                    </motion.div>
                )}

                {/* Checkpoint Selection List */}
                <div className="space-y-3">
                    <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Available Entry Points ({checkpoints.filter((c) => c.is_available).length}/{checkpoints.length})
                    </h2>

                    {checkpoints.length === 0 ? (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center text-xs text-slate-400">
                            No entry points configured for this estate. Please ask an estate admin to configure entry points in Estate Settings.
                        </div>
                    ) : (
                        checkpoints.map((cp, idx) => {
                            const isBusy = submitting === cp.name;
                            const canClaim = cp.is_available;

                            return (
                                <motion.div
                                    key={cp.name}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
                                        cp.is_mine
                                            ? 'border-emerald-500/40 bg-emerald-950/20 shadow-lg ring-1 ring-emerald-500/20'
                                            : canClaim
                                              ? 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                                              : 'border-slate-800/60 bg-slate-900/40 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                                    cp.is_mine
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : canClaim
                                                          ? 'bg-slate-800 text-slate-300'
                                                          : 'bg-slate-800/50 text-slate-500'
                                                }`}
                                            >
                                                <MapPin className="h-5 w-5" />
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-white">{cp.name}</span>
                                                    {cp.is_mine && (
                                                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                                            Current
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-0.5 text-xs text-slate-400">
                                                    {cp.is_mine
                                                        ? 'Claimed by you'
                                                        : cp.occupied_by_name
                                                          ? `Occupied by ${cp.occupied_by_name}`
                                                          : 'Available for claim'}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleClaim(cp.name)}
                                            disabled={!canClaim || isBusy || submitting !== null}
                                            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all active:scale-95 ${
                                                cp.is_mine
                                                    ? 'bg-emerald-500 text-white shadow-md hover:bg-emerald-400'
                                                    : canClaim
                                                      ? 'bg-amber-500 text-slate-950 shadow-md hover:bg-amber-400'
                                                      : 'cursor-not-allowed bg-slate-800 text-slate-500'
                                            }`}
                                        >
                                            {isBusy ? (
                                                <span>Claiming…</span>
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
        </SecurityLayout>
    );
}
