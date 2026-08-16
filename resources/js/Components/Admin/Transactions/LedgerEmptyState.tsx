import { Receipt } from 'lucide-react';

interface Props {
    onRecordOffline?: () => void;
    canRecordOffline?: boolean;
}

export default function LedgerEmptyState({ onRecordOffline, canRecordOffline }: Props) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                <Receipt className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No financial activity yet</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">As residents begin making payments, every financial movement will appear here.</p>
            {canRecordOffline && onRecordOffline && (
                <button
                    type="button"
                    onClick={onRecordOffline}
                    className="mt-6 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                    Record Offline Payment
                </button>
            )}
        </div>
    );
}
