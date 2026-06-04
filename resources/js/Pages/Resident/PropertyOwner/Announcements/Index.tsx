import { MegaphoneIcon, PlusIcon, TrashIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { create, destroy, show } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/AnnouncementController';

interface Announcement {
    id: number;
    hashid: string;
    title: string;
    body: string;
    status: string;
    applies_to: string;
    targets_count: number;
    created_at: string;
}

interface Props {
    announcements: Announcement[];
}

export default function Index({ announcements }: Props) {
    const deleteAnnouncement = (hashid: string) => {
        if (confirm('Are you sure you want to delete this announcement? This will remove it from target feeds.')) {
            router.delete(destroy.url(hashid as any));
        }
    };

    return (
        <div className="space-y-6 pb-24">
            <Head title="Property Owner Announcements" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Announcements</h1>
                    <p className="mt-1 text-sm text-slate-500">Broadcast important updates, alerts, and instructions to your occupants.</p>
                </div>
                <Link
                    href={create.url()}
                    className="shadow-indigo-655/15 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-700 active:scale-98"
                >
                    <PlusIcon className="h-5 w-5" />
                    New Announcement
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {announcements.length > 0 ? (
                    announcements.map((ann) => (
                        <div
                            key={ann.id}
                            className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] bg-white p-6 shadow-xs ring-1 ring-slate-100 transition-all hover:shadow-lg hover:ring-indigo-100"
                        >
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                        <MegaphoneIcon className="h-5 w-5" />
                                    </div>
                                    <button
                                        onClick={() => deleteAnnouncement(ann.hashid)}
                                        className="rounded-xl p-1.5 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
                                        title="Delete Broadcast"
                                    >
                                        <TrashIcon className="h-4.5 w-4.5" />
                                    </button>
                                </div>

                                <div className="mt-4">
                                    <Link
                                        href={show.url(ann.hashid as any)}
                                        className="line-clamp-1 text-base font-black text-slate-900 transition-colors group-hover:text-indigo-600"
                                    >
                                        {ann.title}
                                    </Link>
                                    <p className="mt-2 line-clamp-3 text-xs font-semibold text-slate-500">{ann.body}</p>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                                <div className="text-slate-450 text-xs font-bold uppercase">
                                    Target: {ann.applies_to === 'all' ? 'All Residents' : `${ann.targets_count} custom`}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">{ann.created_at}</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full rounded-[32px] bg-white py-16 text-center shadow-xs ring-1 ring-slate-100">
                        <MegaphoneIcon className="text-slate-350 mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-black text-slate-900">No Announcements Sent</h3>
                        <p className="mt-1 text-sm text-slate-500">Broadcast messages to alert your residents about updates or bills.</p>
                        <Link
                            href={create.url()}
                            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700"
                        >
                            Write First Announcement
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
