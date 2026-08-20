import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, Copy, Share2, Clock, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useResidentConfirmation } from '@/Components/ConfirmationProvider';
import PassCard from '@/Components/Resident/PassCard';
import ResidentLayout from '@/Layouts/ResidentLayout';
import resident from '@/routes/resident';
import type { AccessCode, CursorPaginatedUsageLogs, DurationOption } from '@/types/access-code';
import { KONTROL_LOGO_BASE64 } from '@/Utils/logo';
import { shareAccessCode } from '@/Utils/share';

type Props = {
    accessCode: AccessCode;
    usageLogs: CursorPaginatedUsageLogs;
    filters: {
        date: string | null;
    };
    durationOptions?: DurationOption[];
    allowExtendPasses?: boolean;
};

export default function CodeShow({ accessCode, usageLogs, durationOptions = [], allowExtendPasses = true }: Props) {
    const { confirm } = useResidentConfirmation();
    const [copied, setCopied] = useState(false);
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState<number>(durationOptions[0]?.minutes || 120);
    const [successBanner, setSuccessBanner] = useState<string | null>(null);

    const { post, processing } = useForm({
        duration_minutes: selectedDuration,
    });

    const cardRef = useRef<HTMLDivElement>(null);

    async function copyCode() {
        try {
            await navigator.clipboard.writeText(accessCode.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = accessCode.code;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            textArea.style.top = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    }

    function revokeCode() {
        confirm({
            title: 'Revoke visitor pass',
            message: 'Are you sure you want to revoke this pass? It will immediately become invalid.',
            confirmLabel: 'Revoke pass',
            onConfirm: () => router.delete(resident.visitors.destroy.url(accessCode.id)),
        });
    }

    function handleExtendPass(e: React.FormEvent) {
        e.preventDefault();
        router.post(
            resident.visitors.extend.url(accessCode.id),
            { duration_minutes: selectedDuration },
            {
                onSuccess: () => {
                    setIsExtendModalOpen(false);
                    setSuccessBanner('Pass validity successfully extended!');
                    setTimeout(() => setSuccessBanner(null), 4000);
                },
            },
        );
    }

    const [shareCopied, setShareCopied] = useState(false);
    const [sharing, setSharing] = useState(false);

    async function handleShare() {
        if (sharing) return;
        setSharing(true);
        try {
            const result = await shareAccessCode(accessCode, cardRef.current);
            if (result?.method === 'copy' && result.success) {
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 3000);
            }
        } finally {
            setSharing(false);
        }
    }

    const isExpired = accessCode.expires_at ? new Date(accessCode.expires_at) < new Date() : false;
    const isPassValid = (accessCode.status === 'active' || accessCode.status === 'scheduled') && !isExpired;

    const fromTab =
        (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('from_tab') : null) === 'history' ? 'history' : 'schedule';

    const backUrl = `/resident/visitors?tab=${fromTab}`;

    return (
        <>
            <Head title="Visitor Pass Details" />

            <div className="mx-auto max-w-lg space-y-4 px-4 py-3 pb-20">
                {/* Toast / Feedback Notification Banner */}
                {successBanner && (
                    <div className="animate-in fade-in slide-in-from-top-2 flex items-center gap-2 rounded-xl bg-emerald-500 p-3 text-xs font-bold text-white shadow-lg">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>{successBanner}</span>
                    </div>
                )}

                {/* Compact App Header with Brand Logo, Wordmark & Estate Name */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <Link
                        href={backUrl}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Schedule</span>
                    </Link>

                    {/* Kontrol App Brand Mark (Logo + Wordmark) */}
                    <div className="flex items-center gap-1.5">
                        <img src={KONTROL_LOGO_BASE64} alt="Kontrol" className="h-5 w-5 object-contain" />
                        <span className="text-sm font-black tracking-tight text-slate-900">Kontrol</span>
                    </div>

                    {/* Estate Context */}
                    <span className="max-w-[100px] truncate text-[11px] font-semibold text-slate-400">
                        {(accessCode as any).estate_name || 'My Estate'}
                    </span>
                </div>

                {/* Primary Pass Ticket Card */}
                <div ref={cardRef} className="mx-auto w-full max-w-sm">
                    <PassCard pass={accessCode} qrUrl={`kontrol://pass/${accessCode.pass_uuid}?token=${accessCode.qr_token}`} />
                </div>

                {/* Gate Entry & Exit Activity Logs */}
                {usageLogs && usageLogs.data && usageLogs.data.length > 0 && (
                    <div className="mx-auto w-full max-w-sm space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h4 className="text-xs font-black tracking-wide text-slate-900 uppercase">Gate Activity History</h4>
                        <div className="space-y-2.5 divide-y divide-slate-100">
                            {usageLogs.data.map((log: any) => (
                                <div key={log.id} className="space-y-1 pt-2.5 first:pt-0">
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                                        <span className="font-extrabold text-emerald-700">
                                            Check-In • {log.entry_point || log.gate || 'Main Entrance'}
                                        </span>
                                        <span className="text-[10px] font-medium text-slate-500">
                                            {new Date(log.verified_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                                            {new Date(log.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-500">Verified by {log.verifier_name}</p>

                                    {log.checked_out_at && (
                                        <div className="mt-2 space-y-1 border-t border-dashed border-slate-200 pt-2">
                                            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                                                <span className="font-extrabold text-blue-700">
                                                    Check-Out • {log.exit_point || log.entry_point || log.gate || 'Main Entrance'}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-500">
                                                    {new Date(log.checked_out_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                                                    {new Date(log.checked_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-medium text-slate-500">
                                                Processed by {log.checkout_verifier_name || 'Security'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Primary & Secondary Action Controls */}
                <div className="mx-auto w-full max-w-sm space-y-3 px-1">
                    {/* Primary Actions: Copy, Share & Prominent Extend */}
                    {isPassValid && (
                        <div className="space-y-2">
                            <div className="flex w-full gap-2.5">
                                <button
                                    onClick={copyCode}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all active:scale-98 ${
                                        copied
                                            ? 'border-success-500 bg-success-50 text-success-700'
                                            : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                                    }`}
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                                </button>

                                <button
                                    onClick={handleShare}
                                    disabled={sharing}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all active:scale-98 disabled:opacity-75 ${
                                        shareCopied
                                            ? 'border-success-500 bg-success-50 text-success-700'
                                            : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                                    }`}
                                >
                                    <Share2 className="h-3.5 w-3.5" />
                                    <span>{shareCopied ? 'Copied!' : 'Share Pass'}</span>
                                </button>
                            </div>

                            {/* Repositioned Prominent Extend Pass Action Button (Not available for Long-Term passes) */}
                            {allowExtendPasses && accessCode.type !== 'long_lived' && (
                                <button
                                    onClick={() => setIsExtendModalOpen(true)}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary-100 bg-primary-50 py-2.5 text-xs font-bold text-primary-700 transition-all hover:bg-primary-100 active:scale-98"
                                >
                                    <Clock className="h-3.5 w-3.5 text-primary-600" />
                                    <span>Extend Pass Duration</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Quiet Danger Action: Revoke Pass */}
                    {isPassValid && (
                        <div className="flex items-center justify-center pt-1 text-xs font-semibold">
                            <button onClick={revokeCode} className="text-slate-400 transition hover:text-error-600 hover:underline">
                                Revoke pass
                            </button>
                        </div>
                    )}
                </div>

                {/* Extend Pass Confirmation Modal */}
                {isExtendModalOpen && allowExtendPasses && accessCode.type !== 'long_lived' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                        <div className="animate-in fade-in zoom-in w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl duration-150">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-primary-600" />
                                    <h3 className="text-sm font-bold text-slate-900">Extend Visitor Pass</h3>
                                </div>
                                <button
                                    onClick={() => setIsExtendModalOpen(false)}
                                    disabled={processing}
                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <form onSubmit={handleExtendPass} className="mt-4 space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Select Extension Duration</label>
                                    <select
                                        value={selectedDuration}
                                        onChange={(e) => setSelectedDuration(Number(e.target.value))}
                                        disabled={processing}
                                        className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 shadow-xs focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500 focus:outline-none disabled:opacity-50"
                                    >
                                        {durationOptions.length > 0 ? (
                                            durationOptions.map((opt) => (
                                                <option key={opt.minutes} value={opt.minutes}>
                                                    +{opt.label}
                                                </option>
                                            ))
                                        ) : (
                                            <>
                                                <option value={60}>+1 hour</option>
                                                <option value={120}>+2 hours</option>
                                                <option value={240}>+4 hours</option>
                                                <option value={1440}>+1 day</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                <div className="flex gap-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsExtendModalOpen(false)}
                                        disabled={processing}
                                        className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-xs font-bold text-white hover:bg-primary-700 disabled:opacity-75"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                <span>Extending...</span>
                                            </>
                                        ) : (
                                            <span>Confirm Extension</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

CodeShow.layout = (page: React.ReactNode) => <ResidentLayout>{page}</ResidentLayout>;
