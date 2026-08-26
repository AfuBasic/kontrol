import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Shield, Plus } from 'lucide-react';
import { store, index } from '@/actions/App/Http/Controllers/Admin/UserController';
import { create as createRole } from '@/actions/App/Http/Controllers/Admin/RoleController';
import UserForm from './UserForm';

type Props = {
    roles: Array<{ name: string; guard_name: string }>;
};

export default function Create({ roles }: Props) {
    const hasRoles = roles && roles.length > 0;

    return (
        <>
            <Head title="Add Staff Member" />

            {!hasRoles ? (
                <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
                    <div className="mb-8">
                        <Link
                            href={index.url()}
                            className="mb-4 inline-flex items-center text-[11px] font-black tracking-wider text-slate-500 uppercase transition-colors hover:text-slate-900"
                        >
                            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" strokeWidth={2.5} />
                            Back to Estate Team
                        </Link>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Add Staff Member</h1>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Add someone who will help operate this estate.
                        </p>
                    </div>

                    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xs ring-1 ring-slate-100/50 sm:p-12">
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                            <Shield className="h-7 w-7" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Create an Estate Role First</h2>
                        <p className="mt-2 max-w-md text-xs leading-relaxed font-semibold text-slate-500">
                            Staff members need an assigned responsibility (such as <span className="font-bold text-slate-700">Estate Manager</span>, <span className="font-bold text-slate-700">Accountant</span>, or <span className="font-bold text-slate-700">Facility Officer</span>) before they can be invited to the estate team.
                        </p>

                        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                            <Link
                                href={createRole.url()}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95 sm:w-auto"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Create First Role</span>
                            </Link>
                            <Link
                                href={index.url()}
                                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 sm:w-auto dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                            >
                                Back to Estate Team
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <UserForm
                    title="Add Staff Member"
                    description="Add someone who will help operate this estate. An invitation email will be sent to them."
                    submitUrl={store.url()}
                    method="post"
                    submitText="Send Invitation"
                    cancelUrl={index.url()}
                    roles={roles}
                />
            )}
        </>
    );
}
