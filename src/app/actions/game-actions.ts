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
 * Submits results for Frank's Game of the Day.
 * Standardizes ranking points and streak telemetry.
 */
export async function submitFrankGameResult(params: {
    userId: string;
    userName: string;
    gameId: string;
    type: 'Franagram' | 'WordGrid' | 'Quiz';
    timeMs?: number;
    attempts?: number;
    isCorrect?: boolean;
}) {
    try {
        const app = await initializeAdminApp();
        const firestore = getFirestore(app);
        const { userId, userName, gameId, type, timeMs, attempts, isCorrect } = params;

        const resultRef = firestore.collection('frankGameResults').doc(`${userId}_${gameId}`);
        await resultRef.set({
            userId,
            userName,
            gameId,
            type,
            timeTakenMs: timeMs || 0,
            attempts: attempts || 1,
            isCorrect: isCorrect ?? true, // For puzzles, correctness is implied by submission
            submittedAt: FieldValue.serverTimestamp(),
        });

        // Reward logic
        const userRef = firestore.collection('users').doc(userId);
        const points = type === 'Quiz' ? 15 : 10;

        await userRef.update({
            rankingPoints: FieldValue.increment(points),
            lastGameDate: gameId,
            updatedAt: FieldValue.serverTimestamp(),
        });

        return { success: true, points };
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
