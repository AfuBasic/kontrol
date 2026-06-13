interface Props {
    src: string;
    alt: string;
    className?: string;
}

export default function IphoneFrame({ src, alt, className = '' }: Props) {
    return (
        <div className={`relative mx-auto w-[280px] shrink-0 sm:w-[320px] ${className}`}>
            {/* The iPhone frame body */}
            <div className="relative z-10 aspect-[1170/2532] overflow-hidden rounded-[3rem] border-[8px] border-slate-900 bg-slate-900 shadow-2xl ring-1 ring-slate-900/5 dark:border-slate-800 dark:bg-slate-800 dark:shadow-blue-900/20 dark:ring-white/10">
                {/* Dynamic Island / Notch area with Status Bar */}
                <div className="absolute inset-x-0 top-0 z-20 h-14 w-full">
                    <div className="flex h-12 w-full items-center justify-between px-6">
                        <span className="text-[12px] font-semibold text-slate-900 dark:text-white">9:41</span>
                        <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                            <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                                <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                                <line x1="12" y1="20" x2="12.01" y2="20"></line>
                            </svg>
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2 12h2v8H2v-8zm4-3h2v11H6V9zm4-4h2v15h-2V5zm4-4h2v19h-2V1z"></path>
                            </svg>
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect x="1" y="6" width="18" height="12" rx="2" ry="2"></rect>
                                <line x1="23" y1="13" x2="23" y2="11"></line>
                            </svg>
                        </div>
                    </div>
                    <div className="absolute top-0 left-1/2 h-7 w-[120px] -translate-x-1/2 rounded-b-3xl bg-slate-900 dark:bg-slate-800"></div>
                </div>

                {/* The Mobile Screenshot */}
                <img src={src} alt={alt} className="h-full w-full bg-white object-cover" />
            </div>

            {/* Subtle glow behind the phone */}
            <div className="absolute -inset-4 z-0 rounded-[3.5rem] bg-gradient-to-tr from-blue-500/20 via-transparent to-blue-400/20 opacity-70 blur-2xl dark:opacity-100"></div>
        </div>
    );
}
