
import { NextRequest, NextResponse } from 'next/server';

// Define the structure of an address from the getaddress.io API
interface GetAddressIOResult {
  line_1: string;
  line_2: string;
  line_3: string;
  line_4: string;
  locality: string;
  town_or_city: string;
  county: string;
  latitude: number;
  longitude: number;
}

export async function POST(req: NextRequest) {
  try {
    const { postcode } = await req.json();
    if (!postcode) {
      return NextResponse.json({ error: 'Postcode is required' }, { status: 400 });
    }

    const apiKey = process.env.GETADDRESS_IO_API_KEY;
    if (!apiKey) {
      console.error('getaddress.io API key is not configured');
      return NextResponse.json({ error: 'Address lookup service is not configured.' }, { status: 500 });
    }

    // URL encode the postcode and construct the API URL
    const apiUrl = `https://api.getaddress.io/find/${encodeURIComponent(postcode)}?api-key=${apiKey}&expand=true`;

    const getAddressResponse = await fetch(apiUrl);
    const getAddressData = await getAddressResponse.json();
    
    if (!getAddressResponse.ok) {
        console.error('getaddress.io API Error:', getAddressData);
        const errorMessage = getAddressData.Message || 'Failed to fetch addresses for the provided postcode.';
        return NextResponse.json({ error: errorMessage }, { status: getAddressResponse.status });
    }

    // Format the response to be used by the frontend
    const addresses = getAddressData.addresses.map((addr: GetAddressIOResult, index: number) => {
      // The API returns a formatted string like "1, High Street, Village, Town, County"
      // We will parse this to populate our form fields.
      const parts = [addr.line_1, addr.line_2, addr.line_3, addr.line_4, addr.locality, addr.town_or_city, addr.county].filter(Boolean);
      
      return {
        id: `${postcode}-${index}`, // Create a unique ID for the select list
        display: parts.join(', '), // A user-friendly display string
        address: {
          line_1: addr.line_1 || '',
          line_2: addr.line_2 || '',
          line_3: addr.line_3 || '',
          locality: addr.locality || '',
          town_or_city: addr.town_or_city || '',
          county: addr.county || '',
          postcode: postcode.toUpperCase(),
          latitude: getAddressData.latitude,
          longitude: getAddressData.longitude,
        }
      };
    });

    return NextResponse.json(addresses);

  } catch (error) {
    console.error('Postcode lookup error:', error);
    return NextResponse.json({ error: 'An unexpected server error occurred during address lookup.' }, { status: 500 });
  }
}
