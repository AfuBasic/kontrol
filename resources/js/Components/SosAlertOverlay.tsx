import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { Phone, CheckCircle2, ShieldAlert, XCircle, Loader2 } from 'lucide-react';
import { usePage, router } from '@inertiajs/react';
import type { SharedData } from '@/types';
import SosController from '@/actions/App/Http/Controllers/Resident/SosController';

interface SosAlert {
    id: number;
    resident_name: string;
    resident_phone: string;
    address: string;
    estate_name: string;
    triggered_at: string;
    emergency_contacts: Array<{ name: string; phone: string }>;
}

export default function SosAlertOverlay() {
    const { auth } = usePage<SharedData>().props;
    const [activeAlert, setActiveAlert] = useState<SosAlert | null>(null);
    const [isAcknowledging, setIsAcknowledging] = useState(false);

    const playAlertSound = useCallback(() => {
        // Simple Audio fallback for sound
        try {
            const audio = new Audio('/assets/sounds/sos_alert.mp3');
            audio.play().catch(() => {}); // Browsers might block auto-play
        } catch (e) {}
    }, []);

    const triggerHaptics = useCallback(async () => {
        try {
            await Haptics.notification({ type: NotificationType.Error });
            // Pulse haptics
            setTimeout(() => Haptics.notification({ type: NotificationType.Error }), 1000);
            setTimeout(() => Haptics.notification({ type: NotificationType.Error }), 2000);
        } catch (e) {}
    }, []);

    useEffect(() => {
        if (!auth?.user?.current_estate_id) return;

        const estateId = auth.user.current_estate_id;
        const channel = window.Echo.private(`estates.${estateId}.security`);

        channel.listen('.sos.triggered', (event: SosAlert) => {
            setActiveAlert(event);
            playAlertSound();
            triggerHaptics();
        });

        return () => {
            channel.stopListening('.sos.triggered');
        };
    }, [auth?.user?.current_estate_id, playAlertSound, triggerHaptics]);

    const handleAcknowledge = () => {
        if (!activeAlert) return;

        setIsAcknowledging(true);
        router.post(SosController.acknowledge.url({ sosEvent: activeAlert.id }), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setActiveAlert(null);
                setIsAcknowledging(false);
                try { Haptics.notification({ type: NotificationType.Success }); } catch (e) {}
            },
            onError: () => {
                setIsAcknowledging(false);
            }
        });
    };

    const callResident = (phone: string) => {
        window.location.href = `tel:${phone}`;
    };

    if (!activeAlert) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex flex-col bg-slate-900"
            >
                {/* Emergency Pulse Background */}
                <motion.div 
                    animate={{ 
                        backgroundColor: ['#450a0a', '#991b1b', '#450a0a'],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 opacity-40" 
                />

                <div className="relative flex flex-1 flex-col overflow-hidden">
                    {/* Top Emergency Header */}
                    <div className="pt-safe flex flex-col items-center justify-center bg-red-600 px-6 py-10 text-white shadow-2xl">
                        <motion.div
                            animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white text-red-600 shadow-[0_0_50px_rgba(255,255,255,0.4)]"
                        >
                            <ShieldAlert className="h-12 w-12" strokeWidth={3} />
                        </motion.div>
                        <h2 className="text-4xl font-black tracking-tighter sm:text-5xl">SOS ALERT</h2>
                        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-black/20 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                            </span>
                            Live Emergency
                        </div>
                    </div>

                    {/* Content Area - Scrollable */}
                    <div className="flex-1 overflow-y-auto px-6 py-8">
                        <div className="mx-auto max-w-xl space-y-8">
                            {/* Resident Card */}
                            <div className="overflow-hidden rounded-[2rem] bg-white p-1 shadow-2xl">
                                <div className="flex items-center gap-4 bg-slate-50 p-6">
                                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                                        <div className="flex h-full w-full items-center justify-center text-2xl font-black text-slate-300">
                                            {activeAlert.resident_name.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Emergency From</p>
                                        <h3 className="truncate text-2xl font-black text-slate-900">{activeAlert.resident_name}</h3>
                                        <p className="truncate text-sm font-bold text-red-600">{activeAlert.address}</p>
                                    </div>
                                    <button 
                                        onClick={() => callResident(activeAlert.resident_phone)}
                                        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-200 active:scale-90"
                                    >
                                        <Phone className="h-6 w-6" fill="currentColor" />
                                    </button>
                                </div>
                                <div className="px-6 py-4">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                                        <span>Estate: {activeAlert.estate_name}</span>
                                        <span>{new Date(activeAlert.triggered_at).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Contacts Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-sm font-black text-white/60 uppercase tracking-widest">Emergency Contacts</h3>
                                    <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white/40">
                                        {activeAlert.emergency_contacts.length} listed
                                    </span>
                                </div>
                                
                                <div className="grid gap-3">
                                    {activeAlert.emergency_contacts.map((contact, idx) => (
                                        <motion.div 
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 * idx }}
                                            className="flex items-center justify-between rounded-[1.5rem] bg-white/5 p-4 backdrop-blur-md ring-1 ring-white/10"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate font-black text-white">{contact.name}</p>
                                                <p className="text-xs font-bold text-white/50">{contact.phone}</p>
                                            </div>
                                            <button 
                                                onClick={() => callResident(contact.phone)}
                                                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-90"
                                            >
                                                <Phone className="h-5 w-5" />
                                            </button>
                                        </motion.div>
                                    ))}
                                    {activeAlert.emergency_contacts.length === 0 && (
                                        <div className="rounded-2xl bg-white/5 p-8 text-center ring-1 ring-white/10">
                                            <p className="text-sm font-bold text-white/30 italic">No emergency contacts registered.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pb-safe mt-auto border-t border-white/10 bg-slate-900/80 p-6 backdrop-blur-2xl">
                        <div className="mx-auto flex max-w-xl gap-4">
                            <button
                                onClick={() => setActiveAlert(null)}
                                className="flex-1 rounded-2xl bg-white/5 py-5 text-sm font-black text-white/40 transition-all hover:bg-white/10 active:scale-95"
                            >
                                CLOSE ALERT
                            </button>
                            <button
                                onClick={handleAcknowledge}
                                disabled={isAcknowledging}
                                className="flex-[2] rounded-2xl bg-red-600 py-5 text-sm font-black text-white shadow-2xl shadow-red-900/40 transition-all hover:bg-red-500 active:scale-95 disabled:opacity-50"
                            >
                                {isAcknowledging ? (
                                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                                ) : (
                                    'MARK AS RESPONDED'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
