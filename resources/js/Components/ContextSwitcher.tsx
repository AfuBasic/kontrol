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

export default function ContextSwitcher() {
    const { auth } = usePage().props as any;
    const currentContext = auth.context as ContextData | null;
    const availableContexts = (auth.available_contexts || []) as ContextData[];
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
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-700"
            >
                <div className="flex-shrink-0 bg-gray-800 p-1.5 rounded-md">
                    {getRoleIcon(currentContext.role_name)}
                </div>
                <div className="text-left hidden md:block">
                    <p className="text-sm font-medium text-white line-clamp-1">
                        {currentContext.estate_name}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                        {currentContext.role_name.replace('_', ' ')}
                    </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 hidden md:block" />
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
