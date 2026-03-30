'use server';

import { initializeAdminApp } from "@/firebase/server-init";
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { generateDailyGame } from "@/ai/flows/generate-game-flow";
import { generateQuizFlow } from "@/ai/flows/generate-quiz-flow";

/**
 * Retrieves Frank's Game of the Day.
 * Randomly selects between Franagram, WordGrid, or Regulatory Quiz once per day.
 */
export async function getFrankGameOfTheDay(suggestedType?: 'Franagram' | 'WordGrid' | 'Quiz') {
  try {
    const app = await initializeAdminApp();
    const firestore = getFirestore(app);
    const today = new Date().toISOString().split('T')[0];

    // Priority 1: Check if a Frank Game already exists for today
    const gameDoc = await firestore.collection('dailyFrankGames').doc(today).get();
    if (gameDoc.exists && !suggestedType) {
      return { 
        success: true, 
        data: JSON.parse(JSON.stringify({ ...gameDoc.data(), id: today })) 
      };
    }

    // Priority 2: Select a game type
    let finalType = suggestedType;
    if (!finalType) {
        const gameTypeInt = Math.floor(Math.random() * 3);
        finalType = gameTypeInt === 2 ? 'Quiz' : (gameTypeInt === 0 ? 'Franagram' : 'WordGrid');
    }

    let newGame: any;

    if (finalType === 'Quiz') {
      // Generate a Quiz
      const quiz = await generateQuizFlow({});
      newGame = { ...quiz, type: 'Quiz' };
    } else {
      // Generate a puzzle (Franagram or WordGrid)
      const puzzle = await generateDailyGame({ gameType: finalType as any });
      newGame = puzzle;
    }

    const payload = {
      ...newGame,
      date: today,
      createdAt: FieldValue.serverTimestamp(),
    };

    await firestore.collection('dailyFrankGames').doc(today).set(payload);

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify({ ...newGame, date: today, id: today })) 
    };
  } catch (error: any) {
    console.error("Frank's Game Retrieval Failure:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Retrieves the current user's progress for a specific game.
 */
export async function getFrankUserGameProgress(userId: string, gameId: string) {
    try {
        const app = await initializeAdminApp();
        const firestore = getFirestore(app);

        const progressDoc = await firestore.collection('frankGameResults').doc(`${userId}_${gameId}`).get();
        if (progressDoc.exists) {
            return { success: true, data: JSON.parse(JSON.stringify(progressDoc.data())) };
        }
        return { success: true, data: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Updates or initializes game progress for a user (e.g. on Reveal or Attempt).
 */
export async function updateFrankGameProgress(params: {
    userId: string;
    userName: string;
    gameId: string;
    type: 'Franagram' | 'WordGrid' | 'Quiz';
    status: 'in-progress' | 'completed';
    timeMs?: number;
    attempts?: number;
    isCorrect?: boolean;
}) {
    try {
        const app = await initializeAdminApp();
        const firestore = getFirestore(app);
        const { userId, userName, gameId, type, status, timeMs, attempts, isCorrect } = params;

        const resultRef = firestore.collection('frankGameResults').doc(`${userId}_${gameId}`);
        
        const payload: any = {
            userId,
            userName,
            gameId,
            type,
            status,
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (timeMs !== undefined) payload.timeTakenMs = timeMs;
        if (attempts !== undefined) payload.attempts = attempts;
        if (isCorrect !== undefined) payload.isCorrect = isCorrect;
        
        // Only set submittedAt if completing
        if (status === 'completed') {
            payload.submittedAt = FieldValue.serverTimestamp();
            
            // Reward logic
            const userRef = firestore.collection('users').doc(userId);
            const points = type === 'Quiz' ? 15 : 10;

            await userRef.update({
                rankingPoints: FieldValue.increment(points),
                lastGameDate: gameId,
                updatedAt: FieldValue.serverTimestamp(),
            });
        } else {
            // If it doesn't exist, initialize it
            payload.createdAt = FieldValue.serverTimestamp();
        }

        await resultRef.set(payload, { merge: true });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


/**
 * Retrieves the daily leaderboard for Frank's Game.
 */
export async function getFrankLeaderboard(gameId: string) {
    try {
        const app = await initializeAdminApp();
        const firestore = getFirestore(app);

        const snapshot = await firestore.collection('frankGameResults')
            .where('gameId', '==', gameId)
            .orderBy('type', 'asc') // Grouping
            .orderBy('timeTakenMs', 'asc')
            .limit(10)
            .get();

        const results = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, data: JSON.parse(JSON.stringify(results)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
