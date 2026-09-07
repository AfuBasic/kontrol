import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    Car,
    CheckCircle2,
    Clock,
    Flame,
    Gauge,
    Loader2,
    RefreshCw,
    ShieldAlert,
    Tag,
    User,
    X,
    Zap,
} from 'lucide-react';
import { QuickEntryStore, type ReservedTag } from '@/Resilience/OfflineStorage/QuickEntryStore';
import { SyncEngine } from '@/Resilience/SyncEngine';

interface Organization {
    id: number;
    name: string;
    type: string;
    operating_hours?: {
        open?: string;
        close?: string;
        days?: string[];
        [key: string]: any;
    } | string | null;
    hours_enforcement?: 'inherit' | 'off' | 'warn' | 'block';
}

interface QuickEntryPanelProps {
    organizations: Organization[];
    estateName: string;
    gateName: string;
    isOnline: boolean;
    requireVehicleInformation?: boolean;
    estateHoursEnforcement?: 'off' | 'warn' | 'block';
}

/** Convert 24-hour time 'HH:mm' to friendly 12-hour format 'h:mm AM/PM' */
function formatTime12h(timeStr?: string | null): string {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    const minStr = String(isNaN(m) ? 0 : m).padStart(2, '0');
    return `${hour12}:${minStr} ${period}`;
}

function evaluateOrgHours(
    org: Organization,
    estateDefault: 'off' | 'warn' | 'block' = 'warn',
): { withinHours: boolean; enforcement: 'off' | 'warn' | 'block'; message?: string } {
    const enforcement =
        org.hours_enforcement && org.hours_enforcement !== 'inherit'
            ? org.hours_enforcement
            : estateDefault;

    if (enforcement === 'off' || !org.operating_hours) {
        return { withinHours: true, enforcement };
    }

    const hours =
        typeof org.operating_hours === 'string'
            ? (() => {
                  try {
                      return JSON.parse(org.operating_hours);
                  } catch {
                      return null;
                  }
              })()
            : org.operating_hours;

    if (!hours) {
        return { withinHours: true, enforcement };
    }

    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];

    const pad = (n: number) => n.toString().padStart(2, '0');
    const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // Day-specific config
    if (hours[currentDay]) {
        const dayConfig = hours[currentDay];
        if (dayConfig.closed) {
            return {
                withinHours: false,
                enforcement,
                message: `Closed on ${currentDay.charAt(0).toUpperCase() + currentDay.slice(1)}s`,
            };
        }
        if (dayConfig.open && dayConfig.close) {
            const within = currentTime >= dayConfig.open && currentTime <= dayConfig.close;
            return {
                withinHours: within,
                enforcement,
                message: within ? undefined : `Operating hours today: ${formatTime12h(dayConfig.open)} – ${formatTime12h(dayConfig.close)}`,
            };
        }
    }

    // General config
    if (hours.open && hours.close) {
        if (hours.days && Array.isArray(hours.days)) {
            const lowerDays = hours.days.map((d: string) => d.toLowerCase());
            if (!lowerDays.includes(currentDay)) {
                return {
                    withinHours: false,
                    enforcement,
                    message: `Not open on ${currentDay.charAt(0).toUpperCase() + currentDay.slice(1)}s`,
                };
            }
        }
        const within = currentTime >= hours.open && currentTime <= hours.close;
        return {
            withinHours: within,
            enforcement,
            message: within ? undefined : `Operating hours: ${formatTime12h(hours.open)} – ${formatTime12h(hours.close)}`,
        };
    }

    return { withinHours: true, enforcement };
}

