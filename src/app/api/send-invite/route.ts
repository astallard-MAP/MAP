import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * @fileOverview Production email service for MAP261125.
 * Locked to Microsoft Office 365 Exchange SMTP for The Auction Department Limited.
 */

const createHtmlTemplate = (name: string, organisationName: string, role: string, inviteLink: string) => `
<!DOCTYPE html>
<html lang="en-GB">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to My Auction Portal</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; }
        .header { text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #8461a6; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { margin-top: 20px; text-align: center; font-size: 0.8em; color: #777; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h2>The Auction Department</h2></div>
        <div class="content">
            <p>Dear ${name},</p>
            <p>You have been invited by The Auction Department to join <strong>${organisationName}</strong> on the My Auction Portal as a <strong>${role}</strong>.</p>
            <p>To accept your invitation and create your production account, please click the button below:</p>
            <p style="text-align: center;"><a href="${inviteLink}" class="button">Accept Invitation</a></p>
            <p>Best regards,<br>Frank Tadsworth-Bids</p>
        </div>
        <div class="footer"><p>&copy; ${new Date().getFullYear()} The Auction Department Limited.</p></div>
    </div>
</body>
</html>
`;

export async function POST(req: NextRequest) {
    try {
        const { to, name, organisationName, role, inviteLink } = await req.json();

        // DEFINITIVE OFFICE 365 PRODUCTION RELAY
        const transporter = nodemailer.createTransport({
            host: 'smtp.office365.com',
            port: 587,
            secure: false, // Must be false for STARTTLS on port 587
            auth: {
                user: 'Frank@AuctionDepartment.Com',
                pass: 'FTBss12pq#',
            },
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false
            }
        });

        await transporter.sendMail({
            from: `"Frank Tadsworth-Bids" <Frank@AuctionDepartment.Com>`,
            to: to,
            subject: `An Invitation from Frank at ${organisationName}`,
            html: createHtmlTemplate(name, organisationName, role, inviteLink),
        });

        return NextResponse.json({ message: "Email sent successfully" });
    } catch (error: any) {
        console.error("Production Email Failure:", error.message);
        return NextResponse.json({ error: "Failed to send invitation email." }, { status: 500 });
    }
}
