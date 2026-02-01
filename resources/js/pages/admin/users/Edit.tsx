import { Head } from '@inertiajs/react';
import { update, index } from '@/actions/App/Http/Controllers/Admin/UserController';
import AdminLayout from '@/layouts/AdminLayout';
import UserForm from './UserForm';

type Props = {
    user: {
        id: number;
        name: string;
        email: string;
        role?: string;
    };
    roles: Array<{ name: string; guard_name: string }>;
};

export default function Edit({ user, roles }: Props) {
    return (
        <AdminLayout>
            <Head title="Edit Admin" />
            <UserForm
                user={user}
                title="Edit Administrator"
                description="Update the details of this administrator."
                submitUrl={user?.id ? update.url({ user: user.id }) : ''}
                method="put"
                submitText="Save Changes"
                cancelUrl={index.url()}
                roles={roles}
            />
        </AdminLayout>
    );
}
