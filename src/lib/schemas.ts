import { z } from 'zod';

// Utility for creating Zod schemas from Firestore Timestamps
export const TimestampSchema = z.object({
  seconds: z.number(),
  nanoseconds: z.number(),
}).optional();

// UK Postcode Regex for validation
const ukPostcodeRegex = /([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2}))))\s?[0-9][A-Za-z]{2})/;

// Define Address Schema
export const AddressSchema = z.object({
  houseNameOrNumber: z.string().optional().or(z.literal('')),
  addressLine1: z.string().min(1, 'Address Line 1 is required.'),
  addressLine2: z.string().optional().or(z.literal('')),
  townCity: z.string().min(1, 'Town/City is required.'),
  county: z.string().optional().or(z.literal('')),
  postcode: z.string().regex(ukPostcodeRegex, 'A valid UK postcode is required.'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const TitleEnum = z.enum(['Mr', 'Mrs', 'Miss', 'Ms', 'Mx', 'Dr', 'Prof', 'Rev', 'Sir', 'Lord', 'Lady', 'Madam']);

export const UserRoleEnum = z.enum([
  'Global Admin',
  'TAD Admin',
  'Regional Manager',
  'Area Manager',
  'Sales Manager',
  'Agency Owner',
  'Regional Manager (Agency)',
  'Branch Manager',
  'Office Administrator',
  'Sales Negotiator',
  'Buyer',
  'Seller',
  'Solicitor',
  'Standard User',
  'Individual',
  'Group of Individuals',
  'Company',
  'Corporate Body',
]);

export const UserStatusEnum = z.enum(['Pending', 'Invited', 'Active', 'Inactive', 'Archived']);

export const BusinessTypeEnum = z.enum([
    "Sole Trader",
    "Partnership",
    "Private Limited Company",
    "Public Limited Company",
    "Community Interest Company",
    "Co-operative"
]);

export type BusinessType = z.infer<typeof BusinessTypeEnum>;

export const OrganisationSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  businessType: BusinessTypeEnum,
  numberOfPartners: z.number().optional(),
  headOfficeAddress: AddressSchema,
  registeredOfficeAddress: AddressSchema,
  mainContactTelephone: z.string().min(1, "Telephone is required"),
  generalContactEmail: z.string().email("Invalid email"),
  companyRegistrationNumber: z.string().optional().or(z.literal('')),
  tpoRegistrationNumber: z.string().optional().or(z.literal('')),
  isVatRegistered: z.boolean().optional(),
  vatRegistrationNumber: z.string().optional().or(z.literal('')),
  logoUrl: z.string().optional(),
  website: z.string().url("Invalid URL").or(z.literal("")).optional(),
  region: z.string().optional().or(z.literal('')),
  area: z.string().optional().or(z.literal('')),
  brandColours: z.array(z.string()).optional(),
  brandFont: z.string().optional().or(z.literal('')),
});

export const BranchSchema = z.object({
  name: z.string().min(2, 'Branch name is required.'),
  address: AddressSchema,
  contactTelephone: z.string().min(1, 'A valid contact phone number is required.'),
  emailAddress: z.string().email('Invalid contact email address.'),
  status: z.enum(['active', 'archived', 'inactive']),
  deletionRequested: z.boolean(),
});

export const createUserManagementSchema = (manageableRoles: string[]) => {
    const roles = manageableRoles.length > 0 ? manageableRoles : ['Sales Negotiator'];
    const rolesEnum = z.enum(roles as [string, ...string[]]);
    
    return z.object({
        title: TitleEnum,
        firstName: z.string().min(1, "First name is required"),
        surname: z.string().min(1, "Surname is required"),
        workEmail: z.string().email("Invalid work email").optional().or(z.literal('')),
        homeEmail: z.string().email("Invalid home email").optional().or(z.literal('')),
        telephone: z.string().optional().or(z.literal('')),
        mobile: z.string().optional().or(z.literal('')),
        address: AddressSchema.optional(),
        role: rolesEnum,
        status: UserStatusEnum.optional(),
        branchIds: z.array(z.string()).min(1, "User must be assigned to at least one branch."),
        region: z.string().optional().or(z.literal('')),
        area: z.string().optional().or(z.literal('')),
    });
};

const RoomSchema = z.object({
  name: z.string().min(1, 'Room name is required.'),
  widthFt: z.number().optional(),
  widthIn: z.number().optional(),
  lengthFt: z.number().optional(),
  lengthIn: z.number().optional(),
  widthM: z.number().optional(),
  lengthM: z.number().optional(),
});

const AccommodationGroupSchema = z.object({
  group: z.string().min(1, 'Floor name is required.'),
  rooms: z.array(RoomSchema).min(1, 'At least one room is required on this floor.'),
});

export const PartySchema = z.object({
    partyType: z.enum(['Individual', 'Group of Individuals', 'Company', 'Corporate Body']),
    title: TitleEnum.optional(),
    firstName: z.string().optional(),
    surname: z.string().optional(),
    companyName: z.string().optional(),
    registrationNumber: z.string().optional(),
    email: z.string().email("A valid email is required"),
    mobile: z.string().min(1, "A mobile number is required"),
    address: AddressSchema,
});

const SolicitorContactSchema = z.object({
    title: TitleEnum,
    firstName: z.string().min(1, 'First name is required.'),
    surname: z.string().min(1, 'Surname is required.'),
    email: z.string().email('A valid email is required.'),
});

const SolicitorFirmSchema = z.object({
    companyName: z.string().min(1, "Solicitor's firm name is required"),
    sraNumber: z.string().optional(),
    address: AddressSchema,
    contacts: z.array(SolicitorContactSchema).min(1, "At least one solicitor contact is required."),
});

// 2026 MATERIAL INFORMATION ENUMS (UK STANDARDS)
export const PriceQualifierEnum = z.enum([
  "Fixed Price",
  "Offers in Excess of",
  "Guide Price",
  "Offers in Region of",
  "Sale by Tender",
  "Price on Application"
]);

export const CouncilTaxBandEnum = z.enum(["A", "B", "C", "D", "E", "F", "G", "H", "Included in Rent", "Exempt"]);

export const ConstructionTypeEnum = z.enum(["Standard", "Non-Standard"]);

export const UtilitySourceEnum = z.enum(["Mains", "Solar", "Generator", "Septic Tank", "None"]);

export const HeatingTypeEnum = z.enum(["Gas Central", "Air Source Heat Pump", "Electric", "Oil", "None"]);

export const ParkingTypeEnum = z.enum(["Garage", "Driveway", "On-street", "Allocated", "Off-street", "None"]);

export const ComplianceSchema = z.object({
  // PART A
  priceQualifier: PriceQualifierEnum,
  councilTaxBand: CouncilTaxBandEnum,
  leaseYearsRemaining: z.number().optional(),
  annualGroundRent: z.number().optional(),
  annualServiceCharge: z.number().optional(),
  // PART B
  constructionType: ConstructionTypeEnum,
  electricitySource: UtilitySourceEnum,
  waterSource: UtilitySourceEnum,
  sewerageSource: UtilitySourceEnum,
  heatingType: HeatingTypeEnum,
  broadbandSpeed: z.number().describe("Expected speed in Mbps").optional(),
  mobileSignalStrength: z.string().optional(),
  parkingType: z.array(ParkingTypeEnum).optional(),
  parkingSpaces: z.number().optional(),
  // PART C
  buildingSafetyIssues: z.string().optional(),
  listedBuildingStatus: z.enum(["None", "Grade I", "Grade II", "Grade II*"]).optional(),
  conservationArea: z.boolean().optional(),
  publicRightsOfWay: z.boolean().optional(),
  floodRiskSurface: z.enum(["Low", "Medium", "High"]).optional(),
  floodRiskRivers: z.enum(["Low", "Medium", "High"]).optional(),
  coastalErosionRisk: z.boolean().optional(),
  accessibilityFeatures: z.array(z.string()).optional(),
  // ENERGY (EPC)
  epcRating: z.enum(["A", "B", "C", "D", "E", "F", "G", "Not Required"]),
  epcCertificateUrl: z.string().optional(),
});

export const PropertyFormSchema = z.object({
    id: z.string().optional(),
    status: z.enum(["Draft", "Submitted", "Published", "Available", "Sold", "Unsold", "Contracts Exchanged", "Completed"]),
    address: AddressSchema,
    propertyType: z.enum(['House', 'Flat/Apartment', 'Bungalow', 'Land', 'Commercial', 'Other']),
    headline: z.string().min(1, 'Headline is required.').max(150).transform(val => val.toUpperCase()),
    subheading: z.string().min(1, 'Subheading is required.').max(300).optional(),
    accommodation: z.array(AccommodationGroupSchema).optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
    viewingArrangements: z.string().optional(),
    tenure: z.enum(["Freehold", "Leasehold", "Commonhold"]),
    tenancyStatus: z.enum(["Vacant", "Tenanted"]),
    sellers: z.array(PartySchema).min(1, 'At least one seller is required.'),
    solicitor: SolicitorFirmSchema,
    auctionType: z.enum(["Online Timed Auction", "Livestream Auction", "In Room Auction", "Live at Property Auction", "Modern Method of Auction"]),
    auctionEventId: z.string().optional(),
    guidePriceType: z.enum(['single', 'range']),
    guidePrice: z.number().optional(),
    guidePriceFrom: z.number().optional(),
    guidePriceTo: z.number().optional(),
    reservePrice: z.number().min(1, 'Reserve price is required.'),
    organisationId: z.string().optional(),
    submittedBy: z.string().optional(),
    entryFeeType: z.enum(['instruct', 'deferred']),
    commission: z.object({ type: z.enum(['percentage', 'fixed']), percentage: z.number().optional(), minimumAmount: z.number().optional(), fixedAmount: z.number().optional() }),
    photographs: z.array(z.string()).optional(),
    floorplanUrl: z.string().optional(),
    videoTourUrl: z.string().optional(),
    virtualTourUrl: z.string().optional(),
    buyerAdminFee: z.object({
      percentage: z.number().optional(),
      minimum: z.number().optional()
    }).optional(),
    buyerPremium: z.object({
      percentage: z.number().optional(),
      minimum: z.number().optional()
    }).optional(),
    buyerInstructions: z.string().optional(),
    region: z.string().optional(),
    area: z.string().optional(),
    // 2026 COMPLIANCE LAYER
    compliance: ComplianceSchema.optional(),
});
