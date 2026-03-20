"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser, useAuth, useDoc, useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { updatePassword } from "firebase/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { UserCog, ImageIcon, Moon, Sun, Shield, Loader2, Lock, MailCheck } from "lucide-react";
import { ProfileImageUploadDialog } from "@/components/ProfileImageUploadDialog";
import { EditUserDialog } from "@/components/EditUserDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { type Branch, type Organisation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { doc, collection, updateDoc, serverTimestamp } from "firebase/firestore";

const passwordFormSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export default function SettingsPage() {
  const { user, userProfile, isLoading: userLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [showProfileImageDialog, setShowProfileImageDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const orgDocRef = useMemoFirebase(() => {
    if (!userProfile?.organisationId || !firestore) return null;
    return doc(firestore, 'organisations', userProfile.organisationId);
  }, [userProfile?.organisationId, firestore]);

  const { data: organisation, isLoading: orgLoading } = useDoc<Organisation>(orgDocRef);
  
  const branchesColRef = useMemoFirebase(() => {
    if (!userProfile?.organisationId || !firestore) return null;
    return collection(firestore, 'organisations', userProfile.organisationId, 'branches');
  }, [userProfile?.organisationId, firestore]);

  const { data: subBranches, isLoading: branchesLoading } = useCollection<Branch>(branchesColRef);
  
  const branches = useMemo(() => {
    if (!organisation) return [];
    const ho: Branch = {
      id: 'head-office',
      name: 'Head Office',
      address: organisation.headOfficeAddress,
      contactTelephone: organisation.mainContactTelephone,
      emailAddress: organisation.generalContactEmail,
      status: 'active',
      deletionRequested: false,
    };
    return [ho, ...(subBranches || [])];
  }, [organisation, subBranches]);
  
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { password: "", confirmPassword: "" }
  });

  const handleThemeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    document.documentElement.classList.toggle('dark', checked);
  };

  const handleMarketingToggle = async (checked: boolean) => {
    if (!user || !firestore) return;
    try {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, { 
            marketingConsent: checked,
            updatedAt: serverTimestamp()
        });
        toast({ title: 'Preferences Updated', description: 'Your marketing audit trail has been updated.' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update preferences.' });
    }
  };
  
  const handlePasswordChange = async (values: z.infer<typeof passwordFormSchema>) => {
    if (!auth?.currentUser) return;
    try {
        await updatePassword(auth.currentUser, values.password);
        toast({ title: 'Success', description: 'Password changed successfully.' });
        passwordForm.reset();
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }

  const isLoading = userLoading || orgLoading || branchesLoading;

  if (!mounted) return null;

  return (
    <>
      {user && <ProfileImageUploadDialog isOpen={showProfileImageDialog} onOpenChange={setShowProfileImageDialog} user={user} />}
      {userProfile && !isLoading && (
        <EditUserDialog isOpen={showEditProfileDialog} onOpenChange={setShowEditProfileDialog} userToEditId={userProfile.uid} branches={branches} />
      )}
      
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Settings</h1>
          <p className="text-muted-foreground">Audit Desk: Manage your account and portal preferences.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Profile Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start" onClick={() => setShowEditProfileDialog(true)} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCog className="mr-2" />}
                Edit Profile Details
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setShowProfileImageDialog(true)}><ImageIcon className="mr-2" />Change Avatar</Button>
            </CardContent>
             <CardFooter>
                 <Alert><Shield className="h-4 w-4" /><AlertTitle>Security Info</AlertTitle><AlertDescription>Enforce UK Standard passwords for production safety.</AlertDescription></Alert>
             </CardFooter>
          </Card>
          
          <Card>
             <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
            <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)}>
                    <CardContent className="space-y-4">
                        <FormField control={passwordForm.control} name="password" render={({ field }) => (
                            <FormItem><FormLabel>New Password</FormLabel><FormControl><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="password" {...field} className="pl-10" /></div></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                            <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="password" {...field} className="pl-10" /></div></FormControl><FormMessage /></FormItem>
                        )}/>
                    </CardContent>
                    <CardFooter><Button type="submit" disabled={passwordForm.formState.isSubmitting}>Save New Password</Button></CardFooter>
                </form>
            </Form>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Marketing & Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Marketing Communications</FormLabel>
                    <FormDescription>Receive updates from Frank Tadsworth-Bids and TAD via Mailchimp.</FormDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <MailCheck className="text-muted-foreground h-5 w-5" />
                    <Switch checked={!!userProfile?.marketingConsent} onCheckedChange={handleMarketingToggle} />
                  </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Dark Mode</FormLabel>
                    <FormDescription>Enable the high-performance dark interface.</FormDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className={cn("transition-opacity", isDarkMode ? "opacity-50" : "opacity-100")} />
                    <Switch checked={isDarkMode} onCheckedChange={handleThemeToggle} />
                    <Moon className={cn("transition-opacity", isDarkMode ? "opacity-100" : "opacity-50")} />
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
