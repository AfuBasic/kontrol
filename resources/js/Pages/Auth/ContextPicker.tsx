import { Head, router, useForm } from '@inertiajs/react';
import { Building, Shield, Home, Briefcase, ArrowRight } from 'lucide-react';
import { type FormEventHandler, useState } from 'react';
import clsx from 'clsx';
import { switchMethod } from '@/actions/App/Http/Controllers/Auth/ContextController';

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
    const [selectedContext, setSelectedContext] = useState<number | null>(availableContexts.length > 0 ? availableContexts[0].id : null);

    const { post, processing } = useForm({
        assignment_id: selectedContext,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (selectedContext) {
            router.post(switchMethod.url(), {
                assignment_id: selectedContext,
            });
        }
    };

    const getRoleIcon = (roleName: string) => {
        const role = roleName.toLowerCase();
        if (role.includes('admin')) return <Briefcase className="h-5 w-5 text-purple-400" />;
        if (role.includes('security')) return <Shield className="h-5 w-5 text-blue-400" />;
        if (role.includes('resident') || role.includes('household')) return <Home className="h-5 w-5 text-green-400" />;
        return <Building className="h-5 w-5 text-gray-400" />;
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] p-4 text-white">
            <Head title="Select Context" />

            <div className="w-full max-w-md rounded-3xl border border-[#1a1a1a] bg-[#0a0a0a] p-8 shadow-2xl">
                <div className="mb-8 text-center">
                    <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">Select Workspace</h1>
                    <p className="text-sm text-gray-400">Choose where you'd like to continue.</p>
                </div>

                <form onSubmit={submit}>
                    <div className="custom-scrollbar mb-8 max-h-[400px] space-y-3 overflow-y-auto pr-2">
                        {availableContexts.map((context) => (
                            <button
                                key={context.id}
                                type="button"
                                onClick={() => setSelectedContext(context.id)}
                                className={clsx(
                                    'flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all duration-200',
                                    selectedContext === context.id
                                        ? 'border-green-500/50 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                                        : 'border-[#1a1a1a] bg-[#0f0f0f] hover:border-[#333] hover:bg-[#151515]',
                                )}
                            >
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <div
                                        className={clsx(
                                            'flex-shrink-0 rounded-lg p-2.5 transition-colors',
                                            selectedContext === context.id ? 'bg-green-500/20' : 'bg-[#1a1a1a]',
                                        )}
                                    >
                                        {getRoleIcon(context.role_name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate font-medium text-white">{context.estate_name}</h3>
                                        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                            <span className="text-xs whitespace-nowrap text-gray-400 capitalize">
                                                {context.role_name.replace('_', ' ')}
                                            </span>
                                            <span className="xs:inline-block hidden text-xs text-gray-600">•</span>
                                            <span className="text-xs whitespace-nowrap text-gray-400 capitalize">
                                                {context.zone_name ? `Zone: ${context.zone_name}` : 'Estate-wide'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {selectedContext === context.id && (
                                    <div className="ml-4 flex-shrink-0">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                                            <div className="h-2 w-2 rounded-full bg-[#050505]" />
                                        </div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={processing || !selectedContext}
                        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 font-medium text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Continue
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
