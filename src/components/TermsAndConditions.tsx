"use client";

import { useState, useRef, UIEvent } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useFirestore, useUser } from "../firebase";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { useToast } from "../hooks/use-toast";
import { CheckCircle2, ChevronDown } from "lucide-react";

const termsVersion = "1.0";

const getTermsText = () => `MY AUCTION PORTAL - THE AUCTION DEPARTMENT LIMITED
TERMS AND CONDITIONS OF USE (PRODUCTION STANDARD v1.0)

Effective Date: 17th March 2026
________________________________________

1. DEFINITIVE ACCEPTANCE
By accessing My Auction Portal (the "Portal"), you ("Personnel") definitively agree to be bound by these Terms and Conditions and the TAD Privacy Policy.

2. PRODUCTION DATA INTEGRITY
All property listings, seller details, and legal documentation submitted to the Portal must be accurate, verified, and clinicaly aligned with UK Estate Agency standards. Personnel are responsible for the clinical accuracy of all data entry.

3. SECURITY & ACCESS CONTROL
Access is strictly governed by the TAD Security Matrix. Global Admins and TAD Admin personnel possess absolute override permissions. Estate Agency staff are restricted to their assigned production organisations and branches. Unauthorised access attempts are logged for forensic audit.

4. COMMUNICATION RELAY
The Portal utilizes Microsoft Office 365 for production email transmission. Frank Tadsworth-Bids acts as the automated intelligence relay. Personnel consent to receiving production-critical notifications.

5. INTELLECTUAL PROPERTY
The "My Auction Portal" brand, including the Frank Tadsworth-Bids mascot and the Vertex AI intelligence integration, remains the exclusive property of The Auction Department Limited.

6. AUDIT & DISPUTE RESOLUTION
All interactions within the Portal are logged in the master audit trail. In the event of a production dispute, the TAD Global Administrator's log record shall serve as the definitive source of truth.

________________________________________
UK-EN: END OF PRODUCTION TERMS
________________________________________
`;

export function TermsAndConditions({ onAccept }: { onAccept: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const [hasReadToBottom, setHasReadToBottom] = useState(false);
    const { user, userProfile } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleScroll = (e: UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        // Check if the user has reached the bottom (with a small 5px buffer for rounding)
        const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 5;
        if (isAtBottom && !hasReadToBottom) {
            setHasReadToBottom(true);
        }
    };

    const handleAccept = async () => {
        if (!firestore || !user || !userProfile || !hasReadToBottom) return;
        setIsLoading(true);

        const batch = writeBatch(firestore);
        const termsText = getTermsText();

        const acceptanceRef = doc(firestore, 'termsAcceptances', user.uid);
        batch.set(acceptanceRef, {
            userId: user.uid,
            version: termsVersion,
            acceptedAt: serverTimestamp(),
            termsText: termsText
        });

        const userProfileRef = doc(firestore, 'users', user.uid);
        batch.update(userProfileRef, { termsAccepted: true });

        try {
            await batch.commit();
            toast({
                title: "Terms Accepted",
                description: "Success: Your acceptance has been logged in the production audit trail.",
            });
            onAccept();
        } catch (error: any) {
             console.error("Terms error:", error);
             toast({
                variant: "destructive",
                title: "Action Failed",
                description: "Could not log acceptance. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border-t-4 border-t-primary overflow-hidden">
                <CardHeader className="bg-white border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black tracking-tight text-slate-900">Terms & Conditions</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-widest text-primary mt-1">
                                Production Onboarding Protocol
                            </CardDescription>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                    </div>
                </CardHeader>
                
                <div 
                    className="flex-1 overflow-y-auto p-6 bg-slate-50/50"
                    onScroll={handleScroll}
                >
                    <div className="prose prose-slate prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-sm">
                            {getTermsText()}
                        </pre>
                    </div>

                    <div className="mt-12 pt-8 border-t flex flex-col items-center gap-6">
                        {!hasReadToBottom && (
                            <div className="flex flex-col items-center gap-2 text-slate-400 animate-bounce">
                                <span className="text-[10px] font-bold uppercase tracking-widest">Scroll to end to accept</span>
                                <ChevronDown className="h-4 w-4" />
                            </div>
                        )}
                        
                        <Button 
                            onClick={handleAccept} 
                            disabled={isLoading || !hasReadToBottom} 
                            className="w-full h-12 font-black uppercase tracking-widest shadow-lg transition-all"
                            variant={hasReadToBottom ? "default" : "secondary"}
                        >
                            {isLoading ? "Authenticating..." : "I Accept the Production Terms"}
                        </Button>
                        
                        <p className="text-[9px] text-center text-muted-foreground font-medium uppercase tracking-tighter">
                            By clicking accept, a definitive record of your agreement will be stored in the production audit log.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
