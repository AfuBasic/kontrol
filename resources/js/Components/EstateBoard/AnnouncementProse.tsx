import React from 'react';

interface AnnouncementProseProps {
    html: string;
    className?: string;
}

export default function AnnouncementProse({ html, className = '' }: AnnouncementProseProps) {
    if (!html || !html.trim()) {
        return <p className="text-sm font-medium text-slate-400 italic">No announcement content provided.</p>;
    }

    return (
        <div
            className={`prose prose-slate prose-headings:font-semibold prose-headings:text-slate-950 prose-headings:[letter-spacing:0] prose-h1:mt-10 prose-h1:mb-4 prose-h1:text-2xl prose-h2:mt-10 prose-h2:mb-3 prose-h2:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-lg prose-h4:mt-7 prose-h4:mb-2 prose-h4:text-base prose-p:my-5 prose-p:leading-7 prose-p:font-normal prose-p:text-slate-700 prose-strong:font-semibold prose-strong:text-slate-950 prose-ul:my-5 prose-ul:list-disc prose-ul:pl-5 prose-ol:my-5 prose-ol:list-decimal prose-ol:pl-5 prose-li:my-2 prose-li:pl-1 prose-li:leading-7 prose-li:text-slate-700 prose-li:marker:font-semibold prose-li:marker:text-[#0b4aa2] prose-blockquote:my-7 prose-blockquote:rounded-r-xl prose-blockquote:border-l-4 prose-blockquote:border-[#0b4aa2] prose-blockquote:bg-[#f2f7ff] prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:not-italic prose-blockquote:text-slate-700 prose-a:font-medium prose-a:text-[#0b4aa2] prose-a:underline prose-a:decoration-[#93c5fd] prose-a:underline-offset-4 hover:prose-a:text-[#083b82] prose-hr:my-8 prose-hr:border-slate-200 max-w-none text-[15px] sm:text-base ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
