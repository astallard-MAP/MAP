'use server';
/**
 * @fileOverview Legacy Redirect Endpoint for News Summarisation.
 * Forensic: Proxies US-EN naming to UK-EN production standard to avoid duplicate Genkit registration.
 */
import { summariseNewsFlow as original } from './summarise-news-flow';

export const summariseNewsFlow = original;
