
'use server';
/**
 * @fileOverview Frank Tadsworth-Bids Daily Game Generator.
 * 
 * - generateDailyGame - AI-driven puzzle generation for portal engagement.
 * - Supports Franagrams (Anagrams) and Word Grids (Sudoku-style word squares).
 */

import { ai } from "../../ai/genkit";
import { z } from 'zod';

const GameTypeEnum = z.enum(['Franagram', 'WordGrid']);

const GenerateGameInputSchema = z.object({
  gameType: GameTypeEnum.optional(),
});

const GenerateGameOutputSchema = z.object({
  type: GameTypeEnum,
  puzzle: z.any().describe('The puzzle data structure (anagram string or array of strings for grid)'),
  solution: z.any().describe('The solution (string for anagram, 4x4 array of strings for grid)'),
  hint: z.string().describe('A cheerful hint from Frank in UK English'),
}).refine(data => {
  if (data.type === 'Franagram') {
    const sol = typeof data.solution === 'string' ? data.solution : '';
    return sol.length >= 5 && sol.length <= 9;
  }
  return true;
}, {
  message: "Franagram solution must be between 5 and 9 characters (UK-EN Difficulty Protocol)."
});

export async function generateDailyGame(input: z.infer<typeof GenerateGameInputSchema>) {
  return generateDailyGameFlow(input);
}

const generateDailyGameFlow = ai.defineFlow(
  {
    name: 'generateDailyGameFlow',
    inputSchema: GenerateGameInputSchema,
    outputSchema: GenerateGameOutputSchema,
  },
  async (input) => {
    // Favour Franagrams for better UX, occasionally use WordGrid
    const type = input.gameType || (Math.random() > 0.7 ? 'WordGrid' : 'Franagram');

    const llmResponse = await ai.generate({
      model: 'vertexai/gemini-2.5-flash',
      prompt: `
        You are Frank Tadsworth-Bids, a cheerful UK property auction expert working for The Auction Department Limited.
        Generate a daily brainteaser for My Auction Portal users.
        Use UK Great British English spelling (e.g., colour, prioritise, conveyancing).
        
        REQUIRED GAME TYPE: ${type}
        
        If Franagram:
        - Pick a word common in UK real estate (e.g., Auctioneer, Completion, Freehold, Valuation, Tenancy, Deposit, Exchange).
        - The solution MUST be exactly one word, between 5 and 9 letters long.
        - Provide the anagram (jumbled letters) and the correct solution (the unscrambled word).
        
        If WordGrid:
        - Generate a 4x4 word square (all rows and columns spell the same words).
        - Themes: Property, house, auctions, land, home (e.g., PLOT, SALE, SOLD, DEED, HOME, AREA, ROOF).
        - Output "puzzle" as a 4x4 array of strings representing the grid rows.
        - Output "solution" as the SAME 4x4 array of strings.
        
        Provide a helpful, encouraging hint in UK English.
      `,
      output: {
        schema: GenerateGameOutputSchema,
        format: 'json',
      },
      config: { temperature: 0.7 }
    });

    const output = llmResponse.output;
    if (!output) throw new Error("Frank AI failed to generate today's challenge.");
    
    return output;
  }
);
