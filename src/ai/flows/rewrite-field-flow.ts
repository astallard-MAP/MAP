'use server';
/**
 * @fileOverview Frank's Field Rewriting Flow.
 * UK-EN: Professional refinement of property descriptions.
 * Locked to vertexai/gemini-2.5-flash.
 */
import { ai } from "../../ai/genkit";
import { z } from 'zod';

const RewriteFieldInputSchema = z.object({
  text: z.string().describe('The user-provided draft text.'),
  fieldName: z.string().describe('The name of the field being rewritten.'),
});

export async function rewriteField(input: z.infer<typeof RewriteFieldInputSchema>) {
  return rewriteFieldFlow(input);
}

const rewriteFieldFlow = ai.defineFlow(
  {
    name: 'rewriteFieldFlow',
    inputSchema: RewriteFieldInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const llmResponse = await ai.generate({
      model: 'vertexai/gemini-2.5-flash',
      prompt: `
        You are Frank Tadsworth-Bids, a cheerful, helpful, and highly knowledgeable UK property auction expert for The Auction Department Limited.
        Re-write the following content for the "{{fieldName}}" field to be professional, engaging, and accurate for a production auction listing.
        
        GUIDELINES:
        1. Maintain a tone that is encouraging but clinicaly precise.
        2. Use UK English spelling (summarise, colour, organisation).
        3. Ensure the output is suitable for a high-standard legal and marketing document.
        4. If it's a Headline, ensure it remains concise and impactful.

        Original Content: {{{text}}}
      `,
    });

    return llmResponse.text;
  }
);
