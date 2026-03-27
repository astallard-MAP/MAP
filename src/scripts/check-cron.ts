
import { initializeAdminApp } from "../firebase/server-init";
import { getFirestore } from 'firebase-admin/firestore';

async function checkNews() {
    try {
        const app = await initializeAdminApp();
        const db = getFirestore(app);
        
        const snapshot = await db.collection('newsArticles').orderBy('publishedAt', 'desc').limit(5).get();
        console.log("Recent News Articles:");
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log(`- ID: ${doc.id}, Title: ${data.title}, PublishedAt: ${data.publishedAt?.toDate()}`);
        });
        
        const cronSnap = await db.collection('system').doc('newsCron').get();
        console.log("\nNews Cron Status:");
        if (cronSnap.exists) {
            console.log(JSON.stringify(cronSnap.data(), null, 2));
        } else {
            console.log("No newsCron status document found.");
        }
        
    } catch (e: any) {
        console.error("Error checking news:", e.message);
    }
}

checkNews();
