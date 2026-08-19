import { Head, Link } from '@inertiajs/react';
import { CircleAlert } from 'lucide-react';

type Props = {
    reason?: 'expired' | 'completed' | 'invalid';
};

const copy: Record<NonNullable<Props['reason']>, { title: string; body: string }> = {
    expired: {
        title: 'This verification request has expired',
        body: 'Sign in again to send a new verification request. Expired links cannot be reused.',
    },
    completed: {
        title: 'This verification request has already been completed',
        body: 'The device was already authorized or this link has already been used.',
    },
    invalid: {
        title: 'This verification link is not valid',
        body: 'The request may have been denied, expired, or already used.',
    },
};

export default function DeviceLinkInvalid({ reason = 'invalid' }: Props) {
    const content = copy[reason] ?? copy.invalid;

    return (
        <>
            <Head title={content.title} />
            <div className="flex min-h-[100dvh] items-center justify-center bg-[#020617] px-6 text-slate-100">
                <div className="w-full max-w-md">
                    <CircleAlert className="h-10 w-10 text-slate-300" aria-hidden="true" />
                    <h1 className="mt-6 text-3xl font-semibold tracking-tight">{content.title}</h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">{content.body}</p>
                    <Link href="/login" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-950">
                        Back to sign in
                    </Link>
                </div>
            </div>
        </>
    );
}
