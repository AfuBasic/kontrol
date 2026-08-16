import { PlusIcon } from '@heroicons/react/24/outline';

interface Props {
    onCreateZone: () => void;
}

export default function ZoneEmptyState({ onCreateZone }: Props) {
    return (
        <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-5">
                {/* Visual Anchor Area */}
                <div className="relative col-span-2 flex min-h-[280px] items-center justify-center bg-slate-50/50 p-8 md:border-r md:border-slate-100">
                    <div className="relative aspect-square w-full max-w-[240px]">
                        <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-slate-200">
                            {/* Base grid/roads */}
                            <path d="M40 0V240M100 0V240M160 0V240M220 0V240" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                            <path d="M0 40H240M0 100H240M0 160H240M0 220H240" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />

                            {/* Abstract physical areas/zones */}
                            {/* Zone 1 */}
                            <rect x="44" y="44" width="52" height="52" rx="4" className="fill-white stroke-slate-300" strokeWidth="1.5" />
                            <rect x="52" y="52" width="20" height="12" rx="2" className="fill-slate-200" />
                            <rect x="52" y="68" width="36" height="20" rx="2" className="fill-slate-200" />

                            {/* Zone 2 (Highlighted/Active feel) */}
                            <rect x="104" y="44" width="112" height="112" rx="6" className="fill-blue-50/50 stroke-[#1F6FDB]/30" strokeWidth="2" />
                            <circle cx="160" cy="100" r="16" className="fill-[#1F6FDB]/10" />
                            <circle cx="160" cy="100" r="6" className="fill-[#1F6FDB]" />
                            <rect x="116" y="56" width="32" height="24" rx="3" className="fill-[#1F6FDB]/20" />
                            <rect x="172" y="120" width="32" height="24" rx="3" className="fill-[#1F6FDB]/20" />

                            {/* Zone 3 */}
                            <rect x="44" y="104" width="52" height="112" rx="4" className="fill-white stroke-slate-300" strokeWidth="1.5" />
                            <rect x="56" y="120" width="28" height="28" rx="2" className="fill-slate-200" />
                            <rect x="56" y="160" width="28" height="40" rx="2" className="fill-slate-200" />

                            {/* Zone 4 */}
                            <rect x="104" y="164" width="52" height="52" rx="4" className="fill-white stroke-slate-300" strokeWidth="1.5" />
                            <rect x="116" y="176" width="28" height="28" rx="14" className="fill-slate-200" />
                        </svg>

                        {/* Decorative floating dots for premium feel */}
                        <div className="absolute top-12 left-12 h-2 w-2 rounded-full bg-slate-300/50" />
                        <div className="absolute right-12 bottom-16 h-1.5 w-1.5 rounded-full bg-[#1F6FDB]/40" />
                    </div>
                </div>

                {/* Content Area */}
                <div className="col-span-3 flex flex-col justify-center p-10 lg:p-14">
                    <h3 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">No zones yet</h3>
                    <p className="mt-4 max-w-md text-sm leading-relaxed font-medium text-slate-500">
                        Create zones to organize your estate into physical areas and manage residents, staff, and operations by location.
                    </p>
                    <div className="mt-8">
                        <button
                            onClick={onCreateZone}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-black tracking-wider text-white uppercase shadow-sm transition-all hover:bg-slate-800 active:scale-95"
                        >
                            <PlusIcon className="h-4 w-4" strokeWidth={3} />
                            Create your first zone
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
