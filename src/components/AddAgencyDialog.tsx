"use client";

import { useState } from "react";
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
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import { type Organisation } from "@/lib/types";
import { AddressFields } from "@/components/AddressFields";
import { BusinessTypeEnum, AddressSchema } from "@/lib/schemas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const AgencyDetailsSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  businessType: BusinessTypeEnum,
  headOfficeAddress: AddressSchema,
  mainContactTelephone: z.string().min(1, "Telephone is required"),
  generalContactEmail: z.string().email("Invalid email"),
});
type AgencyDetailsForm = z.infer<typeof AgencyDetailsSchema>;

type AddAgencyDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAgencyAdded?: (organisation: Organisation) => void;
};

export function AddAgencyDialog({
  isOpen,
  onOpenChange,
  onAgencyAdded,
}: AddAgencyDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AgencyDetailsForm>({
    resolver: zodResolver(AgencyDetailsSchema),
    defaultValues: {
      name: "",
      businessType: "Private Limited Company",
      mainContactTelephone: "",
      generalContactEmail: "",
    },
  });

  const handleAgencySubmit = async (values: AgencyDetailsForm) => {
    if (!firestore) return;
    setIsLoading(true);
    try {
      const newOrgRef = doc(collection(firestore, 'organisations'));
      const newOrgData = {
        ...values,
        ownerUid: '',
        status: 'Pending' as const,
        registeredOfficeAddress: values.headOfficeAddress,
        isVatRegistered: false,
        logoUrl: "",
        website: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(newOrgRef, newOrgData);
      toast({ title: "Agency Created", description: "Audit record established. Setup owner next." });
      onOpenChange(false);
      router.push(`/dashboard/organisation?orgId=${newOrgRef.id}`);
    } catch (error) {
        console.error("Agency creation error:", error);
        toast({ variant: 'destructive', title: 'Audit Error', description: 'Creation failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Estate Agency</DialogTitle>
          <DialogDescription>Registry: Enter core production details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAgencySubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input placeholder="Legal entity name" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="businessType" render={({ field }) => (
                <FormItem><FormLabel>Business Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{BusinessTypeEnum.options.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                </FormItem>
            )} />
            <AddressFields control={form.control} namePrefix="headOfficeAddress" />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>Create Production Profile</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
