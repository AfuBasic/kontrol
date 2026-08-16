import { Head, Link, router } from '@inertiajs/react';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface Props {
    message: string;
}

export default function AccessDenied({ message }: Props) {
    const [loggingOut, setLoggingOut] = useState(false);

    async function handleLogout() {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            if (Capacitor.isNativePlatform()) {
                const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
                await FirebaseAuthentication.signOut().catch(() => {});
            }
            router.post('/logout');
        } catch (error) {
            console.error('Logout failed:', error);
            setLoggingOut(false);
            window.location.href = '/login';
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] p-4 text-white">
            <Head title="Access Denied" />

            <div className="w-full max-w-md rounded-3xl border border-[#1a1a1a] bg-[#0a0a0a] p-8 shadow-2xl">
                <div className="mb-6 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                        <ShieldAlert className="h-8 w-8 text-red-500" />
                    </div>
                </div>

                <div className="mb-8 text-center">
                    <h1 className="mb-3 text-2xl font-semibold tracking-tight text-white">Access Denied</h1>
                    <p className="text-sm text-gray-400">{message || 'You do not have permission to access this resource.'}</p>
                </div>

                <div className="space-y-3">
                    <Link
                        href="/"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-semibold text-black transition-all hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go to Home
                    </Link>

                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#333] bg-transparent px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#111] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <LogOut className="h-4 w-4" />
                        {loggingOut ? 'Signing out...' : 'Sign out'}
                    </button>
                </div>
            </div>
        </div>
    );
}
