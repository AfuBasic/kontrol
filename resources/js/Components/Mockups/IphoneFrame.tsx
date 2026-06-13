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
                {/* Dynamic Island with Status Bar */}
                <div className="absolute inset-x-0 top-0 z-20 h-14 w-full">
                    {/* Dynamic Island */}
                    <div className="absolute top-3 left-1/2 h-[30px] w-[95px] -translate-x-1/2 rounded-full bg-black"></div>
                    
                    <div className="flex h-[44px] w-full items-center justify-between px-7 pt-1">
                        {/* Time */}
                        <span className="text-[13px] font-semibold tracking-wide text-white drop-shadow-sm">18:23</span>
                        
                        {/* Right Icons */}
                        <div className="flex items-center gap-1.5 text-white">
                            {/* Cellular Signal (4 dots) */}
                            <div className="flex gap-[2px] items-end pb-[1px]">
                                <div className="h-1.5 w-1.5 rounded-full bg-white opacity-40"></div>
                                <div className="h-1.5 w-1.5 rounded-full bg-white opacity-40"></div>
                                <div className="h-1.5 w-1.5 rounded-full bg-white opacity-40"></div>
                                <div className="h-1.5 w-1.5 rounded-full bg-white opacity-40"></div>
                            </div>
                            
                            {/* Wi-Fi */}
                            <svg className="h-[14px] w-[16px] -mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 21C10.6 21 9.4 20 8.8 18.7L1.2 7.3C.4 6.1 1.2 4.4 2.6 4.2C8.6 3.4 15.4 3.4 21.4 4.2C22.8 4.4 23.6 6.1 22.8 7.3L15.2 18.7C14.6 20 13.4 21 12 21Z" fill="currentColor"/>
                            </svg>
                            
                            {/* Battery */}
                            <svg className="h-[12px] w-[25px]" viewBox="0 0 24 11" fill="none">
                                <rect x="0.5" y="0.5" width="20" height="10" rx="3.5" stroke="currentColor" strokeWidth="1"/>
                                <rect x="2" y="2" width="17" height="7" rx="2" fill="currentColor"/>
                                <path d="M22 4C22.5523 4 23 4.44772 23 5V6C23 6.55228 22.5523 7 22 7V4Z" fill="currentColor"/>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* The Mobile Screenshot */}
                <div className="pt-14 h-full w-full bg-white dark:bg-slate-900">
                    <img
                        src={src}
                        alt={alt}
                        className="h-full w-full object-cover"
                    />
                </div>
            </div>

            {/* Subtle glow behind the phone */}
            <div className="absolute -inset-4 z-0 rounded-[3.5rem] bg-gradient-to-tr from-blue-500/20 via-transparent to-blue-400/20 opacity-70 blur-2xl dark:opacity-100"></div>
        </div>
    );
}
