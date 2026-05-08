import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, MapPin, Phone, ShieldAlert, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import SosController from '@/actions/App/Http/Controllers/Resident/SosController';

type SosContact = { name: string; phone: string };

interface SosAlert {
    id: number;
    resident_name: string;
    resident_phone: string;
    address: string;
    estate_name: string;
    triggered_at: string;
    emergency_contacts: SosContact[];
}

declare global {
    interface Window {
        estateId?: number;
    }
}

function fmtElapsed(seconds: number) {
    const m = Math.floor(seconds / 60)
        .toString()
        .padStart(2, '0');
    const s = Math.floor(seconds % 60)
        .toString()
        .padStart(2, '0');
    return `${m}:${s}`;
}

function initialsOf(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase();
}

class WebAudioSiren {
    private ctx: AudioContext | null = null;
    private osc: OscillatorNode | null = null;
    private gain: GainNode | null = null;
    private interval: any = null;
    private isPlaying = false;

    play() {
        if (this.isPlaying) return Promise.resolve();
        this.isPlaying = true;
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return Promise.resolve();
            this.ctx = new AudioContextClass();
            this.osc = this.ctx.createOscillator();
            this.gain = this.ctx.createGain();
            this.osc.type = 'square';
            this.osc.connect(this.gain);
            this.gain.connect(this.ctx.destination);

            this.gain.gain.value = 0.15; // Set volume
            this.osc.frequency.value = 880;
            this.osc.start();

            let high = false;
            this.interval = setInterval(() => {
                if (this.osc && this.ctx) {
                    // Classic high-low siren
                    this.osc.frequency.setValueAtTime(high ? 880 : 660, this.ctx.currentTime);
                    high = !high;
                }
            }, 500);
        } catch (e) {}
        return Promise.resolve();
    }

    pause() {
        this.isPlaying = false;
        if (this.interval) clearInterval(this.interval);
        if (this.osc) {
            try {
                this.osc.stop();
            } catch (e) {}
            this.osc.disconnect();
            this.osc = null;
        }
        if (this.ctx) {
            this.ctx.close().catch(() => {});
            this.ctx = null;
        }
    }
}

export default function SosAlertOverlay() {
    const { auth } = usePage<any>().props;
    const estateId = auth?.user?.current_estate_id;

    const [activeAlert, setActiveAlert] = useState<SosAlert | null>(null);
    const [isAcknowledging, setIsAcknowledging] = useState(false);
    const [muted, setMuted] = useState(false);
    const [now, setNow] = useState(() => Date.now());
    const audioRef = useRef<{ play: () => Promise<any>; pause: () => void } | null>(null);

    // Tick once a second for the live elapsed counter
    useEffect(() => {
        if (!activeAlert) return;
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, [activeAlert]);

    // Subscribe to broadcast
    useEffect(() => {
        if (!estateId) return;

        // Generate siren using device's built-in Web Audio API
        audioRef.current = new WebAudioSiren();

        const channel = window.Echo.private(`estates.${estateId}.security`).listen('.sos.triggered', (event: SosAlert) => {
            setActiveAlert(event);
            setMuted(false);
            setNow(Date.now());

            if (audioRef.current && !muted) {
                audioRef.current.play().catch(() => {});
            }

            if (Capacitor.isNativePlatform()) {
                Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
                setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}), 400);
                setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}), 800);
            } else if ('vibrate' in navigator) {
                navigator.vibrate([500, 200, 500, 200, 500]);
            }
        });

        return () => {
            channel.stopListening('.sos.triggered');
            audioRef.current?.pause();
            audioRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [estateId]);

    // Sync audio with mute toggle / alert state
    useEffect(() => {
        if (!audioRef.current) return;
        if (!activeAlert || muted) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(() => {});
        }
    }, [muted, activeAlert]);

    const elapsedSeconds = useMemo(() => {
        if (!activeAlert) return 0;
        return Math.max(0, Math.floor((now - new Date(activeAlert.triggered_at).getTime()) / 1000));
    }, [activeAlert, now]);

    const handleAcknowledge = () => {
        if (!activeAlert) return;
        setIsAcknowledging(true);
        router.post(
            SosController.acknowledge.url({ sosEvent: activeAlert.id }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    audioRef.current?.pause();
                    setActiveAlert(null);
                    setIsAcknowledging(false);
                },
                onError: () => setIsAcknowledging(false),
            },
        );
    };

    const callNumber = (phone: string) => {
        if (Capacitor.isNativePlatform()) {
            Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
        }
        window.location.href = `tel:${phone}`;
    };

    if (!activeAlert) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="sos-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[9999] flex flex-col bg-slate-950 text-white"
                role="alertdialog"
                aria-modal="true"
                aria-label="SOS emergency alert"
            >
                <Header
                    elapsed={fmtElapsed(elapsedSeconds)}
                    estate={activeAlert.estate_name}
                    muted={muted}
                    onToggleMute={() => setMuted((v) => !v)}
                />

                <main className="flex-1 overflow-y-auto px-5 pb-6 sm:px-6">
                    <ResidentHero alert={activeAlert} onCallResident={() => callNumber(activeAlert.resident_phone)} />

                    {activeAlert.address && activeAlert.address !== 'N/A' && <AddressCard address={activeAlert.address} />}

                    {activeAlert.emergency_contacts.length > 0 && (
                        <ContactsList contacts={activeAlert.emergency_contacts} onCall={(phone) => callNumber(phone)} />
                    )}
                </main>

                <Footer
                    onAcknowledge={handleAcknowledge}
                    onCallResident={activeAlert.resident_phone ? () => callNumber(activeAlert.resident_phone) : undefined}
                    isAcknowledging={isAcknowledging}
                />
            </motion.div>
        </AnimatePresence>
    );
}

