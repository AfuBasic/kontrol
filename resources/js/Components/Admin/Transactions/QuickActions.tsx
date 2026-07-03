import { Download, FileText, PenLine, PlusCircle, RefreshCcw } from 'lucide-react';

interface Permissions {
    export: boolean;
    refund: boolean;
    adjust: boolean;
    record_offline: boolean;
    view_receipts: boolean;
    download_receipts: boolean;
    reports: boolean;
}

interface Props {
    permissions: Permissions;
    onExport: () => void;
    onRecordOffline: () => void;
    onCreateAdjustment: () => void;
}

export default function QuickActions({ permissions, onExport, onRecordOffline, onCreateAdjustment }: Props) {
    const actions = [
        permissions.record_offline && { label: 'Record Offline Payment', icon: PlusCircle, onClick: onRecordOffline },
        permissions.adjust && { label: 'Create Adjustment', icon: PenLine, onClick: onCreateAdjustment },
        permissions.export && { label: 'Export Transactions', icon: Download, onClick: onExport },
        permissions.reports && { label: 'Generate Report', icon: FileText, onClick: onExport },
        permissions.refund && { label: 'Issue Refund', icon: RefreshCcw, onClick: onCreateAdjustment },
    ].filter(Boolean) as Array<{ label: string; icon: typeof PlusCircle; onClick: () => void }>;

    if (actions.length === 0) return null;

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Quick Actions</p>
            <div className="mt-3 flex flex-wrap gap-2">
                {actions.map((action) => (
                    <button
                        key={action.label}
                        type="button"
                        onClick={action.onClick}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#1F6FDB]/30 hover:bg-[#F0F5FF] hover:text-[#0A3D91]"
                    >
                        <action.icon className="h-4 w-4" />
                        {action.label}
                    </button>
                ))}
            </div>
        </div>
    );
}