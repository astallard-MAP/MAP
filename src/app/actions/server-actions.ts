'use server';

import { summariseNewsFlow } from "@/ai/flows/summarise-news-flow";
import { analyseAmlCaseFlow } from "@/ai/flows/analyse-aml-case-flow";
import rssFeeds from "@/lib/rss-feeds.json";
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeAdminApp } from "@/firebase/server-init";
import { getAuth } from "firebase-admin/auth";
// @ts-ignore
import mailchimp from '@mailchimp/mailchimp_marketing';
import { type SolicitorRanking } from "../../lib/types";
import { priorityAnalysisFlow } from "../../ai/flows/priority-analysis-flow";

/**
 * Automates news aggregation and AI summarisation.
 * character-accurately handles RSS fetch timeouts and robust XML parsing for production stability.
 */
export async function summariseAndSaveNews() {
    let firestore;
    try {
        const app = await initializeAdminApp();
        firestore = getFirestore(app);
        
        console.log("UK-EN: Starting parallel news aggregation for", rssFeeds.feeds.length, "sources.");
        
        // Parallel Clinical Fetch with Individual Timeouts
        const fetchPromises = rssFeeds.feeds.map(async (feed) => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout for each source

                const response = await fetch(feed.url, { 
                    next: { revalidate: 3600 },
                    signal: controller.signal,
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                
                clearTimeout(timeoutId);
                if (!response.ok) return null;
                
                const text = await response.text();
                const items = text.split(/<(?:[a-z0-9]+:)?(?:item|entry)/i).slice(1, 6);
                let intelItems = [];

                for (const item of items) {
                    const titleMatch = item.match(/<(?:[a-z0-9]+:)?title[^>]*>(.*?)<\/(?:[a-z0-9]+:)?title>/i);
                    if (titleMatch && titleMatch[1]) {
                         const title = titleMatch[1]
                            .replace(/<!\[CDATA\[|\]\]>/g, '')
                            .replace(/<[^>]*>?/gm, '')
                            .trim();
                         if (title) intelItems.push(`Source: ${feed.name} - Intel: ${title}`);
                    }
                }
                
                return intelItems.length > 0 ? { name: feed.name, items: intelItems } : null;
            } catch (e) {
                console.warn(`UK-WARN: News Source Offline: ${feed.name}`);
                return null;
            }
        });

        const results = await Promise.allSettled(fetchPromises);
        let allArticlesText = '';
        const sourcesUsed: string[] = [];

        results.forEach(res => {
            if (res.status === 'fulfilled' && res.value) {
                allArticlesText += res.value.items.join('\n') + '\n';
                sourcesUsed.push(res.value.name);
            }
        });

        console.log("UK-EN: Aggregated intel from", sourcesUsed.length, "sources. Sending to AI...");

        const now = new Date();
        const ukTimeStr = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/London',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(now);

        const ukDateStr = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/London',
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(now);

        const summaryResult = await summariseNewsFlow({ 
            articlesContent: allArticlesText || "Steady activity in the UK property auction market.", 
            sources: sourcesUsed.join(', ') || "Market Internal Intelligence",
            currentUkTime: ukTimeStr,
            currentUkDate: ukDateStr
        });
        
        console.log("UK-EN: AI summary generated. Publishing to Firestore...");

        const docRef = await firestore.collection('newsArticles').add({
            ...summaryResult,
            publishedAt: FieldValue.serverTimestamp(),
            author: "Frank Tadsworth-Bids",
            intelCount: sourcesUsed.length
        });

        await firestore.collection('system').doc('newsCron').set({
            lastRun: FieldValue.serverTimestamp(),
            status: 'Success',
            sourcesCount: sourcesUsed.length,
            lastArticleId: docRef.id,
            error: null
        }, { merge: true });
        
        console.log("UK-EN: News Cron successfully completed.");
        return { success: true, data: JSON.parse(JSON.stringify(summaryResult)) };
    } catch (error: any) {
        console.error("UK-DIAGNOSTIC-FAILURE (Forensic Analysis):", error.message);
        console.error("Stack Trace:", error.stack);
        
        if (firestore) {
            await firestore.collection('system').doc('newsCron').set({
                lastRun: FieldValue.serverTimestamp(),
                status: 'Failed',
                error: error.message,
                stack: error.stack?.substring(0, 500) // Buffer summary for Firestore limits
            }, { merge: true });
        }
        return { success: false, error: error.message };
    }
}


