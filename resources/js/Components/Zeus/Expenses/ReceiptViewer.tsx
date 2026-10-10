import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import MobileSheet from '@/Components/MobileSheet';
import type { Receipt } from './types';

type Props = { receipt: Receipt | null; onClose: () => void };

/** Images open here. PDFs open in a new tab instead, so they never get squeezed into a sheet. */
export default function ReceiptViewer({ receipt, onClose }: Props) {
    return (
        <MobileSheet isOpen={receipt !== null} onClose={onClose} title={receipt?.name ?? 'Receipt'} theme="dark">
            {receipt && (
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-2xl bg-slate-950 p-2">
                        <img src={receipt.url} alt={receipt.name} className="mx-auto max-h-[65vh] w-auto max-w-full rounded-xl object-contain" />
                    </div>
                    <a
                        href={receipt.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5"
                    >
                        <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                        Open in a new tab
                    </a>
                </div>
            )}
        </MobileSheet>
    );
}
