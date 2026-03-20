'use server';

import { askFrank } from "../../ai/flows/ask-frank-flow";
import { extractWebsiteColours } from "../../ai/flows/extract-colours-flow";
import { rewriteField } from "../../ai/flows/rewrite-field-flow";
import { researchLocation } from "../../ai/flows/research-location-flow";

/**
 * @fileOverview Production Client AI Action Registry.
 * UK-EN: character-accurately synchronized with mandated spelling protocols.
 */

export async function getWebsiteColours(url: string) {
    return await extractWebsiteColours({ url });
}

export async function askFrankAction(question: string) {
  try {
    const response = await askFrank({ question });
    return { success: true, text: response };
  } catch (error: any) {
    console.error("Frank-AI-Error:", error.message);
    return { 
      success: false, 
      text: "I am having trouble accessing the auction archives at the moment. Please try again shortly." 
    };
  }
}

export async function rewriteFieldAction(text: string, fieldName: string) {
  try {
    const result = await rewriteField({ text, fieldName });
    return { success: true, text: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function researchLocationAction(locationName: string) {
  try {
    const result = await researchLocation({ locationName });
    return { success: true, text: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
