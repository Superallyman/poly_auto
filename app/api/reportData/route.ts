//this page will take a URL parameter called 'data' which is encrypted and will

// 1. decrypt the Parameter
// 2. convert the decrypted data back in to a json object
// 3. the json object will specify everything needed to fetch the data from the Database
// 4. respond with a specifically formatted JSON object that the client can use to display the data

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

    // Check if encryptedData is missing or not a string
    if (!encryptedData || typeof encryptedData !== "string") {
      return new NextResponse("Invalid or missing encryptedData", { status: 400 });
    }

    console.log("Received encrypted data:", encryptedData);

    // Decrypt the data (replace with actual decryption function in production)
    const decryptedLinkString = decrypt(encryptedData); // Actual decryption should be used here
    // const decryptedLinkString = encryptedData; // Bypass encrypt/decrypt by uncommenting this line decryption should be used here

    if (!decryptedLinkString) {
      console.error("Decryption failed for:", encryptedData);
      return new NextResponse("Decryption failed", { status: 500 });
    }

    console.log("Decrypted link string:", decryptedLinkString);

    const values = decryptedLinkString.split("_");

    if (values.length < 4) {
      console.error("Decrypted data format is invalid, insufficient values:", values);
      return new NextResponse("Decrypted data is in an invalid format", { status: 400 });
    }

    // Parse the decrypted values
    const parsedLinkData = {
      user: values[0], // First value is user (string)
      patientName: values[1] || null, // Second value is patient name (string, no parsing needed)
      examDate: values[2] || null, // Third value is examdate (string: yyyy-mm-dd)
      selectedLocation: parseInt(values[3]) || null, // Forth value is selectedLocation (number)
      selectedDoctor: parseInt(values[4]) || null, // Fifth value is selectedDoctor (number)
      selectedStaff: parseInt(values[5]) || null, // Sixth  value is selectedStaff (number)
      selectedTopics: values.slice(6).map(Number), // Remaining values are selectedTopics array (numbers)
    };

    console.log("parsedLinkData.selectedLocation", parsedLinkData.selectedLocation);

    // Validate parsed data (check for NaN values)
    if (parsedLinkData.selectedLocation === null || isNaN(parsedLinkData.selectedLocation)) {
      console.log("problem with selected location")
      return new NextResponse("Invalid Location in decrypted data", { status: 400 });
    }

    console.log("Parsed Link Data:", parsedLinkData);

    // Extract parameters for database queries
    const user_id = parsedLinkData.user;
    const patientName = parsedLinkData.patientName;
    const examDate = parsedLinkData.examDate;
    const selectedStaffId = parsedLinkData.selectedStaff;
    const selectedDoctorId = parsedLinkData.selectedDoctor;
    const selectedLocationId = parsedLinkData.selectedLocation;
    const topicIds = parsedLinkData.selectedTopics || [];

    //normalize the state when you get the data. If the state holds "null", convert it to null right away to avoid confusion later.

    const normalizedPatientName = patientName === "null" ? null : patientName;

    // Perform database queries
    const [{ data: doctor, error: doctorError }, { data: location, error: locationsError }, { data: selectedStaff, error: staffError }, { data: topics, error: topicsError }] = await Promise.all([
      selectedDoctorId ? supabase.from("doctors").select("*").eq("id", selectedDoctorId).eq("user_id", user_id).single() : Promise.resolve({ data: null, error: null }),
      selectedLocationId ? supabase.from("locations").select("*").eq("id", selectedLocationId).eq("user_id", user_id).single() : Promise.resolve({ data: null, error: null }),
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

    // If there are any errors, log them but still return available data
    if (errors.length > 0) {
      console.warn("Some database queries failed:", errors);
    }

    // Construct a message based on the availability of data
    let message = "Data retrieved successfully!";
    if (!doctor || !location || !selectedStaff) {
      message = "Some data is missing or unavailable.";
    }

    // Ensure that the topics are in the same order as the topicIds
    let orderedTopics = [];
    if (topics && topics.length > 0) {
      // Create a map of topic IDs to topic objects for easy lookup
      const topicsMap = new Map(topics.map((topic) => [topic.id, topic]));

      // Order topics based on the original topicIds array
      orderedTopics = topicIds.map((id) => topicsMap.get(id) || null);
    }

    // Construct the response object with all fetched data
    return NextResponse.json(
      {
        message: message,
        data: {
          patientName: normalizedPatientName,
          examDate: examDate,
          doctor: doctor ? { ...doctor, user_id: undefined } : null,
          location: location ? { ...location, user_id: undefined } : null,
          staff: selectedStaff ? { ...selectedStaff, user_id: undefined } : null,
          topics: orderedTopics || [],
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
