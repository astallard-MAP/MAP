"use client";

import { useEffect, useState, useRef } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "../../../../firebase";
import { doc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { 
  PropertyFormSchema, 
  TitleEnum, 
  PriceQualifierEnum, 
  CouncilTaxBandEnum, 
  ConstructionTypeEnum, 
  UtilitySourceEnum, 
  HeatingTypeEnum, 
  ParkingTypeEnum 
} from "../../../../lib/schemas";
import type { Property, Branch, Address } from "../../../../lib/types";
import { useToast } from "../../../../hooks/use-toast";
import { auctionSelectionNotes } from "../../../../lib/auction-selection-notes";
import { OFFICIAL_AUCTION_DATES } from "../../../../lib/constants";
import { addWeeks, isAfter, format } from "date-fns";
import { usePermissions } from "../../../../context/PermissionContext";
import { rewriteFieldAction, researchLocationAction } from "../../../../app/actions/client-ai-actions";

import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "../../../../components/ui/form";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "../../../../components/ui/tabs";
import {
  TooltipProvider,
} from "../../../../components/ui/tooltip";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  BedDouble,
  MapPin,
  FileText,
  Eye,
  Camera,
  UserPlus,
  Briefcase,
  Gavel,
  Coins,
  ShieldCheck,
  Calculator,
  Sparkles,
  Search,
  ShieldAlert,
  Zap,
  FileCheck,
  Calendar,
  Clock
} from "lucide-react";

import { AddressFields } from "../../../../components/AddressFields";
import { UrlOrUploadField } from "../../../../components/UrlOrUploadField";
import { RadioGroup, RadioGroupItem } from "../../../../components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../components/ui/alert-dialog";
import { Checkbox } from "../../../../components/ui/checkbox";

const emptyAddress: Address = {
    houseNameOrNumber: "",
    addressLine1: "",
    addressLine2: "",
    townCity: "",
    county: "",
    postcode: "",
};

const FLOOR_OPTIONS = [
  "Basement", "Lower Ground", "Ground Floor", "First Floor", "Second Floor",
  "Third Floor", "Fourth Floor", "Fifth Floor", "Sixth Floor", "Seventh Floor",
  "Eighth Floor", "Ninth Floor", "Tenth Floor", "Eleventh Floor", "Twelfth Floor",
  "Thirteenth Floor", "Fourteenth Floor", "Fifteenth Floor", "Sixteenth Floor",
  "Seventeenth Floor", "Eighteenth Floor", "Nineteenth Floor", "Twentieth Floor",
  "Twenty-First Floor", "Twenty-Second Floor", "Twenty-Third Floor",
  "Twenty-Fourth Floor", "Twenty-Fifth Floor", "Attic", "Outbuildings", "External"
];

