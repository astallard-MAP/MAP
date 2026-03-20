// This file contains constants used throughout the application.
// CITED: Verification of Global Admin UIDs, Company Branding, and Official Auction Schedule

export const APP_ID = "my-auction-portal";
export const APP_NAME = "My Auction Portal";
export const COMPANY_NAME = "The Auction Department Limited";

// Definitive list of Global Administrator UIDs for The Auction Department Limited.
export const GLOBAL_ADMIN_UIDS = [
    "YEMX9fZTcZRf0gzaP9WHIUIsaXk1", // Mr Andrew Stallard (Global Admin)
    "r4q6hhyH9Qg9Ff2uCJQlOYUa1xM2", // Mr Tim Stallard (Global Admin)
    "XVtQ7DdJCLVRuPnWhdpshJ0wxwz2", // Miss Lucy Slowey (TAD Admin)
    "W8MAMYxxIBhrOWAz6tcog9DCLUD2"  // Mr Frank Tadsworth-Bids (Global Admin)
];

// Official Agreed Auction Schedule for 2025
// All dates are Thursdays as per production standard.
export const OFFICIAL_AUCTION_DATES = [
    { date: "2025-02-27", title: "February Property Auction" },
    { date: "2025-03-27", title: "March Property Auction" },
    { date: "2025-05-22", title: "May Property Auction" },
    { date: "2025-07-17", title: "July Property Auction" },
    { date: "2025-09-25", title: "September Property Auction" },
    { date: "2025-10-30", title: "October Property Auction" },
    { date: "2025-12-11", title: "December Property Auction" },
];

export const AUCTION_KEYWORDS = [
    "Auctioneer", "Bidding", "Completion", "Conveyancing", "Deposit", "Escrow", 
    "Freehold", "Gavel", "Inventory", "Leasehold", "Mortgage", "Negotiator", 
    "Ownership", "Portfolio", "Probate", "Receiver", "Solicitor", "Tenancy", 
    "Unconditional", "Valuation", "Withdrawn", "Yield"
];

export const TAD_DETAILS = {
    name: "The Auction Department Limited",
    regNumber: "08952748",
    tpoNumber: "R808",
    vatNumber: "GB 186 8746 44",
    registeredAddress: {
        houseNameOrNumber: "Monometer House",
        addressLine1: "Rectory Grove",
        addressLine2: "",
        townCity: "Leigh on Sea",
        county: "Essex",
        postcode: "SS9 2HN"
    },
    headOfficeAddress: {
        houseNameOrNumber: "Hillsboro’",
        addressLine1: "377 Southchurch Road",
        addressLine2: "",
        townCity: "Southend on Sea",
        county: "Essex",
        postcode: "SS1 2PQ"
    },
    phone: "0203 174 0330",
    email: "info@auctiondepartment.com",
    brand: {
        primary: "#8461a6",
        secondary: "#b964a4",
        accent: "#89a1b3",
        dark: "#1d1d1b"
    }
};
