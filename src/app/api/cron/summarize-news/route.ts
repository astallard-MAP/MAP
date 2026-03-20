import { NextResponse } from 'next/server';
import { summariseAndSaveNews } from '@/app/actions/server-actions';

/**
 * @fileOverview Legacy Redirect Endpoint for News Summarisation.
 * Forensic: Proxies US-EN naming to UK-EN production standard to avoid duplicate Genkit registration conflicts.
 */

export async function GET(request: Request) {
    const result = await summariseAndSaveNews();
    return NextResponse.json(result);
}

export async function POST(request: Request) {
    return GET(request);
}
