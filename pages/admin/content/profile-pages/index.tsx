import ProfilePagesAdmin from '../../../../src/features/admin/pages/content/profile-pages';
import { GetServerSideProps } from 'next';
import nookies from 'nookies';
import { adminAuth, adminDb } from '../../../../../firebase-admin';

export default function ProfilePagesRoute(props: any) {
    return <ProfilePagesAdmin />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const token = cookies.token;

        if (!token) {
            return { redirect: { destination: "/login", permanent: false } };
        }

        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;
        const userRef = adminDb.ref(`users/${uid}`);
        const userSnapshot = await userRef.once('value');
        const userData = userSnapshot.val();

        if (!userData || userData.role !== 'admin') {
            return { redirect: { destination: "/", permanent: false } };
        }

        return { props: {} };
    } catch (error) {
        return { redirect: { destination: "/login", permanent: false } };
    }
};
