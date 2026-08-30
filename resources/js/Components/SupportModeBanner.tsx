import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { ShieldCheck, LogOut } from 'lucide-react';
import type { SharedData } from '@/types';

export default function SupportModeBanner() {
    const { support_mode } = usePage<SharedData>().props;
    const [isExiting, setIsExiting] = useState(false);

    if (!support_mode || !support_mode.active) {
        return null;
    }

    const handleExit = () => {
        setIsExiting(true);
        router.post(
            support_mode.exit_url || '/zeus/impersonation/stop',
            {},
            {
                onFinish: () => {
                    setIsExiting(false);
                },
            }
        );
    };

    return (
        <aside 
            aria-label="Support Mode active" 
            className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-amber-600/30 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-4 py-2 text-slate-950 shadow-md backdrop-blur-sm sm:px-6 lg:px-8"
        >
            <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-2.5 py-1 text-[11px] font-black tracking-wider text-amber-400 uppercase shadow-xs">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Support Mode
                </div>

                <div className="text-slate-950 font-medium">
                    <span>You're operating </span>
                    <strong className="font-bold">{support_mode.estate.name}</strong>
                    <span> as </span>
                    <strong className="font-bold">{support_mode.operating_as.name}</strong>
                    <span className="hidden md:inline">. Actions during this session are recorded as Kontrol Support activity.</span>
                </div>
            </div>

            <div className="shrink-0 pl-3">
                <button
                    type="button"
                    onClick={handleExit}
                    disabled={isExiting}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                >
                    {isExiting ? (
                        <>
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Exiting...
                        </>
                    ) : (
                        <>
                            <LogOut className="h-3.5 w-3.5 text-amber-400" />
                            Exit Support Mode
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
}