function Header({ elapsed, estate, muted, onToggleMute }: { elapsed: string; estate: string; muted: boolean; onToggleMute: () => void }) {
    return (
        <header className="pt-safe relative shrink-0 border-b border-rose-500/20 bg-rose-600">
            <div className="px-5 pt-3 pb-3 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                        </span>
                        <span className="text-[11px] font-semibold tracking-[0.18em] uppercase">SOS · Live</span>
                    </div>
                    <button
                        type="button"
                        onClick={onToggleMute}
                        aria-label={muted ? 'Unmute alarm' : 'Mute alarm'}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90"
                    >
                        {muted ? <VolumeX className="h-4 w-4" strokeWidth={2.4} /> : <Volume2 className="h-4 w-4" strokeWidth={2.4} />}
                    </button>
                </div>

                <div className="mt-2.5 flex items-end justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-semibold tracking-[0.16em] text-rose-100/80 uppercase">Elapsed</p>
                        <p className="font-mono text-2xl font-semibold tracking-tight tabular-nums">{elapsed}</p>
                    </div>
                    <div className="min-w-0 text-right">
                        <p className="text-[10px] font-semibold tracking-[0.16em] text-rose-100/80 uppercase">Estate</p>
                        <p className="truncate text-sm font-semibold">{estate}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}

function ResidentHero({ alert, onCallResident }: { alert: SosAlert; onCallResident: () => void }) {
    return (
        <section className="pt-6 pb-5">
            <div className="flex items-center gap-2 text-rose-300">
                <ShieldAlert className="h-4 w-4" strokeWidth={2.4} />
                <span className="text-[11px] font-semibold tracking-[0.16em] uppercase">Resident requested help</span>
            </div>

            <h1 className="mt-2 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{alert.resident_name}</h1>
            {alert.resident_phone && (
                <>
                    <p className="mt-1 font-mono text-sm tracking-wider text-slate-300 tabular-nums">{alert.resident_phone}</p>
                    <button
                        type="button"
                        onClick={onCallResident}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-4 text-base font-semibold text-white shadow-[0_8px_24px_-8px_rgba(244,63,94,0.5)] transition hover:bg-rose-400 active:scale-[0.99]"
                    >
                        <Phone className="h-5 w-5" strokeWidth={2.4} fill="currentColor" />
                        Call resident
                    </button>
                </>
            )}
        </section>
    );
}

function AddressCard({ address }: { address: string }) {
    return (
        <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
                    <MapPin className="h-4 w-4" strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-400 uppercase">Location</p>
                    <p className="mt-0.5 text-sm leading-relaxed font-medium text-white">{address}</p>
                </div>
                <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 self-center rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/10"
                >
                    Directions
                </a>
            </div>
        </section>
    );
}

function ContactsList({ contacts, onCall }: { contacts: SosContact[]; onCall: (phone: string) => void }) {
    return (
        <section>
            <header className="mb-2 flex items-end justify-between px-1">
                <h2 className="text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">Emergency contacts</h2>
                <span className="text-[10px] font-medium text-slate-500 tabular-nums">{contacts.length}</span>
            </header>

            <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                {contacts.map((contact, idx) => (
                    <motion.li
                        key={`${contact.phone}-${idx}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="flex items-center gap-3 px-4 py-3"
                    >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold tracking-wide text-slate-200">
                            {initialsOf(contact.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">{contact.name}</p>
                            <p className="truncate font-mono text-[11px] tracking-wider text-slate-400 tabular-nums">{contact.phone}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onCall(contact.phone)}
                            aria-label={`Call ${contact.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 transition hover:bg-emerald-500/25 active:scale-90"
                        >
                            <Phone className="h-4 w-4" strokeWidth={2.4} fill="currentColor" />
                        </button>
                    </motion.li>
                ))}
            </ul>
        </section>
    );
}

function Footer({
    onAcknowledge,
    onCallResident,
    isAcknowledging,
}: {
    onAcknowledge: () => void;
    onCallResident?: () => void;
    isAcknowledging: boolean;
}) {
    return (
        <div className="pb-safe shrink-0 border-t border-white/10 bg-slate-950/95 backdrop-blur-md">
            <div className="flex items-center gap-2.5 px-5 py-3 sm:px-6">
                {onCallResident && (
                    <button
                        type="button"
                        onClick={onCallResident}
                        aria-label="Call resident"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-white transition hover:bg-rose-400 active:scale-95"
                    >
                        <Phone className="h-5 w-5" strokeWidth={2.4} fill="currentColor" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={onAcknowledge}
                    disabled={isAcknowledging}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white text-sm font-semibold text-slate-900 transition hover:bg-slate-100 active:scale-[0.99] disabled:opacity-60"
                >
                    {isAcknowledging ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Acknowledging…
                        </>
                    ) : (
                        <>
                            <Check className="h-4 w-4" strokeWidth={2.6} />
                            I'm responding
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
