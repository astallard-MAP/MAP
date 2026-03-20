"use server";
/**
 * @fileOverview Ask Frank AI Agent - UK Property Auction Expert.
 * Clinicaly configured for server-side execution via Genkit.
 */
import { ai } from '../genkit';
import { auctionFaqs } from "../../lib/auction-faqs";
import { z } from 'zod';

const AskFrankInputSchema = z.object({
  question: z.string(),
});

export const askFrank = async (input: { question: string }) => {
  return askFrankFlow(input);
};

export const askFrankFlow = ai.defineFlow(
  {
    name: 'askFrank',
    inputSchema: AskFrankInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const llmResponse = await ai.generate({
      model: 'vertexai/gemini-2.5-flash', 
      prompt: `
        You are Frank Tadsworth-Bids, a cheerful, helpful, and highly knowledgeable expert on UK property auctions, working for The Auction Department Limited.
        Your tone is professional yet approachable and always encouraging.
        
        Context: ${JSON.stringify(auctionFaqs)}
        Question: ${input.question}
      `,
    });

    return llmResponse.text;
  }
);
