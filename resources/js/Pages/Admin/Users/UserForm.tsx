import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link, useForm } from '@inertiajs/react';
import { type FormEventHandler, useEffect } from 'react';
import SearchableSelect from '@/Components/UI/SearchableSelect';

type Props = {
    user?: {
        name: string;
        email: string;
        role?: string;
    };
    submitUrl: string;
    method?: 'post' | 'put';
    title: string;
    description: string;
    submitText: string;
    cancelUrl: string;
    roles?: Array<{ name: string; guard_name: string }>;
};

export default function UserForm({ user, submitUrl, method = 'post', title, description, submitText, cancelUrl, roles = [] }: Props) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || '',
    });

    // Sync form data when user prop changes (e.g. re-navigation)
    useEffect(() => {
        setData({
            name: user?.name || '',
            email: user?.email || '',
            role: user?.role || '',
        });
    }, [user]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (method === 'put') {
            put(submitUrl);
        } else {
            post(submitUrl);
        }
    };

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
            <div className="mb-8">
                <Link href={cancelUrl} className="mb-4 inline-flex items-center text-[11px] font-black tracking-wider text-slate-500 uppercase hover:text-slate-900 transition-colors">
                    <ArrowLeftIcon className="mr-1 h-3.5 w-3.5" strokeWidth={2.5} />
                    Back to Estate Team
                </Link>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">{title}</h1>
                <p className="mt-1 text-xs font-semibold text-slate-500">{description}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white shadow-xs ring-1 ring-slate-100/50">
                <form onSubmit={submit} className="flex flex-col">
                    <div className="p-8">
                        {/* GLOBAL ERRORS */}
                        {Object.keys(errors).length > 0 && (
                            <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                                        <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-red-900">There was a problem with your submission</h3>
                                        <ul className="mt-2 list-disc pl-5 text-xs font-semibold text-red-700">
                                            {Object.entries(errors).map(([key, error]) => (
                                                <li key={key}>{error as string}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECTION: PERSON */}
                        <div className="mb-8">
                            <h2 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Person</h2>
                            <p className="mt-1 text-sm font-bold text-slate-900">Who are you inviting?</p>
                            
                            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="name" className="mb-1.5 block text-[11px] font-bold text-slate-700">
                                        Full Name
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-xs font-semibold text-slate-900 placeholder-slate-400 transition-all focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 focus:outline-hidden"
                                        placeholder="e.g. Jane Doe"
                                        required
                                        autoComplete="name"
                                    />
                                    {errors.name && <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.name}</p>}
                                </div>

                                <div>
                                    <label htmlFor="email" className="mb-1.5 block text-[11px] font-bold text-slate-700">
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        disabled={method === 'put'}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-xs font-semibold text-slate-900 placeholder-slate-400 transition-all focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 focus:outline-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                                        placeholder="e.g. jane@example.com"
                                        required
                                        autoComplete="email"
                                    />
                                    {errors.email && <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.email}</p>}
                                </div>
                            </div>
                        </div>

                        {/* SECTION: RESPONSIBILITY */}
                        {roles && roles.length > 0 && method === 'post' && (
                            <div className="pt-6 border-t border-slate-100">
                                <h2 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Responsibility</h2>
                                <p className="mt-1 text-sm font-bold text-slate-900">What will they be responsible for?</p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                    They will be granted estate-wide access for this responsibility. You can adjust this later in Staff & Authority.
                                </p>
                                
                                <div className="mt-5 w-full">
                                    <SearchableSelect
                                        options={roles.map((r) => ({
                                            value: r.name,
                                            label: r.name.charAt(0).toUpperCase() + r.name.slice(1),
                                        }))}
                                        value={data.role}
                                        onChange={(value) => setData('role', value)}
                                        placeholder="Select a role..."
                                    />
                                    {(errors as any).role && <p className="mt-1.5 text-xs font-semibold text-red-600">{(errors as any).role}</p>}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 rounded-b-2xl bg-slate-50/50 px-8 py-5 border-t border-slate-100">
                        <Link href={cancelUrl} className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-black tracking-wide text-white uppercase shadow-sm transition-all hover:bg-slate-800 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:outline-hidden active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <span className="flex items-center gap-2">
                                    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                submitText
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
