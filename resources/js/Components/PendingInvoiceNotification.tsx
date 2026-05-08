import { BellAlertIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface PendingInvoiceData {
    id: number;
    invoice_number: string;
    amount: number;
    status: string;
    due_date: string | null;
    created_at: string | null;
}

interface Props {
    invoice: PendingInvoiceData | null;
    onDismiss?: () => void;
}

export default function PendingInvoiceNotification({ invoice, onDismiss }: Props) {
    const urgency = useMemo(() => {
        if (!invoice?.due_date) {
            return { level: 'info', color: 'blue', urgencyText: 'Pending' };
        }

        const today = new Date();
        const dueDate = new Date(invoice.due_date);
        const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) {
            return { level: 'critical', color: 'red', urgencyText: 'OVERDUE', daysRemaining };
        } else if (daysRemaining === 0) {
            return { level: 'critical', color: 'red', urgencyText: 'Due Today', daysRemaining };
        } else if (daysRemaining <= 2) {
            return { level: 'urgent', color: 'red', urgencyText: `Due in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`, daysRemaining };
        } else if (daysRemaining <= 5) {
            return { level: 'warning', color: 'amber', urgencyText: `Due in ${daysRemaining} days`, daysRemaining };
        } else if (daysRemaining <= 10) {
            return { level: 'caution', color: 'yellow', urgencyText: `Due in ${daysRemaining} days`, daysRemaining };
        } else {
            return { level: 'info', color: 'blue', urgencyText: `Due in ${daysRemaining} days`, daysRemaining };
        }
    }, [invoice]);

    if (!invoice) {
        return null;
    }

    const colorClasses = {
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-950',
            border: 'border-blue-200 dark:border-blue-800',
            text: 'text-blue-900 dark:text-blue-100',
            badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
            icon: 'text-blue-600 dark:text-blue-400',
        },
        yellow: {
            bg: 'bg-yellow-50 dark:bg-yellow-950',
            border: 'border-yellow-200 dark:border-yellow-800',
            text: 'text-yellow-900 dark:text-yellow-100',
            badge: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
            icon: 'text-yellow-600 dark:text-yellow-400',
        },
        amber: {
            bg: 'bg-amber-50 dark:bg-amber-950',
            border: 'border-amber-200 dark:border-amber-800',
            text: 'text-amber-900 dark:text-amber-100',
            badge: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
            icon: 'text-amber-600 dark:text-amber-400',
        },
        red: {
            bg: 'bg-red-50 dark:bg-red-950',
            border: 'border-red-200 dark:border-red-800',
            text: 'text-red-900 dark:text-red-100',
            badge: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
            icon: 'text-red-600 dark:text-red-400',
        },
    };

    const colors = colorClasses[urgency.color as keyof typeof colorClasses];

    const isUrgent = urgency.level === 'urgent' || urgency.level === 'critical';
    const isWarning = urgency.level === 'warning' || urgency.level === 'caution';

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`${colors.bg} border ${colors.border} mb-6 rounded-lg p-4`}
        >
            <div className="flex items-start gap-3">
                {isUrgent && (
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`mt-0.5 flex-shrink-0 ${colors.icon}`}
                    >
                        <BellAlertIcon className="h-5 w-5" />
                    </motion.div>
                )}
                {!isUrgent && (
                    <div className={`mt-0.5 flex-shrink-0 ${colors.icon}`}>
                        <BellAlertIcon className="h-5 w-5" />
                    </div>
                )}

                <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                        <h3 className={`font-semibold ${colors.text}`}>Invoice {invoice.invoice_number}</h3>
                        <span className={`rounded px-2 py-1 text-xs font-bold ${colors.badge}`}>{urgency.urgencyText}</span>
                    </div>
                    <p className={`text-sm ${colors.text} mb-3 opacity-90`}>
                        Amount due: <span className="font-semibold">₦{(invoice.amount / 100).toLocaleString()}</span>
                        {invoice.due_date && (
                            <>
                                {' '}
                                • Due: <span className="font-semibold">{new Date(invoice.due_date).toLocaleDateString()}</span>
                            </>
                        )}
                    </p>
                    <Link
                        href={`/admin/billing/invoice`}
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                            isUrgent
                                ? 'bg-red-600 text-white shadow-lg hover:bg-red-700 hover:shadow-xl active:scale-95'
                                : isWarning
                                  ? 'bg-amber-600 text-white shadow-md hover:bg-amber-700 hover:shadow-lg active:scale-95'
                                  : 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95'
                        }`}
                    >
                        View Invoice
                    </Link>
                </div>

                {onDismiss && (
                    <button onClick={onDismiss} className={`flex-shrink-0 rounded-md p-1 transition-colors ${colors.text} hover:bg-black/10`}>
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}
