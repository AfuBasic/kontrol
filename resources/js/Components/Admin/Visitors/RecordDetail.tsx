import { AnimatePresence, motion } from 'framer-motion';
import { Car, X } from 'lucide-react';
import RecordDetailChain from './RecordDetailChain';
import { formatStayDuration, type VisitorRecord } from './types';

type Props = {
    record: VisitorRecord | null;
    checkoutEnabled: boolean;
    onClose: () => void;
};

/**
 * Surface 3 - per-record chain of custody detail (modal).
 */
export default function RecordDetail({ record, checkoutEnabled, onClose }: Props) {
    return (
        <AnimatePresence>
            {record && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
                    <motion.button
                        type="button"
                        aria-label="Close detail"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute inset-0 cursor-pointer bg-gray-900/50 backdrop-blur-[2px]"
                        onClick={onClose}
                    />

                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="record-detail-title"
                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
                    >
                        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
                            <div className="min-w-0">
                                <h3 id="record-detail-title" className="truncate text-base font-semibold text-gray-900">
                                    {record.visitor.name}
                                </h3>
                                <p className="mt-0.5 text-xs font-medium text-gray-500">
                                    Visiting {record.host.name}
                                    {record.code ? <span className="font-mono text-gray-400"> · #{record.code}</span> : null}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors duration-150 ease-out hover:bg-gray-100 hover:text-gray-700 active:scale-95"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                            <RecordDetailChain record={record} checkoutEnabled={checkoutEnabled} />

                            <dl className="grid grid-cols-2 gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5 text-xs">
                                {record.purpose && (
                                    <div className="col-span-2">
                                        <dt className="font-bold tracking-wider text-gray-400 uppercase">Purpose</dt>
                                        <dd className="mt-0.5 font-semibold text-gray-800">{record.purpose}</dd>
                                    </div>
                                )}
                                {record.gate && record.gate !== 'Main Gate' && (
                                    <div>
                                        <dt className="font-bold tracking-wider text-gray-400 uppercase">Gate</dt>
                                        <dd className="mt-0.5 font-semibold text-gray-800">{record.gate}</dd>
                                    </div>
                                )}
                                {record.duration_minutes != null && (
                                    <div>
                                        <dt className="font-bold tracking-wider text-gray-400 uppercase">
                                            {record.checked_out_at ? 'Stay' : 'Elapsed'}
                                        </dt>
                                        <dd
                                            className={`mt-0.5 font-semibold tabular-nums ${
                                                record.is_overstayed ? 'text-warning-700' : 'text-gray-800'
                                            }`}
                                        >
                                            {formatStayDuration(record.duration_minutes, record)}
                                        </dd>
                                    </div>
                                )}
                                {record.visitor.phone && (
                                    <div>
                                        <dt className="font-bold tracking-wider text-gray-400 uppercase">Phone</dt>
                                        <dd className="mt-0.5 font-semibold text-gray-800">{record.visitor.phone}</dd>
                                    </div>
                                )}
                                {record.vehicle && (
                                    <div className="col-span-2">
                                        <dt className="font-bold tracking-wider text-gray-400 uppercase">Vehicle</dt>
                                        <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-gray-800">
                                            <Car className="h-3.5 w-3.5 text-gray-400" />
                                            {record.vehicle.make} {record.vehicle.model}
                                            {record.vehicle.plate ? ` (${record.vehicle.plate})` : ''}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition-colors duration-150 ease-out hover:bg-gray-50 active:scale-[0.98]"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
