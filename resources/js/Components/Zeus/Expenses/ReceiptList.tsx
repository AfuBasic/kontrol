import { ArrowDownTrayIcon, DocumentTextIcon, EyeIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatBytes } from '@/Lib/expenses';
import type { Receipt } from './types';

type Props = {
    receipts: Receipt[];
    /** Open an image in the viewer. PDFs open in a new tab instead. */
    onView: (receipt: Receipt) => void;
    onRemove?: (receipt: Receipt) => void;
};

const action = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white';

/** Every receipt with View and Download, and Remove when editing. */
export default function ReceiptList({ receipts, onView, onRemove }: Props) {
    return (
        <ul className="space-y-2">
            {receipts.map((receipt) => (
                <li key={receipt.id} className="flex items-center gap-3 rounded-xl border border-slate-700/70 bg-slate-800/30 px-3 py-2">
                    {receipt.is_pdf ? (
                        <DocumentTextIcon className="h-5 w-5 shrink-0 text-rose-300" />
                    ) : (
                        <PhotoIcon className="h-5 w-5 shrink-0 text-sky-300" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm text-white" title={receipt.name}>
                        {receipt.name}
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">{formatBytes(receipt.size)}</span>

                    {receipt.is_pdf ? (
                        <a
                            href={receipt.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View ${receipt.name}`}
                            title="View"
                            className={action}
                        >
                            <EyeIcon className="h-5 w-5" />
                        </a>
                    ) : (
                        <button type="button" onClick={() => onView(receipt)} aria-label={`View ${receipt.name}`} title="View" className={action}>
                            <EyeIcon className="h-5 w-5" />
                        </button>
                    )}
                    <a
                        href={receipt.download_url}
                        download={receipt.name}
                        aria-label={`Download ${receipt.name}`}
                        title="Download"
                        className={action}
                    >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                    </a>
                    {onRemove && (
                        <button
                            type="button"
                            onClick={() => onRemove(receipt)}
                            aria-label={`Remove ${receipt.name}`}
                            title="Remove"
                            className={`${action} hover:text-rose-300`}
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    )}
                </li>
            ))}
        </ul>
    );
}
