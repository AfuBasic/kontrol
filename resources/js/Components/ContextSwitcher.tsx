import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
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

    if (!currentContext || availableContexts.length <= 1) {
        return null;
    }

    const switchContext = (assignmentId: number) => {
        setIsOpen(false);
        router.post(route('context.switch'), {
            assignment_id: assignmentId
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
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 md:py-2 rounded-xl transition-colors border",
                    variant === 'dark' 
                        ? "hover:bg-gray-800 border-transparent hover:border-gray-700" 
                        : "hover:bg-slate-100 border-slate-200 bg-white shadow-sm"
                )}
            >
                <div className={clsx(
                    "flex-shrink-0 p-1.5 rounded-lg",
                    variant === 'dark' ? "bg-gray-800" : "bg-slate-100"
                )}>
                    {getRoleIcon(currentContext.role_name)}
                </div>
                <div className="text-left hidden md:block">
                    <p className={clsx(
                        "text-sm font-bold line-clamp-1",
                        variant === 'dark' ? "text-white" : "text-slate-900"
                    )}>
                        {currentContext.estate_name}
                    </p>
                    <p className={clsx(
                        "text-xs font-semibold capitalize",
                        variant === 'dark' ? "text-gray-400" : "text-slate-500"
                    )}>
                        {currentContext.role_name.replace('_', ' ')}
                    </p>
                </div>
                <ChevronDown className={clsx(
                    "w-4 h-4 hidden md:block",
                    variant === 'dark' ? "text-gray-500" : "text-slate-400"
                )} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-3 border-b border-[#1a1a1a]">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Switch Context</p>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
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
                                        <Check className="w-4 h-4 text-green-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
