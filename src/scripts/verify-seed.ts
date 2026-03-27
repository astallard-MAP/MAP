
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from 'firebase-admin/firestore';

async function verify() {
    try {
        if (getApps().length === 0) {
            initializeApp({ projectId: 'map261125' });
        }
        const db = getFirestore();
        const orgs = await db.collection('organisations').get();
        const props = await db.collection('properties').get();
        console.log(`Summary:`);
        console.log(`- Organisations: ${orgs.size}`);
        console.log(`- Properties: ${props.size}`);
    } catch (e: any) {
        console.error(e.message);
    }
}
verify();
