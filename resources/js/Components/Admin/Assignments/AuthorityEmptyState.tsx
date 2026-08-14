import { PlusIcon } from '@heroicons/react/24/outline';

interface Props {
    onAssignAuthority: () => void;
}

export default function AuthorityEmptyState({ onAssignAuthority }: Props) {
    return (
        <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-5">
                {/* Visual Anchor Area */}
                <div className="relative col-span-2 flex min-h-[280px] items-center justify-center bg-slate-50/50 p-8 md:border-r md:border-slate-100">
                    <div className="relative aspect-square w-full max-w-[240px]">
                        <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-slate-200">
                            {/* Abstract connection lines indicating authority mapping */}
                            <path d="M120 70 V160" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                            <path d="M60 160 H180" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                            <path d="M60 160 V190" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                            <path d="M180 160 V190" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />

                            {/* Top node: The Person/Authority */}
                            <rect x="96" y="30" width="48" height="48" rx="24" className="fill-white stroke-slate-300" strokeWidth="2" />
                            <circle cx="120" cy="48" r="8" className="fill-slate-300" />
                            <path d="M106 66 C106 60 112 58 120 58 C128 58 134 60 134 66" className="stroke-slate-300" strokeWidth="3" strokeLinecap="round" />
                            
                            {/* Role Badge indicating Responsibility */}
                            <rect x="130" y="30" width="28" height="28" rx="8" className="fill-blue-50 stroke-[#1F6FDB]/30" strokeWidth="1.5" />
                            <path d="M144 38 L140 48 M144 38 L148 48 M138 42 H150" className="stroke-[#1F6FDB]" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

                            {/* Left node: Zone coverage */}
                            <rect x="36" y="190" width="48" height="32" rx="6" className="fill-white stroke-slate-300" strokeWidth="2" />
                            <rect x="44" y="198" width="16" height="4" rx="2" className="fill-slate-200" />
                            <rect x="44" y="208" width="24" height="4" rx="2" className="fill-slate-200" />

                            {/* Right node: Estate-wide coverage (highlighted) */}
                            <rect x="150" y="180" width="60" height="42" rx="6" className="fill-blue-50/50 stroke-[#1F6FDB]/30" strokeWidth="2" />
                            <rect x="158" y="190" width="24" height="4" rx="2" className="fill-[#1F6FDB]/40" />
                            <rect x="158" y="200" width="40" height="4" rx="2" className="fill-[#1F6FDB]/20" />
                            <rect x="158" y="210" width="32" height="4" rx="2" className="fill-[#1F6FDB]/20" />
                            
                            {/* Connecting glowing dot */}
                            <circle cx="120" cy="160" r="4" className="fill-[#1F6FDB]" />

                        </svg>
                        
                        {/* Decorative floating dots for premium feel */}
                        <div className="absolute left-8 top-12 h-2 w-2 rounded-full bg-slate-300/50" />
                        <div className="absolute bottom-12 right-6 h-1.5 w-1.5 rounded-full bg-[#1F6FDB]/40" />
                    </div>
                </div>

                {/* Content Area */}
                <div className="col-span-3 flex flex-col justify-center p-10 lg:p-14">
                    <h3 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                        No authority assignments yet
                    </h3>
                    <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-slate-500">
                        Assign responsibilities to trusted members of your estate and define where they can operate.
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                        You can assign estate-wide or zone-specific authority.
                    </p>
                    <div className="mt-8">
                        <button
                            onClick={onAssignAuthority}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                        >
                            <PlusIcon className="h-4 w-4" strokeWidth={3} />
                            Assign Authority
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
