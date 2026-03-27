
"use client"

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PublicBrandLogo from "../../../components/PublicBrandLogo";

export default function PrivacyPolicyPage() {
    const companyDetails = {
        name: "The Auction Department Limited",
        regNumber: "08952748",
        address: "Monometer House, Rectory Grove, Leigh-on-Sea, Essex SS9 2HN",
        icoNumber: "ZA031974", // Placeholder - please verify
        email: "Info@AuctionDepartment.com",
        dpoEmail: "Info@AuctionDepartment.com",
        phone: "0203 174 0330"
    };

  return (
    <main className="flex min-h-screen flex-col items-center bg-muted/40 p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
            <PublicBrandLogo />
        </div>
        <article className="prose prose-sm md:prose-base dark:prose-invert bg-card text-card-foreground rounded-lg shadow-lg p-6 md:p-10 w-full max-w-4xl mx-auto">
            
            <h1 className="text-center">Privacy Policy</h1>
            <p className="lead text-center"><strong>The Auction Department Limited - My Auction Portal</strong><br/>Last Updated: December 2024</p>
            
            <h2>1. Introduction</h2>
            <p>The Auction Department Limited ("we", "us", "our") is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, store, and protect your information when you use My Auction Portal (the "Portal"). We are registered with the Information Commissioner's Office (ICO) and comply with:</p>
            <ul>
                <li>UK General Data Protection Regulation (UK GDPR)</li>
                <li>Data Protection Act 2018</li>
                <li>Privacy and Electronic Communications Regulations (PECR)</li>
                <li>Money Laundering, Terrorist Financing and Transfer of Funds (Information on the Payer) Regulations 2017 (MLR 2017)</li>
                <li>The Property Ombudsman (TPO) Code of Practice</li>
                <li>Propertymark conduct and client money protection requirements</li>
            </ul>
            <p><strong>Data Controller Details:</strong></p>
            <ul>
                <li><strong>Company Name:</strong> {companyDetails.name}</li>
                <li><strong>Company Registration Number:</strong> {companyDetails.regNumber}</li>
                <li><strong>Registered Office:</strong> {companyDetails.address}</li>
                <li><strong>ICO Registration Number:</strong> {companyDetails.icoNumber}</li>
                <li><strong>Email:</strong> {companyDetails.email}</li>
                <li><strong>Phone:</strong> {companyDetails.phone}</li>
            </ul>
            
            <h2>2. Information We Collect</h2>
            <h3>2.1 Estate Agent Users</h3>
            <p>When you create a business profile on the Portal, we collect:</p>
            <p><strong>Account Information:</strong></p>
            <ul>
                <li>Business name and trading name</li>
                <li>Contact person name and position</li>
                <li>Business address and registered office</li>
                <li>Email address and telephone number</li>
                <li>Company registration number</li>
                <li>Professional accreditations and memberships</li>
            </ul>
            <p><strong>Identity Verification (AML Requirements):</strong></p>
            <ul>
                <li>Proof of identity documents</li>
                <li>Proof of business address</li>
                <li>Information about beneficial owners and controlling parties</li>
                <li>Source of funds/wealth information where required</li>
                <li>PEP (Politically Exposed Person) status</li>
            </ul>
            <p><strong>Professional Information:</strong></p>
            <ul>
                <li>Professional indemnity insurance details</li>
                <li>Client money protection scheme membership</li>
                <li>Property ombudsman membership details</li>
                <li>Anti-money laundering registration details</li>
            </ul>
            <h3>2.2 Property Seller Information</h3>
            <p>When estate agents upload seller details, we collect:</p>
            <p><strong>Personal Details:</strong></p>
            <ul>
                <li>Full name and contact information</li>
                <li>Current address and property address</li>
                <li>Email address and telephone number</li>
                <li>Identity verification documents (for AML compliance)</li>
                <li>Proof of ownership documents</li>
                <li>Source of funds information where applicable</li>
            </ul>
            <p><strong>Transaction Information:</strong></p>
            <ul>
                <li>Property details and legal pack documentation</li>
                <li>Solicitor/conveyancer details</li>
                <li>Financial information related to the sale</li>
                <li>Communication preferences</li>
            </ul>
            <h3>2.3 Property Information</h3>
            <ul>
                <li>Property addresses and descriptions</li>
                <li>Photographs and marketing materials</li>
                <li>Legal documentation</li>
                <li>Valuation information</li>
                <li>Title information</li>
            </ul>
            <h3>2.4 Technical Information</h3>
            <ul>
                <li>IP addresses</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Login times and portal usage data</li>
                <li>Cookies and similar technologies</li>
            </ul>

            <h2>3. Legal Basis for Processing</h2>
            <p>We process your personal data under the following legal bases:</p>
            <ul>
                <li><strong>Contractual Necessity:</strong> To provide the Portal services, facilitate transactions, and manage accounts.</li>
                <li><strong>Legal Obligation:</strong> To comply with AML/CTF, tax, TPO, and other legal requirements.</li>
                <li><strong>Legitimate Interests:</strong> For fraud prevention, service improvement, security, and business administration.</li>
                <li><strong>Consent:</strong> For direct marketing (where required), non-essential cookies, and other specific situations.</li>
            </ul>

            <h2>4. How We Use Your Information</h2>
            <ul>
                <li><strong>Service Delivery:</strong> To create accounts, process listings, facilitate communication, and provide support.</li>
                <li><strong>Legal and Regulatory Compliance:</strong> To conduct AML checks, maintain records, and report to authorities as required.</li>
                <li><strong>Security and Fraud Prevention:</strong> To detect and prevent fraud, protect the Portal, and analyse usage, and investigate suspicious activities.</li>
                <li><strong>Business Operations:</strong> To improve our services, analyse usage, and for internal reporting.</li>
            </ul>

            <h2>5. Data Sharing and Disclosure</h2>
            <p>We may share your personal data with:</p>
            <ul>
                <li><strong>Essential Service Providers:</strong> Payment processors, identity verification services, cloud hosting providers.</li>
                <li><strong>Professional Partners:</strong> Solicitors, conveyancers, auction platforms, and potential buyers (limited information).</li>
                <li><strong>Regulatory and Law Enforcement:</strong> The Property Ombudsman, Propertymark, HMRC, National Crime Agency, and other authorities as required by law.</li>
            </ul>

            <h2>6. International Transfers</h2>
            <p>We primarily store and process data within the United Kingdom. If we transfer data outside the UK/EEA, we ensure it is protected by an adequacy decision or appropriate safeguards like Standard Contractual Clauses.</p>

            <h2>7. Data Retention</h2>
            <p>We retain personal data for as long as necessary. Key retention periods include:</p>
            <ul>
                <li><strong>AML Records:</strong> Minimum 5 years from the end of the business relationship.</li>
                <li><strong>Transaction Records:</strong> 6 years from completion.</li>
            </ul>

            <h2>8. Your Rights Under UK GDPR</h2>
            <p>You have rights including access, rectification, erasure, restriction, portability, and the right to object or complain to the ICO. Some rights may be limited by our legal obligations (e.g., AML record keeping).</p>

            <h2>9. Security Measures</h2>
            <p>We implement robust technical and organisational measures, including encryption, access controls, regular security testing, and staff training to protect your data.</p>

            <h2>10. Anti-Money Laundering (AML) Compliance</h2>
            <p>We are legally required to verify identity, maintain records for 5 years, and report suspicious activity to the National Crime Agency. You cannot object to this processing as it is a legal requirement.</p>

            <h2>11. Property Ombudsman and Propertymark Compliance</h2>
            <p>As members, we comply with their Codes of Practice and may share information for complaint handling and compliance monitoring.</p>

            <h2>12. Cookies and Tracking Technologies</h2>
            <p>Our Portal uses cookies. Please see our separate Cookie Policy for detailed information.</p>

            <h2>13. Marketing Communications</h2>
            <p>We may send you marketing based on your consent or our legitimate interest. you can opt out at any time via the unsubscribe link in our emails.</p>

            <h2>14. Children's Privacy</h2>
            <p>Our Portal is not intended for individuals under 18. We do not knowingly collect data from children.</p>

            <h2>15. Changes to This Privacy Policy</h2>
            <p>We will notify you of material changes to this policy via email or a notice on the Portal.</p>

            <h2>16. Contact Information and Complaints</h2>
            <p>For data protection queries, please contact us at:</p>
            <ul>
                <li><strong>Email:</strong> {companyDetails.dpoEmail}</li>
                <li><strong>Post:</strong> Data Protection Officer, {companyDetails.name}, {companyDetails.address}</li>
                <li><strong>Phone:</strong> {companyDetails.phone}</li>
            </ul>
            <p>You have the right to complain to the Information Commissioner's Office (ICO) at <a href="http://www.ico.org.uk" target="_blank" rel="noopener noreferrer">www.ico.org.uk</a>.</p>
        </article>
        <div className="w-full max-w-4xl mx-auto mt-8 text-center">
            <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
            </Link>
        </div>
      </div>
    </main>
  );
}
