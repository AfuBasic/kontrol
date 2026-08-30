import { ImageIcon } from 'lucide-react';
import React, { useState } from 'react';
import type { PostMedia } from '@/types';

interface AnnouncementAttachmentsProps {
    media: PostMedia[];
    className?: string;
}

export default function AnnouncementAttachments({ media, className = '' }: AnnouncementAttachmentsProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    if (!media || media.length === 0) {
        return null;
    }

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="flex items-center gap-2 text-slate-400">
                <ImageIcon className="h-4 w-4" />
                <span className="text-[11px] font-black tracking-wider uppercase">
                    Attachments ({media.length})
                </span>
            </div>

            {media.length === 1 ? (
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 shadow-xs">
                    <img
                        src={media[0].url}
                        alt="Announcement attachment"
                        className="max-h-[460px] w-full cursor-zoom-in object-cover transition-transform duration-300 hover:scale-[1.01]"
                        onClick={() => setSelectedImage(media[0].url)}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {media.map((item) => (
                        <div
                            key={item.id}
                            className="group relative aspect-4/3 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-xs"
                        >
                            <img
                                src={item.url}
                                alt="Announcement attachment"
                                className="h-full w-full cursor-zoom-in object-cover transition-transform duration-300 group-hover:scale-105"
                                onClick={() => setSelectedImage(item.url)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox / Fullscreen Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl shadow-2xl">
                        <img
                            src={selectedImage}
                            alt="Enlarged attachment"
                            className="max-h-[90vh] max-w-[90vw] object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
