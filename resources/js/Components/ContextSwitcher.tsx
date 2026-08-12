import { router, usePage } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import ContextController from '@/actions/App/Http/Controllers/Auth/ContextController';
import clsx from 'clsx';
import { Building, Shield, Home, Briefcase, ChevronDown, Check } from 'lucide-react';

interface ContextData {
    id: number;
    estate_id: number;
    estate_name: string;
    role_name: string;
    scope_type: string;
    zone_id: number | null;
    zone_name: string | null;
}

interface Props {
    variant?: 'light' | 'dark';
}

export default function ContextSwitcher({ variant = 'dark' }: Props) {
    const { auth } = usePage().props as any;
    const currentContext = auth.user?.context as ContextData | null;
    const availableContexts = (auth.user?.available_contexts || []) as ContextData[];
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    if (!currentContext || availableContexts.length <= 1) {
        return null;
    }

    const switchContext = (assignmentId: number) => {
        setIsOpen(false);
        router.post(ContextController.switch.url(), {
            assignment_id: assignmentId
        }, {
            preserveState: false,
        });
    };

    const getRoleIcon = (roleName: string, className = "w-4 h-4") => {
        const role = roleName.toLowerCase();
        if (role.includes('admin')) return <Briefcase className={clsx(className, "text-purple-400")} />;
        if (role.includes('security')) return <Shield className={clsx(className, "text-blue-400")} />;
        if (role.includes('resident') || role.includes('household')) return <Home className={clsx(className, "text-green-400")} />;
        return <Building className={clsx(className, "text-gray-400")} />;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "flex items-center gap-1.5 px-2 py-1 rounded-xl transition-all group",
                    variant === 'dark' 
                        ? "hover:bg-gray-800/60" 
                        : "hover:bg-slate-100/60"
                )}
            >
                <div className="text-left flex flex-col justify-center">
                    <div className="flex items-center gap-1">
                        <p className={clsx(
                            "text-sm font-bold leading-none truncate max-w-[110px] sm:max-w-[160px] md:max-w-[200px]",
                            variant === 'dark' ? "text-white" : "text-slate-900"
                        )}>
                            {currentContext.estate_name}
                        </p>
                        <ChevronDown className={clsx(
                            "w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity",
                            variant === 'dark' ? "text-white" : "text-slate-900"
                        )} />
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                        <div className={clsx(
                            "opacity-70",
                            variant === 'dark' ? "text-gray-400" : "text-slate-500"
                        )}>
                            {getRoleIcon(currentContext.role_name, "w-3 h-3")}
                        </div>
                        <p className={clsx(
                            "text-[10px] font-semibold capitalize leading-none",
                            variant === 'dark' ? "text-gray-400" : "text-slate-500"
                        )}>
                            {currentContext.role_name.replace('_', ' ')}
                        </p>
                    </div>
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] origin-top-right bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-[#1a1a1a]">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Switch Context</p>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
                        {availableContexts.map((ctx) => (
                            <button
                                key={ctx.id}
                                onClick={() => switchContext(ctx.id)}
                                className={clsx(
                                    "w-full flex items-center justify-between p-2.5 rounded-lg transition-colors text-left group",
                                    currentContext.id === ctx.id
                                        ? "bg-green-500/10 text-green-500"
                                        : "hover:bg-[#151515] text-gray-300"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={clsx(
                                        "p-1.5 rounded-md",
                                        currentContext.id === ctx.id ? "bg-green-500/20" : "bg-[#1a1a1a] group-hover:bg-[#222]"
                                    )}>
                                        {getRoleIcon(ctx.role_name)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium line-clamp-1">{ctx.estate_name}</p>
                                        <p className="text-xs opacity-70 capitalize">
                                            {ctx.role_name.replace('_', ' ')}
                                            {ctx.zone_name ? ` • ${ctx.zone_name}` : ''}
                                        </p>
                                    </div>
                                </div>
                                {currentContext.id === ctx.id && (
                                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
