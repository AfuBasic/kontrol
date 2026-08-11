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
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
            <Head title="Access Denied" />

            <div className="w-full max-w-md bg-[#0a0a0a] border border-[#1a1a1a] p-8 rounded-3xl shadow-2xl">
                <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                        <ShieldAlert className="h-8 w-8 text-red-500" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-white mb-3">
                        Access Denied
                    </h1>
                    <p className="text-sm text-gray-400">
                        {message || 'You do not have permission to access this resource.'}
                    </p>
                </div>

                <div className="space-y-3">
                    <Link
                        href="/"
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-semibold text-black transition-all hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go to Home
                    </Link>

                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-[#333] bg-transparent px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#111] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <LogOut className="h-4 w-4" />
                        {loggingOut ? 'Signing out...' : 'Sign out'}
                    </button>
                </div>
            </div>
        </div>
    );
}
