"use client";
import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { doc } from "firebase/firestore";
import {
  Home,
  LogOut,
  ImageIcon,
  Building,
  UserCog,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Calendar as CalendarIcon,
  Download,
  Users,
  Gavel,
  UserPlus2,
  FileText,
  Lightbulb,
  FileSearch,
  Wrench,
  History,
  LifeBuoy
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
} from "../../components/ui/sidebar";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { useToast } from "../../hooks/use-toast";
import OrganisationLogo from "../../components/OrganisationLogo";
import { useUser, useFirestore, useAuth, useMemoFirebase, useDoc } from "../../firebase";
import { TermsAndConditions } from "../../components/TermsAndConditions";
import { ProfileImageUploadDialog } from "../../components/ProfileImageUploadDialog";
import { EditUserDialog } from "../../components/EditUserDialog";
import { UserRoleSwitcher } from "../../components/UserRoleSwitcher";
import { usePermissions } from "../../context/PermissionContext";
import { useImpersonation } from "../../context/ImpersonationContext";
import type { Organisation, UserRole } from "../../lib/types";
import { format } from "date-fns";
import ErrorBoundary from "../../components/ErrorBoundary";
import { TooltipProvider } from "../../components/ui/tooltip";

/**
 * @fileOverview Production Dashboard Layout for MAP261125.
 * Forensic: Profile top-right, Utilities bottom-left, Mobile Digital Clock only.
 */
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { userProfile, user, isProfileLoaded } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();
  const { isAdmin, isAgencyOwner, isManager, effectiveRole } = usePermissions();
  const { isImpersonating, stopImpersonating } = useImpersonation();

  const [showProfileImageDialog, setShowProfileImageDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [mountedTime, setMountedTime] = useState<Date | null>(null);

  useEffect(() => {
    setMountedTime(new Date());
    const timer = setInterval(() => setMountedTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const orgDocRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.organisationId) return null;
    return doc(firestore, "organisations", userProfile.organisationId);
  }, [firestore, userProfile?.organisationId]);

  const { data: organisation } = useDoc<Organisation>(orgDocRef);

  const primaryNav = useMemo(() => [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Properties", href: "/dashboard/properties", icon: Building },
    { name: "Auction Academy", href: "/dashboard/auction-academy", icon: GraduationCap },
    { name: "Auction Calendar", href: "/dashboard/auction-calendar", icon: CalendarIcon },
    { name: "Auction History", href: "/dashboard/auction-history", icon: History },
  ], []);

  const adminAuditNav = useMemo(() => {
    if (!isAdmin) return [];
    return [
      { name: "Lot Audit", href: "/dashboard/review-properties?status=Submitted", icon: Gavel },
      { name: "Access Requests", href: "/dashboard/access-requests", icon: UserPlus2 },
      { name: "Document Templates", href: "/dashboard/document-management", icon: FileText },
      { name: "Complaints Register", href: "/dashboard/complaints", icon: ShieldCheck },
    ];
  }, [isAdmin]);

  const adminSystemNav = useMemo(() => {
    if (!isAdmin) return [];
    return [
      { name: "User Directory", href: "/dashboard/users", icon: Users },
      { name: "Asset Downloads", href: "/dashboard/downloads", icon: Download },
      { name: "Feedback Inbox", href: "/dashboard/suggestions", icon: Lightbulb },
      { name: "Diagnostics", href: "/dashboard/diagnostics", icon: FileSearch },
      { name: "Admin Tools", href: "/dashboard/admin-tools", icon: Wrench },
    ];
  }, [isAdmin]);

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      // character-accurate session clearance
      document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax; Secure";
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast({ variant: "destructive", title: "Sign out failed" });
    }
  };

  const personaForSwitcher = userProfile?.role || 'Standard User';

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <SidebarProvider>
          {user && (
            <ProfileImageUploadDialog 
              isOpen={showProfileImageDialog} 
              onOpenChange={setShowProfileImageDialog} 
              user={user} 
            />
          )}
          {userProfile && (
            <EditUserDialog 
              isOpen={showEditProfileDialog} 
              onOpenChange={setShowEditProfileDialog} 
              userToEditId={userProfile.uid}
              branches={[]}
            />
          )}
          <div className="flex min-h-screen w-full bg-slate-50/50">
            <Sidebar collapsible="icon" className="border-r border-slate-200 shadow-sm">
              <SidebarHeader className="h-16 border-b border-slate-100 px-4 flex items-center">
                <OrganisationLogo />
              </SidebarHeader>
              <SidebarContent className="py-4">
                <SidebarGroup>
                  <SidebarMenu>
                    {primaryNav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.name}>
                          <Link href={item.href} className="flex items-center gap-3">
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                    {(effectiveRole === 'Solicitor' || isAdmin) && (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === "/dashboard/solicitor"} tooltip="Legal Workspace">
                          <Link href="/dashboard/solicitor" className="flex items-center gap-3">
                            <Briefcase className="h-4 w-4" />
                            <span>Legal Workspace</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                    {(isAdmin || isAgencyOwner || isManager) && (
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === "/dashboard/organisation"} tooltip="Organisation">
                          <Link href="/dashboard/organisation" className="flex items-center gap-3">
                            <Building className="h-4 w-4" />
                            <span>Organisation</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroup>

                {isAdmin && (
                  <>
                    <SidebarGroup>
                      <SidebarGroupLabel>Audit Desk</SidebarGroupLabel>
                      <SidebarMenu>
                        {adminAuditNav.map((item) => (
                          <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton asChild isActive={pathname?.startsWith(item.href.split('?')[0])} tooltip={item.name}>
                              <Link href={item.href} className="flex items-center gap-3">
                                <item.icon className="h-4 w-4" />
                                <span>{item.name}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroup>

                    <SidebarGroup>
                      <SidebarGroupLabel>System Management</SidebarGroupLabel>
                      <SidebarMenu>
                        {adminSystemNav.map((item) => (
                          <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.name}>
                              <Link href={item.href} className="flex items-center gap-3">
                                <item.icon className="h-4 w-4" />
                                <span>{item.name}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroup>
                  </>
                )}
              </SidebarContent>
              
              <SidebarFooter className="p-2 border-t border-slate-100">
                {isAdmin && <div className="px-2 mb-2"><UserRoleSwitcher originalRole={personaForSwitcher as UserRole} /></div>}
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/complaints-procedure"} tooltip="Complaints Procedure">
                      <Link href="/complaints-procedure">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Complaints Procedure</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/dashboard/support"} tooltip="Support">
                      <Link href="/dashboard/support">
                        <LifeBuoy className="h-4 w-4" />
                        <span>Support</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/dashboard/settings"} tooltip="Account Settings">
                      <Link href="/dashboard/settings">
                        <UserCog className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleSignOut} className="text-destructive hover:text-destructive hover:bg-destructive/5" tooltip="Sign Out">
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
            </Sidebar>

            <SidebarInset className="flex flex-col flex-1">
              <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <div className="h-4 w-[1px] bg-slate-200 hidden md:block" />
                  <div className="md:hidden flex flex-col items-start leading-none">
                    <span className="text-xs font-bold font-mono">
                      {mountedTime ? format(mountedTime, "HH:mm") : "--:--"}
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                      {mountedTime ? format(mountedTime, "dd/MM/yyyy") : ""}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {isImpersonating && (
                    <div className="bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-2 animate-pulse hidden md:flex">
                      <ShieldCheck className="h-4 w-4 text-amber-600" />
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
                        Auditing as: {userProfile?.role}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={stopImpersonating}
                        className="h-6 px-2 text-[10px] font-bold hover:bg-amber-100"
                      >
                        STOP
                      </Button>
                    </div>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-10 px-2 hover:bg-slate-100 flex items-center gap-3">
                        <div className="flex flex-col items-end text-right leading-tight">
                          <span className="text-sm font-bold truncate max-w-[150px]">{userProfile?.displayName}</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{userProfile?.role}</span>
                        </div>
                        <Avatar className="h-8 w-8 border-2 border-primary/20">
                          <AvatarImage src={userProfile?.photoURL} />
                          <AvatarFallback className="bg-primary text-white text-xs font-bold">
                            {userProfile?.displayName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/settings" className="flex items-center">
                            <UserCog className="mr-2 h-4 w-4" /> Account Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowProfileImageDialog(true)}>
                        <ImageIcon className="mr-2 h-4 w-4" /> Change Photo
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                        <LogOut className="mr-2 h-4 w-4" /> Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </header>
              
              <main className="flex-1 p-6 overflow-y-auto">
                {children}
              </main>
            </SidebarInset>
          </div>
          {isProfileLoaded && !userProfile?.termsAccepted && <TermsAndConditions onAccept={() => {}} />}
        </SidebarProvider>
      </TooltipProvider>
    </ErrorBoundary>
  );
};

export default DashboardLayout;
