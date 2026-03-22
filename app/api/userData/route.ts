//api/userData/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for server-side
);

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { message: 'Authorization token is missing or malformed.' },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);

  try {
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { message: 'Invalid authentication token.' },
        { status: 403 }
      );
    }

    const user_id = user.id;

    // Query all the required tables
    const [
      { data: doctors, error: doctorsError },
      { data: locations, error: locationsError },
      { data: staff, error: staffError },
      { data: topics, error: topicsError },
      { data: userData, error: usersError }
    ] = await Promise.all([
      supabase.from("doctors").select("*").eq("user_id", user_id),
      supabase.from("locations").select("*").eq("user_id", user_id),
      supabase.from("staff").select("*").eq("user_id", user_id),
      supabase.from("topics").select("*").eq("user_id", user_id),
      supabase.from("users").select("*").eq("id", user_id) // Assuming you want to filter by user id
    ]);

    // Check for any errors in the queries
    const errors = [];
    if (doctorsError) errors.push({ table: 'doctors', error: doctorsError.message });
    if (locationsError) errors.push({ table: 'locations', error: locationsError.message });
    if (staffError) errors.push({ table: 'staff', error: staffError.message });
    if (topicsError) errors.push({ table: 'topics', error: topicsError.message });
    if (usersError) errors.push({ table: 'users', error: usersError.message });

    // If there are any errors, log them but still return available data
    if (errors.length > 0) {
      console.warn('Some database queries failed:', errors);
    }

    return NextResponse.json(
      { 
        message: 'Data retrieved successfully!', 
        userId: user.id,
        email: user.email,
        data: {
          doctors: doctors || [],
          locations: locations || [],
          staff: staff || [],
          topics: topics || [],
          user: userData || []
        },
        errors: errors.length > 0 ? errors : null
      },
      { status: 200 }
    );

  } catch (err) {
    console.error('Authentication or database error:', err);
    return NextResponse.json(
      { message: 'An error occurred while fetching data.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  console.log('=== BACKEND POST DEBUG ===');
  
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
    const body: { topic_name?: string; topic_content?: string } = await request.json();
    console.log('Request body:', body);
    
    const { topic_name, topic_content } = body;
    console.log('Extracted fields:', { topic_name, topic_content });

    // Validate required fields
    if (!topic_name || !topic_content) {
      console.log('Validation failed: missing required fields');
      return NextResponse.json(
        { message: 'Both topic_name and topic_content are required.' },
        { status: 400 }
      );
    }

    // Insert the new topic
    console.log('Inserting topic into database...');
    const insertData = {
      user_id: user.id,
      topic_name: topic_name.trim(),
      topic_content: topic_content.trim()
    };
    console.log('Insert data:', insertData);

    const { data: newTopic, error: insertError } = await supabase
      .from('topics')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      console.error('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      return NextResponse.json(
        { 
          message: 'Failed to create topic.',
          error: insertError.message,
          code: insertError.code
        },
        { status: 500 }
      );
    }

    console.log('Topic created successfully:', newTopic);
    return NextResponse.json(
      {
        message: 'Topic created successfully!',
        topic: newTopic
      },
      { status: 201 }
    );

  } catch (err: unknown) {
    console.error('Unexpected error creating topic:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return NextResponse.json(
      { 
        message: 'An error occurred while creating the topic.',
        error: errorMessage
      },
      { status: 500 }
    );
  }
}