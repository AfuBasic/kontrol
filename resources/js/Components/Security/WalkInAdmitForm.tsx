import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Car, CheckCircle2, Loader2, RotateCcw, ShieldAlert, Tag, User, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import DestinationPicker, { readRecentDestinations, rememberDestination, type WalkInDestination } from '@/Components/Security/DestinationPicker';
import { SyncEngine } from '@/Resilience/SyncEngine';

interface IdPhoto {
    blob: Blob;
    dataUrl: string;
}

interface Props {
    destinations: WalkInDestination[];
    isOnline: boolean;
    requireVehicleInformation?: boolean;
    /** When the estate enforces checkout, the entry tag is also the exit tag. */
    checkoutEnabled?: boolean;
}

// Same unambiguous charset as the server's TagGeneratorService (no 0/O, 1/I/L).
const TAG_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** A 4-character tag for entries issued while the gate is offline; the server keeps it on sync. */
function generateDeviceTag(): string {
    const bytes = new Uint32Array(4);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => TAG_CHARSET[b % TAG_CHARSET.length]).join('');
}

/** Downscale a camera photo so uploads stay fast at the gate and fit in the offline queue. */
async function compressPhoto(file: File, maxDimension = 1280, quality = 0.8): Promise<IdPhoto> {
    const source = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });

    const scale = Math.min(1, maxDimension / Math.max(source.width, source.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(source.width * scale);
    canvas.height = Math.round(source.height * scale);
    canvas.getContext('2d')!.drawImage(source, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(source.src);

    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const blob = await (await fetch(dataUrl)).blob();
    return { blob, dataUrl };
}

const firstServerError = (err: any): string | null => {
    const data = err?.response?.data;
    if (!data) return null;
    const first = data.errors ? (Object.values(data.errors)[0] as string[] | undefined)?.[0] : null;
    return first || data.message || 'Entry was refused by the gate server.';
};

/** The last destination used on this device, if it is open right now. */
const initialDestination = (destinations: WalkInDestination[]) => {
    for (const id of readRecentDestinations()) {
        const match = destinations.find((d) => d.id === id && d.is_open);
        if (match) return match;
    }
    return null;
};

export default function WalkInAdmitForm({ destinations, isOnline, requireVehicleInformation = false, checkoutEnabled = false }: Props) {
    const [destination, setDestination] = useState<WalkInDestination | null>(() => initialDestination(destinations));
    const [idPhoto, setIdPhoto] = useState<IdPhoto | null>(null);
    const [processingPhoto, setProcessingPhoto] = useState(false);
    const [visitorName, setVisitorName] = useState('');
    const [hasVehicle, setHasVehicle] = useState(false);
    const [plateNumber, setPlateNumber] = useState('');
    const [vehicleMake, setVehicleMake] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [issued, setIssued] = useState<{ tag: string; orgName: string; timestamp: string; isOffline: boolean; isReturning: boolean } | null>(
        null,
    );

    const cameraInput = useRef<HTMLInputElement>(null);
    const canAdmit = !!destination?.is_open && !!idPhoto && !submitting && !processingPhoto;

    const onPhotoCaptured = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        setProcessingPhoto(true);
        setErrorMessage(null);
        try {
            setIdPhoto(await compressPhoto(file));
        } catch {
            setErrorMessage('Could not read that photo. Please retake it.');
        } finally {
            setProcessingPhoto(false);
        }
    };

    // Keep the destination for the next visitor; clear everything that belongs to this one.
    const resetVisitor = () => {
        setIdPhoto(null);
        setVisitorName('');
        setHasVehicle(false);
        setPlateNumber('');
        setVehicleMake('');
    };

    const handleAdmit = async () => {
        if (!destination) return setErrorMessage('Choose where the visitor is going.');
        if (!destination.is_open) return setErrorMessage(`${destination.name} is closed to walk-ins. No entry.`);
        if (!idPhoto) return setErrorMessage("Take a photo of the visitor's ID first.");
        if (requireVehicleInformation && hasVehicle && !plateNumber.trim()) {
            return setErrorMessage('Vehicle plate number is required by estate policy.');
        }

        setSubmitting(true);
        setErrorMessage(null);

        const fields = {
            organization_id: destination.id,
            visitor_name: visitorName.trim() || null,
            vehicle_plate_number: hasVehicle && plateNumber.trim() ? plateNumber.trim().toUpperCase() : null,
            vehicle_make: hasVehicle && vehicleMake.trim() ? vehicleMake.trim() : null,
        };
        const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        try {
            if (isOnline) {
                const form = new FormData();
                Object.entries(fields).forEach(([key, value]) => value !== null && form.append(key, String(value)));
                form.append('id_photo', idPhoto.blob, 'id-photo.jpg');

                try {
                    const res = await axios.post('/security/quick-entry/log', form);
                    rememberDestination(destination.id);
                    setIssued({
                        tag: res.data.tag,
                        orgName: res.data.organization_name || destination.name,
                        timestamp: now(),
                        isOffline: false,
                        isReturning: !!res.data.is_returning_visitor,
                    });
                    resetVisitor();
                    return;
                } catch (err: any) {
                    // A server answer (closed, bad photo, tag clash) is a refusal: show it.
                    // Only a missing response means the network failed; then fall through to offline.
                    const refusal = firstServerError(err);
                    if (refusal) {
                        setErrorMessage(refusal);
                        return;
                    }
                }
            }

            const tag = generateDeviceTag();
            await SyncEngine.enqueue({
                type: 'quick_entry_log',
                endpoint: '/security/quick-entry/sync',
                method: 'POST',
                payload: { logs: [{ ...fields, tag, id_photo: idPhoto.dataUrl, verified_at: new Date().toISOString() }] },
                retryPolicyKey: 'quick_entry_log',
            });
            rememberDestination(destination.id);
            setIssued({ tag, orgName: destination.name, timestamp: now(), isOffline: true, isReturning: false });
            resetVisitor();
        } catch (err: any) {
            console.error('Walk-in admission failed', err);
            setErrorMessage(err?.message || 'Could not admit the visitor.');
        } finally {
            setSubmitting(false);
        }
    };

    const label = 'mb-2 block text-xs font-extrabold tracking-wider text-slate-500 uppercase dark:text-slate-400';

    return (
        <div className="flex w-full flex-col">
            {/* Issued tag */}
            <AnimatePresence>
                {issued && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mb-5 w-full rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/90 p-4 shadow-lg dark:border-emerald-500/20 dark:bg-emerald-950/40"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black tracking-wide text-emerald-900 uppercase dark:text-emerald-300">Admitted</span>
                                        {issued.isOffline && (
                                            <span className="rounded-md bg-amber-200 px-1.5 py-0.5 text-[9px] font-black text-amber-900">Will sync</span>
                                        )}
                                        {issued.isReturning && (
                                            <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[9px] font-black text-sky-800">Returning visitor</span>
                                        )}
                                    </div>
                                    <p className="text-xs font-semibold text-emerald-800/80 dark:text-emerald-400">
                                        {issued.orgName} · {issued.timestamp}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIssued(null)}
                                className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300"
                                aria-label="Dismiss"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-3 flex flex-col items-center rounded-xl bg-white p-3 text-center dark:bg-slate-900">
                            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                {checkoutEnabled ? 'Entry & exit tag' : 'Entry tag'}
                            </span>
                            <span className="mt-0.5 font-mono text-4xl font-black tracking-[0.2em] text-slate-900 dark:text-white">{issued.tag}</span>
                            <span className="mt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                {checkoutEnabled
                                    ? 'Give this tag to the visitor. They show it at the gate to exit.'
                                    : 'Give this tag to the visitor.'}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {errorMessage && (
                <div className="mb-4 flex w-full items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* 1. Destination */}
            <span className={label}>1. Where are they going?</span>
            <DestinationPicker
                destinations={destinations}
                selected={destination}
                onSelect={(d) => {
                    setDestination(d);
                    setErrorMessage(null);
                }}
            />

            {/* 2. ID photo */}
            <span className={`${label} mt-5`}>2. Photo of their ID</span>
            <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhotoCaptured} />
            {idPhoto ? (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                    <img src={idPhoto.dataUrl} alt="Visitor ID" className="h-16 w-24 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> ID captured
                        </p>
                        <p className="text-[11px] text-slate-500">Check it is sharp and readable.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => cameraInput.current?.click()}
                        className="flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300"
                    >
                        <RotateCcw className="h-3.5 w-3.5" /> Retake
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => cameraInput.current?.click()}
                    disabled={processingPhoto}
                    className="flex min-h-[72px] w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 text-sm font-black text-indigo-700 transition active:scale-[0.98] disabled:opacity-60 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300"
                >
                    {processingPhoto ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                    {processingPhoto ? 'Preparing photo…' : 'Take ID photo'}
                </button>
            )}

            {/* Optional details */}
            <span className={`${label} mt-5`}>
                Name <span className="text-[10px] font-normal normal-case text-slate-400">(optional)</span>
            </span>
            <div className="relative">
                <User className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="As shown on the ID"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-slate-500" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Arrived with a vehicle?</span>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={hasVehicle}
                        onClick={() => setHasVehicle(!hasVehicle)}
                        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                            hasVehicle ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                    >
                        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${hasVehicle ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>

                {hasVehicle && (
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                        <input
                            type="text"
                            value={plateNumber}
                            onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                            placeholder={requireVehicleInformation ? 'Plate number *' : 'Plate number'}
                            className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-black tracking-wider text-slate-900 uppercase placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none sm:col-span-1 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        <input
                            type="text"
                            value={vehicleMake}
                            onChange={(e) => setVehicleMake(e.target.value)}
                            placeholder="Make (e.g. Toyota)"
                            className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none sm:col-span-1 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>
                )}
            </div>

            {/* Admit */}
            <button
                type="button"
                onClick={handleAdmit}
                disabled={!canAdmit}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 py-4.5 text-base font-black text-white shadow-xl shadow-indigo-500/20 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:shadow-none"
            >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Tag className="h-5 w-5" />}
                <span>{submitting ? 'Admitting…' : 'Admit & issue tag'}</span>
            </button>
            <p className="mt-2 text-center text-[11px] font-semibold text-slate-400">
                {!destination
                    ? 'Choose a destination to continue'
                    : !destination.is_open
                      ? `${destination.name} is closed · no entry`
                      : !idPhoto
                        ? 'Take the ID photo to continue'
                        : `Admitting to ${destination.name}`}
            </p>
        </div>
    );
}
