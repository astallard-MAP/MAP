"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFirestore } from "../firebase";
import { writeBatch, doc, serverTimestamp, collection, Timestamp } from "firebase/firestore";
import { useToast } from "../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { TitleEnum } from "../lib/schemas";
import { Organisation, UserProfile, StaffInvitation } from "../lib/types";
import { v4 as uuidv4 } from "uuid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Loader2 } from "lucide-react";

const InviteOwnerSchema = z.object({
  title: TitleEnum,
  firstName: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  email: z.string().email("Invalid email address"),
});
type InviteOwnerForm = z.infer<typeof InviteOwnerSchema>;

type InviteAgencyOwnerDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  organisation: Organisation;
  currentUserProfile: UserProfile;
};

export function InviteAgencyOwnerDialog({
  isOpen,
  onOpenChange,
  organisation,
  currentUserProfile,
}: InviteAgencyOwnerDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<InviteOwnerForm>({
    resolver: zodResolver(InviteOwnerSchema),
    defaultValues: {
      title: "Mr",
      firstName: "",
      surname: "",
      email: organisation.generalContactEmail || "",
    },
  });
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setIsLoading(false);
    }
    onOpenChange(open);
  };

  useEffect(() => {
    if (organisation && isOpen) {
      form.reset({
        title: "Mr",
        firstName: "",
        surname: "",
        email: organisation.generalContactEmail || "",
      });
    }
  }, [organisation, isOpen, form]);

  const handleSubmit = async (values: InviteOwnerForm) => {
    if (!firestore || !currentUserProfile) return;
    setIsLoading(true);

    try {
        const invitationToken = uuidv4();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        const batch = writeBatch(firestore);

        const invitationRef = doc(collection(firestore, 'invitations'));
        const invitationData: Omit<StaffInvitation, 'id'> = {
            organisationId: organisation.id,
            organisationName: organisation.name,
            email: values.email.toLowerCase(),
            firstName: values.firstName,
            surname: values.surname,
            intendedRole: 'Agency Owner',
            token: invitationToken,
            createdAt: serverTimestamp() as Timestamp,
            expiresAt: Timestamp.fromDate(expiryDate),
            status: 'Pending',
        };
        batch.set(invitationRef, invitationData);

        const orgRef = doc(firestore, 'organisations', organisation.id);
        batch.update(orgRef, { status: 'Invited' });
        
        await batch.commit();

        const generatedLink = `${window.location.origin}/signup?token=${invitationToken}`;

        const emailResponse = await fetch('/api/send-invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: values.email,
                name: `${values.firstName} ${values.surname}`,
                organisationName: organisation.name,
                role: "Agency Owner",
                inviteLink: generatedLink,
            })
        });

        if (!emailResponse.ok) {
            throw new Error("Failed to reach Office 365 relay.");
        }


        toast({
            title: 'Invitation Transmitted',
            description: `A production signup link has been sent to ${values.email}.`,
        });

        handleOpenChange(false);

    } catch (error: any) {
        console.error("Invite failure:", error);
        toast({
            variant: 'destructive',
            title: 'Audit Error',
            description: error.message || "Could not dispatch invitation."
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Owner for {organisation.name}</DialogTitle>
          <DialogDescription>
            Production Desk: Create the primary 'Agency Owner' account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Title</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select title"/>
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              {TitleEnum.options.map((title) => (<SelectItem key={title} value={title}>{title}</SelectItem>))}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="surname" render={({ field }) => (
                  <FormItem><FormLabel>Surname</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              </div>
              <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input placeholder="owner@example.com" type="email" {...field} /></FormControl><FormMessage />
              </FormItem>
              )} />
              <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="animate-spin h-4 w-4" />}
                {isLoading ? "Transmitting..." : "Send Invitation"}
              </Button>
              </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
