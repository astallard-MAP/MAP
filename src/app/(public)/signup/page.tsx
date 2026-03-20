"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Send } from "lucide-react";
import { collection, writeBatch, doc, query, where, getDocs, serverTimestamp, Timestamp } from "firebase/firestore";
import { useRouter, useSearchParams } from 'next/navigation';
import { createUserWithEmailAndPassword } from "firebase/auth";

import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../../../components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import PublicBrandLogo from "../../../components/PublicBrandLogo";
import { useToast } from "../../../hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import { TitleEnum, AddressSchema } from "../../../lib/schemas";
import { AddressFields } from "../../../components/AddressFields";
import { useFirestore, useAuth } from "../../../firebase";
import type { StaffInvitation, UserProfile, PublicUserProfile } from "../../../lib/types";
import { Skeleton } from "../../../components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";

const AccessRequestSchema = z.object({
  title: TitleEnum,
  firstName: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  companyName: z.string().min(1, "Company name is required"),
  website: z.string().url("Valid URL required").optional().or(z.literal("")),
  contactTelephone: z.string().min(1, "Telephone is required"),
  contactEmail: z.string().email("Valid email required"),
  headOfficeAddress: AddressSchema,
});

const InvitedUserSchema = z.object({
  title: TitleEnum,
  firstName: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type AccessRequestFormValues = z.infer<typeof AccessRequestSchema>;
type InvitedUserFormValues = z.infer<typeof InvitedUserSchema>;

function SignupPageContent() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [invitation, setInvitation] = useState<StaffInvitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (token && firestore) {
      const validateToken = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          const invitationsRef = collection(firestore, 'invitations');
          const q = query(invitationsRef, where("token", "==", token), where("status", "==", "Pending"));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            setError("Invitation invalid or already used.");
            setIsLoading(false);
            return;
          }

          const inviteDoc = querySnapshot.docs[0];
          const inviteData = { id: inviteDoc.id, ...inviteDoc.data() } as StaffInvitation;
          setInvitation(inviteData);
          invitedUserForm.reset({
              email: inviteData.email,
              firstName: inviteData.firstName,
              surname: inviteData.surname,
              title: "Mr",
              password: "",
          });
        } catch (e) {
          setError("Audit failure retrieving invitation.");
        } finally {
          setIsLoading(false);
        }
      };
      validateToken();
    }
  }, [token, firestore]);

  const accessRequestForm = useForm<AccessRequestFormValues>({
    resolver: zodResolver(AccessRequestSchema),
    defaultValues: {
      title: "Mr",
      firstName: "",
      surname: "",
      companyName: "",
      website: "",
      contactTelephone: "",
      contactEmail: "",
      headOfficeAddress: { houseNameOrNumber: "", addressLine1: "", addressLine2: "", townCity: "", county: "", postcode: "" },
    },
  });
  
  const invitedUserForm = useForm<InvitedUserFormValues>({
    resolver: zodResolver(InvitedUserSchema),
    defaultValues: {
      title: "Mr",
      firstName: "",
      surname: "",
      email: "",
      password: "",
    },
  });

  const handleAccessRequestSubmit = async (values: AccessRequestFormValues) => {
    if (!firestore) return;
    setIsLoading(true);
    try {
        const batch = writeBatch(firestore);
        const requestRef = doc(collection(firestore, 'accessRequests'));
        batch.set(requestRef, { ...values, status: 'pending', createdAt: serverTimestamp() });
        await batch.commit();
        setIsSubmitted(true);
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Submission failed." });
    } finally {
        setIsLoading(false);
    }
  };

  const handleInvitedUserSubmit = async (values: InvitedUserFormValues) => {
    if (!firestore || !auth || !invitation) return;
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      const batch = writeBatch(firestore);
      
      const userRef = doc(firestore, 'users', user.uid);
      const profile: Omit<UserProfile, 'id'> = {
          uid: user.uid,
          email: values.email.toLowerCase(),
          displayName: `${values.firstName} ${values.surname}`,
          title: values.title,
          firstName: values.firstName,
          surname: values.surname,
          role: invitation.intendedRole,
          status: 'Active',
          organisationId: invitation.organisationId || '',
          branchIds: ['head-office'],
          deletionRequested: false,
          termsAccepted: false,
      };
      batch.set(userRef, { ...profile, createdAt: serverTimestamp() as Timestamp, updatedAt: serverTimestamp() as Timestamp });

      const publicUserRef = doc(firestore, 'publicUsers', user.uid);
      const publicProfile: PublicUserProfile = {
          uid: user.uid,
          displayName: `${values.firstName} ${values.surname}`,
          firstName: values.firstName,
          surname: values.surname,
          email: values.email.toLowerCase(),
          role: invitation.intendedRole,
          organisationId: invitation.organisationId || '',
          branchIds: ['head-office'],
          status: 'Active',
          photoURL: '',
          deletionRequested: false,
      };
      batch.set(publicUserRef, { ...publicProfile, createdAt: serverTimestamp() as Timestamp, updatedAt: serverTimestamp() as Timestamp });
      
      const inviteRef = doc(firestore, 'invitations', invitation.id);
      batch.update(inviteRef, { status: 'Accepted', acceptedAt: serverTimestamp() });

      if (invitation.intendedRole === 'Agency Owner' && invitation.organisationId) {
        const orgRef = doc(firestore, 'organisations', invitation.organisationId);
        batch.update(orgRef, { ownerUid: user.uid, status: 'Active' });
      }

      await batch.commit();
      toast({ title: "Welcome", description: "Account created." });
      router.push('/login');
    } catch (e: any) {
        setError(e.message || "Failed to create account.");
    } finally {
        setIsLoading(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-[100dvh] bg-slate-50" />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full p-4 py-12 overflow-y-auto bg-slate-50">
      <Card className="w-full max-w-2xl shadow-xl border-t-4 border-primary bg-white my-8">
        <CardHeader className="items-center text-center">
          <PublicBrandLogo className="mb-4" />
          <CardTitle className="text-2xl font-headline text-slate-900">{token ? 'Accept Invitation' : 'Request Portal Access'}</CardTitle>
        </CardHeader>
        <CardContent>
            {error && <Alert variant="destructive" className="mb-6"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            {isLoading ? <Skeleton className="h-40 w-full" /> : (
                token ? (
                    <Form {...invitedUserForm}>
                        <form onSubmit={invitedUserForm.handleSubmit(handleInvitedUserSubmit)} className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField control={invitedUserForm.control} name="title" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Title</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>{TitleEnum.options.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </FormItem>
                                )}/>
                                <FormField control={invitedUserForm.control} name="firstName" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] uppercase font-bold text-slate-500">First Name</FormLabel><FormControl><Input {...field} className="h-10 text-xs" /></FormControl></FormItem>
                                )}/>
                                 <FormField control={invitedUserForm.control} name="surname" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] uppercase font-bold text-slate-500">Surname</FormLabel><FormControl><Input {...field} className="h-10 text-xs" /></FormControl></FormItem>
                                )}/>
                            </div>
                            <FormField control={invitedUserForm.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] uppercase font-bold text-slate-500">Work Email</FormLabel><FormControl><Input type="email" {...field} disabled className="h-10 text-xs" /></FormControl></FormItem>
                            )}/>
                            <FormField control={invitedUserForm.control} name="password" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] uppercase font-bold text-slate-500">Password</FormLabel><FormControl><Input type="password" {...field} className="h-10 text-xs" /></FormControl></FormItem>
                            )}/>
                            <Button type="submit" className="w-full h-10 font-bold" disabled={isLoading}>Create Account</Button>
                        </form>
                    </Form>
                ) : (
                    isSubmitted ? <Alert><AlertTitle>Success</AlertTitle><AlertDescription>Request sent for review. We will contact you shortly.</AlertDescription></Alert> : (
                        <Form {...accessRequestForm}>
                            <form onSubmit={accessRequestForm.handleSubmit(handleAccessRequestSubmit)} className="space-y-6 pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField control={accessRequestForm.control} name="title" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[10px] uppercase font-bold text-slate-500">Title</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>{TitleEnum.options.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}/>
                                    <FormField control={accessRequestForm.control} name="firstName" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[10px] uppercase font-bold text-slate-500">First Name</FormLabel><FormControl><Input {...field} className="h-10 text-xs" /></FormControl></FormItem>
                                    )}/>
                                    <FormField control={accessRequestForm.control} name="surname" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[10px] uppercase font-bold text-slate-500">Surname</FormLabel><FormControl><Input {...field} className="h-10 text-xs" /></FormControl></FormItem>
                                    )}/>
                                </div>
                                <FormField control={accessRequestForm.control} name="companyName" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] uppercase font-bold text-slate-500">Company Name</FormLabel><FormControl><Input {...field} className="h-10 text-xs" /></FormControl></FormItem>
                                )}/>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={accessRequestForm.control} name="contactTelephone" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[10px] uppercase font-bold text-slate-500">Telephone</FormLabel><FormControl><Input type="tel" {...field} className="h-10 text-xs" /></FormControl></FormItem>
                                    )}/>
                                    <FormField control={accessRequestForm.control} name="contactEmail" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[10px] uppercase font-bold text-slate-500">Email</FormLabel><FormControl><Input type="email" {...field} className="h-10 text-xs" /></FormControl></FormItem>
                                    )}/>
                                </div>
                                <div className="border-t pt-6">
                                    <FormLabel className="text-xs font-bold uppercase mb-4 block">Head Office Address</FormLabel>
                                    <AddressFields control={accessRequestForm.control} namePrefix="headOfficeAddress" />
                                </div>
                                <Button type="submit" className="w-full h-10 font-bold" disabled={isLoading}>Submit Request <Send className="ml-2 h-4 w-4" /></Button>
                            </form>
                        </Form>
                    )
                )
            )}
        </CardContent>
        <CardFooter className="justify-center border-t py-6">
            <Link href="/login" className="inline-flex items-center text-sm text-primary hover:underline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center min-h-[100dvh] flex items-center justify-center bg-slate-50">Initialising Registry Gateway...</div>}>
      <SignupPageContent />
    </Suspense>
  )
}