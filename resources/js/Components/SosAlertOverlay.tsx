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
                className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-xl p-4"
            >
                {/* Pulsing Background Grid */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                    <motion.div 
                        animate={{ opacity: [0.1, 0.4, 0.1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 bg-red-600" 
                    />
                </div>

                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] bg-white shadow-2xl ring-4 ring-red-600/50"
                >
                    {/* Header Banner */}
                    <div className="bg-red-600 px-8 py-10 text-center text-white">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/20 mb-4"
                        >
                            <ShieldAlert className="h-10 w-10 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-black tracking-tight">INTRUSION ALERT</h2>
                        <p className="mt-2 text-red-100 font-bold uppercase tracking-widest text-xs">Resident SOS Triggered</p>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        <div className="space-y-6">
                            {/* Resident Details */}
                            <div className="flex items-start gap-4 border-b border-gray-100 pb-6">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50">
                                    <div className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Resident & Location</p>
                                    <p className="mt-1 text-xl font-black text-slate-900">{activeAlert.resident_name}</p>
                                    <p className="text-slate-600 font-bold">{activeAlert.address}</p>
                                    <p className="text-indigo-600 text-sm font-black mt-1 uppercase">{activeAlert.estate_name}</p>
                                </div>
                                <button 
                                    onClick={() => callResident(activeAlert.resident_phone)}
                                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 active:scale-95"
                                >
                                    <Phone className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Emergency Contacts */}
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Emergency Contacts</p>
                                <div className="grid gap-3">
                                    {activeAlert.emergency_contacts.map((contact, idx) => (
                                        <div key={idx} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                                            <div>
                                                <p className="font-black text-slate-900 text-sm">{contact.name}</p>
                                                <p className="text-xs font-bold text-slate-500">{contact.phone}</p>
                                            </div>
                                            <button 
                                                onClick={() => callResident(contact.phone)}
                                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 text-indigo-600 active:scale-95"
                                            >
                                                <Phone className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {activeAlert.emergency_contacts.length === 0 && (
                                        <p className="text-sm font-bold text-slate-400 italic">No emergency contacts listed.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-10 grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setActiveAlert(null)}
                                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-100 py-4 font-black text-slate-400 active:scale-95"
                            >
                                <XCircle className="h-5 w-5" />
                                CLOSE ALERT
                            </button>
                            <button
                                onClick={handleAcknowledge}
                                disabled={isAcknowledging}
                                className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 font-black text-white shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50"
                            >
                                {isAcknowledging ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-5 w-5" />
                                        RESPONDED
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
