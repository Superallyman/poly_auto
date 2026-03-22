// api/viewEducation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/utils/encryption"; // Import the utility function
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for server-side
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // Parse the JSON body from the request
    const { encryptedData } = body; // Extract the encryptedData

    if (!encryptedData || typeof encryptedData !== "string") {
      return new NextResponse("Invalid or missing encryptedData", { status: 400 });
    }

    console.log("Received encrypted data:", encryptedData);

    // Use the decrypt utility function directly
    const decryptedLinkString = decrypt(encryptedData); // Store as string initially

    if (decryptedLinkString === null) {
      console.error("Decryption failed for:", encryptedData);
      return new NextResponse("Decryption failed", { status: 500 });
    }

    let decryptedLink: { user?: string; selectedDoctor?: string; selectedScribe?: string; selectedStaff?: string[], selectedTopics?: string[] };

    try {
      decryptedLink = JSON.parse(decryptedLinkString);
      // Basic validation for the expected structure
      if (typeof decryptedLink !== "object" || decryptedLink === null || !decryptedLink.user) {
        console.error("Decrypted data is not in expected format or missing user ID:", decryptedLink);
        return new NextResponse("Invalid decrypted data format", { status: 400 });
      }
    } catch (parseError) {
      console.error("Failed to parse decrypted data as JSON:", parseError);
      return new NextResponse("Invalid JSON format in decrypted data", { status: 400 });
    }

    console.log("Decrypted link object:", JSON.stringify(decryptedLink, null, 2));

    // Extract the user ID directly from the decrypted object
    const user_id = decryptedLink.user; // This is the user ID you want to use!
    const selectedStaffId = decryptedLink.selectedScribe; // Assuming this is also in the payload
    const selectedDoctorId = decryptedLink.selectedDoctor; // Assuming this is also in the payload

    console.log("ALLLLY PAY ATTENTION HERE");
    console.log(selectedStaffId);
    const topicIds = decryptedLink.selectedTopics || []; // Assuming an array of topic IDs

    // --- REMOVE THE TOKEN VERIFICATION PART ---
    // You are not using a token for authentication in this flow.
    // The user ID is coming from the encrypted payload, implying trust
    // in the encryption process itself to authenticate the request's origin.
    // const { data: { user }, error } = await supabase.auth.getUser(token);
    // if (error || !user) { ... }
    // --- END REMOVAL ---

    // Query all the required tables using the extracted user_id
    const [
      { data: doctor, error: doctorError },
      { data: locations, error: locationsError },
      { data: selectedStaff, error: staffError },
      { data: topics, error: topicsError },
      // { data: userData, error: usersError },
    ] = await Promise.all([
      selectedDoctorId ? supabase.from("doctors").select("*").eq("id", selectedDoctorId).eq("user_id", user_id).single() : Promise.resolve({ data: null, error: null }),

      supabase.from("locations").select("*").eq("user_id", user_id),

      selectedStaffId ? supabase.from("staff").select("*").eq("id", selectedStaffId).eq("user_id", user_id).single() : Promise.resolve({ data: null, error: null }),

      topicIds.length > 0 ? supabase.from("topics").select("*").in("id", topicIds).eq("user_id", user_id) : Promise.resolve({ data: [], error: null }),

      supabase.from("users").select("*").eq("id", user_id).single(),
    ]);
    // Check for any errors in the queries
    const errors = [];
    if (doctorError) errors.push({ table: "doctors", error: doctorError.message });
    if (locationsError) errors.push({ table: "locations", error: locationsError.message });
    if (staffError) errors.push({ table: "staff", error: staffError.message });
    if (topicsError) errors.push({ table: "topics", error: topicsError.message });
    // if (usersError) errors.push({ table: "users", error: usersError.message });

    // If there are any errors, log them but still return available data
    if (errors.length > 0) {
      console.warn("Some database queries failed:", errors);
    }

    // Construct the response object with all fetched data
    return NextResponse.json(
      {
        message: "Data retrieved successfully!",
        data: {
          doctor: doctor ? { ...doctor, user_id: undefined } : null,
          locations: locations ? locations.map((location) => ({ ...location, user_id: undefined })) : [],
          staff: selectedStaff ? { ...selectedStaff, user_id: undefined } : null,
          topics: topics || [],
        },
        errors: errors.length > 0 ? errors : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing API request:", error);
    // Be careful not to expose sensitive error details in production
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