export async function wipePortalData() {
    try {
        const app = await initializeAdminApp();
        const firestore = getFirestore(app);
        
        const collectionsToWipe = [
            'properties',
            'accessRequests',
            'suggestions',
            'notifications',
            'invitations',
            'supportChats',
            'legalDocuments',
            'propertySearchProfiles',
            'activityLogs',
            'documentTemplates',
            'newsArticles',
            'dailyGames',
            'gameResults'
        ];

        for (const collectionName of collectionsToWipe) {
            const snapshot = await firestore.collection(collectionName).get();
            const batch = firestore.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }

        const orgsSnap = await firestore.collection('organisations').get();
        const orgBatch = firestore.batch();
        orgsSnap.docs.forEach(doc => {
            const data = doc.data();
            const name = (data.name || '').toLowerCase();
            const isTad = name.includes('auction department');
            if (!data.name || name.includes('essex properties') || !isTad) {
                orgBatch.delete(doc.ref);
            }
        });
        await orgBatch.commit();

        return { success: true };
    } catch (error: any) {
        console.error("Wipe Failure:", error.message);
        return { success: false, error: error.message };
    }
}

export async function disableUser(uid: string): Promise<{success: boolean, error?: string}> {
  try {
    const app = await initializeAdminApp();
    const auth = getAuth(app);
    await auth.updateUser(uid, { disabled: true });
    return { success: true };
  } catch (error: any) {
    console.error(`Error disabling user ${uid}:`, error);
    return { success: false, error: 'Failed to disable user account.' };
  }
}

