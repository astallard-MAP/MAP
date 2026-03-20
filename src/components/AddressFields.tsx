
"use client";

import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import Image from "next/image";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui";
import { Loader2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { cn } from "../lib/utils";

type ApiAddressData = {
    line_1: string;
    line_2: string;
    line_3: string;
    locality: string;
    town_or_city: string;
    county: string;
    latitude?: number;
    longitude?: number;
    postcode: string;
};

type AddressResult = {
  id: string;
  display: string;
  address: ApiAddressData;
};

const StreetViewPreview = ({ namePrefix }: { namePrefix: string }) => {
    const { control } = useFormContext();
    const lat = useWatch({ control, name: `${namePrefix}.latitude` });
    const lng = useWatch({ control, name: `${namePrefix}.longitude` });

    if (!lat || !lng) {
        return null;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("Google Maps API Key is not configured. Street View will not be shown.");
      return null;
    }

    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${lat},${lng}&fov=90&heading=235&pitch=10&key=${apiKey}`;

    return (
        <div className="mt-4 rounded-md overflow-hidden border">
            <Image
                src={streetViewUrl}
                alt="Google Maps Street View of the property"
                width={600}
                height={300}
                className="w-full object-cover"
            />
        </div>
    );
};


export const AddressFields = ({ control, namePrefix, disabled }: { control: any, namePrefix: string, disabled?: boolean }) => {
  const [postcode, setPostcode] = useState("");
  const [addresses, setAddresses] = useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { setValue, trigger } = useFormContext();

  const handleAddressSelect = (selectedId: string) => {
      const selectedAddress = addresses.find(a => a.id === selectedId);
      if (selectedAddress) {
          // Correctly map fields: line_1 from API often contains house number and street.
          // We will place it in addressLine1 and leave houseNameOrNumber for manual entry if needed.
          setValue(`${namePrefix}.houseNameOrNumber`, "", { shouldValidate: true });
          setValue(`${namePrefix}.addressLine1`, selectedAddress.address.line_1, { shouldValidate: true });
          setValue(`${namePrefix}.addressLine2`, selectedAddress.address.line_2, { shouldValidate: true });
          setValue(`${namePrefix}.townCity`, selectedAddress.address.town_or_city, { shouldValidate: true });
          setValue(`${namePrefix}.county`, selectedAddress.address.county, { shouldValidate: true });
          setValue(`${namePrefix}.postcode`, selectedAddress.address.postcode, { shouldValidate: true });
          setValue(`${namePrefix}.latitude`, selectedAddress.address.latitude, { shouldValidate: true });
          setValue(`${namePrefix}.longitude`, selectedAddress.address.longitude, { shouldValidate: true });
          
          setAddresses([]);
          trigger(namePrefix);
      }
  };

  const handlePostcodeLookup = async () => {
    if (!postcode.trim()) {
      toast({
        variant: "destructive",
        title: "Postcode Required",
        description: "Please enter a postcode before searching.",
      });
      return;
    }

    setIsLoading(true);
    setAddresses([]);

    try {
      const response = await fetch('/api/postcode-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postcode: postcode.trim() }),
      });

      const data: AddressResult[] | { error: string } = await response.json();

      if (!response.ok) {
        const errorData = data as { error: string };
        toast({
          variant: "destructive",
          title: "Lookup Failed",
          description: errorData.error || "An unknown error occurred.",
        });
        return;
      }

      const addressesData = data as AddressResult[];
      
      if (addressesData.length === 0) {
        toast({
          title: "No Addresses Found",
          description: "Please check the postcode or enter the address manually.",
        });
      } else {
        setAddresses(addressesData);
      }

    } catch (error) {
      console.error("Postcode lookup failed:", error);
      toast({
        variant: "destructive",
        title: "Lookup Error",
        description: "A network or server error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input 
          placeholder="Enter Postcode" 
          value={postcode} 
          onChange={(e) => setPostcode(e.target.value)}
          disabled={disabled || isLoading}
          maxLength={9}
          className="w-40"
        />
        <Button 
          type="button" 
          onClick={handlePostcodeLookup} 
          disabled={disabled || isLoading || !postcode.trim()}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Lookup"
          )}
        </Button>
      </div>

      {addresses.length > 0 && (
        <FormItem>
          <FormLabel>Select Address</FormLabel>
          <Select
            onValueChange={(value) => handleAddressSelect(value)} 
            disabled={disabled || isLoading}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Please select an address from the list" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {addresses.map((address) => (
                <SelectItem key={address.id} value={address.id}> 
                  {address.display}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}

      <div className="space-y-4 pt-4 mt-4 border-t">
        {namePrefix === 'address' && <StreetViewPreview namePrefix={namePrefix} />}
        <div className="grid grid-cols-1 gap-4">
          <FormField
              control={control}
              name={`${namePrefix}.houseNameOrNumber`}
              render={({ field }) => (
              <FormItem>
                  <FormLabel>House Name/Number (Optional)</FormLabel>
                  <FormControl>
                  <Input placeholder="e.g., The Old Rectory or 10" {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
              </FormItem>
              )}
          />
          <FormField
              control={control}
              name={`${namePrefix}.addressLine1`}
              render={({ field }) => (
              <FormItem>
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                  <Input placeholder="e.g., Downing Street" {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
              </FormItem>
              )}
          />
          <FormField
              control={control}
              name={`${namePrefix}.addressLine2`}
              render={({ field }) => (
              <FormItem>
                  <FormLabel>Address Line 2 (Optional)</FormLabel>
                  <FormControl>
                  <Input {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
              </FormItem>
              )}
          />
           <FormField
              control={control}
              name={`${namePrefix}.townCity`}
              render={({ field }) => (
              <FormItem>
                  <FormLabel>Town or City</FormLabel>
                  <FormControl>
                  <Input placeholder="e.g., London" {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
              </FormItem>
              )}
          />
          <FormField
              control={control}
              name={`${namePrefix}.county`}
              render={({ field }) => (
              <FormItem>
                  <FormLabel>County</FormLabel>
                  <FormControl>
                  <Input placeholder="e.g., Greater London" {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
              </FormItem>
              )}
          />
          <FormField
              control={control}
              name={`${namePrefix}.postcode`}
              render={({ field }) => (
              <FormItem>
                  <FormLabel>Postcode</FormLabel>
                  <FormControl>
                  <Input placeholder="e.g., SW1A 2AA" {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
              </FormItem>
              )}
          />
        </div>
      </div>
    </div>
  );
};
