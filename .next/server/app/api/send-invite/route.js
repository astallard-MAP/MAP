"use strict";(()=>{var e={};e.id=8821,e.ids=[8821],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},40191:(e,t,o)=>{o.r(t),o.d(t,{originalPathname:()=>g,patchFetch:()=>x,requestAsyncStorage:()=>m,routeModule:()=>u,serverHooks:()=>v,staticGenerationAsyncStorage:()=>h});var n={};o.r(n),o.d(n,{POST:()=>l});var r=o(49303),a=o(88716),i=o(60670),s=o(87070);let d=require("nodemailer");var p=o.n(d);let c=(e,t,o,n)=>`
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
            <p>Dear ${e},</p>
            <p>You have been invited by The Auction Department to join <strong>${t}</strong> on the My Auction Portal as a <strong>${o}</strong>.</p>
            <p>To accept your invitation and create your production account, please click the button below:</p>
            <p style="text-align: center;"><a href="${n}" class="button">Accept Invitation</a></p>
            <p>Best regards,<br>Frank Tadsworth-Bids</p>
        </div>
        <div class="footer"><p>&copy; ${new Date().getFullYear()} The Auction Department Limited.</p></div>
    </div>
</body>
</html>
`;async function l(e){try{let{to:t,name:o,organisationName:n,role:r,inviteLink:a}=await e.json(),i=p().createTransport({host:"smtp.office365.com",port:587,secure:!1,auth:{user:"Frank@AuctionDepartment.Com",pass:"FTBss12pq#"},tls:{ciphers:"SSLv3",rejectUnauthorized:!1}});return await i.sendMail({from:'"Frank Tadsworth-Bids" <Frank@AuctionDepartment.Com>',to:t,subject:`An Invitation from Frank at ${n}`,html:c(o,n,r,a)}),s.NextResponse.json({message:"Email sent successfully"})}catch(e){return console.error("Production Email Failure:",e.message),s.NextResponse.json({error:"Failed to send invitation email."},{status:500})}}let u=new r.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/send-invite/route",pathname:"/api/send-invite",filename:"route",bundlePath:"app/api/send-invite/route"},resolvedPagePath:"C:\\MAP-Gold-Standard-200326\\src\\app\\api\\send-invite\\route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:m,staticGenerationAsyncStorage:h,serverHooks:v}=u,g="/api/send-invite/route";function x(){return(0,i.patchFetch)({serverHooks:v,staticGenerationAsyncStorage:h})}}};var t=require("../../../webpack-runtime.js");t.C(e);var o=e=>t(t.s=e),n=t.X(0,[8948,5972],()=>o(40191));module.exports=n})();