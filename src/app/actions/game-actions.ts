'use server';

import { initializeAdminApp } from "@/firebase/server-init";
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { generateDailyGame } from "@/ai/flows/generate-game-flow";

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
      
      // Forensic: Validate WordGrid integrity. If legacy (string solution or < 16 chars), regenerate.
      if (data.type === 'WordGrid') {
          const solution = data.solution;
          const flatChars = Array.isArray(solution) ? solution.flat().join('') : String(solution);
          if (flatChars.length < 16) {
              console.warn("Legacy/Corrupted WordGrid detected. Initiating regeneration protocol...");
              await firestore.collection('dailyGames').doc(today).delete();
          } else {
              return { 
                success: true, 
                data: JSON.parse(JSON.stringify(data)) 
              };
          }
      } else {
          return { 
            success: true, 
            data: JSON.parse(JSON.stringify(data)) 
          };
      }
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

/**
 * Retrieves the leaderboard for a specific game, sorted by time taken.
 */
export async function getGameLeaderboard(gameId: string) {
  try {
    const app = await initializeAdminApp();
    const firestore = getFirestore(app);

    const snapshot = await firestore.collection('gameResults')
      .where('gameId', '==', gameId)
      .orderBy('timeTakenMs', 'asc')
      .limit(10)
      .get();

    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data: JSON.parse(JSON.stringify(results)) };
  } catch (error: any) {
    console.error("Leaderboard Retrieval Failure:", error.message);
    return { success: false, error: error.message };
  }
}
import { generateQuizFlow } from "@/ai/flows/generate-quiz-flow";

/**
 * Retrieves the daily quiz for the portal.
 * UK-EN: Focuses on professional regulatory knowledge.
 */
export async function getDailyQuiz() {
  try {
    const app = await initializeAdminApp();
    const firestore = getFirestore(app);
    const today = new Date().toISOString().split('T')[0];

    const quizDoc = await firestore.collection('dailyQuizzes').doc(today).get();
    if (quizDoc.exists) {
        return { 
          success: true, 
          data: JSON.parse(JSON.stringify({ ...quizDoc.data(), id: today })) 
        };
    }

    // AI Generation
    const newQuiz = await generateQuizFlow({});

    const payload = {
      ...newQuiz,
      date: today,
      createdAt: FieldValue.serverTimestamp(),
    };

    await firestore.collection('dailyQuizzes').doc(today).set(payload);

    return { 
      success: true, 
      data: JSON.parse(JSON.stringify({ ...newQuiz, date: today, id: today })) 
    };
  } catch (error: any) {
    console.error("Quiz Retrieval Failure:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Submits a quiz result and updates user ranking points.
 */
export async function submitQuizResult(userId: string, userName: string, quizId: string, isCorrect: boolean) {
  try {
    const app = await initializeAdminApp();
    const firestore = getFirestore(app);

    const resultRef = firestore.collection('quizResults').doc(`${userId}_${quizId}`);
    await resultRef.set({
      userId,
      userName,
      quizId,
      isCorrect,
      submittedAt: FieldValue.serverTimestamp(),
    });

    // Reward points for excellence in regulatory awareness
    if (isCorrect) {
        const userRef = firestore.collection('users').doc(userId);
        await userRef.update({
            rankingPoints: FieldValue.increment(15), // Higher reward for professional knowledge
            updatedAt: FieldValue.serverTimestamp(),
        });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