export async function syncUsersToMailchimp() {
    try {
        const app = await initializeAdminApp();
        const firestore = getFirestore(app);
        const apiKey = process.env.MAILCHIMP_API_KEY;
        const server = process.env.MAILCHIMP_SERVER_PREFIX;
        const listId = process.env.MAILCHIMP_LIST_ID;

        if (!apiKey || !server || !listId) throw new Error("Mailchimp secrets missing.");

        mailchimp.setConfig({ apiKey, server });

        const usersSnap = await firestore.collection('users').where('status', '==', 'Active').get();
        let successCount = 0;

        for (const doc of usersSnap.docs) {
            const user = doc.data();
            try {
                await mailchimp.lists.addListMember(listId, {
                    email_address: user.email,
                    status: 'subscribed',
                    merge_fields: {
                        FNAME: user.firstName,
                        LNAME: user.surname,
                    },
                });
                successCount++;
            } catch (e: any) {
                if (e.response?.body?.title === "Member Exists") successCount++;
            }
        }

        return { success: true, count: successCount };
    } catch (error: any) {
        console.error("Mailchimp Sync Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getSolicitorRecommendations(location: string, currentPartyFirmIds: string[]) {
    try {
        const app = await initializeAdminApp();
        const firestore = getFirestore(app);

        const solicitorsSnap = await firestore.collection('solicitorRankings')
            .where('location', '==', location)
            .orderBy('customerRating', 'desc')
            .limit(10)
            .get();

        const results = solicitorsSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as SolicitorRanking))
            .filter(firm => !currentPartyFirmIds.includes(firm.firmId));

        return { 
            success: true, 
            data: JSON.parse(JSON.stringify(results)) 
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
import { analyseComplaintFlow } from "../../ai/flows/analyse-complaint-flow";

/**
 * Forensic analysis of incoming grievances.
 * UK-EN: Scans for TPO/RICS procedural adherence and service flaws.
 */
export async function analyseAndStoreComplaint(complaintId: string) {
    let firestore;
    try {
        const app = await initializeAdminApp();
        firestore = getFirestore(app);
        
        const docRef = firestore.collection('complaints').doc(complaintId);
        const snap = await docRef.get();
        if (!snap.exists) throw new Error("Complaint not found.");

        const complaint = snap.data() as any;
        
        // EXECUTE AI AUDIT
        const aiResult = await analyseComplaintFlow({
            complaintContent: complaint.content,
            currentStage: complaint.stage || 1,
            history: (complaint.responses || []).map((r: any) => r.content)
        });

        await docRef.update({
            aiAnalysis: aiResult.summary,
            aiFlaws: aiResult.flawsIdentified,
            proceduralNextSteps: aiResult.proceduralChecklist,
            aiRecommendedResponse: aiResult.recommendedResponse,
            nextProceduralDeadline: aiResult.nextProceduralDeadline,
            updatedAt: FieldValue.serverTimestamp()
        });

        return { success: true, analysis: aiResult };
    } catch (error: any) {
        console.error("Forensic AI Analysis Failure:", error.message);
        return { success: false, error: error.message };
    }
}

export async function addComplaintResponse(complaintId: string, responseContent: string, authorName: string, authorRole: string, isInternal: boolean = false) {
    try {
        const app = await initializeAdminApp();
        const firestore = getFirestore(app);
        
        const docRef = firestore.collection('complaints').doc(complaintId);
        
        const responseObj = {
            id: Math.random().toString(36).substring(7),
            content: responseContent,
            authorName,
            authorRole,
            isInternalOnly: isInternal,
            createdAt: FieldValue.serverTimestamp()
        };

        await docRef.update({
            responses: FieldValue.arrayUnion(responseObj),
            updatedAt: FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateComplaintStatus(complaintId: string, status: any, stage: number) {
    try {
        const app = await initializeAdminApp();
        const firestore = getFirestore(app);
        
        await firestore.collection('complaints').doc(complaintId).update({
            status,
            stage,
            updatedAt: FieldValue.serverTimestamp(),
            closedAt: status === 'Closed' ? FieldValue.serverTimestamp() : null
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
export async function analyseAmlCaseAction(caseId: string, amlData: any) {
    try {
        const result = await analyseAmlCaseFlow(amlData);
        
        const app = await initializeAdminApp();
        const firestore = getFirestore(app);
        const docRef = firestore.collection('aml_cases').doc(caseId);

        if (result) {
            await docRef.update({
                aiRiskAnalysis: result.riskSummary,
                proceduralChecklist: result.mandatoryChecklist,
                aiRedFlags: result.redFlags,
                aiGuidance: result.guidanceForMlro,
                sarRecommendation: result.sarRecommendation,
                updatedAt: FieldValue.serverTimestamp()
            });
            return { success: true, result };
        }
        return { success: false, error: "AI Audit Result Empty" };
    } catch (error: any) {
        console.error("AML Analysis Action Failure:", error.message);
        return { success: false, error: error.message };
    }
}

export async function updateAmlCaseAction(caseId: string, payload: any) {
    try {
        const app = await initializeAdminApp();
        const firestore = getFirestore(app);
        
        await firestore.collection('aml_cases').doc(caseId).update({
            ...payload,
            updatedAt: FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function addAmlAuditAction(caseId: string, actionObj: any) {
    try {
        const app = await initializeAdminApp();
        const firestore = getFirestore(app);
        const docRef = firestore.collection('aml_cases').doc(caseId);

        await docRef.update({
            actions: FieldValue.arrayUnion({
                ...actionObj,
                createdAt: FieldValue.serverTimestamp()
            }),
            updatedAt: FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Smart Priority Engine: Cross-Collection Forensic Gathering
 * UK-EN Analysis of properties, AML cases, and suggestions.
 */
export async function getSmartPriorityList(userRole: string, organisationId?: string, branchIds?: string[]) {
    try {
        const app = await initializeAdminApp();
        const firestore = getFirestore(app);
        
        let observations: string[] = [];

        const isTadStaff = [
            'Global Admin',
            'TAD Admin',
            'Regional Manager',
            'Area Manager',
            'Sales Manager',
            'Auction Administrator'
        ].includes(userRole);

        // 1. PROPERTY OBSERVATIONS (Missing Compliance)
        let propQuery = firestore.collection('properties').limit(50);
        if (organisationId && !isTadStaff) {
            propQuery = propQuery.where('organisationId', '==', organisationId) as any;
        }

        const props = await propQuery.get();
        props.docs.forEach(doc => {
            const p = doc.data();
            const address = p.address?.addressLine1 || 'Unknown Property';
            
            if (p.status === 'Published' && !p.compliance?.epcRating) {
                observations.push(`Property at ${address} is 'Published' but missing an EPC rating. This violates marketing regulations.`);
            }
            if (p.status === 'Submitted' && (!p.legalPack || p.legalPack.length === 0)) {
                observations.push(`Property at ${address} has been instructions to sell, but the Legal Pack is empty.`);
            }
            if (p.auctionType === 'Modern Method of Auction' && !p.reservePrice) {
                observations.push(`Modern Method property at ${address} is pending reserve price agreement.`);
            }
        });

        // 2. AML OBSERVATIONS
        let amlQuery = firestore.collection('aml_cases')
            .where('status', 'in', ['Pending', 'In Review']);
        
        if (organisationId && !isTadStaff) {
            amlQuery = amlQuery.where('organisationId', '==', organisationId);
        }

        const amlCases = await amlQuery.limit(10).get();
        
        amlCases.docs.forEach(doc => {
            const c = doc.data();
            observations.push(`AML Case ${c.amlRef} (${c.subjectName}) is ${c.status} at ${c.riskRating} Risk. Urgent review required.`);
        });

        // 3. COMPLAINTS (Stage escalation)
        let complaintQuery = firestore.collection('complaints')
            .where('status', 'not-in', ['Closed', 'Ombudsman']);

        if (organisationId && !isTadStaff) {
            complaintQuery = complaintQuery.where('organisationId', '==', organisationId);
        }

        const complaints = await complaintQuery.limit(5).get();
        
        complaints.docs.forEach(doc => {
            const c = doc.data();
            observations.push(`Active Complaint ${c.complaintRef} is currently at Stage ${c.stage}. Response due.`);
        });

        // REFINEMENT: If no observations, add a neutral "Steady pulse" observation.
        if (observations.length === 0) {
            observations.push("All property instructions and compliance checks are currently within standard operating parameters.");
        }

        const result = await priorityAnalysisFlow({
            role: userRole,
            observations
        });

        return { success: true, data: result };
    } catch (error: any) {
        console.error("Smart Priority Failure:", error.message);
        return { success: false, error: error.message };
    }
}
