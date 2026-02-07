import { useRouter } from 'next/router';
import { PageEditor } from '../../../components/cms/PageEditor';
import AdminLayout from '../../../layouts/AdminLayout';

const EditProfilePage = () => {
    const router = useRouter();
    const { id } = router.query;
    const pageId = Array.isArray(id) ? id[0] : id;

    if (!router.isReady) return <div className="p-8 text-center">Loading...</div>;

    return (
        <AdminLayout>
            <PageEditor pageId={pageId} />
        </AdminLayout>
    );
};

export default EditProfilePage;
