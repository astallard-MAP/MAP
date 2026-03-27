import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';

/**
 * @fileOverview Genkit Configuration for Production - MAP261125
 * character-accurately locked to Vertex AI Gemini 2.5 Flash.
 * Full path model identifier used to ensure build stability and compliance.
 */
export const ai = genkit({
  plugins: [
    vertexAI({
      projectId: 'map261125',
      location: 'us-central1',
    }),
  ],
  model: 'vertexai/gemini-2.5-flash',
});


