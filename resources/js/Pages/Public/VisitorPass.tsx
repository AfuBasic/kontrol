import { Head } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import PassCard, { type PassData } from '@/Components/Resident/PassCard';

interface Props {
    pass: PassData;
    qr_url: string;
}

export default function VisitorPass({ pass, qr_url }: Props) {
    return (
        <div className="min-h-screen bg-[#070a0e] text-slate-100 flex flex-col justify-between px-4 py-8 relative overflow-hidden">
            <Head title={`Visitor Pass - ${pass.visitor_name || 'Guest'}`} />

            {/* Premium Atmospheric Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(10,61,145,0.15),transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 bg-noise opacity-3 pointer-events-none" />

            {/* Brand Header */}
            <header className="flex flex-col items-center justify-center pt-4 pb-6 z-10">
                <div className="flex items-center gap-2">
                    <img src="/assets/images/kontrol-icon-white.png" alt="Kontrol" className="h-8 w-auto object-contain" />
                    <span className="text-lg font-black tracking-widest text-white uppercase">KONTROL</span>
                </div>
                <p className="text-[10px] font-black tracking-[0.3em] text-[#1f6fdb] uppercase mt-1">ACCESS CREDENTIAL</p>
            </header>

            {/* Boarding Pass Container */}
            <main className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto z-10 relative">
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
