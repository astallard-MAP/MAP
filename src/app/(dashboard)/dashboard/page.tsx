"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card"
import { 
  PlusCircle, 
  Building, 
  UserCheck, 
  Wrench, 
  Loader2,
  Gavel,
  CheckCircle2,
  ListTodo,
  FileEdit,
  UserPlus2,
  ArrowRight,
  Package,
  Lightbulb,
  LifeBuoy,
  Eye,
  Bookmark,
  TrendingUp,
  Award,
  UserCog,
  History,
  Clock
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import Link from "next/link"
import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from "../../../firebase";
import { AddAgencyDialog } from "../../../components/AddAgencyDialog";
import { Organisation, Property, PublicUserProfile, AuctionEvent, AccessRequest, Suggestion } from "../../../lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { where, orderBy, Timestamp, query, collection, doc } from "firebase/firestore";
import { usePermissions } from "../../../context/PermissionContext";
import { SuggestionBox } from "../../../components/SuggestionBox";
import { summariseAndSaveNews } from "../../../app/actions/server-actions";
import { useToast } from "../../../hooks/use-toast";
import { AuctionNews } from "../../../components/AuctionNews";
import { OFFICIAL_AUCTION_DATES } from "../../../lib/constants";
import { isAfter, format } from "date-fns";
import { AnalogueClock } from "../../../components/AnalogueClock";
import { DailyGameWidget } from "../../../components/DailyGameWidget";
import { DailyQuizWidget } from "../../../components/DailyQuizWidget";

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" } = {
    Draft: "secondary",
    Submitted: "secondary",
    Published: "default",
    Available: "default",
    Sold: "default",
    "Contracts Exchanged": "default",
    Completed: 'default',
    Unsold: "destructive",
};

