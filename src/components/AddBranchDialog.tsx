"use client";

import { useState, useEffect } from "react";
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
import { collection, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { BranchSchema } from "@/lib/schemas";
import { AddressFields } from "@/components/AddressFields";

const AddBranchFormSchema = BranchSchema.omit({ status: true, deletionRequested: true });
type AddBranchFormValues = z.infer<typeof AddBranchFormSchema>;

type AddBranchDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  organisationId: string;
};

export function AddBranchDialog({
  isOpen,
  onOpenChange,
  organisationId,
}: AddBranchDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AddBranchFormValues>({
    resolver: zodResolver(AddBranchFormSchema),
    defaultValues: {
      name: "",
      address: { houseNameOrNumber: "", addressLine1: "", addressLine2: "", townCity: "", county: "", postcode: "" },
      contactTelephone: "",
      emailAddress: "",
    },
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const handleSubmit = async (values: AddBranchFormValues) => {
    if (!firestore) return;

    setIsLoading(true);
    const branchCollectionRef = collection(firestore, 'organisations', organisationId, 'branches');

    const payload = {
      ...values,
      status: 'active',
      deletionRequested: false,
    };

    try {
        await addDoc(branchCollectionRef, payload);
        toast({
            title: "Branch Registered",
            description: `${values.name} has been added to the production registry.`,
        });
        form.reset();
        onOpenChange(false);
    } catch (error: any) {
        console.error("Branch error:", error);
        toast({
            variant: "destructive",
            title: "Audit Error",
            description: "Could not register branch. Please retry.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Branch Office</DialogTitle>
          <DialogDescription>
            Audit Desk: Register new business location for organisation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Central City Office" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="address"
                render={() => (
                <FormItem>
                    <FormLabel>Branch Address</FormLabel>
                    <AddressFields control={form.control} namePrefix="address" />
                    <FormMessage />
                </FormItem>
                )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="contactTelephone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Telephone</FormLabel>
                    <FormControl>
                        <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="emailAddress"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="branch@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Registering..." : "Create Branch"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
