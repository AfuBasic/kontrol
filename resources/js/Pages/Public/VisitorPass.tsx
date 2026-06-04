import { Head, usePage, Link, router } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { useEffect } from 'react';
import PassCard, { type PassData } from '@/Components/Resident/PassCard';

interface Props {
    pass: PassData;
    qr_url: string;
}

export default function VisitorPass({ pass, qr_url }: Props) {
    const { auth } = usePage<any>().props;
    const isSecurity = auth?.user?.roles?.includes('security');

    useEffect(() => {
        if (!window.Echo || !pass.uuid || pass.status !== 'active') return;

        const channelName = `pass.${pass.uuid}`;
        const channel = window.Echo.channel(channelName);

        channel.listen('.visitor.arrived', () => {
            router.reload({ only: ['pass'] });
        });

        return () => {
            window.Echo.leave(channelName);
        };
    }, [pass.uuid, pass.status]);

    return (
        <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-[#070a0e] pb-8 text-slate-100">
            <Head title={`Visitor Pass - ${pass.visitor_name || 'Guest'}`} />

            {/* Premium Atmospheric Background */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(10,61,145,0.15),transparent_50%)]" />
            <div className="bg-noise pointer-events-none absolute inset-0 opacity-3" />

            {/* Sticky Security Personnel Navigation */}
            {isSecurity && (
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#1f6fdb]/30 bg-[#0b1626]/95 px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 text-xs font-bold tracking-wider text-slate-300 uppercase shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                        <span>Gate Console</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/security" className="text-slate-400 transition-colors hover:text-white">
                            Dashboard
                        </Link>
                        <span className="text-slate-700">|</span>
                        <Link
                            href="/security/verify"
                            className="rounded-lg bg-[#1f6fdb] px-3 py-1.5 text-white transition-all hover:bg-[#1557ad] active:scale-95"
                        >
                            Verify Terminal
                        </Link>
                    </div>
                </div>
            )}

            {/* Brand Header */}
            <header className="z-10 flex flex-col items-center justify-center pt-8 pb-4">
                <div className="flex items-center gap-2">
                    <img src="/assets/images/kontrol-icon-white.png" alt="Kontrol" className="h-8 w-auto object-contain" />
                    <span className="text-lg font-black tracking-widest text-white uppercase">KONTROL</span>
                </div>
                <p className="mt-1 text-[10px] font-black tracking-[0.3em] text-[#1f6fdb] uppercase">ACCESS CREDENTIAL</p>
            </header>

            {/* Boarding Pass Container */}
            <main className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4">
                <PassCard pass={pass} qrUrl={qr_url} />
            </main>

            {/* Footer */}
            <footer className="z-10 py-4 text-center">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
                    <ShieldCheck className="h-4 w-4 text-[#1f6fdb]" />
                    <span>Secure estate infrastructure by Kontrol</span>
                </div>
            </footer>
        </div>
    );
}
