import { Head, Link } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';

type Props = {
    displayName?: string;
    canContinue?: boolean;
};

export default function DeviceApproved({ displayName }: Props) {
    return (
        <>
            <Head title="Device authorized" />
            <div className="flex min-h-[100dvh] items-center justify-center bg-[#020617] px-6 text-slate-100">
                <div className="w-full max-w-md">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400" aria-hidden="true" />
                    <h1 className="mt-6 text-3xl font-semibold tracking-tight">Device authorized</h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                        {displayName ?? 'The pending device'} can continue signing in. Return to that device to finish.
                    </p>
                    <Link href="/login" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-950">
                        Back to sign in
                    </Link>
                </div>
            </div>
        </>
    );
}
