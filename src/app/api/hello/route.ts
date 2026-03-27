
import { NextResponse } from 'next/server';
import { initializeAdminApp } from "../../../firebase/server-init";
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const app = await initializeAdminApp();
        // Use service account or project ID explicitly for firestore
        const db = getFirestore(app);
        
        console.log("🚀 Initialising Production Seed via API (Hardcoded Context)...");

        // 1. Organisations
        const organisations = [
            { id: "org_royal_estate", name: "Royal Estate Agents" },
            { id: "org_prime_living", name: "Prime Living Properties" }
        ];

        for (const org of organisations) {
            await db.collection("organisations").doc(org.id).set({
                ...org,
                status: "Active",
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
        }

        // 2. Sample Properties (Material Information Standard)
        const properties = [
            { id: "prop_101_high", headline: "101 High Street", organisationId: "org_royal_estate" },
            { id: "prop_beach_flat", headline: "Flat 4, Sea Breeze", organisationId: "org_prime_living" }
        ];

        for (const prop of properties) {
            await db.collection("properties").doc(prop.id).set({
                ...prop,
                status: "Available",
                createdAt: FieldValue.serverTimestamp()
            }, { merge: true });
        }

        return NextResponse.json({ 
            success: true, 
            message: "Production seed data injected successfully."
        });

    } catch (e: any) {
        console.error("API Seed Error:", e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