const AdminToolsCard = () => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        toast({
            title: "News Aggregation Started",
            description: "The AI is scanning RSS feeds. This may take a few moments."
        });

        try {
            const result = await summariseAndSaveNews();
            if (result.success) {
                toast({
                    title: "News Updated Successfully",
                    description: "A new summary has been generated and published.",
                });
            } else {
                throw new Error(result.error || "An unknown error occurred.");
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "AI Summarisation Failed",
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3 border-b bg-muted/5">
                <CardTitle className="flex items-center text-sm font-bold uppercase tracking-widest"><Wrench className="mr-2 h-4 w-4 text-primary"/>Admin Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                <div>
                    <h4 className="font-bold text-xs">AI News Generator</h4>
                    <p className="text-[10px] text-muted-foreground mt-1 mb-3">
                        Trigger Frank AI to scan RSS feeds and publish a new intelligence report.
                    </p>
                    <Button onClick={handleSubmit} disabled={isSubmitting} size="sm" className="w-full text-[10px] font-bold h-8">
                        {isSubmitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        {isSubmitting ? "Generating..." : "Run AI News Engine"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

const TasksCard = ({ tasks }: { tasks: any[] }) => {
    return (
        <Card className="h-full shadow-sm border-l-4 border-l-brand-primary">
            <CardHeader className="pb-3 bg-brand-primary/5">
                <CardTitle className="flex items-center text-sm font-bold uppercase tracking-widest"><ListTodo className="mr-2 h-4 w-4 text-brand-primary"/>Action Required</CardTitle>
                <CardDescription className="text-[10px]">
                    Critical production tasks awaiting your authorisation.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                {tasks.length > 0 ? (
                    <div className="space-y-2">
                        {tasks.map((task, i) => (
                            <Link key={i} href={task.link} className="flex items-start gap-3 p-2.5 rounded-lg border hover:bg-muted transition-all group border-transparent hover:border-brand-primary/20">
                                <div className="mt-0.5 text-brand-primary group-hover:scale-110 transition-transform">
                                    {task.icon}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold leading-tight text-slate-900">{task.title}</p>
                                    <p className="text-[9px] text-muted-foreground mt-0.5">{task.description}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Badge variant="secondary" className="font-mono text-[9px] h-4 px-1.5 bg-brand-primary/10 text-brand-primary border-none">{task.count}</Badge>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                        <CheckCircle2 className="h-10 w-10 text-brand-primary mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Audit Clear</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function DashboardPage() {
  const { userProfile, isProfileLoaded } = useUser();
  const { isPermissionsLoaded, isAdmin, isAgencyOwner } = usePermissions();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isAddAgencyOpen, setIsAddAgencyOpen] = useState(false);
  
  const canFetchData = isProfileLoaded && isPermissionsLoaded && (isAdmin || !!userProfile?.organisationId);
  
  const orgDocRef = useMemoFirebase(() => {
    if (!canFetchData || !firestore || !userProfile?.organisationId) return null;
    return doc(firestore, 'organisations', userProfile.organisationId);
  }, [canFetchData, firestore, userProfile?.organisationId]);

  const { data: userOrg } = useDoc<Organisation>(orgDocRef);

  const allPropertiesQuery = useMemoFirebase(() => {
    if (!canFetchData || !firestore) return null;
    const baseQuery = collection(firestore, 'properties');
    if (!isAdmin && userProfile?.organisationId) {
      return query(baseQuery, where("organisationId", "==", userProfile.organisationId));
    }
    return baseQuery;
  }, [canFetchData, firestore, isAdmin, userProfile?.organisationId]);

  const { data: allProperties, isLoading: propsLoading } = useCollection<Property>(allPropertiesQuery);

  const thirtyDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return Timestamp.fromDate(date);
  }, []);

  const recentSubmissionsQuery = useMemoFirebase(() => {
     if (!canFetchData || !firestore) return null;
     const baseQuery = collection(firestore, 'properties');
     const constraints = [
        where('status', 'in', ['Published', 'Available']),
        where('updatedAt', '>=', thirtyDaysAgo),
        orderBy('updatedAt', 'desc')
     ];
     if (!isAdmin && userProfile?.organisationId) {
        constraints.push(where("organisationId", "==", userProfile.organisationId));
     }
     return query(baseQuery, ...constraints);
  }, [canFetchData, firestore, isAdmin, userProfile?.organisationId, thirtyDaysAgo]);

  const { data: recentSubmissions, isLoading: recentSubmissionsLoading } = useCollection<Property>(recentSubmissionsQuery);

  const organisationsQuery = useMemoFirebase(() => {
    if (!canFetchData || !isAdmin || !firestore) return null;
    return collection(firestore, 'organisations');
  }, [canFetchData, isAdmin, firestore]);

  const { data: organisations, isLoading: orgsLoading } = useCollection<Organisation>(organisationsQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!canFetchData || !isAdmin || !firestore) return null;
    return collection(firestore, 'publicUsers');
  }, [canFetchData, isAdmin, firestore]);

  const { data: users, isLoading: usersLoading } = useCollection<PublicUserProfile>(usersQuery);

  const accessRequestsQuery = useMemoFirebase(() => {
    if (!canFetchData || !isAdmin || !firestore) return null;
    return query(collection(firestore, 'accessRequests'), where('status', '==', 'pending'));
  }, [canFetchData, isAdmin, firestore]);
  const { data: pendingAccessRequests } = useCollection<AccessRequest>(accessRequestsQuery);

  const suggestionsQuery = useMemoFirebase(() => {
    if (!canFetchData || !isAdmin || !firestore) return null;
    return query(collection(firestore, 'suggestions'), where('status', '==', 'new'));
  }, [canFetchData, isAdmin, firestore]);
  const { data: newSuggestions } = useCollection<Suggestion>(suggestionsQuery);

  const nextOfficialAuction = useMemo(() => {
    const today = new Date();
    return OFFICIAL_AUCTION_DATES.find(d => isAfter(new Date(d.date), today));
  }, []);

  const kpis = useMemo(() => {
    const properties = allProperties || [];
    const submittedForReview = properties.filter(p => p.status === 'Submitted').length;
    
    // DEFINITIVE PRODUCTION STATS - FACTUAL RECORD OF ACHIEVEMENT
    return {
      auctionsHeld: 97,
      propertiesListed: 939,
      propertiesSold: 661,
      successRate: 72,
      totalRaised: "£128,565,280",
      rankingPoints: userProfile?.rankingPoints || 0,
      drafts: properties.filter(p => p.status === 'Draft').length,
      submittedForReview
    };
  }, [allProperties, userProfile]);

  const tasks = useMemo(() => {
    const list = [];

    const isProfileIncomplete = !userProfile?.telephone || !userProfile?.address?.addressLine1;
    if (isProfileIncomplete) {
        list.push({
            title: "Setup Personal Profile",
            description: "Complete your contact and address details.",
            count: "!",
            icon: <UserCog className="h-4 w-4" />,
            link: "/dashboard/settings"
        });
    }

    if (isAgencyOwner) {
        const isOrgIncomplete = !userOrg?.companyRegistrationNumber || !userOrg?.website;
        if (isOrgIncomplete) {
            list.push({
                title: "Setup Company Profile",
                description: "Complete your agency's regulatory and brand details.",
                count: "!",
                icon: <Building className="h-4 w-4" />,
                link: "/dashboard/organisation"
            });
        }
    }

    if (isAdmin) {
        if (kpis.submittedForReview > 0) {
            list.push({
                title: "Lot Audit Required",
                description: "Properties awaiting TAD approval.",
                count: kpis.submittedForReview,
                icon: <Gavel className="h-4 w-4" />,
                link: "/dashboard/review-properties?status=Submitted"
            });
        }
        if (pendingAccessRequests && pendingAccessRequests.length > 0) {
            list.push({
                title: "Agency Access Requests",
                description: "New organisations joining the network.",
                count: pendingAccessRequests.length,
                icon: <UserPlus2 className="h-4 w-4" />,
                link: "/dashboard/access-requests"
            });
        }
        if (newSuggestions && newSuggestions.length > 0) {
            list.push({
                title: "Feedback Engagement",
                description: "Unread feature suggestions from users.",
                count: newSuggestions.length,
                icon: <Lightbulb className="h-4 w-4" />,
                link: "/dashboard/suggestions"
            });
        }
    } else {
        if (kpis.drafts > 0) {
            list.push({
                title: "Lot Assembly",
                description: "Property drafts awaiting final details.",
                count: kpis.drafts,
                icon: <FileEdit className="h-4 w-4" />,
                link: "/dashboard/properties"
            });
        }
        list.push({
            title: "Frank AI Support",
            description: "Chat with our virtual expert.",
            count: "!",
            icon: <LifeBuoy className="h-4 w-4" />,
            link: "/dashboard/support"
        });
    }
    return list;
  }, [isAdmin, isAgencyOwner, userProfile, userOrg, kpis, pendingAccessRequests, newSuggestions]);

  const isLoading = !isProfileLoaded || !isPermissionsLoaded || propsLoading || recentSubmissionsLoading || orgsLoading || usersLoading;

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline mr-2" />Retrieving production stats...</div>;

  return (
    <>
      {isAdmin && userProfile && (
         <AddAgencyDialog 
            isOpen={isAddAgencyOpen}
            onOpenChange={setIsAddAgencyOpen}
          />
      )}
      <div className="flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline text-slate-900">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Production Intel for {userProfile?.firstName || 'User'}.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end border-r pr-6 border-slate-200">
                <div className="flex items-center gap-1.5 text-brand-primary">
                    <Award className="h-4 w-4" />
                    <span className="text-xl font-black tabular-nums tracking-tighter">{kpis.rankingPoints}</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Portal Ranking</span>
            </div>
            <div className="hidden md:block">
                <AnalogueClock />
            </div>
          </div>
        </header>

        {/* DEFINITIVE PERFORMANCE KPI ROW */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="border-l-4 border-l-brand-primary shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Auctions Held</CardTitle>
                    <Gavel className="h-4 w-4 text-brand-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-slate-900">{kpis.auctionsHeld}</div>
                    <p className="text-[9px] text-muted-foreground font-medium mt-1 uppercase">Definitive record</p>
                </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Properties Listed</CardTitle>
                    <Building className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-slate-900">{kpis.propertiesListed}</div>
                    <p className="text-[9px] text-muted-foreground font-medium mt-1 uppercase">Master inventory</p>
                </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Properties Sold</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-slate-900">{kpis.propertiesSold}</div>
                    <p className="text-[9px] text-muted-foreground font-medium mt-1 uppercase">Successful completions</p>
                </CardContent>
            </Card>
            <Card className="border-l-4 border-l-brand-secondary shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Success Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-brand-secondary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-slate-900">{kpis.successRate}%</div>
                    <p className="text-[9px] text-muted-foreground font-medium mt-1 uppercase">Conversion metric</p>
                </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Raised</CardTitle>
                    <Award className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-black text-slate-900 tabular-nums">{kpis.totalRaised}</div>
                    <p className="text-[9px] text-muted-foreground font-medium mt-1 uppercase">Capital audit</p>
                </CardContent>
            </Card>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
            <Button asChild className="h-9 text-xs font-bold shadow-md">
                <Link href="/dashboard/submit-property">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add a Property
                </Link>
            </Button>
            
            {isAdmin && (
              <>
                <Button variant="outline" onClick={() => setIsAddAgencyOpen(true)} className="h-9 text-xs font-bold border-2 border-slate-200">
                  <Building className="mr-2 h-4 w-4 text-primary" /> Add an Agency
                </Button>
                <Button asChild variant="outline" className="h-9 text-xs font-bold border-2 border-slate-200">
                  <Link href="/dashboard/review-properties?status=Submitted">
                     <UserCheck className="mr-2 h-4 w-4 text-primary" /> Review Submissions
                  </Link>
                </Button>
              </>
            )}
            
            <Badge variant="outline" className="h-9 px-4 border-2 border-brand-secondary/20 flex items-center gap-2">
                <Bookmark className="h-3.5 w-3.5 text-brand-secondary" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Next Official: {nextOfficialAuction ? format(new Date(nextOfficialAuction.date), 'dd/MM/yyyy') : 'TBC'}</span>
            </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 grid gap-6">
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    <TasksCard tasks={tasks} />
                    <DailyGameWidget />
                    <DailyQuizWidget />
                </div>
                <Card>
                    <CardHeader className="pb-3 border-b bg-muted/5">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center">
                            <TrendingUp className="mr-2 h-4 w-4 text-primary"/> Recently Approved Lots
                        </CardTitle>
                        <CardDescription className="text-[10px]">Approved for production in the last 30 days.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <Table>
                            <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-[10px] font-bold uppercase">Address</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase">Status</TableHead>
                                <TableHead className="text-right text-[10px] font-bold uppercase">Audit</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {recentSubmissions && recentSubmissions.length > 0 ? (
                                recentSubmissions.map(property => (
                                    <TableRow key={property.id} className="group transition-colors">
                                        <TableCell className="font-bold text-[11px] py-3 text-slate-900">
                                            {property.address?.addressLine1 || 'Unknown Address'}
                                            {property.address?.postcode ? `, ${property.address.postcode}` : ''}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <Badge variant={statusVariantMap[property.status] || 'secondary'} className="text-[9px] px-1.5 h-4 font-bold border-none">{property.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right py-3">
                                            <Button variant="ghost" size="icon" asChild className="h-7 w-7 group-hover:bg-brand-primary group-hover:text-white transition-all">
                                                <Link href={`/dashboard/properties/${property.id}`}>
                                                    <Eye className="h-3 w-3" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-xs text-muted-foreground italic">
                                        No recently approved properties.
                                    </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            
            <div className="space-y-6">
                <AuctionNews latestOnly={true} />
                <SuggestionBox />
                {isAdmin && <AdminToolsCard />}
            </div>
        </div>
      </div>
    </>
  )
}
