"use client";

import { useEffect } from "react";
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
import { useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { BranchSchema } from "@/lib/schemas";
import { AddressFields } from "@/components/AddressFields";
import { Branch } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const EditBranchFormSchema = BranchSchema.omit({ deletionRequested: true });
type EditBranchFormValues = z.infer<typeof EditBranchFormSchema>;

type EditBranchDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  organisationId: string;
  branch: Branch;
};

export function EditBranchDialog({
  isOpen,
  onOpenChange,
  organisationId,
  branch,
}: EditBranchDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<EditBranchFormValues>({
    resolver: zodResolver(EditBranchFormSchema),
    defaultValues: {
        name: "",
        address: { houseNameOrNumber: "", addressLine1: "", addressLine2: "", townCity: "", county: "", postcode: "" },
        contactTelephone: "",
        emailAddress: "",
        status: "active",
    }
  });
  
  useEffect(() => {
    if (branch && isOpen) {
      form.reset({
        name: branch.name || "",
        address: branch.address,
        contactTelephone: branch.contactTelephone || "",
        emailAddress: branch.emailAddress || "",
        status: branch.status || "active",
      });
    }
  }, [branch, isOpen, form]);

  const handleSubmit = async (values: EditBranchFormValues) => {
    if (!firestore || !branch.id) return;
    const branchRef = doc(firestore, 'organisations', organisationId, 'branches', branch.id);
    try {
        await updateDoc(branchRef, values);
        toast({ title: "Audit Update", description: "Production branch record updated." });
        onOpenChange(false);
    } catch (error) {
        console.error("Update failure:", error);
        toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Branch: {branch?.name}</DialogTitle>
          <DialogDescription>Registry Desk: Update branch parameters.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Branch Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <AddressFields control={form.control} namePrefix="address" />
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="contactTelephone" render={({ field }) => (
                    <FormItem><FormLabel>Telephone</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="emailAddress" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center space-x-4 pt-2">
                          <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="active" /></FormControl><FormLabel className="font-normal">Active</FormLabel></FormItem>
                          <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="inactive" /></FormControl><FormLabel className="font-normal">Inactive</FormLabel></FormItem>
                          <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="archived" /></FormControl><FormLabel className="font-normal">Archived</FormLabel></FormItem>
                      </RadioGroup>
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}