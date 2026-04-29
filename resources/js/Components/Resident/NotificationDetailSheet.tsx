import { Bell, CreditCard, Info, AlertTriangle, ChevronRight, ExternalLink } from 'lucide-react';
import MobileSheet from '@/Components/MobileSheet';
import { motion } from 'framer-motion';
import { useExternalBilling } from '@/Hooks/useExternalBilling';

interface NotificationData {
    type: string;
    title: string;
    message: string;
    invoice_id?: number;
    invoice_number?: string;
    amount?: number;
    formatted_amount?: string;
    estate_name?: string;
    action_url?: string;
    attempts?: number;
    max_attempts?: number;
    is_final_attempt?: boolean;
}

interface Notification {
    id: string;
    data: NotificationData;
    read_at: string | null;
    created_at_human: string;
}

interface Props {
    notification: Notification | null;
    onClose: () => void;
}

export default function NotificationDetailSheet({ notification, onClose }: Props) {
    const { openExternalBilling } = useExternalBilling();
    if (!notification) return null;

    const data = notification.data;

    const getIcon = () => {
        switch (data.type) {
            case 'new_invoice':
                return (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                        <CreditCard className="h-6 w-6" />
                    </div>
                );
            case 'invoice_paid':
                return (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                        <Bell className="h-6 w-6" />
                    </div>
                );
            case 'payment_failed':
                return (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                );
            default:
                return (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 ring-1 ring-slate-100">
                        <Info className="h-6 w-6" />
                    </div>
                );
        }
    };

    return (
        <MobileSheet isOpen={!!notification} onClose={onClose} title="Notification Detail">
            <div className="space-y-8 pt-2">
                {/* Header */}
                <div className="flex flex-col items-center text-center">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-4">
                        {getIcon()}
                    </motion.div>
                    <h4 className="text-xl font-black tracking-tight text-slate-900">{data.title}</h4>
                    <p className="mt-1 text-sm font-bold tracking-wider text-slate-400 uppercase">{notification.created_at_human}</p>
                </div>

                {/* Message */}
                <div className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-100">
                    <p className="text-base leading-relaxed text-slate-600">{data.message}</p>
                </div>

                {/* Details Card if relevant */}
                {(data.invoice_number || data.amount) && (
                    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                        <div className="border-b border-slate-50 bg-slate-50/50 px-6 py-3">
                            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Transaction Details</span>
                        </div>
                        <div className="divide-y divide-slate-50 p-2">
                            {data.invoice_number && (
                                <div className="flex items-center justify-between p-4">
                                    <span className="text-sm font-medium text-slate-500">Invoice Number</span>
                                    <span className="text-sm font-black text-slate-900">#{data.invoice_number}</span>
                                </div>
                            )}
                            {data.formatted_amount && (
                                <div className="flex items-center justify-between p-4">
                                    <span className="text-sm font-medium text-slate-500">Amount</span>
                                    <span className="text-sm font-black text-indigo-600">{data.formatted_amount}</span>
                                </div>
                            )}
                            {data.type === 'payment_failed' && (
                                <div className="flex items-center justify-between p-4">
                                    <span className="text-sm font-medium text-slate-500">Attempt</span>
                                    <span className="text-sm font-black text-rose-600">
                                        {data.attempts} of {data.max_attempts}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3 pt-4">
                    {data.action_url?.includes('billing') ? (
                        <button
                            onClick={() => {
                                openExternalBilling();
                                onClose();
                            }}
                            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 font-bold text-white shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98]"
                        >
                            View Billing Details
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    ) : (
                        data.action_url && data.type !== 'visitor_arrived' && (
                            <button
                                onClick={() => {
                                    window.location.href = data.action_url!;
                                    onClose();
                                }}
                                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 font-bold text-white shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98]"
                            >
                                View Details
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        )
                    )}
                    <button
                        onClick={onClose}
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-white font-bold text-slate-600 transition-all active:scale-[0.98]"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </MobileSheet>
    );
}
