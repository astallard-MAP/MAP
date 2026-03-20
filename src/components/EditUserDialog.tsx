"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, writeBatch, getDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TitleEnum, createUserManagementSchema, UserRoleEnum } from "@/lib/schemas";
import type { UserProfile, Branch, UserRole, UserStatus } from "@/lib/types";
import { usePermissions } from "@/context/PermissionContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelectCombobox } from "@/components/ui/MultiSelectCombobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddressFields } from "@/components/AddressFields";
import { ScrollArea } from "@/components/ui/scroll-area";

type EditUserDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userToEditId: string;
  branches: Branch[];
};

const userStatuses: UserStatus[] = ['Pending', 'Invited', 'Active', 'Inactive', 'Archived'];

export function EditUserDialog({
  isOpen,
  onOpenChange,
  userToEditId,
  branches,
}: EditUserDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { currentUserProfile, canManageRole, isAdmin, isRegionalManager, isBranchManager, isGlobalAdmin } = usePermissions();
  
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);

  const manageableRoles = useMemo(() => {
    const allRoles: UserRole[] = UserRoleEnum.options;
    if (isGlobalAdmin) return allRoles;
    return allRoles.filter(role => canManageRole(role));
  }, [canManageRole, isGlobalAdmin]);

  const UserManagementSchema = useMemo(() => createUserManagementSchema(manageableRoles), [manageableRoles]);
  type EditUserFormValues = z.infer<typeof UserManagementSchema>;

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(UserManagementSchema),
    defaultValues: {
        title: "Mr",
        firstName: "",
        surname: "",
        role: (manageableRoles[0] || 'Sales Negotiator') as any,
        status: "Active",
        branchIds: ["head-office"],
        telephone: "",
        mobile: "",
        workEmail: "",
        homeEmail: "",
        address: { houseNameOrNumber: "", addressLine1: "", addressLine2: "", townCity: "", county: "", postcode: "" },
    }
  });

  useEffect(() => {
    if (userToEditId && isOpen && firestore) {
      const fetchUser = async () => {
        const userRef = doc(firestore, 'users', userToEditId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const fetchedUser = userSnap.data() as UserProfile;
          setUserToEdit(fetchedUser);
          form.reset({
              title: (fetchedUser.title || "Mr") as any,
              firstName: fetchedUser.firstName || "",
              surname: fetchedUser.surname || "",
              role: (fetchedUser.role || manageableRoles[0]) as any,
              status: fetchedUser.status || "Active",
              branchIds: fetchedUser.branchIds?.length > 0 ? fetchedUser.branchIds : ['head-office'],
              telephone: fetchedUser.telephone || "",
              mobile: fetchedUser.mobile || "",
              workEmail: fetchedUser.workEmail || fetchedUser.email || "",
              homeEmail: fetchedUser.homeEmail || "",
              address: fetchedUser.address || { houseNameOrNumber: "", addressLine1: "", addressLine2: "", townCity: "", county: "", postcode: "" },
          });
        }
      };
      fetchUser();
    }
  }, [userToEditId, isOpen, firestore, form, manageableRoles]);

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

  const handleSubmit = async (values: EditUserFormValues) => {
    if (!firestore || !userToEdit || !currentUserProfile) return;

    const isEditingSelf = userToEdit.uid === currentUserProfile.uid;
    const canEditSensitiveFields = !isEditingSelf && canManageRole(userToEdit.role);

    const batch = writeBatch(firestore);

    const privateUserRef = doc(firestore, 'users', userToEdit.uid);
    const privatePayload: any = {
        title: values.title,
        firstName: values.firstName,
        surname: values.surname,
        displayName: `${values.firstName} ${values.surname}`,
        telephone: values.telephone,
        mobile: values.mobile,
        workEmail: values.workEmail,
        homeEmail: values.homeEmail,
        address: values.address,
    };
    
    if (canEditSensitiveFields || (isAdmin && isEditingSelf)) {
        privatePayload.role = values.role;
        privatePayload.status = values.status;
        privatePayload.branchIds = values.branchIds;
    }
    batch.update(privateUserRef, privatePayload);

    const publicUserRef = doc(firestore, 'publicUsers', userToEdit.uid);
    const publicPayload: any = {
      displayName: `${values.firstName} ${values.surname}`,
      firstName: values.firstName,
      surname: values.surname,
    };
    if (canEditSensitiveFields || (isAdmin && isEditingSelf)) {
      publicPayload.role = values.role;
      publicPayload.status = values.status;
      publicPayload.branchIds = values.branchIds;
      publicPayload.branchNames = values.branchIds?.map(id => (branches || []).find(b => b.id === id)?.name).filter((name): name is string => name !== undefined) || [];
    }
    batch.update(publicUserRef, publicPayload);

    try {
        await batch.commit();
        toast({
            title: "Audit trail updated",
            description: `${values.firstName}'s production profile has been updated.`,
        });
        onOpenChange(false);
    } catch (error) {
        console.error("Profile update error:", error);
        toast({
            title: "Action Failed",
            description: "A production audit error occurred.",
            variant: "destructive",
        });
    }
  };

  if (!currentUserProfile) return null;
  
  const isEditingSelf = userToEdit?.uid === currentUserProfile.uid;
  const canEditSensitiveFields = !isEditingSelf && userToEdit && canManageRole(userToEdit.role);
  const canEditBranches = canEditSensitiveFields || (isAdmin && isEditingSelf);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Audit Update: Unified contact and role management.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <ScrollArea className="flex-1 px-6">
                <Tabs defaultValue="identity" className="w-full py-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="identity">Identity</TabsTrigger>
                        <TabsTrigger value="contact">Contact</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                    </TabsList>

                    <TabsContent value="identity" className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Title</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select title" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {TitleEnum.options.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="firstName" render={({ field }) => (
                                <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                            )}/>
                            <FormField control={form.control} name="surname" render={({ field }) => (
                                <FormItem><FormLabel>Surname</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                            )}/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="workEmail" render={({ field }) => (
                                <FormItem><FormLabel>Work Email</FormLabel><FormControl><Input {...field} placeholder="work@auctiondepartment.com" /></FormControl></FormItem>
                            )}/>
                            <FormField control={form.control} name="homeEmail" render={({ field }) => (
                                <FormItem><FormLabel>Home Email</FormLabel><FormControl><Input {...field} placeholder="personal@example.com" /></FormControl></FormItem>
                            )}/>
                        </div>
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="telephone" render={({ field }) => (
                                <FormItem><FormLabel>Telephone</FormLabel><FormControl><Input type="tel" {...field} /></FormControl></FormItem>
                            )}/>
                            <FormField control={form.control} name="mobile" render={({ field }) => (
                                <FormItem><FormLabel>Mobile</FormLabel><FormControl><Input type="tel" {...field} /></FormControl></FormItem>
                            )}/>
                        </div>
                        <div className="border-t pt-4">
                            <FormLabel className="mb-4 block text-sm font-semibold">Residential Address</FormLabel>
                            <AddressFields control={form.control} namePrefix="address" />
                        </div>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-4 pt-4">
                        {(canEditSensitiveFields || (isAdmin && isEditingSelf)) && (
                            <>
                                <FormField control={form.control} name="role" render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Role</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {manageableRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="status" render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Account Status</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {userStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                )}/>
                            </>
                        )}
                        {canEditBranches && (
                            <FormField control={form.control} name="branchIds" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Branch Access</FormLabel>
                                  <MultiSelectCombobox 
                                    options={branchOptions} 
                                    selected={field.value || []} 
                                    onChange={field.onChange} 
                                    className="w-full" 
                                    placeholder="Select branches..." 
                                  />
                                </FormItem>
                            )}/>
                        )}
                    </TabsContent>
                </Tabs>
            </ScrollArea>

            <DialogFooter className="p-6 pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}