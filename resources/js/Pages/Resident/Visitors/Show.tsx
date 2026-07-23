import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, Copy, Share2, Clock, X } from 'lucide-react';
import { useRef, useState } from 'react';
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
};

export default function CodeShow({ accessCode, usageLogs, durationOptions = [] }: Props) {
    const [copied, setCopied] = useState(false);
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState<number>(durationOptions[0]?.minutes || 120);

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
        if (confirm('Are you sure you want to revoke this pass? It will immediately become invalid.')) {
            router.delete(resident.visitors.destroy.url(accessCode.id));
        }
    }

    function handleExtendPass(e: React.FormEvent) {
        e.preventDefault();
        router.post(
            resident.visitors.extend.url(accessCode.id),
            { duration_minutes: selectedDuration },
            {
                onSuccess: () => setIsExtendModalOpen(false),
            }
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

    const fromTab = (typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('from_tab')
        : null) === 'history' ? 'history' : 'schedule';

    const backUrl = `/resident/visitors?tab=${fromTab}`;

    return (
        <>
            <Head title="Visitor Pass Details" />

            <div className="mx-auto max-w-lg px-4 py-3 space-y-4 pb-20">
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
                    <span className="text-[11px] font-semibold text-slate-400 max-w-[100px] truncate">
                        {(accessCode as any).estate_name || 'My Estate'}
                    </span>
                </div>

                {/* Primary Pass Ticket Card */}
                <div ref={cardRef} className="mx-auto w-full max-w-sm">
                    <PassCard pass={accessCode} qrUrl={`kontrol://pass/${accessCode.pass_uuid}?token=${accessCode.qr_token}`} />
                </div>

                {/* Primary & Secondary Action Controls */}
                <div className="mx-auto w-full max-w-sm space-y-3 px-1">
                    {/* Primary Actions: Copy & Share */}
                    {isPassValid && (
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
                    )}

                    {/* Quiet Secondary Actions: Extend Pass & Revoke Pass */}
                    {isPassValid && (
                        <div className="flex items-center justify-center gap-6 pt-1 text-xs font-semibold">
                            <button
                                onClick={() => setIsExtendModalOpen(true)}
                                className="text-primary-600 transition hover:text-primary-700 hover:underline"
                            >
                                Extend pass
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                                onClick={revokeCode}
                                className="text-error-600 transition hover:text-error-700 hover:underline"
                            >
                                Revoke pass
                            </button>
                        </div>
                    )}
                </div>

                {/* Extend Pass Confirmation Modal */}
                {isExtendModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                        <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl animate-in fade-in zoom-in duration-150">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-primary-600" />
                                    <h3 className="text-sm font-bold text-slate-900">Extend Visitor Pass</h3>
                                </div>
                                <button
                                    onClick={() => setIsExtendModalOpen(false)}
                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <form onSubmit={handleExtendPass} className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Select Extension Duration
                                    </label>
                                    <select
                                        value={selectedDuration}
                                        onChange={(e) => setSelectedDuration(Number(e.target.value))}
                                        className="w-full rounded-xl border-slate-200 text-xs font-medium focus:border-primary-500 focus:ring-primary-500"
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
                                        className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 rounded-xl bg-primary-600 py-2 text-xs font-bold text-white hover:bg-primary-700 disabled:opacity-50"
                                    >
                                        Confirm Extension
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
