/**
 * @fileOverview Production Geographical Hierarchy Types for MAP261125.
 * UK-EN: character-accurately mapped to 2026 ONS tiers.
 */

export interface GeoRegion {
  id: string; // ONS Region Code
  name: string; // e.g., Greater London, North West
}

export interface GeoArea {
  id: string; // ONS County/Unitary Authority Code
  name: string; // e.g., Essex, Kent
  regionId: string;
}

export interface GeoLocation {
  id: string; // ONS City/Borough Code
  name: string; // e.g., Southend-on-Sea, London Borough of Newham
  areaId: string;
  type: 'City' | 'Borough';
}

export interface GeoDistrict {
  id: string; // OS Open Names / Sub-district Code
  name: string; // e.g., East Ham, Leigh-on-Sea
  locationId: string;
}

export type GeographyHierarchy = {
  region?: string;
  area?: string;
  location?: string;
  district?: string;
};
