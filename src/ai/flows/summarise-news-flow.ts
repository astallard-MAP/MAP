'use server';
/**
 * @fileOverview AI News Summarisation Flow.
 * UK-EN: Professional intelligence aggregation for The Auction Department Limited.
 * Locked to vertexai/gemini-2.5-flash.
 */
import { ai } from "../../ai/genkit";
import { z } from 'zod';

const NewsSummarisationInputSchema = z.object({
  articlesContent: z.string(),
  sources: z.string(),
  currentUkTime: z.string().describe('The current time in the UK (GMT/BST) in HH:mm format (24h).'),
  currentUkDate: z.string().describe('The current date in the UK.'),
});

const NewsSummarisationOutputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  source: z.string(),
  url: z.string(),
});

const newsSummariserPrompt = ai.definePrompt({
  name: 'newsSummariserPrompt',
  model: 'vertexai/gemini-2.5-flash',
  input: { schema: NewsSummarisationInputSchema },
  prompt: `
    You are Frank Tadsworth-Bids, a cheerful, highly knowledgeable property auction expert for The Auction Department Limited.
    Summarise the following articles into a professional and encouraging news digest.
    
    CRITICAL TIMEZONE AWARENESS (UK-EN):
    The current UK time is {{currentUkTime}} on {{currentUkDate}}. 
    You MUST adjust your greeting and tone based on this EXACT time. Use 24-hour logic.
    
    UK GREETING PROTOCOL:
    - 05:00 to 11:59: "Good morning"
    - 12:00 to 16:59: "Good afternoon"
    - 17:00 to 20:59: "Good evening"
    - 21:00 to 04:59: Use a reflective summary tone (e.g., "Reflecting on today's activity..." or "Closing today's report...")
    
    STRICT COMPLIANCE: If the time is 22:56, you MUST NOT say "Good morning". You must use the reflective tone.
    
    GUIDELINES:
    1. Focus: UK Property Auction Sector (65%+).
    2. Language: UK English (summarise, colour, GMT/BST).
    3. Format: Start with "Frank's Digest: [Headline]" followed by 3-4 professional paragraphs.
    4. Persona: Helpful, encouraging, and expert.

    Content: {{articlesContent}}
  `,
});

export const summariseNewsFlow = ai.defineFlow(
  {
    name: 'summariseNewsFlow',
    inputSchema: NewsSummarisationInputSchema,
    outputSchema: NewsSummarisationOutputSchema,
  },
  async (input) => {
    const summaryResponse = await newsSummariserPrompt(input);
    const summaryText = summaryResponse.text.trim();
    
    // Forensic parsing to ensure quality even if AI deviates from format
    const lines = summaryText.split('\n');
    const title = (lines[0] || "Frank's Digest: UK Auction News Intelligence").replace(/^#+\s*/, '').trim();
    const summary = lines.slice(1).join('\n').trim();
    
    return {
      title: title || "Frank's Digest: UK Auction News",
      summary: summary || summaryText, // Fallback to full text if parsing logic failed to separate
      source: input.sources,
      url: "",
    };
  }
);

