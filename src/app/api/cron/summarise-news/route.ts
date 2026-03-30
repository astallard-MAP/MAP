import { NextResponse } from 'next/server';
import { summariseAndSaveNews } from "../../../../app/actions/server-actions";

export const dynamic = 'force-dynamic';

/**
 * @fileOverview Definitive Cron Endpoint for News Summarisation.

 * Clinicaly stabilised for App Hosting Cloud Scheduler.
 * UK-EN Protocol Enforcement.
 */

export async function GET(request: Request) {
  try {
    // UK-EN: Verify Authorization Header exists (OIDC Token from App Hosting)
    const authHeader = request.headers.get('authorization');
    if (!authHeader && process.env.NODE_ENV === 'production') {
      console.error("UK-EN: Unauthorized Cron Attempt - Missing Token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("UK-EN: Cron News Summarisation triggered at", new Date().toISOString());

    const result = await summariseAndSaveNews();
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: "Intelligence published." 
      });
    } else {
      console.error("UK-EN: News Summarisation Action Failed:", result.error);
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("UK-EN: Fatal Cron Execution Failure:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// Support POST for broad compatibility with Cloud Scheduler default payloads
export async function POST(request: Request) {
    return GET(request);
}
