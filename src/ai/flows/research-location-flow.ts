'use server';
/**
 * @fileOverview Frank's Location Research Flow.
 * UK-EN: Generates descriptive location paragraphs excluding demographics.
 * Locked to vertexai/gemini-2.5-flash.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ResearchLocationInputSchema = z.object({
  locationName: z.string().describe('The name of the town, village, or city.'),
});

export async function researchLocation(input: z.infer<typeof ResearchLocationInputSchema>) {
  return researchLocationFlow(input);
}

const researchLocationFlow = ai.defineFlow(
  {
    name: 'researchLocationFlow',
    inputSchema: ResearchLocationInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const llmResponse = await ai.generate({
      model: 'vertexai/gemini-2.5-flash',
      prompt: `
        You are Frank Tadsworth-Bids, a UK property auction expert. 
        Research and produce a single paragraph describing the character, history, or amenities of: {{locationName}}.
        
        STRICT COMPLIANCE PROTOCOL (UK-EN):
        1. Produce exactly one paragraph.
        2. Exclude ANY reference to population statistics, censuses, or numerical demographics.
        3. Use UK English spelling (e.g., centre, characterised).
        4. Focus on transport links, local appeal, and general desirability.
        5. Tone: Professional, encouraging, and descriptive.
      `,
    });

    return llmResponse.text;
  }
);
