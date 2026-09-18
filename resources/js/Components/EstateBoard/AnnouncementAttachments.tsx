import { ChevronRight, FileText, ImageIcon, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import type { PostMedia } from '@/types';

interface AnnouncementAttachmentsProps {
    media: PostMedia[];
    className?: string;
}

function fileNameFor(item: PostMedia): string {
    if (item.name) {
        return item.name;
    }

    const path = item.url.split('?')[0];
    return decodeURIComponent(path.split('/').pop() || 'Attachment');
}

function fileSizeFor(size?: number): string | null {
    if (!size || size < 1) {
        return null;
    }

    if (size < 1024 * 1024) {
        return `${Math.ceil(size / 1024)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AnnouncementAttachments({ media, className = '' }: AnnouncementAttachmentsProps) {
    const [selectedImage, setSelectedImage] = useState<PostMedia | null>(null);
    const imageMedia = useMemo(() => media.filter((item) => item.mime_type.startsWith('image/')), [media]);
    const fileMedia = useMemo(() => media.filter((item) => !item.mime_type.startsWith('image/')), [media]);

    useEffect(() => {
        if (!selectedImage) {
            return;
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSelectedImage(null);
            }
        };

        window.addEventListener('keydown', handleEscape);

        return () => window.removeEventListener('keydown', handleEscape);
    }, [selectedImage]);

    if (!media || media.length === 0) {
        return null;
    }

    return (
        <div className={`space-y-7 ${className}`}>
            {imageMedia.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-500">
                        <ImageIcon className="h-4 w-4" />
                        <span className="text-xs font-medium">{imageMedia.length === 1 ? 'Photo' : `${imageMedia.length} photos`}</span>
                    </div>

                    <div className={imageMedia.length === 1 ? '' : 'grid grid-cols-2 gap-3 sm:grid-cols-3'}>
                        {imageMedia.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setSelectedImage(item)}
                                aria-label={`Open ${fileNameFor(item)}`}
                                className={`group block w-full overflow-hidden rounded-2xl bg-slate-100 text-left ring-1 ring-slate-200/80 focus:ring-2 focus:ring-[#0b4aa2] focus:ring-offset-2 focus:outline-none ${
                                    imageMedia.length === 1 ? 'aspect-[16/10] sm:aspect-[16/9]' : 'aspect-4/3'
                                }`}
                            >
                                <img
                                    src={item.url}
                                    alt={fileNameFor(item)}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {fileMedia.length > 0 && (
                <div>
                    <h2 className="text-base font-semibold text-slate-950">Attachments</h2>
                    <div className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                        {fileMedia.map((item) => {
                            const size = fileSizeFor(item.size_bytes);

                            return (
                                <a
                                    key={item.id}
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex min-h-16 items-center gap-3 py-3 text-left transition-colors hover:text-[#0b4aa2]"
                                >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef5ff] text-[#0b4aa2]">
                                        <FileText className="h-5 w-5" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-slate-900">{fileNameFor(item)}</span>
                                        <span className="mt-0.5 block text-xs text-slate-500">
                                            {item.mime_type.split('/').pop()?.toUpperCase() || 'Document'}
                                            {size ? ` · ${size}` : ''}
                                        </span>
                                    </span>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}

            {selectedImage && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Announcement photo"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        aria-label="Close photo"
                        className="absolute top-[calc(1rem+env(safe-area-inset-top,0px))] right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <img
                        src={selectedImage.url}
                        alt={fileNameFor(selectedImage)}
                        className="max-h-[88vh] max-w-full rounded-xl object-contain"
                        onClick={(event) => event.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
