---
description: Complaints Handling Lifecycle & Production Audit Workflow
---

# Complaints Handling Workflow (MAP261125)

This workflow defines the forensic lifecycle of a complaint submitted to The Auction Department Limited, ensuring strict adherence to TPO (The Property Ombudsman) and RICS standards.

## Stage 1: Intake & AI Analysis
1.  **Submission**: Complainant submits a written grievance via the **Public Complaint Portal** or direct contact.
2.  **Registration**: System assigns a unique **COMP-XXXXX** identifier and records all metadata in Firestore.
3.  **Frank AI Audit**:
    - AI analyzes the text for specific service flaws.
    - AI provides a checklist and draft response for the **Complaints Officer**.

## Stage 2: Initial Investigation (Officer Level)
1.  **Acknowledgement**: SEND WRITTEN ACKNOWLEDGEMENT within **3 Working Days**.
2.  **Investigation**: A senior member (not involved in the case) investigates the grievance.
3.  **Formal Outcome**: SEND WRITTEN OUTCOME within **15 Working Days** of the acknowledgement.
4.  **Audit**: AI monitors the timeline and flags delays to the Director.

## Stage 3: Internal Review (Director Level)
1.  **Escalation**: Triggered if the complainant remains dissatisfied with Stage One response.
2.  **Review**: A **Director** conducts an independent review of the entire case file.
3.  **Final Viewpoint**: SEND WRITTEN STATEMENT within **15 Working Days** of the review request.
    - Must include a final offer or definitive rejection.
    - Must include referral info for The Property Ombudsman.

## Stage 4: High-Fidelity Ombudsman Review
1.  **Escalation**: Referral to **The Property Ombudsman (TPO)** after 8 weeks or if Final Viewpoint is rejected.
2.  **Referral Outcome**: Decision from TPO is final and recorded in the case registry.

---
*UK-EN Production Standard: Verified for RICS and TPO compliance 2026.*
