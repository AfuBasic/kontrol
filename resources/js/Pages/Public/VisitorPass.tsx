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
        <div className="min-h-screen bg-[#070a0e] text-slate-100 flex flex-col justify-between relative overflow-hidden pb-8">
            <Head title={`Visitor Pass - ${pass.visitor_name || 'Guest'}`} />

            {/* Premium Atmospheric Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(10,61,145,0.15),transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 bg-noise opacity-3 pointer-events-none" />

            {/* Sticky Security Personnel Navigation */}
            {isSecurity && (
                <div className="sticky top-0 bg-[#0b1626]/95 backdrop-blur-md border-b border-[#1f6fdb]/30 text-slate-300 px-4 py-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider z-20 shadow-lg">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Gate Console</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/security" className="text-slate-400 hover:text-white transition-colors">
                            Dashboard
                        </Link>
                        <span className="text-slate-700">|</span>
                        <Link href="/security/verify" className="bg-[#1f6fdb] text-white px-3 py-1.5 rounded-lg hover:bg-[#1557ad] transition-all active:scale-95">
                            Verify Terminal
                        </Link>
                    </div>
                </div>
            )}

            {/* Brand Header */}
            <header className="flex flex-col items-center justify-center pt-8 pb-4 z-10">
                <div className="flex items-center gap-2">
                    <img src="/assets/images/kontrol-icon-white.png" alt="Kontrol" className="h-8 w-auto object-contain" />
                    <span className="text-lg font-black tracking-widest text-white uppercase">KONTROL</span>
                </div>
                <p className="text-[10px] font-black tracking-[0.3em] text-[#1f6fdb] uppercase mt-1">ACCESS CREDENTIAL</p>
            </header>

            {/* Boarding Pass Container */}
            <main className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto px-4 z-10 relative">
                <PassCard pass={pass} qrUrl={qr_url} />
            </main>

            {/* Footer */}
            <footer className="text-center py-4 z-10">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
                    <ShieldCheck className="h-4 w-4 text-[#1f6fdb]" />
                    <span>Secure estate infrastructure by Kontrol</span>
                </div>
            </footer>
        </div>
    );
}
