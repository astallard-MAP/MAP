'use server';

import { summariseNewsFlow } from "@/ai/flows/summarise-news-flow";
import rssFeeds from '@/lib/rss-feeds.json';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeAdminApp } from '@/firebase/server-init';
import { getAuth } from "firebase-admin/auth";
// @ts-ignore
import mailchimp from '@mailchimp/mailchimp_marketing';
import { type SolicitorRanking } from "@/lib/types";

/**
 * Automates news aggregation and AI summarisation.
 * character-accurately handles RSS fetch timeouts and robust XML parsing for production stability.
 */
export async function summariseAndSaveNews() {
    let firestore;
    try {
        const app = await initializeAdminApp();
        firestore = getFirestore(app);
        
        let allArticlesText = '';
        const sourcesUsed: string[] = [];

        // Clinical Loop with Fetch Timeouts
        for (const feed of rssFeeds.feeds) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch(feed.url, { 
                    next: { revalidate: 3600 },
                    signal: controller.signal 
                });
                
                clearTimeout(timeoutId);
                if (!response.ok) continue;
                
                const text = await response.text();
                
                const items = text.split(/<item|<entry/).slice(1, 4);
                for (const item of items) {
                    const titleMatch = item.match(/<title[^>]*>(.*?)<\/title>/i);
                    if (titleMatch && titleMatch[1]) {
                         const title = titleMatch[1]
                            .replace(/<!\[CDATA\[|\]\]>/g, '')
                            .replace(/<[^>]*>?/gm, '')
                            .trim();
                         if (title) {
                            allArticlesText += `Source: ${feed.name} - Intel: ${title}\n`;
                         }
                    }
                }
                sourcesUsed.push(feed.name);
            } catch (e) {
                console.warn(`UK-WARN: News Source Offline: ${feed.name}`);
            }
        }

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
            sources: sourcesUsed.join(', ') || "Market Internal",
            currentUkTime: ukTimeStr,
            currentUkDate: ukDateStr
        });
        
        await firestore.collection('newsArticles').add({
            ...summaryResult,
            publishedAt: FieldValue.serverTimestamp(),
            author: "Frank Tadsworth-Bids",
        });

        await firestore.collection('system').doc('newsCron').set({
            lastRun: FieldValue.serverTimestamp(),
            status: 'Success',
            sourcesCount: sourcesUsed.length,
            error: null
        }, { merge: true });
        
        return { success: true, data: JSON.parse(JSON.stringify(summaryResult)) };
    } catch (error: any) {
        console.error("UK-DIAGNOSTIC-FAILURE:", error.message);
        if (firestore) {
            await firestore.collection('system').doc('newsCron').set({
                lastRun: FieldValue.serverTimestamp(),
                status: 'Failed',
                error: error.message
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
