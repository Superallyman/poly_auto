import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id: doctorId } = await params;
  console.log("Doctor ID to update:", doctorId);

  const authHeader = request.headers.get("Authorization");
  console.log("Auth header present:", !!authHeader);
  console.log("Auth header preview:", authHeader ? authHeader.substring(0, 20) + "..." : "null");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Auth header missing or malformed");
    return NextResponse.json({ message: "Authorization token is missing or malformed." }, { status: 401 });
  }

  const token = authHeader.substring(7);
  console.log("Extracted token preview:", token.substring(0, 20) + "...");

  try {
    // Verify the token with Supabase
    console.log("Verifying token with Supabase...");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError) {
      console.log("Supabase auth error:", userError);
      return NextResponse.json({ message: "Invalid authentication token." }, { status: 403 });
    }

    if (!user) {
      console.log("No user returned from Supabase");
      return NextResponse.json({ message: "Invalid authentication token." }, { status: 403 });
    }

    console.log("User authenticated:", user.id, user.email);

    // Parse the request body
    console.log("Parsing request body...");
    const body: {
      doctor_name?: string;
      doctor_role?: string;
      doctor_message?: string;
      doctor_image?: string;
      is_archived?: boolean;
    } = await request.json();
    console.log("Request body:", body);

    const { doctor_name, doctor_role, doctor_message, doctor_image, is_archived } = body;
    console.log("Extracted fields:", { doctor_name, doctor_role, doctor_message, doctor_image, is_archived });

    // Validate required fields
    if (!doctor_name || doctor_role === undefined || doctor_message === undefined) {
      console.log("Validation failed: missing required fields");
      return NextResponse.json({ message: "doctor_name, doctor_role, and doctor_message are required." }, { status: 400 });
    }

    // First, verify that the doctor belongs to the authenticated user
    console.log("Verifying doctor ownership...");
    const { data: existingDoctor, error: fetchError } = await supabase.from("doctors").select("user_id, id").eq("id", doctorId).single();

    if (fetchError) {
      console.error("Error fetching doctor:", fetchError);
      return NextResponse.json({ message: "Doctor not found." }, { status: 404 });
    }

    if (existingDoctor.user_id !== user.id) {
      console.log("User does not own this doctor");
      return NextResponse.json({ message: "You do not have permission to update this doctor." }, { status: 403 });
    }

    console.log("Doctor ownership verified");

    // Update the doctor
    console.log("Updating doctor in database...");
    const updateData = {
      doctor_name: doctor_name.trim(),
      doctor_role: doctor_role.trim(),
      doctor_message: doctor_message.trim(),
      doctor_image: doctor_image?.trim() || null,
      is_archived: is_archived === true,
    };
    console.log("Update data:", updateData);

    const { data: updatedDoctor, error: updateError } = await supabase
      .from("doctors")
      .update(updateData)
      .eq("id", doctorId)
      .eq("user_id", user.id) // Double-check user ownership
      .select()
      .single();

    if (updateError) {
      console.error("Database update error:", updateError);
      console.error("Error details:", {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      });
      return NextResponse.json(
        {
          message: "Failed to update doctor.",
          error: updateError.message,
          code: updateError.code,
        },
        { status: 500 }
      );
    }

    console.log("Doctor updated successfully:", updatedDoctor);

    return NextResponse.json(
      {
        message: "Doctor updated successfully!",
        doctor: updatedDoctor,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("Unexpected error updating doctor:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json(
      {
        message: "An error occurred while updating the doctor.",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
