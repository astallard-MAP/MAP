"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Rss, MailCheck, Trash2, ShieldAlert, Gamepad2, BrainCircuit } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/context/PermissionContext";
import { summariseAndSaveNews, syncUsersToMailchimp, wipePortalData } from "@/app/actions/server-actions";
import { getDailyGame } from "@/app/actions/game-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * @fileOverview Production Admin Tools Desk.
 * UK-EN: Corrected spelling for Summarisation and Synchronisation.
 */
export default function AdminToolsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAdmin, isGlobalAdmin } = usePermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [isGeneratingGame, setIsGeneratingGame] = useState(false);
  const [suggestedGame, setSuggestedGame] = useState("Franagram");

  const handleRunNews = async () => {
    setIsSubmitting(true);
    try {
      toast({ title: "News Aggregation Started", description: "The AI is scanning RSS feeds..." });
      const result = await summariseAndSaveNews();
      if (result.success) {
        toast({ title: "Success", description: "A new summary has been generated and published." });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: "AI Failed", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateGame = async () => {
    setIsGeneratingGame(true);
    try {
      const res = await getDailyGame(suggestedGame);
      if (res.success) {
        toast({ title: "Frank says: Game Generated!", description: `New ${suggestedGame} published for today.` });
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "AI Failure", description: "Could not generate puzzle." });
    } finally {
      setIsGeneratingGame(false);
    }
  };

  const handleMailchimpSync = async () => {
    setIsSyncing(true);
    try {
      toast({ title: "Syncing Mailchimp", description: "Propagating active users to master list..." });
      const result = await syncUsersToMailchimp();
      if (result.success) {
        toast({ title: "Sync Complete", description: `Successfully synchronised ${result.count} users.` });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: error.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleWipeData = async () => {
    setIsWiping(true);
    try {
      const result = await wipePortalData();
      if (result.success) {
        toast({ title: "Portal Reset Complete", description: "All test data and orphan organisations have been clinicaly purged." });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Reset Failed", description: error.message });
    } finally {
      setIsWiping(false);
    }
  };

  if (!isAdmin) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Tools</h1>
          <p className="text-muted-foreground">Audit Desk: Manage portal content and integration services.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><Rss className="mr-3 text-primary" /> AI News Generator</CardTitle>
            <CardDescription>Manually trigger the Frank AI news aggregation engine.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRunNews} disabled={isSubmitting} className="w-full font-bold">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Generating..." : "Run AI News Engine"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><Gamepad2 className="mr-3 text-brand-secondary" /> Daily Game Management</CardTitle>
            <CardDescription>Suggest a puzzle type for Frank AI to generate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={suggestedGame} onValueChange={setSuggestedGame}>
              <SelectTrigger className="font-medium">
                <SelectValue placeholder="Select Game Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Franagram">Franagram (Anagram)</SelectItem>
                <SelectItem value="WordGrid">Word Grid (Sudoku Style)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleGenerateGame} disabled={isGeneratingGame} variant="secondary" className="w-full font-bold border-2 border-brand-secondary/20">
              {isGeneratingGame && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Game of the Day
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><MailCheck className="mr-3 text-accent" /> Mailchimp Sync</CardTitle>
            <CardDescription>Synchronise active production users with Mailchimp.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleMailchimpSync} disabled={isSyncing} variant="outline" className="w-full font-bold border-2 border-accent/30 text-accent hover:bg-accent/5">
              {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSyncing ? "Synchronising..." : "Sync User Registry"}
            </Button>
          </CardContent>
        </Card>

        {isGlobalAdmin && (
          <Card className="border-destructive/50 shadow-md md:col-span-2 lg:col-span-3">
            <CardHeader className="bg-destructive/5">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center text-destructive text-lg">
                            <Trash2 className="mr-3 h-5 w-5" /> Production Reset Tool
                        </CardTitle>
                        <CardDescription className="text-xs font-bold text-destructive/70">
                            Forensic Wipe: Clinically purge test records and orphan organisations.
                        </CardDescription>
                    </div>
                    <BrainCircuit className="h-10 w-10 text-destructive/20" />
                </div>
            </CardHeader>
            <CardContent className="pt-6">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isWiping} className="font-black uppercase tracking-widest shadow-lg">
                    {isWiping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                    Authorise Production Wipe
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-black text-destructive">CRITICAL ACCESS: Authorise Forensic Purge?</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-900 font-medium">
                      This action will permanently delete all property listings, access requests, suggestions, and intelligence telemetry. 
                      It will specifically target and purge <strong className="text-destructive">'Essex Properties'</strong> and all unknown test organisations while preserving <strong className="text-brand-primary">'The Auction Department'</strong> as the immutable master core.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="font-bold">Cancel Audit</AlertDialogCancel>
                    <AlertDialogAction onClick={handleWipeData} className="bg-destructive text-white hover:bg-destructive/90 font-black">
                      Definitively Purge Production
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
