"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useCollection, useFirestore, useMemoFirebase } from "../../../../firebase";
import { type AccessRequest, type Organisation } from "../../../../lib/types";
import { Card } from "../../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { Button } from "../../../../components/ui/button";
import { ArrowLeft, CheckCircle, XCircle, Send } from "lucide-react";
import { format } from "date-fns";
import { enGB } from 'date-fns/locale';
import { doc, writeBatch, serverTimestamp, collection, updateDoc } from "firebase/firestore";
import { useToast } from "../../../../hooks/use-toast";
import { InviteAgencyOwnerDialog } from "../../../../components/InviteAgencyOwnerDialog";

export default function AccessRequestsPage() {
    const { userProfile, isLoading: userLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [orgToInvite, setOrgToInvite] = useState<Organisation | null>(null);
    const [activeTab, setActiveTab] = useState("pending");
    
    const isAdmin = userProfile?.role === 'Global Admin' || userProfile?.role === 'TAD Admin';

    const accessRequestsQuery = useMemoFirebase(() => {
        if (!userProfile || !isAdmin || !firestore) return null;
        return collection(firestore, 'accessRequests');
    }, [userProfile, isAdmin, firestore]);

    const { data: accessRequests, isLoading: requestsLoading } = useCollection<AccessRequest>(accessRequestsQuery);

    const filteredRequests = useMemo(() => {
        if (!accessRequests) return { pending: [], approved: [], rejected: [] };
        return {
            pending: accessRequests.filter(req => req.status === 'pending'),
            approved: accessRequests.filter(req => req.status === 'approved'),
            rejected: accessRequests.filter(req => req.status === 'rejected'),
        };
    }, [accessRequests]);

    const handleApprove = async (request: AccessRequest) => {
        if (!firestore || !userProfile) return;

        const batch = writeBatch(firestore);
        const newOrgRef = doc(collection(firestore, 'organisations'));
        const newOrgData: Omit<Organisation, 'id'> = {
            name: request.companyName,
            status: "Pending",
            businessType: 'Private Limited Company',
            ownerUid: '',
            headOfficeAddress: request.headOfficeAddress,
            registeredOfficeAddress: request.headOfficeAddress,
            mainContactTelephone: request.contactTelephone,
            generalContactEmail: request.contactEmail,
            website: request.website || '',
            isVatRegistered: false,
            logoUrl: "",
        };
        batch.set(newOrgRef, {
            ...newOrgData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        const requestRef = doc(firestore, 'accessRequests', request.id);
        batch.update(requestRef, { status: 'approved' });

        try {
            await batch.commit();
            const createdOrg: Organisation = { id: newOrgRef.id, ...newOrgData } as Organisation;
            toast({
                title: "Request Approved",
                description: `${request.companyName} created. Please now invite the Agency Owner.`,
            });
            setOrgToInvite(createdOrg);
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Could not approve the request." });
        }
    };
    
    const handleReject = async (requestId: string) => {
        if (!firestore) return;
        const requestRef = doc(firestore, 'accessRequests', requestId);
        try {
            await updateDoc(requestRef, { status: 'rejected' });
            toast({ title: "Request Rejected" });
        } catch (error) {
             toast({ variant: 'destructive', title: "Error", description: "Could not reject the request." });
        }
    };

    const renderTable = (requests: AccessRequest[]) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Contact Email</TableHead>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {requests.length > 0 ? (
                    requests.map(request => (
                        <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.companyName}</TableCell>
                            <TableCell>{request.firstName} {request.surname}</TableCell>
                            <TableCell>{request.contactEmail}</TableCell>
                            <TableCell>
                                {request.createdAt ? format(request.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: enGB }) : '-'}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                               {request.status === 'pending' && (
                                   <>
                                        <Button variant="ghost" size="icon" onClick={() => handleApprove(request)}>
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleReject(request.id)}>
                                            <XCircle className="h-5 w-5 text-red-600" />
                                        </Button>
                                   </>
                               )}
                               {request.status === 'approved' && (
                                   <Button variant="outline" size="sm" onClick={() => setOrgToInvite({ id: '', name: request.companyName, generalContactEmail: request.contactEmail } as any)}>
                                       <Send className="mr-2 h-4 w-4"/> Re-send Invite
                                   </Button>
                               )}
                               {request.status === 'rejected' && (
                                   <span className="text-sm text-destructive">Rejected</span>
                               )}
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            No requests found.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    if (userLoading || requestsLoading) {
        return <div className="p-8 text-center">Loading audit desk...</div>;
    }

    if (!isAdmin) {
        router.push('/dashboard');
        return null;
    }
    
    return (
        <>
            {orgToInvite && userProfile && (
                <InviteAgencyOwnerDialog 
                    isOpen={!!orgToInvite}
                    onOpenChange={() => setOrgToInvite(null)}
                    organisation={orgToInvite}
                    currentUserProfile={userProfile}
                />
            )}
            <div className="flex flex-col gap-6">
                <header className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight font-headline text-slate-900">Access Requests</h1>
                        <p className="text-muted-foreground">UK-EN: Review organisations joining My Auction Portal.</p>
                    </div>
                </header>
                <Card>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="px-6 pt-6">
                            <TabsTrigger value="pending">Pending</TabsTrigger>
                            <TabsTrigger value="approved">Approved</TabsTrigger>
                            <TabsTrigger value="rejected">Rejected</TabsTrigger>
                        </TabsList>
                        <TabsContent value="pending" className="mt-4">{renderTable(filteredRequests.pending)}</TabsContent>
                        <TabsContent value="approved" className="mt-4">{renderTable(filteredRequests.approved)}</TabsContent>
                        <TabsContent value="rejected" className="mt-4">{renderTable(filteredRequests.rejected)}</TabsContent>
                    </Tabs>
                </Card>
            </div>
        </>
    );
}