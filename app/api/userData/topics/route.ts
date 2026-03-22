// api/userData/topics/route.ts
// This file handles CRUD operations for topics
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to verify authentication
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Authorization token is missing or malformed.", status: 401 };
  }

  const token = authHeader.substring(7);

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { error: "Invalid authentication token.", status: 403 };
    }

    return { user, error: null };
  } catch (err) {
    console.error("Auth verification error:", err);
    return { error: "Authentication error occurred.", status: 500 };
  }
}

// PUT - Update topic (for editing or archiving/unarchiving)
export async function PUT(request: NextRequest): Promise<NextResponse> {
  console.log("=== BACKEND PUT TOPIC DEBUG ===");

  // Verify authentication
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }
  const user = authResult.user!;

  try {
    // Parse the request body
    const body: {
      topic_id?: number;
      topic_name?: string;
      topic_content?: string;
      is_archived?: boolean;
    } = await request.json();

    console.log("Request body:", body);

    const { topic_id, topic_name, topic_content, is_archived } = body;

    // Validate required fields
    if (!topic_id) {
      return NextResponse.json({ message: "topic_id is required." }, { status: 400 });
    }

    // Prepare update data
    const updateData: {
      updated_at: string;
      topic_name?: string;
      topic_content?: string;
      is_archived?: boolean;
    } = {
      updated_at: new Date().toISOString(),
    };

    // Add fields that are being updated
    if (topic_name !== undefined) {
      updateData.topic_name = topic_name.trim();
    }
    if (topic_content !== undefined) {
      updateData.topic_content = topic_content.trim();
    }
    if (is_archived !== undefined) {
      updateData.is_archived = is_archived;
    }

    console.log("Update data:", updateData);

    // Update the topic
    const { data: updatedTopic, error: updateError } = await supabase
      .from("topics")
      .update(updateData)
      .eq("topic_id", topic_id)
      .eq("user_id", user.id) // Ensure user owns the topic
      .select()
      .single();

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        {
          message: "Failed to update topic.",
          error: updateError.message,
        },
        { status: 500 }
      );
    }

    console.log("Topic updated successfully:", updatedTopic);

    return NextResponse.json(
      {
        message: "Topic updated successfully!",
        topic: updatedTopic,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("Unexpected error updating topic:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json(
      {
        message: "An error occurred while updating the topic.",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete topic
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  console.log("=== BACKEND DELETE TOPIC DEBUG ===");

  // Verify authentication
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }
  const user = authResult.user!;

  try {
    // Parse the request body
    const body: { topic_id?: number } = await request.json();
    console.log("Request body:", body);

    const { topic_id } = body;

    // Validate required fields
    if (!topic_id) {
      return NextResponse.json({ message: "topic_id is required." }, { status: 400 });
    }

    // Delete the topic
    const { data: deletedTopic, error: deleteError } = await supabase
      .from("topics")
      .delete()
      .eq("topic_id", topic_id)
      .eq("user_id", user.id) // Ensure user owns the topic
      .select()
      .single();

    if (deleteError) {
      console.error("Database delete error:", deleteError);
      return NextResponse.json(
        {
          message: "Failed to delete topic.",
          error: deleteError.message,
        },
        { status: 500 }
      );
    }

    console.log("Topic deleted successfully:", deletedTopic);

    return NextResponse.json(
      {
        message: "Topic deleted successfully!",
        topic: deletedTopic,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("Unexpected error deleting topic:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json(
      {
        message: "An error occurred while deleting the topic.",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}