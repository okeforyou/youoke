import { ReactElement } from 'react';
import { PageEditor } from '@/modules/admin/components/cms/PageEditor';
import AdminLayout from '@/layouts/AdminLayout';

const NewProfilePage = () => {
    return (
        <AdminLayout>
            <PageEditor />
        </AdminLayout>
    );
};

export default NewProfilePage;
