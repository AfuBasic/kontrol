import { Head, router, useForm } from '@inertiajs/react';
import { Building, Shield, Home, Briefcase, ArrowRight } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import clsx from 'clsx';
import { contextSwitch } from '@/routes';

interface ContextData {
    id: number;
    estate_name: string;
    role_name: string;
    scope_type: string;
    zone_name: string | null;
    is_primary: boolean;
}

interface Props {
    availableContexts: ContextData[];
}

export default function ContextPicker({ availableContexts }: Props) {
    const [selectedContext, setSelectedContext] = useState<number | null>(
        availableContexts.length > 0 ? availableContexts[0].id : null
    );

    const { post, processing } = useForm({
        assignment_id: selectedContext,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        if (selectedContext) {
            router.post(contextSwitch().url(), {
                assignment_id: selectedContext
            });
        }
    };

    const getRoleIcon = (roleName: string) => {
        const role = roleName.toLowerCase();
        if (role.includes('admin')) return <Briefcase className="w-5 h-5 text-purple-400" />;
        if (role.includes('security')) return <Shield className="w-5 h-5 text-blue-400" />;
        if (role.includes('resident') || role.includes('household')) return <Home className="w-5 h-5 text-green-400" />;
        return <Building className="w-5 h-5 text-gray-400" />;
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
            <Head title="Select Context" />

            <div className="w-full max-w-md bg-[#0a0a0a] border border-[#1a1a1a] p-8 rounded-3xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">
                        Select Workspace
                    </h1>
                    <p className="text-sm text-gray-400">
                        Choose where you'd like to continue.
                    </p>
                </div>

                <form onSubmit={submit}>
                    <div className="space-y-3 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {availableContexts.map((context) => (
                            <button
                                key={context.id}
                                type="button"
                                onClick={() => setSelectedContext(context.id)}
                                className={clsx(
                                    "w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left",
                                    selectedContext === context.id
                                        ? "border-green-500/50 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                                        : "border-[#1a1a1a] bg-[#0f0f0f] hover:border-[#333] hover:bg-[#151515]"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "p-2.5 rounded-lg flex-shrink-0 transition-colors",
                                        selectedContext === context.id ? "bg-green-500/20" : "bg-[#1a1a1a]"
                                    )}>
                                        {getRoleIcon(context.role_name)}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white line-clamp-1">{context.estate_name}</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-xs text-gray-400 capitalize">
                                                {context.role_name.replace('_', ' ')}
                                            </span>
                                            <span className="text-gray-600 text-xs">•</span>
                                            <span className="text-xs text-gray-400 capitalize">
                                                {context.zone_name ? `Zone: ${context.zone_name}` : 'Estate-wide'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {selectedContext === context.id && (
                                    <div className="flex-shrink-0 ml-4">
                                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-[#050505]" />
                                        </div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={processing || !selectedContext}
                        className="w-full flex items-center justify-center gap-2 bg-white text-black py-3.5 px-4 rounded-xl font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        Continue
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    );
}
