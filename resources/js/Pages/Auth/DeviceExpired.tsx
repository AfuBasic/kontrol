import { Head, Link } from '@inertiajs/react';
import { Clock } from 'lucide-react';

export default function DeviceExpired() {
    return (
        <>
            <Head title="Verification expired" />
            <div className="flex min-h-[100dvh] items-center justify-center bg-[#020617] px-6 text-slate-100">
                <div className="w-full max-w-md">
                    <Clock className="h-10 w-10 text-amber-300" aria-hidden="true" />
                    <h1 className="mt-6 text-3xl font-semibold tracking-tight">This verification request has expired</h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                        Sign in again to send a new verification request. Expired links cannot be reused.
                    </p>
                    <Link href="/login" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-950">
                        Sign in again
                    </Link>
                </div>
            </div>
        </>
    );
}
