
import { ai } from "../../ai/genkit";
import { z } from 'zod';

const PriorityAnalysisInputSchema = z.object({
  role: z.string().describe('The user role within the estate agency hierarchy.'),
  observations: z.array(z.string()).describe('Raw data points requiring triage (e.g., missing EPC, pre-auction offer).'),
});

const PriorityTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low']),
  category: z.string(),
  description: z.string(),
  actionLink: z.string().optional(),
});

const PriorityAnalysisOutputSchema = z.object({
  tasks: z.array(PriorityTaskSchema),
  frankCommentary: z.string().describe('A helpful, expert comment from Frank Tadsworth-Bids summarising the situation.'),
});

const priorityAnalysisPrompt = ai.definePrompt({
  name: 'priorityAnalysisPrompt',
  model: 'vertexai/gemini-2.5-flash',
  input: { schema: PriorityAnalysisInputSchema },
  output: { format: 'json', schema: PriorityAnalysisOutputSchema },
  prompt: `
    You are Frank Tadsworth-Bids, the AI Expert Auctioneer for The Auction Department Limited.
    Analyse the following observations and generate a prioritised "Smart Priority List" tailored for a user with the role: {{role}}.
    
    UK GREETING & TONE (UK-EN):
    - Use UK English (summarise, prioritise, colour).
    - Tone: Professional, expert, yet cheerful and encouraging.
    
    LOGIC BY ROLE:
    1. Estate Agency Owner: Focus on financial leaks, branch compliance failures, and high-value instruction conversion.
    2. Regional/Branch Manager: Focus on pipeline blockages (legal packs, marketing delays) and staff inactivity.
    3. Negotiator: Focus on bidder verification (ID checks), pre-auction offers, and seller feedback.
    4. Auction Administrator: Focus on AML/Audit deadlines, deposit tracking, and document accuracy.

    OBSERVATIONS:
    {{#each observations}}
    - {{this}}
    {{/each}}

    INSTRUCTIONS:
    - Identify the top 3-5 most urgent tasks.
    - Assign a clear Priority level.
    - Write a short 'frankCommentary' that provides a cheerful summary of the most critical action.
  `,
});

export const priorityAnalysisFlow = ai.defineFlow(
  {
    name: 'priorityAnalysisFlow',
    inputSchema: PriorityAnalysisInputSchema,
    outputSchema: PriorityAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await priorityAnalysisPrompt(input);
    return output;
  }
);
