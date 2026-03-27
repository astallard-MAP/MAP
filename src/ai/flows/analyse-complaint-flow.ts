
import { ai } from "../genkit";
import { z } from "zod";

/**
 * @fileOverview Production AI flow for forensic complaints analysis.
 * UK-EN: Ensures strict adherence to TPO and RICS procedure standards.
 */

const ComplaintAnalysisInputSchema = z.object({
  complaintContent: z.string(),
  currentStage: z.number().optional().default(1),
  history: z.array(z.string()).optional().default([]),
});

const ComplaintAnalysisOutputSchema = z.object({
  summary: z.string(),
  flawsIdentified: z.array(z.string()),
  proceduralChecklist: z.array(z.string()),
  recommendedResponse: z.string(),
  nextProceduralDeadline: z.string(),
});

const complaintAnalysisPrompt = ai.definePrompt({
  name: "complaintAnalysisPrompt",
  model: 'vertexai/gemini-2.5-flash',
  input: { schema: ComplaintAnalysisInputSchema },
  prompt: `
    Forensic Audit: Complaints Analysis Desk
    
    CONTEXT:
    You are Frank AI, the Chief Compliance Officer for The Auction Department Limited. 
    Analyze the incoming complaint based on our published "Complaints Handling Procedure".
    
    OUR PROCEDURE RULES:
    1. Stage One: Acknowledge within 3 working days. Outcome within 15 working days.
    2. Stage Two: Review by Director. Final Viewpoint within 15 working days.
    3. Escalation: Referral to The Property Ombudsman (TPO) after 8 weeks or if Final Viewpoint is rejected.
    
    INCOMING COMPLAINT:
    {{complaintContent}}
    
    CURRENT STAGE: Stage {{currentStage}}
    PREVIOUS ACTIONS: {{history}}
    
    TASK:
    1. Summarise the core grievance in one paragraph.
    2. Identify specific "flaws or issues" in our service mentioned by the complainant that MUST be corrected for production excellence.
    3. Generate a checklist for the administrator to follow our procedure to the letter.
    4. Draft a recommended tone-appropriate response (expert, empathetic, and professional).
    5. Identify the next mandatory deadline based on today's UK-EN standards.
    
    Your response MUST be a clear JSON-formatted report.
  `,
});

export const analyseComplaintFlow = ai.defineFlow(
  {
    name: "analyseComplaintFlow",
    inputSchema: ComplaintAnalysisInputSchema,
    outputSchema: ComplaintAnalysisOutputSchema,
  },
  async (input) => {
    const response = await complaintAnalysisPrompt(input);
    const text = response.text;
    
    // Clinical JSON extraction
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.error("Forensic JSON parsing failure in analyseComplaintFlow:", e);
    }

    return {
      summary: "Manual review required: AI extraction failed.",
      flawsIdentified: ["Extraction Error"],
      proceduralChecklist: ["Acknowledge receipt immediately"],
      recommendedResponse: "Dear Client, thank you for your patience while we review this properly.",
      nextProceduralDeadline: "3 Working Days (Acknowledgement)"
    };
  }
);
