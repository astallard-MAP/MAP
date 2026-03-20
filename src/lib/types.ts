import { Timestamp } from "firebase/firestore";
import { BusinessType } from "./schemas";

export type UserRole = 
  | 'Global Admin'
  | 'TAD Admin'
  | 'Regional Manager'
  | 'Area Manager'
  | 'Sales Manager'
  | 'Agency Owner'
  | 'Regional Manager (Agency)'
  | 'Branch Manager'
  | 'Office Administrator'
  | 'Sales Negotiator'
  | 'Buyer'
  | 'Seller'
  | 'Solicitor'
  | 'Standard User'
  | 'Individual'
  | 'Group of Individuals'
  | 'Company'
  | 'Corporate Body';

export type UserStatus = 'Pending' | 'Invited' | 'Active' | 'Inactive' | 'Archived';

export interface Address {
    houseNameOrNumber?: string;
    addressLine1: string;
    addressLine2?: string;
    townCity: string;
    county?: string;
    postcode: string;
    latitude?: number;
    longitude?: number;
}

export interface Branch {
    id: string; 
    name: string;
    address: Address;
    contactTelephone: string;
    emailAddress: string;
    status: 'active' | 'archived' | 'inactive';
    deletionRequested: boolean;
}

export interface UserProfile {
    id?: string;
    uid: string;
    email: string; 
    workEmail?: string;
    homeEmail?: string;
    displayName: string;
    role: UserRole;
    status: UserStatus;
    firstName: string;
    surname: string;
    title: string;
    photoURL?: string;
    telephone?: string;
    mobile?: string;
    address?: Address;
    organisationId?: string;
    solicitorFirmId?: string;
    branchIds: string[];
    region?: string; 
    area?: string;   
    termsAccepted: boolean;
    marketingConsent?: boolean;
    deletionRequested: boolean;
    rankingPoints?: number;
    winningStreak?: number;
    lastGameDate?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface PublicUserProfile {
    uid: string;
    displayName: string;
    email: string;
    firstName: string;
    surname: string;
    role: UserRole;
    organisationId?: string;
    solicitorFirmId?: string;
    branchIds: string[];
    branchNames?: string[];
    status: UserStatus;
    photoURL: string;
    region?: string;
    area?: string;
    deletionRequested: boolean;
}

export interface Organisation {
    id: string;
    name: string;
    businessType: BusinessType;
    status: 'Active' | 'Pending' | 'Invited' | 'Inactive' | 'Archived';
    ownerUid: string;
    headOfficeAddress: Address;
    registeredOfficeAddress: Address;
    mainContactTelephone: string;
    generalContactEmail: string;
    website?: string;
    logoUrl?: string;
    region?: string; 
    area?: string;   
    brandColours?: string[];
    brandFont?: string;
    isVatRegistered: boolean;
    vatRegistrationNumber?: string;
    companyRegistrationNumber?: string;
    tpoRegistrationNumber?: string;
    numberOfPartners?: number;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface StaffInvitation {
    id: string;
    organisationId: string;
    organisationName: string;
    email: string;
    firstName: string;
    surname: string;
    intendedRole: UserRole;
    token: string;
    status: 'Pending' | 'Accepted' | 'Expired';
    createdAt: Timestamp;
    expiresAt: Timestamp;
    acceptedAt?: Timestamp;
}

export interface AccessRequest {
    id: string;
    companyName: string;
    firstName: string;
    surname: string;
    contactEmail: string;
    contactTelephone: string;
    website?: string;
    headOfficeAddress: Address;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Timestamp;
}

export interface SolicitorRanking {
    id: string;
    firmId: string;
    firmName: string;
    interactionSpeed: number;
    responseTime: number;
    customerRating: number;
    completedTransactions: number;
    location: string;
}

export interface SolicitorDocument {
    id: string;
    title: string;
    content: string;
    status: 'Draft' | 'Final';
    propertyId?: string;
    propertyName?: string;
    solicitorFirmId?: string;
    authorUid: string;
    authorName: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface AuctionHistoryItem {
  date: string;
  venue: string;
  lotsOffered: number;
  lotsSold: number;
  percentSold: string;
  totalRaised: string;
}

export interface PropertyCompliance {
  // PART A
  priceQualifier: string;
  councilTaxBand: string;
  leaseYearsRemaining?: number;
  annualGroundRent?: number;
  annualServiceCharge?: number;
  // PART B
  constructionType: 'Standard' | 'Non-Standard';
  electricitySource: string;
  waterSource: string;
  sewerageSource: string;
  heatingType: string;
  broadbandSpeed?: number;
  mobileSignalStrength?: string;
  parkingType?: string[];
  parkingSpaces?: number;
  // PART C
  buildingSafetyIssues?: string;
  listedBuildingStatus?: string;
  conservationArea?: boolean;
  publicRightsOfWay?: boolean;
  floodRiskSurface?: string;
  floodRiskRivers?: string;
  coastalErosionRisk?: boolean;
  accessibilityFeatures?: string[];
  // ENERGY
  epcRating?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'Not Required';
  epcCertificateUrl?: string;
}

export interface Property {
    id: string;
    status: "Draft" | "Submitted" | "Published" | "Available" | "Sold" | "Unsold" | "Contracts Exchanged" | "Completed";
    address: Address;
    propertyType: 'House' | 'Flat/Apartment' | 'Bungalow' | 'Land' | 'Commercial' | 'Other';
    headline: string;
    subheading?: string;
    accommodation?: AccommodationGroup[];
    location?: string;
    notes?: string;
    viewingArrangements?: string;
    tenure: "Freehold" | "Leasehold" | "Commonhold";
    tenancyStatus: "Vacant" | "Tenanted";
    sellers: Party[];
    solicitor: SolicitorFirm;
    photographs?: string[];
    floorplanUrl?: string;
    videoTourUrl?: string;
    virtualTourUrl?: string;
    legalPack?: LegalDocument[];
    auctionType?: "Online Timed Auction" | "Livestream Auction" | "In Room Auction" | "Live at Property Auction" | "Modern Method of Auction";
    auctionEventId?: string;
    guidePriceType: 'single' | 'range';
    guidePrice?: number;
    guidePriceFrom?: number;
    guidePriceTo?: number;
    reservePrice: number;
    organisationId: string;
    branchId?: string;
    submittedBy: string;
    entryFeeType: 'instruct' | 'deferred';
    commission: Commission;
    region?: string;
    area?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    // 2026 COMPLIANCE DATA
    compliance?: PropertyCompliance;
    // PUBLICATION STATUS
    publishedTo?: {
      rightmove?: boolean;
      zoopla?: boolean;
      otm?: boolean;
    };
}

export interface SolicitorFirm {
    id?: string;
    companyName: string;
    sraNumber?: string;
    address: Address;
    contacts: SolicitorContact[];
}

export interface SolicitorContact { title: string; firstName: string; surname: string; email: string; }
export interface LegalDocument { type: string; originalUrl?: string; redactedUrl?: string; }
export interface AccommodationGroup { group: string; rooms: Room[]; }
export interface Room { name: string; widthFt?: number; widthIn?: number; lengthFt?: number; lengthIn?: number; widthM?: number; lengthM?: number; }
export interface Party { partyType: string; email: string; mobile: string; address: Address; }
export interface Commission { type: 'percentage' | 'fixed'; percentage?: number; minimumAmount?: number; fixedAmount?: number; }

export interface SupportChat {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    createdAt: Timestamp;
    status: "open" | "closed";
    lastMessageSnippet: string;
    lastMessageAt: Timestamp;
    readByAdmin: boolean;
    readByUser: boolean;
    escalated: boolean;
}

export interface SupportMessage {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    senderType: 'user' | 'model' | 'admin';
    timestamp: Timestamp;
}

export interface Suggestion {
    id: string;
    suggestionText: string;
    submittedBy: string;
    userName: string;
    organisationId: string;
    organisationName: string;
    submittedAt: Timestamp;
    status: 'new' | 'assigned' | 'in-progress' | 'completed' | 'rejected';
    importance: 'Essential' | 'Medium' | 'Low' | 'File 13';
    assignedToName?: string;
}

export interface AppNotification {
    id: string;
    message: string;
    read: boolean;
    type: 'SYSTEM_ERROR' | 'INFO' | 'WARNING';
    createdBy: string;
    link?: string;
    createdAt: Timestamp;
}

export interface NewsArticle {
    id: string;
    title: string;
    summary: string;
    source: string;
    publishedAt: Timestamp;
}

export interface AuctionEvent {
    id: string;
    title: string;
    start: Timestamp;
    status: string;
    auctionType?: string;
}

/**
 * @fileOverview Production Portal Publication Result Type.
 * Ensures character-accurate type narrowing for publication outcomes.
 */
export type PortalActionResult = 
  | { success: true; message: string }
  | { success: false; error: string };