export default function QuickEntryPanel({
    organizations,
    estateName: _estateName,
    gateName: _gateName,
    isOnline,
    requireVehicleInformation = false,
    estateHoursEnforcement = 'warn',
}: QuickEntryPanelProps) {
    const [selectedOrgId, setSelectedOrgId] = useState<number | null>(
        organizations.length > 0 ? organizations[0].id : null,
    );
    const [visitorName, setVisitorName] = useState('');
    const [hasVehicle, setHasVehicle] = useState(false);
    const [plateNumber, setPlateNumber] = useState('');
    const [vehicleMake, setVehicleMake] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [rushMode, setRushMode] = useState(false);

    const [poolCount, setPoolCount] = useState<number>(0);
    const [reserving, setReserving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showWarnConfirmModal, setShowWarnConfirmModal] = useState(false);

    // Latest issued tag modal/banner state
    const [lastIssued, setLastIssued] = useState<{
        tag: string;
        orgName: string;
        timestamp: string;
        isOffline: boolean;
    } | null>(null);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const selectedOrg = organizations.find((o) => o.id === selectedOrgId);
    const hoursEvaluation = selectedOrg
        ? evaluateOrgHours(selectedOrg, estateHoursEnforcement)
        : { withinHours: true, enforcement: 'off' as const };

    // Update remaining pool count
    const updatePoolCount = async () => {
        const count = await QuickEntryStore.countRemainingTags();
        setPoolCount(count);
    };

    useEffect(() => {
        void updatePoolCount();
    }, []);

    // Reserve more tags from server
    const reserveMoreTags = async () => {
        if (!isOnline) {
            setErrorMessage('Cannot reserve tags while offline. Please connect to internet.');
            return;
        }

        setReserving(true);
        setErrorMessage(null);
        try {
            const res = await axios.get('/security/quick-entry/reserve', {
                params: { count: 50 },
            });
            if (res.data?.success && res.data.data?.tags) {
                const allocationId = res.data.data.allocation_id;
                const newItems: ReservedTag[] = res.data.data.tags.map((t: string) => ({
                    tag: t,
                    allocation_id: allocationId,
                    created_at: new Date().toISOString(),
                }));
                await QuickEntryStore.addTags(newItems);
                await updatePoolCount();
            }
        } catch (err: any) {
            console.error('Failed to reserve tags:', err);
            setErrorMessage(err.response?.data?.message || 'Failed to reserve tags from gate server.');
        } finally {
            setReserving(false);
        }
    };

    // Auto-reserve if pool is low and online
    useEffect(() => {
        if (isOnline && poolCount < 10 && !reserving) {
            void reserveMoreTags();
        }
    }, [poolCount, isOnline]);

    const handleAssignEntry = async (skipHoursConfirm = false) => {
        if (!selectedOrgId || !selectedOrg) {
            setErrorMessage('Please select a destination organization.');
            return;
        }

        if (requireVehicleInformation && hasVehicle && !plateNumber.trim()) {
            setErrorMessage('Vehicle license plate is required by estate policy.');
            return;
        }

        // Check hours enforcement
        if (!hoursEvaluation.withinHours) {
            if (hoursEvaluation.enforcement === 'block') {
                setErrorMessage(
                    `Entry blocked: ${selectedOrg.name} is currently outside operating hours (${hoursEvaluation.message || 'Closed'}).`,
                );
                return;
            }

            if (hoursEvaluation.enforcement === 'warn' && !skipHoursConfirm) {
                setShowWarnConfirmModal(true);
                return;
            }
        }

        setSubmitting(true);
        setErrorMessage(null);

        try {
            // Pick tag from local pre-allocated pool
            let tagItem = await QuickEntryStore.getNextTag();

            if (!tagItem && isOnline) {
                // Try immediate reservation
                const res = await axios.get('/security/quick-entry/reserve', {
                    params: { count: 20 },
                });
                if (res.data?.success && res.data.data?.tags?.length > 0) {
                    const allocationId = res.data.data.allocation_id;
                    const items: ReservedTag[] = res.data.data.tags.map((t: string) => ({
                        tag: t,
                        allocation_id: allocationId,
                        created_at: new Date().toISOString(),
                    }));
                    await QuickEntryStore.addTags(items);
                    tagItem = await QuickEntryStore.getNextTag();
                }
            }

            if (!tagItem) {
                setErrorMessage('No quick entry tags available in gate pool! Please fetch tags or connect to network.');
                setSubmitting(false);
                return;
            }

            const chosenOrg = selectedOrg;

            const entryPayload = {
                tag: tagItem.tag,
                organization_id: selectedOrgId,
                visitor_name: visitorName.trim() || null,
                vehicle_plate_number: hasVehicle && plateNumber.trim() ? plateNumber.trim().toUpperCase() : null,
                vehicle_make: hasVehicle && vehicleMake.trim() ? vehicleMake.trim() : null,
                vehicle_model: hasVehicle && vehicleModel.trim() ? vehicleModel.trim() : null,
                allocation_id: tagItem.allocation_id,
            };

            if (isOnline) {
                try {
                    await axios.post('/security/quick-entry/log', entryPayload);
                    setLastIssued({
                        tag: tagItem.tag,
                        orgName: chosenOrg?.name || 'Organization',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isOffline: false,
                    });
                } catch (_netErr) {
                    // Fallback to offline queue
                    await queueOfflineEntry(entryPayload, tagItem.tag, chosenOrg?.name || 'Organization');
                }
            } else {
                await queueOfflineEntry(entryPayload, tagItem.tag, chosenOrg?.name || 'Organization');
            }

            await updatePoolCount();

            // Clear inputs unless rush mode
            if (!rushMode) {
                setVisitorName('');
                setHasVehicle(false);
                setPlateNumber('');
                setVehicleMake('');
                setVehicleModel('');
            }
        } catch (err: any) {
            console.error('Quick Entry error:', err);
            setErrorMessage(err.message || 'Error assigning Quick Entry pass.');
        } finally {
            setSubmitting(false);
        }
    };

    const queueOfflineEntry = async (entryPayload: any, tag: string, orgName: string) => {
        const offlineRecord = {
            ...entryPayload,
            verified_at: new Date().toISOString(),
        };

        // Sole queue via SyncEngine to avoid dual-queue desync
        await SyncEngine.enqueue({
            type: 'quick_entry_log',
            endpoint: '/security/quick-entry/sync',
            method: 'POST',
            payload: { logs: [offlineRecord] },
            retryPolicyKey: 'quick_entry_log',
        });

        setLastIssued({
            tag,
            orgName,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOffline: true,
        });
    };

    return (
        <div className="flex w-full flex-col items-center">
            {/* Rush Mode and Pool Status Banner */}
            <div className="mb-4 flex w-full items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={() => setRushMode(!rushMode)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all active:scale-95 ${
                        rushMode
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 ring-2 ring-amber-400'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                >
                    <Gauge className={`h-3.5 w-3.5 ${rushMode ? 'text-slate-950' : 'text-slate-500'}`} />
                    <span>{rushMode ? 'Rush Mode ON' : 'Rush Mode'}</span>
                </button>

                <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        Pool: <span className={poolCount <= 5 ? 'text-rose-600 font-extrabold' : 'text-emerald-600 font-extrabold'}>{poolCount} tags</span>
                    </span>
                    {isOnline && (
                        <button
                            type="button"
                            onClick={reserveMoreTags}
                            disabled={reserving}
                            title="Reserve more gate tags"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-xs hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
                        >
                            <RefreshCw className={`h-3 w-3 ${reserving ? 'animate-spin text-indigo-600' : ''}`} />
                        </button>
                    )}
                </div>
            </div>

            {/* Success Card Modal / Banner when tag is issued */}
            <AnimatePresence>
                {lastIssued && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mb-5 w-full rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/90 p-4 shadow-lg backdrop-blur-sm dark:border-emerald-500/20 dark:bg-emerald-950/40"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black tracking-wide text-emerald-900 uppercase dark:text-emerald-300">
                                            Admitted Successfully
                                        </span>
                                        {lastIssued.isOffline && (
                                            <span className="rounded-md bg-amber-200 px-1.5 py-0.5 text-[9px] font-black text-amber-900">
                                                Offline Queued
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs font-semibold text-emerald-800/80 dark:text-emerald-400">
                                        {lastIssued.orgName} · {lastIssued.timestamp}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setLastIssued(null)}
                                className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-3 flex flex-col items-center justify-center rounded-xl bg-white p-3 text-center shadow-xs dark:bg-slate-900">
                            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                Quick Entry Tag
                            </span>
                            <span className="mt-0.5 font-mono text-3xl font-black tracking-wider text-slate-900 dark:text-white">
                                {lastIssued.tag}
                            </span>
                            <span className="mt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                Give or announce this 4-character tag to the visitor
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Banner */}
            {errorMessage && (
                <div className="mb-4 flex w-full items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Organization Selector */}
            <div className="w-full">
                <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-extrabold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        1. Select Destination Organization
                    </label>
                    <span className="text-[10px] font-bold text-slate-400">
                        {organizations.length} {organizations.length === 1 ? 'organization' : 'organizations'}
                    </span>
                </div>

                {organizations.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs font-semibold text-slate-400">
                        No organizations enabled for Quick Entry in this estate. Contact Estate Admin to add school, church, or clinic.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                        {organizations.map((org) => {
                            const isSelected = selectedOrgId === org.id;
                            return (
                                <button
                                    key={org.id}
                                    type="button"
                                    onClick={() => setSelectedOrgId(org.id)}
                                    className={`relative flex flex-col items-start rounded-2xl p-3.5 text-left transition-all active:scale-95 ${
                                        isSelected
                                            ? 'border-2 border-indigo-600 bg-indigo-50/70 shadow-md shadow-indigo-600/10 dark:border-indigo-500 dark:bg-indigo-950/40'
                                            : 'border border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                                    }`}
                                >
                                    <div className="flex w-full items-center justify-between">
                                        <div
                                            className={`flex h-7 w-7 items-center justify-center rounded-xl ${
                                                isSelected
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                            }`}
                                        >
                                            <Building2 className="h-4 w-4" />
                                        </div>
                                        {isSelected && (
                                            <span className="flex h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                                        )}
                                    </div>
                                    <span className="mt-2 text-xs font-black text-slate-900 line-clamp-1 dark:text-white">
                                        {org.name}
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-400 capitalize">
                                        {org.type.replace('_', ' ')}
                                    </span>
                                    {org.operating_hours && (
                                        <span className="mt-1 flex items-center gap-1 text-[9px] font-bold text-slate-400">
                                            <Clock className="h-2.5 w-2.5" />
                                            {typeof org.operating_hours === 'object' && org.operating_hours?.open
                                                ? `${formatTime12h(org.operating_hours.open)} – ${formatTime12h(org.operating_hours.close)}`
                                                : typeof org.operating_hours === 'string'
                                                  ? (() => {
                                                        try {
                                                            const parsed = JSON.parse(org.operating_hours);
                                                            return parsed?.open
                                                                ? `${formatTime12h(parsed.open)} – ${formatTime12h(parsed.close)}`
                                                                : 'Hours set';
                                                        } catch {
                                                            return 'Hours set';
                                                        }
                                                    })()
                                                  : 'Hours set'}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Operating Hours Warning Banner */}
            {selectedOrg && !hoursEvaluation.withinHours && (
                <div
                    className={`mt-4 flex w-full items-start gap-2.5 rounded-2xl p-3.5 text-xs font-bold ${
                        hoursEvaluation.enforcement === 'block'
                            ? 'border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}
                >
                    <Clock
                        className={`h-4 w-4 shrink-0 mt-0.5 ${
                            hoursEvaluation.enforcement === 'block' ? 'text-rose-600' : 'text-amber-600'
                        }`}
                    />
                    <div>
                        <span className="block font-black">
                            {hoursEvaluation.enforcement === 'block'
                                ? 'Outside Operating Hours — Quick Entry Blocked'
                                : 'Outside Operating Hours Notice'}
                        </span>
                        <span className="text-[11px] font-semibold opacity-90">
                            {hoursEvaluation.message || `${selectedOrg.name} is currently closed.`}{' '}
                            {hoursEvaluation.enforcement === 'warn' &&
                                'You will be prompted to confirm before assigning a tag.'}
                        </span>
                    </div>
                </div>
            )}

            {/* Details Section (Collapsed in Rush Mode) */}
            {!rushMode && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 w-full space-y-3"
                >
                    <div>
                        <label className="mb-1.5 block text-xs font-extrabold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                            2. Visitor Name <span className="text-[10px] font-normal text-slate-400">(Optional)</span>
                        </label>
                        <div className="relative">
                            <User className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={visitorName}
                                onChange={(e) => setVisitorName(e.target.value)}
                                placeholder="e.g. Parent, Patient, Guest"
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Vehicle Toggle */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-slate-500" />
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Arrived with Vehicle?
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setHasVehicle(!hasVehicle)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    hasVehicle ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                        hasVehicle ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>

                        {hasVehicle && (
                            <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="col-span-2 sm:col-span-1">
                                    <input
                                        type="text"
                                        value={plateNumber}
                                        onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                                        placeholder="License Plate *"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-black tracking-wider text-slate-900 placeholder:text-slate-400 uppercase focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <input
                                        type="text"
                                        value={vehicleMake}
                                        onChange={(e) => setVehicleMake(e.target.value)}
                                        placeholder="Vehicle Make (Toyota...)"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Quick Admit Button */}
            <div className="mt-6 w-full">
                <button
                    type="button"
                    onClick={() => handleAssignEntry(false)}
                    disabled={
                        submitting ||
                        organizations.length === 0 ||
                        (!hoursEvaluation.withinHours && hoursEvaluation.enforcement === 'block')
                    }
                    className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4.5 text-base font-black text-white shadow-xl transition-all active:scale-95 disabled:opacity-50 ${
                        !hoursEvaluation.withinHours && hoursEvaluation.enforcement === 'block'
                            ? 'bg-rose-600 shadow-rose-500/20 cursor-not-allowed'
                            : 'bg-indigo-600 shadow-indigo-500/20 hover:bg-indigo-700'
                    }`}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin text-white" />
                            <span>Assigning Tag...</span>
                        </>
                    ) : !hoursEvaluation.withinHours && hoursEvaluation.enforcement === 'block' ? (
                        <>
                            <ShieldAlert className="h-5 w-5 text-white" />
                            <span>Closed — Entry Blocked</span>
                        </>
                    ) : (
                        <>
                            <Tag className="h-5 w-5 text-white" />
                            <span>Quick Admit & Assign Tag</span>
                        </>
                    )}
                </button>
                <p className="mt-2 text-center text-[11px] font-semibold text-slate-400">
                    {!hoursEvaluation.withinHours && hoursEvaluation.enforcement === 'block'
                        ? 'Operating hours enforcement is strictly set to Block'
                        : 'One tap assigns next available tag and logs entry'}
                </p>
            </div>

            {/* Warning Confirmation Modal */}
            <AnimatePresence>
                {showWarnConfirmModal && selectedOrg && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                                <Clock className="h-6 w-6" />
                            </div>
                            <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">
                                Outside Operating Hours
                            </h3>
                            <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {selectedOrg.name}
                                </span>{' '}
                                is currently operating outside its standard hours (
                                {hoursEvaluation.message || 'Closed'}). Confirm that you wish to admit this visitor.
                            </p>
                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowWarnConfirmModal(false)}
                                    className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowWarnConfirmModal(false);
                                        void handleAssignEntry(true);
                                    }}
                                    className="flex-1 rounded-xl bg-amber-600 py-3 text-xs font-black text-white hover:bg-amber-700 active:scale-95"
                                >
                                    Confirm Admit
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
