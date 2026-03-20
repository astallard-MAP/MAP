"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "../firebase";
import { addDoc, collection, serverTimestamp, doc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { useToast } from "../hooks/use-toast";
import { Lightbulb, Send, Loader2 } from "lucide-react";
import type { Organisation } from "../lib/types";

const SuggestionSchema = z.object({
  suggestionText: z.string().min(10, "Suggestion must be at least 10 characters.").max(1000, "Suggestion cannot exceed 1000 characters."),
});

type SuggestionFormValues = z.infer<typeof SuggestionSchema>;

export function SuggestionBox() {
  const { userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const orgDocRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.organisationId) return null;
    return doc(firestore, 'organisations', userProfile.organisationId);
  }, [firestore, userProfile?.organisationId]);

  const { data: organisation, isLoading: orgLoading } = useDoc<Organisation>(orgDocRef);

  const form = useForm<SuggestionFormValues>({
    resolver: zodResolver(SuggestionSchema),
    defaultValues: {
      suggestionText: "",
    },
  });

  const handleSubmit = async (data: SuggestionFormValues) => {
    if (!firestore || !userProfile || !organisation) {
        toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You must be authenticated to submit feedback.",
        });
        return;
    }
    
    setIsLoading(true);

    try {
        const newSuggestion = {
            suggestionText: data.suggestionText,
            submittedBy: userProfile.uid,
            userName: userProfile.displayName || 'Unknown User',
            organisationId: userProfile.organisationId,
            organisationName: organisation.name,
            submittedAt: serverTimestamp(),
            status: 'new' as const,
            importance: 'Low' as const,
        };

        await addDoc(collection(firestore, 'suggestions'), newSuggestion);

        toast({
            title: "Thank You",
            description: "Your suggestion has been logged for review by the TAD development team.",
        });
        form.reset();

    } catch (error) {
        console.error("Suggestion failure:", error);
        toast({
            variant: "destructive",
            title: "Submission Error",
            description: "Could not transmit feedback. Please check your connection.",
        });
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="mr-2" />
          Suggestion Box
        </CardTitle>
        <CardDescription>
          Have an idea for a new feature or an improvement? Let us know!
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent>
            <FormField
              control={form.control}
              name="suggestionText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Your Suggestion</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your idea..."
                      rows={5}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || orgLoading} className="ml-auto">
              {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Send className="ml-2 h-4 w-4" />}
              {isLoading ? "Transmitting..." : "Submit Suggestion"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
