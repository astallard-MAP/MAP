
"use client";

import { useState } from "react";
import { useFirestore } from "../../../../firebase";
import { doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Loader2, Database, CheckCircle2, AlertTriangle } from "lucide-react";

export default function SeedingPage() {
    const firestore = useFirestore();
    const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
    const [log, setLog] = useState<string[]>([]);

    const addLog = (msg: string) => setLog(prev => [...prev, msg]);

    const runSeed = async () => {
        if (!firestore) return;
        setStatus("running");
        setLog(["🚀 Initialising Client-Side Forensic Seed..."]);

        try {
            // 1. Organisations
            addLog("🏗 Seeding Organisations...");
            const orgs = [
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
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
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
                    createdAt: serverTimestamp()
                }
            ];

            for (const org of orgs) {
                await setDoc(doc(firestore, "organisations", org.id), org);
                addLog(`✅ Organisation: ${org.name}`);
            }

            // 2. Users
            addLog("👥 Seeding User Registry...");
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
                    createdAt: serverTimestamp()
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
                    createdAt: serverTimestamp()
                }
            ];

            for (const user of users) {
                await setDoc(doc(firestore, "users", user.uid), user);
                addLog(`✅ User: ${user.displayName}`);
            }

            // 3. Properties
            addLog("🏠 Seeding Property Inventory...");
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
                    createdAt: serverTimestamp()
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
                    createdAt: serverTimestamp()
                }
            ];

            for (const prop of properties) {
                await setDoc(doc(firestore, "properties", prop.id), prop);
                addLog(`✅ Property: ${prop.headline}`);
            }

            addLog("✨ Seeding Complete. Portal Populated.");
            setStatus("success");
        } catch (e: any) {
            console.error(e);
            addLog(`❌ Error: ${e.message}`);
            setStatus("error");
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-6">
            <Card className="border-l-4 border-l-brand-primary shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Database className="h-6 w-6 text-brand-primary" />
                        Portal Population Utility
                    </CardTitle>
                    <CardDescription>
                        Seed the production environment with forensic test data (Organisations, Users, Properties).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-brand-secondary h-64 overflow-y-auto space-y-1 shadow-inner">
                        {log.map((line, i) => (
                            <div key={i}>{line}</div>
                        ))}
                        {status === 'idle' && <div className="text-slate-500 animate-pulse">Waiting for execution...</div>}
                    </div>

                    <Button 
                        onClick={runSeed} 
                        disabled={status === 'running' || status === 'success'}
                        className="w-full h-12 font-black shadow-xl transition-all active:scale-95"
                    >
                        {status === 'running' ? <Loader2 className="animate-spin mr-2" /> : <Database className="mr-2 h-4 w-4" />}
                        {status === 'success' ? "POPULATION COMPLETE" : "INITIALISE PRODUCTION SEED"}
                    </Button>

                    {status === 'error' && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-xs font-bold">
                            <AlertTriangle className="h-4 w-4" />
                            Permission Denied: Ensure you are logged in as a Global Admin.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
