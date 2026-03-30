"use client";

import { useEffect, useState, useMemo, Fragment } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../../../../components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { TooltipProvider } from "../../../../components/ui/tooltip";
import { Input } from "../../../../components/ui/input";
import { Button } from "../../../../components/ui/button";
import { Trash2, UserPlus, Building, Upload, Pencil, ArchiveRestore, UserRoundCog, Users, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../../components/ui/alert-dialog";
import { useToast } from "../../../../hooks/use-toast";
import { useUser, useFirestore, useDoc, useCollection, uploadFile, useMemoFirebase } from "../../../../firebase";
import type { Branch, Organisation, PublicUserProfile, Address } from "../../../../lib/types";
import { EditUserDialog } from "../../../../components/EditUserDialog";
import { InviteUserDialog } from "../../../../components/InviteUserDialog";
import { usePermissions } from "../../../../context/PermissionContext";
import { AddressFields } from "../../../../components/AddressFields";
import { OrganisationSchema } from "../../../../lib/schemas";
import { doc, updateDoc, writeBatch, serverTimestamp, collection } from "firebase/firestore";
import { AddBranchDialog } from "../../../../components/AddBranchDialog";
import { EditBranchDialog } from "../../../../components/EditBranchDialog";
import { Badge } from "../../../../components/ui/badge";
import { Progress } from "../../../../components/ui/progress";
import { Checkbox } from "../../../../components/ui/checkbox";
import { disableUser } from "../../../../app/actions/server-actions";
import { TAD_DETAILS } from "../../../../lib/constants";
import { z } from "zod";

type OrganisationProfileFormValues = z.infer<typeof OrganisationSchema>;

const emptyAddress: Address = {
  houseNameOrNumber: "",
  addressLine1: "",
  addressLine2: "",
  townCity: "",
  county: "",
  postcode: "",
};

/**
 * @fileOverview Production Organisation Management Desk.
 * UK-EN: Pre-populated with TAD HQ details for Admin personnel.
 * Forensic: character-accurately updated with null-safe guards for production compilation.
 */
export default function OrganisationPage() {
  const { userProfile, isLoading: isUserLoading } = useUser();
  const { isTadStaff, isAgencyOwner, isManager, isPermissionsLoaded } = usePermissions();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const orgIdFromUrl = searchParams.get('orgId');
  const organisationId = (isTadStaff && orgIdFromUrl) ? orgIdFromUrl : userProfile?.organisationId;
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || "profile");

  const orgDocRef = useMemoFirebase(() => {
    if (!firestore || !organisationId) return null;
    return doc(firestore, 'organisations', organisationId);
  }, [firestore, organisationId]);

  const { data: organisation, isLoading: isOrgLoading } = useDoc<Organisation>(orgDocRef);

  const publicUsersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'publicUsers');
  }, [firestore]);

  const { data: allPublicUsers, isLoading: activeLoading } = useCollection<PublicUserProfile>(publicUsersQuery);

  const branchesQuery = useMemoFirebase(() => {
    if (!firestore || !organisationId) return null;
    return collection(firestore, 'organisations', organisationId, 'branches');
  }, [firestore, organisationId]);

  const { data: branches, isLoading: isBranchesLoading } = useCollection<Branch>(branchesQuery);

  const [editingUser, setEditingUser] = useState<PublicUserProfile | null>(null);
  const [invitingUser, setInvitingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState<PublicUserProfile | null>(null);
  const [addingBranch, setAddingBranch] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [logoUploadProgress, setLogoUploadProgress] = useState<number | null>(null);
  const [useRegisteredAddress, setUseRegisteredAddress] = useState(true);

  const isTadHq = organisationId === 'tad_hq';

  const form = useForm<OrganisationProfileFormValues>({
    resolver: zodResolver(OrganisationSchema),
    mode: "onBlur",
    defaultValues: isTadHq ? {
      name: TAD_DETAILS.name,
      businessType: "Private Limited Company",
      headOfficeAddress: TAD_DETAILS.headOfficeAddress,
      registeredOfficeAddress: TAD_DETAILS.registeredAddress,
      mainContactTelephone: TAD_DETAILS.phone,
      generalContactEmail: TAD_DETAILS.email,
      logoUrl: "",
      brandColours: [TAD_DETAILS.brand.primary, TAD_DETAILS.brand.secondary],
    } : {
      name: "",
      businessType: "Private Limited Company",
      headOfficeAddress: emptyAddress,
      registeredOfficeAddress: emptyAddress,
      mainContactTelephone: "",
      generalContactEmail: "",
      logoUrl: "",
      brandColours: [],
    }
  });

  useEffect(() => {
    if (organisation) {
      form.reset({
        name: organisation.name || "",
        businessType: (organisation.businessType as any) || "Private Limited Company",
        headOfficeAddress: organisation.headOfficeAddress || emptyAddress,
        registeredOfficeAddress: organisation.registeredOfficeAddress || emptyAddress,
        mainContactTelephone: organisation.mainContactTelephone || "",
        generalContactEmail: organisation.generalContactEmail || "",
        logoUrl: organisation.logoUrl || "",
        brandColours: organisation.brandColours || [],
        website: organisation.website || "",
        companyRegistrationNumber: organisation.companyRegistrationNumber || "",
        tpoRegistrationNumber: organisation.tpoRegistrationNumber || "",
        isVatRegistered: !!organisation.isVatRegistered,
        vatRegistrationNumber: organisation.vatRegistrationNumber || "",
      });

      if (organisation.registeredOfficeAddress && organisation.headOfficeAddress) {
        const ho = organisation.headOfficeAddress;
        const ro = organisation.registeredOfficeAddress;
        const isSame = ho?.postcode === ro?.postcode && ho?.addressLine1 === ro?.addressLine1;
        setUseRegisteredAddress(isSame);
      }
    }
  }, [organisation, form]);

  const activeMembers = useMemo(() => {
    if (!allPublicUsers || !organisationId) return [];
    return allPublicUsers.filter(u => u.organisationId === organisationId && ['Active', 'Pending', 'Invited'].includes(u.status));
  }, [allPublicUsers, organisationId]);

  const archivedMembers = useMemo(() => {
    if (!allPublicUsers || !organisationId) return [];
    return allPublicUsers.filter(u => u.organisationId === organisationId && ['Archived', 'Inactive'].includes(u.status));
  }, [allPublicUsers, organisationId]);

  const allBranches = useMemo(() => {
    const activeBranches = (branches || []).filter(b => b.status === 'active');
    if (organisation) {
      const ho: Branch = {
        id: 'head-office',
        name: "Head Office",
        address: organisation.headOfficeAddress,
        contactTelephone: organisation.mainContactTelephone,
        emailAddress: organisation.generalContactEmail,
        status: 'active',
        deletionRequested: false,
      };
      return [ho, ...activeBranches];
    }
    return activeBranches;
  }, [branches, organisation]);

  const handleLogoUpload = async (file: File) => {
    if (!file || !organisationId) return;
    setLogoUploadProgress(0);
    try {
      const url = await uploadFile(file, `organisations/${organisationId}/logo`, setLogoUploadProgress);
      form.setValue('logoUrl', url, { shouldValidate: true, shouldDirty: true });
      toast({ title: 'Upload Successful', description: 'Logo updated.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Upload Failed' });
    } finally {
      setLogoUploadProgress(null);
    }
  };

  async function onProfileSubmit(data: OrganisationProfileFormValues) {
    if (!firestore || !organisationId || !orgDocRef) return;
    try {
      await updateDoc(orgDocRef, { ...data, updatedAt: serverTimestamp() });
      toast({ title: "Success", description: "Organisation details updated." });
      form.reset(data, { keepValues: true });
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed" });
    }
  }

  const handleDeleteRequest = async () => {
    if (!deletingUser || !firestore) return;
    try {
      const disableResult = await disableUser(deletingUser.uid);
      if (!disableResult.success) throw new Error(disableResult.error);
      const batch = writeBatch(firestore);
      batch.update(doc(firestore, 'users', deletingUser.uid), { status: 'Archived', deletionRequested: true });
      batch.update(doc(firestore, 'publicUsers', deletingUser.uid), { status: 'Archived', deletionRequested: true });
      await batch.commit();
      toast({ title: "User Deactivated" });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Error", description: error.message });
    } finally {
      setDeletingUser(null);
    }
  };

  const isLoadingState = isUserLoading || isOrgLoading || activeLoading || isBranchesLoading || !isPermissionsLoaded;
  
  if (isLoadingState) {
    return <div className="p-8 text-center flex items-center justify-center"><Loader2 className="animate-spin mr-2"/>Initialising workspace...</div>;
  }
  
  if (!organisation && !isTadHq) {
    return <p className="p-8 text-center text-destructive font-bold">Audit Failure: Critical record retrieval error.</p>;
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {editingUser && <EditUserDialog isOpen={!!editingUser} onOpenChange={() => setEditingUser(null)} userToEditId={editingUser.uid} branches={allBranches} />}
        {invitingUser && organisationId && (organisation || isTadHq) && <InviteUserDialog isOpen={invitingUser} onOpenChange={() => setInvitingUser(false)} organisationId={organisationId} branches={allBranches} />}
        {addingBranch && organisationId && <AddBranchDialog isOpen={addingBranch} onOpenChange={() => setAddingBranch(false)} organisationId={organisationId} />}
        {editingBranch && organisationId && <EditBranchDialog isOpen={!!editingBranch} onOpenChange={() => setEditingBranch(null)} organisationId={organisationId} branch={editingBranch} />}
        
        <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deactivation</AlertDialogTitle>
              <AlertDialogDescription>Permanently disable user access trail.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRequest}>Deactivate</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <header>
          <h1 className="text-3xl font-bold tracking-tight font-headline text-slate-900">Organisation</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">UK-EN: Production profile and personnel management.</p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="profile"><UserRoundCog className="mr-2 h-4 w-4"/>Profile</TabsTrigger>
            <TabsTrigger value="branches"><Building className="mr-2 h-4 w-4"/>Branches</TabsTrigger>
            <TabsTrigger value="staff"><Users className="mr-2 h-4 w-4"/>Staff</TabsTrigger>
            <TabsTrigger value="archive"><ArchiveRestore className="mr-2 h-4 w-4"/>Archive</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-6">
                <Card>
                  <CardHeader><CardTitle>Business Profile</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <FormField control={form.control} name="logoUrl" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Logo</FormLabel>
                        <div className="flex items-center gap-4">
                          {field.value && <Image src={field.value} alt="Logo" width={64} height={64} className="rounded-md border" />}
                          <div className="flex-1">
                            <Button asChild variant="outline" className="w-full">
                              <label className="cursor-pointer">
                                <Upload className="mr-2 h-4 w-4" /> Upload
                                <Input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files && handleLogoUpload(e.target.files[0])} />
                              </label>
                            </Button>
                            {logoUploadProgress !== null && <Progress value={logoUploadProgress} className="mt-2" />}
                          </div>
                        </div>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organisation Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="businessType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Sole Trader">Sole Trader</SelectItem>
                            <SelectItem value="Partnership">Partnership</SelectItem>
                            <SelectItem value="Private Limited Company">Private Limited Company</SelectItem>
                            <SelectItem value="Public Limited Company">Public Limited Company</SelectItem>
                            <SelectItem value="Community Interest Company">Community Interest Company</SelectItem>
                            <SelectItem value="Co-operative">Co-operative</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Contacts & Address</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <AddressFields control={form.control} namePrefix="headOfficeAddress" />
                    <div className="flex items-center space-x-2 pt-4">
                      <Checkbox id="same" checked={useRegisteredAddress} onCheckedChange={(c) => setUseRegisteredAddress(!!c)} />
                      <label htmlFor="same" className="text-sm font-medium">Registered address same as above</label>
                    </div>
                    {!useRegisteredAddress && <AddressFields control={form.control} namePrefix="registeredOfficeAddress" />}
                  </CardContent>
                  <CardFooter><Button type="submit">Save Production Profile</Button></CardFooter>
                </Card>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="branches">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Branch Offices</CardTitle>
                {(isTadStaff || isAgencyOwner) && <Button onClick={() => setAddingBranch(true)}><Building className="mr-2 h-4 w-4" />Add Branch</Button>}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allBranches.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell>{b.address.townCity}</TableCell>
                        <TableCell><Badge variant={b.status === 'active' ? 'default' : 'secondary'}>{b.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          {(isTadStaff || isAgencyOwner) && b.id !== 'head-office' && (
                            <Button variant="ghost" size="icon" onClick={() => setEditingBranch(b)}><Pencil className="h-4 w-4"/></Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Staff Management</CardTitle>
                {(isTadStaff || isManager) && <Button onClick={() => setInvitingUser(true)}><UserPlus className="mr-2 h-4 w-4"/>Invite Staff</Button>}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeMembers?.map(m => (
                      <TableRow key={m.uid}>
                        <TableCell className="font-medium">{m.displayName}</TableCell>
                        <TableCell>{m.role}</TableCell>
                        <TableCell><Badge>{m.status}</Badge></TableCell>
                        <TableCell className="text-right space-x-1">
                          {(isTadStaff || isManager) && userProfile && (
                            <Fragment>
                              <Button variant="ghost" size="icon" onClick={() => setEditingUser(m)}><Pencil className="h-4 w-4"/></Button>
                              {userProfile?.uid !== m.uid && <Button variant="ghost" size="icon" onClick={() => setDeletingUser(m)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}
                            </Fragment>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archive">
            <Card>
              <CardHeader><CardTitle>Archived Personnel</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {archivedMembers?.map(m => (
                      <TableRow key={m.uid}>
                        <TableCell className="font-medium">{m.displayName}</TableCell>
                        <TableCell>{m.role}</TableCell>
                        <TableCell><Badge variant="secondary">{m.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
