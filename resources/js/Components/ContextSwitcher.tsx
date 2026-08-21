import { router, usePage } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import * as ContextController from '@/actions/App/Http/Controllers/Auth/ContextController';
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
            document.addEventListener('mousedown', handleClickOutside as EventListener);
            document.addEventListener('touchstart', handleClickOutside as EventListener);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside as EventListener);
            document.removeEventListener('touchstart', handleClickOutside as EventListener);
        };
    }, [isOpen]);

    if (!currentContext || availableContexts.length <= 1) {
        return null;
    }

    const switchContext = (assignmentId: number) => {
        setIsOpen(false);
        router.post(
            ContextController.switchMethod.url(),
            {
                assignment_id: assignmentId,
            },
            {
                preserveState: false,
            },
        );
    };

    const getRoleIcon = (roleName: string, className = 'w-4 h-4') => {
        const role = roleName.toLowerCase();
        if (role.includes('admin')) return <Briefcase className={clsx(className, 'text-purple-400')} />;
        if (role.includes('security')) return <Shield className={clsx(className, 'text-blue-400')} />;
        if (role.includes('resident') || role.includes('household')) return <Home className={clsx(className, 'text-green-400')} />;
        return <Building className={clsx(className, 'text-gray-400')} />;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    'group flex items-center gap-1.5 rounded-xl px-2 py-1 transition-all',
                    variant === 'dark' ? 'hover:bg-gray-800/60' : 'hover:bg-slate-100/60',
                )}
            >
                <div className="flex flex-col justify-center text-left">
                    <div className="flex items-center gap-1">
                        <p
                            className={clsx(
                                'max-w-[110px] truncate text-sm leading-none font-bold sm:max-w-[160px] md:max-w-[200px]',
                                variant === 'dark' ? 'text-white' : 'text-slate-900',
                            )}
                        >
                            {currentContext.estate_name}
                        </p>
                        <ChevronDown
                            className={clsx(
                                'h-3.5 w-3.5 opacity-50 transition-opacity group-hover:opacity-100',
                                variant === 'dark' ? 'text-white' : 'text-slate-900',
                            )}
                        />
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                        <div className={clsx('opacity-70', variant === 'dark' ? 'text-gray-400' : 'text-slate-500')}>
                            {getRoleIcon(currentContext.role_name, 'w-3 h-3')}
                        </div>
                        <p
                            className={clsx(
                                'text-[10px] leading-none font-semibold capitalize',
                                variant === 'dark' ? 'text-gray-400' : 'text-slate-500',
                            )}
                        >
                            {currentContext.role_name.replace('_', ' ')}
                        </p>
                    </div>
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl">
                    <div className="border-b border-[#1a1a1a] p-3">
                        <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Switch Context</p>
                    </div>
                    <div className="max-h-[60vh] space-y-1 overflow-y-auto p-2">
                        {availableContexts.map((ctx) => (
                            <button
                                key={ctx.id}
                                onClick={() => switchContext(ctx.id)}
                                className={clsx(
                                    'group flex w-full items-center justify-between rounded-lg p-2.5 text-left transition-colors',
                                    currentContext.id === ctx.id ? 'bg-green-500/10 text-green-500' : 'text-gray-300 hover:bg-[#151515]',
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={clsx(
                                            'rounded-md p-1.5',
                                            currentContext.id === ctx.id ? 'bg-green-500/20' : 'bg-[#1a1a1a] group-hover:bg-[#222]',
                                        )}
                                    >
                                        {getRoleIcon(ctx.role_name)}
                                    </div>
                                    <div>
                                        <p className="line-clamp-1 text-sm font-medium">{ctx.estate_name}</p>
                                        <p className="text-xs capitalize opacity-70">
                                            {ctx.role_name.replace('_', ' ')}
                                            {ctx.zone_name ? ` • ${ctx.zone_name}` : ''}
                                        </p>
                                    </div>
                                </div>
                                {currentContext.id === ctx.id && <Check className="h-4 w-4 shrink-0 text-green-500" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