function RoomList({ form, groupIndex }: { form: any, groupIndex: number }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `accommodation.${groupIndex}.rooms`,
  });

  return (
    <div className="space-y-4 pt-4 border-t">
      <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-700">
        <BedDouble className="h-4 w-4"/> Rooms & Dimensions (UK Standard)
      </h4>
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border p-4 rounded-lg bg-slate-50/50">
            <div className="md:col-span-3">
              <FormField
                control={form.control}
                name={`accommodation.${groupIndex}.rooms.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Room Name</FormLabel>
                    <FormControl><Input {...field} className="h-9 text-sm bg-white" placeholder="e.g. Lounge"/></FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="md:col-span-4 grid grid-cols-4 gap-1">
               <FormField control={form.control} name={`accommodation.${groupIndex}.rooms.${index}.lengthFt`} render={({ field }) => (
                  <FormItem><FormLabel className="text-[9px] font-bold">L (ft)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} className="h-9 text-xs bg-white"/></FormControl></FormItem>
               )}/>
               <FormField control={form.control} name={`accommodation.${groupIndex}.rooms.${index}.lengthIn`} render={({ field }) => (
                  <FormItem><FormLabel className="text-[9px] font-bold">L (in)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} className="h-9 text-xs bg-white"/></FormControl></FormItem>
               )}/>
               <FormField control={form.control} name={`accommodation.${groupIndex}.rooms.${index}.widthFt`} render={({ field }) => (
                  <FormItem><FormLabel className="text-[9px] font-bold">W (ft)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} className="h-9 text-xs bg-white"/></FormControl></FormItem>
               )}/>
               <FormField control={form.control} name={`accommodation.${groupIndex}.rooms.${index}.widthIn`} render={({ field }) => (
                  <FormItem><FormLabel className="text-[9px] font-bold">W (in)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} className="h-9 text-xs bg-white"/></FormControl></FormItem>
               )}/>
            </div>
            <div className="md:col-span-4 grid grid-cols-2 gap-1">
               <FormField control={form.control} name={`accommodation.${groupIndex}.rooms.${index}.lengthM`} render={({ field }) => (
                  <FormItem><FormLabel className="text-[9px] font-bold text-primary">L (m)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} className="h-9 text-xs bg-white border-primary/20"/></FormControl></FormItem>
               )}/>
               <FormField control={form.control} name={`accommodation.${groupIndex}.rooms.${index}.widthM`} render={({ field }) => (
                  <FormItem><FormLabel className="text-[9px] font-bold text-primary">W (m)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} className="h-9 text-xs bg-white border-primary/20"/></FormControl></FormItem>
               )}/>
            </div>
            <div className="md:col-span-1 flex justify-center pb-1">
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1} className="text-destructive h-8 w-8 hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={() => append({ name: '' })} className="text-xs font-bold text-primary hover:text-primary hover:bg-primary/5">
        <Plus className="mr-1.5 h-3 w-3" /> Add Room to Floor
      </Button>
    </div>
  );
}

function AccommodationManager({ form }: { form: any }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "accommodation",
  });

  return (
    <div className="space-y-6">
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-4 border rounded-xl p-6 bg-white shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="flex-1 max-w-xs">
              <FormField
                control={form.control}
                name={`accommodation.${index}.group`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Floor Selection</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 font-medium">
                          <SelectValue placeholder="Select floor..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FLOOR_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="text-destructive font-bold text-xs h-8">
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Remove Floor
            </Button>
          </div>
          <RoomList form={form} groupIndex={index} />
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full border-dashed border-2 py-8 bg-slate-50 hover:bg-slate-100 hover:border-primary/50 transition-all text-slate-600 font-bold" onClick={() => append({ group: 'Ground Floor', rooms: [{ name: '' }] })}>
        <Plus className="mr-2 h-5 w-5 text-primary" /> Add Property Floor
      </Button>
    </div>
  );
}

function PartyFieldsCard({ form, index, namePrefix, remove }: { form: any, index: number, namePrefix: "sellers" | "buyers", remove: (i: number) => void }) {
  const partyType = useWatch({ control: form.control, name: `${namePrefix}.${index}.partyType` });
  
  return (
    <div className="border p-6 rounded-lg bg-slate-50/30 relative">
      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 text-destructive transition-colors hover:bg-destructive/10"><Trash2 className="h-4 w-4"/></Button>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField control={form.control} name={`${namePrefix}.${index}.partyType`} render={({ field }) => (
          <FormItem><FormLabel className="text-xs font-bold uppercase text-slate-500">Party Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="Individual">Individual</SelectItem><SelectItem value="Group of Individuals">Group of Individuals</SelectItem><SelectItem value="Company">Company</SelectItem><SelectItem value="Corporate Body">Corporate Body</SelectItem></SelectContent></Select></FormItem>
        )}/>
        <FormField control={form.control} name={`${namePrefix}.${index}.email`} render={({ field }) => (<FormItem><FormLabel className="text-xs font-bold uppercase text-slate-500">Email Address</FormLabel><FormControl><Input type="email" placeholder="e.g. contact@domain.com" {...field} className="bg-white" /></FormControl></FormItem>)}/>
        <FormField control={form.control} name={`${namePrefix}.${index}.mobile`} render={({ field }) => (<FormItem><FormLabel className="text-xs font-bold uppercase text-slate-500">Mobile Number</FormLabel><FormControl><Input placeholder="e.g. 07123 456789" {...field} className="bg-white" /></FormControl></FormItem>)}/>
      </div>

      {(partyType === 'Individual' || partyType === 'Group of Individuals') ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 animate-in fade-in duration-300">
          <FormField control={form.control} name={`${namePrefix}.${index}.title`} render={({ field }) => (
            <FormItem><FormLabel className="text-xs font-bold uppercase text-slate-500">Title</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-white"><SelectValue placeholder="Title" /></SelectTrigger></FormControl><SelectContent>{TitleEnum.options.map((t: string) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></FormItem>
          )}/>
          <FormField control={form.control} name={`${namePrefix}.${index}.firstName`} render={({ field }) => (<FormItem><FormLabel className="text-xs font-bold uppercase text-slate-500">First Name</FormLabel><FormControl><Input placeholder="e.g. John" {...field} className="bg-white" /></FormControl></FormItem>)}/>
          <FormField control={form.control} name={`${namePrefix}.${index}.surname`} render={({ field }) => (<FormItem><FormLabel className="text-xs font-bold uppercase text-slate-500">Surname</FormLabel><FormControl><Input placeholder="e.g. Smith" {...field} className="bg-white" /></FormControl></FormItem>)}/>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-in fade-in duration-300">
          <FormField control={form.control} name={`${namePrefix}.${index}.companyName`} render={({ field }) => (<FormItem><FormLabel className="text-xs font-bold uppercase text-slate-500">Company Name</FormLabel><FormControl><Input placeholder="e.g. Acme Property Ltd" {...field} className="bg-white" /></FormControl></FormItem>)}/>
          <FormField control={form.control} name={`${namePrefix}.${index}.registrationNumber`} render={({ field }) => (<FormItem><FormLabel className="text-xs font-bold uppercase text-slate-500">Company Reg No.</FormLabel><FormControl><Input placeholder="e.g. 12345678" {...field} className="bg-white" /></FormControl></FormItem>)}/>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-slate-200">
        <AddressFields control={form.control} namePrefix={`${namePrefix}.${index}.address`} />
      </div>
    </div>
  );
}

export default function SubmitPropertyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("id");
  const { toast } = useToast();
  const firestore = useFirestore();
  const { userProfile } = useUser();
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState<string | null>(null);
  const isInitialLoad = useRef(true);

  const canEditAdminFinancials = userProfile?.role === "Global Admin" || userProfile?.role === "TAD Admin";

  // Auction Type Acknowledgement State
  const [showAuctionNote, setShowAuctionNote] = useState(false);
  const [activeNote, setActiveNote] = useState<any>(null);
  const [acknowledgedType, setAcknowledgedType] = useState<string | null>(null);

  const branchesQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.organisationId) return null;
    return collection(firestore, 'organisations', userProfile.organisationId, 'branches');
  }, [firestore, userProfile?.organisationId]);

  const propertyDocRef = useMemoFirebase(() => {
    if (!firestore || !propertyId) return null;
    return doc(firestore, 'properties', propertyId);
  }, [firestore, propertyId]);

  const { data: branches } = useCollection<Branch>(branchesQuery);
  const { data: existingProperty } = useDoc<Property>(propertyDocRef);

  const form = useForm<z.infer<typeof PropertyFormSchema>>({
    resolver: zodResolver(PropertyFormSchema),
    defaultValues: {
      status: 'Draft',
      sellers: [{ partyType: 'Individual', email: '', mobile: '', title: 'Mr', firstName: '', surname: '', address: emptyAddress }],
      buyers: [{ partyType: 'Individual', email: '', mobile: '', title: 'Mr', firstName: '', surname: '', address: emptyAddress }],
      buyerInstructions: "",
      solicitor: { companyName: '', address: emptyAddress, contacts: [{title: "Mr", firstName: "", surname: "", email: ""}] },
      propertyType: 'House',
      tenure: 'Freehold',
      tenancyStatus: 'Vacant',
      auctionType: "" as any, 
      entryFeeType: 'instruct',
      buyerAdminFee: { percentage: 0.5, minimum: 750 },
      buyerPremium: { percentage: 1.0, minimum: 1800 },
      commission: { type: 'percentage', percentage: 3.00, minimumAmount: 3000, fixedAmount: 3000 },
      accommodation: [],
      photographs: [],
      headline: "",
      subheading: "",
      location: "",
      notes: "",
      viewingArrangements: "Strictly by appointment with the Auctioneer",
      guidePriceType: "single",
      compliance: {
        priceQualifier: "Guide Price",
        councilTaxBand: "A",
        constructionType: "Standard",
        electricitySource: "Mains",
        waterSource: "Mains",
        sewerageSource: "Mains",
        heatingType: "Gas Central",
        parkingType: ["None"],
        listedBuildingStatus: "None",
        conservationArea: false,
        publicRightsOfWay: false,
        coastalErosionRisk: false,
        epcRating: "Not Required"
      }
    },
  });

  const { fields: sellerFields, append: appendSeller, remove: removeSeller } = useFieldArray({
    control: form.control,
    name: "sellers",
  });

  const { fields: solicitorContactFields, append: appendSolicitorContact, remove: removeSolicitorContact } = useFieldArray({
    control: form.control,
    name: "solicitor.contacts",
  });

  const { fields: buyerFields, append: appendBuyer, remove: removeBuyer } = useFieldArray({
    control: form.control,
    name: "buyers",
  });

  const watchedReservePrice = useWatch({ control: form.control, name: 'reservePrice' });
  const watchedBasis = useWatch({ control: form.control, name: 'guidePriceType' });
  const watchedAuctionType = useWatch({ control: form.control, name: 'auctionType' });
  const watchedTenure = useWatch({ control: form.control, name: 'tenure' });

  useEffect(() => {
    if (watchedReservePrice) {
      const minGuide = watchedReservePrice / 1.1;
      const calculatedGuide = Math.ceil(minGuide / 5000) * 5000;
      
      if (watchedBasis === 'single') {
        form.setValue('guidePrice', calculatedGuide);
      } else {
        form.setValue('guidePriceTo', calculatedGuide);
        form.setValue('guidePriceFrom', calculatedGuide - 5000);
      }
    }
  }, [watchedReservePrice, watchedBasis, form]);

  useEffect(() => {
    if (existingProperty) {
      // Forensic Normalization: Ensure buyers/sellers arrays exist and are populated with correct structure
      const data = { ...existingProperty };
      if (!data.sellers || data.sellers.length === 0) {
        data.sellers = [{ partyType: 'Individual', email: '', mobile: '', title: 'Mr', firstName: '', surname: '', address: emptyAddress }];
      }
      if (!data.buyers || data.buyers.length === 0) {
        data.buyers = [{ partyType: 'Individual', email: '', mobile: '', title: 'Mr', firstName: '', surname: '', address: emptyAddress }];
      }
      
      form.reset(data as any);
      setAcknowledgedType(existingProperty.auctionType || null);
      isInitialLoad.current = false;
    }
  }, [existingProperty, form]);

  useEffect(() => {
    if (watchedAuctionType && watchedAuctionType !== acknowledgedType) {
        const note = auctionSelectionNotes.find(n => n.title === watchedAuctionType);
        if (note) {
            setActiveNote(note);
            setShowAuctionNote(true);
        }
    }
  }, [watchedAuctionType, acknowledgedType]);

  const handleAcknowledgeAuction = () => {
    setAcknowledgedType(watchedAuctionType);
    setShowAuctionNote(false);
    toast({ title: "Protocol Acknowledged", description: "Production guidelines accepted." });
  };

  const handleRewriteField = async (fieldName: 'headline' | 'subheading') => {
    const currentVal = form.getValues(fieldName);
    if (!currentVal) {
      toast({ variant: 'destructive', title: "Field Empty", description: "Enter a draft before asking Frank to re-write." });
      return;
    }
    
    setIsAiProcessing(fieldName);
    const result = await rewriteFieldAction(currentVal, fieldName);
    if (result.success && result.text) {
      form.setValue(fieldName, result.text, { shouldDirty: true, shouldValidate: true });
      toast({ title: "Frank says: Rewritten!", description: "Field refined character-accurately." });
    } else {
      toast({ variant: 'destructive', title: "AI Relay Error", description: "Frank is offline." });
    }
    setIsAiProcessing(null);
  };

  const handleResearchLocation = async () => {
    const townCity = form.getValues('address.townCity');
    if (!townCity) {
      toast({ variant: 'destructive', title: "Town/City Required", description: "Enter a location in the Address tab first." });
      return;
    }

    setIsAiProcessing('location');
    const result = await researchLocationAction(townCity);
    if (result.success && result.text) {
      form.setValue('location', result.text, { shouldDirty: true, shouldValidate: true });
      toast({ title: "Frank says: Research Complete!", description: "Descriptive paragraph generated without demographics." });
    } else {
      toast({ variant: 'destructive', title: "Research Failed", description: "Wikipedia relay unavailable." });
    }
    setIsAiProcessing(null);
  };

  const handleSaveDraft = async () => {
    if (!firestore || !userProfile) return;
    setIsSavingDraft(true);
    try {
      const data = form.getValues();
      const docRef = propertyId ? doc(firestore, 'properties', propertyId) : doc(collection(firestore, 'properties'));
      const payload = {
        ...data,
        id: docRef.id,
        status: 'Draft' as const,
        updatedAt: serverTimestamp(),
        submittedBy: userProfile.uid,
        organisationId: userProfile.organisationId,
        createdAt: existingProperty?.createdAt || serverTimestamp(),
      };
      await setDoc(docRef, payload as any, { merge: true });
      if (!propertyId) router.replace(`/dashboard/submit-property?id=${docRef.id}`, { scroll: false });
      toast({ title: "Draft Saved" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error Saving Draft" });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmitForApproval = async (values: z.infer<typeof PropertyFormSchema>) => {
    if (!firestore || !userProfile) return;
    setIsSubmitting(true);
    try {
      const docRef = propertyId ? doc(firestore, 'properties', propertyId) : doc(collection(firestore, 'properties'));
      const propertyData = {
        ...values,
        id: docRef.id,
        status: 'Submitted' as const,
        updatedAt: serverTimestamp(),
        submittedBy: userProfile.uid,
        organisationId: userProfile.organisationId,
        createdAt: existingProperty?.createdAt || serverTimestamp(),
      };
      await setDoc(docRef, propertyData as any, { merge: true });
      toast({ title: "Submitted for Audit" });
      router.push('/dashboard/properties');
    } catch (error) {
      toast({ variant: "destructive", title: "Submission Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <TooltipProvider>
        <AlertDialog open={showAuctionNote} onOpenChange={setShowAuctionNote}>
            <AlertDialogContent className="max-w-2xl border-t-4 border-t-primary">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-xl">
                        <Gavel className="text-primary h-6 w-6" />
                        Production Intel: {activeNote?.title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4 pt-2">
                        <div className="bg-muted/30 p-4 rounded-lg border border-slate-200">
                            <p className="font-bold text-slate-900 mb-2 uppercase tracking-widest text-[10px]">TAD Compiled Guidelines:</p>
                            <p className="text-sm leading-relaxed text-slate-700 italic">"{activeNote?.description}"</p>
                        </div>
                        <div className="space-y-2">
                            <p className="font-bold text-slate-900 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                                Strategic Application (When to Choose):
                            </p>
                            <p className="text-sm text-slate-600">{activeNote?.whenToChoose}</p>
                        </div>
                        <p className="text-[10px] font-medium text-muted-foreground pt-4 border-t uppercase">
                            Acknowledgement required: We have clinicaly compiled this intelligence to assist in your production strategy.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="pt-4">
                    <AlertDialogAction onClick={handleAcknowledgeAuction} className="w-full font-black uppercase tracking-widest">
                        I Acknowledge the Selection Protocol
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmitForApproval)} className="space-y-8 pb-32">
            <header>
              <h1 className="text-3xl font-bold tracking-tight font-headline text-slate-900">Submit New Property</h1>
              <p className="text-muted-foreground font-medium mt-1">UK-EN: Complete production details in GMT/BST.</p>
            </header>

            <Tabs defaultValue="address" className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-9 h-auto gap-2 bg-transparent p-0">
                 <TabsTrigger value="address" className="border py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-white">Address</TabsTrigger>
                 <TabsTrigger value="description" className="border py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-white">Description</TabsTrigger>
                 <TabsTrigger value="compliance" className="border py-2 text-xs data-[state=active]:bg-secondary data-[state=active]:text-white">Compliance</TabsTrigger>
                 <TabsTrigger value="sellers" className="border py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-white">Sellers</TabsTrigger>
                 <TabsTrigger value="solicitor" className="border py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-white">Solicitor</TabsTrigger>
                 <TabsTrigger value="marketing" className="border py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-white">Marketing</TabsTrigger>
                 <TabsTrigger value="auction" className="border py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-white">Auction</TabsTrigger>
                 <TabsTrigger value="financials" className="border py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-white">Financials</TabsTrigger>
                 <TabsTrigger value="buyers" className="border py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-white">Buyers</TabsTrigger>
              </TabsList>

              <TabsContent value="address" className="mt-6">
                <Card className="shadow-sm border-t-4 border-t-primary"><CardHeader><CardTitle>Property Address</CardTitle></CardHeader><CardContent><AddressFields control={form.control} namePrefix="address" /></CardContent></Card>
              </TabsContent>

              <TabsContent value="description" className="mt-6 space-y-8">
                  <Card className="shadow-sm border-t-4 border-t-primary">
                    <CardHeader>
                      <CardTitle>Description & Accommodation</CardTitle>
                      <CardDescription>Consolidated primary production details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <div className="space-y-4">
                        <FormField control={form.control} name="headline" render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel>Headline (Uppercase)</FormLabel>
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleRewriteField('headline')} disabled={!!isAiProcessing} className="h-7 text-[10px] font-bold text-primary hover:bg-primary/5">
                                    {isAiProcessing === 'headline' ? <Loader2 className="animate-spin h-3 w-3 mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                                    Ask Frank to Re-write
                                </Button>
                            </div>
                            <FormControl><Input placeholder="EXCEPTIONAL INVESTMENT OPPORTUNITY" {...field}/></FormControl>
                          </FormItem>
                        )}/>
                        <FormField control={form.control} name="subheading" render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel>Subheading</FormLabel>
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleRewriteField('subheading')} disabled={!!isAiProcessing} className="h-7 text-[10px] font-bold text-primary hover:bg-primary/5">
                                    {isAiProcessing === 'subheading' ? <Loader2 className="animate-spin h-3 w-3 mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                                    Ask Frank to Re-write
                                </Button>
                            </div>
                            <FormControl><Textarea rows={3} {...field}/></FormControl>
                          </FormItem>
                        )}/>
                      </div>

                      <div className="pt-6 border-t">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800">
                          <BedDouble className="h-5 w-5 text-primary"/> Accommodation Schedule
                        </h3>
                        <AccommodationManager form={form} />
                      </div>

                      <div className="pt-6 border-t space-y-6">
                        <FormField control={form.control} name="location" render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel className="flex items-center gap-2 font-bold"><MapPin className="h-4 w-4 text-primary"/> Location Intel</FormLabel>
                                <Button type="button" variant="ghost" size="sm" onClick={handleResearchLocation} disabled={!!isAiProcessing} className="h-7 text-[10px] font-bold text-primary hover:bg-primary/5">
                                    {isAiProcessing === 'location' ? <Loader2 className="animate-spin h-3 w-3 mr-1" /> : <Search className="h-3 w-3 mr-1" />}
                                    Research Location with Frank
                                </Button>
                            </div>
                            <FormControl><Textarea rows={4} {...field}/></FormControl>
                          </FormItem>
                        )}/>
                        <FormField control={form.control} name="notes" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 font-bold"><FileText className="h-4 w-4 text-primary"/> Notes</FormLabel>
                            <FormControl><Textarea rows={4} {...field}/></FormControl>
                          </FormItem>
                        )}/>
                        <FormField control={form.control} name="viewingArrangements" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 font-bold"><Eye className="h-4 w-4 text-primary"/> Viewing Arrangements</FormLabel>
                            <FormControl><Textarea rows={4} {...field}/></FormControl>
                          </FormItem>
                        )}/>
                      </div>
                    </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="compliance" className="mt-6 space-y-6">
                <Card className="shadow-sm border-t-4 border-t-secondary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-secondary" />
                      Material Information (2026 Compliance)
                    </CardTitle>
                    <CardDescription>Definitive data required by Trading Standards and portal RTDF APIs.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* TENURE & OCCUPATION (RELOCATED) */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 border-b pb-2">Tenure & Occupation Status</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="tenure" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tenure Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="Freehold">Freehold</SelectItem>
                                <SelectItem value="Leasehold">Leasehold</SelectItem>
                                <SelectItem value="Commonhold">Commonhold</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}/>
                        <FormField control={form.control} name="tenancyStatus" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Occupation Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="Vacant">Vacant</SelectItem>
                                <SelectItem value="Tenanted">Tenanted</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}/>
                      </div>
                    </div>

                    {/* ENERGY PERFORMANCE (NEW) */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 border-b pb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Energy Performance Certification (EPC)
                      </h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="compliance.epcRating" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Energy Performance Rating</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                {["A", "B", "C", "D", "E", "F", "G", "Not Required"].map(r => (
                                  <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>Mandatory field for UK property listings.</FormDescription>
                          </FormItem>
                        )}/>
                        <div className="space-y-4">
                          <UrlOrUploadField 
                            form={form} 
                            fieldName="compliance.epcCertificateUrl" 
                            label="EPC Certificate (PDF Only)" 
                            fileType="document" 
                            uploadPath={`properties/${propertyId || 'new'}/compliance`}
                          />
                          <p className="text-[10px] text-muted-foreground uppercase italic flex items-center gap-1">
                            <FileCheck className="h-3 w-3" /> 
                            Physical PDF copy is required for production audit.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* PART A */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 border-b pb-2">Part A: Financial Essentials</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="compliance.priceQualifier" render={({ field }) => (
                          <FormItem><FormLabel>Price Qualifier</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{PriceQualifierEnum.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></FormItem>
                        )}/>
                        <FormField control={form.control} name="compliance.councilTaxBand" render={({ field }) => (
                          <FormItem><FormLabel>Council Tax Band</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{CouncilTaxBandEnum.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></FormItem>
                        )}/>
                      </div>
                      {(watchedTenure === 'Leasehold' || watchedTenure === 'Commonhold') && (
                        <div className="grid md:grid-cols-3 gap-4 bg-muted/20 p-4 rounded-lg border">
                          <FormField control={form.control} name="compliance.leaseYearsRemaining" render={({ field }) => (<FormItem><FormLabel>Years Remaining</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))}/></FormControl></FormItem>)}/>
                          <FormField control={form.control} name="compliance.annualGroundRent" render={({ field }) => (<FormItem><FormLabel>Ground Rent (£)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))}/></FormControl></FormItem>)}/>
                          <FormField control={form.control} name="compliance.annualServiceCharge" render={({ field }) => (<FormItem><FormLabel>Service Charge (£)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))}/></FormControl></FormItem>)}/>
                        </div>
                      )}
                    </div>

                    {/* PART B */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 border-b pb-2">Part B: Physical & Utilities</h3>
                      <div className="grid md:grid-cols-3 gap-6">
                        <FormField control={form.control} name="compliance.constructionType" render={({ field }) => (
                          <FormItem><FormLabel>Construction</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{ConstructionTypeEnum.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></FormItem>
                        )}/>
                        <FormField control={form.control} name="compliance.electricitySource" render={({ field }) => (
                          <FormItem><FormLabel>Electricity</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{UtilitySourceEnum.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></FormItem>
                        )}/>
                        <FormField control={form.control} name="compliance.waterSource" render={({ field }) => (
                          <FormItem><FormLabel>Water</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{UtilitySourceEnum.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></FormItem>
                        )}/>
                      </div>
                      <div className="grid md:grid-cols-3 gap-6">
                        <FormField control={form.control} name="compliance.sewerageSource" render={({ field }) => (
                          <FormItem><FormLabel>Sewerage</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{UtilitySourceEnum.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></FormItem>
                        )}/>
                        <FormField control={form.control} name="compliance.heatingType" render={({ field }) => (
                          <FormItem><FormLabel>Heating</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{HeatingTypeEnum.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></FormItem>
                        )}/>
                        <FormField control={form.control} name="compliance.parkingSpaces" render={({ field }) => (
                          <FormItem><FormLabel>Parking Spaces</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))}/></FormControl></FormItem>
                        )}/>
                      </div>
                    </div>

                    {/* PART C */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 border-b pb-2">Part C: Safety & Restrictions</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="compliance.buildingSafetyIssues" render={({ field }) => (
                          <FormItem><FormLabel>Known Safety Issues</FormLabel><FormControl><Textarea placeholder="e.g. Cladding, Asbestos, Subsidence..." {...field}/></FormControl></FormItem>
                        )}/>
                        <FormField control={form.control} name="compliance.listedBuildingStatus" render={({ field }) => (
                          <FormItem><FormLabel>Listed Building</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="None">None</SelectItem><SelectItem value="Grade I">Grade I</SelectItem><SelectItem value="Grade II">Grade II</SelectItem><SelectItem value="Grade II*">Grade II*</SelectItem></SelectContent></Select></FormItem>
                        )}/>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sellers" className="mt-6">
                <Card className="shadow-sm border-t-4 border-t-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary"/> Seller Parties</CardTitle>
                    <CardDescription>Register all individuals or companies selling the asset.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-6">
                      {sellerFields.map((field, index) => (
                        <PartyFieldsCard key={field.id} form={form} index={index} namePrefix="sellers" remove={removeSeller} />
                      ))}
                    </div>
                    <Button type="button" variant="outline" onClick={() => appendSeller({ partyType: 'Individual', email: '', mobile: '', title: 'Mr', firstName: '', surname: '', address: emptyAddress })} className="w-full border-dashed mt-4"><Plus className="mr-2 h-4 w-4"/> Add Another Seller Party</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="solicitor" className="mt-6">
                <Card className="shadow-sm border-t-4 border-t-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/> Seller Solicitor</CardTitle>
                    <CardDescription>Legal firm details for legal pack assembly.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="solicitor.companyName" render={({ field }) => (<FormItem><FormLabel>Firm Name</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)}/>
                      <FormField control={form.control} name="solicitor.sraNumber" render={({ field }) => (<FormItem><FormLabel>SRA Number</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)}/>
                    </div>
                    <div className="border-t pt-6"><AddressFields control={form.control} namePrefix="solicitor.address" /></div>
                    
                    <div className="border-t pt-6 space-y-4">
                      <h4 className="font-bold text-sm">Legal Contacts</h4>
                      {solicitorContactFields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end bg-slate-50 p-4 rounded-md">
                          <FormField control={form.control} name={`solicitor.contacts.${index}.title`} render={({ field }) => (
                            <FormItem><FormLabel>Title</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{TitleEnum.options.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></FormItem>
                          )}/>
                          <FormField control={form.control} name={`solicitor.contacts.${index}.firstName`} render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)}/>
                          <FormField control={form.control} name={`solicitor.contacts.${index}.surname`} render={({ field }) => (<FormItem><FormLabel>Surname</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>)}/>
                          <div className="flex gap-2">
                            <FormField control={form.control} name={`solicitor.contacts.${index}.email`} render={({ field }) => (<FormItem className="flex-1"><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field}/></FormControl></FormItem>)}/>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeSolicitorContact(index)} className="mb-2 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="ghost" size="sm" onClick={() => appendSolicitorContact({ title: 'Mr', firstName: '', surname: '', email: '' })} className="text-primary font-bold"><Plus className="mr-2 h-4 w-4"/> Add Legal Contact</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="marketing" className="mt-6">
                <Card className="shadow-sm border-t-4 border-t-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5 text-primary"/> Marketing Collateral</CardTitle>
                    <CardDescription>Digital assets for auction promotion.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <UrlOrUploadField form={form} fieldName="floorplanUrl" label="Floor Plan" fileType="image" uploadPath={`properties/${propertyId || 'new'}/floorplans`} />
                    <UrlOrUploadField form={form} fieldName="videoTourUrl" label="Video Tour" fileType="video" uploadPath={`properties/${propertyId || 'new'}/videos`} />
                    <UrlOrUploadField form={form} fieldName="virtualTourUrl" label="Virtual Tour Link" fileType="document" uploadPath={`properties/${propertyId || 'new'}/links`} />
                    
                    <div className="border-t pt-6">
                      <FormLabel className="block mb-4 font-bold">Promotional Photographs</FormLabel>
                      <p className="text-xs text-muted-foreground italic mb-4">Please upload high-resolution JPEG or PNG files for production display.</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {form.watch("photographs")?.map((url: string, i: number) => (
                          <div key={i} className="aspect-square rounded-lg border bg-muted relative overflow-hidden group">
                            <img src={url} alt="Property" className="w-full h-full object-cover" />
                            <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6" onClick={() => {
                              const current = form.getValues("photographs") || [];
                              form.setValue("photographs", current.filter((_, idx) => idx !== i));
                            }}><Trash2 className="h-3 w-3"/></Button>
                          </div>
                        ))}
                        <label className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                          <Plus className="h-6 w-6 text-muted-foreground"/>
                          <span className="text-[10px] font-bold uppercase mt-2">Upload Photo</span>
                          <Input type="file" className="sr-only" accept="image/*" onChange={async (e) => {
                            if (e.target.files?.[0]) {
                              toast({ title: "Uploading...", description: "Character-accurate asset transmission initiated." });
                            }
                          }}/>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="auction" className="mt-6">
                <Card className="shadow-sm border-t-4 border-t-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gavel className="h-5 w-5 text-primary"/> Auction Assignment</CardTitle>
                    <CardDescription>Clinical method selection and scheduling.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-8 items-start">
                      {/* Left: Auction Selection (50%) */}
                      <div className="space-y-6">
                        <FormField control={form.control} name="auctionType" render={({ field }) => (
                          <FormItem><FormLabel className="font-bold">Auction Method</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Please Select Method..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {auctionSelectionNotes.map(n => <SelectItem key={n.title} value={n.title}>{n.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormDescription className="text-[10px] italic">Select the clinical method for asset disposal.</FormDescription>
                          </FormItem>
                        )}/>
                        <FormField control={form.control} name="entryFeeType" render={({ field }) => (
                          <FormItem><FormLabel className="font-bold">Entry Fee Protocol</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="instruct">Instruct (Immediate)</SelectItem><SelectItem value="deferred">Deferred (On Sale)</SelectItem></SelectContent></Select></FormItem>
                        )}/>
                      </div>

                      {/* Right: Upcoming Dates (50%) */}
                      <div className="bg-slate-50 border-2 border-dashed border-primary/20 p-6 rounded-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                          <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                             <Calendar className="h-4 w-4 text-primary" /> Upcoming Auction Schedule
                          </h4>
                          <Badge variant="outline" className="text-[9px] bg-white font-black text-primary border-primary/30">4-Week Intake Policy</Badge>
                        </div>
                        
                        <div className="space-y-3">
                           {auctionSelectionNotes
                             .filter(note => note.title !== "Live at Property Auction")
                             .map(note => {
                              // Intake Logic: Must be minimum 4 weeks from today (2026-03-23)
                              const intakeCutoff = addWeeks(new Date(), 4);
                              const nextDate = OFFICIAL_AUCTION_DATES.find(d => isAfter(new Date(d.date), intakeCutoff));
                              
                              return (
                                <div key={note.title} className="flex items-center justify-between p-3 rounded-lg bg-white border shadow-sm group hover:border-primary/50 transition-all">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                      <Clock className="h-3 w-3" />
                                    </div>
                                    <div>
                                      <p className="text-[9px] font-black uppercase text-slate-400 leading-none">{note.title}</p>
                                      <p className="text-xs font-bold text-slate-900 mt-1">{nextDate ? format(new Date(nextDate.date), 'dd MMMM yyyy') : 'TBC'}</p>
                                    </div>
                                  </div>
                                  {nextDate && (
                                    <Badge className="h-5 text-[9px] font-black uppercase bg-green-500 hover:bg-green-500 border-none">
                                      Next Avail
                                    </Badge>
                                  )}
                                </div>
                              );
                           })}
                        </div>
                        
                        <div className="p-3 bg-white/50 rounded border text-[9px] text-zinc-500 leading-tight italic">
                          * Dates above reflect the earliest clinical entry point for each auction type based on standard 4-week pre-production marketing periods.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financials" className="mt-6">
                <Card className="shadow-sm border-t-4 border-t-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5 text-primary"/> Pricing & Commission</CardTitle>
                    <CardDescription>Definitive production financial parameters.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="reservePrice" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold flex items-center gap-2">
                            Reserve Price (£)
                            <Calculator className="h-3 w-3 text-muted-foreground" />
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g. 100000"
                              {...field} 
                              onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                            />
                          </FormControl>
                          <p className="text-[10px] italic text-muted-foreground uppercase mt-1">This will clinicaly generate the Guide Price.</p>
                        </FormItem>
                      )}/>

                      <FormField control={form.control} name="guidePriceType" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guide Price Basis</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select basis..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="single">Single Figure</SelectItem>
                              <SelectItem value="range">Price Range</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}/>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                        System-Generated Guide Parameters (UK Standard)
                      </h4>
                      
                      {form.watch("guidePriceType") === 'range' ? (
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="guidePriceFrom" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase font-bold">From (£)</FormLabel>
                              <FormControl><Input type="number" {...field} disabled className="bg-white/50 cursor-not-allowed font-bold"/></FormControl>
                            </FormItem>
                          )}/>
                          <FormField control={form.control} name="guidePriceTo" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase font-bold">To (£)</FormLabel>
                              <FormControl><Input type="number" {...field} disabled className="bg-white/50 cursor-not-allowed font-bold"/></FormControl>
                            </FormItem>
                          )}/>
                        </div>
                      ) : (
                        <FormField control={form.control} name="guidePrice" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase font-bold">Generated Guide Price (£)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                disabled 
                                className="bg-white/50 cursor-not-allowed font-black text-primary text-lg"
                              />
                            </FormControl>
                          </FormItem>
                        )}/>
                      )}
                      
                      <div className="p-3 bg-white/80 rounded border text-[10px] text-slate-600 leading-relaxed">
                        <strong>TAD Logic Audit:</strong> The Reserve Price may not be more than 10% above the Advertised Guide Price. 
                        We have clinicaly rounded this value to the nearest <strong>£5,000.00 increment</strong> (Never rounded down) 
                        to ensure absolute compliance with UK Auction protocols.
                      </div>
                    </div>

                    <div className="pt-6 border-t space-y-6">
                      <h4 className="font-bold text-sm text-slate-800">Sales Commission Protocol</h4>
                      <FormField
                        control={form.control}
                        name="commission.type"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Commission Basis</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl><RadioGroupItem value="percentage" /></FormControl>
                                  <FormLabel className="font-normal">Percentage of Purchase Price</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl><RadioGroupItem value="fixed" /></FormControl>
                                  <FormLabel className="font-normal">Fixed Fee</FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {form.watch("commission.type") === 'percentage' ? (
                        <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="commission.percentage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Commission Percentage (%)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.01" 
                                      className="max-w-[8ch]"
                                      placeholder="3.00" 
                                      {...field} 
                                      onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                                    Up to 2 decimal places
                                  </p>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="commission.minimumAmount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Minimum Amount (£)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="3000" 
                                      {...field} 
                                      onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                                    Plus Value Added Tax (VAT)
                                  </p>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <FormField
                            control={form.control}
                            name="commission.fixedAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fixed Fee Amount (£)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="3000" 
                                    {...field} 
                                    onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                  />
                                </FormControl>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                                  Plus Value Added Tax (VAT)
                                </p>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    <div className="pt-6 border-t space-y-6">
                      <h4 className="font-bold text-sm text-slate-800 flex items-center justify-between">
                        Buyer Fee Protocols
                        {!canEditAdminFinancials && <span className="text-[10px] font-normal uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded">Locked</span>}
                      </h4>
                      <div className="grid md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div className="space-y-4">
                          <h5 className="text-[11px] font-bold uppercase text-slate-500 border-b pb-2">Buyer Administration Fee</h5>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="buyerAdminFee.percentage" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Percentage (%)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.1" {...field} disabled={!canEditAdminFinancials} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
                                </FormControl>
                                <p className="text-[9px] text-muted-foreground uppercase">Plus VAT</p>
                              </FormItem>
                            )}/>
                            <FormField control={form.control} name="buyerAdminFee.minimum" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Minimum (£)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} disabled={!canEditAdminFinancials} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
                                </FormControl>
                                <p className="text-[9px] text-muted-foreground uppercase">Plus VAT</p>
                              </FormItem>
                            )}/>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h5 className="text-[11px] font-bold uppercase text-slate-500 border-b pb-2">Buyers Premium</h5>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="buyerPremium.percentage" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Percentage (%)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.1" {...field} disabled={!canEditAdminFinancials} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
                                </FormControl>
                                <p className="text-[9px] text-muted-foreground uppercase">Plus VAT</p>
                              </FormItem>
                            )}/>
                            <FormField control={form.control} name="buyerPremium.minimum" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Minimum (£)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} disabled={!canEditAdminFinancials} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
                                </FormControl>
                                <p className="text-[9px] text-muted-foreground uppercase">Inc VAT</p>
                              </FormItem>
                            )}/>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="buyers" className="mt-6">
                <Card className="shadow-sm border-t-4 border-t-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary"/> Buyer Parties</CardTitle>
                    <CardDescription>Register all individuals or companies associated with the purchase.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-6">
                      {buyerFields.map((field, index) => (
                        <PartyFieldsCard key={field.id} form={form} index={index} namePrefix="buyers" remove={removeBuyer} />
                      ))}
                    </div>
                    <Button type="button" variant="outline" onClick={() => appendBuyer({ partyType: 'Individual', email: '', mobile: '', title: 'Mr', firstName: '', surname: '', address: emptyAddress })} className="w-full border-dashed mt-4"><Plus className="mr-2 h-4 w-4"/> Add Another Buyer Party</Button>

                    <div className="mt-8 pt-8 border-t">
                      <FormField control={form.control} name="buyerInstructions" render={({ field }) => (
                        <FormItem><FormLabel>Buyer Instructions</FormLabel><FormControl><Textarea rows={6} placeholder="Enter any specific buyer registration or vetting requirements..." {...field}/></FormControl></FormItem>
                      )}/>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between items-center fixed bottom-0 left-0 right-0 md:left-[16rem] bg-white/95 backdrop-blur-md p-6 border-t z-50 shadow-2xl">
                <Button type="button" variant="outline" className="font-bold" onClick={() => router.push('/dashboard/properties')}>Exit Without Saving</Button>
                <div className="flex gap-3">
                    <Button type="button" variant="secondary" className="font-bold" onClick={handleSaveDraft} disabled={isSavingDraft || isSubmitting}>Save Draft Audit</Button>
                    <Button type="submit" className="font-black uppercase tracking-widest px-8" disabled={isSubmitting || isSavingDraft}>
                      {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : null}
                      Submit for TAD Audit
                    </Button>
                </div>
            </div>
          </form>
        </Form>
      </TooltipProvider>
    </div>
  );
}
