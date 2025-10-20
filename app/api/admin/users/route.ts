
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

function initializeAdmin() {
    if (admin.apps.length === 0) {
        try {
            if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        
                        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    }),
                    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
                });
            } else {
                admin.initializeApp({
                    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
                });
            }
            console.log("Firebase Admin SDK initialized successfully.");
        } catch (error) {
            console.error("Firebase Admin initialization error. Check service account credentials:", error);
            throw new Error("Failed to initialize Firebase Admin SDK.");
        }
    }
}

initializeAdmin();

export async function GET(request: NextRequest) {
    try {
        const listUsersResult = await admin.auth().listUsers(1000); 
        
        const users = listUsersResult.users.map((user: admin.auth.UserRecord) => ({
            uid: user.uid,
            email: user.email,
            creationTime: user.metadata.creationTime,
            lastSignInTime: user.metadata.lastSignInTime,
            disabled: user.disabled,
        }));
        
        return NextResponse.json({ users }, { status: 200 });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error listing users:", errorMessage);
        return NextResponse.json({ error: "Failed to fetch user list. Check Admin SDK credentials." }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { uid } = await request.json();

        if (!uid) {
            return NextResponse.json({ error: "UID is required for deletion." }, { status: 400 });
        }
        
        await admin.auth().deleteUser(uid);
        
        await admin.database().ref('UserAnswers/' + uid).remove();

        return NextResponse.json({ message: 'User ' + uid + ' and associated answers deleted successfully.' }, { status: 200 });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : undefined;

        if (errorCode === 'auth/user-not-found') {
             return NextResponse.json({ error: "User not found." }, { status: 404 });
        }
        console.error("Error deleting user:", errorStack);
        return NextResponse.json({ error: errorMessage || "Failed to delete user." }, { status: 500 });
    }
}