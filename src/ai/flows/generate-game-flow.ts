
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
  solution: z.string().describe('The plain text solution to the puzzle (single word for anagram, first word for grid)'),
  hint: z.string().describe('A cheerful hint from Frank in UK English'),
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
        - Pick a word common in UK real estate (e.g., Auctioneer, Completion, Freehold, Conveyancing, Solicitors, Valuation, Tenancy).
        - Provide the anagram (jumbled letters) and the correct solution (the unscrambled word).
        - The solution MUST be exactly one word.
        
        If WordGrid:
        - Generate a 4x4 word square.
        - A word square contains 4 words that read the same horizontally and vertically.
        - Theme: House, home, auctions, real estate.
        - Output the grid as an array of 4 strings.
        - The solution MUST be the FIRST word of the square (the top row).
        
        Provide a helpful, encouraging hint. Avoid using the solution word in the hint.
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
