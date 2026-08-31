import { Head, Link, useForm, usePoll } from '@inertiajs/react';
import { Loader2, Shield } from 'lucide-react';
import { useEffect } from 'react';
import * as DeviceAuthorizationController from '@/actions/App/Http/Controllers/Auth/DeviceAuthorizationController';

type Props = {
    email: string;
    status: string;
    displayName: string;
};

export default function VerifyDevice({ email, status, displayName }: Props) {
    const { post, processing } = useForm({});
    const resendForm = useForm({});

    usePoll(2500, {
        only: ['status'],
    });

    useEffect(() => {
        document.body.style.backgroundColor = '#020617';

        return () => {
            document.body.style.backgroundColor = '';
        };
    }, []);

    useEffect(() => {
        if (status === 'approved' && !processing) {
            post(DeviceAuthorizationController.continueMethod.url());
        }
    }, [status, processing, post]);

    return (
        <>
            <Head title="Verify this device" />

            <div className="relative flex min-h-[100dvh] flex-col justify-between bg-[#020617] font-sans text-slate-100">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/12 blur-[140px]" />
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
                </div>

                <header className="relative z-10 mx-auto flex w-full max-w-4xl items-center justify-between px-6 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4 sm:py-6">
                    <span className="text-sm font-semibold tracking-wide text-white">Kontrol</span>
                </header>

                <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] sm:pb-16">
                    <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 ring-1 ring-indigo-400/20">
                        <Shield className="h-7 w-7 text-indigo-300" aria-hidden="true" />
                    </div>

                    <h1 className="text-3xl font-semibold tracking-tight text-white">Verify this device</h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                        We sent a verification request to <span className="font-medium text-slate-200">{email}</span>. You can open
                        your email app to approve this device, then return to Kontrol. We’ll continue automatically
                        {displayName ? ` as ${displayName}` : ''}.
                    </p>

                    <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                        {status === 'approved' ? (
                            <span className="inline-flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                Device approved. Continuing…
                            </span>
                        ) : (
                            'Waiting for approval… Open your email to approve.'
                        )}
                    </div>

                    <div className="mt-8 flex flex-col gap-3">
                        <button
                            type="button"
                            disabled={resendForm.processing || status === 'approved'}
                            onClick={() => resendForm.post(DeviceAuthorizationController.resend.url())}
                            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:opacity-50"
                        >
                            {resendForm.processing ? 'Sending…' : 'Resend email'}
                        </button>

                        <Link
                            href={DeviceAuthorizationController.abort.url()}
                            method="post"
                            as="button"
                            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-4 text-sm font-medium text-slate-300 transition hover:bg-white/5"
                        >
                            Use another account
                        </Link>
                    </div>
                </main>
            </div>
        </>
    );
}
