import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import ZeusModal from '@/Components/Zeus/ZeusModal';
import type { Receipt } from './types';

type Props = { receipt: Receipt | null; onClose: () => void };

/** Images open here. PDFs open in a new tab instead, so they get the browser's own viewer. */
export default function ReceiptViewer({ receipt, onClose }: Props) {
    return (
        <ZeusModal
            isOpen={receipt !== null}
            onClose={onClose}
            title={receipt?.name ?? 'Receipt'}
            size="xl"
            footer={
                receipt && (
                    <div className="flex justify-end gap-2">
                        <a
                            href={receipt.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-600 px-4 text-sm font-semibold text-slate-200 hover:bg-white/5"
                        >
                            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                            Open in a new tab
                        </a>
                        <a
                            href={receipt.download_url}
                            download={receipt.name}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary-600 px-4 text-sm font-bold text-white hover:bg-primary-500"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                            Download
                        </a>
                    </div>
                )
            }
        >
            {receipt && (
                <div className="flex justify-center overflow-hidden rounded-xl bg-slate-950 p-2">
                    <img src={receipt.url} alt={receipt.name} className="max-h-[60vh] w-auto max-w-full rounded-lg object-contain" />
                </div>
            )}
        </ZeusModal>
    );
}
