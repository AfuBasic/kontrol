import { Head } from '@inertiajs/react';
import { store, index } from '@/actions/App/Http/Controllers/Admin/UserController';
import UserForm from './UserForm';

type Props = {
    roles: Array<{ name: string; guard_name: string }>;
};

export default function Create({ roles }: Props) {
    return (
        <>
            <Head title="Add Staff Member" />
            <UserForm
                title="Add Staff Member"
                description="Add someone who will help operate this estate. An invitation email will be sent to them."
                submitUrl={store.url()}
                method="post"
                submitText="Send Invitation"
                cancelUrl={index.url()}
                roles={roles}
            />
        </>
    );
}
