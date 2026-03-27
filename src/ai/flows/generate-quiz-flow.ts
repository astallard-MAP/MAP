
import { ai } from "../genkit";
import { z } from "zod";

/**
 * @fileOverview AI Quiz Generation Flow for MAP261125 Gamification.
 * UK-EN: Generates regulatory/professional compliance questions.
 */

const QuizGenerationOutputSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().min(0).max(3),
  explanation: z.string(),
  topic: z.enum(['AML Regulations', 'Real Estate Marketing', 'TPO Complaints', 'RICS Best Practice']),
});

const quizGeneratorPrompt = ai.definePrompt({
  name: 'quizGeneratorPrompt',
  model: 'vertexai/gemini-2.5-flash',
  prompt: `
    You are Frank Tadsworth-Bids, a cheerful and expert property auctioneer for The Auction Department Limited.
    Your task is to generate a single "Quiz Question of the Day" for our portal members.
    
    REQUIRED TOPICS (Select one at random):
    1. HMRC Anti-Money Laundering (AML) Regulations (MLR 2017).
    2. UK Real Estate Marketing Legislation (CPRs, BPRs).
    3. The Property Ombudsman (TPO) Complaints Handling Procedure.
    4. Royal Institution of Chartered Surveyors (RICS) Best Practice for land and property auctions.
    
    GUIDELINES:
    1. Language: UK English (e.g., colour, summarise).
    2. Format: Multiple Choice (4 options).
    3. Difficulty: Professional but accessible.
    4. Explanation: Provide a brief, encouraging reason WHY the answer is correct, citing the regulation if possible.
    5. Persona: Encouraging, professional, and helpful.
    
    Your response MUST be valid JSON matching the following schema:
    {
      "question": "What is the mandatory timeframe...",
      "options": ["3 days", "5 days", "15 days", "30 days"],
      "correctIndex": 2,
      "explanation": "Correct! TPO guidelines state that Stage One outcomes must be sent within 15 working days.",
      "topic": "TPO Complaints"
    }
  `,
});

export const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: z.object({}), // No input needed for daily random generation
    outputSchema: QuizGenerationOutputSchema,
  },
  async () => {
    const response = await quizGeneratorPrompt({});
    const text = response.text;
    
    // Clinical JSON extraction
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.error("Forensic JSON parsing failure in generateQuizFlow:", e);
    }

    // High-Fidelity Fallback
    return {
      question: "Under TPO guidelines, within how many days must a formal complaint be acknowledged?",
      options: ["2 working days", "3 working days", "5 working days", "10 working days"],
      correctIndex: 1,
      explanation: "TPO standards require written acknowledgement within 3 working days.",
      topic: "TPO Complaints"
    };
  }
);
