
import { initializeAdminApp } from "../firebase/server-init";
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

async function seedPortalData() {
    try {
        console.log("Checking Admin App...");
        const app = await initializeAdminApp();
        console.log("App Initialized. Getting Firestore...");
        const db = getFirestore(app);
        
        console.log("🚀 Initialising Production Seed (UK-EN Standards)...");

        // 1. Organisations
        const organisations = [
            {
                id: "org_royal_estate",
                name: "Royal Estate Agents",
                businessType: "Sole Trader",
                status: "Active",
                ownerUid: "system_owner_1",
                headOfficeAddress: { addressLine1: "12 High Street", townCity: "Southend-on-Sea", postcode: "SS1 1AB" },
                registeredOfficeAddress: { addressLine1: "12 High Street", townCity: "Southend-on-Sea", postcode: "SS1 1AB" },
                mainContactTelephone: "01702 123456",
                generalContactEmail: "info@royalestate.co.uk",
                isVatRegistered: true,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            },
            {
                id: "org_prime_living",
                name: "Prime Living Properties",
                businessType: "Limited Company",
                status: "Active",
                ownerUid: "system_owner_2",
                headOfficeAddress: { addressLine1: "Prime House, Station Road", townCity: "Leigh-on-Sea", postcode: "SS9 1AA" },
                registeredOfficeAddress: { addressLine1: "Prime House, Station Road", townCity: "Leigh-on-Sea", postcode: "SS9 1AA" },
                mainContactTelephone: "01702 654321",
                generalContactEmail: "hello@primeliving.co.uk",
                isVatRegistered: true,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            }
        ];

        for (const org of organisations) {
            console.log(`Working on Org: ${org.id}`);
            await db.collection("organisations").doc(org.id).set(org, { merge: true });
            console.log(`✅ Organisation: ${org.name}`);
        }

        // 2. Users (Public Profiles)
        const users = [
            {
                uid: "system_owner_1",
                email: "owner@royalestate.co.uk",
                displayName: "Arthur Royal",
                firstName: "Arthur",
                surname: "Royal",
                role: "Agency Owner",
                status: "Active",
                organisationId: "org_royal_estate",
                branchIds: ["branch_royal_main"],
                termsAccepted: true,
                deletionRequested: false,
                createdAt: FieldValue.serverTimestamp()
            },
            {
                uid: "system_owner_2",
                email: "sarah@primeliving.co.uk",
                displayName: "Sarah Prime",
                firstName: "Sarah",
                surname: "Prime",
                role: "Agency Owner",
                status: "Active",
                organisationId: "org_prime_living",
                branchIds: ["branch_prime_main"],
                termsAccepted: true,
                deletionRequested: false,
                createdAt: FieldValue.serverTimestamp()
            },
            {
                uid: "system_solicitor_1",
                email: "legal@brightonlaw.co.uk",
                displayName: "Edward Brighton",
                firstName: "Edward",
                surname: "Brighton",
                role: "Solicitor",
                status: "Active",
                solicitorFirmId: "firm_brighton_law",
                branchIds: [],
                termsAccepted: true,
                deletionRequested: false,
                createdAt: FieldValue.serverTimestamp()
            }
        ];

        for (const user of users) {
            console.log(`Working on User: ${user.uid}`);
            await db.collection("publicUsers").doc(user.uid).set(user, { merge: true });
            console.log(`✅ User: ${user.displayName}`);
        }

        // 3. Properties
        const properties = [
            {
                id: "prop_101_high",
                status: "Published",
                headline: "Stunning 4 Bedroom Victorian Villa",
                propertyType: "House",
                tenure: "Freehold",
                tenancyStatus: "Vacant",
                guidePrice: 450000,
                reservePrice: 425000,
                address: { addressLine1: "101 High Street", townCity: "Leigh-on-Sea", postcode: "SS9 1BT" },
                organisationId: "org_royal_estate",
                submittedBy: "system_owner_1",
                auctionType: "Livestream Auction",
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            },
            {
                id: "prop_beach_flat",
                status: "Available",
                headline: "Modern Beachfront Apartment with Balcony",
                propertyType: "Flat/Apartment",
                tenure: "Leasehold",
                tenancyStatus: "Tenanted",
                guidePriceType: "range",
                guidePriceFrom: 200000,
                guidePriceTo: 220000,
                reservePrice: 195000,
                address: { addressLine1: "Flat 4, Sea Breeze", townCity: "Southend-on-Sea", postcode: "SS1 2LL" },
                organisationId: "org_prime_living",
                submittedBy: "system_owner_2",
                auctionType: "Modern Method of Auction",
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            }
        ];

        for (const prop of properties) {
            console.log(`Working on Prop: ${prop.id}`);
            await db.collection("properties").doc(prop.id).set(prop, { merge: true });
            console.log(`✅ Property: ${prop.headline}`);
        }

        console.log("✨ Seeding Complete. Portal Populated.");

    } catch (e: any) {
        console.error("❌ Seeding Failed:", e.message);
        console.error(e.stack);
    }
}

seedPortalData();
