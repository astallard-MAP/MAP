"use client";

import { useState, useMemo } from 'react';
import { useCollection, useUser, useFirestore, useMemoFirebase } from "../../../../firebase";
import { type AuctionEvent } from "../../../../lib/types";
import { usePermissions } from "../../../../context/PermissionContext";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Calendar as CalendarIcon, PlusCircle, ChevronLeft, ChevronRight, Loader2, Info, Timer, Bookmark } from 'lucide-react';
import { AddAuctionEventDialog } from "../../../../components/AddAuctionEventDialog";
import { Calendar } from "../../../../components/ui/calendar";
import { addMonths, subMonths, startOfMonth, isSameMonth, format, isAfter } from 'date-fns';
import { Badge } from "../../../../components/ui/badge";
import { collection } from "firebase/firestore";
import { auctionSelectionNotes } from "../../../../lib/auction-selection-notes";
import { ScrollArea } from "../../../../components/ui/scroll-area";
import { OFFICIAL_AUCTION_DATES } from "../../../../lib/constants";

export default function AuctionCalendarPage() {
  const { userProfile, isLoading: userLoading } = useUser();
  const { isAdmin, isPermissionsLoaded } = usePermissions();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));

  const sixMonthsAgo = useMemo(() => subMonths(startOfMonth(today), 5), [today]);
  const twelveMonthsHence = useMemo(() => addMonths(startOfMonth(today), 11), [today]);

  const auctionEventsQuery = useMemoFirebase(() => {
    if (!isPermissionsLoaded || !userProfile || !firestore) return null;
    return collection(firestore, 'auctionEvents');
  }, [isPermissionsLoaded, userProfile, firestore]);

  const { data: auctionEvents, isLoading: eventsLoading } = useCollection<AuctionEvent>(auctionEventsQuery);

  const isLoading = userLoading || !isPermissionsLoaded || eventsLoading;

  const upcomingOfficialDates = useMemo(() => {
    return OFFICIAL_AUCTION_DATES.filter(d => isAfter(new Date(d.date), today));
  }, [today]);

  if (isLoading) {
    return <div className="p-8 text-center flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin mr-2"/>Initialising event archives...</div>;
  }
  
  const handlePrevMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    if (newMonth >= sixMonthsAgo) {
      setCurrentMonth(newMonth);
    }
  }

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    if (newMonth <= twelveMonthsHence) {
      setCurrentMonth(newMonth);
    }
  }

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
  
  const DayWithEvents = ({ date, displayMonth }: { date: Date, displayMonth: Date }) => {
    const eventsOnDay = (auctionEvents || []).filter(event => {
        if (!event.start || typeof event.start.toDate !== 'function') return false;
        const eventDate = event.start.toDate();
        return eventDate.getDate() === date.getDate() &&
               eventDate.getMonth() === date.getMonth() &&
               eventDate.getFullYear() === date.getFullYear();
    });

    const isOfficialDate = OFFICIAL_AUCTION_DATES.some(d => {
        const official = new Date(d.date);
        return official.getDate() === date.getDate() &&
               official.getMonth() === date.getMonth() &&
               official.getFullYear() === date.getFullYear();
    });

    return (
        <div className="relative h-full w-full">
            {isToday(date) && <Badge className="absolute top-0 right-0 text-[10px] px-1 h-4 bg-primary">Today</Badge>}
            <time dateTime={date.toISOString()} className="absolute top-1 left-1 text-xs font-bold">
                {date.getDate()}
            </time>
             <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col gap-0.5 w-full px-1">
                {isOfficialDate && isSameMonth(date, displayMonth) && (
                    <div className="h-1.5 w-full rounded-full bg-secondary" title="Official TAD Date" />
                )}
                {eventsOnDay.length > 0 && isSameMonth(date, displayMonth) && (
                    eventsOnDay.map(e => (
                        <div key={e.id} className="h-1 w-full rounded-full bg-primary/60" title={e.title}/>
                    ))
                )}
             </div>
        </div>
    )
  }

  return (
    <>
      <AddAuctionEventDialog 
        isOpen={isAddDialogOpen} 
        onOpenChange={setAddDialogOpen}
        onEventAdded={() => {}}
      />
      <div className="flex flex-col gap-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center text-slate-900">
              <CalendarIcon className="mr-3 h-8 w-8 text-primary" />
              Auction Calendar
            </h1>
            <p className="text-muted-foreground font-medium">
              {isAdmin 
                ? "Production Desk: Manage and schedule all site-wide auction events."
                : "UK Standard: View all upcoming and scheduled property auctions."
              }
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setAddDialogOpen(true)} className="shadow-md">
              <PlusCircle className="mr-2 h-4 w-4" />
              Schedule New Auction
            </Button>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Sidebar Column (Left) */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="border-l-4 border-l-secondary shadow-sm">
                    <CardHeader className="pb-3 bg-secondary/5">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center">
                            <Bookmark className="mr-2 h-4 w-4 text-secondary" />
                            Official 2025 Schedule
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <ScrollArea className="h-[280px] pr-4">
                            <div className="space-y-4">
                                {upcomingOfficialDates.length > 0 ? upcomingOfficialDates.map((event, i) => (
                                    <div key={i} className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">{event.title}</p>
                                        <div className="flex items-center justify-between">
                                            <Badge variant="secondary" className="text-[9px] h-4 px-1">Fixed</Badge>
                                            <span className="text-[10px] font-mono font-bold text-muted-foreground">
                                                {format(new Date(event.date), 'dd/MM/yy')}
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-[11px] text-muted-foreground italic">Cycle complete or dates pending.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-primary shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center">
                            <Info className="mr-2 h-4 w-4 text-primary" />
                            Auction Methods
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {auctionSelectionNotes.map((note) => (
                            <div key={note.title} className="p-2 rounded-md bg-muted/30 border border-transparent hover:border-primary/20 transition-colors">
                                <p className="text-[11px] font-bold text-slate-900">{note.title}</p>
                                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">{note.description}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Main Calendar Column (Central) */}
            <Card className="lg:col-span-3 shadow-lg border-t-4 border-t-primary flex flex-col h-full min-h-[700px]">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/5 py-4">
                    <CardTitle className="text-lg font-bold text-slate-900">
                        {new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(currentMonth)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevMonth} disabled={isSameMonth(currentMonth, sixMonthsAgo)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs font-bold" onClick={() => setCurrentMonth(startOfMonth(today))}>
                            Today
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextMonth} disabled={isSameMonth(currentMonth, twelveMonthsHence)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col">
                    <Calendar
                        mode="single"
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        components={{
                            Day: ({ date, displayMonth }) => <DayWithEvents date={date} displayMonth={displayMonth} />
                        }}
                        className="p-0 w-full h-full"
                        classNames={{
                            months: "w-full h-full",
                            month: "w-full h-full flex flex-col",
                            table: "w-full flex-1 border-collapse",
                            head_row: "flex w-full bg-slate-50 border-b",
                            head_cell: "flex-1 text-muted-foreground font-bold text-[10px] uppercase py-3 text-center",
                            row: "flex w-full border-b last:border-0",
                            cell: "flex-1 h-24 md:h-32 p-0 relative border-r last:border-r-0 overflow-hidden",
                            day: 'h-full w-full relative group hover:bg-muted/50 transition-colors',
                            day_outside: 'bg-muted/20 opacity-50 pointer-events-none',
                        }}
                    />
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
