import { Head, router } from '@inertiajs/react';
import { Building, Shield, Home, Briefcase, ArrowRight, Loader2, LogOut } from 'lucide-react';
import { type FormEventHandler, useEffect, useState } from 'react';
import clsx from 'clsx';
import { switchMethod } from '@/actions/App/Http/Controllers/Auth/ContextController';
import { Capacitor } from '@capacitor/core';

interface ContextData {
    id: number;
    estate_name: string;
    role_name: string;
    scope_type: string;
    zone_name: string | null;
    is_primary: boolean;
    is_current?: boolean;
}

interface Props {
    availableContexts: ContextData[];
}

export default function ContextPicker({ availableContexts }: Props) {
    const defaultContextId =
        availableContexts.find((c) => c.is_current)?.id ??
        availableContexts.find((c) => c.is_primary)?.id ??
        (availableContexts.length > 0 ? availableContexts[0].id : null);

    const [selectedContext, setSelectedContext] = useState<number | null>(defaultContextId);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        // Enforce dark background on html and body to prevent white background on mobile overscroll
        document.documentElement.classList.add('dark');
        const prevDocBg = document.documentElement.style.backgroundColor;
        const prevBodyBg = document.body.style.backgroundColor;
        document.documentElement.style.backgroundColor = '#050505';
        document.body.style.backgroundColor = '#050505';

        return () => {
            document.documentElement.style.backgroundColor = prevDocBg;
            document.body.style.backgroundColor = prevBodyBg;
        };
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (selectedContext && !isSubmitting) {
            setIsSubmitting(true);
            router.post(
                switchMethod.url(),
                {
                    assignment_id: selectedContext,
                },
                {
                    onError: () => setIsSubmitting(false),
                },
            );
        }
    };

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            if (Capacitor.isNativePlatform()) {
                const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
                await FirebaseAuthentication.signOut().catch(() => {});
            }
            router.post('/logout');
        } catch (error) {
            console.error('Logout failed:', error);
            window.location.href = '/login';
        }
    };

    const getRoleIcon = (roleName: string) => {
        const role = roleName.toLowerCase();
        if (role.includes('admin')) return <Briefcase className="h-5 w-5 text-purple-400" />;
        if (role.includes('security')) return <Shield className="h-5 w-5 text-blue-400" />;
        if (role.includes('resident') || role.includes('household')) return <Home className="h-5 w-5 text-emerald-400" />;
        return <Building className="h-5 w-5 text-gray-400" />;
    };

    return (
        <div className="flex min-h-[100dvh] w-full flex-col items-center justify-between bg-[#050505] px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] text-white sm:justify-center">
            <Head title="Select Workspace" />

            {/* Background ambient glow */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/2 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />
                <div className="absolute bottom-1/4 left-1/2 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-blue-500/5 blur-[120px]" />
            </div>

            <div className="relative z-10 my-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-inner">
                        <Building className="h-6 w-6 text-slate-300" />
                    </div>
                    <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Select Workspace</h1>
                    <p className="text-sm text-gray-400">Choose where you'd like to continue.</p>
                </div>

                <form onSubmit={submit} noValidate>
                    <div className="custom-scrollbar mb-8 max-h-[50vh] space-y-3 overflow-y-auto pr-1 sm:max-h-[400px]">
                        {availableContexts.map((context) => {
                            const isSelected = selectedContext === context.id;
                            return (
                                <button
                                    key={context.id}
                                    type="button"
                                    onClick={() => setSelectedContext(context.id)}
                                    className={clsx(
                                        'flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all duration-200',
                                        isSelected
                                            ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.12)] ring-1 ring-emerald-500/30'
                                            : 'border-white/5 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]',
                                    )}
                                >
                                    <div className="flex min-w-0 flex-1 items-center gap-3.5">
                                        <div
                                            className={clsx(
                                                'flex-shrink-0 rounded-xl p-3 transition-colors',
                                                isSelected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-gray-400',
                                            )}
                                        >
                                            {getRoleIcon(context.role_name)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate font-semibold text-white">{context.estate_name}</h3>
                                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                                <span className="text-xs font-medium text-gray-300 capitalize">
                                                    {context.role_name.replace('_', ' ')}
                                                </span>
                                                <span className="text-xs text-gray-600">•</span>
                                                <span className="text-xs text-gray-400 capitalize">
                                                    {context.zone_name ? `Zone: ${context.zone_name}` : 'Estate-wide'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-3 flex-shrink-0">
                                        <div
                                            className={clsx(
                                                'flex h-6 w-6 items-center justify-center rounded-full border transition-all',
                                                isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-white/20 bg-transparent',
                                            )}
                                        >
                                            {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-black" />}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="space-y-3">
                        <button
                            type="submit"
                            disabled={isSubmitting || !selectedContext}
                            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-semibold text-black shadow-lg shadow-white/10 transition-all hover:bg-gray-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                                    <span>Entering Workspace...</span>
                                </>
                            ) : (
                                <>
                                    <span>Continue</span>
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium text-gray-500 transition hover:text-gray-300 disabled:opacity-50"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            {isLoggingOut ? 'Signing out...' : 'Sign out'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
