'use server';

import { initializeAdminApp } from "../../firebase/server-init";
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { generateDailyGame } from "../../ai/flows/generate-game-flow";

/**
 * Retrieves the daily puzzle for the portal.
 * Clinicaly serializes data to satisfy Next.js Server-to-Client object protocols.
 */
export async function getDailyGame(suggestedType?: string) {
  try {
    const app = await initializeAdminApp();
    const firestore = getFirestore(app);
    const today = new Date().toISOString().split('T')[0];

    const gameDoc = await firestore.collection('dailyGames').doc(today).get();
    if (gameDoc.exists) {
      const data = gameDoc.data();
      if (!data) throw new Error("Audit Failure: Game record corrupted.");
      
      // Forensic: Serialize to plain object to prevent "Classes or null prototypes are not supported" error
      return { 
        success: true, 
        data: JSON.parse(JSON.stringify(data)) 
      };
    }

    // AI Generation
    const newGame = await generateDailyGame({ 
        gameType: suggestedType as any 
    });

    const payload = {
      ...newGame,
      date: today,
      createdAt: FieldValue.serverTimestamp(),
    };

    await firestore.collection('dailyGames').doc(today).set(payload);

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify({ ...newGame, date: today })) 
    };
  } catch (error: any) {
    console.error("Game Retrieval Failure:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Submits a game result and updates user ranking telemetry.
 */
export async function submitGameResult(userId: string, userName: string, gameId: string, timeMs: number, attempts: number) {
  try {
    const app = await initializeAdminApp();
    const firestore = getFirestore(app);

    const resultRef = firestore.collection('gameResults').doc();
    await resultRef.set({
      userId,
      userName,
      gameId,
      timeTakenMs: timeMs,
      attempts,
      submittedAt: FieldValue.serverTimestamp(),
    });

    const userRef = firestore.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const userData = userSnap.data();
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let newStreak = 1;
    if (userData?.lastGameDate === yesterday) {
      newStreak = (userData.winningStreak || 0) + 1;
    }

    await userRef.update({
      rankingPoints: FieldValue.increment(10),
      winningStreak: newStreak,
      lastGameDate: today,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, streak: newStreak };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
