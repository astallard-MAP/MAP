
import { NextResponse } from 'next/server';
import { GET as summariseGET, POST as summarisePOST } from '../summarise-news/route';

export const dynamic = 'force-dynamic';

/**
 * @fileOverview Legacy Redirect for US-EN Cron URL.
 * Forensic: Forwards legacy hits to the British-Standardised production endpoint.
 */

export async function GET(request: Request) {
    console.log("UK-EN: Legacy US-EN Cron (summarize) redirected to summarise.");
    return summariseGET(request);
}

export async function POST(request: Request) {
    return summarisePOST(request);
}
