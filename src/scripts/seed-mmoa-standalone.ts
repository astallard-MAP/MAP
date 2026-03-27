
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Bare minimum initialization for seed script to avoid Genkit/Vertex issues
async function seedMmoaTemplate() {
  if (getApps().length === 0) {
    // If we're on local and have GOOGLE_APPLICATION_CREDENTIALS set, this works.
    // Otherwise, it might fail. Hopefully the environment is set up.
    initializeApp();
  }
  
  const db = getFirestore();
  
  const templateId = "mmoa-sales-agreement-v1";
  const templateRef = db.collection("documentTemplates").doc(templateId);
  
  const MMOA_AGREEMENT_HTML = `
<h1>Sole Selling Rights & Auction Instruction Agreement</h1>
<p><strong>Method of Sale:</strong> The Modern Method of Auction (Conditional) Platform: My Auction Portal Powered By The Auction Department Limited</p>
<hr />
<h2>1. The Parties</h2>
<p><strong>The Auction Provider:</strong> The Auction Department Limited (trading as Off Market Property Traders).<br />
• Registered Office: Monometer House, Rectory Grove, Leigh on Sea, Essex, SS9 2HN.<br />
• Company No: 08952748 | VAT No: GB 186 8746 44 | TPO Member: R808.</p>
<p><strong>The Partner Agent:</strong> [Insert Local Estate Agency Name & Address].<br />
The Partner Agent is the Seller’s primary point of contact for all physical and verbal communications.</p>
<p><strong>The Seller(s):</strong> [Full Name(s) of Legal Owners].<br />
<strong>The Seller(s) Telephone:</strong> [Sellers Mobile Telephone Number]<br />
<strong>The Seller(s) Email:</strong> [Sellers Email Address(es)]</p>
<p><strong>The Property:</strong> [Full Address of Property for Sale].</p>
<hr />
<h2>2. The Partnership & Service Model</h2>
<p><strong>2.1 Infrastructure as a Service:</strong> The Seller acknowledges that this sale is powered by a strategic partnership. The Partner Agent provides professional advisory and "front-of-house" services, while The Auction Provider provides the secure, private digital infrastructure and auctioneer services.</p>
<p><strong>2.2 Communication Protocol:</strong> All face-to-face interactions, telephone communications, and property viewings shall be conducted exclusively via the Partner Agent. The Auction Provider operates the portal and will only interact with the Seller through the digital interface or via instructions relayed by the Partner Agent.</p>
<hr />
<h2>3: Data Ownership, Retention, and Disclosure</h2>
<p><strong>3.1 Intellectual Property and Data Retention:</strong> All data captured or generated during the course of this instruction shall remain the sole intellectual property of The Auction Department Limited. This data will be stored and processed in strict accordance with all prevailing UK and EU legislation (including, but not limited to, the UK GDPR and the Data Protection Act 2018). Such data will be retained for a period of up to seven (7) years from the date of entry, after which it will be securely deleted or anonymised, unless further retention is required to satisfy ongoing legal or regulatory obligations.</p>
<p><strong>3.2 Disclosure to Authorities:</strong> The Auction Department Limited reserves the right to share captured data with relevant legislative bodies, law enforcement agencies, and other recognised regulatory authorities. Such disclosure will only occur when the company is legally required to do so, or when formally compelled by a court order, statutory demand, or a valid request from a body with the necessary legal jurisdiction.</p>
<hr />
<h2>4. Property Standards & Insurance</h2>
<p><strong>4.1 Marketing Standards:</strong> The Seller confirms all information provided is accurate and not misleading, as required by the Consumer Protection from Unfair Trading Regulations 2008. The Seller must notify the Partner Agent immediately of any changes to the property's condition or legal status.</p>
<p><strong>4.2 Unoccupied Properties:</strong> Neither the Partner Agent nor The Auction Provider is responsible for the maintenance, repair, or security of unoccupied properties. It is the Seller's sole responsibility to:<br />
• Ensure all mains services (water, gas, electricity) are turned off.<br />
• Ensure all water systems are professionally drained.<br />
• Ensure the property is secured against intruders or damage.</p>
<p><strong>4.3 Property Insurance:</strong> The Seller must maintain adequate building and contents insurance throughout the duration of this agreement. For unoccupied properties, the Seller must notify their insurers of the status. The Auction Provider and Partner Agent accept no liability for loss or damage arising from the Seller's failure to maintain insurance or secure the premises.</p>
<hr />
<h2>5. Fees & Cancellation Terms</h2>
<p><strong>5.1 Remuneration (Buyer-Funded Model):</strong> The primary fee is a Reservation Fee paid by the Buyer (typically [4%] + VAT, subject to a minimum of &pound;6,000 inc. VAT). This fee covers the professional services of both the Partner Agent and The Auction Provider.</p>
<p><strong>5.2 Cancellation of Conditional Auction Sales:</strong> If the Seller withdraws the Property from the Conditional Auction Sale after instructions have been signed or if the Seller refuses to proceed with a sale to a Buyer who has met the Guide Price/Reserve, a withdrawal fee shall be payable to The Auction Provider:<br />
• Withdrawal Fee: 1.2% of the lower Guide Price, subject to a minimum of &pound;3,600.00 (inc. VAT).<br />
• Auction Entry Fee: Any previously agreed Auction Entry Fee or Legal Pack costs remain due and non-refundable.</p>
<hr />
<h2>6. Statutory Notice: Sole Selling Rights</h2>
<p><strong>Sole Selling Rights:</strong> You will be liable to pay remuneration to us (via the Buyer&rsquo;s Reservation Fee or the Cancellation Fee), in addition to any other costs or charges agreed, in each of the following circumstances:</p>
<ol>
<li>If unconditional contracts for the sale of the property are exchanged in the period during which we have sole selling rights, even if the purchaser was not found by us but by another agent or by any other person, including yourself;</li>
<li>If unconditional contracts for the sale of the property are exchanged after the expiry of the period during which we have sole selling rights but to a purchaser who was introduced to you during that period or with whom we had negotiations about the property during that period.</li>
</ol>
<hr />
<h2>7. Agreement Term & Right to Cancel</h2>
<p>• <strong>Minimum Period:</strong> [12] weeks from [Date].<br />
• <strong>Notice Period:</strong> [14] days' written notice after the minimum period.<br />
• <strong>Cooling-Off Period:</strong> The Seller has a 14-day Right to Cancel this agreement from the date of signing, provided the property has not yet been successfully sold at auction.</p>
<hr />
<h2>8. Signatures</h2>
<p>Signed by the Seller(s): __________________________ Date: __________</p>
<p>Signed on behalf of The Partner Agent: ____________________ Date: __________</p>
<p>Signed on behalf of The Auction Provider: ____________________ Date: __________</p>
  `;

  await templateRef.set({
    id: templateId,
    title: "Modern Method of Auction Sales Agreement",
    type: "Document",
    category: "Pre-Auction",
    description: "Sole Selling Rights & Auction Instruction Agreement for the Modern Method of Auction (Conditional).",
    content: MMOA_AGREEMENT_HTML,
    status: "Final",
    createdAt: new Date(),
    updatedAt: new Date(),
    authorName: "System"
  }, { merge: true });
  
  console.log("MMOA Template seeded successfully via Standalone Firestore script.");
}

seedMmoaTemplate().catch(e => console.error(e));
