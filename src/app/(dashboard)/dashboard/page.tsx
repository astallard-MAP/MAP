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
  Clock,
  PoundSterling
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import Link from "next/link"
import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from "../../../firebase";
import { AddAgencyDialog } from "../../../components/AddAgencyDialog";
import { Organisation, Property, PublicUserProfile, AuctionEvent, AccessRequest, Suggestion } from "../../../lib/types";
import { SystemAuditLogs } from "../../../components/SystemAuditLogs";
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
import { FrankGameOfTheDayWidget } from "../../../components/FrankGameOfTheDayWidget";
import { DashboardOwner } from "../../../components/dashboards/DashboardOwner";
import { DashboardManager } from "../../../components/dashboards/DashboardManager";
import { DashboardNegotiator } from "../../../components/dashboards/DashboardNegotiator";
import { DashboardAdmin } from "../../../components/dashboards/DashboardAdmin";
import { useBrand } from "../../../context/BrandContext";

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
  const { isPermissionsLoaded, isAdmin, isAgencyOwner, isGlobalAdmin } = usePermissions();
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

  const renderTailoredDashboard = () => {
    if (!userProfile) return null;
    const role = userProfile.role;

    if (isAdmin || isAgencyOwner || role === 'Agency Owner') {
      return <DashboardOwner userProfile={userProfile} />;
    }
    if (role === 'Regional Manager' || role === 'Area Manager' || role === 'Branch Manager') {
      return <DashboardManager userProfile={userProfile} />;
    }
    if (role === 'Sales Manager' || role === 'Sales Negotiator') {
      return <DashboardNegotiator userProfile={userProfile} />;
    }
    if (role === 'Auction Administrator') {
      return <DashboardAdmin userProfile={userProfile} />;
    }

    return <DashboardNegotiator userProfile={userProfile} />; // Fallback for standard users
  };

  return (
    <>
      {isAdmin && userProfile && (
         <AddAgencyDialog 
            isOpen={isAddAgencyOpen}
            onOpenChange={setIsAddAgencyOpen}
          />
      )}
      <div className="flex flex-col gap-8 pb-12">
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 border-b pb-8 bg-white/50 p-6 rounded-2xl border border-slate-100 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-6">
             <div className="h-20 w-20 rounded-2xl bg-brand-primary flex items-center justify-center text-white shadow-xl shadow-brand-primary/20 ring-4 ring-white">
                {userOrg?.logoUrl ? (
                    <img src={userOrg.logoUrl} alt="Logo" className="h-14 w-14 object-contain" />
                ) : (
                    <Building className="h-10 w-10 text-brand-secondary" />
                )}
             </div>
             <div>
                <h1 className="text-4xl font-black tracking-tighter font-headline text-slate-900 uppercase">
                  Mission Control
                </h1>
                <p className="text-muted-foreground text-sm font-medium italic">
                  Production Intel for {userProfile?.firstName} • {userProfile?.role} @ {userOrg?.name || 'TAD Network'}.
                </p>
             </div>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 border-x px-12 border-slate-100">
                <div className="flex items-center gap-3 group">
                    <Gavel className="h-4 w-4 text-brand-primary group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400 leading-none">Auctions Held</span>
                        <span className="text-lg font-black text-slate-900 tracking-tighter leading-none mt-1">{kpis.auctionsHeld}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 group">
                    <Building className="h-4 w-4 text-brand-secondary group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400 leading-none">Properties Sold</span>
                        <span className="text-lg font-black text-slate-900 tracking-tighter leading-none mt-1">{kpis.propertiesSold}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 group">
                    <TrendingUp className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400 leading-none">Success Rate</span>
                        <span className="text-lg font-black text-slate-900 tracking-tighter leading-none mt-1">{kpis.successRate}%</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 group">
                    <PoundSterling className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400 leading-none">Total Raised</span>
                        <span className="text-lg font-black text-slate-900 tracking-tighter leading-none mt-1">£128.5m</span>
                    </div>
                </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end border-r pr-8 border-slate-200">
                <div className="flex items-center gap-2 text-brand-primary">
                    <Award className="h-5 w-5" />
                    <span className="text-3xl font-black tabular-nums tracking-tighter">{kpis.rankingPoints}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Portal Ranking</span>
            </div>
            <div className="hidden lg:block scale-75 origin-right">
                <AnalogueClock />
            </div>
          </div>
        </header>


        {/* ROLE-SPECIFIC DASHBOARD INJECTION */}
        {renderTailoredDashboard()}

        {/* SHARED INTELLIGENCE FOOTER (Gamification & News) */}
        <div className="grid gap-8 lg:grid-cols-3 pt-8 border-t border-slate-100">
           <div className="lg:col-span-2">
              <FrankGameOfTheDayWidget />
           </div>
           <AuctionNews latestOnly={true} />
        </div>

        {/* SYSTEM TOOLS (Admin / Global Admin Access) */}
        {isAdmin && (
            <div className="grid gap-6 lg:grid-cols-3 mt-8">
                <AdminToolsCard />
                <SuggestionBox />
                {isGlobalAdmin ? (
                    <div className="lg:col-span-1">
                        <SystemAuditLogs />
                    </div>
                ) : (
                    <Card className="shadow-sm border border-slate-200 bg-slate-50 opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-sm font-bold uppercase flex items-center"><History className="mr-2 h-4 w-4" /> System Audit Logs</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 px-8 text-center py-12">
                            <p className="text-xs font-bold text-slate-400">Restricted to Root Administrator</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        )}
      </div>
    </>
  )
}
