'use server';
/**
 * @fileOverview Legacy Redirect Endpoint for Colour Extraction.
 * Forensic: Proxies US-EN naming to UK-EN production standard to avoid duplicate Genkit registration.
 */
import { extractWebsiteColours as original } from './extract-colours-flow';

export async function extractWebsiteColours(input: { url: string }) {
    return original(input);
}

export async function extractWebsiteColors(input: { url: string }) {
    return original(input);
}
