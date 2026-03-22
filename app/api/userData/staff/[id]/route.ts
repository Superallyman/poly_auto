import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define the Staff interface to include staff_role and is_archived, and allow null for staff_image
interface Staff {
  id: string | number;
  staff_name: string;
  staff_image: string | null; // Changed to allow null
  staff_contact: string;
  staff_role: string; // Added staff_role
  is_archived: boolean; // Added is_archived
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  console.log('=== BACKEND PUT STAFF DEBUG ===');
  
  // Await the params since they're now wrapped in a Promise
  const resolvedParams = await params;
  const staffId = resolvedParams.id;
  console.log('Staff ID to update:', staffId);
  
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
    // Use Partial<Staff> to allow for only some fields to be present in the update request
    const body: Partial<Staff> = await request.json();
    console.log('Request body:', body);

    const { 
      staff_name, 
      staff_image, 
      staff_contact,
      staff_role,    // Extracted new field
      is_archived    // Extracted new field
    } = body;

    console.log('Extracted fields:', { staff_name, staff_image, staff_contact, staff_role, is_archived });

    // Validation: At least one field should be present for a meaningful update
    if (staff_name === undefined && staff_image === undefined && staff_contact === undefined && staff_role === undefined && is_archived === undefined) {
      console.log('Validation failed: No fields provided for update.');
      return NextResponse.json(
        { message: 'At least one field (staff_name, staff_image, staff_contact, staff_role, or is_archived) is required for updating a staff member.' },
        { status: 400 }
      );
    }

    // First, verify that the staff member belongs to the authenticated user
    console.log('Verifying staff member ownership...');
    const { data: existingStaff, error: fetchError } = await supabase
      .from('staff') // Changed from 'doctors' to 'staff'
      .select('user_id, id')
      .eq('id', staffId)
      .single();

    if (fetchError) {
      console.error('Error fetching staff member:', fetchError);
      return NextResponse.json(
        { message: 'Staff member not found.' },
        { status: 404 }
      );
    }
    if (existingStaff.user_id !== user.id) {
      console.log('User does not own this staff member');
      return NextResponse.json(
        { message: 'You do not have permission to update this staff member.' },
        { status: 403 }
      );
    }
    console.log('Staff member ownership verified');

    // Prepare update data, ensuring trimming for string fields and handling null for empty image URL
    console.log('Preparing update data...');
    const updateData: Partial<Omit<Staff, 'id'>> = { // Use Omit to exclude 'id' from update
      ...(staff_name !== undefined && { staff_name: staff_name.trim() }),
      ...(staff_image !== undefined && { staff_image: staff_image?.trim() || null }), // Use null for empty image URL
      ...(staff_contact !== undefined && { staff_contact: staff_contact.trim() }),
      ...(staff_role !== undefined && { staff_role: staff_role.trim() }), // Include new field
      ...(is_archived !== undefined && { is_archived: is_archived }), // Include new field
    };
    
    // Filter out undefined values to only update fields that were actually sent in the request body
    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([, value]) => value !== undefined)
    );

    console.log('Update data:', filteredUpdateData);

    // Update the staff member
    console.log('Updating staff member in database...');
    const { data: updatedStaff, error: updateError } = await supabase
      .from('staff') // Changed from 'doctors' to 'staff'
      .update(filteredUpdateData)
      .eq('id', staffId)
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
          message: 'Failed to update staff member.',
          error: updateError.message,
          code: updateError.code
        },
        { status: 500 }
      );
    }

    console.log('Staff member updated successfully:', updatedStaff);
    return NextResponse.json(
      {
        message: 'Staff member updated successfully!',
        staff: updatedStaff
      },
      { status: 200 }
    );

  } catch (err: unknown) {
    console.error('Unexpected error updating staff member:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return NextResponse.json(
      { 
        message: 'An error occurred while updating the staff member.',
        error: errorMessage
      },
      { status: 500 }
    );
  }
}