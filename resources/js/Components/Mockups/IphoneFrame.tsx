import { type ReactNode, useState, useEffect } from 'react';
interface Props {
    src?: string;
    alt?: string;
    className?: string;
    children?: ReactNode;
}

export default function IphoneFrame({ src, alt = '', className = '', children }: Props) {
    const [currentTime, setCurrentTime] = useState('18:23');

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            setCurrentTime(`${hours}:${minutes}`);
        };
        updateClock();
        const interval = setInterval(updateClock, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`relative mx-auto w-[280px] shrink-0 sm:w-[320px] ${className}`}>
            {/* The iPhone frame body */}
            <div className="relative z-10 aspect-[1170/2532] overflow-hidden rounded-[3rem] border-[8px] border-slate-900 bg-slate-900 shadow-2xl ring-1 ring-slate-900/5 dark:border-slate-800 dark:bg-slate-800 dark:shadow-blue-900/20 dark:ring-white/10">
                {/* Dynamic Island with Status Bar */}
                <div className="absolute inset-x-0 top-4 z-20 h-auto w-full">
                    {/* Dynamic Island */}
                    <div className="absolute top-2 left-1/2 h-[20px] w-[84px] -translate-x-1/2 rounded-full bg-black"></div>

                    <div className="flex h-[24px] w-full items-center justify-between px-7 pt-1">
                        {/* Time */}
                        <span className="flex h-full items-end text-[13px] font-semibold tracking-wide text-white drop-shadow-sm">{currentTime}</span>

                        {/* Right Icons */}
                        <div className="flex h-full items-end gap-1.5 text-white">
                            {/* Cellular Signal (4 dots) */}
                            <div className="flex items-end gap-[2px] pb-[1px]">
                                <div className="h-1 w-1 rounded-full bg-white opacity-40"></div>
                                <div className="h-1 w-1 rounded-full bg-white opacity-40"></div>
                                <div className="h-1 w-1 rounded-full bg-white opacity-40"></div>
                                <div className="h-1 w-1 rounded-full bg-white opacity-40"></div>
                            </div>

                            {/* Wi-Fi */}
                            <svg
                                className="-mt-0.5 h-[14px] w-[14px]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                                <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                                <line x1="12" y1="20" x2="12.01" y2="20"></line>
                            </svg>

                            {/* Battery */}
                            <svg className="h-[12px] w-[25px]" viewBox="0 0 24 11" fill="none">
                                <rect x="0.5" y="0.5" width="20" height="10" rx="3.5" stroke="currentColor" strokeWidth="1" />
                                <rect x="2" y="2" width="17" height="7" rx="2" fill="currentColor" />
                                <path d="M22 4C22.5523 4 23 4.44772 23 5V6C23 6.55228 22.5523 7 22 7V4Z" fill="currentColor" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* The Mobile Content Container */}
                <div className="h-full w-full bg-slate-50 pt-14 dark:bg-slate-950">
                    {children ? children : src && <img src={src} alt={alt} className="h-full w-full object-cover" />}
                </div>
            </div>

            {/* Subtle glow behind the phone */}
            <div className="absolute -inset-4 z-0 rounded-[3.5rem] bg-gradient-to-tr from-blue-500/20 via-transparent to-blue-400/20 opacity-70 blur-2xl dark:opacity-100"></div>
        </div>
    );
}
