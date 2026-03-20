"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { type SolicitorDocument, type Property } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentEditor } from "@/components/editor/DocumentEditor";
import { doc, setDoc, collection, serverTimestamp, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, FileCheck, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * @fileOverview Production Document Editor for MAP261125.
 * Features strict type-safety and null-safety protocols for legal conditions assembly.
 */
export default function DocumentEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const { userProfile } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const isNew = id === 'new';
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [status, setStatus] = useState<'Draft' | 'Final'>('Draft');
  const [isSaving, setIsSaving] = useState(false);

  const docRef = useMemoFirebase(() => {
    if (!firestore || isNew) return null;
    return doc(firestore, 'legalDocuments', id as string);
  }, [firestore, id, isNew]);

  const { data: existingDoc, isLoading: docLoading } = useDoc<SolicitorDocument>(docRef);

  const propsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.solicitorFirmId) return null;
    return query(
      collection(firestore, 'properties'),
      where('solicitorFirmId', '==', userProfile.solicitorFirmId)
    );
  }, [firestore, userProfile?.solicitorFirmId]);

  const { data: properties } = useCollection<Property>(propsQuery);

  useEffect(() => {
    if (existingDoc) {
      // Clinical safety fallbacks to satisfy strict string assignment requirements
      setTitle(existingDoc.title || "");
      setContent(existingDoc.content || "");
      setPropertyId(existingDoc.propertyId || "");
      setStatus(existingDoc.status || "Draft");
    }
  }, [existingDoc]);

  const handleSave = async (isFinal = false) => {
    if (!firestore || !userProfile) return;
    if (!title || !propertyId) {
      toast({ variant: 'destructive', title: "Missing details", description: "Title and Property are required." });
      return;
    }

    setIsSaving(true);
    const targetId = isNew ? doc(collection(firestore, 'legalDocuments')).id : id as string;
    const finalDocRef = doc(firestore, 'legalDocuments', targetId);
    
    const selectedProp = properties?.find(p => p.id === propertyId);

    const payload: Partial<SolicitorDocument> = {
      title,
      content,
      propertyId,
      propertyName: selectedProp ? `${selectedProp.address.addressLine1}, ${selectedProp.address.postcode}` : "Unknown Property",
      status: isFinal ? 'Final' : status,
      updatedAt: serverTimestamp() as any,
    };

    if (isNew) {
      payload.id = targetId;
      payload.solicitorFirmId = userProfile.solicitorFirmId;
      payload.authorUid = userProfile.uid;
      payload.authorName = userProfile.displayName;
      payload.createdAt = serverTimestamp() as any;
    }

    try {
      await setDoc(finalDocRef, payload, { merge: true });
      toast({ title: isFinal ? "Document Finalized" : "Draft Saved" });
      if (isNew) router.push(`/dashboard/solicitor/editor/${targetId}`);
    } catch (error) {
      toast({ variant: 'destructive', title: "Save Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  if (docLoading && !isNew) {
    return <div className="p-8 text-center flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin mr-2"/>Initialising Document Engine...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <header className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline text-slate-900">
            {isNew ? "Assemble New Legal Document" : `Editing: ${title}`}
          </h1>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">UK-EN: Production Assembly Desk.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card className="shadow-lg border-t-4 border-t-primary bg-white">
            <CardHeader>
              <CardTitle>Document Content</CardTitle>
              <CardDescription>Enter the rich-text conditions for the property lot.</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentEditor 
                content={content} 
                onChange={setContent} 
                placeholder="Enter special conditions or legal text here..."
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs uppercase font-bold text-muted-foreground">Document Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Special Conditions"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="property" className="text-xs uppercase font-bold text-muted-foreground">Associated Property</Label>
                <Select value={propertyId} onValueChange={setPropertyId}>
                  <SelectTrigger id="property" className="h-9 text-sm">
                    <SelectValue placeholder="Select lot..." />
                  </SelectTrigger>
                  <SelectContent>
                    {properties?.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.address.addressLine1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Status</Label>
                <Badge variant={status === 'Draft' ? 'secondary' : 'default'} className="block w-fit px-2 h-6">
                  {status}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-4">
              <Button onClick={() => handleSave(false)} className="w-full h-10 font-bold" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Draft
              </Button>
              <Button onClick={() => handleSave(true)} variant="secondary" className="w-full h-10 font-bold" disabled={isSaving}>
                <FileCheck className="mr-2 h-4 w-4" /> Finalize Document
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
