'use server';
/**
 * @fileOverview Brand Colour Extraction Flow.
 * UK-EN: Forensic identification of website primary and secondary colours.
 * Locked to vertexai/gemini-2.5-flash.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ColourInputSchema = z.object({
  url: z.string().url(),
});

const ColourOutputSchema = z.object({
    primary: z.string().describe('The primary hex colour code, e.g., #RRGGBB'),
    secondary: z.string().describe('The secondary hex colour code, e.g., #RRGGBB')
});

export async function extractWebsiteColours(input: { url: string }) {
    return extractWebsiteColoursFlow(input);
}

export const extractWebsiteColoursFlow = ai.defineFlow(
  {
    name: 'extractWebsiteColours',
    inputSchema: ColourInputSchema,
    outputSchema: ColourOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      model: 'vertexai/gemini-2.5-flash',
      prompt: `Analyse the website at ${input.url} and identify its primary brand colours. Use UK English spelling (colour, prioritise, etc.).`,
      output: {
          schema: ColourOutputSchema,
          format: 'json',
      },
      config: { temperature: 0.1 }
    });

    const colourData = llmResponse.output;
    if (!colourData) {
        throw new Error("Audit: AI failed to extract brand parameters.");
    }

    return colourData;
  }
);
