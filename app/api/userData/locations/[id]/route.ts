import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define the Location interface to match your frontend component
interface Location {
  id: string | number;
  location_name: string;
  location_address: string;
  location_phone: string;
  location_header: string;
  location_footer: string;
  setting_toggle_location_address: boolean;
  setting_toggle_location_phone: boolean;
  setting_toggle_location_header: boolean;
  setting_toggle_location_doctor: boolean;
  setting_toggle_location_doctor_image: boolean;
  setting_toggle_location_doctor_bio: boolean;
  setting_toggle_staff: boolean;
  setting_location_toggle_staff_image: boolean;
  setting_location_toggle_staff_contact: boolean;
  setting_location_toggle_location_footer: boolean;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  console.log('=== BACKEND PUT LOCATION DEBUG ===');
  
  // Await the params since they're now wrapped in a Promise
  const resolvedParams = await params;
  const locationId = resolvedParams.id;
  console.log('Location ID to update:', locationId);
  
  const authHeader = request.headers.get('Authorization');
  console.log('Auth header present:', !!authHeader);
  console.log('Auth header preview:', authHeader ? authHeader.substring(0, 20) + '...' : 'null');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Auth header missing or malformed');
    return NextResponse.json(
      { message: 'Authorization token is missing or malformed.' },
      { status: 401 }
    );
  }
  const token = authHeader.substring(7);
  console.log('Extracted token preview:', token.substring(0, 20) + '...');

  try {
    // Verify the token with Supabase
    console.log('Verifying token with Supabase...');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError) {
      console.log('Supabase auth error:', userError);
      return NextResponse.json(
        { message: 'Invalid authentication token.' },
        { status: 403 }
      );
    }
    if (!user) {
      console.log('No user returned from Supabase');
      return NextResponse.json(
        { message: 'Invalid authentication token.' },
        { status: 403 }
      );
    }
    console.log('User authenticated:', user.id, user.email);

    // Parse the request body
    console.log('Parsing request body...');
    // Use Partial<Location> to allow for only some fields to be present in the update request
    const body: Partial<Location> = await request.json();
    console.log('Request body:', body);

    const { 
      location_name, 
      location_address, 
      location_phone, 
      location_header, 
      location_footer,
      setting_toggle_location_address,
      setting_toggle_location_phone,
      setting_toggle_location_header,
      setting_toggle_location_doctor,
      setting_toggle_location_doctor_image,
      setting_toggle_location_doctor_bio,
      setting_toggle_staff,
      setting_location_toggle_staff_image,
      setting_location_toggle_staff_contact,
      setting_location_toggle_location_footer,
    } = body;

    console.log('Extracted fields:', { 
      location_name, 
      location_address, 
      location_phone, 
      location_header, 
      location_footer,
      setting_toggle_location_address,
      setting_toggle_location_phone,
      setting_toggle_location_header,
      setting_toggle_location_doctor,
      setting_toggle_location_doctor_image,
      setting_toggle_location_doctor_bio,
      setting_toggle_staff,
      setting_location_toggle_staff_image,
      setting_location_toggle_staff_contact,
      setting_location_toggle_location_footer,
    });

    // Validate required fields (at least location_name is required for a meaningful update)
    if (location_name === undefined) { // Check for undefined, allowing empty string if desired
      console.log('Validation failed: location_name is required.');
      return NextResponse.json(
        { message: 'location_name is required for updating a location.' },
        { status: 400 }
      );
    }

    // First, verify that the location belongs to the authenticated user
    console.log('Verifying location ownership...');
    const { data: existingLocation, error: fetchError } = await supabase
      .from('locations') // Changed from 'doctors' to 'locations'
      .select('user_id, id')
      .eq('id', locationId)
      .single();

    if (fetchError) {
      console.error('Error fetching location:', fetchError);
      return NextResponse.json(
        { message: 'Location not found.' },
        { status: 404 }
      );
    }
    if (existingLocation.user_id !== user.id) {
      console.log('User does not own this location');
      return NextResponse.json(
        { message: 'You do not have permission to update this location.' },
        { status: 403 }
      );
    }
    console.log('Location ownership verified');

    // Prepare update data, ensuring trimming for string fields and proper boolean handling
    console.log('Preparing update data...');
    const updateData: Partial<Omit<Location, 'id'>> = { // Use Omit to exclude 'id' from update
      location_name: location_name?.trim(),
      location_address: location_address?.trim(),
      location_phone: location_phone?.trim(),
      location_header: location_header?.trim(),
      location_footer: location_footer?.trim(),
      setting_toggle_location_address: setting_toggle_location_address,
      setting_toggle_location_phone: setting_toggle_location_phone,
      setting_toggle_location_header: setting_toggle_location_header,
      setting_toggle_location_doctor: setting_toggle_location_doctor,
      setting_toggle_location_doctor_image: setting_toggle_location_doctor_image,
      setting_toggle_location_doctor_bio: setting_toggle_location_doctor_bio,
      setting_toggle_staff: setting_toggle_staff,
      setting_location_toggle_staff_image: setting_location_toggle_staff_image,
      setting_location_toggle_staff_contact: setting_location_toggle_staff_contact,
      setting_location_toggle_location_footer: setting_location_toggle_location_footer,
    };

    // Filter out undefined values to only update fields that were actually sent in the request body
    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([, value]) => value !== undefined)
    );

    console.log('Update data:', filteredUpdateData);

    // Update the location
    console.log('Updating location in database...');
    const { data: updatedLocation, error: updateError } = await supabase
      .from('locations') // Changed from 'doctors' to 'locations'
      .update(filteredUpdateData)
      .eq('id', locationId)
      .eq('user_id', user.id) // Double-check user ownership
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      console.error('Error details:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      });
      return NextResponse.json(
        { 
          message: 'Failed to update location.',
          error: updateError.message,
          code: updateError.code
        },
        { status: 500 }
      );
    }

    console.log('Location updated successfully:', updatedLocation);
    return NextResponse.json(
      {
        message: 'Location updated successfully!',
        location: updatedLocation
      },
      { status: 200 }
    );

  } catch (err: unknown) {
    console.error('Unexpected error updating location:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return NextResponse.json(
      { 
        message: 'An error occurred while updating the location.',
        error: errorMessage
      },
      { status: 500 }
    );
  }
}