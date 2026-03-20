"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { auctionSelectionNotes } from "@/lib/auction-selection-notes";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/; // HH:MM format

const AuctionEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  auctionType: z.enum([
    "Online Timed Auction",
    "Livestream Auction",
    "In Room Auction",
    "Live at Property Auction",
    "Modern Method of Auction"
  ], { required_error: "You must select an auction type." }),
  startDate: z.date({ required_error: "A start date is required."}),
  startTime: z.string().regex(timeRegex, "Invalid time format. Use HH:MM."),
  endDate: z.date().optional(),
  endTime: z.string().regex(timeRegex, "Invalid time format. Use HH:MM.").optional(),
  entryClosingDate: z.date({ required_error: "An entry closing date is required."}),
  entryClosingTime: z.string().regex(timeRegex, "Invalid time format. Use HH:MM."),
}).refine((data) => {
    if (data.endDate && data.endTime) {
      const startDateTime = new Date(data.startDate);
      const [startHours, startMinutes] = data.startTime.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes);

      const endDateTime = new Date(data.endDate);
      const [endHours, endMinutes] = data.endTime.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes);

      return endDateTime > startDateTime;
    }
    return true;
}, {
  message: "End date and time must be after start date and time.",
  path: ["endTime"],
});

type AuctionEventFormValues = z.infer<typeof AuctionEventSchema>;

const combineDateTime = (date: Date, time: string): Date => {
  const newDate = new Date(date);
  const [hours, minutes] = time.split(':').map(Number);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};


type AddAuctionEventDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEventAdded: () => void;
};

export function AddAuctionEventDialog({
  isOpen,
  onOpenChange,
  onEventAdded,
}: AddAuctionEventDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AuctionEventFormValues>({
    resolver: zodResolver(AuctionEventSchema),
    defaultValues: {
        startTime: "12:00",
        entryClosingTime: "17:00",
    }
  });

  const auctionType = useWatch({
    control: form.control,
    name: 'auctionType'
  });

  const isTimedAuction = auctionType === "Online Timed Auction" || auctionType === "Modern Method of Auction";

  const handleSubmit = async (values: AuctionEventFormValues) => {
    if (!firestore) return;
    setIsLoading(true);

    const startDateTime = combineDateTime(values.startDate, values.startTime);
    const entryClosingDateTime = combineDateTime(values.entryClosingDate, values.entryClosingTime);

    const payload: any = {
        title: values.title,
        auctionType: values.auctionType,
        start: Timestamp.fromDate(startDateTime),
        entryClosingDate: Timestamp.fromDate(entryClosingDateTime),
        status: 'scheduled',
    };

    if (values.endDate && values.endTime) {
        payload.end = Timestamp.fromDate(combineDateTime(values.endDate, values.endTime));
    } else {
        const endDate = new Date(startDateTime);
        endDate.setHours(23, 59, 59);
        payload.end = Timestamp.fromDate(endDate);
    }

    try {
      await addDoc(collection(firestore, 'auctionEvents'), payload);
      toast({ title: "Success", description: "Production auction event scheduled." });
      onEventAdded();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Event error:", error);
      toast({ variant: "destructive", title: "Audit Error", description: "Could not schedule the event." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule New Auction</DialogTitle>
          <DialogDescription>
            Audit Desk: Define production event parameters.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., May Property Auction" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="auctionType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Auction Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an auction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {auctionSelectionNotes.map(type => (
                        <SelectItem key={type.title} value={type.title}>{type.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
            )}/>
            
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Auction {isTimedAuction ? 'Start' : ''} Date</FormLabel>
                         <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="startTime" render={({ field }) => (
                    <FormItem><FormLabel>{isTimedAuction ? 'Start' : ''} Time (HH:MM)</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>

            {isTimedAuction && (
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="endDate" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Auction End Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="endTime" render={({ field }) => (
                        <FormItem><FormLabel>End Time (HH:MM)</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="entryClosingDate" render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Entry Closing Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="entryClosingTime" render={({ field }) => (
                    <FormItem><FormLabel>Closing Time (HH:MM)</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Scheduling..." : "Schedule Event"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
