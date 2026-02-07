import { GetServerSideProps } from "next";
import nookies from "nookies";
import React from "react";
import { adminAuth, adminDb, adminFirestore } from "../../firebase-admin";

export default function DebugAuthPage({ data, error }: any) {
    return (
        <div className="p-10 font-mono text-sm">
            <h1 className="text-2xl font-bold mb-4">Admin Auth Debugger</h1>

            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded mb-4 border border-red-300">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className="bg-gray-100 p-4 rounded border border-gray-300 whitespace-pre-wrap">
                {JSON.stringify(data, null, 2)}
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold mb-2">Checklist:</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Has Token:</strong> {data?.hasToken ? '✅ Yes' : '❌ No (Login first)'}</li>
                    <li><strong>Token Verified:</strong> {data?.uid ? '✅ Yes' : '❌ No'}</li>
                    <li><strong>User Data Found:</strong> {data?.userData ? '✅ Yes' : '❌ No (Check DB Config)'}</li>
                    <li><strong>Role is Admin:</strong> {data?.userData?.role === 'admin' ? '✅ Yes' : '❌ No (Current: ' + (data?.userData?.role || 'undefined') + ')'}</li>
                </ul>
            </div>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    try {
        const cookies = nookies.get(context);
        const token = cookies.token;

        const debugData: any = {
            hasToken: !!token,
            tokenPreview: token ? token.substring(0, 10) + '...' : null,
            env: {
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
                hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
                hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
            }
        };

        if (!token) {
            return { props: { data: debugData, error: "No token found in cookies. Please login at /login" } };
        }

        try {
            const decodedToken = await adminAuth.verifyIdToken(token);
            debugData.uid = decodedToken.uid;
            debugData.email = decodedToken.email;

            // Check RTDB
            if (adminDb) {
                const userRef = adminDb.ref(`users/${decodedToken.uid}`);
                const userSnapshot = await userRef.once('value');
                const userData = userSnapshot.val();
                debugData.rtdb = {
                    path: `users/${decodedToken.uid}`,
                    exists: !!userData,
                    data: userData
                };
            } else {
                debugData.rtdb = { status: "adminDb is null (Hybrid Mode Safe)" };
            }

            // Check Firestore 
            if (adminFirestore) {
                const userDoc = await adminFirestore.collection('users').doc(decodedToken.uid).get();
                const userData = userDoc.data();
                debugData.firestore = {
                    path: `users/${decodedToken.uid}`,
                    exists: userDoc.exists,
                    data: userData
                };

                // Add to main debug data for checklist
                debugData.userData = userData;
            } else {
                debugData.firestore = { status: "adminFirestore is null" };
            }

        } catch (e: any) {
            debugData.verificationError = e.message;
        }

        return {
            props: {
                data: debugData,
            },
        };
    } catch (error: any) {
        return {
            props: {
                error: error.message,
                data: {
                    step: "Global Catch"
                }
            },
        };
    }
};
