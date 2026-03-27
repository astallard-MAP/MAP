---
description: Anti-Money Laundering Compliance Lifecycle & Production Audit Workflow
---

# Anti-Money Laundering (AML) Compliance Workflow (MAP261125)

This workflow defines the forensic lifecycle of an AML case within The Auction Department Limited, ensuring strict adherence to the Money Laundering Regulations 2017 (MLR 2017) and POCA 2002.

## Stage 1: Subject Intake & High-Fidelity CDD
1.  **Instruction**: Seller or Buyer is registered in the portal.
2.  **Creation**: System assigns a unique **AML-XXXXX** identifier and creates the case file.
3.  **CDD (Customer Due Diligence)**:
    - Collect List A (Photo ID) and List B (Address Evidence).
    - AI scans documents for authenticity and expiration.
    - AI performs initial **PEP & Sanctions (OFSI)** screening.

## Stage 2: Forensic AI Audit (MLRO Desk)
1.  **AI Analysis**: Frank AI performs a forensic audit of the subject info.
2.  **Risk Rating**: Case is assigned a risk rating (**Low**, **Medium**, or **High**).
3.  **Red Flags**: AI identifies specific red flags (e.g., suspicious source of funds, shell companies).
4.  **Checklist**: AI generates a mandatory procedural checklist for the **MLRO**.

## Stage 3: Enhanced Due Diligence (EDD)
1.  **Trigger**: Required for **High-Risk** subjects or **PEPs (Politically Exposed Persons)**.
2.  **Investigation**: MLRO performs manual background checks and source of wealth verification.
3.  **Audit Action**: All investigation steps are recorded in the **AML Audit Trail** with a timestamp.

## Stage 4: Reporting & Submission (SAR)
1.  **Suspicion Trigger**: If MLRO identifies legitimate suspicion of money laundering or terrorist financing.
2.  **SAR (Suspicious Activity Report)**:
    - MLRO draft is audited by Frank AI for legal accuracy.
    - SAR is submitted via the **NCA (National Crime Agency)** portal.
3.  **Defensive Recording**: All SAR metadata (reference numbers, dates) is stored in the **AML Register**.

## Stage 5: Periodic Review & Termination
1.  **Retention**: Records are held for **5-7 years** as per HMRC requirements.
2.  **Review**: Active cases are reviewed every 12 months (or 6 months for High Risk).
3.  **Closure**: Case is archived or terminated when the relationship ends.

---
*UK-EN Production Standard: Verified for HMRC and MLR 2017 compliance 2026.*
