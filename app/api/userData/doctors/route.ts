//api/userData/doctors/route.ts
// This file handles the POST request to create a new doctor in the database.
// It verifies the user's authentication token, validates the request body,
// and inserts a new doctor record into the Supabase database.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('=== BACKEND POST DOCTOR DEBUG ===');
  
  // Check for authorization header
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
    const body: {
      doctor_name?: string;
      doctor_role?: string;
      doctor_message?: string;
      doctor_image?: string;
      is_archived?: boolean;
    } = await request.json();
    
    console.log('Request body:', body);
    
    const { doctor_name, doctor_role, doctor_message, doctor_image, is_archived } = body;
    console.log('Extracted fields:', { doctor_name, doctor_role, doctor_message, doctor_image, is_archived });

    // Validate required fields
    if (!doctor_name || doctor_role === undefined || doctor_message === undefined) {
      console.log('Validation failed: missing required fields');
      return NextResponse.json(
        { message: 'doctor_name, doctor_role, and doctor_message are required.' },
        { status: 400 }
      );
    }

    // Prepare data for insertion
    console.log('Preparing data for insertion...');
    const insertData = {
      user_id: user.id,
      doctor_name: doctor_name.trim(),
      doctor_role: doctor_role.trim(),
      doctor_message: doctor_message.trim(),
      doctor_image: doctor_image?.trim() || null,
      is_archived: is_archived === true,
      created_at: new Date().toISOString(),
    };
    
    console.log('Insert data:', insertData);

    // Insert the new doctor
    console.log('Inserting doctor into database...');
    const { data: newDoctor, error: insertError } = await supabase
      .from('doctors')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Database insertion error:', insertError);
      console.error('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      return NextResponse.json(
        { 
          message: 'Failed to create doctor.',
          error: insertError.message,
          code: insertError.code
        },
        { status: 500 }
      );
    }

    console.log('Doctor created successfully:', newDoctor);
    
    return NextResponse.json(
      {
        message: 'Doctor created successfully!',
        doctor: newDoctor
      },
      { status: 201 }
    );

  } catch (err: unknown) {
    console.error('Unexpected error creating doctor:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return NextResponse.json(
      { 
        message: 'An error occurred while creating the doctor.',
        error: errorMessage
      },
      { status: 500 }
    );
  }
}