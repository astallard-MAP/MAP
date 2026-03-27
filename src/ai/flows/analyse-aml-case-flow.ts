
import { ai } from "../genkit";
import { z } from "zod";

/**
 * @fileOverview Production AI flow for forensic AML analysis.
 * UK-EN: Scans cases for MLR 2017 compliance, PEP risks, and red flags.
 */

const AmlAnalysisInputSchema = z.object({
  type: z.string(),
  subjectInfo: z.string(),
  riskRating: z.string(),
  isPep: z.boolean(),
  evidence: z.array(z.string()).optional().default([]),
});

const AmlAnalysisOutputSchema = z.object({
  riskSummary: z.string(),
  redFlags: z.array(z.string()),
  mandatoryChecklist: z.array(z.string()),
  guidanceForMlro: z.string(),
  sarRecommendation: z.string(),
});

const amlAnalysisPrompt = ai.definePrompt({
  name: "amlAnalysisPrompt",
  model: 'vertexai/gemini-2.5-flash',
  input: { schema: AmlAnalysisInputSchema },
  prompt: `
    Forensic Audit: AML Compliance Desk
    
    CONTEXT:
    You are Frank AI, the Money Laundering Reporting Officer (MLRO) sidekick for The Auction Department Limited.
    Audit the case against our "Anti-Money Laundering Policy (TAD-AML-001)" and UK Legislation (MLR 2017, POCA 2002).
    
    CASE DATA:
    - Type: {{type}}
    - Subject: {{subjectInfo}}
    - Current Risk Rating: {{riskRating}}
    - PEP Status: {{isPep}}
    - Evidence Provided: {{evidence}}
    
    TASK:
    1. Summarise the money laundering/terrorist financing risk for this subject.
    2. Identify specific "Red Flags" or service flaws in our compliance steps.
    3. Generate a mandatory checklist for the MLRO based on TAD-AML-001 procedural requirements (CDD, EDD, Sanctions, Source of Funds).
    4. Provide clinical guidance for the administrator dealing with this case.
    5. State whether a SAR (Suspicious Activity Report) or EDD (Enhanced Due Diligence) is recommended, focusing on UK legal thresholds.
    
    Your response MUST be a clear JSON-formatted report.
  `,
});

export const analyseAmlCaseFlow = ai.defineFlow(
  {
    name: "analyseAmlCaseFlow",
    inputSchema: AmlAnalysisInputSchema,
    outputSchema: AmlAnalysisOutputSchema,
  },
  async (input) => {
    const response = await amlAnalysisPrompt(input);
    const text = response.text;
    
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.error("Forensic JSON parsing failure in analyseAmlCaseFlow:", e);
    }

    return {
      riskSummary: "Extraction failed: Manual MLRO audit mandatory.",
      redFlags: ["System Timeout"],
      mandatoryChecklist: ["Re-verify ID List A & B immediately", "Check Sanctions (OFSI)"],
      guidanceForMlro: "Proceed with caution using paper-based backup forms (Appendix B/C).",
      sarRecommendation: "Consult legal counsel."
    };
  }
);
