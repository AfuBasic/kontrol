import React from 'react';

interface AnnouncementProseProps {
    html: string;
    className?: string;
}

export default function AnnouncementProse({ html, className = '' }: AnnouncementProseProps) {
    if (!html || !html.trim()) {
        return (
            <p className="text-sm font-medium italic text-slate-400">
                No announcement content provided.
            </p>
        );
    }

    return (
        <div
            className={`prose prose-slate max-w-none prose-p:leading-relaxed prose-p:font-normal prose-p:text-slate-700 prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-strong:font-bold prose-strong:text-slate-900 prose-ul:my-4 prose-ul:list-disc prose-ol:my-4 prose-ol:list-decimal prose-li:my-1 prose-li:text-slate-700 prose-blockquote:border-l-4 prose-blockquote:border-primary-500 prose-blockquote:bg-slate-50/80 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:italic prose-blockquote:text-slate-700 prose-a:font-bold prose-a:text-primary-600 prose-a:underline hover:prose-a:text-primary-700 ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
