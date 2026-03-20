"use client";

import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { useCollection, useFirestore, useMemoFirebase } from "../firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { type GeoRegion, type GeoArea, type GeoLocation, type GeographyHierarchy } from "../services/geography/types";
import { MapPin, Loader2 } from "lucide-react";

interface CascadingGeographySelectProps {
  onHierarchyChange: (hierarchy: GeographyHierarchy) => void;
  initialValues?: GeographyHierarchy;
}

/**
 * @fileOverview Production Cascading Geography Component.
 * UK-EN: character-accurately maps management tiers to ONS geography.
 */
export function CascadingGeographySelect({ onHierarchyChange, initialValues }: CascadingGeographySelectProps) {
  const firestore = useFirestore();
  
  const [selectedRegion, setSelectedRegion] = useState(initialValues?.region || "");
  const [selectedArea, setSelectedArea] = useState(initialValues?.area || "");
  const [selectedLocation, setSelectedLocation] = useState(initialValues?.location || "");

  // Level 1: Regions (Regional Manager Tier)
  const regionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "geography"), orderBy("name", "asc"));
  }, [firestore]);
  const { data: regions, isLoading: loadingRegions } = useCollection<GeoRegion>(regionsQuery);

  // Level 2: Areas (Area Manager Tier)
  const areasQuery = useMemoFirebase(() => {
    if (!firestore || !selectedRegion) return null;
    return query(collection(firestore, "geography", selectedRegion, "areas"), orderBy("name", "asc"));
  }, [firestore, selectedRegion]);
  const { data: areas, isLoading: loadingAreas } = useCollection<GeoArea>(areasQuery);

  // Level 3: Locations (Sales Manager Tier)
  const locationsQuery = useMemoFirebase(() => {
    if (!firestore || !selectedRegion || !selectedArea) return null;
    return query(collection(firestore, "geography", selectedRegion, "areas", selectedArea, "locations"), orderBy("name", "asc"));
  }, [firestore, selectedRegion, selectedArea]);
  const { data: locations, isLoading: loadingLocations } = useCollection<GeoLocation>(locationsQuery);

  useEffect(() => {
    onHierarchyChange({
      region: selectedRegion,
      area: selectedArea,
      location: selectedLocation
    });
  }, [selectedRegion, selectedArea, selectedLocation]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Region (Regional Manager)</Label>
        <Select value={selectedRegion} onValueChange={(v) => { setSelectedRegion(v); setSelectedArea(""); setSelectedLocation(""); }}>
          <SelectTrigger className="h-10">
            {loadingRegions ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-3.5 w-3.5 mr-2 text-primary" />}
            <SelectValue placeholder="Select Region" />
          </SelectTrigger>
          <SelectContent>
            {regions?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Area (Area Manager)</Label>
        <Select value={selectedArea} onValueChange={(v) => { setSelectedArea(v); setSelectedLocation(""); }} disabled={!selectedRegion}>
          <SelectTrigger className="h-10">
            {loadingAreas ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-3.5 w-3.5 mr-2 text-secondary" />}
            <SelectValue placeholder="Select Area" />
          </SelectTrigger>
          <SelectContent>
            {areas?.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">City/Borough (Sales Manager)</Label>
        <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={!selectedArea}>
          <SelectTrigger className="h-10">
            {loadingLocations ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-3.5 w-3.5 mr-2 text-accent" />}
            <SelectValue placeholder="Select City/Borough" />
          </SelectTrigger>
          <SelectContent>
            {locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
