"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useFirestore, useDoc, useMemoFirebase } from "../firebase";
import { doc, serverTimestamp, collection, query, where, getDocs, Timestamp, setDoc } from "firebase/firestore";
import { useToast } from "../hooks/use-toast";
import { TitleEnum, createUserManagementSchema, UserRoleEnum } from "../lib/schemas";
import type { Organisation, UserRole, StaffInvitation } from "../lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { MultiSelectCombobox } from "../components/ui/MultiSelectCombobox";
import { usePermissions } from "../context/PermissionContext";
import type { Branch } from "../lib/types";
import { v4 as uuidv4 } from 'uuid';
import { Loader2 } from "lucide-react";

type InviteUserDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  organisationId: string;
  branches: Branch[];
};

export function InviteUserDialog({
  isOpen,
  onOpenChange,
  organisationId,
  branches,
}: InviteUserDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { canManageRole, currentUserProfile, isRegionalManager, isBranchManager, isGlobalAdmin } = usePermissions();

  const orgDocRef = useMemoFirebase(() => {
    if (!firestore || !organisationId) return null;
    return doc(firestore, 'organisations', organisationId);
  }, [firestore, organisationId]);

  const { data: organisation } = useDoc<Organisation>(orgDocRef);

  const manageableRoles = useMemo(() => {
    const allRoles: UserRole[] = UserRoleEnum.options;
    if (isGlobalAdmin) return allRoles;
    return allRoles.filter(role => canManageRole(role));
  }, [canManageRole, isGlobalAdmin]);

  const UserInvitationSchema = useMemo(() => {
    return createUserManagementSchema(manageableRoles).extend({
        email: z.string().email("Invalid email address"),
    });
  }, [manageableRoles]);
  type InviteFormValues = z.infer<typeof UserInvitationSchema>;

  const branchOptions = useMemo(() => {
    const allBranches = branches || [];
    if ((isRegionalManager || isBranchManager) && currentUserProfile?.branchIds) {
      return allBranches
        .filter(branch => currentUserProfile.branchIds.includes(branch.id))
        .map(branch => ({
            value: branch.id,
            label: branch.name,
        }));
    }
    return allBranches.map(branch => ({
      value: branch.id,
      label: branch.name
    }));
  }, [branches, currentUserProfile, isRegionalManager, isBranchManager]);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(UserInvitationSchema),
    defaultValues: {
        title: "Mr",
        firstName: "",
        surname: "",
        email: "",
        role: "Sales Negotiator",
        status: "Pending",
        branchIds: ["head-office"],
    }
  });

  useEffect(() => {
    if (isOpen && currentUserProfile) {
        const defaultRole = (manageableRoles.includes("Sales Negotiator") ? "Sales Negotiator" : manageableRoles[0]) as UserRole;
        
        let defaultBranches = ['head-office'];
        if (isBranchManager && currentUserProfile.branchIds) {
            defaultBranches = currentUserProfile.branchIds;
        }

        form.reset({
            title: 'Mr',
            firstName: "",
            surname: "",
            email: "",
            role: defaultRole,
            status: "Pending",
            branchIds: defaultBranches,
        });
    }
  }, [isOpen, manageableRoles, form, currentUserProfile, branches, isBranchManager]);

  const resetDialog = () => {
    form.reset();
    setIsLoading(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };

  const handleSubmit = async (values: InviteFormValues) => {
    if (!firestore || !currentUserProfile || !organisation) return;
    setIsLoading(true);

    try {
        const publicUsersRef = collection(firestore, 'publicUsers');
        const q = query(publicUsersRef, where("email", "==", values.email.toLowerCase()));
        const existingUserSnapshot = await getDocs(q);
        if (!existingUserSnapshot.empty) {
            toast({
                variant: 'destructive',
                title: 'Duplicate User',
                description: 'A production account already exists for this email.',
            });
            setIsLoading(false);
            return;
        }
        
        const invitationToken = uuidv4();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        const invitationRef = doc(collection(firestore, 'invitations'));
        const invitationData: Omit<StaffInvitation, 'id'> = {
            organisationId,
            organisationName: organisation.name,
            email: values.email.toLowerCase(),
            firstName: values.firstName,
            surname: values.surname,
            intendedRole: values.role as UserRole,
            token: invitationToken,
            createdAt: serverTimestamp() as Timestamp,
            expiresAt: Timestamp.fromDate(expiryDate),
            status: 'Pending',
        };
        await setDoc(invitationRef, invitationData);

        const generatedLink = `${window.location.origin}/signup?token=${invitationToken}`;
        
        const emailResponse = await fetch('/api/send-invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: values.email,
                name: `${values.firstName} ${values.surname}`,
                organisationName: organisation.name,
                role: values.role,
                inviteLink: generatedLink,
            })
        });

        if (!emailResponse.ok) {
            throw new Error("Office 365 Relay connection error.");
        }


        toast({
            title: "Invitation Dispatched",
            description: `Signup link transmitted to ${values.email}.`,
        });
        handleOpenChange(false);

    } catch (error: any) {
        console.error("Invite failure:", error);
        toast({ variant: 'destructive', title: "Audit Error", description: error.message || "Invitation dispatch failed." });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
          <DialogDescription>
            Production Relay: An automated email will be dispatched via Frank Tadsworth-Bids.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Title</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {TitleEnum.options.map((title) => (
                        <SelectItem key={title} value={title}>{title}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                        <Input placeholder="Jane" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="surname"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Surname</FormLabel>
                    <FormControl>
                        <Input placeholder="Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            </div>

            <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                    <Input placeholder="user@example.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {manageableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                        {role}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
                control={form.control}
                name="branchIds"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Branch Access</FormLabel>
                        <MultiSelectCombobox
                            options={branchOptions}
                            selected={field.value || []}
                            onChange={field.onChange}
                            className="w-full"
                            placeholder="Select branches..."
                        />
                        <FormMessage />
                    </FormItem>
                )}
            />

            <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                {isLoading ? "Transmitting..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
