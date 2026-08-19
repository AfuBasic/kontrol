import { Head, Link } from '@inertiajs/react';
import { ShieldOff } from 'lucide-react';

type Props = {
    displayName?: string;
};

export default function DeviceDenied({ displayName }: Props) {
    return (
        <>
            <Head title="Sign-in request denied" />
            <div className="flex min-h-[100dvh] items-center justify-center bg-[#020617] px-6 text-slate-100">
                <div className="w-full max-w-md">
                    <ShieldOff className="h-10 w-10 text-rose-300" aria-hidden="true" />
                    <h1 className="mt-6 text-3xl font-semibold tracking-tight">This sign-in request was denied</h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                        {displayName ? `${displayName} was not added to your account.` : 'The device was not added to your account.'} A new
                        sign-in will need a new verification request.
                    </p>
                    <Link href="/login" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-950">
                        Back to sign in
                    </Link>
                </div>
            </div>
        </>
    );
}
