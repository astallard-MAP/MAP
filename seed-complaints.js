
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Using the project ID specified in genkit.ts for multi-environment stability
const projectId = 'map261125';

async function seedComplaintsTemplate() {
  console.log("Seeding Complaints Handling Procedure Template...");
  
  try {
    // In many local environments, initializeApp() without args uses GOOGLE_APPLICATION_CREDENTIALS
    const app = initializeApp({ projectId });
    const db = getFirestore(app);

    const docId = 'complaints-procedure-v1';
    const docRef = db.collection('documentTemplates').doc(docId);

    const content = `
      <h1>Complaints Handling Procedure</h1>
      <p>The Auction Department Limited is committed to providing a professional service to all our clients and members. When something goes wrong, we need you to tell us about it. This will help us to improve our standards.</p>
      
      <p>If you have a complaint, please put it in writing, including as much detail as possible. We will then respond in line with the timeframes set out below (as required by The Property Ombudsman and RICS best practice).</p>
      
      <h3>Stage One: Initial Investigation</h3>
      <p>Please send your written complaint to our Head Office addressed to the <strong>Complaints Officer</strong>:</p>
      <ul>
        <li><strong>By Email:</strong> <a href="mailto:info@auctiondepartment.com">info@auctiondepartment.com</a></li>
        <li><strong>By Post:</strong> Hillsboro’, 377 Southchurch Road, Southend on Sea, Essex, SS1 2PQ</li>
      </ul>
      <p>We will acknowledge your complaint within 3 working days of receipt. A senior member of staff who was not directly involved in the transaction will then investigate your complaint. A formal written outcome of our investigation will be sent to you within 15 working days of sending the acknowledgement letter.</p>
      
      <h3>Stage Two: Internal Review</h3>
      <p>If you remain dissatisfied with the initial response, you can request an independent internal review. This review will be conducted by a Director of The Auction Department Limited.</p>
      <p>Following the conclusion of this review, we will write to you within 15 working days of receiving your request for a review. This response will represent our <strong>Final Viewpoint</strong> on the matter and will include a written statement confirming our final offer (if any).</p>
      
      <h3>The Property Ombudsman</h3>
      <p>If you remain dissatisfied with the conclusion of our internal investigation after receiving our Final Viewpoint letter, or if more than 8 weeks has elapsed since the complaint was first made, you can request an independent review from <strong>The Property Ombudsman</strong> without charge.</p>
      <p><strong>Note:</strong> You must refer your complaint to The Property Ombudsman within 12 months of receiving our Final Viewpoint letter.</p>
      
      <p>The Property Ombudsman Contact Details:</p>
      <ul>
        <li><strong>Address:</strong> Milford House, 43-55 Milford Street, Salisbury, Wiltshire, SP1 2BP</li>
        <li><strong>Telephone:</strong> 01722 333 306</li>
        <li><strong>Website:</strong> <a href="http://www.tpos.co.uk" target="_blank">www.tpos.co.uk</a></li>
        <li><strong>Membership Number:</strong> R808</li>
      </ul>
      
      <hr />
      
      <h3>Company Information</h3>
      <table>
        <tr>
          <td><strong>Legal Entity</strong></td>
          <td>The Auction Department Limited</td>
        </tr>
        <tr>
          <td><strong>Registration No.</strong></td>
          <td>08952748</td>
        </tr>
        <tr>
          <td><strong>VAT No.</strong></td>
          <td>GB 186 8746 44</td>
        </tr>
        <tr>
          <td><strong>Registered Address</strong></td>
          <td>Monometer House, Rectory Grove, Leigh on Sea, Essex, SS9 2HN</td>
        </tr>
        <tr>
          <td><strong>Head Office</strong></td>
          <td>Hillsboro’, 377 Southchurch Road, Southend on Sea, Essex, SS1 2PQ</td>
        </tr>
        <tr>
          <td><strong>Main Telephone</strong></td>
          <td>0203 174 0330</td>
        </tr>
      </table>
    `;

    await docRef.set({
      id: docId,
      title: "Complaints Handling Procedure",
      type: "Document",
      category: "Compliance",
      description: "UK-EN: Mandatory legal procedure for TPO/RICS compliance. Outlines timeframes and points of contact for client grievances.",
      status: "Final",
      content: content,
      authorUid: "XVtQ7DdJCLVRuPnWhdpshJ0wxwz2", // Miss Lucy Slowey (TAD Admin)
      authorName: "Miss Lucy Slowey",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    console.log("SUCCESS: Complaints Template Created.");
  } catch (error) {
    console.error("ERROR seeding template:", error.message);
    process.exit(1);
  }
}

seedComplaintsTemplate();
